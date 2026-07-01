package com.eventhub.booking.entity;

import com.eventhub.booking.enums.TicketResaleListingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "ticket_resale_listings",
        indexes = {
                @Index(name = "idx_ticket_resale_listings_seller_id", columnList = "seller_id"),
                @Index(name = "idx_ticket_resale_listings_status", columnList = "status"),
                @Index(name = "idx_ticket_resale_listings_ticket_asset_id", columnList = "ticket_asset_id")
        }
)
public class TicketResaleListing {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ticket_asset_id", nullable = false)
    private UUID ticketAssetId;

    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TicketResaleListingStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) {
            status = TicketResaleListingStatus.ACTIVE;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
