package com.eventhub.booking.dto;

import com.eventhub.booking.enums.BookingStatus;
import com.eventhub.booking.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingResponse(
        Long id,
        Long bookingId,
        String bookingCode,
        String ticketCode,
        String qrCodeContent,
        Long userId,
        Long eventId,
        String eventTitle,
        String eventImageUrl,
        LocalDateTime eventStartTime,
        LocalDateTime eventEndTime,
        String eventLocation,
        String eventAddress,
        String eventCity,
        Integer quantity,
        BigDecimal ticketPrice,
        BigDecimal totalPrice,
        BigDecimal totalAmount,
        BookingStatus status,
        BookingStatus bookingStatus,
        PaymentStatus paymentStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime cancelledAt
) {
}
