package com.experis.sofia.bankportal.dashboard;

import com.experis.sofia.bankportal.dashboard.application.DashboardSummaryUseCase;
import com.experis.sofia.bankportal.dashboard.application.MonthlyEvolutionUseCase;
import com.experis.sofia.bankportal.dashboard.application.dto.DashboardSummaryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.MonthlyEvolutionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Tests unitarios — MonthlyEvolutionUseCase.
 * US-1003 FEAT-010 Sprint 12.
 */
@ExtendWith(MockitoExtension.class)
class MonthlyEvolutionUseCaseTest {

    @Mock DashboardSummaryUseCase summaryUseCase;

    private MonthlyEvolutionUseCase useCase;
    private UUID userId;

    @BeforeEach
    void setUp() {
        useCase = new MonthlyEvolutionUseCase(summaryUseCase);
        userId  = UUID.randomUUID();
    }

    @Test
    @DisplayName("US-1003 Escenario 1: serie de 6 meses con datos reales")
    void shouldReturn6MonthSeries() {
        when(summaryUseCase.getSummary(eq(userId), anyString()))
                .thenAnswer(inv -> new DashboardSummaryDto(
                        inv.getArgument(1),
                        new BigDecimal("3500.00"),
                        new BigDecimal("2000.00"),
                        new BigDecimal("1500.00"), 20));

        List<MonthlyEvolutionDto> result = useCase.getEvolution(userId, 6);

        assertThat(result).hasSize(6);
        // Verificar orden cronológico — el último elemento es el mes actual
        YearMonth current = YearMonth.now();
        assertThat(result.get(5).year()).isEqualTo(current.getYear());
        assertThat(result.get(5).month()).isEqualTo(current.getMonthValue());
    }

    @Test
    @DisplayName("US-1003 Escenario 2: meses sin actividad incluidos como cero")
    void shouldIncludeZeroMonths() {
        when(summaryUseCase.getSummary(eq(userId), anyString()))
                .thenReturn(new DashboardSummaryDto("2026-01",
                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0));

        List<MonthlyEvolutionDto> result = useCase.getEvolution(userId, 3);

        assertThat(result).hasSize(3);
        assertThat(result).allMatch(e ->
                e.totalIncome().compareTo(BigDecimal.ZERO) == 0 &&
                e.totalExpenses().compareTo(BigDecimal.ZERO) == 0);
    }

    @Test
    @DisplayName("US-1003 Escenario 3: solicitud de 1 mes → exactamente 1 elemento")
    void shouldReturn1MonthWhenRequested() {
        when(summaryUseCase.getSummary(eq(userId), anyString()))
                .thenReturn(new DashboardSummaryDto("2026-03",
                        new BigDecimal("3500"), new BigDecimal("2000"),
                        new BigDecimal("1500"), 10));

        assertThat(useCase.getEvolution(userId, 1)).hasSize(1);
    }

    @Test
    @DisplayName("US-1003: solicitud de 12 meses → exactamente 12 elementos")
    void shouldReturn12MonthsWhenRequested() {
        when(summaryUseCase.getSummary(eq(userId), anyString()))
                .thenReturn(new DashboardSummaryDto("x",
                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0));

        assertThat(useCase.getEvolution(userId, 12)).hasSize(12);
    }

    @Test
    @DisplayName("US-1003: serie siempre en orden cronológico ascendente")
    void shouldBeInChronologicalOrder() {
        when(summaryUseCase.getSummary(eq(userId), anyString()))
                .thenAnswer(inv -> new DashboardSummaryDto(inv.getArgument(1),
                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0));

        List<MonthlyEvolutionDto> result = useCase.getEvolution(userId, 6);

        for (int i = 1; i < result.size(); i++) {
            YearMonth prev = YearMonth.of(result.get(i-1).year(), result.get(i-1).month());
            YearMonth curr = YearMonth.of(result.get(i).year(),   result.get(i).month());
            assertThat(curr).isAfter(prev);
        }
    }
}
