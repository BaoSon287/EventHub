package com.eventhub.payment.client;

import com.eventhub.payment.dto.BookingApiResponse;
import com.eventhub.payment.dto.InternalBookingResponse;
import com.eventhub.payment.dto.UpdateBookingPaymentStatusRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "booking-service")
public interface BookingServiceClient {
    @GetMapping("/api/bookings/internal/{bookingId}")
    BookingApiResponse<InternalBookingResponse> getInternalBooking(@PathVariable("bookingId") Long bookingId);

    @PatchMapping("/api/bookings/internal/{bookingId}/payment-status")
    BookingApiResponse<InternalBookingResponse> updatePaymentStatus(
            @PathVariable("bookingId") Long bookingId,
            @RequestBody UpdateBookingPaymentStatusRequest request
    );
}
