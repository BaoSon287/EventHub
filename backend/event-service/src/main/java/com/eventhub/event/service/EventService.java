package com.eventhub.event.service;

import com.eventhub.common.exception.BadRequestException;
import com.eventhub.common.exception.ResourceNotFoundException;
import com.eventhub.event.dto.CreateEventRequest;
import com.eventhub.event.dto.EventResponse;
import com.eventhub.event.dto.EventSearchCriteria;
import com.eventhub.event.dto.InternalEventResponse;
import com.eventhub.event.dto.PageResponse;
import com.eventhub.event.dto.TicketQuantityRequest;
import com.eventhub.event.dto.UpdateEventRequest;
import com.eventhub.event.entity.Event;
import com.eventhub.event.entity.EventStatus;
import com.eventhub.event.mapper.EventMapper;
import com.eventhub.event.repository.EventRepository;
import com.eventhub.event.repository.EventSpecification;
import com.eventhub.event.security.CustomUserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
public class EventService {
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("startTime", "price", "createdAt");

    private final EventRepository repository;
    private final EventMapper mapper;

    public EventService(EventRepository repository, EventMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public PageResponse<EventResponse> search(EventSearchCriteria criteria, int page, int size, String sortBy, String sortDir) {
        EventSearchCriteria effectiveCriteria = criteria.status() == null
                ? new EventSearchCriteria(
                        criteria.keyword(),
                        criteria.category(),
                        criteria.city(),
                        criteria.minPrice(),
                        criteria.maxPrice(),
                        criteria.startDate(),
                        criteria.endDate(),
                        EventStatus.PUBLISHED
                )
                : criteria;
        Page<Event> events = repository.findAll(EventSpecification.filter(effectiveCriteria), pageable(page, size, sortBy, sortDir));
        return toPageResponse(events);
    }

    public EventResponse findById(Long id) {
        return mapper.toResponse(getEvent(id));
    }

    public EventResponse create(CreateEventRequest request, CustomUserPrincipal principal) {
        requireOrganizerOrAdmin(principal);
        validateTimeRange(request.startTime(), request.endTime());
        Event event = mapper.toEntity(request, principal);
        validatePublishable(event);
        return mapper.toResponse(repository.save(event));
    }

    public EventResponse update(Long id, UpdateEventRequest request, CustomUserPrincipal principal) {
        Event event = getEvent(id);
        requireOwnerOrAdmin(event, principal);
        validateTimeRange(request.startTime(), request.endTime());
        validateTicketCounts(request.totalTickets(), request.availableTickets());
        mapper.update(event, request);
        validatePublishable(event);
        return mapper.toResponse(repository.save(event));
    }

    public void cancel(Long id, CustomUserPrincipal principal) {
        Event event = getEvent(id);
        requireOwnerOrAdmin(event, principal);
        event.setStatus(EventStatus.CANCELLED);
        repository.save(event);
    }

    public EventResponse publish(Long id, CustomUserPrincipal principal) {
        Event event = getEvent(id);
        requireOwnerOrAdmin(event, principal);
        event.setStatus(EventStatus.PUBLISHED);
        validatePublishable(event);
        return mapper.toResponse(repository.save(event));
    }

    public EventResponse cancelAndReturn(Long id, CustomUserPrincipal principal) {
        Event event = getEvent(id);
        requireOwnerOrAdmin(event, principal);
        event.setStatus(EventStatus.CANCELLED);
        return mapper.toResponse(repository.save(event));
    }

    public PageResponse<EventResponse> findByOrganizer(Long organizerId, EventStatus status, int page, int size, CustomUserPrincipal principal) {
        if (!principal.isAdmin() && !principal.userId().equals(organizerId)) {
            throw new AccessDeniedException("Organizer can only view own events");
        }
        Pageable pageable = pageable(page, size, "createdAt", "desc");
        Page<Event> events = status == null
                ? repository.findByOrganizerId(organizerId, pageable)
                : repository.findByOrganizerIdAndStatus(organizerId, status, pageable);
        return toPageResponse(events);
    }

    public InternalEventResponse findInternalById(Long id) {
        return mapper.toInternalResponse(getEvent(id));
    }

    @Transactional
    public InternalEventResponse reserveTickets(Long id, TicketQuantityRequest request) {
        Event event = getEventForUpdate(id);
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BadRequestException("Only published events can be booked");
        }
        if (event.getAvailableTickets() < request.quantity()) {
            throw new BadRequestException("Not enough tickets available");
        }
        event.setAvailableTickets(event.getAvailableTickets() - request.quantity());
        return mapper.toInternalResponse(repository.save(event));
    }

    @Transactional
    public InternalEventResponse releaseTickets(Long id, TicketQuantityRequest request) {
        Event event = getEventForUpdate(id);
        int restoredTickets = event.getAvailableTickets() + request.quantity();
        if (restoredTickets > event.getTotalTickets()) {
            throw new BadRequestException("availableTickets cannot be greater than totalTickets");
        }
        event.setAvailableTickets(restoredTickets);
        return mapper.toInternalResponse(repository.save(event));
    }

    private Event getEvent(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
    }

    private Event getEventForUpdate(Long id) {
        return repository.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
    }

    private Pageable pageable(int page, int size, String sortBy, String sortDir) {
        String field = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "startTime";
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(direction, field));
    }

    private PageResponse<EventResponse> toPageResponse(Page<Event> page) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper::toResponse).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    private void requireOrganizerOrAdmin(CustomUserPrincipal principal) {
        if (!principal.isOrganizer() && !principal.isAdmin()) {
            throw new AccessDeniedException("Only ORGANIZER or ADMIN can manage events");
        }
    }

    private void requireOwnerOrAdmin(Event event, CustomUserPrincipal principal) {
        if (!principal.isAdmin() && !event.getOrganizerId().equals(principal.userId())) {
            throw new AccessDeniedException("Only event organizer or ADMIN can manage this event");
        }
    }

    private void validateTimeRange(java.time.LocalDateTime startTime, java.time.LocalDateTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("startTime must be before endTime");
        }
    }

    private void validateTicketCounts(Integer totalTickets, Integer availableTickets) {
        if (availableTickets > totalTickets) {
            throw new BadRequestException("availableTickets cannot be greater than totalTickets");
        }
    }

    private void validatePublishable(Event event) {
        validateTicketCounts(event.getTotalTickets(), event.getAvailableTickets());
        if (event.getStatus() == EventStatus.PUBLISHED
                && (event.getTitle() == null || event.getTitle().isBlank()
                || event.getStartTime() == null
                || event.getEndTime() == null
                || event.getTotalTickets() == null)) {
            throw new BadRequestException("Cannot publish event with missing title, time, or ticket information");
        }
    }
}
