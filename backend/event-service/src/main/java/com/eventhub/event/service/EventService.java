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
import com.eventhub.event.exception.EventConflictException;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    public EventResponse findById(Long id, CustomUserPrincipal principal) {
        Event event = getEvent(id);
        requireViewPermission(event, principal);
        return mapper.toResponse(event);
    }

    @Transactional
    public EventResponse create(CreateEventRequest request, CustomUserPrincipal principal) {
        requireOrganizerOrAdmin(principal);
        validateDraftBasics(request);
        Event event = mapper.toEntity(request, principal);

        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
            throw new BadRequestException("EVENT_INVALID_CREATE_STATUS: Create event status must be DRAFT or PUBLISHED");
        }
        if (event.getStatus() == EventStatus.PUBLISHED) {
            validatePublishable(event);
        }

        return mapper.toResponse(repository.save(event));
    }

    @Transactional
    public EventResponse update(Long id, UpdateEventRequest request, CustomUserPrincipal principal) {
        Event event = getEvent(id);
        requireOwnerOrAdmin(event, principal);
        requireEditable(event);
        validateUpdateBasics(request);
        validateTimeRange(request.startTime(), request.endTime());
        validateReservedTickets(event, request.totalTickets());
        int reservedTickets = reservedTickets(event);
        mapper.update(event, request);
        if (request.totalTickets() != null) {
            event.setAvailableTickets(request.totalTickets() - reservedTickets);
        }
        if (event.getStatus() == EventStatus.PUBLISHED) {
            validatePublishable(event);
        }
        return mapper.toResponse(repository.save(event));
    }

    public void cancel(Long id, CustomUserPrincipal principal) {
        Event event = getEvent(id);
        requireOwnerOrAdmin(event, principal);
        if (event.getStatus() == EventStatus.CANCELLED) {
            return;
        }
        requireTransition(event, EventStatus.CANCELLED);
        event.setStatus(EventStatus.CANCELLED);
        repository.save(event);
    }

    @Transactional
    public void delete(Long id, CustomUserPrincipal principal) {
        Event event = getEvent(id);
        requireOwnerOrAdmin(event, principal);
        requireDeletable(event);
        repository.delete(event);
    }

    public EventResponse publish(Long id, CustomUserPrincipal principal) {
        Event event = getEvent(id);
        requireOwnerOrAdmin(event, principal);
        requireTransition(event, EventStatus.PUBLISHED);
        validatePublishable(event);
        event.setStatus(EventStatus.PUBLISHED);
        return mapper.toResponse(repository.save(event));
    }

    public EventResponse cancelAndReturn(Long id, CustomUserPrincipal principal) {
        Event event = getEvent(id);
        requireOwnerOrAdmin(event, principal);
        if (event.getStatus() == EventStatus.CANCELLED) {
            return mapper.toResponse(event);
        }
        requireTransition(event, EventStatus.CANCELLED);
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
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("EVENT_NOT_FOUND: Event not found"));
    }

    private Event getEventForUpdate(Long id) {
        return repository.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
    }

    private void requireViewPermission(Event event, CustomUserPrincipal principal) {
        if (event.getStatus() == EventStatus.PUBLISHED || event.getStatus() == EventStatus.COMPLETED) {
            return;
        }
        if (principal != null && (principal.isAdmin() || java.util.Objects.equals(event.getOrganizerId(), principal.userId()))) {
            return;
        }
        throw new ResourceNotFoundException("EVENT_NOT_FOUND: Event not found");
    }

    private void requireEditable(Event event) {
        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
            throw new EventConflictException("EVENT_NOT_EDITABLE: " + event.getStatus() + " events cannot be updated");
        }
    }

    private void requireDeletable(Event event) {
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new EventConflictException("EVENT_NOT_DELETABLE: Only DRAFT events can be deleted");
        }
        if (reservedTickets(event) > 0) {
            throw new EventConflictException("EVENT_NOT_DELETABLE: Draft event has ticket reservations");
        }
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
        if (principal == null) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("Unauthorized");
        }
        if (!principal.isOrganizer() && !principal.isAdmin()) {
            throw new AccessDeniedException("EVENT_ACCESS_DENIED: Only ORGANIZER or ADMIN can manage events");
        }
    }

    private void requireOwnerOrAdmin(Event event, CustomUserPrincipal principal) {
        if (principal == null) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("Unauthorized");
        }
        if (!principal.isAdmin() && !event.getOrganizerId().equals(principal.userId())) {
            throw new AccessDeniedException("EVENT_ACCESS_DENIED: Only event organizer or ADMIN can manage this event");
        }
    }

    private void validateTimeRange(java.time.LocalDateTime startTime, java.time.LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            return;
        }
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("startTime must be before endTime");
        }
    }

    private void validateTicketCounts(Integer totalTickets, Integer availableTickets) {
        if (totalTickets == null || availableTickets == null) {
            return;
        }
        if (availableTickets > totalTickets) {
            throw new BadRequestException("availableTickets cannot be greater than totalTickets");
        }
    }

    private void validateUpdateBasics(UpdateEventRequest request) {
        if (request.price() != null && request.price().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("EVENT_INVALID_PRICE: price cannot be negative");
        }
        if (request.totalTickets() != null && request.totalTickets() < 0) {
            throw new BadRequestException("EVENT_INVALID_TICKET_COUNT: totalTickets cannot be negative");
        }
    }

    private void validateReservedTickets(Event event, Integer newTotalTickets) {
        if (newTotalTickets == null) {
            return;
        }
        int reservedTickets = reservedTickets(event);
        if (newTotalTickets < reservedTickets) {
            throw new BadRequestException("EVENT_INVALID_TICKET_COUNT: totalTickets cannot be less than reserved tickets");
        }
    }

    private int reservedTickets(Event event) {
        Integer totalTickets = event.getTotalTickets();
        Integer availableTickets = event.getAvailableTickets();
        if (totalTickets == null || availableTickets == null) {
            return 0;
        }
        return Math.max(totalTickets - availableTickets, 0);
    }

    private void validatePublishable(Event event) {
        if (isBlank(event.getTitle())
                || isBlank(event.getDescription())
                || isBlank(event.getCategory())
                || isBlank(event.getLocation())
                || isBlank(event.getAddress())
                || isBlank(event.getCity())
                || event.getStartTime() == null
                || event.getEndTime() == null
                || event.getTotalTickets() == null
                || event.getAvailableTickets() == null
                || event.getPrice() == null
                || event.getOrganizerId() == null) {
            throw new BadRequestException("EVENT_NOT_PUBLISHABLE: Cannot publish event with missing required information");
        }
        if (!event.getStartTime().isBefore(event.getEndTime())) {
            throw new BadRequestException("EVENT_NOT_PUBLISHABLE: startTime must be before endTime");
        }
        if (!event.getStartTime().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("EVENT_NOT_PUBLISHABLE: startTime must be in the future");
        }
        if (event.getTotalTickets() <= 0) {
            throw new BadRequestException("EVENT_NOT_PUBLISHABLE: totalTickets must be greater than 0");
        }
        if (event.getAvailableTickets() < 0 || event.getAvailableTickets() > event.getTotalTickets()) {
            throw new BadRequestException("EVENT_NOT_PUBLISHABLE: availableTickets must be between 0 and totalTickets");
        }
        if (event.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("EVENT_NOT_PUBLISHABLE: price cannot be negative");
        }
    }

    private void validateDraftBasics(CreateEventRequest request) {
        validateTimeRange(request.startTime(), request.endTime());
    }

    private void requireTransition(Event event, EventStatus targetStatus) {
        EventStatus currentStatus = event.getStatus();
        boolean allowed = (currentStatus == EventStatus.DRAFT && (targetStatus == EventStatus.PUBLISHED || targetStatus == EventStatus.CANCELLED))
                || (currentStatus == EventStatus.PUBLISHED && (targetStatus == EventStatus.CANCELLED || targetStatus == EventStatus.COMPLETED));
        if (!allowed) {
            throw new EventConflictException("EVENT_INVALID_STATUS_TRANSITION: Cannot transition event from "
                    + currentStatus + " to " + targetStatus);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
