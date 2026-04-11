package com.experis.sofia.bankportal.bill.domain;

import java.math.BigDecimal;

/**
 * Resultado del lookup de una factura en el core bancario.
 * DEBT-018 — extraída de BillPaymentPort como clase top-level.
 * FEAT-009 Sprint 11 · refactorizado Sprint 12.
 *
 * @author SOFIA Developer Agent
 */
public record BillLookupResult(
        String externalBillId,
        String issuer,
        String concept,
        BigDecimal amount,
        String expiryDate
) {}
