package com.eventhub.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ResaleTicketSummaryResponse(
        UUID listingId,
        String eventName,
        LocalDateTime eventDate,
        String location,
        BigDecimal price,
        String sellerName
) {
}
