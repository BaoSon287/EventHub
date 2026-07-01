package com.eventhub.booking.entity;

import com.eventhub.booking.enums.TicketAssetStatus;
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
        name = "ticket_assets",
        indexes = {
                @Index(name = "idx_ticket_assets_owner_id", columnList = "owner_id"),
                @Index(name = "idx_ticket_assets_event_id", columnList = "event_id"),
                @Index(name = "idx_ticket_assets_status", columnList = "status")
        }
)
public class TicketAsset {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ticket_id", nullable = false, unique = true)
    private Long ticketId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "original_buyer_id", nullable = false)
    private Long originalBuyerId;

    @Column(name = "ticket_code", unique = true, length = 40)
    private String ticketCode;

    @Column(name = "qr_code", columnDefinition = "TEXT")
    private String qrCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketAssetStatus status;

    @Column(name = "purchase_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "event_name", nullable = false, length = 150)
    private String eventName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) {
            status = TicketAssetStatus.OWNED;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
