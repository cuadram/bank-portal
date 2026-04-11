package com.experis.sofia.bankportal.profile.infrastructure;

import com.experis.sofia.bankportal.profile.application.ManageSessionsUseCase;
import com.experis.sofia.bankportal.twofa.infrastructure.security.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

/**
 * Verifica en cada request si el jti del JWT ha sido revocado.
 * ADR-022: fail-open — si Redis no está disponible, permite la request
 * con log.warn para no comprometer la disponibilidad.
 *
 * Se registra DESPUÉS de JwtAuthenticationFilter en SecurityConfig.
 * FEAT-012-A — US-1205 — Sprint 14
 *
 * @author SOFIA Developer Agent
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RevokedTokenFilter extends OncePerRequestFilter {

    private final ManageSessionsUseCase manageSessions;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {

        String jti = (String) request.getAttribute("authenticatedJti");

        if (jti == null) {
            // Token sin jti (tokens anteriores a DEBT-023) — fail-open
            chain.doFilter(request, response);
            return;
        }

        try {
            if (manageSessions.isRevoked(jti)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"error\":\"TOKEN_REVOKED\"}");
                return;
            }
        } catch (Exception e) {
            // ADR-022: fail-open si Redis no disponible
            log.warn("[RevokedTokenFilter] No se pudo verificar jti={} — fail-open. Causa: {}", jti, e.getMessage());
        }

        chain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/auth/login") || path.equals("/2fa/verify") || path.equals("/actuator/health");
    }
}
