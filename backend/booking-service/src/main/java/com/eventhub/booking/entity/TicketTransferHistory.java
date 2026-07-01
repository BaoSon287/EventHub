package com.eventhub.booking.entity;

import com.eventhub.booking.enums.TicketTransferAction;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "ticket_transfer_history",
        indexes = {
                @Index(name = "idx_ticket_transfer_history_ticket_asset_id", columnList = "ticket_asset_id")
        }
)
public class TicketTransferHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ticket_asset_id", nullable = false)
    private UUID ticketAssetId;

    @Column(name = "from_user_id")
    private Long fromUserId;

    @Column(name = "to_user_id")
    private Long toUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TicketTransferAction action;

    @Column(name = "old_qr_code", columnDefinition = "TEXT")
    private String oldQrCode;

    @Column(name = "new_qr_code", columnDefinition = "TEXT")
    private String newQrCode;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
