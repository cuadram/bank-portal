package com.experis.sofia.bankportal.notification.api;

import com.experis.sofia.bankportal.notification.application.MarkNotificationsUseCase;
import com.experis.sofia.bankportal.notification.application.NotificationHistoryUseCase;
import com.experis.sofia.bankportal.notification.application.UnreadCountService;
import com.experis.sofia.bankportal.notification.domain.UserNotification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

/**
 * US-301/302/303 — Endpoints del Centro de Notificaciones de Seguridad.
 *
 * <p>Rutas:
 * <pre>
 *   GET  /api/v1/notifications               → historial paginado (US-301)
 *   PUT  /api/v1/notifications/{id}/read     → marcar individual (US-302)
 *   PUT  /api/v1/notifications/read-all      → marcar todas (US-302)
 *   GET  /api/v1/notifications/unread-count  → badge count (US-303)
 * </pre>
 *
 * <p>Seguridad: todos requieren scope=full-session.
 * userId siempre se extrae del claim {@code sub} del JWT — nunca del body.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 8
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationHistoryUseCase historyUseCase;
    private final MarkNotificationsUseCase   markUseCase;
    private final UnreadCountService         unreadCountService;

    // ─────────────────────────────────────────────────────────────────────────
    // US-301 — Historial paginado
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Retorna el historial paginado de notificaciones del usuario autenticado.
     * Respuesta 200 con página (puede estar vacía — nunca 404).
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getHistory(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) Boolean unreadOnly,
            @PageableDefault(size = 20, sort = "createdAt",
                             direction = Sort.Direction.DESC) Pageable pageable) {

        UUID userId = UUID.fromString(jwt.getSubject());
        var filter = new NotificationHistoryUseCase.NotificationFilter(eventType, unreadOnly);

        return ResponseEntity.ok(
                historyUseCase.getHistory(userId, filter, pageable)
                        .map(NotificationDto::from));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // US-302 — Marcar como leída
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Marca una notificación individual como leída. Idempotente — 204 siempre.
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        markUseCase.markAsRead(UUID.fromString(jwt.getSubject()), id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Marca todas las notificaciones no leídas como leídas.
     * Retorna el número de notificaciones actualizadas.
     */
    @PutMapping("/read-all")
    public ResponseEntity<MarkAllResponse> markAllRead(@AuthenticationPrincipal Jwt jwt) {
        int updated = markUseCase.markAllAsRead(UUID.fromString(jwt.getSubject()));
        return ResponseEntity.ok(new MarkAllResponse(updated));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // US-303 — Badge count
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Retorna el número de notificaciones no leídas del usuario.
     * Usado por el badge del header y como estado inicial del SSE.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(@AuthenticationPrincipal Jwt jwt) {
        long count = unreadCountService.getUnreadCount(UUID.fromString(jwt.getSubject()));
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTOs
    // ─────────────────────────────────────────────────────────────────────────

    public record NotificationDto(
            UUID    id,
            String  eventType,
            String  title,
            String  body,
            String  actionUrl,
            String  contextId,
            Instant createdAt,
            boolean read,
            String  ipMasked,
            boolean unusualLocation
    ) {
        public static NotificationDto from(UserNotification n) {
            return new NotificationDto(
                    n.getId(),
                    n.getEventType(),
                    n.getTitle(),
                    n.getBody(),
                    n.getActionUrl(),
                    n.getContextId(),
                    n.getCreatedAt(),
                    n.getReadAt() != null,
                    n.getIpSubnet(),
                    n.isUnusualLocation());
        }
    }

    record MarkAllResponse(int updated) {}
    record UnreadCountResponse(long count) {}
}
