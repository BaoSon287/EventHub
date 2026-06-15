package com.eventhub.booking.service;

import com.eventhub.booking.client.EventServiceClient;
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
import feign.FeignException;
import feign.Request;
import feign.Response;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {
    @Mock
    private BookingRepository repository;

    @Mock
    private EventServiceClient eventServiceClient;

    @Mock
    private BookingEventPublisher eventPublisher;

    private final BookingMapper mapper = new BookingMapper();
    private final CustomUserPrincipal user = new CustomUserPrincipal(10L, "user@example.com", "USER");
    private final CustomUserPrincipal otherUser = new CustomUserPrincipal(20L, "other@example.com", "USER");
    private BookingService service;

    @BeforeEach
    void setUp() {
        service = new BookingService(repository, eventServiceClient, mapper, eventPublisher);
    }

    @Test
    void createBookingWithPublishedEventSucceeds() {
        when(eventServiceClient.getInternalEvent(1L)).thenReturn(success(event("PUBLISHED", 5)));
        when(eventServiceClient.reserveTickets(eq(1L), any(TicketQuantityRequest.class))).thenReturn(success(event("PUBLISHED", 4)));
        when(repository.saveAndFlush(any(Booking.class))).thenAnswer(invocation -> withId(invocation.getArgument(0)));

        var response = service.create(new CreateBookingRequest(1L, 1), user);

        assertThat(response.eventId()).isEqualTo(1L);
        assertThat(response.quantity()).isEqualTo(1);
        assertThat(response.status()).isEqualTo(BookingStatus.CONFIRMED);
        InOrder inOrder = inOrder(eventServiceClient, repository, eventPublisher);
        inOrder.verify(eventServiceClient).reserveTickets(eq(1L), any(TicketQuantityRequest.class));
        inOrder.verify(repository).saveAndFlush(any(Booking.class));
        inOrder.verify(eventPublisher).publishBookingCreated(any(Booking.class), eq(user));
    }

    @Test
    void eventDraftReturnsBookableError() {
        when(eventServiceClient.getInternalEvent(1L)).thenReturn(success(event("DRAFT", 5)));

        assertThatThrownBy(() -> service.create(new CreateBookingRequest(1L, 1), user))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_NOT_BOOKABLE");

        verify(eventServiceClient, never()).reserveTickets(any(), any());
        verify(repository, never()).saveAndFlush(any());
        verify(eventPublisher, never()).publishBookingCreated(any(), any());
    }

    @Test
    void eventCancelledReturnsCancelError() {
        when(eventServiceClient.getInternalEvent(1L)).thenReturn(success(event("CANCELLED", 5)));

        assertThatThrownBy(() -> service.create(new CreateBookingRequest(1L, 1), user))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_CANCELLED");
    }

    @Test
    void eventCompletedReturnsCompletedError() {
        when(eventServiceClient.getInternalEvent(1L)).thenReturn(success(event("COMPLETED", 5)));

        assertThatThrownBy(() -> service.create(new CreateBookingRequest(1L, 1), user))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_COMPLETED");
    }

    @Test
    void expiredEventReturnsCompletedError() {
        when(eventServiceClient.getInternalEvent(1L)).thenReturn(success(new InternalEventResponse(
                1L,
                "Past Event",
                LocalDateTime.now().minusDays(2),
                LocalDateTime.now().minusDays(1),
                100,
                BigDecimal.valueOf(100000),
                10,
                "PUBLISHED",
                99L
        )));

        assertThatThrownBy(() -> service.create(new CreateBookingRequest(1L, 1), user))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_COMPLETED");
    }

    @Test
    void insufficientTicketsReturnsErrorAndDoesNotCreateBooking() {
        when(eventServiceClient.getInternalEvent(1L)).thenReturn(success(event("PUBLISHED", 0)));

        assertThatThrownBy(() -> service.create(new CreateBookingRequest(1L, 1), user))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("INSUFFICIENT_TICKETS");

        verify(repository, never()).saveAndFlush(any());
    }

    @Test
    void reserveFailureDoesNotCreateBookingOrPublishEvent() {
        when(eventServiceClient.getInternalEvent(1L)).thenReturn(success(event("PUBLISHED", 5)));
        when(eventServiceClient.reserveTickets(eq(1L), any(TicketQuantityRequest.class)))
                .thenThrow(feignException(400, "INSUFFICIENT_TICKETS"));

        assertThatThrownBy(() -> service.create(new CreateBookingRequest(1L, 1), user))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("INSUFFICIENT_TICKETS");

        verify(repository, never()).saveAndFlush(any());
        verify(eventPublisher, never()).publishBookingCreated(any(), any());
    }

    @Test
    void saveFailureAfterReserveReleasesTickets() {
        when(eventServiceClient.getInternalEvent(1L)).thenReturn(success(event("PUBLISHED", 5)));
        when(eventServiceClient.reserveTickets(eq(1L), any(TicketQuantityRequest.class))).thenReturn(success(event("PUBLISHED", 4)));
        when(eventServiceClient.releaseTickets(eq(1L), any(TicketQuantityRequest.class))).thenReturn(success(event("PUBLISHED", 5)));
        when(repository.saveAndFlush(any(Booking.class))).thenThrow(new DataIntegrityViolationException("boom"));

        assertThatThrownBy(() -> service.create(new CreateBookingRequest(1L, 2), user))
                .isInstanceOf(DataIntegrityViolationException.class);

        ArgumentCaptor<TicketQuantityRequest> releaseRequest = ArgumentCaptor.forClass(TicketQuantityRequest.class);
        verify(eventServiceClient).releaseTickets(eq(1L), releaseRequest.capture());
        assertThat(releaseRequest.getValue().quantity()).isEqualTo(2);
        verify(eventPublisher, never()).publishBookingCreated(any(), any());
    }

    @Test
    void cancelBookingCallsReleaseAndPublishesAfterSave() {
        Booking booking = booking(BookingStatus.CONFIRMED);
        when(repository.findById(1L)).thenReturn(Optional.of(booking));
        when(eventServiceClient.releaseTickets(eq(1L), any(TicketQuantityRequest.class))).thenReturn(success(event("PUBLISHED", 5)));
        when(repository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.cancel(1L, user);

        InOrder inOrder = inOrder(eventServiceClient, repository, eventPublisher);
        inOrder.verify(eventServiceClient).releaseTickets(eq(1L), any(TicketQuantityRequest.class));
        inOrder.verify(repository).save(booking);
        inOrder.verify(eventPublisher).publishBookingCancelled(booking, user);
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
    }

    @Test
    void cancelledBookingDoesNotReleaseTwice() {
        when(repository.findById(1L)).thenReturn(Optional.of(booking(BookingStatus.CANCELLED)));

        assertThatThrownBy(() -> service.cancel(1L, user))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already cancelled");

        verify(eventServiceClient, never()).releaseTickets(any(), any());
    }

    @Test
    void onlyOwnerCanCancelBooking() {
        when(repository.findById(1L)).thenReturn(Optional.of(booking(BookingStatus.CONFIRMED)));

        assertThatThrownBy(() -> service.cancel(1L, otherUser))
                .isInstanceOf(AccessDeniedException.class);

        verify(eventServiceClient, never()).releaseTickets(any(), any());
    }

    @Test
    void eventServiceUnavailableIsMappedWithoutRawFeignException() {
        when(eventServiceClient.getInternalEvent(1L))
                .thenThrow(feignException(503, "Service Unavailable"));

        assertThatThrownBy(() -> service.create(new CreateBookingRequest(1L, 1), user))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_SERVICE_UNAVAILABLE")
                .hasMessageNotContaining("FeignException");
    }

    @Test
    void eventServiceJsonErrorMessageIsMappedToKnownCode() {
        when(eventServiceClient.getInternalEvent(1L)).thenReturn(success(event("PUBLISHED", 5)));
        when(eventServiceClient.reserveTickets(eq(1L), any(TicketQuantityRequest.class)))
                .thenThrow(feignException(400, "EVENT_ALREADY_STARTED: Event has already started"));

        assertThatThrownBy(() -> service.create(new CreateBookingRequest(1L, 1), user))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_ALREADY_STARTED")
                .hasMessageNotContaining("EVENT_SERVICE_UNAVAILABLE");
    }

    private EventApiResponse<InternalEventResponse> success(InternalEventResponse event) {
        return new EventApiResponse<>(true, "OK", event);
    }

    private InternalEventResponse event(String status, int availableTickets) {
        LocalDateTime startTime = LocalDateTime.now().plusDays(5);
        return new InternalEventResponse(
                1L,
                "Tech Meetup",
                startTime,
                startTime.plusHours(2),
                100,
                BigDecimal.valueOf(100000),
                availableTickets,
                status,
                99L
        );
    }

    private Booking booking(BookingStatus status) {
        return Booking.builder()
                .id(1L)
                .bookingCode("EH-TEST")
                .userId(user.userId())
                .eventId(1L)
                .eventTitle("Tech Meetup")
                .quantity(2)
                .ticketPrice(BigDecimal.valueOf(100000))
                .totalPrice(BigDecimal.valueOf(200000))
                .status(status)
                .paymentStatus(PaymentStatus.UNPAID)
                .build();
    }

    private Booking withId(Booking booking) {
        booking.setId(1L);
        booking.setBookingCode("EH-TEST");
        return booking;
    }

    private FeignException feignException(int status, String body) {
        Request request = Request.create(Request.HttpMethod.PATCH, "/api/events/internal/1/reserve-tickets", Map.of(), null, StandardCharsets.UTF_8, null);
        Response response = Response.builder()
                .request(request)
                .status(status)
                .reason("Error")
                .body(("{\"success\":false,\"message\":\"" + body + "\",\"data\":null}").getBytes(StandardCharsets.UTF_8))
                .build();
        return FeignException.errorStatus("event-service", response);
    }
}
