package com.experis.sofia.bankportal.dashboard;

import com.experis.sofia.bankportal.audit.AuditLogService;
import com.experis.sofia.bankportal.dashboard.application.BudgetAlertService;
import com.experis.sofia.bankportal.dashboard.application.DashboardSummaryUseCase;
import com.experis.sofia.bankportal.dashboard.application.dto.BudgetAlertDto;
import com.experis.sofia.bankportal.dashboard.application.dto.DashboardSummaryDto;
import com.experis.sofia.bankportal.dashboard.domain.BudgetAlertRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — BudgetAlertService.
 * US-1005 FEAT-010 Sprint 12.
 */
@ExtendWith(MockitoExtension.class)
class BudgetAlertServiceTest {

    @Mock BudgetAlertRepositoryPort alertRepo;
    @Mock DashboardSummaryUseCase   summaryUseCase;
    @Mock AuditLogService           auditLog;

    private BudgetAlertService service;
    private UUID userId;

    @BeforeEach
    void setUp() {
        service = new BudgetAlertService(alertRepo, summaryUseCase, auditLog);
        userId  = UUID.randomUUID();
    }

    private DashboardSummaryDto summaryWith(String expenses) {
        BigDecimal exp = new BigDecimal(expenses);
        return new DashboardSummaryDto(YearMonth.now().toString(),
                new BigDecimal("3500"), exp, new BigDecimal("3500").subtract(exp), 20);
    }

    @Test
    @DisplayName("US-1005 Escenario 1: alerta disparada al superar el 80%")
    void shouldTriggerAlertWhenOver80Pct() {
        String period = YearMonth.now().toString();
        when(alertRepo.existsForPeriod(userId, period)).thenReturn(false);
        when(summaryUseCase.getSummary(userId, period)).thenReturn(summaryWith("1250.00")); // 83%

        service.evaluateBudget(userId, new BigDecimal("1500.00"));

        verify(alertRepo).saveAlert(eq(userId), eq(period),
                eq(new BigDecimal("1500.00")), eq(80), any());
        verify(auditLog).record(eq(userId), eq("BUDGET_ALERT_TRIGGERED"), anyString());
    }

    @Test
    @DisplayName("US-1005 Escenario 2: sin presupuesto configurado → no se evalúa")
    void shouldNotEvaluateWithoutBudget() {
        service.evaluateBudget(userId, null);
        verifyNoInteractions(alertRepo, summaryUseCase, auditLog);
    }

    @Test
    @DisplayName("US-1005 Escenario 3: gasto por debajo del 80% → no se dispara alerta")
    void shouldNotTriggerBelowThreshold() {
        String period = YearMonth.now().toString();
        when(alertRepo.existsForPeriod(userId, period)).thenReturn(false);
        when(summaryUseCase.getSummary(userId, period)).thenReturn(summaryWith("1000.00")); // 66%

        service.evaluateBudget(userId, new BigDecimal("1500.00"));

        verify(alertRepo, never()).saveAlert(any(), any(), any(), anyInt(), any());
    }

    @Test
    @DisplayName("US-1005: alerta ya existente en el período → no se duplica")
    void shouldNotDuplicateAlertForSamePeriod() {
        String period = YearMonth.now().toString();
        when(alertRepo.existsForPeriod(userId, period)).thenReturn(true);

        service.evaluateBudget(userId, new BigDecimal("1500.00"));

        verify(alertRepo, never()).saveAlert(any(), any(), any(), anyInt(), any());
        verifyNoInteractions(summaryUseCase);
    }

    @Test
    @DisplayName("US-1005: getActiveAlerts delega en repositorio")
    void shouldDelegateGetAlertsToRepo() {
        String period = YearMonth.now().toString();
        BudgetAlertDto alert = new BudgetAlertDto("BUDGET_THRESHOLD", 80,
                new BigDecimal("1500"), new BigDecimal("1250"), 83.3, LocalDateTime.now());
        when(alertRepo.findRecentAlerts(userId, period)).thenReturn(List.of(alert));

        List<BudgetAlertDto> result = service.getActiveAlerts(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).type()).isEqualTo("BUDGET_THRESHOLD");
    }
}
