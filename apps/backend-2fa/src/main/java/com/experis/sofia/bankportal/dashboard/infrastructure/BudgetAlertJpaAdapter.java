package com.experis.sofia.bankportal.dashboard.infrastructure;

import com.experis.sofia.bankportal.dashboard.application.dto.BudgetAlertDto;
import com.experis.sofia.bankportal.dashboard.domain.BudgetAlertRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Adaptador JDBC — implementa BudgetAlertRepositoryPort.
 * FEAT-010 US-1005 Sprint 12.
 *
 * @author SOFIA Developer Agent
 */
@Repository
@RequiredArgsConstructor
public class BudgetAlertJpaAdapter implements BudgetAlertRepositoryPort {

    private final JdbcClient jdbc;

    @Override
    public void saveAlert(UUID userId, String period, BigDecimal monthlyBudget,
                          int thresholdPct, BigDecimal currentAmount) {
        jdbc.sql("""
                INSERT INTO budget_alerts
                  (user_id, period, monthly_budget, threshold_pct, current_amount)
                VALUES (:userId, :period, :budget, :threshold, :current)
                ON CONFLICT (user_id, period) DO NOTHING
                """)
                .param("userId", userId)
                .param("period", period)
                .param("budget", monthlyBudget)
                .param("threshold", thresholdPct)
                .param("current", currentAmount)
                .update();
    }

    @Override
    public List<BudgetAlertDto> findRecentAlerts(UUID userId, String currentPeriod) {
        return jdbc.sql("""
                SELECT monthly_budget, threshold_pct, current_amount, triggered_at
                FROM budget_alerts
                WHERE user_id = :userId
                  AND period >= TO_CHAR(
                        TO_DATE(:period, 'YYYY-MM') - INTERVAL '3 months', 'YYYY-MM')
                ORDER BY triggered_at DESC
                """)
                .param("userId", userId)
                .param("period", currentPeriod)
                .query((rs, _) -> {
                    BigDecimal budget  = rs.getBigDecimal("monthly_budget");
                    BigDecimal current = rs.getBigDecimal("current_amount");
                    int pct            = rs.getInt("threshold_pct");
                    double used = budget.compareTo(BigDecimal.ZERO) > 0
                            ? current.multiply(BigDecimal.valueOf(100))
                                     .divide(budget, 1, java.math.RoundingMode.HALF_UP)
                                     .doubleValue()
                            : 0.0;
                    return new BudgetAlertDto(
                            "BUDGET_THRESHOLD", pct, budget, current, used,
                            rs.getTimestamp("triggered_at").toLocalDateTime());
                })
                .list();
    }

    @Override
    public void markNotified(UUID userId, String period) {
        jdbc.sql("UPDATE budget_alerts SET notified = true WHERE user_id = :userId AND period = :period")
                .param("userId", userId)
                .param("period", period)
                .update();
    }

    @Override
    public boolean existsForPeriod(UUID userId, String period) {
        Integer count = jdbc.sql(
                "SELECT COUNT(*) FROM budget_alerts WHERE user_id = :userId AND period = :period")
                .param("userId", userId)
                .param("period", period)
                .query(Integer.class)
                .single();
        return count != null && count > 0;
    }
}
