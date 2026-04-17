package com.experis.sofia.bankportal.pfm.domain.repository;

import com.experis.sofia.bankportal.pfm.domain.model.Budget;
import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Puerto — presupuestos mensuales por categoría. */
public interface BudgetRepository {
    List<Budget> findByUserId(UUID userId);
    Optional<Budget> findById(UUID budgetId, UUID userId);
    boolean existsByCategoryAndMonth(UUID userId, SpendingCategory category, YearMonth month);
    int countByUserId(UUID userId);
    Budget save(UUID userId, SpendingCategory category, BigDecimal amountLimit,
                int thresholdPercent, YearMonth month);
    void deleteById(UUID budgetId, UUID userId);
}
