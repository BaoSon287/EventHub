package com.eventhub.booking.controller;

import com.eventhub.booking.dto.InternalBookingResponse;
import com.eventhub.booking.dto.UpdateBookingPaymentStatusRequest;
import com.eventhub.booking.service.BookingService;
import com.eventhub.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings/internal")
public class InternalBookingController {
    private final BookingService service;

    public InternalBookingController(BookingService service) {
        this.service = service;
    }

    @GetMapping("/{bookingId}")
    public ApiResponse<InternalBookingResponse> findInternalBooking(@PathVariable Long bookingId) {
        return ApiResponse.success("Get internal booking successfully", service.findInternalBooking(bookingId));
    }

    @PatchMapping("/{bookingId}/payment-status")
    public ApiResponse<InternalBookingResponse> updatePaymentStatus(
            @PathVariable Long bookingId,
            @Valid @RequestBody UpdateBookingPaymentStatusRequest request
    ) {
        return ApiResponse.success("Update booking payment status successfully", service.updatePaymentStatus(bookingId, request));
    }
}
