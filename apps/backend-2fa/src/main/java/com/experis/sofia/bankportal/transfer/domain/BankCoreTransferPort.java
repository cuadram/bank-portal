package com.experis.sofia.bankportal.transfer.domain;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Puerto hexagonal hacia el core bancario (ADR-016).
 * Mock en Sprint 10 — implementación real en Sprint 11.
 */
public interface BankCoreTransferPort {
    BigDecimal getAvailableBalance(UUID accountId);
    TransferResult executeOwnTransfer(UUID sourceAccountId, UUID targetAccountId,
                                      BigDecimal amount, String concept);
    TransferResult executeExternalTransfer(UUID sourceAccountId, String targetIban,
                                           BigDecimal amount, String concept);

    record TransferResult(boolean success, BigDecimal sourceBalance,
                          BigDecimal targetBalance, String errorCode) {}
}
