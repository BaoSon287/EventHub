package com.eventhub.notification.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentSucceededEvent(
        Long paymentId,
        String paymentCode,
        Long bookingId,
        String bookingCode,
        Long userId,
        String userEmail,
        BigDecimal amount,
        String method,
        LocalDateTime paidAt
) {
}
