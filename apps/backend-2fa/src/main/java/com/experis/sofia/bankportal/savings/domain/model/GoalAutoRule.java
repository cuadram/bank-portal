package com.experis.sofia.bankportal.savings.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Regla de aportacion automatica mensual a objetivo (FEAT-024 RN-F024-04/05).
 * Invariantes: amount in [10..5000]; dayOfMonth in [1..28]; UK (goalId) WHERE active=true.
 */
public class GoalAutoRule {
    private UUID id;
    private UUID goalId;
    private BigDecimal amount;
    private int dayOfMonth;
    private UUID sourceAccountId;
    private boolean active;
    private Instant nextExecutionAt;
    private Instant lastExecutionAt;
    private Instant createdAt;

    public GoalAutoRule() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getGoalId() { return goalId; }
    public void setGoalId(UUID goalId) { this.goalId = goalId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public int getDayOfMonth() { return dayOfMonth; }
    public void setDayOfMonth(int dayOfMonth) { this.dayOfMonth = dayOfMonth; }
    public UUID getSourceAccountId() { return sourceAccountId; }
    public void setSourceAccountId(UUID sourceAccountId) { this.sourceAccountId = sourceAccountId; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getNextExecutionAt() { return nextExecutionAt; }
    public void setNextExecutionAt(Instant nextExecutionAt) { this.nextExecutionAt = nextExecutionAt; }
    public Instant getLastExecutionAt() { return lastExecutionAt; }
    public void setLastExecutionAt(Instant lastExecutionAt) { this.lastExecutionAt = lastExecutionAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
