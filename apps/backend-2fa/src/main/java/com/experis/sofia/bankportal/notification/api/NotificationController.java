package com.experis.sofia.bankportal.notification.api;

import com.experis.sofia.bankportal.notification.application.ManageNotificationsUseCase;
import com.experis.sofia.bankportal.notification.application.SseEmitterRegistry;
import com.experis.sofia.bankportal.notification.domain.UserNotification;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Controller REST para el Centro de Notificaciones de Seguridad (FEAT-004).
 *
 * DEBT-007 (ADR-010): endpoint SSE añade headers para CDN/proxy en producción:
 * {@code X-Accel-Buffering: no}, {@code Cache-Control: no-cache, no-store},
 * {@code Connection: keep-alive}.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5 · DEBT-007 Sprint 6
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final ManageNotificationsUseCase manageNotifications;
    private final SseEmitterRegistry         sseRegistry;

    /** US-301 — Lista notificaciones de seguridad paginadas. */
    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> listNotifications(
            @RequestParam(required = false) String eventType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        Page<NotificationResponse> result = manageNotifications
                .listNotifications(userId, eventType, page, size)
                .map(NotificationResponse::from);
        return ResponseEntity.ok(result);
    }

    /** US-303 — Cuenta notificaciones no leídas para el badge. */
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(new UnreadCountResponse(manageNotifications.countUnread(userId)));
    }

    /** US-302 — Marca notificación individual como leída. */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Void> markOneAsRead(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal Jwt jwt) {

        manageNotifications.markOneAsRead(UUID.fromString(jwt.getSubject()), notificationId);
        return ResponseEntity.noContent().build();
    }

    /** US-302 — Marca todas las notificaciones como leídas. */
    @PutMapping("/read-all")
    public ResponseEntity<MarkAllReadResponse> markAllAsRead(
            @AuthenticationPrincipal Jwt jwt) {

        int marked = manageNotifications.markAllAsRead(UUID.fromString(jwt.getSubject()));
        return ResponseEntity.ok(new MarkAllReadResponse(marked));
    }

    /**
     * US-305 — Suscripción SSE para notificaciones en tiempo real.
     *
     * DEBT-007 (ADR-010): headers añadidos para garantizar streaming correcto
     * a través de Nginx (proxy_buffering off) y CDN (Cache-Control: no-cache).
     *
     * <p>El cliente Angular usa EventSource API que reconecta automáticamente
     * si la conexión se interrumpe (comportamiento estándar del protocolo SSE).
     * El polling fallback de 60s (R-F4-003) actúa como red de seguridad.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletResponse response) {

        // ADR-010: señalar a todos los proxies intermedios que no hagan buffering
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control",      "no-cache, no-store");
        response.setHeader("Connection",          "keep-alive");

        UUID userId = UUID.fromString(jwt.getSubject());
        return sseRegistry.register(userId);
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public record NotificationResponse(
            String notificationId, String eventType, String title, String body,
            String actionUrl, boolean read,
            LocalDateTime createdAt, LocalDateTime expiresAt) {

        public static NotificationResponse from(UserNotification n) {
            return new NotificationResponse(n.getId().toString(), n.getEventType(),
                    n.getTitle(), n.getBody(), n.getActionUrl(), n.isRead(),
                    n.getCreatedAt(), n.getExpiresAt());
        }
    }

    public record UnreadCountResponse(long unreadCount) {}
    public record MarkAllReadResponse(int markedCount) {}
}
