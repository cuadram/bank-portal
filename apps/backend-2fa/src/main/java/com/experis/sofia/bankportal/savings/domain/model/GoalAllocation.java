package com.experis.sofia.bankportal.savings.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Aportacion a objetivo (FEAT-024).
 * Invariantes: amount > 0; inmutable tras SUCCESS.
 */
public class GoalAllocation {
    private UUID id;
    private UUID goalId;
    private BigDecimal amount;
    private AllocationType allocationType;
    private UUID sourceAccountId;
    private UUID ruleId;
    private String allocationMonth;
    private AllocationStatus status;
    private String failureReason;
    private Instant executedAt;

    public GoalAllocation() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getGoalId() { return goalId; }
    public void setGoalId(UUID goalId) { this.goalId = goalId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public AllocationType getAllocationType() { return allocationType; }
    public void setAllocationType(AllocationType allocationType) { this.allocationType = allocationType; }
    public UUID getSourceAccountId() { return sourceAccountId; }
    public void setSourceAccountId(UUID sourceAccountId) { this.sourceAccountId = sourceAccountId; }
    public UUID getRuleId() { return ruleId; }
    public void setRuleId(UUID ruleId) { this.ruleId = ruleId; }
    public String getAllocationMonth() { return allocationMonth; }
    public void setAllocationMonth(String allocationMonth) { this.allocationMonth = allocationMonth; }
    public AllocationStatus getStatus() { return status; }
    public void setStatus(AllocationStatus status) { this.status = status; }
    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public Instant getExecutedAt() { return executedAt; }
    public void setExecutedAt(Instant executedAt) { this.executedAt = executedAt; }
}
