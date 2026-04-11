package com.experis.sofia.bankportal.account.infrastructure;

import com.experis.sofia.bankportal.account.domain.Account;
import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort;
import com.experis.sofia.bankportal.account.domain.Transaction;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.ArrayList;
import java.util.stream.Collectors;

/**
 * Adaptador JPA real — lee cuentas y movimientos desde PostgreSQL.
 * Reemplaza MockAccountRepositoryAdapter en todos los perfiles.
 *
 * @author SOFIA Developer Agent — DEBT-fix STG
 */
@Component
@Primary
@RequiredArgsConstructor
public class JpaAccountRepositoryAdapter implements AccountRepositoryPort {

    private final JdbcClient jdbc;

    // ── US-701: Cuentas del usuario ──────────────────────────────────────────

    @Override
    public List<Account> findByUserId(UUID userId) {
        return jdbc.sql("""
            SELECT a.id, a.user_id, a.alias, a.iban, a.type, a.status, a.created_at,
                   COALESCE(ab.available_balance, 0) AS available_balance,
                   COALESCE(ab.retained_balance,  0) AS retained_balance
            FROM accounts a
            LEFT JOIN account_balances ab ON ab.account_id = a.id
            WHERE a.user_id = :userId
            ORDER BY a.alias
            """)
            .param("userId", userId)
            .query((rs, i) -> {
                Account acc = new Account(
                    (UUID) rs.getObject("id"),
                    (UUID) rs.getObject("user_id"),
                    rs.getString("alias"),
                    rs.getString("iban"),
                    Account.Type.valueOf(rs.getString("type")),
                    Account.Status.valueOf(rs.getString("status")),
                    rs.getTimestamp("created_at").toInstant()
                );
                acc.loadBalance(
                    rs.getBigDecimal("available_balance"),
                    rs.getBigDecimal("retained_balance")
                );
                return acc;
            })
            .list();
    }

    // ── US-702/703: Movimientos paginados con filtros ─────────────────────────

    @Override
    public Page<Transaction> findTransactions(UUID accountId,
                                               TransactionFilter filter,
                                               Pageable pageable) {
        // Construir filtros opcionales como SQL nativo con parámetros posicionales
        // usando PreparedStatement para evitar problemas con named params en text blocks
        StringBuilder conditions = new StringBuilder();
        List<Object> args = new ArrayList<>();
        args.add(accountId); // $1

        if (filter.from() != null) {
            conditions.append(" AND t.transaction_date >= ?::timestamp");
            args.add(filter.from().toString().replace("Z", ""));
        }
        if (filter.to() != null) {
            conditions.append(" AND t.transaction_date <= ?::timestamp");
            args.add(filter.to().toString().replace("Z", ""));
        }
        if (filter.type() != null && !filter.type().isBlank()) {
            conditions.append(" AND t.type = ?");
            args.add(filter.type());
        }
        if (filter.minAmount() != null) {
            conditions.append(" AND ABS(t.amount) >= ?");
            args.add(filter.minAmount());
        }
        if (filter.maxAmount() != null) {
            conditions.append(" AND ABS(t.amount) <= ?");
            args.add(filter.maxAmount());
        }
        if (filter.hasSearchQuery()) {
            conditions.append(" AND LOWER(t.concept) LIKE ?");
            args.add("%" + filter.searchQuery().toLowerCase() + "%");
        }

        String baseWhere = "WHERE t.account_id = ?" + conditions;

        // Count
        String countSql = "SELECT COUNT(*) FROM transactions t " + baseWhere;
        long total = jdbc.sql(countSql)
            .params(args)
            .query(Long.class).single();

        if (total == 0) return new PageImpl<>(List.of(), pageable, 0);

        // Data
        List<Object> dataArgs = new ArrayList<>(args);
        dataArgs.add(pageable.getPageSize());
        dataArgs.add(pageable.getOffset());

        String dataSql = "SELECT t.id, t.account_id, t.transaction_date, t.concept, " +
            "t.amount, t.balance_after, COALESCE(t.category,'OTRO') AS category, t.type " +
            "FROM transactions t " + baseWhere +
            " ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?";

        List<Transaction> rows = jdbc.sql(dataSql)
            .params(dataArgs)
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
            )).list();

        return new PageImpl<>(rows, pageable, total);
    }

    // ── Saldo de una cuenta ───────────────────────────────────────────────────

    @Override
    public Optional<AccountBalance> getBalance(UUID accountId) {
        return jdbc.sql("""
            SELECT ab.account_id, ab.available_balance, ab.retained_balance, ab.updated_at
            FROM account_balances ab WHERE ab.account_id = :id
            """)
            .param("id", accountId)
            .query((rs, i) -> new AccountBalance(
                (UUID) rs.getObject("account_id"),
                rs.getBigDecimal("available_balance"),
                rs.getBigDecimal("retained_balance"),
                rs.getTimestamp("updated_at").toInstant()
            ))
            .optional();
    }

    // ── US-704: movimientos de un mes para extracto ───────────────────────────

    @Override
    public List<Transaction> findByMonth(UUID accountId, Instant from, Instant to, int maxResults) {
        return jdbc.sql("""
            SELECT id, account_id, transaction_date, concept, amount,
                   balance_after, COALESCE(category,'OTRO') AS category, type
            FROM transactions
            WHERE account_id = :accountId
              AND transaction_date >= :from
              AND transaction_date <= :to
            ORDER BY transaction_date ASC
            LIMIT :limit
            """)
            .param("accountId", accountId)
            .param("from",      from)
            .param("to",        to)
            .param("limit",     maxResults)
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
}
