package com.eventhub.booking.dto;

import java.math.BigDecimal;

public record InternalEventResponse(
        Long id,
        String title,
        BigDecimal price,
        Integer availableTickets,
        String status,
        Long organizerId
) {
}
