package com.eventhub.payment.mapper;

import com.eventhub.payment.dto.PaymentResponse;
import com.eventhub.payment.entity.PaymentTransaction;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {
    public PaymentResponse toResponse(PaymentTransaction payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getPaymentCode(),
                payment.getBookingId(),
                payment.getBookingCode(),
                payment.getUserId(),
                payment.getAmount(),
                payment.getMethod(),
                payment.getStatus(),
                payment.getProvider(),
                payment.getProviderTransactionId(),
                payment.getFailureReason(),
                payment.getCreatedAt(),
                payment.getUpdatedAt(),
                payment.getPaidAt(),
                payment.getFailedAt()
        );
    }
}
