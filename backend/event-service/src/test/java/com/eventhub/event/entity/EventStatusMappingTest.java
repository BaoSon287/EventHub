package com.eventhub.event.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class EventStatusMappingTest {
    @Test
    void statusIsMappedAsNonNullableString() throws NoSuchFieldException {
        var statusField = Event.class.getDeclaredField("status");

        var enumerated = statusField.getAnnotation(Enumerated.class);
        var column = statusField.getAnnotation(Column.class);

        assertThat(enumerated).isNotNull();
        assertThat(enumerated.value()).isEqualTo(EnumType.STRING);
        assertThat(column).isNotNull();
        assertThat(column.nullable()).isFalse();
        assertThat(column.length()).isEqualTo(32);
    }

    @Test
    void newEventDefaultsToDraftWhenStatusIsMissing() throws Exception {
        Event event = Event.builder()
                .title("Draft Event")
                .totalTickets(10)
                .build();

        Method onCreate = Event.class.getDeclaredMethod("onCreate");
        onCreate.setAccessible(true);
        onCreate.invoke(event);

        assertThat(event.getStatus()).isEqualTo(EventStatus.DRAFT);
        assertThat(event.getAvailableTickets()).isEqualTo(10);
    }
}
