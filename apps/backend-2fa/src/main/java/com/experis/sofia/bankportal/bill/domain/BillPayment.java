package com.experis.sofia.bankportal.bill.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registro de pago de recibo o factura.
 * RV-002 fix — FEAT-009 Sprint 11.
 *
 * @author SOFIA Developer Agent
 */
public record BillPayment(
        UUID id,
        UUID userId,
        UUID billId,        // null para pagos de facturas con referencia
        String reference,   // null para pagos de recibos domiciliados
        String issuer,
        BigDecimal amount,
        UUID sourceAccount,
        String status,
        String coreTxnId,
        LocalDateTime paidAt
) {}
