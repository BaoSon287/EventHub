package com.eventhub.booking.repository;

import com.eventhub.booking.entity.Booking;
import com.eventhub.booking.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    Page<Booking> findByUserId(Long userId, Pageable pageable);
    Page<Booking> findByUserIdAndStatus(Long userId, BookingStatus status, Pageable pageable);
    Page<Booking> findByEventId(Long eventId, Pageable pageable);
    Page<Booking> findByEventIdAndStatus(Long eventId, BookingStatus status, Pageable pageable);
    Optional<Booking> findByBookingCode(String bookingCode);
    boolean existsByBookingCode(String bookingCode);
}
