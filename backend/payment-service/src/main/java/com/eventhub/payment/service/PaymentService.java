package com.eventhub.payment.service;

import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.ResourceNotFoundException;
import com.eventhub.payment.client.BookingServiceClient;
import com.eventhub.payment.dto.*;
import com.eventhub.payment.entity.PaymentTransaction;
import com.eventhub.payment.enums.PaymentMethod;
import com.eventhub.payment.enums.PaymentTransactionStatus;
import com.eventhub.payment.mapper.PaymentMapper;
import com.eventhub.payment.messaging.PaymentEventPublisher;
import com.eventhub.payment.repository.PaymentTransactionRepository;
import com.eventhub.payment.security.CustomUserPrincipal;
import feign.FeignException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PaymentService {
    private final PaymentTransactionRepository repository;
    private final BookingServiceClient bookingServiceClient;
    private final PaymentMapper mapper;
    private final PaymentEventPublisher eventPublisher;

    public PaymentService(
            PaymentTransactionRepository repository,
            BookingServiceClient bookingServiceClient,
            PaymentMapper mapper,
            PaymentEventPublisher eventPublisher
    ) {
        this.repository = repository;
        this.bookingServiceClient = bookingServiceClient;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public PaymentResponse create(CreatePaymentRequest request, CustomUserPrincipal principal) {
        InternalBookingResponse booking = fetchBooking(request.bookingId());
        requireBookingOwnerOrAdmin(booking, principal);
        validateBookingCanBePaid(booking);
        if (repository.existsByBookingIdAndStatus(booking.id(), PaymentTransactionStatus.SUCCESS)) {
            throw new BadRequestException("Booking already has a successful payment");
        }
        if (repository.existsByBookingIdAndStatus(booking.id(), PaymentTransactionStatus.PENDING)) {
            throw new BadRequestException("Booking already has a pending payment");
        }

        PaymentMethod method = request.method() == null ? PaymentMethod.MOCK : request.method();
        LocalDateTime paidAt = LocalDateTime.now();
        PaymentTransaction payment = repository.save(PaymentTransaction.builder()
                .bookingId(booking.id())
                .bookingCode(booking.bookingCode())
                .userId(booking.userId())
                .amount(booking.totalPrice())
                .method(method)
                .status(PaymentTransactionStatus.SUCCESS)
                .provider("DEMO_INFINITE_FUNDS")
                .providerTransactionId("DEMO-TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase())
                .paidAt(paidAt)
                .build());
        updateBookingPaymentStatus(payment, "PAID");
        eventPublisher.publishPaymentSucceeded(payment, principal);
        return mapper.toResponse(payment);
    }

    public PaymentResponse findById(Long id, CustomUserPrincipal principal) {
        PaymentTransaction payment = getPayment(id);
        requirePaymentOwnerOrAdmin(payment, principal);
        return mapper.toResponse(payment);
    }

    public PaymentResponse findByPaymentCode(String paymentCode, CustomUserPrincipal principal) {
        PaymentTransaction payment = repository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        requirePaymentOwnerOrAdmin(payment, principal);
        return mapper.toResponse(payment);
    }

    public PaymentPageResponse findMine(int page, int size, PaymentTransactionStatus status, CustomUserPrincipal principal) {
        Pageable pageable = pageable(page, size);
        Page<PaymentTransaction> payments = status == null
                ? repository.findByUserId(principal.userId(), pageable)
                : repository.findByUserIdAndStatus(principal.userId(), status, pageable);
        return toPageResponse(payments);
    }

    public PaymentPageResponse findByBookingId(Long bookingId, int page, int size, CustomUserPrincipal principal) {
        InternalBookingResponse booking = fetchBooking(bookingId);
        requireBookingOwnerOrAdmin(booking, principal);
        return toPageResponse(repository.findByBookingId(bookingId, pageable(page, size)));
    }

    @Transactional
    public PaymentResponse mockSuccess(Long id, CustomUserPrincipal principal) {
        PaymentTransaction payment = getPayment(id);
        requirePaymentOwnerOrAdmin(payment, principal);
        requirePending(payment);

        payment.setStatus(PaymentTransactionStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        payment.setProviderTransactionId("MOCK-TXN-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase());
        PaymentTransaction saved = repository.save(payment);
        updateBookingPaymentStatus(saved, "PAID");
        eventPublisher.publishPaymentSucceeded(saved, principal);
        return mapper.toResponse(saved);
    }

    @Transactional
    public PaymentResponse mockFail(Long id, MockPaymentResultRequest request, CustomUserPrincipal principal) {
        PaymentTransaction payment = getPayment(id);
        requirePaymentOwnerOrAdmin(payment, principal);
        requirePending(payment);

        payment.setStatus(PaymentTransactionStatus.FAILED);
        payment.setFailedAt(LocalDateTime.now());
        payment.setFailureReason(request.failureReason());
        PaymentTransaction saved = repository.save(payment);
        updateBookingPaymentStatus(saved, "FAILED");
        eventPublisher.publishPaymentFailed(saved, principal);
        return mapper.toResponse(saved);
    }

    @Transactional
    public PaymentResponse cancel(Long id, CustomUserPrincipal principal) {
        PaymentTransaction payment = getPayment(id);
        requirePaymentOwnerOrAdmin(payment, principal);
        requirePending(payment);
        payment.setStatus(PaymentTransactionStatus.CANCELLED);
        return mapper.toResponse(repository.save(payment));
    }

    private PaymentTransaction getPayment(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    }

    private InternalBookingResponse fetchBooking(Long bookingId) {
        try {
            BookingApiResponse<InternalBookingResponse> response = bookingServiceClient.getInternalBooking(bookingId);
            if (response == null || response.data() == null) {
                throw new ResourceNotFoundException("Booking not found");
            }
            return response.data();
        } catch (FeignException.NotFound ex) {
            throw new ResourceNotFoundException("Booking not found");
        } catch (FeignException ex) {
            throw toBadRequest(ex, "Booking service request failed");
        }
    }

    private void updateBookingPaymentStatus(PaymentTransaction payment, String paymentStatus) {
        try {
            bookingServiceClient.updatePaymentStatus(
                    payment.getBookingId(),
                    new UpdateBookingPaymentStatusRequest(paymentStatus, payment.getPaymentCode())
            );
        } catch (FeignException ex) {
            throw toBadRequest(ex, "Failed to update booking payment status");
        }
    }

    private void validateBookingCanBePaid(InternalBookingResponse booking) {
        if (!"CONFIRMED".equals(booking.status())) {
            throw new BadRequestException("Only confirmed bookings can be paid");
        }
        if (!"UNPAID".equals(booking.paymentStatus()) && !"FAILED".equals(booking.paymentStatus())) {
            throw new BadRequestException("Only unpaid or failed bookings can create payment");
        }
        if (booking.totalPrice() == null || booking.totalPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero");
        }
    }

    private void requirePending(PaymentTransaction payment) {
        if (payment.getStatus() != PaymentTransactionStatus.PENDING) {
            throw new BadRequestException("Only pending payments can be updated");
        }
    }

    private void requirePaymentOwnerOrAdmin(PaymentTransaction payment, CustomUserPrincipal principal) {
        if (!principal.isAdmin() && !payment.getUserId().equals(principal.userId())) {
            throw new AccessDeniedException("User can only access own payment");
        }
    }

    private void requireBookingOwnerOrAdmin(InternalBookingResponse booking, CustomUserPrincipal principal) {
        if (!principal.isAdmin() && !booking.userId().equals(principal.userId())) {
            throw new AccessDeniedException("User can only access own booking payment");
        }
    }

    private Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
    }

    private PaymentPageResponse toPageResponse(Page<PaymentTransaction> page) {
        return new PaymentPageResponse(
                page.getContent().stream().map(mapper::toResponse).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    private BadRequestException toBadRequest(FeignException ex, String fallback) {
        String message = ex.contentUTF8();
        if (message == null || message.isBlank()) {
            message = ex.getMessage();
        }
        if (message == null || message.isBlank()) {
            message = fallback + " with status " + ex.status();
        }
        return new BadRequestException(message);
    }
}
