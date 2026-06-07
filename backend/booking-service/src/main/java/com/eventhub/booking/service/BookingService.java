package com.eventhub.booking.service;

import com.eventhub.booking.client.EventServiceClient;
import com.eventhub.booking.dto.BookingPageResponse;
import com.eventhub.booking.dto.BookingResponse;
import com.eventhub.booking.dto.CreateBookingRequest;
import com.eventhub.booking.dto.EventApiResponse;
import com.eventhub.booking.dto.InternalEventResponse;
import com.eventhub.booking.dto.TicketQuantityRequest;
import com.eventhub.booking.entity.Booking;
import com.eventhub.booking.enums.BookingStatus;
import com.eventhub.booking.enums.PaymentStatus;
import com.eventhub.booking.mapper.BookingMapper;
import com.eventhub.booking.messaging.BookingEventPublisher;
import com.eventhub.booking.repository.BookingRepository;
import com.eventhub.booking.security.CustomUserPrincipal;
import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.ResourceNotFoundException;
import feign.FeignException;
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
        InternalEventResponse event = fetchEvent(request.eventId());
        validateBookable(event, request.quantity());
        reserveTickets(request.eventId(), request.quantity());

        Booking booking = repository.save(Booking.builder()
                .userId(principal.userId())
                .eventId(request.eventId())
                .eventTitle(event.title())
                .quantity(request.quantity())
                .ticketPrice(event.price())
                .totalPrice(event.price().multiply(BigDecimal.valueOf(request.quantity())))
                .status(BookingStatus.CONFIRMED)
                .paymentStatus(PaymentStatus.UNPAID)
                .build());
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

    private Booking getBooking(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }

    private InternalEventResponse fetchEvent(Long eventId) {
        try {
            EventApiResponse<InternalEventResponse> response = eventServiceClient.getInternalEvent(eventId);
            if (response == null || response.data() == null) {
                throw new ResourceNotFoundException("Event not found");
            }
            return response.data();
        } catch (FeignException.NotFound ex) {
            throw new ResourceNotFoundException("Event not found");
        } catch (FeignException ex) {
            throw toBadRequest(ex);
        }
    }

    private void reserveTickets(Long eventId, int quantity) {
        try {
            eventServiceClient.reserveTickets(eventId, new TicketQuantityRequest(quantity));
        } catch (FeignException ex) {
            throw toBadRequest(ex);
        }
    }

    private void releaseTickets(Long eventId, int quantity) {
        try {
            eventServiceClient.releaseTickets(eventId, new TicketQuantityRequest(quantity));
        } catch (FeignException ex) {
            throw toBadRequest(ex);
        }
    }

    private void validateBookable(InternalEventResponse event, int quantity) {
        if (!"PUBLISHED".equals(event.status())) {
            throw new BadRequestException("Only published events can be booked");
        }
        if (event.availableTickets() < quantity) {
            throw new BadRequestException("Not enough tickets available");
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

    private BadRequestException toBadRequest(FeignException ex) {
        String message = ex.contentUTF8();
        if (message == null || message.isBlank()) {
            message = ex.getMessage();
        }
        if (message == null || message.isBlank()) {
            message = "Event service request failed with status " + ex.status();
        }
        return new BadRequestException(message);
    }
}
