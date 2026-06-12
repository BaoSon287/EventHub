package com.eventhub.event.mapper;

import com.eventhub.event.dto.UpdateEventRequest;
import com.eventhub.event.entity.Event;
import com.eventhub.event.entity.EventStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class EventMapperTest {
    private final EventMapper mapper = new EventMapper();

    @Test
    void responseDtoReturnsEventStatus() {
        Event event = event(EventStatus.PUBLISHED);

        assertThat(mapper.toResponse(event).status()).isEqualTo(EventStatus.PUBLISHED);
    }

    @Test
    void updateDoesNotLoseOrOverrideStatus() {
        Event event = event(EventStatus.CANCELLED);
        LocalDateTime startTime = LocalDateTime.now().plusDays(20);
        UpdateEventRequest request = new UpdateEventRequest(
                "Updated",
                "Updated description",
                "Business",
                "Updated Hall",
                "Updated Address",
                "Da Nang",
                startTime,
                startTime.plusHours(3),
                50,
                BigDecimal.valueOf(50000),
                "https://example.com/updated.jpg"
        );

        mapper.update(event, request);

        assertThat(event.getStatus()).isEqualTo(EventStatus.CANCELLED);
        assertThat(mapper.toResponse(event).status()).isEqualTo(EventStatus.CANCELLED);
    }

    private Event event(EventStatus status) {
        LocalDateTime startTime = LocalDateTime.now().plusDays(5);
        return Event.builder()
                .id(1L)
                .title("Event")
                .description("Description")
                .category("Technology")
                .location("Main Hall")
                .address("1 Event Street")
                .city("Ha Noi")
                .startTime(startTime)
                .endTime(startTime.plusHours(2))
                .totalTickets(100)
                .availableTickets(80)
                .price(BigDecimal.valueOf(100000))
                .organizerId(1L)
                .organizerName("organizer@example.com")
                .status(status)
                .build();
    }
}
