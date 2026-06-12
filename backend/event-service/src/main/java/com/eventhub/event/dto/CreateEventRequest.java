package com.eventhub.event.dto;

import com.eventhub.event.entity.EventStatus;
import com.eventhub.event.validation.AllowedCreateEventStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CreateEventRequest(
        @NotBlank @Size(max = 150) String title,
        String description,
        String category,
        String location,
        String address,
        String city,
        LocalDateTime startTime,
        LocalDateTime endTime,
        @Min(0) Integer totalTickets,
        @DecimalMin("0.0") BigDecimal price,
        String imageUrl,
        @AllowedCreateEventStatus
        @Schema(
                description = "Optional status for backward compatibility. Omit or use DRAFT to create a draft; PUBLISHED remains accepted for existing clients and will be fully validated by publish logic.",
                allowableValues = {"DRAFT", "PUBLISHED"}
        )
        EventStatus status
) {
}
