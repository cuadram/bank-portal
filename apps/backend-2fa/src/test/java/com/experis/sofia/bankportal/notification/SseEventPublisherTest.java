package com.experis.sofia.bankportal.notification.infrastructure.redis;

import com.experis.sofia.bankportal.auth.application.SseEvent;
import com.experis.sofia.bankportal.auth.application.SseRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * DEBT-011 — Tests unitarios SseEventPublisher (Redis Pub/Sub multi-pod).
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
@ExtendWith(MockitoExtension.class)
class SseEventPublisherTest {

    @Mock StringRedisTemplate redisTemplate;
    @Mock SseRegistry          sseRegistry;

    private SseEventPublisher publisher;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        publisher = new SseEventPublisher(
                redisTemplate, sseRegistry, objectMapper, new SimpleMeterRegistry());
    }

    @Test
    @DisplayName("DEBT-011: publishToUser publica en canal sse:user:{userId}")
    void publishToUser_publishesOnCorrectChannel() throws Exception {
        // Arrange
        UUID userId = UUID.randomUUID();
        SseEvent event = SseEvent.of("BALANCE_UPDATED", "{\"amount\":100}");
        String expectedChannel = "sse:user:" + userId;
        // Act
        publisher.publishToUser(userId, event);
        // Assert
        ArgumentCaptor<String> channelCaptor = ArgumentCaptor.forClass(String.class);
        verify(redisTemplate).convertAndSend(channelCaptor.capture(), anyString());
        assertThat(channelCaptor.getValue()).isEqualTo(expectedChannel);
    }

    @Test
    @DisplayName("DEBT-011: fallback local cuando Redis no disponible")
    void publishToUser_redisFail_fallbackToLocal() {
        // Arrange
        UUID userId = UUID.randomUUID();
        SseEvent event = SseEvent.of("BALANCE_UPDATED", "{}");
        when(redisTemplate.convertAndSend(anyString(), anyString()))
                .thenThrow(new RedisConnectionFailureException("Redis down"));
        // Act
        publisher.publishToUser(userId, event);
        // Assert — debe llamar al fallback local sin lanzar excepción
        verify(sseRegistry).send(eq(userId), eq(event));
    }

    @Test
    @DisplayName("DEBT-011: publishBroadcast publica en canal sse:broadcast")
    void publishBroadcast_publishesOnBroadcastChannel() {
        // Arrange
        SseEvent event = SseEvent.of("MAINTENANCE", "{}");
        // Act
        publisher.publishBroadcast(event);
        // Assert
        ArgumentCaptor<String> channelCaptor = ArgumentCaptor.forClass(String.class);
        verify(redisTemplate).convertAndSend(channelCaptor.capture(), anyString());
        assertThat(channelCaptor.getValue()).isEqualTo("sse:broadcast");
    }

    @Test
    @DisplayName("DEBT-011: broadcast fallback local cuando Redis no disponible")
    void publishBroadcast_redisFail_fallbackToAll() {
        // Arrange
        SseEvent event = SseEvent.of("MAINTENANCE", "{}");
        when(redisTemplate.convertAndSend(anyString(), anyString()))
                .thenThrow(new RedisConnectionFailureException("Redis down"));
        // Act
        publisher.publishBroadcast(event);
        // Assert
        verify(sseRegistry).sendToAll(eq(event));
    }
}
