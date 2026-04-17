package com.experis.sofia.bankportal.pfm.infrastructure.persistence;

import com.experis.sofia.bankportal.pfm.domain.repository.PfmTransactionReadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * Adaptador JDBC — lectura de movimientos para PFM.
 * ADR-039: findTopComerciosUnificados usa UNION nativo sobre transactions + bill_payments.
 * Cierra DEBT-047 sin tocar findTopMerchants() de DashboardJpaAdapter.
 * @Primary sin @Profile (LA-019-08).
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Repository
@RequiredArgsConstructor
public class JdbcPfmTransactionReadAdapter implements PfmTransactionReadRepository {

    private final JdbcClient jdbc;

    @Override
    public List<RawMovimiento> findCargos(UUID userId, YearMonth month) {
        return jdbc.sql("""
            SELECT t.id, t.concept, ABS(t.amount) AS amount
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE a.user_id = :userId
              AND t.type = 'CARGO'
              AND TO_CHAR(t.transaction_date, 'YYYY-MM') = :month
            ORDER BY t.transaction_date DESC
            """)
            .param("userId", userId)
            .param("month", month.toString())
            .query((rs, n) -> new RawMovimiento(
                rs.getObject("id", UUID.class),
                rs.getString("concept"),
                rs.getBigDecimal("amount")
            )).list();
    }

    /**
     * Top comercios unificando transactions CARGO + bill_payments COMPLETED.
     * Extrae primer token significativo (>4 chars) como nombre normalizado.
     * Excluye AEAT, TGSS, SUMA y transferencias internas (RN-F023-21).
     * ADR-039 — query nativo para control total sobre extracción de tokens.
     */
    @Override
    public List<TopComercioRaw> findTopComerciosUnificados(UUID userId, YearMonth month, int limit) {
        return jdbc.sql("""
            WITH movs AS (
                SELECT
                    UPPER(SPLIT_PART(TRIM(t.concept), ' ', 1)) AS nombre_raw,
                    ABS(t.amount) AS importe
                FROM transactions t
                JOIN accounts a ON t.account_id = a.id
                WHERE a.user_id = :userId
                  AND t.type = 'CARGO'
                  AND TO_CHAR(t.transaction_date, 'YYYY-MM') = :month
                  AND LENGTH(SPLIT_PART(TRIM(t.concept), ' ', 1)) > 4
                  AND t.concept NOT ILIKE '%AEAT%'
                  AND t.concept NOT ILIKE '%TGSS%'
                  AND t.concept NOT ILIKE '%SUMA%'
                  AND t.concept NOT ILIKE '%TRANSFERENCIA%'
                UNION ALL
                SELECT
                    UPPER(SPLIT_PART(TRIM(bp.issuer), ' ', 1)) AS nombre_raw,
                    ABS(bp.amount) AS importe
                FROM bill_payments bp
                WHERE bp.user_id = :userId
                  AND bp.status = 'COMPLETED'
                  AND TO_CHAR(bp.paid_at, 'YYYY-MM') = :month
                  AND LENGTH(SPLIT_PART(TRIM(bp.issuer), ' ', 1)) > 4
                  AND bp.issuer NOT ILIKE '%AEAT%'
                  AND bp.issuer NOT ILIKE '%TGSS%'
            )
            SELECT nombre_raw AS nombre,
                   SUM(importe) AS total_importe,
                   COUNT(*)    AS num_transacciones
            FROM movs
            GROUP BY nombre_raw
            ORDER BY total_importe DESC
            LIMIT :limit
            """)
            .param("userId", userId)
            .param("month", month.toString())
            .param("limit", limit)
            .query((rs, n) -> new TopComercioRaw(
                rs.getString("nombre"),
                rs.getBigDecimal("total_importe"),
                rs.getInt("num_transacciones")
            )).list();
    }

    @Override
    public BigDecimal sumCargosByCategory(UUID userId, YearMonth month, String categoryCode) {
        // La categoría no está persistida (ADR-037) — se usa la tabla de caché del dashboard
        // para la suma; si no hay caché se devuelve ZERO (el caller recalculará si necesita).
        // Para el análisis comparativo se acepta esta aproximación: el motor categoriza
        // on-the-fly y la suma por categoría es exacta al llamar desde GetPfmAnalysisUseCase.
        BigDecimal result = jdbc.sql("""
            SELECT COALESCE(SUM(amount), 0)
            FROM spending_categories
            WHERE user_id = :userId
              AND period  = :period
              AND category = :category
            """)
            .param("userId", userId)
            .param("period", month.toString())
            .param("category", categoryCode)
            .query(BigDecimal.class).single();
        return result == null ? BigDecimal.ZERO : result;
    }
}
