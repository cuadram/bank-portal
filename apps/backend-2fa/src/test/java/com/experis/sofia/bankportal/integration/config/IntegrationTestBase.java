package com.experis.sofia.bankportal.integration.config;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base para todos los integration tests del proyecto BankPortal.
 * Levanta PostgreSQL real con Testcontainers — singleton pattern (withReuse).
 *
 * GUARDRAIL GR-003: Este fichero es OBLIGATORIO y BLOQUEANTE para Gate G-4b.
 * Un test hijo que herede esta clase detecta en < 60s:
 *   - Beans faltantes (NoSuchBeanDefinitionException)
 *   - Paquetes incorrectos (clases no escaneadas por Spring)
 *   - SQL con columnas inexistentes (BadSqlGrammarException)
 *   - Properties no configuradas (IllegalArgumentException)
 *
 * HOTFIX-S20: este test habría detectado el paquete incorrecto es.meridian en 30s.
 *
 * @author SOFIA Developer Agent — Guardrail GR-003
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
public abstract class IntegrationTestBase {

    @Container
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("bankportal_test")
                    .withUsername("test")
                    .withPassword("test")
                    .withReuse(true);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.flyway.enabled",      () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        // JWT mínimo para que SecurityConfig arranque
        registry.add("application.security.jwt.secret-key",
                () -> "test-jwt-secret-key-minimum-32-characters-for-hmac");
        registry.add("application.security.jwt.expiration", () -> "3600000");
        // Stub de propiedades opcionales para evitar IllegalArgumentException
        registry.add("spring.mail.host",     () -> "localhost");
        registry.add("spring.mail.port",     () -> "1025");
        registry.add("spring.data.redis.host", () -> "localhost");
        registry.add("spring.data.redis.port", () -> "6379");
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected JdbcClient jdbc;
}
