package com.eventhub.booking.mapper;

import com.eventhub.booking.dto.BookingResponse;
import com.eventhub.booking.entity.Booking;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {
    public BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getId(),
                booking.getBookingCode(),
                booking.getTicketCode(),
                booking.getTicketCode() == null ? null : "EVENTHUB_TICKET:" + booking.getTicketCode(),
                booking.getUserId(),
                booking.getEventId(),
                booking.getEventTitle(),
                booking.getEventImageUrl(),
                booking.getEventStartTime(),
                booking.getEventEndTime(),
                booking.getEventLocation(),
                booking.getEventAddress(),
                booking.getEventCity(),
                booking.getQuantity(),
                booking.getTicketPrice(),
                booking.getTotalPrice(),
                booking.getTotalPrice(),
                booking.getStatus(),
                booking.getStatus(),
                booking.getPaymentStatus(),
                booking.getCreatedAt(),
                booking.getUpdatedAt(),
                booking.getCancelledAt()
        );
    }
}
