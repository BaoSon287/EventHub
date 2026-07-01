package com.eventhub.booking.dto;

import com.eventhub.booking.enums.TicketResaleListingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ResaleTicketDetailResponse(
        UUID listingId,
        Long eventId,
        String eventName,
        LocalDateTime eventDate,
        String location,
        String seat,
        BigDecimal price,
        String sellerName,
        TicketResaleListingStatus status
) {
}
