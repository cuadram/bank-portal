package com.experis.sofia.bankportal.account.application;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO de respuesta — movimiento bancario para US-702/703/704.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
public record TransactionDto(
        UUID       id,
        UUID       accountId,
        Instant    transactionDate,
        String     concept,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String     category,
        String     type
) {}
