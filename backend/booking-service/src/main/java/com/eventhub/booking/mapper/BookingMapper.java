package com.eventhub.booking.mapper;

import com.eventhub.booking.dto.BookingResponse;
import com.eventhub.booking.entity.Booking;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {
    public BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getUserId(),
                booking.getEventId(),
                booking.getEventTitle(),
                booking.getQuantity(),
                booking.getTicketPrice(),
                booking.getTotalPrice(),
                booking.getStatus(),
                booking.getPaymentStatus(),
                booking.getCreatedAt(),
                booking.getUpdatedAt(),
                booking.getCancelledAt()
        );
    }
}
