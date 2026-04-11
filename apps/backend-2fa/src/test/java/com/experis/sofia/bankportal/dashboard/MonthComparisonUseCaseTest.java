package com.experis.sofia.bankportal.dashboard;

import com.experis.sofia.bankportal.dashboard.application.DashboardSummaryUseCase;
import com.experis.sofia.bankportal.dashboard.application.MonthComparisonUseCase;
import com.experis.sofia.bankportal.dashboard.application.dto.DashboardSummaryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.MonthComparisonDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

/**
 * Tests unitarios — MonthComparisonUseCase.
 * US-1004 FEAT-010 Sprint 12.
 */
@ExtendWith(MockitoExtension.class)
class MonthComparisonUseCaseTest {

    @Mock DashboardSummaryUseCase summaryUseCase;

    private MonthComparisonUseCase useCase;
    private UUID userId;

    @BeforeEach
    void setUp() {
        useCase = new MonthComparisonUseCase(summaryUseCase);
        userId  = UUID.randomUUID();
    }

    private DashboardSummaryDto summary(String period, String income, String expenses, int count) {
        return new DashboardSummaryDto(period,
                new BigDecimal(income), new BigDecimal(expenses),
                new BigDecimal(income).subtract(new BigDecimal(expenses)), count);
    }

    @Test
    @DisplayName("US-1004 Escenario 1: variación porcentual positiva al gastar más")
    void shouldReturnPositiveVariationWhenSpendingMore() {
        String current  = YearMonth.now().toString();
        String previous = YearMonth.now().minusMonths(1).toString();

        when(summaryUseCase.getSummary(userId, current))
                .thenReturn(summary(current, "3500", "2150.75", 42));
        when(summaryUseCase.getSummary(userId, previous))
                .thenReturn(summary(previous, "3500", "1900.00", 38));

        MonthComparisonDto dto = useCase.getComparison(userId);

        assertThat(dto.expensesVariationPercent()).isNotNull().isPositive();
        assertThat(dto.previousMonth()).isNotNull();
    }

    @Test
    @DisplayName("US-1004 Escenario 2: sin mes anterior → variación null")
    void shouldReturnNullVariationWithoutPreviousMonth() {
        String current  = YearMonth.now().toString();
        String previous = YearMonth.now().minusMonths(1).toString();

        when(summaryUseCase.getSummary(userId, current))
                .thenReturn(summary(current, "3500", "2150", 10));
        when(summaryUseCase.getSummary(userId, previous))
                .thenReturn(summary(previous, "0", "0", 0)); // sin actividad

        MonthComparisonDto dto = useCase.getComparison(userId);

        assertThat(dto.expensesVariationPercent()).isNull();
        assertThat(dto.previousMonth()).isNull();
    }

    @Test
    @DisplayName("US-1004: variación negativa al gastar menos este mes")
    void shouldReturnNegativeVariationWhenSpendingLess() {
        String current  = YearMonth.now().toString();
        String previous = YearMonth.now().minusMonths(1).toString();

        when(summaryUseCase.getSummary(userId, current))
                .thenReturn(summary(current, "3500", "1500", 30));
        when(summaryUseCase.getSummary(userId, previous))
                .thenReturn(summary(previous, "3500", "2000", 35));

        MonthComparisonDto dto = useCase.getComparison(userId);

        assertThat(dto.expensesVariationPercent()).isNotNull().isNegative();
    }
}
