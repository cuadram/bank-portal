package com.experis.sofia.bankportal.scheduled.application.dto;

import com.experis.sofia.bankportal.scheduled.domain.ScheduledTransferType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO de entrada para crear una transferencia programada.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public record CreateScheduledTransferRequest(
        UUID sourceAccountId,
        String destinationIban,
        String destinationAccountName,
        BigDecimal amount,
        String currency,
        String concept,
        ScheduledTransferType type,
        LocalDate scheduledDate,
        LocalDate endDate,
        Integer maxExecutions
) {}
