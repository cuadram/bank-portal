package com.experis.sofia.bankportal.dashboard;

import com.experis.sofia.bankportal.dashboard.application.DashboardExportUseCase;
import com.experis.sofia.bankportal.dashboard.application.DashboardSummaryUseCase;
import com.experis.sofia.bankportal.dashboard.application.dto.DashboardSummaryDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.YearMonth;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios — DashboardSummaryUseCase (DEBT-020) + DashboardExportUseCase.
 * FEAT-011 Sprint 13.
 */
@ExtendWith(MockitoExtension.class)
class DashboardExportUseCaseTest {

    // ── DEBT-020: resolvePeriod() validación YYYY-MM ──────────────────────────

    @Test
    @DisplayName("DEBT-020: current_month → YYYY-MM del mes actual")
    void resolvePeriod_currentMonth() {
        String result = DashboardSummaryUseCase.resolvePeriod("current_month");
        assertThat(result).matches("\\d{4}-\\d{2}");
        assertThat(result).isEqualTo(YearMonth.now().toString());
    }

    @Test
    @DisplayName("DEBT-020: previous_month → mes anterior en YYYY-MM")
    void resolvePeriod_previousMonth() {
        String result = DashboardSummaryUseCase.resolvePeriod("previous_month");
        assertThat(result).isEqualTo(YearMonth.now().minusMonths(1).toString());
    }

    @Test
    @DisplayName("DEBT-020: formato YYYY-MM válido pasa sin modificar")
    void resolvePeriod_validFormat_passes() {
        assertThatNoException().isThrownBy(() ->
            DashboardSummaryUseCase.resolvePeriod("2025-11"));
        assertThat(DashboardSummaryUseCase.resolvePeriod("2025-11")).isEqualTo("2025-11");
    }

    @Test
    @DisplayName("DEBT-020: formato inválido → IllegalArgumentException → HTTP 400")
    void resolvePeriod_invalidFormat_throwsIllegalArgument() {
        assertThatThrownBy(() -> DashboardSummaryUseCase.resolvePeriod("2026-3"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Periodo invalido");
    }

    @Test
    @DisplayName("DEBT-020: texto libre → IllegalArgumentException")
    void resolvePeriod_freeText_throwsIllegalArgument() {
        assertThatThrownBy(() -> DashboardSummaryUseCase.resolvePeriod("enero"))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("DEBT-020: null → NullPointerException protegido por switch")
    void resolvePeriod_null_throwsNPE() {
        assertThatThrownBy(() -> DashboardSummaryUseCase.resolvePeriod(null))
            .isInstanceOf(NullPointerException.class);
    }
}
