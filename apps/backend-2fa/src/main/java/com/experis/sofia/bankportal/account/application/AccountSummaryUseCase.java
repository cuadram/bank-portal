package com.experis.sofia.bankportal.account.application;

import com.experis.sofia.bankportal.account.domain.Account;
import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * US-701 — Consulta del resumen de cuentas bancarias del usuario.
 *
 * <p>Devuelve todas las cuentas activas del usuario con saldo disponible y retenido.
 * El acceso queda auditado en {@code audit_log} con tipo {@code ACCOUNT_BALANCE_VIEWED}.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountSummaryUseCase {

    private final AccountRepositoryPort accountRepository;

    /**
     * Obtiene el resumen de cuentas del usuario.
     *
     * @param userId    ID del usuario autenticado
     * @return lista de cuentas con saldo; lista vacía si no tiene cuentas activas
     */
    @Transactional(readOnly = true)
    public List<AccountSummaryDto> getSummary(UUID userId) {
        List<Account> accounts = accountRepository.findByUserId(userId);

        log.debug("[US-701] Consulta cuentas userId={} total={}", userId, accounts.size());

        return accounts.stream()
                .filter(Account::isActive)
                .map(a -> new AccountSummaryDto(
                        a.getId(),
                        a.getAlias(),
                        a.getIbanMasked(),
                        a.getType().name(),
                        a.getAvailableBalance(),
                        a.getRetainedBalance()))
                .collect(Collectors.toList());
    }
}
