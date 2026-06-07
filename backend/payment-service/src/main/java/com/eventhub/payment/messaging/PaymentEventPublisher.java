package com.eventhub.payment.messaging;

import com.eventhub.payment.dto.PaymentFailedEvent;
import com.eventhub.payment.dto.PaymentSucceededEvent;
import com.eventhub.payment.entity.PaymentTransaction;
import com.eventhub.payment.security.CustomUserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(PaymentEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final String exchange;
    private final String succeededRoutingKey;
    private final String failedRoutingKey;

    public PaymentEventPublisher(
            RabbitTemplate rabbitTemplate,
            @Value("${eventhub.rabbitmq.exchange}") String exchange,
            @Value("${eventhub.rabbitmq.routing-keys.payment-succeeded}") String succeededRoutingKey,
            @Value("${eventhub.rabbitmq.routing-keys.payment-failed}") String failedRoutingKey
    ) {
        this.rabbitTemplate = rabbitTemplate;
        this.exchange = exchange;
        this.succeededRoutingKey = succeededRoutingKey;
        this.failedRoutingKey = failedRoutingKey;
    }

    public void publishPaymentSucceeded(PaymentTransaction payment, CustomUserPrincipal principal) {
        try {
            PaymentSucceededEvent event = new PaymentSucceededEvent(
                    payment.getId(),
                    payment.getPaymentCode(),
                    payment.getBookingId(),
                    payment.getBookingCode(),
                    payment.getUserId(),
                    principal.email(),
                    payment.getAmount(),
                    payment.getMethod().name(),
                    payment.getPaidAt()
            );
            rabbitTemplate.convertAndSend(exchange, succeededRoutingKey, event);
            log.info("Published payment.succeeded event for paymentCode={}", payment.getPaymentCode());
        } catch (Exception ex) {
            log.warn("Failed to publish payment.succeeded event, paymentCode={}", payment.getPaymentCode(), ex);
        }
    }

    public void publishPaymentFailed(PaymentTransaction payment, CustomUserPrincipal principal) {
        try {
            PaymentFailedEvent event = new PaymentFailedEvent(
                    payment.getId(),
                    payment.getPaymentCode(),
                    payment.getBookingId(),
                    payment.getBookingCode(),
                    payment.getUserId(),
                    principal.email(),
                    payment.getAmount(),
                    payment.getMethod().name(),
                    payment.getFailureReason(),
                    payment.getFailedAt()
            );
            rabbitTemplate.convertAndSend(exchange, failedRoutingKey, event);
            log.info("Published payment.failed event for paymentCode={}", payment.getPaymentCode());
        } catch (Exception ex) {
            log.warn("Failed to publish payment.failed event, paymentCode={}", payment.getPaymentCode(), ex);
        }
    }
}
