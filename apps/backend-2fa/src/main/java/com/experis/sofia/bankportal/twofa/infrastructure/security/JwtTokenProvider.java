package com.experis.sofia.bankportal.twofa.infrastructure.security;

import com.experis.sofia.bankportal.twofa.infrastructure.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Proveedor de JWT de sesión completa (full-auth token).
 *
 * <p><strong>DEBT-023 (Sprint 14):</strong> Se añade {@code jti} (UUID v4) al payload
 * JWT para habilitar la revocación individual de sesiones (US-1205).
 * Prerequisito para {@code RevokedTokenFilter} y {@code ManageSessionsUseCase}.</p>
 *
 * <p>FEAT-001 | US-002 | ADR-001</p>
 *
 * @since 1.0.0
 */
@Component
public class JwtTokenProvider {

    private static final String CLAIM_USERNAME = "preferred_username";

    private final SecretKey signingKey;
    private final long      sessionTtlMillis;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.signingKey       = Keys.hmacShaKeyFor(
            jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
        this.sessionTtlMillis = jwtProperties.sessionTtlSeconds() * 1000L;
    }

    /**
     * Genera un JWT de sesión completa para el usuario autenticado.
     *
     * <p>DEBT-023: incluye {@code jti} (JWT ID) como UUID v4 único por token.
     * Permite la revocación individual de sesiones via {@code revoked_tokens} + Redis.</p>
     *
     * @param userId   UUID del usuario
     * @param username nombre de usuario (claim {@code preferred_username})
     * @return JWT firmado con HS256, TTL configurable (default 8h), con jti
     */
    public String generate(UUID userId, String username) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .id(UUID.randomUUID().toString())          // DEBT-023: jti claim
            .subject(userId.toString())
            .claim(CLAIM_USERNAME, username)
            .issuedAt(new Date(now))
            .expiration(new Date(now + sessionTtlMillis))
            .signWith(signingKey)
            .compact();
    }

    /**
     * Valida un JWT de sesión y extrae userId, username y jti en una sola operación.
     *
     * @param token JWT a validar
     * @return {@link JwtClaims} con userId, username, jti y expiresAt
     * @throws JwtTokenInvalidException si el token es inválido, expirado o malformado
     */
    public JwtClaims validateAndExtract(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

            UUID   userId   = UUID.fromString(claims.getSubject());
            String username = claims.get(CLAIM_USERNAME, String.class);
            String jti      = claims.getId();                       // DEBT-023
            Instant expiresAt = claims.getExpiration().toInstant(); // para revocación TTL

            return new JwtClaims(userId, username, jti, expiresAt);
        } catch (ExpiredJwtException e) {
            throw new JwtTokenInvalidException("Token de sesión expirado.");
        } catch (Exception e) {
            throw new JwtTokenInvalidException("Token de sesión inválido.");
        }
    }

    /** TTL del token en milisegundos — usado por ManageSessionsUseCase para calcular TTL Redis. */
    public long sessionTtlMillis() { return sessionTtlMillis; }

    /**
     * Claims extraídos de un JWT de sesión válido.
     *
     * @param userId    UUID del usuario autenticado
     * @param username  nombre de usuario (email)
     * @param jti       JWT ID — UUID único por token (DEBT-023)
     * @param expiresAt expiración del token (para calcular TTL de revocación)
     */
    public record JwtClaims(UUID userId, String username, String jti, Instant expiresAt) {}

    /** Excepción lanzada cuando el JWT de sesión no supera la validación. */
    public static class JwtTokenInvalidException extends RuntimeException {
        public JwtTokenInvalidException(String message) { super(message); }
    }
}
