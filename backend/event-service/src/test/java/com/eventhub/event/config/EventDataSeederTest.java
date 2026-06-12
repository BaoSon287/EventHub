package com.eventhub.event.config;

import com.eventhub.event.entity.EventStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class EventDataSeederTest {
    @Test
    void expiredSeedEventIsNotPublished() {
        EventStatus status = EventDataSeeder.statusForSeed(
                LocalDateTime.now().minusMinutes(1),
                EventStatus.PUBLISHED
        );

        assertThat(status).isEqualTo(EventStatus.COMPLETED);
    }

    @Test
    void upcomingSeedEventCanRemainPublished() {
        EventStatus status = EventDataSeeder.statusForSeed(
                LocalDateTime.now().plusDays(1),
                EventStatus.PUBLISHED
        );

        assertThat(status).isEqualTo(EventStatus.PUBLISHED);
    }
}
