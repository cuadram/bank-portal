package com.experis.sofia.bankportal.integration;

import com.experis.sofia.bankportal.twofa.BackendTwoFactorApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import java.util.UUID;

/**
 * Base para ITs Savings (FEAT-024 Sprint 26 Step 4 Fase F.4).
 *
 * Patron heredado de BizumIntegrationTestBase: postgres+redis del Docker
 * Compose externo (sin Testcontainers - no funcionan desde docker-from-docker
 * en Docker Desktop macOS).
 *
 * Carga fixture savings-test-fixtures.sql antes de cada clase de test:
 *   - user + account + balance (10000 EUR available) para flujos happy path
 *   - segundo user/account/balance para tests de ownership (403)
 *
 * Pre-requisito: docker compose up -d postgres redis
 */
@SpringBootTest(
    classes = BackendTwoFactorApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@ActiveProfiles("integration-compose")
@Sql(
    scripts = "classpath:db/savings-test-fixtures.sql",
    executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS
)
public abstract class SavingsIntegrationTestBase {

    /** Usuario primario de tests (con saldo 10000 EUR). */
    public static final UUID TEST_USER_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000299");

    /** Cuenta del usuario primario. */
    public static final UUID TEST_ACCOUNT_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000299");

    /** Usuario secundario para tests de ownership (403 cross-user). */
    public static final UUID OTHER_USER_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000399");

    public static final UUID OTHER_ACCOUNT_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000399");
}
