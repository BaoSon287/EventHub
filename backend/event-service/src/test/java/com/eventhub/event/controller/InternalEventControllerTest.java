package com.eventhub.event.controller;

import com.eventhub.common.exception.ForbiddenException;
import com.eventhub.common.exception.GlobalExceptionHandler;
import com.eventhub.event.dto.InternalEventResponse;
import com.eventhub.event.entity.EventStatus;
import com.eventhub.event.exception.EventExceptionHandler;
import com.eventhub.event.security.InternalApiKeyValidator;
import com.eventhub.event.security.JwtService;
import com.eventhub.event.service.EventImageStorageService;
import com.eventhub.event.service.EventService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InternalEventController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({EventExceptionHandler.class, GlobalExceptionHandler.class, InternalEventControllerTest.TestConfig.class})
class InternalEventControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EventService service;

    @MockBean
    private InternalApiKeyValidator internalApiKeyValidator;

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
    void internalEndpointReturnsBookingFields() throws Exception {
        LocalDateTime startTime = LocalDateTime.now().plusDays(3);
        when(service.findInternalById(1L)).thenReturn(new InternalEventResponse(
                1L,
                "Tech Meetup",
                startTime,
                startTime.plusHours(2),
                100,
                BigDecimal.valueOf(100000),
                80,
                EventStatus.PUBLISHED,
                10L
        ));

        mockMvc.perform(get("/api/events/internal/1")
                        .header("X-Internal-Api-Key", "test-key"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(1)))
                .andExpect(jsonPath("$.data.status", is("PUBLISHED")))
                .andExpect(jsonPath("$.data.totalTickets", is(100)))
                .andExpect(jsonPath("$.data.availableTickets", is(80)))
                .andExpect(jsonPath("$.data.price", is(100000)))
                .andExpect(jsonPath("$.data.startTime").exists())
                .andExpect(jsonPath("$.data.endTime").exists());
    }

    @Test
    void internalEndpointWithoutApiKeyIsRejected() throws Exception {
        doThrow(new ForbiddenException("INVALID_INTERNAL_API_KEY: Invalid internal API key"))
                .when(internalApiKeyValidator).requireValid(null);

        mockMvc.perform(get("/api/events/internal/1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("INVALID_INTERNAL_API_KEY: Invalid internal API key")));
    }

    @Test
    void internalEndpointWithWrongApiKeyIsRejected() throws Exception {
        doThrow(new ForbiddenException("INVALID_INTERNAL_API_KEY: Invalid internal API key"))
                .when(internalApiKeyValidator).requireValid("wrong-key");

        mockMvc.perform(get("/api/events/internal/1")
                        .header("X-Internal-Api-Key", "wrong-key"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("INVALID_INTERNAL_API_KEY: Invalid internal API key")));
    }
}
