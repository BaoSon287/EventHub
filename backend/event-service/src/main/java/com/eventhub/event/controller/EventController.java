package com.eventhub.event.controller;

import com.eventhub.common.dto.ApiResponse;
import com.eventhub.event.dto.CreateEventRequest;
import com.eventhub.event.dto.EventResponse;
import com.eventhub.event.dto.EventSearchCriteria;
import com.eventhub.event.dto.PageResponse;
import com.eventhub.event.dto.UpdateEventRequest;
import com.eventhub.event.entity.EventStatus;
import com.eventhub.event.security.CustomUserPrincipal;
import com.eventhub.event.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Tag(name = "EventController", description = "Public event APIs, organizer event APIs, and admin event capabilities")
@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService service;

    public EventController(EventService service) {
        this.service = service;
    }

    @Operation(summary = "Event service health check")
    @GetMapping("/health")
    public ApiResponse<Void> health() {
        return ApiResponse.success("Event service is running", null);
    }

    @Operation(summary = "Search public events with pagination and filters")
    @GetMapping
    public ApiResponse<PageResponse<EventResponse>> search(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "city", required = false) String city,
            @RequestParam(name = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(name = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(name = "status", required = false) EventStatus status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sortBy", defaultValue = "startTime") String sortBy,
            @RequestParam(name = "sortDir", defaultValue = "asc") String sortDir
    ) {
        EventSearchCriteria criteria = new EventSearchCriteria(keyword, category, city, minPrice, maxPrice, startDate, endDate, status);
        return ApiResponse.success("Get events successfully", service.search(criteria, page, size, sortBy, sortDir));
    }

    @Operation(summary = "Get event details")
    @GetMapping("/{id}")
    public ApiResponse<EventResponse> findById(@PathVariable("id") Long id) {
        return ApiResponse.success("Get event successfully", service.findById(id));
    }

    @Operation(summary = "Create event as ORGANIZER or ADMIN")
    @PostMapping
    public ApiResponse<EventResponse> create(
            @Valid @RequestBody CreateEventRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Create event successfully", service.create(request, principal));
    }

    @Operation(summary = "Update event as owner organizer or ADMIN")
    @PutMapping("/{id}")
    public ApiResponse<EventResponse> update(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateEventRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Update event successfully", service.update(id, request, principal));
    }

    @Operation(summary = "Soft delete event by switching it to CANCELLED")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable("id") Long id, @AuthenticationPrincipal CustomUserPrincipal principal) {
        service.cancel(id, principal);
        return ApiResponse.success("Cancel event successfully", null);
    }

    @Operation(summary = "List events owned by organizer")
    @GetMapping("/organizer/{organizerId}")
    public ApiResponse<PageResponse<EventResponse>> findByOrganizer(
            @PathVariable("organizerId") Long organizerId,
            @RequestParam(name = "status", required = false) EventStatus status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return ApiResponse.success("Get organizer events successfully", service.findByOrganizer(organizerId, status, page, size, principal));
    }

    @Operation(summary = "Publish draft event")
    @PatchMapping("/{id}/publish")
    public ApiResponse<EventResponse> publish(@PathVariable("id") Long id, @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ApiResponse.success("Publish event successfully", service.publish(id, principal));
    }

    @Operation(summary = "Cancel event")
    @PatchMapping("/{id}/cancel")
    public ApiResponse<EventResponse> cancel(@PathVariable("id") Long id, @AuthenticationPrincipal CustomUserPrincipal principal) {
        return ApiResponse.success("Cancel event successfully", service.cancelAndReturn(id, principal));
    }
}
