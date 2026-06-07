package com.eventhub.booking.dto;

import com.eventhub.booking.enums.BookingStatus;
import com.eventhub.booking.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingResponse(
        Long id,
        String bookingCode,
        Long userId,
        Long eventId,
        String eventTitle,
        Integer quantity,
        BigDecimal ticketPrice,
        BigDecimal totalPrice,
        BookingStatus status,
        PaymentStatus paymentStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime cancelledAt
) {
}
