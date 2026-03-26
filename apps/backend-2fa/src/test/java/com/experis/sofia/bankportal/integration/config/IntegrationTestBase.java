package com.experis.sofia.bankportal.integration.config;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

/**
 * Clase base para integration tests — DEBT-030.
 *
 * Levanta un PostgreSQL real con Testcontainers y el contexto Spring completo.
 * Todos los integration tests extienden esta clase.
 * La anotación @SpringBootTest arranca el contexto completo — detecta beans
 * faltantes, SQL incorrecto y configuración incompleta en tiempo de build.
 *
 * @author SOFIA Developer Agent — Sprint 19 DEBT-030
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
public abstract class IntegrationTestBase {

    // ── PostgreSQL compartido entre todos los tests (singleton pattern) ────────
    @Container
    static final PostgreSQLContainer<?> POSTGRES =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("bankportal_test")
            .withUsername("test")
            .withPassword("test")
            .withReuse(true);  // reutiliza el contenedor entre runs en local

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url",      POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.redis.url",           () -> "redis://localhost:6379");
        registry.add("spring.flyway.enabled",      () -> "true");
        registry.add("kyc.encryption-key",         () -> "dGhpcnR5LXR3by1ieXRlLWtleS1mb3ItYWVzLTI1NiE=");
        registry.add("bank.core.base-url",         () -> "http://localhost:9999");
        registry.add("bank.core.api-key",          () -> "stub-key-test");
        registry.add("jwt.secret",                 () -> "test-jwt-hmac-secret-minimum-32bytes!!");
    }

    @Autowired protected MockMvc mockMvc;
    @Autowired protected JdbcClient jdbc;

    protected UUID testUserId;
    protected UUID testAccountId;

    @BeforeEach
    void setupTestData() {
        // Limpiar datos entre tests
        jdbc.sql("DELETE FROM transactions WHERE account_id IN (SELECT id FROM accounts WHERE user_id = :uid)")
            .param("uid", testUserId != null ? testUserId : UUID.randomUUID()).update();

        // Usuario de prueba estándar
        testUserId = UUID.randomUUID();
        jdbc.sql("""
            INSERT INTO users (id, username, email, password_hash, account_status)
            VALUES (:id, :user, :email, :hash, 'ACTIVE')
            """)
            .param("id",    testUserId)
            .param("user",  "test_" + testUserId.toString().substring(0, 8))
            .param("email", "test_" + testUserId.toString().substring(0, 8) + "@test.com")
            .param("hash",  "$2a$12$FW17clKR8aD4WYaAavj7nOounbbk4MwV7/aOYuFg8QhF3hqboouKG")
            .update();

        // Cuenta de prueba estándar
        testAccountId = UUID.randomUUID();
        jdbc.sql("""
            INSERT INTO accounts (id, user_id, alias, iban, type, status)
            VALUES (:id, :uid, 'Cuenta Test', 'ES0000000000000000000001', 'CORRIENTE', 'ACTIVE')
            """)
            .param("id",  testAccountId)
            .param("uid", testUserId)
            .update();

        jdbc.sql("""
            INSERT INTO account_balances (account_id, available_balance, retained_balance)
            VALUES (:id, 5000.00, 0.00)
            """)
            .param("id", testAccountId)
            .update();
    }
}
