package com.eventhub.event.service;

import com.eventhub.event.dto.TicketQuantityRequest;
import com.eventhub.event.entity.Event;
import com.eventhub.event.entity.EventStatus;
import com.eventhub.event.repository.EventRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:event_inventory_concurrency;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=false",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "eureka.client.enabled=false",
        "event.lifecycle.completion-cron=0 0 0 1 1 *"
})
class EventInventoryConcurrencyTest {
    @Autowired
    private EventService eventService;

    @Autowired
    private EventRepository repository;

    @Test
    void concurrentReserveDoesNotOversell() throws Exception {
        Event event = repository.saveAndFlush(eventWithOneTicket());
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);

        Callable<Boolean> reserveTask = () -> {
            ready.countDown();
            start.await(5, TimeUnit.SECONDS);
            try {
                eventService.reserveTickets(event.getId(), new TicketQuantityRequest(1));
                return true;
            } catch (RuntimeException ex) {
                return false;
            }
        };

        List<Future<Boolean>> results = List.of(executor.submit(reserveTask), executor.submit(reserveTask));
        assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
        start.countDown();
        executor.shutdown();
        assertThat(executor.awaitTermination(10, TimeUnit.SECONDS)).isTrue();

        long successfulReservations = 0;
        for (var result : results) {
            if (result.get()) {
                successfulReservations++;
            }
        }
        Event reloaded = repository.findById(event.getId()).orElseThrow();

        assertThat(successfulReservations).isEqualTo(1);
        assertThat(reloaded.getAvailableTickets()).isZero();
        assertThat(reloaded.getAvailableTickets()).isNotNegative();
        assertThat(reloaded.getTotalTickets() - reloaded.getAvailableTickets()).isEqualTo(1);
    }

    private Event eventWithOneTicket() {
        LocalDateTime startTime = LocalDateTime.now().plusDays(5);
        return Event.builder()
                .title("Limited Event")
                .description("Only one ticket")
                .category("Technology")
                .location("Main Hall")
                .address("1 Event Street")
                .city("Ha Noi")
                .startTime(startTime)
                .endTime(startTime.plusHours(2))
                .totalTickets(1)
                .availableTickets(1)
                .price(BigDecimal.valueOf(100000))
                .organizerId(10L)
                .organizerName("organizer@example.com")
                .status(EventStatus.PUBLISHED)
                .build();
    }
}
