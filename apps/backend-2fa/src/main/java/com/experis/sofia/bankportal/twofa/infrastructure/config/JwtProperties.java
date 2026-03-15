package com.experis.sofia.bankportal.twofa.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades de configuración JWT para el módulo 2FA.
 *
 * <pre>
 * jwt:
 *   secret: ${JWT_SECRET}
 *   pre-auth-secret: ${JWT_PRE_AUTH_SECRET}
 *   pre-auth-ttl-seconds: ${JWT_PRE_AUTH_TTL_SECONDS:300}
 *   session-ttl-seconds: ${JWT_SESSION_TTL_SECONDS:28800}
 * </pre>
 *
 * <p>FEAT-001 | US-006 | ADR-001</p>
 *
 * @param secret             secreto para JWT completo (HS256 — min. 32 bytes)
 * @param preAuthSecret      secreto independiente para pre-auth tokens (ADR-001)
 * @param preAuthTtlSeconds  TTL del pre-auth token en segundos (default: 300 = 5 min)
 * @param sessionTtlSeconds  TTL del JWT de sesión en segundos (default: 28800 = 8h) — RV-008 fix
 * @since 1.0.0
 */
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        String secret,
        String preAuthSecret,
        long preAuthTtlSeconds,
        long sessionTtlSeconds
) {}
