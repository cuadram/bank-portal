package com.experis.sofia.bankportal.transfer.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Comando US-801 — Transferencia entre cuentas propias. */
public record OwnTransferCommand(
        UUID       userId,
        UUID       sourceAccountId,
        UUID       targetAccountId,
        BigDecimal amount,
        String     concept,
        String     otpCode
) {}
