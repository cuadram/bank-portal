package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetAlertService {

    private final BudgetAlertRepositoryPort alertRepo;
    private final DashboardSummaryUseCase   summaryUseCase;
    private final AuditLogService           auditLog;

    public void evaluateBudget(UUID userId, BigDecimal monthlyBudget) {
        if (monthlyBudget == null || monthlyBudget.compareTo(BigDecimal.ZERO) <= 0) return;
        String period = YearMonth.now().toString();
        if (alertRepo.existsForPeriod(userId, period)) return;
        var summary = summaryUseCase.getSummary(userId, period);
        double usedPct = summary.totalExpenses().multiply(BigDecimal.valueOf(100))
                .divide(monthlyBudget, 1, RoundingMode.HALF_UP).doubleValue();
        if (usedPct >= 80.0) {
            alertRepo.saveAlert(userId, period, monthlyBudget, 80, summary.totalExpenses());
            auditLog.log("BUDGET_ALERT_TRIGGERED", userId,
                    "period=" + period + " used=" + usedPct + "% budget=" + monthlyBudget);
            log.info("[US-1005] Alerta disparada userId={} period={} used={}%", userId, period, usedPct);
        }
    }

    public List<BudgetAlertDto> getActiveAlerts(UUID userId) {
        return alertRepo.findRecentAlerts(userId, YearMonth.now().toString());
    }
}
