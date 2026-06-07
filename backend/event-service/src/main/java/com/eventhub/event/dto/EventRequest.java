package com.eventhub.event.dto;

import com.eventhub.event.entity.EventStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventRequest(
        @NotBlank String title,
        String description,
        @NotBlank String location,
        @NotNull LocalDateTime startTime,
        @NotNull LocalDateTime endTime,
        @NotNull @PositiveOrZero Integer totalTickets,
        @NotNull @PositiveOrZero Integer availableTickets,
        @NotNull @PositiveOrZero BigDecimal price,
        @NotNull Long organizerId,
        EventStatus status
) {
}
