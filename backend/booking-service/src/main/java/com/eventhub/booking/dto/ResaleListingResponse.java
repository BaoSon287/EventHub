package com.eventhub.booking.dto;

import com.eventhub.booking.enums.TicketResaleListingStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record ResaleListingResponse(
        UUID listingId,
        UUID ticketAssetId,
        Long ticketId,
        BigDecimal price,
        TicketResaleListingStatus status
) {
}
