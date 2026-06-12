package com.eventhub.event.repository;

import com.eventhub.event.entity.Event;
import com.eventhub.event.entity.EventStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.time.LocalDateTime;

public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {
    Page<Event> findByOrganizerId(Long organizerId, Pageable pageable);
    Page<Event> findByOrganizerIdAndStatus(Long organizerId, EventStatus status, Pageable pageable);
    boolean existsByTitle(String title);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Event e where e.id = :id")
    Optional<Event> findByIdForUpdate(@Param("id") Long id);

    @Modifying
    @Query("""
            update Event e
               set e.status = com.eventhub.event.entity.EventStatus.COMPLETED
             where e.status = com.eventhub.event.entity.EventStatus.PUBLISHED
               and e.endTime <= :now
            """)
    int markExpiredPublishedEventsAsCompleted(@Param("now") LocalDateTime now);
}
