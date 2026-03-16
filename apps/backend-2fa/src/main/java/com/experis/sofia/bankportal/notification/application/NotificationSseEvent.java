package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.notification.domain.UserNotification;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Payload del evento SSE enviado al cliente Angular.
 * Solo incluye los campos necesarios para el toast en tiempo real (US-305).
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5
 */
public record NotificationSseEvent(
        String   notificationId,
        String   eventType,
        String   title,
        String   body,
        String   actionUrl,
        LocalDateTime createdAt
) {
    public static NotificationSseEvent from(UserNotification n) {
        return new NotificationSseEvent(
                n.getId().toString(),
                n.getEventType(),
                n.getTitle(),
                n.getBody(),
                n.getActionUrl(),
                n.getCreatedAt()
        );
    }
}
