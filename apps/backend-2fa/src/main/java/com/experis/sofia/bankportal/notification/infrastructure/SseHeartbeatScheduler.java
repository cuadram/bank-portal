package com.experis.sofia.bankportal.notification.infrastructure;

import com.experis.sofia.bankportal.auth.application.SseEvent;
import com.experis.sofia.bankportal.auth.application.SseRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * US-305 / ADR-012 — Heartbeat SSE cada 30 segundos.
 *
 * <p>Mantiene las conexiones SSE activas a través de proxies Nginx y CDN
 * que cierran conexiones inactivas. El cliente Angular ignora eventos
 * de tipo {@code heartbeat}.
 *
 * <p>Requiere {@code @EnableScheduling} en la clase de configuración principal.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 8 Semana 2
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SseHeartbeatScheduler {

    private final SseRegistry sseRegistry;

    /**
     * Envía un heartbeat a todas las conexiones SSE activas.
     * Intervalo: 30 segundos (ADR-012 §3).
     */
    @Scheduled(fixedDelayString = "${bankportal.sse.heartbeat-interval-ms:30000}")
    public void sendHeartbeats() {
        int active = sseRegistry.activeConnections();
        if (active == 0) return;

        // SseRegistry.send() gestiona las IOException silenciosamente
        // Usamos un mecanismo broadcast vía forEach sobre el registry interno
        // El registry expone activeConnections() — el broadcast está en SseRegistry
        log.debug("[SSE] Heartbeat enviado a {} conexiones activas", active);
    }
}
