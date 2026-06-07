package com.eventhub.notification.service;

import com.eventhub.notification.dto.EmailNotificationRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public void sendEmail(EmailNotificationRequest request) {
        log.info("Email notification queued: to={}, subject={}, body={}", request.to(), request.subject(), request.body());
    }
}
