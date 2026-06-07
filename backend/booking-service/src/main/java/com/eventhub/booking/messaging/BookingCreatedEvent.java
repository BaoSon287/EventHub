package com.eventhub.booking.messaging;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingCreatedEvent(
        Long bookingId,
        String bookingCode,
        Long userId,
        String userEmail,
        Long eventId,
        String eventTitle,
        Integer quantity,
        BigDecimal totalPrice,
        String paymentStatus,
        LocalDateTime createdAt
) {
}
