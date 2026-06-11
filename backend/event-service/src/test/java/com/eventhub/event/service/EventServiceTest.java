package com.eventhub.event.service;

import com.eventhub.common.exception.BadRequestException;
import com.eventhub.event.dto.CreateEventRequest;
import com.eventhub.event.dto.EventResponse;
import com.eventhub.event.dto.TicketQuantityRequest;
import com.eventhub.event.entity.Event;
import com.eventhub.event.entity.EventStatus;
import com.eventhub.event.mapper.EventMapper;
import com.eventhub.event.repository.EventRepository;
import com.eventhub.event.security.CustomUserPrincipal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {
    @Mock
    private EventRepository repository;

    @Spy
    private EventMapper mapper;

    @InjectMocks
    private EventService service;

    private final CustomUserPrincipal organizer = new CustomUserPrincipal(10L, "organizer@example.com", "ORGANIZER");

    @Test
    void createCreatesDraftByDefault() {
        CreateEventRequest request = createRequest(null);
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.create(request, organizer);

        ArgumentCaptor<Event> eventCaptor = ArgumentCaptor.forClass(Event.class);
        verify(repository).save(eventCaptor.capture());
        assertThat(eventCaptor.getValue().getStatus()).isEqualTo(EventStatus.DRAFT);
        assertThat(response.status()).isEqualTo(EventStatus.DRAFT);
    }

    @Test
    void publishSucceedsForValidDraft() {
        Event event = validEvent(EventStatus.DRAFT);
        when(repository.findById(1L)).thenReturn(Optional.of(event));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.publish(1L, organizer);

        assertThat(response.status()).isEqualTo(EventStatus.PUBLISHED);
        assertThat(event.getStatus()).isEqualTo(EventStatus.PUBLISHED);
    }

    @Test
    void publishRejectsEventWithMissingRequiredData() {
        Event event = validEvent(EventStatus.DRAFT);
        event.setDescription(" ");
        when(repository.findById(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.publish(1L, organizer))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("missing required information");
    }

    @Test
    void cancelSwitchesEventToCancelled() {
        Event event = validEvent(EventStatus.PUBLISHED);
        when(repository.findById(1L)).thenReturn(Optional.of(event));
        when(repository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = service.cancelAndReturn(1L, organizer);

        assertThat(response.status()).isEqualTo(EventStatus.CANCELLED);
        assertThat(event.getStatus()).isEqualTo(EventStatus.CANCELLED);
    }

    @Test
    void reserveTicketsRejectsCancelledEvent() {
        Event event = validEvent(EventStatus.CANCELLED);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.reserveTickets(1L, new TicketQuantityRequest(1)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cancelled events cannot be booked");
    }

    @Test
    void reserveTicketsRejectsCompletedEvent() {
        Event event = validEvent(EventStatus.COMPLETED);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> service.reserveTickets(1L, new TicketQuantityRequest(1)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Completed events cannot be booked");
    }

    private CreateEventRequest createRequest(EventStatus status) {
        return new CreateEventRequest(
                "Tech Meetup",
                "A meetup for builders",
                "Technology",
                "Main Hall",
                "1 Event Street",
                "Ha Noi",
                LocalDateTime.now().plusDays(7),
                LocalDateTime.now().plusDays(7).plusHours(3),
                100,
                BigDecimal.valueOf(99000),
                "https://example.com/event.jpg",
                status
        );
    }

    private Event validEvent(EventStatus status) {
        return Event.builder()
                .id(1L)
                .title("Tech Meetup")
                .description("A meetup for builders")
                .category("Technology")
                .location("Main Hall")
                .address("1 Event Street")
                .city("Ha Noi")
                .startTime(LocalDateTime.now().plusDays(7))
                .endTime(LocalDateTime.now().plusDays(7).plusHours(3))
                .totalTickets(100)
                .availableTickets(100)
                .price(BigDecimal.valueOf(99000))
                .imageUrl("https://example.com/event.jpg")
                .organizerId(organizer.userId())
                .organizerName(organizer.email())
                .status(status)
                .build();
    }
}
