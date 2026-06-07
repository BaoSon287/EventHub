package com.eventhub.notification.listener;

import com.eventhub.notification.dto.BookingCancelledEvent;
import com.eventhub.notification.dto.BookingCreatedEvent;
import com.eventhub.notification.dto.NotificationResponse;
import com.eventhub.notification.dto.PaymentFailedEvent;
import com.eventhub.notification.dto.PaymentSucceededEvent;
import com.eventhub.notification.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventListener {
    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationService notificationService;

    public NotificationEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @RabbitListener(queues = "${eventhub.rabbitmq.queues.booking-created}")
    public void handleBookingCreatedEvent(BookingCreatedEvent event) {
        try {
            log.info("Received booking.created event for bookingCode={}", event.bookingCode());
            NotificationResponse response = notificationService.createBookingCreatedNotification(event);
            log.info("Saved booking.created notification id={} for bookingCode={}", response.id(), event.bookingCode());
        } catch (Exception ex) {
            log.error("Failed to process booking.created event for bookingCode={}", event.bookingCode(), ex);
        }
    }

    @RabbitListener(queues = "${eventhub.rabbitmq.queues.booking-cancelled}")
    public void handleBookingCancelledEvent(BookingCancelledEvent event) {
        try {
            log.info("Received booking.cancelled event for bookingCode={}", event.bookingCode());
            NotificationResponse response = notificationService.createBookingCancelledNotification(event);
            log.info("Saved booking.cancelled notification id={} for bookingCode={}", response.id(), event.bookingCode());
        } catch (Exception ex) {
            log.error("Failed to process booking.cancelled event for bookingCode={}", event.bookingCode(), ex);
        }
    }

    @RabbitListener(queues = "${eventhub.rabbitmq.queues.payment-succeeded}")
    public void handlePaymentSucceededEvent(PaymentSucceededEvent event) {
        try {
            log.info("Received payment.succeeded event for paymentCode={}", event.paymentCode());
            NotificationResponse response = notificationService.createPaymentSucceededNotification(event);
            log.info("Saved payment.succeeded notification id={} for paymentCode={}", response.id(), event.paymentCode());
        } catch (Exception ex) {
            log.error("Failed to process payment.succeeded event for paymentCode={}", event.paymentCode(), ex);
        }
    }

    @RabbitListener(queues = "${eventhub.rabbitmq.queues.payment-failed}")
    public void handlePaymentFailedEvent(PaymentFailedEvent event) {
        try {
            log.info("Received payment.failed event for paymentCode={}", event.paymentCode());
            NotificationResponse response = notificationService.createPaymentFailedNotification(event);
            log.info("Saved payment.failed notification id={} for paymentCode={}", response.id(), event.paymentCode());
        } catch (Exception ex) {
            log.error("Failed to process payment.failed event for paymentCode={}", event.paymentCode(), ex);
        }
    }
}
