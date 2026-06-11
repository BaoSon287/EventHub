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
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setCategory(request.category());
        event.setLocation(request.location());
        event.setAddress(request.address());
        event.setCity(request.city());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        event.setTotalTickets(request.totalTickets());
        event.setAvailableTickets(request.availableTickets());
        event.setPrice(request.price());
        event.setImageUrl(request.imageUrl());
        if (request.status() != null) {
            event.setStatus(request.status());
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
                event.getPrice(),
                event.getAvailableTickets(),
                event.getStatus(),
                event.getOrganizerId()
        );
    }
}
