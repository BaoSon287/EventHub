package com.eventhub.notification.repository;

import com.eventhub.notification.entity.Notification;
import com.eventhub.notification.enums.NotificationStatus;
import com.eventhub.notification.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserId(Long userId, Pageable pageable);
    Page<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status, Pageable pageable);
    Page<Notification> findByUserIdAndType(Long userId, NotificationType type, Pageable pageable);
    Page<Notification> findByUserIdAndStatusAndType(Long userId, NotificationStatus status, NotificationType type, Pageable pageable);
    long countByUserIdAndStatus(Long userId, NotificationStatus status);
}
