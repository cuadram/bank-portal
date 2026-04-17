package com.experis.sofia.bankportal.pfm.domain.service;

import com.experis.sofia.bankportal.notification.application.NotificationService;
import com.experis.sofia.bankportal.notification.domain.SecurityEventType;
import com.experis.sofia.bankportal.pfm.domain.model.Budget;
import com.experis.sofia.bankportal.pfm.domain.repository.BudgetAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.Map;
import java.util.UUID;

/**
 * Alertas PFM por umbral configurable por presupuesto.
 *
 * <p>Distinto del BudgetAlertService de dashboard (FEAT-010) que opera sobre
 * presupuesto global. Este opera sobre presupuestos por categoría (FEAT-023).
 *
 * <p>RN-F023-08: umbral 50–95%.
 * RN-F023-09: 1 alerta/presupuesto/mes.
 * RN-F023-10: tipo BUDGET_ALERT, acción /pfm/presupuestos.
 * RN-F023-11: evaluación síncrona al registrar movimiento.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PfmBudgetAlertService {

    private final BudgetAlertRepository alertRepo;
    private final NotificationService   notificationService;

    /**
     * Evalúa si el gasto supera el umbral del presupuesto y emite alerta si procede.
     * Llamar después de cada nueva categorización de CARGO.
     */
    public void evaluateAndAlert(UUID userId, Budget budget, BigDecimal spent) {
        YearMonth month = YearMonth.now();
        if (!budget.isAboveThreshold(spent)) return;
        if (alertRepo.existsByBudgetIdAndMonth(budget.getId(), month)) return;

        alertRepo.save(budget.getId(), month);

        int pct = budget.percentConsumed(spent);
        notificationService.createNotification(
                userId,
                SecurityEventType.BUDGET_ALERT,
                Map.of(
                    "category",    budget.getCategory().name(),
                    "amountLimit", budget.getAmountLimit().toPlainString(),
                    "spent",       spent.toPlainString(),
                    "percent",     String.valueOf(pct)
                ),
                "/pfm/presupuestos"
        );
        log.info("[PFM] BUDGET_ALERT emitida userId={} budgetId={} category={} pct={}%",
                userId, budget.getId(), budget.getCategory(), pct);
    }
}
