package com.experis.sofia.bankportal.account.application;

import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort;
import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort.TransactionFilter;
import com.experis.sofia.bankportal.account.domain.Transaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * US-702 / US-703 — Consulta de movimientos paginados con filtros y búsqueda.
 *
 * <p>Soporta filtros combinables (fecha, tipo, importe) y búsqueda full-text en concepto.
 * Resultados cacheados 30s y eviccionados cuando llega un nuevo movimiento vía SSE.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionHistoryUseCase {

    private final AccountRepositoryPort          accountRepository;
    private final TransactionCategorizationService categorizationService;

    private static final int MAX_PAGE_SIZE = 100;

    /**
     * Devuelve movimientos paginados aplicando filtros opcionales.
     *
     * @param accountId ID de la cuenta
     * @param filter    filtros combinables; usa {@link TransactionFilter#empty()} si no hay filtros
     * @param pageable  paginación; page size limitado a {@value MAX_PAGE_SIZE}
     * @return página de movimientos con categoría asignada (US-705)
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "transactions",
               key = "#accountId + '_' + #filter.hashCode() + '_' + #pageable.pageNumber")
    public Page<TransactionDto> getTransactions(UUID accountId,
                                                TransactionFilter filter,
                                                Pageable pageable) {
        Pageable bounded = PageRequest.of(
                pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "transactionDate"));

        Page<Transaction> page = accountRepository.findTransactions(accountId, filter, bounded);

        return page.map(t -> {
            // US-705: asignar categoría si aún es OTRO y hay concepto
            String category = "OTRO".equals(t.getCategory())
                    ? categorizationService.categorizeAsString(t.getConcept())
                    : t.getCategory();

            return new TransactionDto(
                    t.getId(), t.getAccountId(),
                    t.getTransactionDate(), t.getConcept(),
                    t.getAmount(), t.getBalanceAfter(),
                    category, t.getType().name());
        });
    }

    /**
     * Invalida la caché de transacciones de una cuenta.
     * Llamado cuando llega un nuevo movimiento vía SSE (account-balance-updated).
     */
    @CacheEvict(value = "transactions", allEntries = true)
    public void invalidateCache(UUID accountId) {
        log.debug("[US-702] Caché de transacciones invalidada para accountId={}", accountId);
    }
}
