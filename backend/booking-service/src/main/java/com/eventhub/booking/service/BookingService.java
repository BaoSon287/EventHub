package com.eventhub.booking.service;

import com.eventhub.booking.client.EventServiceClient;
import com.eventhub.booking.dto.BookingPageResponse;
import com.eventhub.booking.dto.BookingResponse;
import com.eventhub.booking.dto.CreateBookingRequest;
import com.eventhub.booking.dto.EventApiResponse;
import com.eventhub.booking.dto.InternalEventResponse;
import com.eventhub.booking.dto.InternalBookingResponse;
import com.eventhub.booking.dto.TicketQuantityRequest;
import com.eventhub.booking.dto.UpdateBookingPaymentStatusRequest;
import com.eventhub.booking.entity.Booking;
import com.eventhub.booking.enums.BookingStatus;
import com.eventhub.booking.enums.PaymentStatus;
import com.eventhub.booking.mapper.BookingMapper;
import com.eventhub.booking.messaging.BookingEventPublisher;
import com.eventhub.booking.repository.BookingRepository;
import com.eventhub.booking.security.CustomUserPrincipal;
import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.ForbiddenException;
import com.eventhub.common.exception.ResourceNotFoundException;
import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class BookingService {
    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository repository;
    private final EventServiceClient eventServiceClient;
    private final BookingMapper mapper;
    private final BookingEventPublisher eventPublisher;

    public BookingService(
            BookingRepository repository,
            EventServiceClient eventServiceClient,
            BookingMapper mapper,
            BookingEventPublisher eventPublisher
    ) {
        this.repository = repository;
        this.eventServiceClient = eventServiceClient;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public BookingResponse create(CreateBookingRequest request, CustomUserPrincipal principal) {
        validateQuantity(request.quantity());
        InternalEventResponse event = fetchEvent(request.eventId());
        validateBookable(event, request.quantity());
        reserveTickets(request.eventId(), request.quantity());

        Booking booking;
        try {
            booking = repository.saveAndFlush(Booking.builder()
                    .userId(principal.userId())
                    .eventId(request.eventId())
                    .eventTitle(event.title())
                    .quantity(request.quantity())
                    .ticketPrice(event.price())
                    .totalPrice(event.price().multiply(BigDecimal.valueOf(request.quantity())))
                    .status(BookingStatus.CONFIRMED)
                    .paymentStatus(PaymentStatus.UNPAID)
                    .build());
        } catch (RuntimeException ex) {
            compensateReleaseAfterCreateFailure(request.eventId(), request.quantity(), ex);
            throw ex;
        }
        eventPublisher.publishBookingCreated(booking, principal);
        return mapper.toResponse(booking);
    }

    public BookingResponse findById(Long id, CustomUserPrincipal principal) {
        Booking booking = getBooking(id);
        requireOwnerOrAdmin(booking, principal);
        return mapper.toResponse(booking);
    }

    public BookingPageResponse findMine(int page, int size, BookingStatus status, CustomUserPrincipal principal) {
        return findByUserId(principal.userId(), page, size, status, principal);
    }

    public BookingPageResponse findByUserId(Long userId, int page, int size, BookingStatus status, CustomUserPrincipal principal) {
        if (!principal.isAdmin() && !principal.userId().equals(userId)) {
            throw new AccessDeniedException("User can only view own bookings");
        }
        Pageable pageable = pageable(page, size);
        Page<Booking> bookings = status == null
                ? repository.findByUserId(userId, pageable)
                : repository.findByUserIdAndStatus(userId, status, pageable);
        return toPageResponse(bookings);
    }

    public BookingPageResponse findByEventId(Long eventId, int page, int size, BookingStatus status, CustomUserPrincipal principal) {
        InternalEventResponse event = fetchEvent(eventId);
        if (!principal.isAdmin()) {
            if (!principal.isOrganizer() || !event.organizerId().equals(principal.userId())) {
                throw new AccessDeniedException("Only event organizer or ADMIN can view event bookings");
            }
        }
        Pageable pageable = pageable(page, size);
        Page<Booking> bookings = status == null
                ? repository.findByEventId(eventId, pageable)
                : repository.findByEventIdAndStatus(eventId, status, pageable);
        return toPageResponse(bookings);
    }

    @Transactional
    public BookingResponse cancel(Long id, CustomUserPrincipal principal) {
        Booking booking = getBooking(id);
        requireOwnerOrAdmin(booking, principal);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }

        releaseTickets(booking.getEventId(), booking.getQuantity());
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            booking.setPaymentStatus(PaymentStatus.REFUNDED);
        }
        Booking saved = repository.save(booking);
        eventPublisher.publishBookingCancelled(saved, principal);
        return mapper.toResponse(saved);
    }

    @Transactional
    public BookingResponse payMock(Long id, CustomUserPrincipal principal) {
        Booking booking = getBooking(id);
        requireOwnerOrAdmin(booking, principal);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cancelled booking cannot be paid");
        }
        booking.setPaymentStatus(PaymentStatus.PAID);
        return mapper.toResponse(repository.save(booking));
    }

    public InternalBookingResponse findInternalBooking(Long id) {
        return toInternalResponse(getBooking(id));
    }

    @Transactional
    public InternalBookingResponse updatePaymentStatus(Long id, UpdateBookingPaymentStatusRequest request) {
        Booking booking = getBooking(id);
        PaymentStatus target = request.paymentStatus();
        PaymentStatus current = booking.getPaymentStatus();

        if (booking.getStatus() == BookingStatus.CANCELLED && target == PaymentStatus.PAID) {
            throw new BadRequestException("Cancelled booking cannot be marked as paid");
        }
        if (current == PaymentStatus.PAID && target == PaymentStatus.PAID) {
            throw new BadRequestException("Booking is already paid");
        }
        if (current == PaymentStatus.PAID && target == PaymentStatus.UNPAID) {
            throw new BadRequestException("Paid booking cannot be reverted to unpaid");
        }
        if (!isAllowedPaymentTransition(current, target)) {
            throw new BadRequestException("Payment status transition is not allowed");
        }

        booking.setPaymentStatus(target);
        return toInternalResponse(repository.save(booking));
    }

    private Booking getBooking(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }

    private boolean isAllowedPaymentTransition(PaymentStatus current, PaymentStatus target) {
        return (current == PaymentStatus.UNPAID && (target == PaymentStatus.PAID || target == PaymentStatus.FAILED))
                || (current == PaymentStatus.FAILED && (target == PaymentStatus.PAID || target == PaymentStatus.FAILED));
    }

    private InternalBookingResponse toInternalResponse(Booking booking) {
        return new InternalBookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getUserId(),
                booking.getEventId(),
                booking.getEventTitle(),
                booking.getQuantity(),
                booking.getTotalPrice(),
                booking.getStatus(),
                booking.getPaymentStatus()
        );
    }

    private InternalEventResponse fetchEvent(Long eventId) {
        try {
            EventApiResponse<InternalEventResponse> response = eventServiceClient.getInternalEvent(eventId);
            if (response == null || response.data() == null) {
                throw new ResourceNotFoundException("EVENT_NOT_FOUND: Event not found");
            }
            return response.data();
        } catch (FeignException.NotFound ex) {
            throw new ResourceNotFoundException("EVENT_NOT_FOUND: Event not found");
        } catch (FeignException ex) {
            throw mapEventServiceException(ex);
        }
    }

    private void reserveTickets(Long eventId, int quantity) {
        try {
            eventServiceClient.reserveTickets(eventId, new TicketQuantityRequest(quantity));
        } catch (FeignException ex) {
            throw mapEventServiceException(ex);
        }
    }

    private void releaseTickets(Long eventId, int quantity) {
        try {
            eventServiceClient.releaseTickets(eventId, new TicketQuantityRequest(quantity));
        } catch (FeignException ex) {
            throw mapEventServiceException(ex);
        }
    }

    private void validateBookable(InternalEventResponse event, int quantity) {
        validateQuantity(quantity);
        if ("CANCELLED".equals(event.status())) {
            throw new BadRequestException("EVENT_CANCELLED: Cancelled events cannot be booked");
        }
        if ("COMPLETED".equals(event.status())) {
            throw new BadRequestException("EVENT_COMPLETED: Completed events cannot be booked");
        }
        if (!"PUBLISHED".equals(event.status())) {
            throw new BadRequestException("EVENT_NOT_BOOKABLE: Only published events can be booked");
        }
        if (event.endTime() != null && !event.endTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("EVENT_COMPLETED: Completed events cannot be booked");
        }
        if (event.startTime() != null && !event.startTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("EVENT_ALREADY_STARTED: Event has already started");
        }
        if (event.availableTickets() == null) {
            throw new BadRequestException("EVENT_NOT_BOOKABLE: Event ticket inventory is invalid");
        }
        if (event.availableTickets() < quantity) {
            throw new BadRequestException("INSUFFICIENT_TICKETS: Not enough tickets available");
        }
    }

    private void validateQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BadRequestException("INVALID_TICKET_QUANTITY: quantity must be greater than 0");
        }
    }

    private void requireOwnerOrAdmin(Booking booking, CustomUserPrincipal principal) {
        if (!principal.isAdmin() && !booking.getUserId().equals(principal.userId())) {
            throw new AccessDeniedException("User can only access own booking");
        }
    }

    private Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
    }

    private BookingPageResponse toPageResponse(Page<Booking> page) {
        return new BookingPageResponse(
                page.getContent().stream().map(mapper::toResponse).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    private RuntimeException mapEventServiceException(FeignException ex) {
        if (ex instanceof FeignException.NotFound || ex.status() == 404) {
            return new ResourceNotFoundException("EVENT_NOT_FOUND: Event not found");
        }
        String message = normalizedEventServiceMessage(ex);
        String code = extractKnownEventErrorCode(message);
        if ("INVALID_INTERNAL_API_KEY".equals(code)) {
            return new ForbiddenException("INVALID_INTERNAL_API_KEY: Invalid internal API key");
        }
        if (code != null) {
            return new BadRequestException(code + ": " + eventErrorDescription(code));
        }
        if (ex.status() == 503 || ex.status() == 502 || ex.status() == 504 || ex.status() < 0) {
            return new BadRequestException("EVENT_SERVICE_UNAVAILABLE: Event Service is unavailable");
        }
        return new BadRequestException("EVENT_SERVICE_UNAVAILABLE: Event Service request failed");
    }

    private String normalizedEventServiceMessage(FeignException ex) {
        String message = ex.contentUTF8();
        if (message == null || message.isBlank()) {
            message = ex.getMessage();
        }
        if (message == null || message.isBlank()) {
            message = "Event service request failed with status " + ex.status();
        }
        return message;
    }

    private String extractKnownEventErrorCode(String message) {
        String[] knownCodes = {
                "EVENT_NOT_BOOKABLE",
                "EVENT_NOT_PUBLISHED",
                "EVENT_ALREADY_STARTED",
                "EVENT_COMPLETED",
                "EVENT_CANCELLED",
                "INVALID_TICKET_QUANTITY",
                "INSUFFICIENT_TICKETS",
                "INVALID_INTERNAL_API_KEY"
        };
        for (String code : knownCodes) {
            if (message.contains(code)) {
                return code;
            }
        }
        return null;
    }

    private String eventErrorDescription(String code) {
        return switch (code) {
            case "EVENT_NOT_PUBLISHED", "EVENT_NOT_BOOKABLE" -> "Event is not bookable";
            case "EVENT_ALREADY_STARTED" -> "Event has already started";
            case "EVENT_COMPLETED" -> "Event has already ended";
            case "EVENT_CANCELLED" -> "Event has been cancelled";
            case "INVALID_TICKET_QUANTITY" -> "Ticket quantity is invalid";
            case "INSUFFICIENT_TICKETS" -> "Not enough tickets available";
            default -> "Event Service rejected the request";
        };
    }

    private void compensateReleaseAfterCreateFailure(Long eventId, int quantity, RuntimeException originalException) {
        try {
            releaseTickets(eventId, quantity);
        } catch (RuntimeException releaseException) {
            originalException.addSuppressed(releaseException);
            log.warn("Failed to release reserved tickets after booking create failure, eventId={}", eventId, releaseException);
        }
    }
}
