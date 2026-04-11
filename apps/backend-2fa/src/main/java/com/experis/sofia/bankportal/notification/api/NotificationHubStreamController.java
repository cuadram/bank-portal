package com.experis.sofia.bankportal.notification.api;

import com.experis.sofia.bankportal.notification.application.NotificationHubSseRegistry;
import com.experis.sofia.bankportal.notification.domain.NotificationCategory;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * GET /api/v1/notifications/stream — FEAT-014 SSE multicanal.
 *
 * <p>Endpoint SSE separado del {@code SseNotificationController} (FEAT-004)
 * para no modificar el contrato existente. Soporta:
 * <ul>
 *   <li>Filtro por categorías vía query param {@code categories} (CSV).</li>
 *   <li>Reconexión sin pérdida vía header {@code Last-Event-ID} + replay Redis.</li>
 *   <li>Heartbeat cada 30 s (comentario SSE {@code : heartbeat}).</li>
 * </ul>
 *
 * <p>Ruta: {@code /api/v1/notifications/hub/stream} para diferenciar del
 * stream FEAT-004 en {@code /api/v1/notifications/stream}.
 *
 * @author SOFIA Developer Agent — FEAT-014 Sprint 16
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/notifications/hub")
@RequiredArgsConstructor
public class NotificationHubStreamController {

    private final NotificationHubSseRegistry sseRegistry;

    /**
     * GET /api/v1/notifications/hub/stream
     *
     * @param categories  CSV de categorías a suscribir. Vacío = todas.
     *                    Ejemplo: {@code SECURITY,TRANSACTION}
     * @param lastEventId Cabecera {@code Last-Event-ID} para replay de eventos perdidos.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            HttpServletRequest request,
            @RequestParam(required = false, defaultValue = "") String categories,
            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
            HttpServletResponse response) {

        UUID userId = (UUID) request.getAttribute("authenticatedUserId");

        // Cabeceras ADR-010: evitar buffering en proxies/CDN
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control", "no-cache, no-store");
        response.setHeader("Connection", "keep-alive");

        Set<NotificationCategory> categoryFilter = parseCategories(categories);

        log.debug("[Hub-SSE] stream connect userId={} categories={} lastEventId={}",
                userId, categoryFilter, lastEventId);

        return sseRegistry.subscribe(userId, categoryFilter, lastEventId);
    }

    // ── private ──────────────────────────────────────────────────────────────

    private Set<NotificationCategory> parseCategories(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try { return NotificationCategory.valueOf(s.toUpperCase()); }
                    catch (IllegalArgumentException e) { return null; }
                })
                .filter(c -> c != null)
                .collect(Collectors.toUnmodifiableSet());
    }
}
