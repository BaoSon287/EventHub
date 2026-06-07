package com.eventhub.event.dto;

import com.eventhub.event.entity.EventStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventResponse(
        Long id,
        String title,
        String description,
        String category,
        String location,
        String address,
        String city,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer totalTickets,
        Integer availableTickets,
        BigDecimal price,
        String imageUrl,
        Long organizerId,
        String organizerName,
        EventStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
