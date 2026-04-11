package com.experis.sofia.bankportal.account.application;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO de respuesta — resumen de cuenta bancaria para US-701.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
public record AccountSummaryDto(
        UUID       accountId,
        String     alias,
        String     ibanMasked,
        String     type,
        BigDecimal availableBalance,
        BigDecimal retainedBalance
) {}
