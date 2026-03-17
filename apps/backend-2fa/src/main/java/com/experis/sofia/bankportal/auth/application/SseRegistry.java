package com.experis.sofia.bankportal.auth.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ADR-012 — Registro centralizado de conexiones SSE activas.
 *
 * <p>Garantiza máximo 1 conexión activa por usuario (last-write-wins).
 * Thread-safe mediante {@link ConcurrentHashMap}.
 * Límite global configurable: {@value MAX_TOTAL_CONNECTIONS} conexiones.
 *
 * @author SOFIA Developer Agent — Sprint 8
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SseRegistry {

    static final long EMITTER_TIMEOUT_MS    = 300_000L;  // 5 min
    static final int  MAX_TOTAL_CONNECTIONS = 200;

    private final ConcurrentHashMap<UUID, SseEmitter> registry = new ConcurrentHashMap<>();

    /**
     * Registra o reemplaza la conexión SSE del usuario.
     * Si ya existe una activa la cierra primero (nueva pestaña gana — last-write-wins).
     *
     * @throws SseCapacityExceededException si el pool está lleno y el usuario es nuevo
     */
    public SseEmitter register(UUID userId) {
        if (registry.size() >= MAX_TOTAL_CONNECTIONS && !registry.containsKey(userId)) {
            throw new SseCapacityExceededException("SSE pool at capacity: " + MAX_TOTAL_CONNECTIONS);
        }

        SseEmitter existing = registry.get(userId);
        if (existing != null) {
            existing.complete();
            log.debug("[SSE] Conexión anterior cerrada para userId={}", userId);
        }

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        registry.put(userId, emitter);

        Runnable cleanup = () -> {
            registry.remove(userId, emitter);
            log.debug("[SSE] Conexión limpiada userId={}", userId);
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(ex -> cleanup.run());

        log.debug("[SSE] Conexión registrada userId={} total={}", userId, registry.size());
        return emitter;
    }

    /**
     * Envía un evento al usuario si tiene conexión activa.
     * No lanza excepción si el usuario está offline — es un estado válido.
     */
    public void send(UUID userId, SseEvent event) {
        SseEmitter emitter = registry.get(userId);
        if (emitter == null) return;
        try {
            emitter.send(SseEmitter.event()
                    .id(event.id())
                    .name(event.type())
                    .data(event.payload()));
        } catch (IOException e) {
            registry.remove(userId, emitter);
            log.debug("[SSE] Error enviando evento a userId={} — conexión eliminada", userId);
        }
    }

    /**
     * Invalida la conexión SSE del usuario (DEBT-009: JWT blacklist).
     */
    public void invalidate(UUID userId) {
        SseEmitter emitter = registry.remove(userId);
        if (emitter != null) {
            emitter.complete();
            log.info("[SSE] Conexión invalidada por JWT blacklist userId={}", userId);
        }
    }

    public boolean isConnected(UUID userId) {
        return registry.containsKey(userId);
    }

    public int activeConnections() {
        return registry.size();
    }

    // ── Excepción de capacidad ────────────────────────────────────────────────

    public static class SseCapacityExceededException extends RuntimeException {
        public SseCapacityExceededException(String message) {
            super(message);
        }
    }
}
