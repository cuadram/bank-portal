package com.experis.sofia.bankportal.scheduled.application.dto;

import com.experis.sofia.bankportal.scheduled.domain.ExecutionStatus;
import com.experis.sofia.bankportal.scheduled.domain.ScheduledTransferExecution;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO de salida para un registro de ejecución.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public record ScheduledTransferExecutionResponse(
        UUID id,
        UUID scheduledTransferId,
        UUID transferId,
        LocalDate scheduledDate,
        LocalDateTime executedAt,
        ExecutionStatus status,
        BigDecimal amount,
        String failureReason,
        boolean retried
) {
    public static ScheduledTransferExecutionResponse from(ScheduledTransferExecution e) {
        return new ScheduledTransferExecutionResponse(
                e.getId(), e.getScheduledTransferId(), e.getTransferId(),
                e.getScheduledDate(), e.getExecutedAt(), e.getStatus(),
                e.getAmount(), e.getFailureReason(), e.isRetried()
        );
    }
}
