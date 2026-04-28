package com.experis.sofia.bankportal.savings;

import com.experis.sofia.bankportal.integration.SavingsIntegrationTestBase;
import com.experis.sofia.bankportal.savings.infrastructure.scheduler.AutoContributionScheduler;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * IT AutoContributionScheduler (light) - Sprint 26 FEAT-024 Step 4 Fase F.4.
 *
 * Verifica end-to-end que invocar manualmente runDueAutoContributions() procesa
 * solamente las reglas con next_execution_at <= now() (RN-F024-04 mensual).
 *
 * NO testa @SchedulerLock (DEBT-051 critica - sin LockProvider/V18c shedlock,
 * el lock se ignora silenciosamente; cubierto en Fase H del Step 4).
 *
 * Patron: invocar el bean directamente (no esperar al cron). Setup via JdbcClient
 * inserta goal + 2 reglas (1 due, 1 futura) y verifica que solo la due genera
 * allocation SUCCESS.
 *
 * @author SOFIA Developer Agent - FEAT-024 Sprint 26 - Fase F.4
 */
class AutoContributionSchedulerIT extends SavingsIntegrationTestBase {

    @Autowired AutoContributionScheduler scheduler;
    @Autowired JdbcClient jdbc;

    private UUID goalDueId;
    private UUID goalFutureId;
    private UUID ruleDueId;
    private UUID ruleFutureId;

    @AfterEach
    void cleanup() {
        // Orden FK: allocations -> auto_rules -> milestones -> goals
        jdbc.sql("DELETE FROM goal_allocations WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id=?)")
            .param(TEST_USER_ID).update();
        jdbc.sql("DELETE FROM goal_auto_rules WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id=?)")
            .param(TEST_USER_ID).update();
        jdbc.sql("DELETE FROM goal_milestones WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id=?)")
            .param(TEST_USER_ID).update();
        jdbc.sql("DELETE FROM savings_goals WHERE user_id=?")
            .param(TEST_USER_ID).update();
        jdbc.sql("UPDATE account_balances SET available_balance=10000.00, retained_balance=0.00 WHERE account_id=?")
            .param(TEST_ACCOUNT_ID).update();
    }

    @Test
    @DisplayName("IT-SCH-001 - solo procesa reglas con next_execution_at <= now (regla futura no genera allocation)")
    void runDueAutoContributions_processesOnlyDueRules() {
        // Setup: goal con regla DUE (next_execution_at en pasado)
        goalDueId = UUID.randomUUID();
        ruleDueId = UUID.randomUUID();
        jdbc.sql("""
            INSERT INTO savings_goals (id,user_id,name,target_amount,reserved_amount,target_date,category,status,source_account_id)
            VALUES (?,?,?,?,?,?,?,?,?)
            """)
            .params(goalDueId, TEST_USER_ID, "Goal-DUE", new BigDecimal("3000"), BigDecimal.ZERO,
                    java.sql.Date.valueOf(java.time.LocalDate.now().plusYears(1)),
                    "VIAJE", "ACTIVE", TEST_ACCOUNT_ID)
            .update();
        jdbc.sql("""
            INSERT INTO goal_auto_rules (id,goal_id,amount,day_of_month,source_account_id,active,next_execution_at)
            VALUES (?,?,?,?,?,?,?)
            """)
            .params(ruleDueId, goalDueId, new BigDecimal("100.00"), 1, TEST_ACCOUNT_ID, true,
                    Timestamp.from(Instant.now().minusSeconds(3600)))
            .update();

        // Setup: goal con regla FUTURA (next_execution_at en futuro)
        goalFutureId = UUID.randomUUID();
        ruleFutureId = UUID.randomUUID();
        jdbc.sql("""
            INSERT INTO savings_goals (id,user_id,name,target_amount,reserved_amount,target_date,category,status,source_account_id)
            VALUES (?,?,?,?,?,?,?,?,?)
            """)
            .params(goalFutureId, TEST_USER_ID, "Goal-FUTURE", new BigDecimal("3000"), BigDecimal.ZERO,
                    java.sql.Date.valueOf(java.time.LocalDate.now().plusYears(1)),
                    "HOGAR", "ACTIVE", TEST_ACCOUNT_ID)
            .update();
        jdbc.sql("""
            INSERT INTO goal_auto_rules (id,goal_id,amount,day_of_month,source_account_id,active,next_execution_at)
            VALUES (?,?,?,?,?,?,?)
            """)
            .params(ruleFutureId, goalFutureId, new BigDecimal("100.00"), 1, TEST_ACCOUNT_ID, true,
                    Timestamp.from(Instant.now().plusSeconds(3600)))
            .update();

        // Act: invocar el scheduler manualmente (sin esperar al cron real)
        scheduler.runDueAutoContributions();

        // Assert 1: 1 allocation SUCCESS para la regla DUE, 0 para la regla FUTURA
        Long countDue = jdbc.sql("SELECT COUNT(*) FROM goal_allocations WHERE goal_id=? AND status='SUCCESS'")
                .param(goalDueId).query(Long.class).single();
        Long countFuture = jdbc.sql("SELECT COUNT(*) FROM goal_allocations WHERE goal_id=?")
                .param(goalFutureId).query(Long.class).single();
        assertThat(countDue).as("goal DUE debe tener 1 allocation SUCCESS").isEqualTo(1L);
        assertThat(countFuture).as("goal FUTURE no debe tener ninguna allocation").isEqualTo(0L);

        // Assert 2: reservedAmount del goal DUE aumento a 100.00
        BigDecimal reserved = jdbc.sql("SELECT reserved_amount FROM savings_goals WHERE id=?")
                .param(goalDueId).query(BigDecimal.class).single();
        assertThat(reserved).isEqualByComparingTo("100.00");

        // Assert 3: account_balances refleja la reserva (10000 - 100 = 9900)
        BigDecimal avail = jdbc.sql("SELECT available_balance FROM account_balances WHERE account_id=?")
                .param(TEST_ACCOUNT_ID).query(BigDecimal.class).single();
        assertThat(avail).isEqualByComparingTo("9900.00");

        // Assert 4: next_execution_at de la regla DUE avanzo al futuro
        Timestamp nextDue = jdbc.sql("SELECT next_execution_at FROM goal_auto_rules WHERE id=?")
                .param(ruleDueId).query(Timestamp.class).single();
        assertThat(nextDue.toInstant()).isAfter(Instant.now());
    }
}
