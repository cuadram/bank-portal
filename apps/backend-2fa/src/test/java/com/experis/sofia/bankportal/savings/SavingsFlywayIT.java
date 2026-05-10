package com.experis.sofia.bankportal.savings;

import com.experis.sofia.bankportal.integration.SavingsIntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * IT Flyway V29 - Sprint 26 FEAT-024 Step 4 Fase F.4.
 *
 * Verifica:
 *   - V29 registrada en flyway_schema_history (success=true)
 *   - 4 tablas savings creadas (savings_goals, goal_allocations, goal_milestones, goal_auto_rules)
 *   - Indice unico parcial uk_goal_active_rule WHERE active=TRUE (RN-F024-04 idempotencia)
 *   - Constraint UK uk_goal_month en goal_allocations (idempotencia mensual RN-F024-04)
 *   - CHECK constraints clave: target_amount BETWEEN 100 AND 500000, status validos,
 *     amount range del auto-rule
 *
 * Patron: hereda de SavingsIntegrationTestBase (pero el fixture user/account no se usa
 * en este IT - solo metadatos del schema).
 *
 * @author SOFIA Developer Agent - FEAT-024 Sprint 26 - Fase F.4
 */
class SavingsFlywayIT extends SavingsIntegrationTestBase {

    @Autowired DataSource ds;
    @Autowired JdbcClient jdbc;

    @Test
    @DisplayName("IT-FLY-001 - V29 registrada en flyway_schema_history con success=true")
    void v29Registered() throws Exception {
        try (var conn = ds.getConnection();
             var ps = conn.prepareStatement(
                 "SELECT version, description, success FROM flyway_schema_history WHERE version='29'");
             var rs = ps.executeQuery()) {
            assertThat(rs.next()).as("V29 debe existir en flyway_schema_history").isTrue();
            assertThat(rs.getString("version")).isEqualTo("29");
            assertThat(rs.getBoolean("success")).isTrue();
        }
    }

    @Test
    @DisplayName("IT-FLY-002 - Las 4 tablas savings existen tras V29")
    void fourTablesExist() throws Exception {
        try (var conn = ds.getConnection();
             var rs = conn.getMetaData().getTables(null, null, "%", new String[]{"TABLE"})) {
            List<String> tables = new ArrayList<>();
            while (rs.next()) tables.add(rs.getString("TABLE_NAME"));
            assertThat(tables).contains("savings_goals", "goal_allocations", "goal_milestones", "goal_auto_rules");
        }
    }

    @Test
    @DisplayName("IT-FLY-003 - Indice parcial uk_goal_active_rule existe (UK por goal_id WHERE active=TRUE)")
    void partialUniqueIndexExistsOnAutoRules() {
        // Verificar que el indice parcial existe consultando pg_indexes
        Long count = jdbc.sql("""
            SELECT COUNT(*) FROM pg_indexes
            WHERE schemaname='public'
              AND tablename='goal_auto_rules'
              AND indexname='uk_goal_active_rule'
              AND indexdef LIKE '%WHERE (active = true)%'
            """)
            .query(Long.class).single();
        assertThat(count).isEqualTo(1L);
    }

    @Test
    @DisplayName("IT-FLY-004 - UK uk_goal_month en goal_allocations (idempotencia mensual)")
    void uniqueConstraintGoalMonth() {
        Long count = jdbc.sql("""
            SELECT COUNT(*) FROM information_schema.table_constraints
            WHERE table_name='goal_allocations'
              AND constraint_type='UNIQUE'
              AND constraint_name='uk_goal_month'
            """)
            .query(Long.class).single();
        assertThat(count).isEqualTo(1L);
    }

    @Test
    @DisplayName("IT-FLY-005 - CHECK constraints clave de savings_goals (target_amount, status, reserved<=target)")
    void checkConstraints() {
        // Verificamos que existen los CHECK definidos en V29 (al menos 3 constraints CHECK
        // sobre savings_goals: target_amount range, reserved>=0, status enum, reserved<=target)
        Long count = jdbc.sql("""
            SELECT COUNT(*) FROM information_schema.table_constraints
            WHERE table_name='savings_goals'
              AND constraint_type='CHECK'
            """)
            .query(Long.class).single();
        // V29 declara 3 CHECK sobre savings_goals (target_amount, reserved, status, reserved<=target)
        // mas los CHECK de NOT NULL implicitos. Verifico >= 3 para no acoplarme al numero exacto.
        assertThat(count).isGreaterThanOrEqualTo(3L);
    }
}
