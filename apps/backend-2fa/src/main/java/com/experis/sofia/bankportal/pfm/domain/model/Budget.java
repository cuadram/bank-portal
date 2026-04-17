package com.experis.sofia.bankportal.pfm.domain.model;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.YearMonth;
import java.util.UUID;

/**
 * Presupuesto mensual por categoría.
 * RN-F023-04: máx 10 presupuestos/usuario.
 * RN-F023-05: 1 presupuesto/categoría/mes.
 * RN-F023-06: importe > 0 EUR ≤ 99.999,99 EUR · BigDecimal HALF_EVEN (ADR-034).
 * RN-F023-07: mensual recurrente — consumo calculado en tiempo de consulta.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
public class Budget {

    public enum Status { GREEN, ORANGE, RED }

    private final UUID             id;
    private final UUID             userId;
    private final SpendingCategory category;
    private final BigDecimal       amountLimit;
    private final int              thresholdPercent;   // 50-95 (RN-F023-08)
    private final YearMonth        budgetMonth;
    private final Instant          createdAt;
    private final Instant          updatedAt;

    public Budget(UUID id, UUID userId, SpendingCategory category,
                  BigDecimal amountLimit, int thresholdPercent,
                  YearMonth budgetMonth, Instant createdAt, Instant updatedAt) {
        this.id               = id;
        this.userId           = userId;
        this.category         = category;
        this.amountLimit      = amountLimit;
        this.thresholdPercent = thresholdPercent;
        this.budgetMonth      = budgetMonth;
        this.createdAt        = createdAt;
        this.updatedAt        = updatedAt;
    }

    /** Porcentaje consumido (HALF_EVEN — ADR-034). */
    public int percentConsumed(BigDecimal spent) {
        if (amountLimit.compareTo(BigDecimal.ZERO) == 0) return 0;
        return spent.multiply(BigDecimal.valueOf(100))
                    .divide(amountLimit, 0, RoundingMode.HALF_EVEN)
                    .intValue();
    }

    /** Semáforo: GREEN < threshold%, ORANGE [threshold%,100%), RED ≥ 100%. */
    public Status status(BigDecimal spent) {
        int pct = percentConsumed(spent);
        if (pct >= 100)             return Status.RED;
        if (pct >= thresholdPercent) return Status.ORANGE;
        return Status.GREEN;
    }

    public boolean isExceeded(BigDecimal spent) {
        return spent.compareTo(amountLimit) > 0;
    }

    public boolean isAboveThreshold(BigDecimal spent) {
        return percentConsumed(spent) >= thresholdPercent;
    }

    public UUID             getId()               { return id; }
    public UUID             getUserId()           { return userId; }
    public SpendingCategory getCategory()         { return category; }
    public BigDecimal       getAmountLimit()      { return amountLimit; }
    public int              getThresholdPercent() { return thresholdPercent; }
    public YearMonth        getBudgetMonth()      { return budgetMonth; }
    public Instant          getCreatedAt()        { return createdAt; }
    public Instant          getUpdatedAt()        { return updatedAt; }
}
