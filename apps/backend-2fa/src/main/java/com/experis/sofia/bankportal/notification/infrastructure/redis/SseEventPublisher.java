package com.experis.sofia.bankportal.notification.infrastructure.redis;

import com.experis.sofia.bankportal.auth.application.SseEvent;
import com.experis.sofia.bankportal.auth.application.SseRegistry;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * ADR-014 — Punto único de publicación de eventos SSE.
 *
 * <p>Publica en Redis Pub/Sub para que el evento llegue al cliente SSE
 * independientemente del pod al que esté conectado (multi-pod).
 * Fallback automático a {@link SseRegistry#send} local si Redis no disponible.
 *
 * <p><strong>Migración:</strong> todo código que antes llamaba a
 * {@code sseRegistry.send(userId, event)} directamente debe usar este publisher.
 *
 * @author SOFIA Developer Agent — DEBT-011 Sprint 9
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SseEventPublisher {

    private final StringRedisTemplate redisTemplate;
    private final SseRegistry         sseRegistry;
    private final ObjectMapper        objectMapper;
    private final MeterRegistry       meterRegistry;

    private static final String USER_CHANNEL_PREFIX = "sse:user:";
    private static final String BROADCAST_CHANNEL   = "sse:broadcast";

    /**
     * Publica un evento dirigido a un usuario específico.
     * Cross-pod vía Redis; fallback a envío local si Redis no disponible.
     */
    public void publishToUser(UUID userId, SseEvent event) {
        String channel = USER_CHANNEL_PREFIX + userId;
        try {
            String payload = objectMapper.writeValueAsString(event);
            redisTemplate.convertAndSend(channel, payload);
        } catch (RedisConnectionFailureException ex) {
            log.warn("[DEBT-011] Redis no disponible, fallback local userId={}", userId);
            meterRegistry.counter("sse.redis.fallback.count").increment();
            sseRegistry.send(userId, event);
        } catch (JsonProcessingException ex) {
            log.error("[DEBT-011] Error serializando SseEvent type={}: {}", event.type(), ex.getMessage());
        }
    }

    /**
     * Publica un evento a todos los usuarios conectados (broadcast global).
     */
    public void publishBroadcast(SseEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            redisTemplate.convertAndSend(BROADCAST_CHANNEL, payload);
        } catch (RedisConnectionFailureException ex) {
            log.warn("[DEBT-011] Redis broadcast no disponible, fallback local");
            meterRegistry.counter("sse.redis.fallback.count").increment();
            sseRegistry.sendToAll(event);
        } catch (JsonProcessingException ex) {
            log.error("[DEBT-011] Error serializando broadcast event: {}", ex.getMessage());
        }
    }
}
