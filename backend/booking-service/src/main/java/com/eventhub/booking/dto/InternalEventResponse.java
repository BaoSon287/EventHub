package com.eventhub.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record InternalEventResponse(
        Long id,
        String title,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer totalTickets,
        BigDecimal price,
        Integer availableTickets,
        String status,
        Long organizerId
) {
}
