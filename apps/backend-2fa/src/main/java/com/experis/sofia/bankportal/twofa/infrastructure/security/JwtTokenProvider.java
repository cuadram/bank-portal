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
 * DEBT-023 (Sprint 14): jti UUID v4 en payload JWT.
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

    public String generate(UUID userId, String username) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .id(UUID.randomUUID().toString())
            .subject(userId.toString())
            .claim(CLAIM_USERNAME, username)
            .issuedAt(new Date(now))
            .expiration(new Date(now + sessionTtlMillis))
            .signWith(signingKey)
            .compact();
    }

    public JwtClaims validateAndExtract(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
            UUID    userId    = UUID.fromString(claims.getSubject());
            String  username  = claims.get(CLAIM_USERNAME, String.class);
            String  jti       = claims.getId();
            Instant expiresAt = claims.getExpiration().toInstant();
            return new JwtClaims(userId, username, jti, expiresAt);
        } catch (ExpiredJwtException e) {
            throw new JwtTokenInvalidException("Token de sesión expirado.");
        } catch (Exception e) {
            throw new JwtTokenInvalidException("Token de sesión inválido.");
        }
    }

    public long sessionTtlMillis() { return sessionTtlMillis; }

    public record JwtClaims(UUID userId, String username, String jti, Instant expiresAt) {}

    public static class JwtTokenInvalidException extends RuntimeException {
        public JwtTokenInvalidException(String message) { super(message); }
    }
}
