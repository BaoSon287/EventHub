package com.eventhub.event.mapper;

import com.eventhub.event.dto.CreateEventRequest;
import com.eventhub.event.dto.EventResponse;
import com.eventhub.event.dto.InternalEventResponse;
import com.eventhub.event.dto.UpdateEventRequest;
import com.eventhub.event.entity.Event;
import com.eventhub.event.entity.EventStatus;
import com.eventhub.event.security.CustomUserPrincipal;
import org.springframework.stereotype.Component;

@Component
public class EventMapper {
    public Event toEntity(CreateEventRequest request, CustomUserPrincipal principal) {
        return Event.builder()
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .location(request.location())
                .address(request.address())
                .city(request.city())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .totalTickets(request.totalTickets())
                .availableTickets(request.totalTickets())
                .price(request.price())
                .imageUrl(request.imageUrl())
                .organizerId(principal.userId())
                .organizerName(principal.email())
                .status(request.status() == null ? EventStatus.DRAFT : request.status())
                .build();
    }

    public void update(Event event, UpdateEventRequest request) {
        if (request.title() != null) {
            event.setTitle(request.title());
        }
        if (request.description() != null) {
            event.setDescription(request.description());
        }
        if (request.category() != null) {
            event.setCategory(request.category());
        }
        if (request.location() != null) {
            event.setLocation(request.location());
        }
        if (request.address() != null) {
            event.setAddress(request.address());
        }
        if (request.city() != null) {
            event.setCity(request.city());
        }
        if (request.startTime() != null) {
            event.setStartTime(request.startTime());
        }
        if (request.endTime() != null) {
            event.setEndTime(request.endTime());
        }
        if (request.totalTickets() != null) {
            event.setTotalTickets(request.totalTickets());
        }
        if (request.price() != null) {
            event.setPrice(request.price());
        }
        if (request.imageUrl() != null) {
            event.setImageUrl(request.imageUrl());
        }
    }

    public EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getCategory(),
                event.getLocation(),
                event.getAddress(),
                event.getCity(),
                event.getStartTime(),
                event.getEndTime(),
                event.getTotalTickets(),
                event.getAvailableTickets(),
                event.getPrice(),
                event.getImageUrl(),
                event.getOrganizerId(),
                event.getOrganizerName(),
                event.getStatus(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }

    public InternalEventResponse toInternalResponse(Event event) {
        return new InternalEventResponse(
                event.getId(),
                event.getTitle(),
                event.getStartTime(),
                event.getEndTime(),
                event.getImageUrl(),
                event.getLocation(),
                event.getAddress(),
                event.getCity(),
                event.getTotalTickets(),
                event.getPrice(),
                event.getAvailableTickets(),
                event.getStatus(),
                event.getOrganizerId()
        );
    }
}
