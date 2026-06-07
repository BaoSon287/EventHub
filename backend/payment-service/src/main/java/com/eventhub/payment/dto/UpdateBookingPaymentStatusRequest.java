package com.eventhub.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateBookingPaymentStatusRequest(
        @NotBlank String paymentStatus,
        String paymentCode
) {
}
