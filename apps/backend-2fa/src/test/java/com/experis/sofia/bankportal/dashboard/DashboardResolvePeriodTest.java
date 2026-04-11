package com.experis.sofia.bankportal.dashboard;

import com.experis.sofia.bankportal.dashboard.application.DashboardSummaryUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.YearMonth;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios de resolvePeriod() — DashboardSummaryUseCase.
 * RV-011 (Sprint 13, diferido): validación del formato YYYY-MM.
 *
 * Sprint 14 — FEAT-012 / RV-011 saldado — SOFIA QA Agent — CMMI VER SP 2.1
 */
@DisplayName("DashboardSummaryUseCase — resolvePeriod() validación formato")
class DashboardResolvePeriodTest {

    @Test
    @DisplayName("current_month resuelve al mes actual YYYY-MM")
    void resolvePeriod_currentMonth_returnsCurrentYearMonth() {
        String result = DashboardSummaryUseCase.resolvePeriod("current_month");
        assertThat(result).isEqualTo(YearMonth.now().toString());
    }

    @Test
    @DisplayName("previous_month resuelve al mes anterior YYYY-MM")
    void resolvePeriod_previousMonth_returnsPreviousYearMonth() {
        String result = DashboardSummaryUseCase.resolvePeriod("previous_month");
        assertThat(result).isEqualTo(YearMonth.now().minusMonths(1).toString());
    }

    @Test
    @DisplayName("Formato YYYY-MM válido pasa sin modificar")
    void resolvePeriod_validYearMonth_passesThrough() {
        assertThat(DashboardSummaryUseCase.resolvePeriod("2026-01")).isEqualTo("2026-01");
        assertThat(DashboardSummaryUseCase.resolvePeriod("2025-12")).isEqualTo("2025-12");
    }

    @Test
    @DisplayName("Formato inválido lanza IllegalArgumentException — RV-011")
    void resolvePeriod_invalidFormat_throwsException() {
        assertThatThrownBy(() -> DashboardSummaryUseCase.resolvePeriod("invalid-period"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("YYYY-MM");

        assertThatThrownBy(() -> DashboardSummaryUseCase.resolvePeriod("2026-3"))
                .isInstanceOf(IllegalArgumentException.class);

        assertThatThrownBy(() -> DashboardSummaryUseCase.resolvePeriod("26-03"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
