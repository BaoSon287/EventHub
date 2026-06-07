package com.eventhub.booking.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record BookingRequest(
        @NotNull Long userId,
        @NotNull Long eventId,
        @NotNull @Positive Integer quantity,
        @NotNull @PositiveOrZero BigDecimal totalPrice
) {
}
