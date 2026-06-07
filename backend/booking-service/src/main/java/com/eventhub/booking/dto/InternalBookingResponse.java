package com.eventhub.booking.dto;

import com.eventhub.booking.enums.BookingStatus;
import com.eventhub.booking.enums.PaymentStatus;

import java.math.BigDecimal;

public record InternalBookingResponse(
        Long id,
        String bookingCode,
        Long userId,
        Long eventId,
        String eventTitle,
        Integer quantity,
        BigDecimal totalPrice,
        BookingStatus status,
        PaymentStatus paymentStatus
) {
}
