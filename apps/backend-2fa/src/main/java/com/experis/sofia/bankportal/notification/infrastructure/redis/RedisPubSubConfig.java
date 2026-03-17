package com.experis.sofia.bankportal.notification.infrastructure.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;

/**
 * ADR-014 — Configuración Redis Pub/Sub para SSE multi-pod.
 *
 * <p>Suscripciones:
 * <ul>
 *   <li>{@code sse:user:*} — eventos dirigidos a usuario específico (patrón)</li>
 *   <li>{@code sse:broadcast} — eventos globales a todos los usuarios conectados</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — DEBT-011 Sprint 9
 */
@Configuration
@RequiredArgsConstructor
public class RedisPubSubConfig {

    private final RedisConnectionFactory connectionFactory;

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            SseRedisSubscriber subscriber) {

        MessageListenerAdapter adapter = new MessageListenerAdapter(subscriber);

        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);

        // Patrón: sse:user:{userId} — eventos por usuario
        container.addMessageListener(adapter, new PatternTopic("sse:user:*"));

        // Canal fijo: sse:broadcast — eventos a todos
        container.addMessageListener(adapter, new ChannelTopic("sse:broadcast"));

        return container;
    }
}
