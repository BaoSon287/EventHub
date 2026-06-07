package com.eventhub.booking.messaging;

import com.eventhub.booking.entity.Booking;
import com.eventhub.booking.security.CustomUserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class BookingEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(BookingEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final String exchange;
    private final String bookingCreatedRoutingKey;
    private final String bookingCancelledRoutingKey;

    public BookingEventPublisher(
            RabbitTemplate rabbitTemplate,
            @Value("${eventhub.rabbitmq.exchange}") String exchange,
            @Value("${eventhub.rabbitmq.routing-keys.booking-created}") String bookingCreatedRoutingKey,
            @Value("${eventhub.rabbitmq.routing-keys.booking-cancelled}") String bookingCancelledRoutingKey
    ) {
        this.rabbitTemplate = rabbitTemplate;
        this.exchange = exchange;
        this.bookingCreatedRoutingKey = bookingCreatedRoutingKey;
        this.bookingCancelledRoutingKey = bookingCancelledRoutingKey;
    }

    public void publishBookingCreated(Booking booking, CustomUserPrincipal principal) {
        try {
            BookingCreatedEvent event = new BookingCreatedEvent(
                    booking.getId(),
                    booking.getBookingCode(),
                    booking.getUserId(),
                    principal.email(),
                    booking.getEventId(),
                    booking.getEventTitle(),
                    booking.getQuantity(),
                    booking.getTotalPrice(),
                    booking.getPaymentStatus().name(),
                    booking.getCreatedAt()
            );
            rabbitTemplate.convertAndSend(exchange, bookingCreatedRoutingKey, event);
            log.info("Published booking.created event for bookingCode={}", booking.getBookingCode());
        } catch (Exception ex) {
            log.warn("Failed to publish booking.created event, bookingCode={}", booking.getBookingCode(), ex);
        }
    }

    public void publishBookingCancelled(Booking booking, CustomUserPrincipal principal) {
        try {
            BookingCancelledEvent event = new BookingCancelledEvent(
                    booking.getId(),
                    booking.getBookingCode(),
                    booking.getUserId(),
                    principal.email(),
                    booking.getEventId(),
                    booking.getEventTitle(),
                    booking.getQuantity(),
                    booking.getTotalPrice(),
                    booking.getCancelledAt()
            );
            rabbitTemplate.convertAndSend(exchange, bookingCancelledRoutingKey, event);
            log.info("Published booking.cancelled event for bookingCode={}", booking.getBookingCode());
        } catch (Exception ex) {
            log.warn("Failed to publish booking.cancelled event, bookingCode={}", booking.getBookingCode(), ex);
        }
    }
}
