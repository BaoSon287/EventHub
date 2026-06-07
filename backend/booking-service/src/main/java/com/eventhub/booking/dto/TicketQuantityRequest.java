package com.eventhub.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record TicketQuantityRequest(
        @NotNull @Min(1) Integer quantity
) {
}
