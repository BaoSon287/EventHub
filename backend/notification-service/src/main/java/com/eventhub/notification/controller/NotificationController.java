package com.eventhub.notification.controller;

import com.eventhub.common.dto.ApiResponse;
import com.eventhub.notification.dto.MockEmailRequest;
import com.eventhub.notification.dto.NotificationPageResponse;
import com.eventhub.notification.dto.NotificationResponse;
import com.eventhub.notification.enums.NotificationStatus;
import com.eventhub.notification.enums.NotificationType;
import com.eventhub.notification.security.CustomUserPrincipal;
import com.eventhub.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "NotificationController", description = "Notification APIs and mock email endpoint")
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @Operation(summary = "Notification service health check")
    @GetMapping("/health")
    public ApiResponse<Void> health() {
        return ApiResponse.success("Notification service is running", null);
    }

    @Operation(summary = "Get notifications by user")
    @GetMapping("/user/{userId}")
    public ApiResponse<NotificationPageResponse> findByUser(
            @PathVariable("userId") Long userId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "status", required = false) NotificationStatus status,
            @RequestParam(name = "type", required = false) NotificationType type,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        requireOwnerOrAdmin(userId, principal);
        NotificationPageResponse response = service.getNotificationsByUser(
                userId,
                status,
                type,
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100))
        );
        return ApiResponse.success("Get notifications successfully", response);
    }

    @Operation(summary = "Get notification details")
    @GetMapping("/{id}")
    public ApiResponse<NotificationResponse> findById(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        NotificationResponse response = service.getNotificationById(id);
        requireOwnerOrAdmin(response.userId(), principal);
        return ApiResponse.success("Get notification successfully", response);
    }

    @Operation(summary = "Mark notification as read")
    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markAsRead(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        NotificationResponse current = service.getNotificationById(id);
        requireOwnerOrAdmin(current.userId(), principal);
        return ApiResponse.success("Mark notification as read successfully", service.markAsRead(id));
    }

    @Operation(summary = "Send mock email")
    @PostMapping("/email")
    public ApiResponse<Void> sendEmail(@Valid @RequestBody MockEmailRequest request) {
        service.sendMockEmail(request);
        return ApiResponse.success("Email notification logged", null);
    }

    private void requireOwnerOrAdmin(Long userId, CustomUserPrincipal principal) {
        if (principal == null || (!principal.isAdmin() && !principal.userId().equals(userId))) {
            throw new AccessDeniedException("User can only access own notifications");
        }
    }
}
