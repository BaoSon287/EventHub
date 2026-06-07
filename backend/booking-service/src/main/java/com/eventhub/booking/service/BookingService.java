package com.eventhub.booking.service;

import com.eventhub.booking.dto.BookingRequest;
import com.eventhub.booking.entity.Booking;
import com.eventhub.booking.entity.BookingStatus;
import com.eventhub.booking.repository.BookingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookingService {
    private final BookingRepository repository;

    public BookingService(BookingRepository repository) {
        this.repository = repository;
    }

    public Booking create(BookingRequest request) {
        return repository.save(Booking.builder()
                .userId(request.userId())
                .eventId(request.eventId())
                .quantity(request.quantity())
                .totalPrice(request.totalPrice())
                .status(BookingStatus.PENDING)
                .build());
    }

    public List<Booking> findByUserId(Long userId) {
        return repository.findByUserId(userId);
    }
}
