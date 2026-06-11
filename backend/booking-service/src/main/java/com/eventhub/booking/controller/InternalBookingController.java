package com.eventhub.booking.controller;

import com.eventhub.booking.dto.InternalBookingResponse;
import com.eventhub.booking.dto.UpdateBookingPaymentStatusRequest;
import com.eventhub.booking.security.InternalApiKeyValidator;
import com.eventhub.booking.service.BookingService;
import com.eventhub.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings/internal")
public class InternalBookingController {
    private final BookingService service;
    private final InternalApiKeyValidator internalApiKeyValidator;

    public InternalBookingController(BookingService service, InternalApiKeyValidator internalApiKeyValidator) {
        this.service = service;
        this.internalApiKeyValidator = internalApiKeyValidator;
    }

    @GetMapping("/{bookingId}")
    public ApiResponse<InternalBookingResponse> findInternalBooking(
            @PathVariable("bookingId") Long bookingId,
            @RequestHeader(name = "X-Internal-Api-Key", required = false) String internalApiKey
    ) {
        internalApiKeyValidator.requireValid(internalApiKey);
        return ApiResponse.success("Get internal booking successfully", service.findInternalBooking(bookingId));
    }

    @PatchMapping("/{bookingId}/payment-status")
    public ApiResponse<InternalBookingResponse> updatePaymentStatus(
            @PathVariable("bookingId") Long bookingId,
            @Valid @RequestBody UpdateBookingPaymentStatusRequest request,
            @RequestHeader(name = "X-Internal-Api-Key", required = false) String internalApiKey
    ) {
        internalApiKeyValidator.requireValid(internalApiKey);
        return ApiResponse.success("Update booking payment status successfully", service.updatePaymentStatus(bookingId, request));
    }
}
