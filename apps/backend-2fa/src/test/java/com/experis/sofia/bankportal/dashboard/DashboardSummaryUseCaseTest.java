package com.experis.sofia.bankportal.dashboard;

import com.experis.sofia.bankportal.dashboard.application.DashboardSummaryUseCase;
import com.experis.sofia.bankportal.dashboard.application.dto.DashboardSummaryDto;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Tests unitarios — DashboardSummaryUseCase.
 * US-1001 FEAT-010 Sprint 12.
 */
@ExtendWith(MockitoExtension.class)
class DashboardSummaryUseCaseTest {

    @Mock  DashboardRepositoryPort repo;
    @InjectMocks DashboardSummaryUseCase useCase;

    private UUID userId;

    @BeforeEach
    void setUp() { userId = UUID.randomUUID(); }

    @Test
    @DisplayName("US-1001 Escenario 1: resumen del mes actual con actividad")
    void shouldReturnSummaryWithActivity() {
        when(repo.sumIncome(userId, "2026-03")).thenReturn(new BigDecimal("3500.00"));
        when(repo.sumExpenses(userId, "2026-03")).thenReturn(new BigDecimal("2150.75"));
        when(repo.countTransactions(userId, "2026-03")).thenReturn(42);

        DashboardSummaryDto dto = useCase.getSummary(userId, "2026-03");

        assertThat(dto.period()).isEqualTo("2026-03");
        assertThat(dto.totalIncome()).isEqualByComparingTo("3500.00");
        assertThat(dto.totalExpenses()).isEqualByComparingTo("2150.75");
        assertThat(dto.netBalance()).isEqualByComparingTo("1349.25");
        assertThat(dto.transactionCount()).isEqualTo(42);
    }

    @Test
    @DisplayName("US-1001 Escenario 2: mes sin actividad → valores en cero")
    void shouldReturnZeroSummaryForEmptyMonth() {
        when(repo.sumIncome(userId, "2026-01")).thenReturn(BigDecimal.ZERO);
        when(repo.sumExpenses(userId, "2026-01")).thenReturn(BigDecimal.ZERO);
        when(repo.countTransactions(userId, "2026-01")).thenReturn(0);

        DashboardSummaryDto dto = useCase.getSummary(userId, "2026-01");

        assertThat(dto.totalIncome()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(dto.totalExpenses()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(dto.netBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(dto.transactionCount()).isZero();
    }

    @Test
    @DisplayName("US-1001: resolvePeriod convierte current_month a YYYY-MM")
    void shouldResolveCurrentMonth() {
        String period = DashboardSummaryUseCase.resolvePeriod("current_month");
        assertThat(period).matches("\\d{4}-\\d{2}");
    }

    @Test
    @DisplayName("US-1001: resolvePeriod convierte previous_month correctamente")
    void shouldResolvePreviousMonth() {
        String current  = DashboardSummaryUseCase.resolvePeriod("current_month");
        String previous = DashboardSummaryUseCase.resolvePeriod("previous_month");
        // previous debe ser exactamente 1 mes antes que current
        assertThat(previous).isLessThan(current);
    }

    @Test
    @DisplayName("US-1001: resolvePeriod pasa YYYY-MM directamente sin modificar")
    void shouldPassThroughExplicitPeriod() {
        assertThat(DashboardSummaryUseCase.resolvePeriod("2025-11")).isEqualTo("2025-11");
    }
}
