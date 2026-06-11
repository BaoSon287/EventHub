package com.eventhub.event.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "events")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 2000)
    private String description;

    private String category;
    private String location;
    private String address;
    private String city;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer totalTickets;
    private Integer availableTickets;
    private BigDecimal price;
    private String imageUrl;
    private Long organizerId;
    private String organizerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private EventStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) {
            status = EventStatus.DRAFT;
        }
        if (availableTickets == null && totalTickets != null) {
            availableTickets = totalTickets;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
