package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.notification.domain.NotificationCategory;
import com.experis.sofia.bankportal.notification.domain.NotificationEventType;
import com.experis.sofia.bankportal.notification.domain.NotificationSeverity;

import java.util.Map;
import java.util.UUID;

/**
 * Evento interno de negocio que fluye a través del {@link NotificationHub}.
 *
 * <p>Producido por {@code TransactionAlertService} y {@code SecurityAlertService}
 * tras un {@code @TransactionalEventListener(AFTER_COMMIT)}.
 * Consumido por el Hub para despachar a los canales (push, SSE, email).
 */
public record NotificationEvent(
        UUID                   userId,
        NotificationEventType  eventType,
        NotificationCategory   category,
        NotificationSeverity   severity,
        String                 title,
        String                 body,
        Map<String, Object>    metadata
) {
    /** Factory con category y severity tomados del eventType por defecto. */
    public static NotificationEvent of(UUID userId, NotificationEventType eventType,
                                       String title, String body, Map<String, Object> metadata) {
        return new NotificationEvent(
                userId, eventType,
                eventType.getDefaultCategory(),
                eventType.getDefaultSeverity(),
                title, body, metadata);
    }
}
