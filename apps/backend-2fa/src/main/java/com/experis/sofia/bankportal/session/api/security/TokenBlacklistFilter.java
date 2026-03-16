package com.experis.sofia.bankportal.session.api.security;

import com.experis.sofia.bankportal.session.infrastructure.cache.SessionRedisAdapter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro que verifica si el JTI del JWT entrante está en la blacklist Redis.
 * Se ejecuta ANTES del JwtAuthenticationFilter para rechazar tokens revocados
 * con latencia O(1).
 *
 * <p>Si Redis no está disponible, falla abierto (la request pasa) y loguea
 * un warning — la sesión en PostgreSQL aparecerá como revocada en el UI
 * pero el token seguirá siendo técnicamente válido hasta su TTL natural.
 * Este trade-off está documentado en ADR-006.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TokenBlacklistFilter extends OncePerRequestFilter {

    private static final String SESSION_DENY_PATH = "/api/v1/sessions/deny/";

    private final SessionRedisAdapter redisAdapter;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // El endpoint de denegación por email no lleva JWT — excluir
        if (request.getRequestURI().startsWith(SESSION_DENY_PATH)) {
            filterChain.doFilter(request, response);
            return;
        }

        String jti = extractJtiFromBearerHeader(request);
        if (jti != null) {
            try {
                if (redisAdapter.isBlacklisted(jti)) {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write("""
                        {"code":"SESSION_REVOKED","message":"Esta sesión ha sido revocada."}
                        """);
                    return;
                }
            } catch (Exception e) {
                // Fail-open: si Redis falla, no bloqueamos al usuario (ADR-006)
                log.warn("Redis unavailable in TokenBlacklistFilter — failing open: {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extrae el JTI del JWT sin validarlo — la validación la hace Spring Security.
     * Solo necesitamos el claim {@code jti} para el lookup en Redis.
     */
    private String extractJtiFromBearerHeader(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) return null;

        try {
            String token   = auth.substring(7);
            String payload = token.split("\\.")[1];
            String decoded = new String(java.util.Base64.getUrlDecoder().decode(payload));
            // Extracción simple del claim jti — sin librería adicional
            int start = decoded.indexOf("\"jti\":\"");
            if (start < 0) return null;
            start += 7;
            int end = decoded.indexOf("\"", start);
            return end > start ? decoded.substring(start, end) : null;
        } catch (Exception e) {
            return null; // Token malformado — Spring Security lo rechazará
        }
    }
}
