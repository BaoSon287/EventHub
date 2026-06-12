package com.eventhub.event.config;

import com.eventhub.event.entity.Event;
import com.eventhub.event.entity.EventStatus;
import com.eventhub.event.repository.EventRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class SampleDataConfig {
    @Bean
    CommandLineRunner seedEvents(EventRepository repository) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }

            repository.saveAll(List.of(
                    event("Tech Conference 2026", "A conference for developers", "Technology", "National Convention Center", "57 Pham Hung", "Ha Noi", 200, "199000", 30),
                    event("Startup Networking Night", "Meet founders, investors, and operators", "Business", "Innovation Hub", "1 Nguyen Hue", "Ho Chi Minh City", 120, "99000", 12),
                    event("Music Festival Hanoi", "Outdoor music festival with local artists", "Music", "West Lake Stage", "10 Trich Sai", "Ha Noi", 500, "299000", 45),
                    event("AI Workshop for Students", "Hands-on AI workshop for beginners", "Education", "University Hall", "144 Xuan Thuy", "Ha Noi", 80, "0", 20),
                    event("Java Spring Boot Bootcamp", "Practical backend bootcamp with Spring Boot", "Technology", "Tech Campus", "22 Duy Tan", "Da Nang", 60, "499000", 25),
                    event("Design Thinking Seminar", "Learn design thinking for product teams", "Design", "Creative Space", "88 Pasteur", "Ho Chi Minh City", 90, "149000", 18),
                    event("Charity Run 2026", "Community running event for charity", "Sports", "Central Park", "Le Duan", "Da Nang", 300, "50000", 40),
                    event("Career Fair for Developers", "Connect with hiring tech companies", "Career", "Expo Center", "91 Tran Hung Dao", "Ha Noi", 400, "0", 35)
            ));
        };
    }

    private Event event(
            String title,
            String description,
            String category,
            String location,
            String address,
            String city,
            int tickets,
            String price,
            int daysFromNow
    ) {
        LocalDateTime start = LocalDateTime.now().plusDays(daysFromNow).withHour(9).withMinute(0).withSecond(0).withNano(0);
        return Event.builder()
                .title(title)
                .description(description)
                .category(category)
                .location(location)
                .address(address)
                .city(city)
                .startTime(start)
                .endTime(start.plusHours(8))
                .totalTickets(tickets)
                .availableTickets(tickets)
                .price(new BigDecimal(price))
                .imageUrl("https://example.com/event.jpg")
                .organizerId(1L)
                .organizerName("Sample Organizer")
                .status(EventDataSeeder.statusForSeed(start.plusHours(8), EventStatus.PUBLISHED))
                .build();
    }
}
