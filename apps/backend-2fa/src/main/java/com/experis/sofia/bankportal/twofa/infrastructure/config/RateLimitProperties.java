package com.experis.sofia.bankportal.twofa.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades de configuración del rate limiter Bucket4j (ADR-002).
 *
 * <pre>
 * rate-limit:
 *   capacity: 5           # max intentos OTP por ventana
 *   window-minutes: 10    # ventana de recarga de tokens
 *   block-minutes: 15     # tiempo de bloqueo al agotar capacidad
 * </pre>
 *
 * <p>FEAT-001 | US-006 | ADR-002</p>
 *
 * @param capacity      máximo de intentos OTP antes de bloquear
 * @param windowMinutes ventana de recarga del bucket (minutos)
 * @param blockMinutes  duración del bloqueo al agotar intentos (minutos)
 * @since 1.0.0
 */
@ConfigurationProperties(prefix = "rate-limit")
public record RateLimitProperties(
        long capacity,
        long windowMinutes,
        long blockMinutes
) {}
