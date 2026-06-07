package com.eventhub.event.dto;

import com.eventhub.event.entity.EventStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CreateEventRequest(
        @NotBlank @Size(max = 150) String title,
        @NotBlank String description,
        @NotBlank String category,
        @NotBlank String location,
        String address,
        @NotBlank String city,
        @NotNull LocalDateTime startTime,
        @NotNull LocalDateTime endTime,
        @NotNull @Min(0) Integer totalTickets,
        @NotNull @DecimalMin("0.0") BigDecimal price,
        String imageUrl,
        EventStatus status
) {
}
