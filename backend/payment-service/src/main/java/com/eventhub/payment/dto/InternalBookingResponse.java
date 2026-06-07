package com.eventhub.payment.dto;

import java.math.BigDecimal;

public record InternalBookingResponse(
        Long id,
        String bookingCode,
        Long userId,
        Long eventId,
        String eventTitle,
        Integer quantity,
        BigDecimal totalPrice,
        String status,
        String paymentStatus
) {
}
