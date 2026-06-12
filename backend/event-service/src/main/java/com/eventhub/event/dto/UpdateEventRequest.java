package com.eventhub.event.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UpdateEventRequest(
        @Size(max = 150) String title,
        String description,
        String category,
        String location,
        String address,
        String city,
        LocalDateTime startTime,
        LocalDateTime endTime,
        @Min(0) Integer totalTickets,
        @DecimalMin("0.0") BigDecimal price,
        String imageUrl
) {
}
