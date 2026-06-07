package com.eventhub.booking.dto;

import com.eventhub.booking.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateBookingPaymentStatusRequest(
        @NotNull PaymentStatus paymentStatus,
        String paymentCode
) {
}
