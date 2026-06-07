package com.eventhub.payment.repository;

import com.eventhub.payment.entity.PaymentTransaction;
import com.eventhub.payment.enums.PaymentTransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByPaymentCode(String paymentCode);
    Page<PaymentTransaction> findByUserId(Long userId, Pageable pageable);
    Page<PaymentTransaction> findByUserIdAndStatus(Long userId, PaymentTransactionStatus status, Pageable pageable);
    Page<PaymentTransaction> findByBookingId(Long bookingId, Pageable pageable);
    boolean existsByBookingIdAndStatus(Long bookingId, PaymentTransactionStatus status);
    boolean existsByPaymentCode(String paymentCode);
}
