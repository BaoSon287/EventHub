package com.eventhub.event.service;

import com.eventhub.common.exception.ResourceNotFoundException;
import com.eventhub.event.dto.EventRequest;
import com.eventhub.event.entity.Event;
import com.eventhub.event.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventService {
    private final EventRepository repository;

    public EventService(EventRepository repository) {
        this.repository = repository;
    }

    public List<Event> findAll() {
        return repository.findAll();
    }

    public Event findById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
    }

    public Event create(EventRequest request) {
        return repository.save(toEntity(new Event(), request));
    }

    public Event update(Long id, EventRequest request) {
        return repository.save(toEntity(findById(id), request));
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private Event toEntity(Event event, EventRequest request) {
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setLocation(request.location());
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        event.setTotalTickets(request.totalTickets());
        event.setAvailableTickets(request.availableTickets());
        event.setPrice(request.price());
        event.setOrganizerId(request.organizerId());
        event.setStatus(request.status());
        return event;
    }
}
