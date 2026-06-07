package com.eventhub.booking.controller;

import com.eventhub.booking.dto.BookingPageResponse;
import com.eventhub.booking.dto.BookingResponse;
import com.eventhub.booking.dto.CreateBookingRequest;
import com.eventhub.booking.enums.BookingStatus;
import com.eventhub.booking.security.CustomUserPrincipal;
import com.eventhub.booking.service.BookingService;
import com.eventhub.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "BookingController", description = "User booking APIs, admin booking APIs, and mock payment API")
@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService service;

    public BookingController(BookingService service) {
        this.service = service;
    }

    @Operation(summary = "Booking service health check")
    @GetMapping("/health")
    public ApiResponse<Void> health() {
        return ApiResponse.success("Booking service is running", null);
    }

    @Operation(summary = "Create booking for current user")
    @PostMapping
    public ApiResponse<BookingResponse> create(
            @Valid @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Create booking successfully", service.create(request, principal));
    }

    @Operation(summary = "Get booking details")
    @GetMapping("/{id}")
    public ApiResponse<BookingResponse> findById(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Get booking successfully", service.findById(id, principal));
    }

    @Operation(summary = "Get current user's bookings")
    @GetMapping("/me")
    public ApiResponse<BookingPageResponse> findMine(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "status", required = false) BookingStatus status,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Get my bookings successfully", service.findMine(page, size, status, principal));
    }

    @Operation(summary = "Get bookings by user")
    @GetMapping("/user/{userId}")
    public ApiResponse<BookingPageResponse> findByUser(
            @PathVariable("userId") Long userId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "status", required = false) BookingStatus status,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Get user bookings successfully", service.findByUserId(userId, page, size, status, principal));
    }

    @Operation(summary = "Get bookings by event")
    @GetMapping("/event/{eventId}")
    public ApiResponse<BookingPageResponse> findByEvent(
            @PathVariable("eventId") Long eventId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "status", required = false) BookingStatus status,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Get event bookings successfully", service.findByEventId(eventId, page, size, status, principal));
    }

    @Operation(summary = "Cancel booking and release tickets")
    @PatchMapping("/{id}/cancel")
    public ApiResponse<BookingResponse> cancel(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Cancel booking successfully", service.cancel(id, principal));
    }

    @Operation(summary = "Mock successful payment")
    @PatchMapping("/{id}/pay/mock")
    public ApiResponse<BookingResponse> payMock(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Mock payment successfully", service.payMock(id, principal));
    }
}
