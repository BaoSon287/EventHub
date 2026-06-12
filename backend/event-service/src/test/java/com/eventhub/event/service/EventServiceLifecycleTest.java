package com.eventhub.event.service;

import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.ResourceNotFoundException;
import com.eventhub.event.dto.CreateEventRequest;
import com.eventhub.event.dto.EventResponse;
import com.eventhub.event.dto.TicketQuantityRequest;
import com.eventhub.event.dto.UpdateEventRequest;
import com.eventhub.event.entity.Event;
import com.eventhub.event.entity.EventStatus;
import com.eventhub.event.exception.EventConflictException;
import com.eventhub.event.mapper.EventMapper;
import com.eventhub.event.repository.EventRepository;
import com.eventhub.event.security.CustomUserPrincipal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceLifecycleTest {
    @Mock
    private EventRepository repository;

    @Spy
    private EventMapper mapper;

    private EventService service;

    private final CustomUserPrincipal organizer = new CustomUserPrincipal(10L, "organizer@example.com", "ORGANIZER");
    private final CustomUserPrincipal otherOrganizer = new CustomUserPrincipal(20L, "other@example.com", "ORGANIZER");
    private final CustomUserPrincipal admin = new CustomUserPrincipal(1L, "admin@example.com", "ADMIN");

    @BeforeEach
    void setUp() {
        service = new EventService(repository, mapper, Clock.systemDefaultZone());
    }

    @Test
    void createWithoutStatusCreatesDraft() {
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.create(createRequest(null), organizer);

        assertThat(response.status()).isEqualTo(EventStatus.DRAFT);
        assertThat(response.availableTickets()).isEqualTo(response.totalTickets());
        assertThat(response.organizerId()).isEqualTo(organizer.userId());
    }

    @Test
    void createWithDraftCreatesDraft() {
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.create(createRequest(EventStatus.DRAFT), organizer);

        assertThat(response.status()).isEqualTo(EventStatus.DRAFT);
    }

    @Test
    void createWithPublishedRunsValidationAndCreatesPublished() {
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.create(createRequest(EventStatus.PUBLISHED), organizer);

        assertThat(response.status()).isEqualTo(EventStatus.PUBLISHED);
    }

    @Test
    void createWithCancelledFails() {
        assertThatThrownBy(() -> service.create(createRequest(EventStatus.CANCELLED), organizer))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_INVALID_CREATE_STATUS");
    }

    @Test
    void createWithCompletedFails() {
        assertThatThrownBy(() -> service.create(createRequest(EventStatus.COMPLETED), organizer))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_INVALID_CREATE_STATUS");
    }

    @Test
    void publishValidDraftSucceeds() {
        Event event = event(EventStatus.DRAFT);
        when(repository.findById(1L)).thenReturn(Optional.of(event));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.publish(1L, organizer);

        assertThat(response.status()).isEqualTo(EventStatus.PUBLISHED);
        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
    }

    @Test
    void publishMissingDescriptionFails() {
        Event event = event(EventStatus.DRAFT);
        event.setDescription(" ");
        when(repository.findById(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.publish(1L, organizer))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_NOT_PUBLISHABLE");
    }

    @Test
    void publishPastStartTimeFails() {
        Event event = event(EventStatus.DRAFT);
        event.setStartTime(LocalDateTime.now().minusDays(1));
        event.setEndTime(LocalDateTime.now().plusHours(2));
        when(repository.findById(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.publish(1L, organizer))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("startTime must be in the future");
    }

    @Test
    void publishEndTimeBeforeStartTimeFails() {
        Event event = event(EventStatus.DRAFT);
        event.setEndTime(event.getStartTime().minusHours(1));
        when(repository.findById(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.publish(1L, organizer))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("startTime must be before endTime");
    }

    @Test
    void publishWithZeroTotalTicketsFails() {
        Event event = event(EventStatus.DRAFT);
        event.setTotalTickets(0);
        event.setAvailableTickets(0);
        when(repository.findById(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.publish(1L, organizer))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("totalTickets must be greater than 0");
    }

    @Test
    void publishPublishedFails() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.PUBLISHED)));

        assertThatThrownBy(() -> service.publish(1L, organizer))
                .isInstanceOf(EventConflictException.class)
                .hasMessageContaining("EVENT_INVALID_STATUS_TRANSITION");
    }

    @Test
    void publishCancelledFails() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.CANCELLED)));

        assertThatThrownBy(() -> service.publish(1L, organizer))
                .isInstanceOf(EventConflictException.class)
                .hasMessageContaining("EVENT_INVALID_STATUS_TRANSITION");
    }

    @Test
    void cancelDraftSucceeds() {
        Event event = event(EventStatus.DRAFT);
        when(repository.findById(1L)).thenReturn(Optional.of(event));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.cancelAndReturn(1L, organizer);

        assertThat(response.status()).isEqualTo(EventStatus.CANCELLED);
    }

    @Test
    void cancelPublishedSucceeds() {
        Event event = event(EventStatus.PUBLISHED);
        when(repository.findById(1L)).thenReturn(Optional.of(event));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.cancelAndReturn(1L, organizer);

        assertThat(response.status()).isEqualTo(EventStatus.CANCELLED);
    }

    @Test
    void cancelCompletedFails() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.COMPLETED)));

        assertThatThrownBy(() -> service.cancelAndReturn(1L, organizer))
                .isInstanceOf(EventConflictException.class)
                .hasMessageContaining("EVENT_INVALID_STATUS_TRANSITION");
    }

    @Test
    void nonOwnerCannotPublish() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.DRAFT)));

        assertThatThrownBy(() -> service.publish(1L, otherOrganizer))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("EVENT_ACCESS_DENIED");
    }

    @Test
    void nonOwnerCannotCancel() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.DRAFT)));

        assertThatThrownBy(() -> service.cancelAndReturn(1L, otherOrganizer))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("EVENT_ACCESS_DENIED");
    }

    @Test
    void adminCanPublishAndCancel() {
        Event draft = event(EventStatus.DRAFT);
        Event published = event(EventStatus.PUBLISHED);
        when(repository.findById(1L)).thenReturn(Optional.of(draft));
        when(repository.findById(2L)).thenReturn(Optional.of(published));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(service.publish(1L, admin).status()).isEqualTo(EventStatus.PUBLISHED);
        assertThat(service.cancelAndReturn(2L, admin).status()).isEqualTo(EventStatus.CANCELLED);
    }

    @Test
    void ownerUpdatesDraftSuccessfully() {
        Event event = event(EventStatus.DRAFT);
        event.setAvailableTickets(80);
        when(repository.findById(1L)).thenReturn(Optional.of(event));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.update(1L, updateRequest(120), organizer);

        assertThat(response.title()).isEqualTo("Updated");
        assertThat(response.totalTickets()).isEqualTo(120);
        assertThat(response.availableTickets()).isEqualTo(100);
        assertThat(response.status()).isEqualTo(EventStatus.DRAFT);
        assertThat(response.organizerId()).isEqualTo(organizer.userId());
    }

    @Test
    void nonOwnerUpdateFails() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.DRAFT)));

        assertThatThrownBy(() -> service.update(1L, updateRequest(100), otherOrganizer))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("EVENT_ACCESS_DENIED");
    }

    @Test
    void adminUpdatesSuccessfully() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.DRAFT)));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.update(1L, updateRequest(100), admin);

        assertThat(response.title()).isEqualTo("Updated");
    }

    @Test
    void updateRequestCannotChangeStatusOrOrganizer() {
        Event event = event(EventStatus.DRAFT);
        when(repository.findById(1L)).thenReturn(Optional.of(event));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.update(1L, updateRequest(100), organizer);

        assertThat(response.status()).isEqualTo(EventStatus.DRAFT);
        assertThat(response.organizerId()).isEqualTo(organizer.userId());
    }

    @Test
    void publishedUpdateCannotReduceTotalTicketsBelowReservedTickets() {
        Event event = event(EventStatus.PUBLISHED);
        event.setTotalTickets(100);
        event.setAvailableTickets(70);
        when(repository.findById(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.update(1L, updateRequest(20), organizer))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_INVALID_TICKET_COUNT");
    }

    @Test
    void cancelledUpdateFails() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.CANCELLED)));

        assertThatThrownBy(() -> service.update(1L, updateRequest(100), organizer))
                .isInstanceOf(EventConflictException.class)
                .hasMessageContaining("EVENT_NOT_EDITABLE");
    }

    @Test
    void completedUpdateFails() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.COMPLETED)));

        assertThatThrownBy(() -> service.update(1L, updateRequest(100), organizer))
                .isInstanceOf(EventConflictException.class)
                .hasMessageContaining("EVENT_NOT_EDITABLE");
    }

    @Test
    void deleteDraftSucceeds() {
        Event event = event(EventStatus.DRAFT);
        when(repository.findById(1L)).thenReturn(Optional.of(event));

        service.delete(1L, organizer);

        verify(repository).delete(event);
    }

    @Test
    void deletePublishedFails() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.PUBLISHED)));

        assertThatThrownBy(() -> service.delete(1L, organizer))
                .isInstanceOf(EventConflictException.class)
                .hasMessageContaining("EVENT_NOT_DELETABLE");
    }

    @Test
    void deleteCancelledFails() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.CANCELLED)));

        assertThatThrownBy(() -> service.delete(1L, organizer))
                .isInstanceOf(EventConflictException.class)
                .hasMessageContaining("EVENT_NOT_DELETABLE");
    }

    @Test
    void deleteCompletedFails() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.COMPLETED)));

        assertThatThrownBy(() -> service.delete(1L, organizer))
                .isInstanceOf(EventConflictException.class)
                .hasMessageContaining("EVENT_NOT_DELETABLE");
    }

    @Test
    void publicCannotViewDraft() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.DRAFT)));

        assertThatThrownBy(() -> service.findById(1L, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("EVENT_NOT_FOUND");
    }

    @Test
    void ownerCanViewDraft() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.DRAFT)));

        EventResponse response = service.findById(1L, organizer);

        assertThat(response.status()).isEqualTo(EventStatus.DRAFT);
    }

    @Test
    void adminCanViewDraft() {
        when(repository.findById(1L)).thenReturn(Optional.of(event(EventStatus.DRAFT)));

        EventResponse response = service.findById(1L, admin);

        assertThat(response.status()).isEqualTo(EventStatus.DRAFT);
    }

    @Test
    void reserveExpiredPublishedEventCompletesAndFails() {
        Event event = event(EventStatus.PUBLISHED);
        event.setStartTime(LocalDateTime.now().minusDays(2));
        event.setEndTime(LocalDateTime.now().minusDays(1));
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThatThrownBy(() -> service.reserveTickets(1L, new TicketQuantityRequest(1)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_COMPLETED");

        assertThat(event.getStatus()).isEqualTo(EventStatus.COMPLETED);
    }

    @Test
    void reservePublishedEventSucceeds() {
        Event event = event(EventStatus.PUBLISHED);
        event.setAvailableTickets(2);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.reserveTickets(1L, new TicketQuantityRequest(1));

        assertThat(event.getAvailableTickets()).isEqualTo(1);
    }

    @Test
    void reserveDraftFails() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event(EventStatus.DRAFT)));

        assertThatThrownBy(() -> service.reserveTickets(1L, new TicketQuantityRequest(1)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_NOT_PUBLISHED");
    }

    @Test
    void reserveCancelledFails() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event(EventStatus.CANCELLED)));

        assertThatThrownBy(() -> service.reserveTickets(1L, new TicketQuantityRequest(1)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_CANCELLED");
    }

    @Test
    void reserveCompletedFails() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event(EventStatus.COMPLETED)));

        assertThatThrownBy(() -> service.reserveTickets(1L, new TicketQuantityRequest(1)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_COMPLETED");
    }

    @Test
    void reserveAlreadyStartedFails() {
        Event event = event(EventStatus.PUBLISHED);
        event.setStartTime(LocalDateTime.now().minusMinutes(1));
        event.setEndTime(LocalDateTime.now().plusHours(2));
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.reserveTickets(1L, new TicketQuantityRequest(1)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EVENT_ALREADY_STARTED");
    }

    @Test
    void reserveZeroQuantityFails() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event(EventStatus.PUBLISHED)));

        assertThatThrownBy(() -> service.reserveTickets(1L, new TicketQuantityRequest(0)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("INVALID_TICKET_QUANTITY");
    }

    @Test
    void reserveNegativeQuantityFails() {
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event(EventStatus.PUBLISHED)));

        assertThatThrownBy(() -> service.reserveTickets(1L, new TicketQuantityRequest(-1)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("INVALID_TICKET_QUANTITY");
    }

    @Test
    void reserveInsufficientTicketsFails() {
        Event event = event(EventStatus.PUBLISHED);
        event.setAvailableTickets(0);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.reserveTickets(1L, new TicketQuantityRequest(1)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("INSUFFICIENT_TICKETS");
    }

    @Test
    void releaseTicketsSucceeds() {
        Event event = event(EventStatus.PUBLISHED);
        event.setAvailableTickets(1);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.releaseTickets(1L, new TicketQuantityRequest(1));

        assertThat(event.getAvailableTickets()).isEqualTo(2);
    }

    @Test
    void releaseTicketsCannotExceedTotalTickets() {
        Event event = event(EventStatus.PUBLISHED);
        event.setAvailableTickets(100);
        event.setTotalTickets(100);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.releaseTickets(1L, new TicketQuantityRequest(1)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("INVALID_TICKET_QUANTITY");
    }

    private CreateEventRequest createRequest(EventStatus status) {
        LocalDateTime startTime = LocalDateTime.now().plusDays(10);
        return new CreateEventRequest(
                "Tech Meetup",
                "A meetup for builders",
                "Technology",
                "Main Hall",
                "1 Event Street",
                "Ha Noi",
                startTime,
                startTime.plusHours(2),
                100,
                BigDecimal.valueOf(100000),
                "https://example.com/event.jpg",
                status
        );
    }

    private Event event(EventStatus status) {
        LocalDateTime startTime = LocalDateTime.now().plusDays(5);
        return Event.builder()
                .id(1L)
                .title("Tech Meetup")
                .description("A meetup for builders")
                .category("Technology")
                .location("Main Hall")
                .address("1 Event Street")
                .city("Ha Noi")
                .startTime(startTime)
                .endTime(startTime.plusHours(2))
                .totalTickets(100)
                .availableTickets(100)
                .price(BigDecimal.valueOf(100000))
                .imageUrl("https://example.com/event.jpg")
                .organizerId(organizer.userId())
                .organizerName(organizer.email())
                .status(status)
                .build();
    }

    private UpdateEventRequest updateRequest(Integer totalTickets) {
        LocalDateTime startTime = LocalDateTime.now().plusDays(15);
        return new UpdateEventRequest(
                "Updated",
                "Updated description",
                "Business",
                "Updated Hall",
                "Updated Address",
                "Da Nang",
                startTime,
                startTime.plusHours(3),
                totalTickets,
                BigDecimal.valueOf(50000),
                "https://example.com/updated.jpg"
        );
    }
}
