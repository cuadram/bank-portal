package com.experis.sofia.bankportal.savings.api;

import com.experis.sofia.bankportal.integration.SavingsIntegrationTestBase;
import com.experis.sofia.bankportal.twofa.infrastructure.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * IT BUG-S26-Q-008 fix verificacion - Sprint 26 FEAT-024 Step 7.
 *
 * <p>Reproduce el escenario detectado por QA (TC-API-CONCURRENCY): N
 * contribuciones POST simultaneas sobre el mismo goal. Antes del fix
 * (sin @Version + retry) las lecturas sucias provocaban lost-update y
 * el reservedAmount final era inferior al esperado.</p>
 *
 * <p>Tras el fix, la suma del reservedAmount + contribuciones rechazadas
 * por concurrencia (409 CONCURRENCY_CONFLICT) debe ser exacta.</p>
 *
 * @author SOFIA DevOps Agent - Sprint 26 Step 7 - C2/BUG-Q-008
 */
@AutoConfigureMockMvc
class ContributeManualConcurrencyIT extends SavingsIntegrationTestBase {

    /** Numero de contribuciones simultaneas: alto para maximizar contencion. */
    private static final int CONCURRENT_CONTRIBUTIONS = 10;
    /** Importe de cada contribucion. */
    private static final BigDecimal AMOUNT_PER_CONTRIBUTION = new BigDecimal("10.00");

    @Autowired MockMvc mvc;
    @Autowired JwtTokenProvider jwt;
    @Autowired ObjectMapper json;
    @Autowired JdbcClient jdbc;

    private String userToken;
    private UUID goalId;

    @BeforeEach
    void setUp() throws Exception {
        userToken = jwt.generate(TEST_USER_ID, "savings_test_user");

        // Crear goal con target amplio para que CONCURRENT_CONTRIBUTIONS no sature.
        Map<String, Object> body = Map.of(
            "name", "Concurrency test goal",
            "targetAmount", 10000,
            "targetDate", LocalDate.now().plusYears(2).toString(),
            "category", "VIAJE",
            "sourceAccountId", TEST_ACCOUNT_ID.toString()
        );
        String resp = mvc.perform(post("/api/v1/savings/goals")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)))
                .andReturn().getResponse().getContentAsString();
        goalId = UUID.fromString(json.readTree(resp).get("id").asText());
    }

    @AfterEach
    void cleanup() {
        jdbc.sql("DELETE FROM goal_allocations WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id = ?)")
            .param(TEST_USER_ID).update();
        jdbc.sql("DELETE FROM goal_milestones WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id = ?)")
            .param(TEST_USER_ID).update();
        jdbc.sql("DELETE FROM goal_auto_rules WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id = ?)")
            .param(TEST_USER_ID).update();
        jdbc.sql("DELETE FROM savings_goals WHERE user_id = ?").param(TEST_USER_ID).update();
        jdbc.sql("UPDATE account_balances SET available_balance=10000.00, retained_balance=0.00 WHERE account_id=?")
            .param(TEST_ACCOUNT_ID).update();
    }

    @Test
    @DisplayName("BUG-Q-008 - N contribuciones concurrentes: reservedAmount + 409s coherente, sin lost-update")
    void concurrentContributions_noLostUpdate() throws Exception {
        Map<String, Object> contribBody = Map.of(
            "amount", AMOUNT_PER_CONTRIBUTION,
            "sourceAccountId", TEST_ACCOUNT_ID.toString()
        );
        String contribJson = json.writeValueAsString(contribBody);
        String url = "/api/v1/savings/goals/" + goalId + "/contributions";

        ExecutorService pool = Executors.newFixedThreadPool(CONCURRENT_CONTRIBUTIONS);
        CountDownLatch ready = new CountDownLatch(CONCURRENT_CONTRIBUTIONS);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger ok201 = new AtomicInteger();
        AtomicInteger conflict409 = new AtomicInteger();
        AtomicInteger other = new AtomicInteger();

        List<Future<?>> futures = new java.util.ArrayList<>();
        for (int i = 0; i < CONCURRENT_CONTRIBUTIONS; i++) {
            futures.add(pool.submit(() -> {
                try {
                    ready.countDown();
                    start.await(5, TimeUnit.SECONDS);
                    int status = mvc.perform(post(url)
                            .header("Authorization", "Bearer " + userToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(contribJson))
                            .andReturn().getResponse().getStatus();
                    if (status == 201) ok201.incrementAndGet();
                    else if (status == 409) conflict409.incrementAndGet();
                    else other.incrementAndGet();
                } catch (Exception ex) {
                    other.incrementAndGet();
                }
            }));
        }

        ready.await(5, TimeUnit.SECONDS);
        start.countDown(); // disparar todos a la vez
        pool.shutdown();
        boolean done = pool.awaitTermination(30, TimeUnit.SECONDS);
        assertThat(done).as("todos los hilos terminan").isTrue();

        // Verificacion 1: no hay errores 5xx u otros codigos inesperados
        assertThat(other.get()).as("sin codigos inesperados (esperado: 201 o 409)").isZero();

        // Verificacion 2: reservedAmount final == 201s * AMOUNT_PER_CONTRIBUTION (sin lost-update)
        BigDecimal reservedFinal = jdbc.sql("SELECT reserved_amount FROM savings_goals WHERE id=?")
            .param(goalId).query(BigDecimal.class).single();
        BigDecimal expected = AMOUNT_PER_CONTRIBUTION.multiply(BigDecimal.valueOf(ok201.get()));
        assertThat(reservedFinal).as("reservedAmount coincide con 201s").isEqualByComparingTo(expected);

        // Verificacion 3: tabla allocations tiene exactamente ok201 filas SUCCESS
        Long allocCount = jdbc.sql("SELECT COUNT(*) FROM goal_allocations WHERE goal_id=? AND status='SUCCESS'")
            .param(goalId).query(Long.class).single();
        assertThat(allocCount).as("allocations SUCCESS == 201s").isEqualTo((long) ok201.get());

        // Verificacion 4: account_balances retained coherente con reservedAmount
        BigDecimal retained = jdbc.sql("SELECT retained_balance FROM account_balances WHERE account_id=?")
            .param(TEST_ACCOUNT_ID).query(BigDecimal.class).single();
        assertThat(retained).as("retained_balance >= reservedAmount").isGreaterThanOrEqualTo(reservedFinal);

        // Verificacion 5 (sanity): al menos una contribucion completada
        assertThat(ok201.get() + conflict409.get())
            .as("todas las requests procesadas").isEqualTo(CONCURRENT_CONTRIBUTIONS);
        assertThat(ok201.get()).as("al menos una OK").isPositive();
    }
}
