package com.experis.sofia.bankportal.savings.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Objetivo de ahorro raiz del bounded context savings (FEAT-024).
 * Invariantes: reservedAmount in [0..targetAmount]; targetDate > created_at + 30d.
 */
public class SavingsGoal {
    private UUID id;
    private UUID userId;
    private String name;
    private BigDecimal targetAmount;
    private BigDecimal reservedAmount;
    private LocalDate targetDate;
    private GoalCategory category;
    private String customCategory;
    private String icon;
    private String color;
    private GoalStatus status;
    private UUID sourceAccountId;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant closedAt;

    public SavingsGoal() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public void setTargetAmount(BigDecimal targetAmount) { this.targetAmount = targetAmount; }
    public BigDecimal getReservedAmount() { return reservedAmount; }
    public void setReservedAmount(BigDecimal reservedAmount) { this.reservedAmount = reservedAmount; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public GoalCategory getCategory() { return category; }
    public void setCategory(GoalCategory category) { this.category = category; }
    public String getCustomCategory() { return customCategory; }
    public void setCustomCategory(String customCategory) { this.customCategory = customCategory; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public GoalStatus getStatus() { return status; }
    public void setStatus(GoalStatus status) { this.status = status; }
    public UUID getSourceAccountId() { return sourceAccountId; }
    public void setSourceAccountId(UUID sourceAccountId) { this.sourceAccountId = sourceAccountId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }

    /** Porcentaje de progreso 0..100 con 2 decimales (RN-F024-08). */
    public BigDecimal progressPercent() {
        if (targetAmount == null || targetAmount.signum() == 0) return BigDecimal.ZERO;
        return reservedAmount.multiply(BigDecimal.valueOf(100))
            .divide(targetAmount, 2, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Incrementa el importe reservado (uso interno — invocado por use cases tras reserva atomica).
     * Invariante: reservedAmount + amount no puede exceder targetAmount.
     */
    public void reserve(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("amount debe ser positivo");
        }
        BigDecimal next = (reservedAmount == null ? BigDecimal.ZERO : reservedAmount).add(amount);
        if (next.compareTo(targetAmount) > 0) {
            throw new com.experis.sofia.bankportal.savings.domain.exception.ReservedExceedsTargetException();
        }
        this.reservedAmount = next;
        this.updatedAt = java.time.Instant.now();
        if (next.compareTo(targetAmount) == 0) {
            this.status = GoalStatus.COMPLETED;
        }
    }

    /**
     * Decrementa el importe reservado (uso interno — invocado por use cases tras release atomica).
     */
    public void release(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("amount debe ser positivo");
        }
        BigDecimal current = reservedAmount == null ? BigDecimal.ZERO : reservedAmount;
        BigDecimal next = current.subtract(amount);
        if (next.signum() < 0) {
            throw new IllegalStateException("release excederia reserved=0");
        }
        this.reservedAmount = next;
        this.updatedAt = java.time.Instant.now();
    }

    /**
     * Indica si el objetivo puede cerrarse en el estado actual.
     * Solo ACTIVE, PAUSED y COMPLETED se pueden cerrar (no se puede cerrar dos veces).
     */
    public boolean canBeClosed() {
        return status == GoalStatus.ACTIVE
            || status == GoalStatus.PAUSED
            || status == GoalStatus.COMPLETED;
    }
}
