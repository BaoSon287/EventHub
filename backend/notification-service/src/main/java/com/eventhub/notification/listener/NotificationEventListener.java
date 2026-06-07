package com.eventhub.notification.listener;

import com.eventhub.notification.dto.BookingCancelledEvent;
import com.eventhub.notification.dto.BookingCreatedEvent;
import com.eventhub.notification.dto.NotificationResponse;
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
}
