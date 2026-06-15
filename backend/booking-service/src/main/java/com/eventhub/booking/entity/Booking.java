package com.eventhub.booking.entity;

import com.eventhub.booking.enums.BookingStatus;
import com.eventhub.booking.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "bookings",
        indexes = {
                @Index(name = "idx_bookings_ticket_code", columnList = "ticket_code", unique = true)
        }
)
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String bookingCode;

    @Column(name = "ticket_code", nullable = false, unique = true, length = 40)
    private String ticketCode;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long eventId;

    @Column(nullable = false, length = 150)
    private String eventTitle;

    @Column(name = "event_image_url", length = 1000)
    private String eventImageUrl;

    @Column(name = "event_start_time")
    private LocalDateTime eventStartTime;

    @Column(name = "event_end_time")
    private LocalDateTime eventEndTime;

    @Column(name = "event_location", length = 150)
    private String eventLocation;

    @Column(name = "event_address", length = 255)
    private String eventAddress;

    @Column(name = "event_city", length = 100)
    private String eventCity;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal ticketPrice;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus paymentStatus;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime cancelledAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (bookingCode == null) {
            bookingCode = generateBookingCode(createdAt);
        }
        if (ticketCode == null) {
            ticketCode = generateTicketCode(createdAt);
        }
        if (status == null) {
            status = BookingStatus.CONFIRMED;
        }
        if (paymentStatus == null) {
            paymentStatus = PaymentStatus.UNPAID;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    private String generateBookingCode(LocalDateTime time) {
        String date = time.format(DateTimeFormatter.BASIC_ISO_DATE);
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "EH-" + date + "-" + suffix;
    }

    public static String generateTicketCode(LocalDateTime time) {
        String date = time.format(DateTimeFormatter.BASIC_ISO_DATE);
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "EH-TK-" + date + "-" + suffix;
    }
}
