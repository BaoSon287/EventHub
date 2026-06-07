package com.eventhub.notification.dto;

import com.eventhub.notification.enums.NotificationStatus;
import com.eventhub.notification.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        Long userId,
        String recipientEmail,
        String title,
        String content,
        NotificationType type,
        NotificationStatus status,
        String sourceService,
        String sourceEvent,
        String referenceId,
        LocalDateTime createdAt,
        LocalDateTime sentAt,
        LocalDateTime readAt
) {
}
