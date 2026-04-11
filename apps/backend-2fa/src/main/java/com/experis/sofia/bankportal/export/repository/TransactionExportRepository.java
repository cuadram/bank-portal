package com.experis.sofia.bankportal.export.repository;

import com.experis.sofia.bankportal.account.domain.Transaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Repositorio de lectura optimizado para exportación de movimientos.
 * FEAT-018 Sprint 20. ADR-031: síncrono <= 500 registros.
 * LA-019-15: parámetros posicionales (?) — sin concatenación de named params en text blocks.
 * HOTFIX-S20: creado en paquete correcto; adapta Transaction real del dominio account.
 * BUG-FIX-002: filtro tipoMovimiento usa t.category (no t.type).
 * BUG-FIX-004: Instant → java.sql.Timestamp para columna TIMESTAMP (sin timezone) en PostgreSQL.
 *   JdbcClient no convierte Instant automáticamente para columnas TIMESTAMP without time zone.
 *   Solución: Timestamp.from(instant) que JDBC mapea correctamente a TIMESTAMP.
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class TransactionExportRepository {

    private final JdbcClient jdbc;

    /**
     * Verifica que una cuenta pertenece a un usuario dado (DEBT-038 fix).
     * SEC-F018-02: evitar IDOR entre cuentas de distintos usuarios.
     */
    public boolean existsByAccountIdAndUserId(UUID accountId, UUID userId) {
        Long count = jdbc.sql(
                "SELECT COUNT(*) FROM accounts WHERE id = ? AND user_id = ?")
                .params(List.of(accountId, userId))
                .query(Long.class).single();
        return count != null && count > 0;
    }

    /**
     * Recupera movimientos para exportación aplicando filtros opcionales.
     * Ordena por transaction_date DESC. Limita a maxResults+1 para detectar exceso.
     * BUG-FIX-002: filtro tipoMovimiento contra t.category (negocio), no t.type (CARGO/ABONO).
     * BUG-FIX-004: fechas pasadas como Timestamp.from(Instant) — compatible con TIMESTAMP pg.
     */
    public List<Transaction> findByAccountIdAndFilters(
            UUID accountId, LocalDate fechaDesde, LocalDate fechaHasta,
            String tipoMovimiento, int maxResults) {

        List<Object> args = new ArrayList<>();
        StringBuilder where = new StringBuilder("WHERE t.account_id = ?");
        args.add(accountId);

        if (fechaDesde != null) {
            where.append(" AND t.transaction_date >= ?");
            // BUG-FIX-004: Timestamp.from() en lugar de Instant directo
            args.add(Timestamp.from(fechaDesde.atStartOfDay().toInstant(ZoneOffset.UTC)));
        }
        if (fechaHasta != null) {
            where.append(" AND t.transaction_date < ?");
            args.add(Timestamp.from(fechaHasta.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)));
        }
        // BUG-FIX-002: era t.type = ? → ahora t.category = ?
        if (tipoMovimiento != null && !"TODOS".equals(tipoMovimiento)) {
            where.append(" AND t.category = ?");
            args.add(tipoMovimiento);
        }

        args.add(maxResults);

        String sql = "SELECT t.id, t.account_id, t.transaction_date, t.concept, " +
                "t.amount, t.balance_after, COALESCE(t.category,'OTRO') AS category, t.type " +
                "FROM transactions t " + where +
                " ORDER BY t.transaction_date DESC LIMIT ?";

        return jdbc.sql(sql)
                .params(args)
                .query((rs, i) -> new Transaction(
                        (UUID) rs.getObject("id"),
                        (UUID) rs.getObject("account_id"),
                        rs.getTimestamp("transaction_date").toInstant(),
                        rs.getString("concept"),
                        rs.getBigDecimal("amount"),
                        rs.getBigDecimal("balance_after"),
                        rs.getString("category"),
                        Transaction.Type.valueOf(rs.getString("type")),
                        rs.getTimestamp("transaction_date").toInstant()
                ))
                .list();
    }

    /** Cuenta registros exportables sin recuperarlos — usado por /preview. */
    public long countByAccountIdAndFilters(
            UUID accountId, LocalDate fechaDesde, LocalDate fechaHasta, String tipoMovimiento) {

        List<Object> args = new ArrayList<>();
        StringBuilder where = new StringBuilder("WHERE t.account_id = ?");
        args.add(accountId);

        if (fechaDesde != null) {
            where.append(" AND t.transaction_date >= ?");
            // BUG-FIX-004: Timestamp.from() en lugar de Instant directo
            args.add(Timestamp.from(fechaDesde.atStartOfDay().toInstant(ZoneOffset.UTC)));
        }
        if (fechaHasta != null) {
            where.append(" AND t.transaction_date < ?");
            args.add(Timestamp.from(fechaHasta.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)));
        }
        // BUG-FIX-002: era t.type = ? → ahora t.category = ?
        if (tipoMovimiento != null && !"TODOS".equals(tipoMovimiento)) {
            where.append(" AND t.category = ?");
            args.add(tipoMovimiento);
        }

        Long count = jdbc.sql("SELECT COUNT(*) FROM transactions t " + where)
                .params(args)
                .query(Long.class).single();
        return count != null ? count : 0L;
    }
}
