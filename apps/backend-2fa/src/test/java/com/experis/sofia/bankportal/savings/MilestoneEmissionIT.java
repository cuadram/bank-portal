package com.experis.sofia.bankportal.savings;

import com.experis.sofia.bankportal.integration.SavingsIntegrationTestBase;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.MilestoneEvaluator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * IT MilestoneEvaluator concurrency - Sprint 26 FEAT-024 Step 4 Fase F.4.
 *
 * Verifica idempotencia de la UK uk_goal_milestone(goal_id, percent) bajo
 * concurrencia: 2 hilos llaman evaluate() simultaneamente sobre un goal
 * al 100% -> solo 4 milestones persistidos (25/50/75/100), no 8.
 *
 * RN-F024-09: cada threshold se emite una sola vez por objetivo.
 *
 * Patron: hereda de SavingsIntegrationTestBase. Setup directo via JdbcClient
 * + repositorio para crear el goal en BD, luego dos Callable en ExecutorService
 * sincronizados con CountDownLatch para garantizar invocacion concurrente.
 *
 * @author SOFIA Developer Agent - FEAT-024 Sprint 26 - Fase F.4
 */
class MilestoneEmissionIT extends SavingsIntegrationTestBase {

    @Autowired MilestoneEvaluator evaluator;
    @Autowired SavingsGoalRepositoryPort goalRepo;
    @Autowired JdbcClient jdbc;

    private UUID goalId;

    @AfterEach
    void cleanup() {
        if (goalId != null) {
            jdbc.sql("DELETE FROM goal_milestones WHERE goal_id=?").param(goalId).update();
            jdbc.sql("DELETE FROM savings_goals WHERE id=?").param(goalId).update();
        }
    }

    @Test
    @DisplayName("IT-MIL-001 - 2 hilos evaluan al 100% concurrentemente -> solo 4 milestones (UK atrapa carrera)")
    void concurrentEvaluate_uniqueConstraintCatchesRace() throws Exception {
        // Arrange: insertar goal directamente en BD con reservedAmount == targetAmount
        goalId = UUID.randomUUID();
        jdbc.sql("""
            INSERT INTO savings_goals (id,user_id,name,target_amount,reserved_amount,target_date,category,status,source_account_id)
            VALUES (?,?,?,?,?,?,?,?,?)
            """)
            .params(goalId, TEST_USER_ID, "Goal-100pct", new BigDecimal("1000"), new BigDecimal("1000"),
                    java.sql.Date.valueOf(java.time.LocalDate.now().plusYears(1)),
                    "VIAJE", "ACTIVE", TEST_ACCOUNT_ID)
            .update();

        // Construir el agregado en memoria (mismo estado que en BD) para pasarselo a evaluate()
        SavingsGoal goal = new SavingsGoal();
        goal.setId(goalId);
        goal.setTargetAmount(new BigDecimal("1000"));
        goal.setReservedAmount(new BigDecimal("1000"));

        // Act: 2 hilos llaman evaluate() simultaneamente, sincronizados con un latch
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch finishGate = new CountDownLatch(2);
        Runnable task = () -> {
            try {
                startGate.await();
                evaluator.evaluate(goal);
            } catch (Exception ignored) {
                // Concurrencia puede traducir DataIntegrityViolation a RuntimeException
                // segun timing - el evaluator ya lo silencia, pero por defensiva
            } finally {
                finishGate.countDown();
            }
        };
        executor.submit(task);
        executor.submit(task);
        startGate.countDown(); // disparar las 2 simultaneamente
        boolean finished = finishGate.await(10, TimeUnit.SECONDS);
        executor.shutdown();
        assertThat(finished).as("ambos hilos deben acabar en <10s").isTrue();

        // Assert: exactamente 4 milestones (25/50/75/100), no 8
        Long count = jdbc.sql("SELECT COUNT(*) FROM goal_milestones WHERE goal_id=?")
                .param(goalId).query(Long.class).single();
        assertThat(count).as("UK uk_goal_milestone debe permitir solo 1 milestone por threshold").isEqualTo(4L);

        // Verificar que los 4 thresholds son distintos
        java.util.List<Integer> percents = jdbc.sql("SELECT percent FROM goal_milestones WHERE goal_id=? ORDER BY percent")
                .param(goalId).query(Integer.class).list();
        assertThat(percents).containsExactly(25, 50, 75, 100);
    }
}
