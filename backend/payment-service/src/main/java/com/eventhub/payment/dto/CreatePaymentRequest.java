package com.eventhub.payment.dto;

import com.eventhub.payment.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record CreatePaymentRequest(
        @NotNull Long bookingId,
        PaymentMethod method
) {
}
