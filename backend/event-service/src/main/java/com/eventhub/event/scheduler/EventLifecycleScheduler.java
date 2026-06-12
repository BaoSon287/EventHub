package com.eventhub.event.scheduler;

import com.eventhub.event.service.EventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EventLifecycleScheduler {
    private static final Logger log = LoggerFactory.getLogger(EventLifecycleScheduler.class);

    private final EventService eventService;

    public EventLifecycleScheduler(EventService eventService) {
        this.eventService = eventService;
    }

    @Scheduled(cron = "${event.lifecycle.completion-cron}")
    public void completeExpiredPublishedEvents() {
        int updated = eventService.completeExpiredPublishedEvents();
        if (updated > 0) {
            log.info("Marked {} expired published events as COMPLETED", updated);
        }
    }
}
