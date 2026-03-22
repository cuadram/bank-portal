package com.experis.sofia.bankportal.twofa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Punto de entrada del módulo backend-2fa — BankPortal | Banco Meridian.
 *
 * OAuth2ResourceServerAutoConfiguration excluida: el proyecto usa JwtAuthenticationFilter
 * custom con JJWT/HMAC HS256. La dependencia oauth2-resource-server se mantiene solo
 * para que compile la clase Jwt usada en @AuthenticationPrincipal de los controllers.
 *
 * FEAT-001 | Sprint 01 | SOFIA Software Factory — Experis
 */
@SpringBootApplication(exclude = {OAuth2ResourceServerAutoConfiguration.class})
@ConfigurationPropertiesScan("com.experis.sofia.bankportal.twofa.infrastructure.config")
public class BackendTwoFactorApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendTwoFactorApplication.class, args);
    }
}
