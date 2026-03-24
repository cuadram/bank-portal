package com.experis.sofia.bankportal.twofa.infrastructure.config;

import com.experis.sofia.bankportal.kyc.security.KycAuthorizationFilter;
import com.experis.sofia.bankportal.profile.infrastructure.RevokedTokenFilter;
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
 * DEBT-022 (Sprint 14): OAuth2ResourceServerAutoConfiguration excluida.
 * FEAT-012-A (Sprint 14): RevokedTokenFilter registrado (US-1205).
 * FEAT-013 (Sprint 15): KycAuthorizationFilter registrado (US-1305).
 *
 * Cadena de filtros:
 *   JwtAuthenticationFilter → RevokedTokenFilter → KycAuthorizationFilter → Controller
 *
 * @since 1.0.0
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RevokedTokenFilter      revokedTokenFilter;
    private final KycAuthorizationFilter  kycAuthorizationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          RevokedTokenFilter revokedTokenFilter,
                          KycAuthorizationFilter kycAuthorizationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.revokedTokenFilter      = revokedTokenFilter;
        this.kycAuthorizationFilter  = kycAuthorizationFilter;
    }

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
                .requestMatchers("/api/v1/admin/**").hasRole("KYC_REVIEWER")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(revokedTokenFilter, JwtAuthenticationFilter.class)    // US-1205
            .addFilterAfter(kycAuthorizationFilter, RevokedTokenFilter.class);    // US-1305

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
