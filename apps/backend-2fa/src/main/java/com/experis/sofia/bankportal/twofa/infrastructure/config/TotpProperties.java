package com.experis.sofia.bankportal.twofa.infrastructure.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades de configuración del módulo TOTP.
 *
 * <p>Se inyectan desde {@code application.yml} bajo el prefijo {@code totp}.
 * La clave AES se lee en formato Base64 (32 bytes = 256 bits para AES-256).</p>
 *
 * <pre>
 * totp:
 *   issuer: ${TOTP_ISSUER}
 *   aes-key: ${TOTP_AES_KEY}      # Base64 de 32 bytes
 *   period: 30
 *   code-digits: 6
 *   tolerance: 1
 * </pre>
 *
 * <p>FEAT-001 | US-006 | ADR-004</p>
 *
 * @param issuer     nombre del emisor mostrado en apps TOTP (ej. "BankMeridian")
 * @param aesKey     clave AES-256 en Base64 (TOTP_AES_KEY env var)
 * @param period     ventana de tiempo en segundos (RFC 6238: 30)
 * @param codeDigits longitud del OTP (RFC 6238: 6)
 * @param tolerance  ventanas de tolerancia (±1 = acepta código anterior/siguiente)
 * @since 1.0.0
 */
@ConfigurationProperties(prefix = "totp")
public record TotpProperties(
        String issuer,
        String aesKey,
        int period,
        int codeDigits,
        int tolerance
) {}
