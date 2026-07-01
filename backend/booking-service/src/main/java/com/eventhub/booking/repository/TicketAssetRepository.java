package com.eventhub.booking.repository;

import com.eventhub.booking.entity.TicketAsset;
import com.eventhub.booking.enums.TicketAssetStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketAssetRepository extends JpaRepository<TicketAsset, UUID> {
    List<TicketAsset> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    Optional<TicketAsset> findByTicketId(Long ticketId);
    boolean existsByTicketId(Long ticketId);
    List<TicketAsset> findByOwnerIdAndStatusOrderByCreatedAtDesc(Long ownerId, TicketAssetStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select asset from TicketAsset asset where asset.id = :id")
    Optional<TicketAsset> findLockedById(UUID id);
}
