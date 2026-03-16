package com.experis.sofia.bankportal.session.infrastructure.cache;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Adaptador Redis para blacklist de tokens y metadatos de sesiones activas.
 *
 * <p>Namespaces Redis (ADR-006):
 * <ul>
 *   <li>{@code sessions:blacklist:{jti}} → "1" con TTL = tiempo restante del JWT</li>
 *   <li>{@code sessions:active:{userId}:{jti}} → sessionId con TTL = timeout usuario</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Component
@RequiredArgsConstructor
public class SessionRedisAdapter {

    private static final String BLACKLIST_PREFIX = "sessions:blacklist:";
    private static final String ACTIVE_PREFIX    = "sessions:active:";

    private final StringRedisTemplate redisTemplate;

    /**
     * Añade un JTI a la blacklist con TTL para que expire automáticamente.
     *
     * @param jti           JWT ID a invalidar
     * @param remainingTtl  tiempo restante de vida del token
     */
    public void addToBlacklist(String jti, Duration remainingTtl) {
        redisTemplate.opsForValue().set(
                BLACKLIST_PREFIX + jti, "1", remainingTtl);
    }

    /**
     * Comprueba si un JTI está en la blacklist.
     *
     * @param jti JWT ID a verificar
     * @return {@code true} si el token ha sido revocado
     */
    public boolean isBlacklisted(String jti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + jti));
    }

    /**
     * Registra una sesión activa en Redis para lookup rápido.
     *
     * @param userId         ID del usuario (string)
     * @param jti            JWT ID de la sesión
     * @param sessionId      UUID de la sesión en PostgreSQL
     * @param timeoutMinutes timeout de inactividad configurado por el usuario
     */
    public void setActiveSession(String userId, String jti,
                                  String sessionId, Duration timeout) {
        redisTemplate.opsForValue().set(
                ACTIVE_PREFIX + userId + ":" + jti, sessionId, timeout);
    }

    /**
     * Elimina una sesión del cache de activas (tras revocación).
     */
    public void removeActiveSession(String userId, String jti) {
        redisTemplate.delete(ACTIVE_PREFIX + userId + ":" + jti);
    }
}
