package com.experis.sofia.bankportal.notification.api;

import com.experis.sofia.bankportal.auth.application.SseEvent;
import com.experis.sofia.bankportal.auth.application.SseRegistry;
import com.experis.sofia.bankportal.notification.application.UnreadCountService;
import com.experis.sofia.bankportal.notification.application.NotificationActionService;
import com.experis.sofia.bankportal.notification.application.NotificationActionService.NotificationActionException;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

/**
 * US-305 — Endpoints SSE para notificaciones en tiempo real + acción directa US-304.
 *
 * <p>Rutas:
 * <pre>
 *   GET  /api/v1/notifications/stream              → SSE stream (US-305)
 *   POST /api/v1/notifications/{id}/revoke-session  → revocar sesión desde notif (US-304)
 * </pre>
 *
 * <p>SSE (ADR-012):
 * <ul>
 *   <li>1 conexión por usuario — SseRegistry last-write-wins</li>
 *   <li>Heartbeat cada 30s — gestionado por {@code SseHeartbeatScheduler}</li>
 *   <li>Last-Event-ID — replay de eventos perdidos en reconexión</li>
 *   <li>Headers ADR-010: X-Accel-Buffering + Cache-Control para CDN/Nginx</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 8 Semana 2
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class SseNotificationController {

    private final SseRegistry             sseRegistry;
    private final UnreadCountService      unreadCountService;
    private final NotificationActionService actionService;

    // ─────────────────────────────────────────────────────────────────────────
    // US-305 — SSE stream
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Conecta al stream SSE de notificaciones en tiempo real.
     *
     * <p>Al conectar envía inmediatamente el estado inicial de unread-count para
     * sincronizar el badge sin esperar al próximo evento.
     *
     * <p>Reconexión: si el cliente envía Last-Event-ID, el servidor emite
     * el unread-count actual (el replay completo de eventos lo gestiona el
     * NotificationEventPublisher @Async — fuera del scope de este método).
     *
     * @param jwt         JWT scope=full-session del usuario
     * @param lastEventId cabecera Last-Event-ID enviada por EventSource en reconexión
     * @param response    para añadir headers de CDN/proxy (ADR-010)
     * @return SseEmitter registrado en SseRegistry (ADR-012)
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
            HttpServletResponse response) {

        UUID userId = UUID.fromString(jwt.getSubject());

        // ADR-010: señalar a todos los proxies intermedios que no hagan buffering
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control", "no-cache, no-store");
        response.setHeader("Connection", "keep-alive");

        SseEmitter emitter = sseRegistry.register(userId);
        log.debug("[US-305] SSE stream conectado userId={} lastEventId={}", userId, lastEventId);

        // Estado inicial: unread-count actual (sincroniza badge al conectar/reconectar)
        long unread = unreadCountService.getUnreadCount(userId);
        sseRegistry.send(userId, SseEvent.unreadCount(unread));

        return emitter;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // US-304 — Revocar sesión directamente desde notificación
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Revoca la sesión asociada a una notificación sin abandonar el centro de notificaciones.
     *
     * <p>Requiere confirmación OTP previa en el frontend — este endpoint recibe
     * la acción post-confirmación.
     *
     * @param jwt            JWT scope=full-session
     * @param notificationId ID de la notificación desde la que se dispara la acción
     * @return 204 si la sesión fue revocada, 400 si la notificación no tiene sesión asociada
     */
    @PostMapping("/{id}/revoke-session")
    public ResponseEntity<Void> revokeSessionFromNotification(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable("id") UUID notificationId) {

        UUID userId = UUID.fromString(jwt.getSubject());
        try {
            actionService.revokeSessionFromNotification(userId, notificationId);
            return ResponseEntity.noContent().build();
        } catch (NotificationActionException e) {
            log.warn("[US-304] Accion fallida notifId={} userId={}: {}",
                    notificationId, userId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
