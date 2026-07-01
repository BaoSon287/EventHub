package com.eventhub.booking.repository;

import com.eventhub.booking.entity.TicketResaleListing;
import com.eventhub.booking.enums.TicketResaleListingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketResaleListingRepository extends JpaRepository<TicketResaleListing, UUID> {
    Optional<TicketResaleListing> findByTicketAssetIdAndStatus(UUID ticketAssetId, TicketResaleListingStatus status);
    boolean existsByTicketAssetIdAndStatus(UUID ticketAssetId, TicketResaleListingStatus status);
    List<TicketResaleListing> findByStatusOrderByCreatedAtDesc(TicketResaleListingStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select listing from TicketResaleListing listing where listing.id = :id")
    Optional<TicketResaleListing> findLockedById(UUID id);
}
