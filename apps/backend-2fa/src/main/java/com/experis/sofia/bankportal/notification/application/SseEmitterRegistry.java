package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.notification.domain.UserNotification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registro de conexiones SSE activas por usuario.
 * Máximo 1 conexión SSE por usuario (R-F4-001) — la nueva reemplaza la anterior.
 *
 * <p>Patrón: ConcurrentHashMap de userId → SseEmitter.
 * Spring MVC gestiona el ciclo de vida del emitter; este registro
 * mantiene la referencia para enviar eventos desde el servidor.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5
 */
@Slf4j
@Component
public class SseEmitterRegistry {

    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();

    /** Timeout por defecto: 5 minutos. El cliente reconectará automáticamente. */
    private static final long SSE_TIMEOUT_MS = 5 * 60 * 1000L;

    /**
     * Registra una nueva conexión SSE para el usuario.
     * Si ya existe una conexión, la reemplaza (R-F4-001: límite 1 por usuario).
     *
     * @param userId ID del usuario
     * @return SseEmitter configurado con timeout y callbacks de limpieza
     */
    public SseEmitter register(UUID userId) {
        // Completar la conexión anterior si existe
        SseEmitter existing = emitters.remove(userId);
        if (existing != null) {
            try { existing.complete(); } catch (Exception ignored) {}
        }

        var emitter = new SseEmitter(SSE_TIMEOUT_MS);
        emitters.put(userId, emitter);

        // Limpiar del registro cuando la conexión termine
        Runnable cleanup = () -> {
            emitters.remove(userId, emitter);
            log.debug("SSE connection closed for userId={}", userId);
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(ex -> {
            cleanup.run();
            log.debug("SSE error for userId={}: {}", userId, ex.getMessage());
        });

        log.debug("SSE connection registered for userId={}", userId);
        return emitter;
    }

    /**
     * Envía un evento SSE a un usuario específico.
     * Falla silenciosamente si el usuario no tiene conexión activa (R-F4-003 — el
     * badge se actualiza por polling de fallback en el siguiente tick de 60s).
     *
     * @param userId ID del usuario destinatario
     * @param event  evento a enviar
     */
    public void sendToUser(UUID userId, NotificationSseEvent event) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) {
            log.debug("No SSE connection for userId={} — event will be picked up by polling", userId);
            return;
        }
        try {
            emitter.send(SseEmitter.event()
                    .name("security-notification")
                    .data(event));
            log.debug("SSE event sent to userId={} type={}", userId, event.eventType());
        } catch (IOException e) {
            // Conexión rota — limpiar del registro
            emitters.remove(userId, emitter);
            log.debug("SSE send failed for userId={} — removed from registry", userId);
        }
    }

    /** @return número de conexiones SSE activas (para métricas/health). */
    public int activeConnections() {
        return emitters.size();
    }
}
