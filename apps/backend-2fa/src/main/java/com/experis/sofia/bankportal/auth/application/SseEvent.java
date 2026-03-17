package com.experis.sofia.bankportal.auth.application;

import java.util.Map;
import java.util.UUID;

/**
 * Value object inmutable para eventos SSE.
 *
 * <p>Tipos definidos:
 * <ul>
 *   <li>{@code "notification"} — nueva notificación de seguridad</li>
 *   <li>{@code "unread-count-updated"} — contador de no leídas actualizado</li>
 *   <li>{@code "heartbeat"} — keepalive cada 30s (ADR-012)</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — Sprint 8
 */
public record SseEvent(String id, String type, Object payload) {

    public static SseEvent notification(String id, Object notificationDto) {
        return new SseEvent(id, "notification", notificationDto);
    }

    public static SseEvent unreadCount(long count) {
        return new SseEvent(
                UUID.randomUUID().toString(),
                "unread-count-updated",
                Map.of("count", count));
    }

    public static SseEvent heartbeat() {
        return new SseEvent("", "heartbeat", "");
    }
}
