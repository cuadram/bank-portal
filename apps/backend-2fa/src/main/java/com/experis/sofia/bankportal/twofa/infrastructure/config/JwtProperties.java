package com.experis.sofia.bankportal.twofa.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades de configuración JWT para el módulo 2FA.
 *
 * <pre>
 * jwt:
 *   secret: ${JWT_SECRET}
 *   pre-auth-secret: ${PRE_AUTH_TOKEN_SECRET}
 *   pre-auth-ttl-seconds: 300
 * </pre>
 *
 * <p>FEAT-001 | US-006 | ADR-001</p>
 *
 * @param secret            secreto para JWT completo (firmado con HS256)
 * @param preAuthSecret     secreto independiente para pre-auth tokens (ADR-001)
 * @param preAuthTtlSeconds TTL del pre-auth token en segundos (default: 300 = 5 min)
 * @since 1.0.0
 */
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        String secret,
        String preAuthSecret,
        Long preAuthTtlSeconds
) {}
