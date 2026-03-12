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
 * <p>Complemento a {@link PreAuthTokenProvider}: este componente emite
 * tokens JWT de sesión válidos, firmados con el secreto principal
 * ({@code jwt.secret}). A diferencia del pre-auth token, este token
 * NO tiene el claim {@code pre_auth} y habilita acceso a todos los
 * endpoints protegidos.</p>
 *
 * <p>El token incluye:
 * <ul>
 *   <li>{@code sub} — userId (UUID)</li>
 *   <li>{@code preferred_username} — username del usuario</li>
 *   <li>{@code iat}, {@code exp} — issued-at y expiration</li>
 * </ul>
 * </p>
 *
 * <p>FEAT-001 | US-002 | ADR-001</p>
 *
 * @since 1.0.0
 */
@Component
public class JwtTokenProvider {

    private static final String CLAIM_USERNAME = "preferred_username";
    /** TTL por defecto: 8 horas — jornada laboral bancaria típica. */
    private static final long DEFAULT_TTL_MS = 8L * 60 * 60 * 1000;

    private final SecretKey signingKey;

    /**
     * Construye el provider con el secreto de firma principal.
     *
     * @param jwtProperties propiedades JWT — usa {@code secret}
     */
    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.signingKey = Keys.hmacShaKeyFor(
            jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Genera un JWT de sesión completa para el usuario autenticado.
     *
     * @param userId   UUID del usuario
     * @param username nombre de usuario (se incluye como claim)
     * @return JWT firmado con HS256, TTL=8h
     */
    public String generate(UUID userId, String username) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .subject(userId.toString())
            .claim(CLAIM_USERNAME, username)
            .issuedAt(new Date(now))
            .expiration(new Date(now + DEFAULT_TTL_MS))
            .signWith(signingKey)
            .compact();
    }

    /**
     * Valida un JWT de sesión y extrae el userId.
     *
     * @param token JWT a validar
     * @return UUID del usuario si el token es válido
     * @throws JwtTokenInvalidException si el token es inválido, expirado o malformado
     */
    public UUID validateAndExtractUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
            return UUID.fromString(claims.getSubject());
        } catch (ExpiredJwtException e) {
            throw new JwtTokenInvalidException("Token de sesión expirado. Inicie sesión nuevamente.");
        } catch (Exception e) {
            throw new JwtTokenInvalidException("Token de sesión inválido.");
        }
    }

    /**
     * Extrae el username del claim {@code preferred_username} sin validar firma.
     *
     * <p><strong>Solo usar después de {@link #validateAndExtractUserId(String)}.</strong>
     * Este método asume que el token ya fue validado.</p>
     *
     * @param token JWT ya validado
     * @return username del usuario
     */
    public String extractUsername(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .get(CLAIM_USERNAME, String.class);
    }

    /**
     * Excepción lanzada cuando el JWT de sesión no supera la validación.
     */
    public static class JwtTokenInvalidException extends RuntimeException {
        public JwtTokenInvalidException(String message) {
            super(message);
        }
    }
}
