package com.eventhub.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MockPaymentResultRequest(
        @NotBlank @Size(max = 255) String failureReason
) {
}
