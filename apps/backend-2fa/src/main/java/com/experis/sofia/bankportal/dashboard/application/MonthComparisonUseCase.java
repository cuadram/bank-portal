package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.DashboardSummaryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.MonthComparisonDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.UUID;

/**
 * Caso de uso — Comparativa mes actual vs anterior.
 * Variación % protegida contra división por cero → null si previous = 0.
 * US-1004 FEAT-010 Sprint 12.
 *
 * @author SOFIA Developer Agent
 */
@Service
@RequiredArgsConstructor
public class MonthComparisonUseCase {

    private final DashboardSummaryUseCase summaryUseCase;

    public MonthComparisonDto getComparison(UUID userId) {
        String currentPeriod  = YearMonth.now().toString();
        String previousPeriod = YearMonth.now().minusMonths(1).toString();

        DashboardSummaryDto current  = summaryUseCase.getSummary(userId, currentPeriod);
        DashboardSummaryDto previous = summaryUseCase.getSummary(userId, previousPeriod);

        // Si el mes anterior no tiene actividad, no hay comparativa significativa
        boolean hasPrevious = previous.transactionCount() > 0;

        Double expVariation = hasPrevious
                ? variation(current.totalExpenses(), previous.totalExpenses())
                : null;
        Double incVariation = hasPrevious
                ? variation(current.totalIncome(), previous.totalIncome())
                : null;

        return new MonthComparisonDto(
                new MonthComparisonDto.PeriodData(currentPeriod,
                        current.totalIncome(), current.totalExpenses()),
                hasPrevious ? new MonthComparisonDto.PeriodData(previousPeriod,
                        previous.totalIncome(), previous.totalExpenses()) : null,
                expVariation,
                incVariation
        );
    }

    /** ((current - previous) / previous) * 100, protegido contra previous = 0 */
    private Double variation(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) return null;
        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
