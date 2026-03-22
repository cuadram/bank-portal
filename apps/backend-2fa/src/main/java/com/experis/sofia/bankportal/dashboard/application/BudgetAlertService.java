package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.audit.AuditLogService;
import com.experis.sofia.bankportal.dashboard.application.dto.BudgetAlertDto;
import com.experis.sofia.bankportal.dashboard.domain.BudgetAlertRepositoryPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * Caso de uso — Alertas de presupuesto (80% umbral).
 * Se llama desde TransferUseCase y BillPaymentUseCase tras operación completada.
 * US-1005 FEAT-010 Sprint 12.
 *
 * @author SOFIA Developer Agent
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetAlertService {

    private final BudgetAlertRepositoryPort alertRepo;
    private final DashboardSummaryUseCase   summaryUseCase;
    private final AuditLogService           auditLog;

    /**
     * Evalúa si se debe disparar una alerta de presupuesto.
     * Llamar tras cualquier operación financiera completada.
     *
     * @param userId         usuario afectado
     * @param monthlyBudget  presupuesto mensual configurado (null si no configurado)
     */
    public void evaluateBudget(UUID userId, BigDecimal monthlyBudget) {
        if (monthlyBudget == null || monthlyBudget.compareTo(BigDecimal.ZERO) <= 0) return;

        String period = YearMonth.now().toString();

        // Evitar alerta duplicada en el mismo período
        if (alertRepo.existsForPeriod(userId, period)) return;

        var summary = summaryUseCase.getSummary(userId, period);
        BigDecimal expenses = summary.totalExpenses();

        double usedPct = expenses.multiply(BigDecimal.valueOf(100))
                .divide(monthlyBudget, 1, RoundingMode.HALF_UP) // RV-013: import limpio
                .doubleValue();

        if (usedPct >= 80.0) {
            alertRepo.saveAlert(userId, period, monthlyBudget, 80, expenses);
            auditLog.record(userId, "BUDGET_ALERT_TRIGGERED",
                    "period=" + period + " used=" + usedPct + "% budget=" + monthlyBudget);
            log.info("[US-1005] Alerta disparada: userId={} period={} used={}%", userId, period, usedPct);
            // Notificación SSE + email: delegar al NotificationService (ya existente)
        }
    }

    /** GET /api/v1/dashboard/alerts */
    public List<BudgetAlertDto> getActiveAlerts(UUID userId) {
        return alertRepo.findRecentAlerts(userId, YearMonth.now().toString());
    }
}
