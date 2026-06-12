package com.eventhub.event.repository;

import com.eventhub.event.dto.EventSearchCriteria;
import com.eventhub.event.entity.Event;
import com.eventhub.event.entity.EventStatus;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class EventRepositoryLifecycleTest {
    @Autowired
    private EventRepository repository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void publicListOnlyReturnsPublishedUpcomingEvents() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 12, 12, 0);
        Event upcoming = saveEvent("Upcoming", EventStatus.PUBLISHED, now.plusHours(1), now.plusHours(3), 10L);
        saveEvent("Draft", EventStatus.DRAFT, now.plusHours(1), now.plusHours(3), 10L);
        saveEvent("Cancelled", EventStatus.CANCELLED, now.plusHours(1), now.plusHours(3), 10L);
        saveEvent("Completed", EventStatus.COMPLETED, now.minusHours(4), now.minusHours(1), 10L);
        saveEvent("Expired Published", EventStatus.PUBLISHED, now.minusHours(4), now.minusHours(1), 10L);

        Page<Event> result = repository.findAll(
                EventSpecification.filter(publicCriteria(now)),
                PageRequest.of(0, 10, Sort.by("startTime").ascending())
        );

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).extracting(Event::getId).containsExactly(upcoming.getId());
    }

    @Test
    void publicListKeepsPaginationFilterAndSort() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 12, 12, 0);
        saveEvent("Java Meetup B", EventStatus.PUBLISHED, now.plusDays(2), now.plusDays(2).plusHours(2), 10L);
        saveEvent("Java Meetup A", EventStatus.PUBLISHED, now.plusDays(1), now.plusDays(1).plusHours(2), 10L);
        saveEvent("React Meetup", EventStatus.PUBLISHED, now.plusDays(3), now.plusDays(3).plusHours(2), 10L);

        EventSearchCriteria criteria = new EventSearchCriteria(
                "Java",
                "Technology",
                "Ha Noi",
                BigDecimal.ZERO,
                BigDecimal.valueOf(200000),
                now,
                now.plusDays(10),
                EventStatus.PUBLISHED,
                now
        );
        Page<Event> result = repository.findAll(
                EventSpecification.filter(criteria),
                PageRequest.of(0, 1, Sort.by("startTime").ascending())
        );

        assertThat(result.getTotalElements()).isEqualTo(2);
        assertThat(result.getTotalPages()).isEqualTo(2);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Java Meetup A");
    }

    @Test
    void organizerQueryCanSeeAllOwnStatuses() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 12, 12, 0);
        saveEvent("Draft", EventStatus.DRAFT, now.plusHours(1), now.plusHours(3), 10L);
        saveEvent("Published", EventStatus.PUBLISHED, now.plusHours(1), now.plusHours(3), 10L);
        saveEvent("Cancelled", EventStatus.CANCELLED, now.plusHours(1), now.plusHours(3), 10L);
        saveEvent("Completed", EventStatus.COMPLETED, now.minusHours(4), now.minusHours(1), 10L);
        saveEvent("Other", EventStatus.DRAFT, now.plusHours(1), now.plusHours(3), 20L);

        Page<Event> result = repository.findByOrganizerId(10L, PageRequest.of(0, 10));

        assertThat(result.getTotalElements()).isEqualTo(4);
        assertThat(result.getContent()).extracting(Event::getStatus)
                .containsExactlyInAnyOrder(EventStatus.DRAFT, EventStatus.PUBLISHED, EventStatus.CANCELLED, EventStatus.COMPLETED);
    }

    @Test
    void bulkCompletionOnlyMarksExpiredPublishedEventsAndIsIdempotent() {
        LocalDateTime now = LocalDateTime.of(2026, 6, 12, 12, 0);
        Event expiredPublished = saveEvent("Expired Published", EventStatus.PUBLISHED, now.minusHours(4), now.minusHours(1), 10L);
        Event upcomingPublished = saveEvent("Upcoming", EventStatus.PUBLISHED, now.plusHours(1), now.plusHours(3), 10L);
        Event draft = saveEvent("Draft", EventStatus.DRAFT, now.minusHours(4), now.minusHours(1), 10L);
        Event cancelled = saveEvent("Cancelled", EventStatus.CANCELLED, now.minusHours(4), now.minusHours(1), 10L);

        int firstRun = repository.markExpiredPublishedEventsAsCompleted(now);
        flushAndClear();
        int secondRun = repository.markExpiredPublishedEventsAsCompleted(now);
        flushAndClear();

        assertThat(firstRun).isEqualTo(1);
        assertThat(secondRun).isZero();
        assertThat(repository.findById(expiredPublished.getId()).orElseThrow().getStatus()).isEqualTo(EventStatus.COMPLETED);
        assertThat(repository.findById(upcomingPublished.getId()).orElseThrow().getStatus()).isEqualTo(EventStatus.PUBLISHED);
        assertThat(repository.findById(draft.getId()).orElseThrow().getStatus()).isEqualTo(EventStatus.DRAFT);
        assertThat(repository.findById(cancelled.getId()).orElseThrow().getStatus()).isEqualTo(EventStatus.CANCELLED);
    }

    private EventSearchCriteria publicCriteria(LocalDateTime now) {
        return new EventSearchCriteria(null, null, null, null, null, null, null, EventStatus.PUBLISHED, now);
    }

    private Event saveEvent(String title, EventStatus status, LocalDateTime startTime, LocalDateTime endTime, Long organizerId) {
        Event event = Event.builder()
                .title(title)
                .description(title + " description")
                .category("Technology")
                .location("Main Hall")
                .address("1 Event Street")
                .city("Ha Noi")
                .startTime(startTime)
                .endTime(endTime)
                .totalTickets(100)
                .availableTickets(100)
                .price(BigDecimal.valueOf(100000))
                .organizerId(organizerId)
                .organizerName("organizer@example.com")
                .status(status)
                .build();
        return repository.saveAndFlush(event);
    }

    private void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }
}
