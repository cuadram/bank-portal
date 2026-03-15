package com.experis.sofia.bankportal.twofa.infrastructure.config;

import com.experis.sofia.bankportal.twofa.infrastructure.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuración de Spring Security — módulo 2FA.
 *
 * <p>Política: stateless (sin sesión HTTP), JWT para autenticación.
 * El {@link JwtAuthenticationFilter} se registra antes del filtro de
 * autenticación estándar de Spring.</p>
 *
 * <p>Endpoints públicos:
 * <ul>
 *   <li>{@code POST /auth/login} — genera token o pre-auth token</li>
 *   <li>{@code POST /2fa/verify} — valida OTP con pre-auth token</li>
 *   <li>{@code GET /actuator/health} — health check sin auth</li>
 * </ul>
 * </p>
 *
 * <p>FEAT-001 | US-002</p>
 *
 * @since 1.0.0
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    /**
     * Cadena de filtros de seguridad HTTP.
     *
     * <ul>
     *   <li>CSRF deshabilitado (API REST stateless)</li>
     *   <li>Sesión: STATELESS (sin HttpSession)</li>
     *   <li>JwtAuthenticationFilter antes del filtro estándar</li>
     *   <li>Endpoints {@code /auth/login}, {@code /2fa/verify} y health: públicos</li>
     *   <li>Todos los demás endpoints requieren autenticación</li>
     * </ul>
     *
     * @param http builder de configuración HTTP de Spring Security
     * @return {@link SecurityFilterChain} configurada
     * @throws Exception si la configuración falla
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/auth/login",
                    "/2fa/verify",
                    "/actuator/health"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    /**
     * Encoder de contraseñas — BCrypt con cost factor 12.
     *
     * <p>Cost=12 provee ~200ms en hardware moderno, balance adecuado
     * entre seguridad y rendimiento para un portal bancario (OWASP ASVS 2.4.1).</p>
     *
     * @return {@link PasswordEncoder} BCrypt con strength=12
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
