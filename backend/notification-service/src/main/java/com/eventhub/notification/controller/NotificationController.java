package com.eventhub.notification.controller;

import com.eventhub.common.dto.ApiResponse;
import com.eventhub.notification.dto.EmailNotificationRequest;
import com.eventhub.notification.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Notification service is running", "OK");
    }

    @PostMapping("/email")
    public ApiResponse<Void> sendEmail(@Valid @RequestBody EmailNotificationRequest request) {
        service.sendEmail(request);
        return ApiResponse.success("Email notification logged", null);
    }
}
