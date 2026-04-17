package com.experis.sofia.bankportal.pfm.domain.service;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import com.experis.sofia.bankportal.pfm.domain.model.Budget;
import com.experis.sofia.bankportal.pfm.domain.repository.BudgetRepository;
import com.experis.sofia.bankportal.pfm.domain.repository.PfmTransactionReadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * Gestión de presupuestos mensuales por categoría.
 * RN-F023-04: máx 10 presupuestos/usuario.
 * RN-F023-05: 1/categoría/mes.
 * RN-F023-07: consumo calculado en tiempo de consulta (no persistido).
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Service
@RequiredArgsConstructor
public class BudgetService {

    public static final int MAX_BUDGETS = 10;

    private final BudgetRepository              budgetRepo;
    private final PfmTransactionReadRepository  txRepo;

    public List<Budget> getBudgets(UUID userId) {
        return budgetRepo.findByUserId(userId);
    }

    public Budget createBudget(UUID userId, SpendingCategory category,
                               BigDecimal amountLimit, int thresholdPercent) {
        YearMonth month = YearMonth.now();
        if (budgetRepo.countByUserId(userId) >= MAX_BUDGETS)
            throw new BudgetLimitExceededException("Máximo " + MAX_BUDGETS + " presupuestos");
        if (budgetRepo.existsByCategoryAndMonth(userId, category, month))
            throw new DuplicateBudgetException("Ya existe presupuesto para " + category + " en " + month);
        return budgetRepo.save(userId, category, amountLimit, thresholdPercent, month);
    }

    public void deleteBudget(UUID budgetId, UUID userId) {
        budgetRepo.findById(budgetId, userId)
                  .orElseThrow(() -> new BudgetNotFoundException(budgetId));
        budgetRepo.deleteById(budgetId, userId);
    }

    /** Consumo real del presupuesto en el mes de referencia. */
    public BigDecimal getSpent(UUID userId, SpendingCategory category, YearMonth month) {
        return txRepo.sumCargosByCategory(userId, month, category.name());
    }

    // ── Excepciones de dominio ─────────────────────────────────────────────────
    public static class BudgetLimitExceededException extends RuntimeException {
        public BudgetLimitExceededException(String msg) { super(msg); }
    }
    public static class DuplicateBudgetException extends RuntimeException {
        public DuplicateBudgetException(String msg) { super(msg); }
    }
    public static class BudgetNotFoundException extends RuntimeException {
        public BudgetNotFoundException(UUID id) { super("Budget not found: " + id); }
    }
}
