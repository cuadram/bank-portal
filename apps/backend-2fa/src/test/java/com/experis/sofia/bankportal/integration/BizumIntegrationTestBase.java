package com.experis.sofia.bankportal.integration;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import com.experis.sofia.bankportal.twofa.BackendTwoFactorApplication;

/**
 * Base alternativa para ITs Bizum — usa PostgreSQL del Docker Compose (puerto 5433)
 * sin Testcontainers. Requiere: docker compose up -d postgres
 */
@SpringBootTest(
    classes = BackendTwoFactorApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@ActiveProfiles("integration-compose")
public abstract class BizumIntegrationTestBase {
    // Usa application-integration-compose.yml — sin Testcontainers
}
