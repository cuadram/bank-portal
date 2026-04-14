package com.experis.sofia.bankportal.integration;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import com.experis.sofia.bankportal.twofa.BackendTwoFactorApplication;

import java.util.UUID;

/**
 * Base para ITs Bizum — usa PostgreSQL/Redis del Docker Compose (sin Testcontainers).
 * Requiere: docker compose up -d postgres redis
 *
 * Carga fixtures idempotentes antes de cada clase de test para satisfacer FKs
 * de bizum_payments, bizum_activations y bizum_requests → users(id) + accounts(id).
 */
@SpringBootTest(
    classes = BackendTwoFactorApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@ActiveProfiles("integration-compose")
@Sql(
    scripts = "classpath:db/bizum-test-fixtures.sql",
    executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS
)
public abstract class BizumIntegrationTestBase {

    /** UUID fijo del usuario de test — existe en BD gracias al fixture. */
    public static final UUID TEST_USER_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000099");

    /** UUID fijo de la cuenta de test — existe en BD gracias al fixture. */
    public static final UUID TEST_ACCOUNT_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000199");
}
