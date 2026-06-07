package com.eventhub.event.dto;

import com.eventhub.event.entity.EventStatus;

import java.math.BigDecimal;

public record InternalEventResponse(
        Long id,
        String title,
        BigDecimal price,
        Integer availableTickets,
        EventStatus status,
        Long organizerId
) {
}
