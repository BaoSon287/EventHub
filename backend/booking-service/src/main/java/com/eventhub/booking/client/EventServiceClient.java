package com.eventhub.booking.client;

import com.eventhub.booking.dto.EventApiResponse;
import com.eventhub.booking.dto.InternalEventResponse;
import com.eventhub.booking.dto.TicketQuantityRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "event-service")
public interface EventServiceClient {
    @GetMapping("/api/events/internal/{eventId}")
    EventApiResponse<InternalEventResponse> getInternalEvent(@PathVariable("eventId") Long eventId);

    @PatchMapping("/api/events/internal/{eventId}/reserve-tickets")
    EventApiResponse<InternalEventResponse> reserveTickets(
            @PathVariable("eventId") Long eventId,
            @RequestBody TicketQuantityRequest request
    );

    @PatchMapping("/api/events/internal/{eventId}/release-tickets")
    EventApiResponse<InternalEventResponse> releaseTickets(
            @PathVariable("eventId") Long eventId,
            @RequestBody TicketQuantityRequest request
    );
}
