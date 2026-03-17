package com.experis.sofia.bankportal.auth.infrastructure;

import com.experis.sofia.bankportal.auth.application.SseRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * DEBT-009 — Blacklist de JWTs invalidados antes de su expiración natural.
 *
 * <p>Extiende ADR-006 (Redis session blacklist) al scope JWT {@code context-pending}.
 * Tras {@code confirmContext} (US-603) el JWT context-pending se invalida inmediatamente
 * para evitar reutilización.
 *
 * <p>Clave Redis: {@code "jwt:blacklist:{jwtId}"}
 * TTL: tiempo restante del JWT (nunca acumula claves huérfanas).
 *
 * <p>Cost por request: 1 Redis GET (~0.2ms) — aceptable según ADR-012.
 *
 * @author SOFIA Developer Agent — DEBT-009 Sprint 8
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtBlacklistService {

    private final StringRedisTemplate redisTemplate;
    private final SseRegistry         sseRegistry;

    static final String PREFIX = "jwt:blacklist:";

    // ─────────────────────────────────────────────────────────────────────────
    // Blacklist
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Añade el JWT a la blacklist con TTL igual al tiempo restante hasta expiración.
     *
     * <p>Si el JWT ya expiró ({@code expiresAt} en el pasado) la operación es no-op
     * — el token ya es inválido por expiración natural.
     *
     * <p>Invalida adicionalmente la conexión SSE activa del usuario (ADR-012).
     *
     * @param jwtId     claim {@code jti} del JWT (UUID único por token)
     * @param userId    claim {@code sub} — para invalidar SSE
     * @param expiresAt expiración original del JWT
     */
    public void blacklist(String jwtId, UUID userId, Instant expiresAt) {
        Duration ttl = Duration.between(Instant.now(), expiresAt);
        if (ttl.isNegative() || ttl.isZero()) {
            log.debug("[DEBT-009] JWT ya expirado, no se añade a blacklist jti={}", jwtId);
            return;
        }

        redisTemplate.opsForValue().set(PREFIX + jwtId, userId.toString(), ttl);

        // Invalida conexión SSE activa con este userId (ADR-012)
        sseRegistry.invalidate(userId);

        log.info("[DEBT-009] JWT blacklisted jti={} userId={} ttl={}s",
                jwtId, userId, ttl.getSeconds());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Consulta
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Verifica si el JWT está en la blacklist.
     * Llamado por {@code JwtAuthenticationFilter} en cada request autenticado.
     *
     * @param jwtId claim {@code jti} del JWT a verificar
     * @return {@code true} si el token fue revocado
     */
    public boolean isBlacklisted(String jwtId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(PREFIX + jwtId));
    }
}
