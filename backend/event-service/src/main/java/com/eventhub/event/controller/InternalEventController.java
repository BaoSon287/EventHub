package com.eventhub.event.controller;

import com.eventhub.common.dto.ApiResponse;
import com.eventhub.event.dto.InternalEventResponse;
import com.eventhub.event.dto.TicketQuantityRequest;
import com.eventhub.event.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "InternalEventController", description = "Internal event APIs used by booking-service")
@RestController
@RequestMapping("/api/events/internal")
public class InternalEventController {
    private final EventService service;

    public InternalEventController(EventService service) {
        this.service = service;
    }

    @Operation(summary = "Get event data needed by booking-service")
    @GetMapping("/{eventId}")
    public ApiResponse<InternalEventResponse> findInternalById(@PathVariable("eventId") Long eventId) {
        return ApiResponse.success("Get internal event successfully", service.findInternalById(eventId));
    }

    @Operation(summary = "Reserve tickets for a booking")
    @PatchMapping("/{eventId}/reserve-tickets")
    public ApiResponse<InternalEventResponse> reserveTickets(
            @PathVariable("eventId") Long eventId,
            @Valid @RequestBody TicketQuantityRequest request
    ) {
        return ApiResponse.success("Reserve tickets successfully", service.reserveTickets(eventId, request));
    }

    @Operation(summary = "Release tickets after booking cancellation")
    @PatchMapping("/{eventId}/release-tickets")
    public ApiResponse<InternalEventResponse> releaseTickets(
            @PathVariable("eventId") Long eventId,
            @Valid @RequestBody TicketQuantityRequest request
    ) {
        return ApiResponse.success("Release tickets successfully", service.releaseTickets(eventId, request));
    }
}
