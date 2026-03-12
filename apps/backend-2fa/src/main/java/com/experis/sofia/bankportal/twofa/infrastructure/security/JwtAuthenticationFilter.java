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
import java.util.UUID;

/**
 * Filtro de autenticación JWT — procesa cada request una sola vez.
 *
 * <p>Extrae el JWT del header {@code Authorization: Bearer <token>},
 * lo valida mediante {@link JwtTokenProvider} y establece el contexto
 * de seguridad de Spring ({@link SecurityContextHolder}).</p>
 *
 * <p>Endpoints excluidos (gestionados en {@code SecurityConfig}):
 * <ul>
 *   <li>{@code POST /auth/login} — pública, genera el primer token</li>
 *   <li>{@code POST /2fa/verify} — usa pre-auth token, no JWT completo</li>
 *   <li>{@code GET /actuator/health} — health check sin auth</li>
 * </ul>
 * </p>
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

        // Si no hay header Authorization, continuar sin autenticar
        // (los endpoints públicos lo permiten; los privados fallarán en el authz)
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            UUID userId = jwtTokenProvider.validateAndExtractUserId(token);
            String username = jwtTokenProvider.extractUsername(token);

            // Solo establecer autenticación si aún no está establecida
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                        username,   // principal
                        null,       // credentials (no se necesitan tras validación JWT)
                        Collections.emptyList() // authorities (roles — scope futuro)
                    );
                authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));

                // Agregar userId como detalle adicional para uso en controllers
                request.setAttribute("authenticatedUserId", userId);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (JwtTokenProvider.JwtTokenInvalidException e) {
            // Token inválido: limpiar contexto y dejar que el framework retorne 401
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Excluir endpoints que gestionan su propia autenticación.
     *
     * <p>{@code POST /2fa/verify} usa pre-auth token (secreto diferente),
     * no debe pasar por este filtro.</p>
     */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/auth/login")
            || path.equals("/2fa/verify")
            || path.equals("/actuator/health");
    }
}
