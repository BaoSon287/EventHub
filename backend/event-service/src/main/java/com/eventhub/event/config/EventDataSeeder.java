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
public class EventDataSeeder {
    @Bean
    CommandLineRunner seedPublishedEvents(EventRepository repository) {
        return args -> {
            List<Event> events = List.of(
                    event("Tech Conference 2026", "Technology conference for developers and founders.", "Technology", "National Convention Center", "57 Pham Hung", "Ha Noi", "2026-08-10T09:00:00", "2026-08-10T17:00:00", 300, 199000, "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200"),
                    event("Startup Networking Night", "Networking night for startup builders, investors, and operators.", "Business", "Dreamplex", "195 Dien Bien Phu", "Ho Chi Minh City", "2026-08-22T18:30:00", "2026-08-22T21:30:00", 180, 99000, "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200"),
                    event("Music Festival Hanoi", "Outdoor music festival with indie bands and electronic artists.", "Music", "Hoan Kiem Lake Walking Street", "Dinh Tien Hoang", "Ha Noi", "2026-09-05T16:00:00", "2026-09-05T23:00:00", 2000, 350000, "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1200"),
                    event("AI Workshop for Students", "Hands-on AI workshop for students learning practical machine learning.", "Education", "University of Technology", "268 Ly Thuong Kiet", "Ho Chi Minh City", "2026-09-12T08:30:00", "2026-09-12T12:00:00", 120, 50000, "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200"),
                    event("Java Spring Boot Bootcamp", "Intensive backend bootcamp covering Spring Boot, JPA, Security, and microservices.", "Technology", "TechHub Da Nang", "35 Thai Phien", "Da Nang", "2026-10-03T09:00:00", "2026-10-05T17:00:00", 80, 799000, "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=1200"),
                    event("Design Thinking Seminar", "Seminar on design thinking, product discovery, and user research.", "Design", "RMIT Vietnam", "702 Nguyen Van Linh", "Ho Chi Minh City", "2026-10-18T13:30:00", "2026-10-18T17:00:00", 150, 150000, "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200"),
                    event("Charity Run 2026", "Community running event raising funds for education and health programs.", "Sports", "Sala Urban Area", "Mai Chi Tho", "Ho Chi Minh City", "2026-11-08T05:30:00", "2026-11-08T10:00:00", 1500, 250000, "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200"),
                    event("Career Fair for Developers", "Career fair connecting software engineers with technology companies.", "Career", "FPT Tower", "10 Pham Van Bach", "Ha Noi", "2026-11-21T09:00:00", "2026-11-21T16:30:00", 600, 0, "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1200"),
                    draftEvent("Draft Product Launch", "Draft event for organizer lifecycle demos.", "Business", "EventHub Studio", "1 Demo Street", "Ha Noi", "2026-12-12T09:00:00", "2026-12-12T12:00:00", 100, 120000, "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=1200")
            );

            for (Event event : events) {
                if (!repository.existsByTitle(event.getTitle())) {
                    repository.save(event);
                }
            }
        };
    }

    private Event event(
            String title,
            String description,
            String category,
            String location,
            String address,
            String city,
            String startTime,
            String endTime,
            int totalTickets,
            int price,
            String imageUrl
    ) {
        LocalDateTime parsedStartTime = LocalDateTime.parse(startTime);
        LocalDateTime parsedEndTime = LocalDateTime.parse(endTime);
        return Event.builder()
                .title(title)
                .description(description)
                .category(category)
                .location(location)
                .address(address)
                .city(city)
                .startTime(parsedStartTime)
                .endTime(parsedEndTime)
                .totalTickets(totalTickets)
                .availableTickets(totalTickets)
                .price(BigDecimal.valueOf(price))
                .imageUrl(imageUrl)
                .organizerId(1L)
                .organizerName("EventHub Demo Organizer")
                .status(statusForSeed(parsedEndTime, EventStatus.PUBLISHED))
                .build();
    }

    private Event draftEvent(
            String title,
            String description,
            String category,
            String location,
            String address,
            String city,
            String startTime,
            String endTime,
            int totalTickets,
            int price,
            String imageUrl
    ) {
        LocalDateTime parsedStartTime = LocalDateTime.parse(startTime);
        LocalDateTime parsedEndTime = LocalDateTime.parse(endTime);
        return Event.builder()
                .title(title)
                .description(description)
                .category(category)
                .location(location)
                .address(address)
                .city(city)
                .startTime(parsedStartTime)
                .endTime(parsedEndTime)
                .totalTickets(totalTickets)
                .availableTickets(totalTickets)
                .price(BigDecimal.valueOf(price))
                .imageUrl(imageUrl)
                .organizerId(1L)
                .organizerName("EventHub Demo Organizer")
                .status(EventStatus.DRAFT)
                .build();
    }

    static EventStatus statusForSeed(LocalDateTime endTime, EventStatus requestedStatus) {
        if (requestedStatus == EventStatus.PUBLISHED && !endTime.isAfter(LocalDateTime.now())) {
            return EventStatus.COMPLETED;
        }
        return requestedStatus;
    }
}
