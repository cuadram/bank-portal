package com.experis.sofia.bankportal.integration.config;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import com.experis.sofia.bankportal.twofa.BackendTwoFactorApplication;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Base para todos los integration tests del proyecto BankPortal.
 * DEBT-064 (S27): migrado de Testcontainers al perfil integration-compose.
 * Usa los servicios reales del docker-compose (PostgreSQL :5433 BD bankportal_it, Redis :6380, MailHog :1025).
 * Precondicion: docker compose -f infra/compose/docker-compose.yml up -d postgres redis
 *   + ejecutar src/test/resources/it-db/it-db-setup.sql (rol+BD bankportal_it).
 * Datasource y endpoints en application-integration-compose.yml. Flyway aplica las migraciones (incl. V30 seed).
 *
 * GUARDRAIL GR-003: fichero OBLIGATORIO y BLOQUEANTE para Gate G-4b.
 *
 * @author SOFIA Developer Agent - Guardrail GR-003 / DEBT-064
 */
@SpringBootTest(classes = BackendTwoFactorApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles({"test", "integration-compose"})
public abstract class IntegrationTestBase {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected JdbcClient jdbc;

    // Fixtures comunes (seed via Flyway V30__seed_test_dataset_complete)
    protected final java.util.UUID testUserId    = java.util.UUID.fromString("00000000-0000-0000-0000-000000000001");
    protected final java.util.UUID testAccountId = java.util.UUID.fromString("acc00000-0000-0000-0000-000000000001");
}
