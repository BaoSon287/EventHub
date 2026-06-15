package com.eventhub.event.dto;

import com.eventhub.event.entity.EventStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InternalEventResponse(
        Long id,
        String title,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String imageUrl,
        String location,
        String address,
        String city,
        Integer totalTickets,
        BigDecimal price,
        Integer availableTickets,
        EventStatus status,
        Long organizerId
) {
    public InternalEventResponse(
            Long id,
            String title,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer totalTickets,
            BigDecimal price,
            Integer availableTickets,
            EventStatus status,
            Long organizerId
    ) {
        this(id, title, startTime, endTime, null, null, null, null, totalTickets, price, availableTickets, status, organizerId);
    }
}
