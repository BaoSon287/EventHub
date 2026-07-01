package com.eventhub.booking.repository;

import com.eventhub.booking.entity.TicketTransferHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TicketTransferHistoryRepository extends JpaRepository<TicketTransferHistory, UUID> {
    List<TicketTransferHistory> findByTicketAssetIdOrderByCreatedAtDesc(UUID ticketAssetId);
}
