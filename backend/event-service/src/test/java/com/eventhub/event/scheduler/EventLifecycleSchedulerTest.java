package com.eventhub.event.scheduler;

import com.eventhub.event.service.EventService;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EventLifecycleSchedulerTest {
    @Test
    void schedulerDelegatesToBulkCompletion() {
        EventService eventService = mock(EventService.class);
        when(eventService.completeExpiredPublishedEvents()).thenReturn(3);
        EventLifecycleScheduler scheduler = new EventLifecycleScheduler(eventService);

        scheduler.completeExpiredPublishedEvents();

        verify(eventService).completeExpiredPublishedEvents();
    }
}
