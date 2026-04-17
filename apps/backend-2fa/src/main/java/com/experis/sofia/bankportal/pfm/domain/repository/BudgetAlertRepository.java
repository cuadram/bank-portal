package com.experis.sofia.bankportal.pfm.domain.repository;

import com.experis.sofia.bankportal.pfm.domain.model.BudgetAlert;
import java.time.YearMonth;
import java.util.Optional;
import java.util.UUID;

/** Puerto — alertas de presupuesto PFM emitidas. */
public interface BudgetAlertRepository {
    boolean existsByBudgetIdAndMonth(UUID budgetId, YearMonth month);
    BudgetAlert save(UUID budgetId, YearMonth month);
    Optional<BudgetAlert> findByBudgetIdAndMonth(UUID budgetId, YearMonth month);
}
