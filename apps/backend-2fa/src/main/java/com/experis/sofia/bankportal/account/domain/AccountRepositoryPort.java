package com.experis.sofia.bankportal.account.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de acceso al repositorio de cuentas y movimientos.
 *
 * <p>Interfaz sellada que permite swap transparente entre implementaciones:
 * <ul>
 *   <li>{@code MockAccountRepositoryAdapter} — Sprint 9 (@Profile "!production")</li>
 *   <li>{@code CoreBankingAccountAdapter}    — Sprint 10 (@Profile "production")</li>
 * </ul>
 *
 * @author SOFIA Architect Agent — LLD-010 / FEAT-007 Sprint 9
 */
public interface AccountRepositoryPort {

    /** US-701: cuentas activas del usuario con saldo cargado. */
    List<Account> findByUserId(UUID userId);

    /** US-702/703: movimientos paginados con filtros combinables. */
    Page<Transaction> findTransactions(UUID accountId, TransactionFilter filter, Pageable pageable);

    /** US-701: saldo actual de una cuenta (para actualización SSE en tiempo real). */
    Optional<AccountBalance> getBalance(UUID accountId);

    /** US-704: movimientos de un mes para extracto (máximo 500). */
    List<Transaction> findByMonth(UUID accountId, Instant from, Instant to, int maxResults);

    /**
     * Filtro de búsqueda de movimientos — todos los campos opcionales.
     */
    record TransactionFilter(
        Instant    from,
        Instant    to,
        String     type,        // "CARGO" | "ABONO" | null
        BigDecimal minAmount,
        BigDecimal maxAmount,
        String     searchQuery  // US-703: mínimo 3 chars, full-text en concept
    ) {
        public static TransactionFilter empty() {
            return new TransactionFilter(null, null, null, null, null, null);
        }

        public boolean hasSearchQuery() {
            return searchQuery != null && searchQuery.trim().length() >= 3;
        }
    }

    /** DTO de saldo de cuenta. */
    record AccountBalance(
        UUID       accountId,
        BigDecimal available,
        BigDecimal retained,
        Instant    updatedAt
    ) {}
}
