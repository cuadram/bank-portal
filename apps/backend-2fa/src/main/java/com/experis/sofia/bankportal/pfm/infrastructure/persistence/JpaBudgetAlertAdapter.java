package com.experis.sofia.bankportal.pfm.infrastructure.persistence;

import com.experis.sofia.bankportal.pfm.domain.model.BudgetAlert;
import com.experis.sofia.bankportal.pfm.domain.repository.BudgetAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.time.YearMonth;
import java.util.Optional;
import java.util.UUID;

/**
 * Adaptador JDBC — pfm_budget_alerts.
 * @Primary sin @Profile (LA-019-08).
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Repository
@RequiredArgsConstructor
public class JpaBudgetAlertAdapter implements BudgetAlertRepository {

    private final JdbcClient jdbc;

    @Override
    public boolean existsByBudgetIdAndMonth(UUID budgetId, YearMonth month) {
        Integer cnt = jdbc.sql("""
            SELECT COUNT(*) FROM pfm_budget_alerts
            WHERE budget_id = :budgetId AND alert_month = :month
            """)
            .param("budgetId", budgetId).param("month", month.toString())
            .query(Integer.class).single();
        return cnt != null && cnt > 0;
    }

    @Override
    public BudgetAlert save(UUID budgetId, YearMonth month) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        jdbc.sql("""
            INSERT INTO pfm_budget_alerts (id, budget_id, alert_month, emitted_at)
            VALUES (:id, :budgetId, :month, :now)
            ON CONFLICT (budget_id, alert_month) DO NOTHING
            """)
            .param("id", id).param("budgetId", budgetId)
            .param("month", month.toString()).param("now", now).update();
        return new BudgetAlert(id, budgetId, month, now);
    }

    @Override
    public Optional<BudgetAlert> findByBudgetIdAndMonth(UUID budgetId, YearMonth month) {
        return jdbc.sql("""
            SELECT id, budget_id, alert_month, emitted_at FROM pfm_budget_alerts
            WHERE budget_id = :budgetId AND alert_month = :month
            """)
            .param("budgetId", budgetId).param("month", month.toString())
            .query((rs, n) -> new BudgetAlert(
                rs.getObject("id", UUID.class),
                rs.getObject("budget_id", UUID.class),
                YearMonth.parse(rs.getString("alert_month")),
                rs.getTimestamp("emitted_at").toInstant()
            )).optional();
    }
}
