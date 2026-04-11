package com.experis.sofia.bankportal.scheduled.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registro inmutable de cada intento de ejecución.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public class ScheduledTransferExecution {

    private final UUID            id;
    private final UUID            scheduledTransferId;
    private UUID                  transferId;        // null si SKIPPED/FAILED
    private final LocalDate       scheduledDate;
    private final LocalDateTime   executedAt;
    private ExecutionStatus       status;
    private final BigDecimal      amount;
    private String                failureReason;
    private boolean               retried;

    public ScheduledTransferExecution(UUID scheduledTransferId,
                                      UUID transferId,
                                      LocalDate scheduledDate,
                                      ExecutionStatus status,
                                      BigDecimal amount,
                                      String failureReason,
                                      boolean retried) {
        this.id                  = UUID.randomUUID();
        this.scheduledTransferId = scheduledTransferId;
        this.transferId          = transferId;
        this.scheduledDate       = scheduledDate;
        this.executedAt          = LocalDateTime.now();
        this.status              = status;
        this.amount              = amount;
        this.failureReason       = failureReason;
        this.retried             = retried;
    }

    // Reconstitución
    public ScheduledTransferExecution(UUID id, UUID scheduledTransferId, UUID transferId,
                                      LocalDate scheduledDate, LocalDateTime executedAt,
                                      ExecutionStatus status, BigDecimal amount,
                                      String failureReason, boolean retried) {
        this.id                  = id;
        this.scheduledTransferId = scheduledTransferId;
        this.transferId          = transferId;
        this.scheduledDate       = scheduledDate;
        this.executedAt          = executedAt;
        this.status              = status;
        this.amount              = amount;
        this.failureReason       = failureReason;
        this.retried             = retried;
    }

    public void markRetried(UUID newTransferId, boolean success) {
        this.retried    = true;
        this.transferId = newTransferId;
        this.status     = success ? ExecutionStatus.SUCCESS : ExecutionStatus.SKIPPED;
    }

    public UUID          getId()                  { return id; }
    public UUID          getScheduledTransferId() { return scheduledTransferId; }
    public UUID          getTransferId()          { return transferId; }
    public LocalDate     getScheduledDate()       { return scheduledDate; }
    public LocalDateTime getExecutedAt()          { return executedAt; }
    public ExecutionStatus getStatus()            { return status; }
    public BigDecimal    getAmount()              { return amount; }
    public String        getFailureReason()       { return failureReason; }
    public boolean       isRetried()              { return retried; }
}
