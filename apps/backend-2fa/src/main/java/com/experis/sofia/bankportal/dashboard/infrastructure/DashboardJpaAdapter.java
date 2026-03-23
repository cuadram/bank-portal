package com.experis.sofia.bankportal.dashboard.infrastructure;

import com.experis.sofia.bankportal.dashboard.application.dto.SpendingCategoryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.TopMerchantDto;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Adaptador JPA/JDBC — implementa DashboardRepositoryPort.
 * Usa JdbcClient (Spring 6.1) para las queries de agregación.
 * FEAT-010 Sprint 12.
 *
 * @author SOFIA Developer Agent
 */
@Repository
@RequiredArgsConstructor
public class DashboardJpaAdapter implements DashboardRepositoryPort {

    private final JdbcClient jdbc;

    // ── Ingresos: transferencias ENTRANTES al usuario ─────────────────────────

    @Override
    public BigDecimal sumIncome(UUID userId, String period) {
        // Transferencias donde el usuario es el DESTINATARIO
        String sql = """
            SELECT COALESCE(SUM(amount), 0)
            FROM transfers
            WHERE target_account_id IN (
                SELECT id FROM accounts WHERE user_id = :userId
            )
            AND status = 'COMPLETED'
            AND TO_CHAR(created_at, 'YYYY-MM') = :period
            """;
        return jdbc.sql(sql)
                .param("userId", userId)
                .param("period", period)
                .query(BigDecimal.class)
                .single();
    }

    // ── Gastos: transfers salientes + bill_payments ────────────────────────────

    @Override
    public BigDecimal sumExpenses(UUID userId, String period) {
        String sql = """
            SELECT COALESCE(SUM(amount), 0) FROM (
                SELECT amount FROM transfers
                WHERE user_id = :userId AND status = 'COMPLETED'
                  AND TO_CHAR(created_at, 'YYYY-MM') = :period
                UNION ALL
                SELECT amount FROM bill_payments
                WHERE user_id = :userId AND status = 'COMPLETED'
                  AND TO_CHAR(paid_at, 'YYYY-MM') = :period
            ) AS combined
            """;
        return jdbc.sql(sql)
                .param("userId", userId)
                .param("period", period)
                .query(BigDecimal.class)
                .single();
    }

    @Override
    public int countTransactions(UUID userId, String period) {
        String sql = """
            SELECT COUNT(*) FROM (
                SELECT id FROM transfers
                WHERE user_id = :userId AND status = 'COMPLETED'
                  AND TO_CHAR(created_at, 'YYYY-MM') = :period
                UNION ALL
                SELECT id FROM bill_payments
                WHERE user_id = :userId AND status = 'COMPLETED'
                  AND TO_CHAR(paid_at, 'YYYY-MM') = :period
            ) AS combined
            """;
        return jdbc.sql(sql)
                .param("userId", userId)
                .param("period", period)
                .query(Integer.class)
                .single();
    }

    // ── Raw spendings para categorización ────────────────────────────────────

    @Override
    public List<RawSpendingRecord> findRawSpendings(UUID userId, String period) {
        String sql = """
            SELECT concept, NULL AS issuer, amount FROM transfers
            WHERE user_id = :userId AND status = 'COMPLETED'
              AND TO_CHAR(created_at, 'YYYY-MM') = :period
            UNION ALL
            SELECT NULL AS concept, issuer, amount FROM bill_payments
            WHERE user_id = :userId AND status = 'COMPLETED'
              AND TO_CHAR(paid_at, 'YYYY-MM') = :period
            """;
        return jdbc.sql(sql)
                .param("userId", userId)
                .param("period", period)
                .query((rs, rowNum) -> new RawSpendingRecord(
                        rs.getString("concept"),
                        rs.getString("issuer"),
                        rs.getBigDecimal("amount")))
                .list();
    }

    // ── Top merchants ─────────────────────────────────────────────────────────

    @Override
    public List<TopMerchantDto> findTopMerchants(UUID userId, String period, int limit) {
        String sql = """
            SELECT issuer, SUM(amount) AS total_amount, COUNT(*) AS cnt
            FROM bill_payments
            WHERE user_id = :userId AND status = 'COMPLETED'
              AND TO_CHAR(paid_at, 'YYYY-MM') = :period
              AND issuer IS NOT NULL
            GROUP BY issuer
            ORDER BY total_amount DESC
            LIMIT :limit
            """;
        return jdbc.sql(sql)
                .param("userId", userId)
                .param("period", period)
                .param("limit", limit)
                .query((rs, rowNum) -> new TopMerchantDto(
                        rs.getString("issuer"),
                        rs.getBigDecimal("total_amount"),
                        rs.getInt("cnt")))
                .list();
    }

    // ── Caché spending_categories ─────────────────────────────────────────────

    @Override
    public List<SpendingCategoryDto> findCachedCategories(UUID userId, String period) {
        return jdbc.sql("""
                    SELECT category, amount, tx_count FROM spending_categories
                    WHERE user_id = :userId AND period = :period
                    """)
                .param("userId", userId)
                .param("period", period)
                .query((rs, rowNum) -> new SpendingCategoryDto(
                        rs.getString("category"),
                        rs.getBigDecimal("amount"),
                        0.0, // percentage se recalcula en service
                        rs.getInt("tx_count")))
                .list();
    }

    @Override
    @Transactional
    public void upsertSpendingCategories(UUID userId, String period,
                                         List<SpendingCategoryDto> categories) {
        String sql = """
            INSERT INTO spending_categories (user_id, period, category, amount, tx_count)
            VALUES (:userId, :period, :category, :amount, :count)
            ON CONFLICT (user_id, period, category)
            DO UPDATE SET amount = EXCLUDED.amount, tx_count = EXCLUDED.tx_count,
                          computed_at = now()
            """;
        for (SpendingCategoryDto dto : categories) {
            jdbc.sql(sql)
                    .param("userId", userId)
                    .param("period", period)
                    .param("category", dto.category())
                    .param("amount", dto.amount())
                    .param("count", dto.count())
                    .update();
        }
    }

    @Override
    public void deleteCachedCategories(UUID userId, String period) {
        jdbc.sql("DELETE FROM spending_categories WHERE user_id = :userId AND period = :period")
                .param("userId", userId)
                .param("period", period)
                .update();
    }
}
