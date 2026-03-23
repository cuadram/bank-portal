package com.experis.sofia.bankportal.twofa.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Filtro de autenticación JWT — procesa cada request una sola vez.
 *
 * <p><strong>DEBT-023 (Sprint 14):</strong> Propaga {@code jti} y {@code expiresAt}
 * como atributos de request para que {@code ManageSessionsUseCase} pueda calcular
 * el TTL de revocación Redis sin re-parsear el token.</p>
 *
 * <p>FEAT-001 | US-002</p>
 *
 * @since 1.0.0
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTH_HEADER   = "Authorization";

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader(AUTH_HEADER);
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            JwtTokenProvider.JwtClaims claims = jwtTokenProvider.validateAndExtract(token);

            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                var authentication = new UsernamePasswordAuthenticationToken(
                    claims.username(), null, Collections.emptyList());
                authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));

                // Atributos disponibles para los use cases
                request.setAttribute("authenticatedUserId", claims.userId());
                request.setAttribute("authenticatedJti",    claims.jti());      // DEBT-023
                request.setAttribute("jwtExpiresAt",        claims.expiresAt()); // DEBT-023

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (JwtTokenProvider.JwtTokenInvalidException e) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/auth/login")
            || path.equals("/2fa/verify")
            || path.equals("/actuator/health");
    }
}
