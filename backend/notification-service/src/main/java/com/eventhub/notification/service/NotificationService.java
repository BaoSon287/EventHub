package com.eventhub.notification.service;

import com.eventhub.common.exception.ResourceNotFoundException;
import com.eventhub.notification.dto.BookingCancelledEvent;
import com.eventhub.notification.dto.BookingCreatedEvent;
import com.eventhub.notification.dto.MockEmailRequest;
import com.eventhub.notification.dto.NotificationPageResponse;
import com.eventhub.notification.dto.NotificationResponse;
import com.eventhub.notification.entity.Notification;
import com.eventhub.notification.enums.NotificationStatus;
import com.eventhub.notification.enums.NotificationType;
import com.eventhub.notification.mapper.NotificationMapper;
import com.eventhub.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository repository;
    private final NotificationMapper mapper;

    public NotificationService(NotificationRepository repository, NotificationMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Transactional
    public NotificationResponse createBookingCreatedNotification(BookingCreatedEvent event) {
        String content = "Your booking " + event.bookingCode() + " for event " + event.eventTitle() + " has been created successfully.";
        Notification notification = repository.save(Notification.builder()
                .userId(event.userId())
                .recipientEmail(event.userEmail())
                .title("Booking confirmed")
                .content(content)
                .type(NotificationType.BOOKING_CREATED)
                .status(NotificationStatus.SENT)
                .sourceService("booking-service")
                .sourceEvent("booking.created")
                .referenceId(event.bookingCode())
                .sentAt(LocalDateTime.now())
                .build());
        logMockEmail(event.userEmail(), "Booking confirmed", content);
        return mapper.toResponse(notification);
    }

    @Transactional
    public NotificationResponse createBookingCancelledNotification(BookingCancelledEvent event) {
        String content = "Your booking " + event.bookingCode() + " for event " + event.eventTitle() + " has been cancelled.";
        Notification notification = repository.save(Notification.builder()
                .userId(event.userId())
                .recipientEmail(event.userEmail())
                .title("Booking cancelled")
                .content(content)
                .type(NotificationType.BOOKING_CANCELLED)
                .status(NotificationStatus.SENT)
                .sourceService("booking-service")
                .sourceEvent("booking.cancelled")
                .referenceId(event.bookingCode())
                .sentAt(LocalDateTime.now())
                .build());
        logMockEmail(event.userEmail(), "Booking cancelled", content);
        return mapper.toResponse(notification);
    }

    public NotificationPageResponse getNotificationsByUser(
            Long userId,
            NotificationStatus status,
            NotificationType type,
            Pageable pageable
    ) {
        Page<Notification> notifications;
        if (status != null && type != null) {
            notifications = repository.findByUserIdAndStatusAndType(userId, status, type, pageable);
        } else if (status != null) {
            notifications = repository.findByUserIdAndStatus(userId, status, pageable);
        } else if (type != null) {
            notifications = repository.findByUserIdAndType(userId, type, pageable);
        } else {
            notifications = repository.findByUserId(userId, pageable);
        }
        return toPageResponse(notifications);
    }

    public NotificationResponse getNotificationById(Long id) {
        return mapper.toResponse(getNotification(id));
    }

    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification notification = getNotification(id);
        notification.setStatus(NotificationStatus.READ);
        notification.setReadAt(LocalDateTime.now());
        return mapper.toResponse(repository.save(notification));
    }

    public void sendMockEmail(MockEmailRequest request) {
        logMockEmail(request.to(), request.subject(), request.content());
    }

    private Notification getNotification(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
    }

    private NotificationPageResponse toPageResponse(Page<Notification> page) {
        return new NotificationPageResponse(
                page.getContent().stream().map(mapper::toResponse).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    private void logMockEmail(String to, String subject, String content) {
        if (to == null || to.isBlank()) {
            log.warn("Recipient email is missing, notification saved without real email target.");
        }
        log.info("""
                === MOCK EMAIL ===
                To: {}
                Subject: {}
                Content: {}
                ==================
                """, to, subject, content);
    }
}
