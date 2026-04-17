package com.experis.sofia.bankportal.pfm.infrastructure.persistence;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import com.experis.sofia.bankportal.pfm.domain.model.Budget;
import com.experis.sofia.bankportal.pfm.domain.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Adaptador JDBC — pfm_budgets.
 * @Primary sin @Profile (LA-019-08).
 * budget_month almacenado como varchar(7) YYYY-MM (ADR-038).
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Repository
@RequiredArgsConstructor
public class JpaBudgetAdapter implements BudgetRepository {

    private final JdbcClient jdbc;

    @Override
    public List<Budget> findByUserId(UUID userId) {
        return jdbc.sql("""
            SELECT id, user_id, category_code, amount_limit, threshold_percent,
                   budget_month, created_at, updated_at
            FROM pfm_budgets WHERE user_id = :userId ORDER BY created_at
            """)
            .param("userId", userId)
            .query((rs, n) -> map(rs)).list();
    }

    @Override
    public Optional<Budget> findById(UUID budgetId, UUID userId) {
        return jdbc.sql("""
            SELECT id, user_id, category_code, amount_limit, threshold_percent,
                   budget_month, created_at, updated_at
            FROM pfm_budgets WHERE id = :id AND user_id = :userId
            """)
            .param("id", budgetId).param("userId", userId)
            .query((rs, n) -> map(rs)).optional();
    }

    @Override
    public boolean existsByCategoryAndMonth(UUID userId, SpendingCategory category, YearMonth month) {
        Integer cnt = jdbc.sql("""
            SELECT COUNT(*) FROM pfm_budgets
            WHERE user_id = :userId AND category_code = :cat AND budget_month = :month
            """)
            .param("userId", userId).param("cat", category.name())
            .param("month", month.toString()).query(Integer.class).single();
        return cnt != null && cnt > 0;
    }

    @Override
    public int countByUserId(UUID userId) {
        return jdbc.sql("SELECT COUNT(*) FROM pfm_budgets WHERE user_id = :userId")
            .param("userId", userId).query(Integer.class).single();
    }

    @Override
    public Budget save(UUID userId, SpendingCategory category, BigDecimal amountLimit,
                       int thresholdPercent, YearMonth month) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        java.sql.Timestamp nowTs = java.sql.Timestamp.from(now);
        jdbc.sql("""
            INSERT INTO pfm_budgets
                (id, user_id, category_code, amount_limit, threshold_percent, budget_month, created_at, updated_at)
            VALUES (:id, :userId, :cat, :limit, :threshold, :month, :now, :now)
            """)
            .param("id", id).param("userId", userId)
            .param("cat", category.name())
            .param("limit", amountLimit)
            .param("threshold", thresholdPercent)
            .param("month", month.toString())
            .param("now", nowTs).update();
        return new Budget(id, userId, category, amountLimit, thresholdPercent, month, now, now);
    }

    @Override
    public void deleteById(UUID budgetId, UUID userId) {
        jdbc.sql("DELETE FROM pfm_budgets WHERE id = :id AND user_id = :userId")
            .param("id", budgetId).param("userId", userId).update();
    }

    private Budget map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new Budget(
            rs.getObject("id", UUID.class),
            rs.getObject("user_id", UUID.class),
            SpendingCategory.valueOf(rs.getString("category_code")),
            rs.getBigDecimal("amount_limit"),
            rs.getInt("threshold_percent"),
            YearMonth.parse(rs.getString("budget_month")),
            rs.getTimestamp("created_at").toInstant(),
            rs.getTimestamp("updated_at").toInstant()
        );
    }
}
