package com.experis.sofia.bankportal.bizum.infrastructure.corebanking;
import java.math.BigDecimal;
import java.util.UUID;

/** Puerto SEPA Instant — ADR-038 */
public interface SepaInstantPort {
    SepaInstantResult executeTransfer(UUID debtorUserId, String creditorPhone, BigDecimal amount, String concept);
}
