package com.eventhub.booking.dto;

import com.eventhub.booking.enums.TicketTransferAction;

import java.time.LocalDateTime;
import java.util.UUID;

public record TicketTransferHistoryResponse(
        UUID id,
        UUID ticketAssetId,
        Long fromUserId,
        Long toUserId,
        TicketTransferAction action,
        LocalDateTime createdAt
) {
}
