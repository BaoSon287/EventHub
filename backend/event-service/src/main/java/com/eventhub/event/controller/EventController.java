package com.eventhub.event.controller;

import com.eventhub.common.dto.ApiResponse;
import com.eventhub.event.dto.EventRequest;
import com.eventhub.event.entity.Event;
import com.eventhub.event.service.EventService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService service;

    public EventController(EventService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Event service is running", "OK");
    }

    @GetMapping
    public ApiResponse<List<Event>> findAll() {
        return ApiResponse.success("Events loaded", service.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Event> findById(@PathVariable Long id) {
        return ApiResponse.success("Event found", service.findById(id));
    }

    @PostMapping
    public ApiResponse<Event> create(@Valid @RequestBody EventRequest request) {
        return ApiResponse.success("Event created", service.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<Event> update(@PathVariable Long id, @Valid @RequestBody EventRequest request) {
        return ApiResponse.success("Event updated", service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success("Event deleted", null);
    }
}
