package com.experis.sofia.bankportal.bill.domain;

/**
 * Puerto de salida — persistencia de registros de pago.
 * RV-002 fix — FEAT-009 Sprint 11.
 *
 * @author SOFIA Developer Agent
 */
public interface BillPaymentRepositoryPort {
    BillPayment save(BillPayment payment);
}
