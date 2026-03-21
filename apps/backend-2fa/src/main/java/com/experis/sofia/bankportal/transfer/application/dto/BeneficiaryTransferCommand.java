package com.experis.sofia.bankportal.transfer.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Comando US-802 — Transferencia a beneficiario guardado. */
public record BeneficiaryTransferCommand(
        UUID       userId,
        UUID       beneficiaryId,
        UUID       sourceAccountId,
        BigDecimal amount,
        String     concept,
        String     otpCode,
        boolean    firstTransferConfirmed
) {}
