package com.experis.sofia.bankportal.twofa.infrastructure.security;

import com.experis.sofia.bankportal.twofa.infrastructure.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

/**
 * Proveedor de JWT de sesión completa (full-auth token).
 *
 * <p><strong>RV-007 fix:</strong> Se reemplazaron los métodos {@code validateAndExtractUserId}
 * y {@code extractUsername} por {@link #validateAndExtract(String)} que retorna un record
 * {@link JwtClaims} con userId + username en una sola operación de parseo/verificación.</p>
 *
 * <p><strong>RV-008 fix:</strong> El TTL de sesión es ahora configurable via
 * {@code jwt.session-ttl-seconds} (env var {@code JWT_SESSION_TTL_SECONDS}, default 28800 = 8h).</p>
 *
 * <p>FEAT-001 | US-002 | ADR-001</p>
 *
 * @since 1.0.0
 */
@Component
public class JwtTokenProvider {

    private static final String CLAIM_USERNAME = "preferred_username";

    private final SecretKey signingKey;
    private final long sessionTtlMillis;

    /**
     * Construye el provider con el secreto de firma y TTL de sesión configurados.
     *
     * @param jwtProperties propiedades JWT — usa {@code secret} y {@code sessionTtlSeconds}
     */
    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.signingKey       = Keys.hmacShaKeyFor(
            jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
        this.sessionTtlMillis = jwtProperties.sessionTtlSeconds() * 1000L;
    }

    /**
     * Genera un JWT de sesión completa para el usuario autenticado.
     *
     * @param userId   UUID del usuario
     * @param username nombre de usuario (se incluye como claim {@code preferred_username})
     * @return JWT firmado con HS256, TTL configurable (default 8h)
     */
    public String generate(UUID userId, String username) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .subject(userId.toString())
            .claim(CLAIM_USERNAME, username)
            .issuedAt(new Date(now))
            .expiration(new Date(now + sessionTtlMillis))
            .signWith(signingKey)
            .compact();
    }

    /**
     * Valida un JWT de sesión y extrae userId y username en una sola operación.
     *
     * <p><strong>RV-007 fix:</strong> Una sola verificación de firma por request.
     * Reemplaza el patrón de dos llamadas separadas (validateAndExtractUserId + extractUsername).</p>
     *
     * @param token JWT a validar
     * @return {@link JwtClaims} con userId y username extraídos
     * @throws JwtTokenInvalidException si el token es inválido, expirado o malformado
     */
    public JwtClaims validateAndExtract(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
            UUID userId   = UUID.fromString(claims.getSubject());
            String username = claims.get(CLAIM_USERNAME, String.class);
            return new JwtClaims(userId, username);
        } catch (ExpiredJwtException e) {
            throw new JwtTokenInvalidException("Token de sesión expirado. Inicie sesión nuevamente.");
        } catch (Exception e) {
            throw new JwtTokenInvalidException("Token de sesión inválido.");
        }
    }

    /**
     * Claims extraídos de un JWT de sesión válido.
     *
     * @param userId   UUID del usuario autenticado
     * @param username nombre de usuario
     */
    public record JwtClaims(UUID userId, String username) {}

    /**
     * Excepción lanzada cuando el JWT de sesión no supera la validación.
     */
    public static class JwtTokenInvalidException extends RuntimeException {
        public JwtTokenInvalidException(String message) {
            super(message);
        }
    }
}
