package com.eventhub.event.dto;

import com.eventhub.event.entity.EventStatus;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class CreateEventRequestValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void createRequestAcceptsMissingDraftOrPublishedStatus() {
        assertThat(validator.validate(request(null))).isEmpty();
        assertThat(validator.validate(request(EventStatus.DRAFT))).isEmpty();
        assertThat(validator.validate(request(EventStatus.PUBLISHED))).isEmpty();
    }

    @Test
    void createRequestRejectsCancelledOrCompletedStatus() {
        assertThat(validator.validate(request(EventStatus.CANCELLED))).isNotEmpty();
        assertThat(validator.validate(request(EventStatus.COMPLETED))).isNotEmpty();
    }

    private CreateEventRequest request(EventStatus status) {
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
}
