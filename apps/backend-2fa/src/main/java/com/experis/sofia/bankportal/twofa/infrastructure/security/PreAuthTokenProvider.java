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
 * Proveedor de pre-auth tokens JWT — ADR-001.
 *
 * <p>Un pre-auth token es un JWT de vida corta (TTL=5min) emitido tras
 * la verificación exitosa de contraseña, cuando el usuario tiene 2FA activo.
 * Contiene el claim {@code pre_auth=true} que distingue este token de un
 * JWT de sesión completa. El frontend lo usa para autenticar {@code POST /2fa/verify}.</p>
 *
 * <p>Usa un secreto independiente ({@code jwt.pre-auth-secret}) para que un
 * pre-auth token comprometido no pueda falsificarse como JWT completo.</p>
 *
 * <p>FEAT-001 | US-006 | ADR-001</p>
 *
 * @since 1.0.0
 */
@Component
public class PreAuthTokenProvider {

    private static final String CLAIM_PRE_AUTH = "pre_auth";
    private static final String CLAIM_USER_ID  = "uid";

    private final SecretKey signingKey;
    private final long ttlMillis;

    /**
     * Construye el provider con la clave de firma y TTL configurados.
     *
     * @param jwtProperties propiedades JWT — usa {@code preAuthSecret} y {@code preAuthTtlSeconds}
     */
    public PreAuthTokenProvider(JwtProperties jwtProperties) {
        this.signingKey = Keys.hmacShaKeyFor(
            jwtProperties.preAuthSecret().getBytes(StandardCharsets.UTF_8));
        this.ttlMillis = jwtProperties.preAuthTtlSeconds() * 1000L;
    }

    /**
     * Genera un pre-auth JWT para el usuario identificado.
     *
     * @param userId UUID del usuario autenticado (password OK, 2FA pendiente)
     * @return JWT firmado con HS256, claim {@code pre_auth=true}, TTL=5min
     */
    public String generate(UUID userId) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .claim(CLAIM_USER_ID, userId.toString())
            .claim(CLAIM_PRE_AUTH, true)
            .issuedAt(new Date(now))
            .expiration(new Date(now + ttlMillis))
            .signWith(signingKey)
            .compact();
    }

    /**
     * Valida un pre-auth token y extrae el userId.
     *
     * @param token JWT pre-auth a validar
     * @return UUID del usuario extraído del claim {@code uid}
     * @throws PreAuthTokenInvalidException si el token es inválido, expirado o malformado
     */
    public UUID validate(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

            Boolean isPreAuth = claims.get(CLAIM_PRE_AUTH, Boolean.class);
            if (!Boolean.TRUE.equals(isPreAuth)) {
                throw new PreAuthTokenInvalidException("Token no es un pre-auth token válido.");
            }
            return UUID.fromString(claims.get(CLAIM_USER_ID, String.class));

        } catch (ExpiredJwtException e) {
            throw new PreAuthTokenInvalidException("Sesión de verificación expirada. Inicie el login nuevamente.");
        } catch (PreAuthTokenInvalidException e) {
            throw e;
        } catch (Exception e) {
            throw new PreAuthTokenInvalidException("Pre-auth token inválido.");
        }
    }

    /**
     * Excepción lanzada cuando el pre-auth token no supera la validación.
     */
    public static class PreAuthTokenInvalidException extends RuntimeException {
        public PreAuthTokenInvalidException(String message) {
            super(message);
        }
    }
}
