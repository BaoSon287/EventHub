package com.eventhub.notification.mapper;

import com.eventhub.notification.dto.NotificationResponse;
import com.eventhub.notification.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {
    public NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getUserId(),
                notification.getRecipientEmail(),
                notification.getTitle(),
                notification.getContent(),
                notification.getType(),
                notification.getStatus(),
                notification.getSourceService(),
                notification.getSourceEvent(),
                notification.getReferenceId(),
                notification.getCreatedAt(),
                notification.getSentAt(),
                notification.getReadAt()
        );
    }
}
