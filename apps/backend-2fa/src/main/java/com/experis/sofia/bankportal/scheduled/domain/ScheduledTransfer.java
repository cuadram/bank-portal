package com.experis.sofia.bankportal.scheduled.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Aggregate root — Transferencia Programada / Recurrente.
 * Invariantes del dominio gestionadas internamente.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public class ScheduledTransfer {

    private final UUID                   id;
    private final UUID                   userId;
    private final UUID                   sourceAccountId;
    private final String                 destinationIban;
    private final String                 destinationAccountName;
    private final BigDecimal             amount;
    private final String                 currency;
    private final String                 concept;
    private final ScheduledTransferType  type;
    private ScheduledTransferStatus      status;
    private final LocalDate              scheduledDate;
    private LocalDate                    nextExecutionDate;
    private final LocalDate              endDate;
    private final Integer                maxExecutions;
    private int                          executionsCount;
    private final LocalDateTime          createdAt;
    private LocalDateTime                updatedAt;
    private LocalDateTime                cancelledAt;

    // ── Constructor (nuevo) ─────────────────────────────────────────────────

    public ScheduledTransfer(UUID userId,
                             UUID sourceAccountId,
                             String destinationIban,
                             String destinationAccountName,
                             BigDecimal amount,
                             String currency,
                             String concept,
                             ScheduledTransferType type,
                             LocalDate scheduledDate,
                             LocalDate endDate,
                             Integer maxExecutions) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("El importe debe ser positivo");
        if (scheduledDate == null || !scheduledDate.isAfter(LocalDate.now()))
            throw new IllegalArgumentException("La fecha debe ser futura");

        this.id                    = UUID.randomUUID();
        this.userId                = userId;
        this.sourceAccountId       = sourceAccountId;
        this.destinationIban       = destinationIban;
        this.destinationAccountName = destinationAccountName;
        this.amount                = amount;
        this.currency              = currency != null ? currency : "EUR";
        this.concept               = concept;
        this.type                  = type;
        this.status                = ScheduledTransferStatus.PENDING;
        this.scheduledDate         = scheduledDate;
        this.nextExecutionDate     = scheduledDate;
        this.endDate               = endDate;
        this.maxExecutions         = maxExecutions;
        this.executionsCount       = 0;
        this.createdAt             = LocalDateTime.now();
        this.updatedAt             = LocalDateTime.now();
    }

    // ── Constructor (reconstitución desde persistencia) ─────────────────────

    public ScheduledTransfer(UUID id, UUID userId, UUID sourceAccountId,
                             String destinationIban, String destinationAccountName,
                             BigDecimal amount, String currency, String concept,
                             ScheduledTransferType type, ScheduledTransferStatus status,
                             LocalDate scheduledDate, LocalDate nextExecutionDate,
                             LocalDate endDate, Integer maxExecutions, int executionsCount,
                             LocalDateTime createdAt, LocalDateTime updatedAt,
                             LocalDateTime cancelledAt) {
        this.id                    = id;
        this.userId                = userId;
        this.sourceAccountId       = sourceAccountId;
        this.destinationIban       = destinationIban;
        this.destinationAccountName = destinationAccountName;
        this.amount                = amount;
        this.currency              = currency;
        this.concept               = concept;
        this.type                  = type;
        this.status                = status;
        this.scheduledDate         = scheduledDate;
        this.nextExecutionDate     = nextExecutionDate;
        this.endDate               = endDate;
        this.maxExecutions         = maxExecutions;
        this.executionsCount       = executionsCount;
        this.createdAt             = createdAt;
        this.updatedAt             = updatedAt;
        this.cancelledAt           = cancelledAt;
    }

    // ── Comportamiento de dominio ────────────────────────────────────────────

    public void pause() {
        if (status != ScheduledTransferStatus.ACTIVE)
            throw new IllegalStateException("Solo se puede pausar una transferencia ACTIVE");
        status    = ScheduledTransferStatus.PAUSED;
        updatedAt = LocalDateTime.now();
    }

    public void resume() {
        if (status != ScheduledTransferStatus.PAUSED)
            throw new IllegalStateException("Solo se puede reanudar una transferencia PAUSED");
        status    = ScheduledTransferStatus.ACTIVE;
        updatedAt = LocalDateTime.now();
    }

    public void cancel() {
        if (status == ScheduledTransferStatus.COMPLETED ||
            status == ScheduledTransferStatus.CANCELLED)
            throw new IllegalStateException("No se puede cancelar en estado " + status);
        status      = ScheduledTransferStatus.CANCELLED;
        cancelledAt = LocalDateTime.now();
        updatedAt   = LocalDateTime.now();
    }

    public void markFailed() {
        status    = ScheduledTransferStatus.FAILED;
        updatedAt = LocalDateTime.now();
    }

    /** Registra una ejecución exitosa y avanza la fecha siguiente. */
    public void incrementExecutions(LocalDate nextDate) {
        executionsCount++;
        if (type == ScheduledTransferType.ONCE) {
            status            = ScheduledTransferStatus.COMPLETED;
            nextExecutionDate = null;
        } else if (isEndReached(nextDate)) {
            status            = ScheduledTransferStatus.COMPLETED;
            nextExecutionDate = null;
        } else {
            status            = ScheduledTransferStatus.ACTIVE;
            nextExecutionDate = nextDate;
        }
        updatedAt = LocalDateTime.now();
    }

    private boolean isEndReached(LocalDate nextDate) {
        if (endDate != null && nextDate != null && !nextDate.isBefore(endDate))
            return true;
        return maxExecutions != null && executionsCount >= maxExecutions;
    }

    // ── Accessors ────────────────────────────────────────────────────────────

    public UUID                   getId()                    { return id; }
    public UUID                   getUserId()                { return userId; }
    public UUID                   getSourceAccountId()       { return sourceAccountId; }
    public String                 getDestinationIban()       { return destinationIban; }
    public String                 getDestinationAccountName(){ return destinationAccountName; }
    public BigDecimal             getAmount()                { return amount; }
    public String                 getCurrency()              { return currency; }
    public String                 getConcept()               { return concept; }
    public ScheduledTransferType  getType()                  { return type; }
    public ScheduledTransferStatus getStatus()               { return status; }
    public LocalDate              getScheduledDate()         { return scheduledDate; }
    public LocalDate              getNextExecutionDate()     { return nextExecutionDate; }
    public LocalDate              getEndDate()               { return endDate; }
    public Integer                getMaxExecutions()         { return maxExecutions; }
    public int                    getExecutionsCount()       { return executionsCount; }
    public LocalDateTime          getCreatedAt()             { return createdAt; }
    public LocalDateTime          getUpdatedAt()             { return updatedAt; }
    public LocalDateTime          getCancelledAt()           { return cancelledAt; }
}
