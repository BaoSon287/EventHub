package com.eventhub.booking.dto;

import com.eventhub.booking.enums.TicketAssetStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record TicketAssetResponse(
        UUID id,
        Long ticketId,
        Long eventId,
        String eventName,
        TicketAssetStatus status,
        String qrCode,
        BigDecimal purchasePrice,
        UUID activeListingId
) {
}
