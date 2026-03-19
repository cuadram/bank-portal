package com.experis.sofia.bankportal.account.api;

import com.experis.sofia.bankportal.account.application.AccountSummaryDto;
import com.experis.sofia.bankportal.account.application.AccountSummaryUseCase;
import com.experis.sofia.bankportal.account.application.TransactionDto;
import com.experis.sofia.bankportal.account.application.TransactionHistoryUseCase;
import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort.TransactionFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * API REST — Cuentas y movimientos bancarios.
 *
 * <pre>
 *   GET  /api/v1/accounts                                   → US-701 resumen cuentas
 *   GET  /api/v1/accounts/{accountId}/transactions          → US-702/703 movimientos
 * </pre>
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountSummaryUseCase    summaryUseCase;
    private final TransactionHistoryUseCase historyUseCase;

    // ─────────────────────────────────────────────────────────────────────────
    // US-701 — Resumen de cuentas con saldo
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Devuelve todas las cuentas activas del usuario con saldo disponible y retenido.
     * Carga en ≤ 2 segundos (p95) para usuarios con ≤ 10 cuentas.
     */
    @GetMapping
    public ResponseEntity<List<AccountSummaryDto>> getAccounts(
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        List<AccountSummaryDto> accounts = summaryUseCase.getSummary(userId);

        log.debug("[US-701] GET /accounts userId={} cuentas={}", userId, accounts.size());
        return ResponseEntity.ok(accounts);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // US-702 / US-703 — Movimientos paginados con filtros y búsqueda
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Devuelve movimientos paginados de una cuenta con filtros combinables.
     *
     * @param accountId  ID de la cuenta
     * @param from       fecha inicio (ISO 8601, opcional)
     * @param to         fecha fin (ISO 8601, opcional)
     * @param type       CARGO | ABONO (opcional)
     * @param minAmount  importe mínimo absoluto (opcional)
     * @param maxAmount  importe máximo absoluto (opcional)
     * @param q          US-703: búsqueda full-text en concepto (mín. 3 chars, opcional)
     * @param pageable   paginación; default: 20/pág ordenado por fecha DESC
     */
    @GetMapping("/{accountId}/transactions")
    public ResponseEntity<Page<TransactionDto>> getTransactions(
            @PathVariable UUID accountId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "transactionDate",
                             direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {

        // Validar búsqueda mínimo 3 chars (US-703)
        String searchQuery = (q != null && q.trim().length() >= 3) ? q.trim() : null;

        TransactionFilter filter = new TransactionFilter(
                from, to, type, minAmount, maxAmount, searchQuery);

        Page<TransactionDto> page = historyUseCase.getTransactions(accountId, filter, pageable);

        log.debug("[US-702] GET /accounts/{}/transactions page={} total={}",
                accountId, pageable.getPageNumber(), page.getTotalElements());

        return ResponseEntity.ok(page);
    }
}
