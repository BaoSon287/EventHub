package com.eventhub.booking.controller;

import com.eventhub.booking.dto.BookingRequest;
import com.eventhub.booking.entity.Booking;
import com.eventhub.booking.service.BookingService;
import com.eventhub.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService service;

    public BookingController(BookingService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Booking service is running", "OK");
    }

    @PostMapping
    public ApiResponse<Booking> create(@Valid @RequestBody BookingRequest request) {
        return ApiResponse.success("Booking created", service.create(request));
    }

    @GetMapping("/user/{userId}")
    public ApiResponse<List<Booking>> findByUser(@PathVariable Long userId) {
        return ApiResponse.success("Bookings loaded", service.findByUserId(userId));
    }
}
