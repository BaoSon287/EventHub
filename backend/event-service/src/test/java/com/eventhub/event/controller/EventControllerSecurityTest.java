package com.eventhub.event.controller;

import com.eventhub.event.config.SecurityConfig;
import com.eventhub.event.dto.CreateEventRequest;
import com.eventhub.event.dto.EventResponse;
import com.eventhub.event.entity.EventStatus;
import com.eventhub.event.security.CustomUserPrincipal;
import com.eventhub.event.security.JwtAuthenticationEntryPoint;
import com.eventhub.event.security.JwtAuthenticationFilter;
import com.eventhub.event.security.JwtService;
import com.eventhub.event.service.EventImageStorageService;
import com.eventhub.event.service.EventService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EventController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtAuthenticationEntryPoint.class, EventControllerSecurityTest.TestConfig.class})
class EventControllerSecurityTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EventService service;

    @MockBean
    private JwtService jwtService;

    @TestConfiguration
    static class TestConfig {
        @Bean
        EventImageStorageService eventImageStorageService() {
            return new EventImageStorageService(
                    "target/test-uploads/events",
                    "http://localhost:8080",
                    "/api/events/uploads/events",
                    "",
                    "eventhub/events"
            );
        }
    }

    @Test
    void userCannotCreateEvent() throws Exception {
        when(jwtService.parsePrincipal("user-token"))
                .thenReturn(new CustomUserPrincipal(30L, "user@example.com", "USER"));
        when(service.create(any(CreateEventRequest.class), any(CustomUserPrincipal.class)))
                .thenThrow(new AccessDeniedException("EVENT_ACCESS_DENIED: Only ORGANIZER or ADMIN can manage events"));

        mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer user-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest(EventStatus.DRAFT))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("EVENT_ACCESS_DENIED: Only ORGANIZER or ADMIN can manage events")));
    }

    @Test
    void organizerCanCreateEvent() throws Exception {
        when(jwtService.parsePrincipal("organizer-token"))
                .thenReturn(new CustomUserPrincipal(10L, "organizer@example.com", "ORGANIZER"));
        when(service.create(any(CreateEventRequest.class), any(CustomUserPrincipal.class)))
                .thenReturn(eventResponse(EventStatus.DRAFT));

        mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer organizer-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest(EventStatus.DRAFT))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("DRAFT")));
    }

    @Test
    void adminCanCreateEvent() throws Exception {
        when(jwtService.parsePrincipal("admin-token"))
                .thenReturn(new CustomUserPrincipal(1L, "admin@example.com", "ADMIN"));
        when(service.create(any(CreateEventRequest.class), any(CustomUserPrincipal.class)))
                .thenReturn(eventResponse(EventStatus.PUBLISHED));

        mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer admin-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest(EventStatus.PUBLISHED))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PUBLISHED")));
    }

    @Test
    void createWithoutJwtReturns401Envelope() throws Exception {
        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest(EventStatus.DRAFT))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Unauthorized")));
    }

    @Test
    void publishNonOwnerReturns403Envelope() throws Exception {
        when(jwtService.parsePrincipal("organizer-token"))
                .thenReturn(new CustomUserPrincipal(20L, "other@example.com", "ORGANIZER"));
        when(service.publish(eq(1L), any(CustomUserPrincipal.class)))
                .thenThrow(new AccessDeniedException("EVENT_ACCESS_DENIED: Only event organizer or ADMIN can manage this event"));

        mockMvc.perform(patch("/api/events/1/publish")
                        .header("Authorization", "Bearer organizer-token"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("EVENT_ACCESS_DENIED: Only event organizer or ADMIN can manage this event")));
    }

    private CreateEventRequest createRequest(EventStatus status) {
        LocalDateTime startTime = LocalDateTime.now().plusDays(10);
        return new CreateEventRequest(
                "Tech Meetup",
                "A meetup for builders",
                "Technology",
                "Main Hall",
                "1 Event Street",
                "Ha Noi",
                startTime,
                startTime.plusHours(2),
                100,
                BigDecimal.valueOf(100000),
                "https://example.com/event.jpg",
                status
        );
    }

    private EventResponse eventResponse(EventStatus status) {
        LocalDateTime startTime = LocalDateTime.now().plusDays(10);
        return new EventResponse(
                1L,
                "Tech Meetup",
                "A meetup for builders",
                "Technology",
                "Main Hall",
                "1 Event Street",
                "Ha Noi",
                startTime,
                startTime.plusHours(2),
                100,
                100,
                BigDecimal.valueOf(100000),
                "https://example.com/event.jpg",
                10L,
                "organizer@example.com",
                status,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
    }
}
