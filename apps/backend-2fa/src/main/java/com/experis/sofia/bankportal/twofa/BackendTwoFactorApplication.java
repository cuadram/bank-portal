package com.experis.sofia.bankportal.twofa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Punto de entrada del módulo backend-2fa — BankPortal | Banco Meridian.
 *
 * <p>DEBT-022 (Sprint 14): Se excluye {@link OAuth2ResourceServerAutoConfiguration}
 * para evitar que {@code BearerTokenAuthenticationFilter} intercepte las requests
 * antes que {@code JwtAuthenticationFilter} HMAC HS256 custom, causando 403 en STG.</p>
 *
 * <p>FEAT-001 | Sprint 01 | SOFIA Software Factory — Experis</p>
 *
 * @since 1.0.0
 */
@SpringBootApplication(exclude = { OAuth2ResourceServerAutoConfiguration.class })
@ConfigurationPropertiesScan("com.experis.sofia.bankportal.twofa.infrastructure.config")
@EnableScheduling
public class BackendTwoFactorApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendTwoFactorApplication.class, args);
    }
}
