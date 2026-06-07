package com.eventhub.payment.entity;

import com.eventhub.payment.enums.PaymentMethod;
import com.eventhub.payment.enums.PaymentTransactionStatus;
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
@Table(name = "payment_transactions")
public class PaymentTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String paymentCode;

    @Column(nullable = false)
    private Long bookingId;

    @Column(nullable = false, length = 32)
    private String bookingCode;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMethod method;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentTransactionStatus status;

    @Column(nullable = false, length = 30)
    private String provider;

    @Column(length = 64)
    private String providerTransactionId;

    @Column(length = 255)
    private String failureReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime paidAt;
    private LocalDateTime failedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (paymentCode == null) {
            paymentCode = generatePaymentCode(createdAt);
        }
        if (method == null) {
            method = PaymentMethod.MOCK;
        }
        if (status == null) {
            status = PaymentTransactionStatus.PENDING;
        }
        if (provider == null) {
            provider = "MOCK";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    private String generatePaymentCode(LocalDateTime time) {
        String date = time.format(DateTimeFormatter.BASIC_ISO_DATE);
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "PAY-" + date + "-" + suffix;
    }
}
