package com.eventhub.event.repository;

import com.eventhub.event.entity.Event;
import com.eventhub.event.entity.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {
    Page<Event> findByOrganizerId(Long organizerId, Pageable pageable);
    Page<Event> findByOrganizerIdAndStatus(Long organizerId, EventStatus status, Pageable pageable);
}
