package com.experis.sofia.bankportal.notification.infrastructure.redis;

import com.experis.sofia.bankportal.auth.application.SseEvent;
import com.experis.sofia.bankportal.auth.application.SseRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * ADR-014 — Listener Redis Pub/Sub para eventos SSE cross-pod.
 *
 * <p>Se ejecuta en CADA pod. Solo el pod que tiene la conexión SSE activa
 * del usuario entregará el evento — los demás llaman a {@code SseRegistry.send()}
 * y lo descartan silenciosamente (usuario no conectado en ese pod).
 *
 * @author SOFIA Developer Agent — DEBT-011 Sprint 9
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SseRedisSubscriber implements MessageListener {

    private final SseRegistry  sseRegistry;
    private final ObjectMapper objectMapper;

    private static final String USER_CHANNEL_PREFIX = "sse:user:";
    private static final String BROADCAST_CHANNEL   = "sse:broadcast";

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            SseEvent event = objectMapper.readValue(message.getBody(), SseEvent.class);

            if (channel.startsWith(USER_CHANNEL_PREFIX)) {
                UUID userId = UUID.fromString(channel.substring(USER_CHANNEL_PREFIX.length()));
                sseRegistry.send(userId, event);   // no-op si este pod no tiene la conexión
            } else if (BROADCAST_CHANNEL.equals(channel)) {
                sseRegistry.sendToAll(event);
            }
        } catch (Exception ex) {
            log.error("[DEBT-011] Error procesando mensaje Redis SSE canal={}: {}",
                    new String(message.getChannel()), ex.getMessage());
        }
    }
}
