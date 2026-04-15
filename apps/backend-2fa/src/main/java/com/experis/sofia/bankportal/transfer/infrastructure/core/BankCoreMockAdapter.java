package com.experis.sofia.bankportal.transfer.infrastructure.core;

import com.experis.sofia.bankportal.transfer.domain.BankCoreTransferPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Mock del core bancario — Sprint 10 (ADR-016).
 * Activo con perfil 'staging', 'test' o 'integration-compose'.
 * Swap por BankCoreRestAdapter en Sprint 11.
 * Simula saldos en memoria con 10.000€ por cuenta como valor inicial.
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@Slf4j
@Component
@Profile({"staging", "test", "integration-compose"})
public class BankCoreMockAdapter implements BankCoreTransferPort {

    private final ConcurrentHashMap<UUID, BigDecimal> balances = new ConcurrentHashMap<>();

    @Override
    public BigDecimal getAvailableBalance(UUID accountId) {
        return balances.computeIfAbsent(accountId, k -> BigDecimal.valueOf(10_000.00));
    }

    @Override
    public TransferResult executeOwnTransfer(UUID sourceAccountId, UUID targetAccountId,
                                              BigDecimal amount, String concept) {
        BigDecimal src = getAvailableBalance(sourceAccountId);
        BigDecimal tgt = getAvailableBalance(targetAccountId);
        if (src.compareTo(amount) < 0)
            return new TransferResult(false, src, tgt, "INSUFFICIENT_FUNDS");

        BigDecimal newSrc = src.subtract(amount);
        BigDecimal newTgt = tgt.add(amount);
        balances.put(sourceAccountId, newSrc);
        balances.put(targetAccountId, newTgt);
        log.info("[MOCK-CORE] Transf. propia: {} → {} amount={}€ srcBal={}€",
                sourceAccountId, targetAccountId, amount, newSrc);
        return new TransferResult(true, newSrc, newTgt, null);
    }

    @Override
    public TransferResult executeExternalTransfer(UUID sourceAccountId, String targetIban,
                                                   BigDecimal amount, String concept) {
        BigDecimal src = getAvailableBalance(sourceAccountId);
        if (src.compareTo(amount) < 0)
            return new TransferResult(false, src, BigDecimal.ZERO, "INSUFFICIENT_FUNDS");

        BigDecimal newSrc = src.subtract(amount);
        balances.put(sourceAccountId, newSrc);
        log.info("[MOCK-CORE] Transf. externa: {} → iban={}**** amount={}€",
                sourceAccountId, targetIban.substring(0, 4), amount);
        return new TransferResult(true, newSrc, BigDecimal.ZERO, null);
    }
}
