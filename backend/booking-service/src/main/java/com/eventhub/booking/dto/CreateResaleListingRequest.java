package com.eventhub.booking.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateResaleListingRequest(
        @NotNull
        @DecimalMin(value = "0.01", message = "price must be greater than 0")
        BigDecimal price
) {
}
