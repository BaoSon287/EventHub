package com.eventhub.payment.dto;

import com.eventhub.payment.enums.PaymentMethod;
import com.eventhub.payment.enums.PaymentTransactionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        String paymentCode,
        Long bookingId,
        String bookingCode,
        Long userId,
        BigDecimal amount,
        PaymentMethod method,
        PaymentTransactionStatus status,
        String provider,
        String providerTransactionId,
        String failureReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime paidAt,
        LocalDateTime failedAt
) {
}
