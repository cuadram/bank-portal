package com.experis.sofia.bankportal.twofa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Punto de entrada del módulo backend-2fa — BankPortal | Banco Meridian.
 *
 * <p>Módulo de autenticación de segundo factor (TOTP RFC 6238) implementado
 * en Java 21 / Spring Boot 3.3 con arquitectura hexagonal (Clean Architecture).</p>
 *
 * <p>FEAT-001 | Sprint 01 | SOFIA Software Factory — Experis</p>
 *
 * @since 1.0.0
 */
@SpringBootApplication
@ConfigurationPropertiesScan("com.experis.sofia.bankportal.twofa.infrastructure.config")
public class BackendTwoFactorApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendTwoFactorApplication.class, args);
    }
}
