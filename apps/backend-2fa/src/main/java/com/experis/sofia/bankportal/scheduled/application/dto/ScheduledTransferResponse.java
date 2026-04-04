package com.experis.sofia.bankportal.scheduled.application.dto;

import com.experis.sofia.bankportal.scheduled.domain.ScheduledTransfer;
import com.experis.sofia.bankportal.scheduled.domain.ScheduledTransferType;
import com.experis.sofia.bankportal.scheduled.domain.ScheduledTransferStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO de salida completo de una transferencia programada.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public record ScheduledTransferResponse(
        UUID id,
        UUID sourceAccountId,
        String destinationIban,
        String destinationAccountName,
        BigDecimal amount,
        String currency,
        String concept,
        ScheduledTransferType type,
        ScheduledTransferStatus status,
        LocalDate scheduledDate,
        LocalDate nextExecutionDate,
        LocalDate endDate,
        Integer maxExecutions,
        int executionsCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ScheduledTransferResponse from(ScheduledTransfer t) {
        return new ScheduledTransferResponse(
                t.getId(), t.getSourceAccountId(),
                t.getDestinationIban(), t.getDestinationAccountName(),
                t.getAmount(), t.getCurrency(), t.getConcept(),
                t.getType(), t.getStatus(),
                t.getScheduledDate(), t.getNextExecutionDate(),
                t.getEndDate(), t.getMaxExecutions(),
                t.getExecutionsCount(), t.getCreatedAt(), t.getUpdatedAt()
        );
    }
}
