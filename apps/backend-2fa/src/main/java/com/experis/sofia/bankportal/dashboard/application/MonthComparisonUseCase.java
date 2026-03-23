package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.MonthComparisonDto;
import com.experis.sofia.bankportal.dashboard.application.dto.DashboardSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MonthComparisonUseCase {

    private final DashboardSummaryUseCase summaryUseCase;

    public MonthComparisonDto getComparison(UUID userId) {
        String cur = YearMonth.now().toString();
        String prv = YearMonth.now().minusMonths(1).toString();
        DashboardSummaryDto c = summaryUseCase.getSummary(userId, cur);
        DashboardSummaryDto p = summaryUseCase.getSummary(userId, prv);
        boolean hasPrev = p.transactionCount() > 0;
        return new MonthComparisonDto(
            new MonthComparisonDto.PeriodData(cur, c.totalIncome(), c.totalExpenses()),
            hasPrev ? new MonthComparisonDto.PeriodData(prv, p.totalIncome(), p.totalExpenses()) : null,
            hasPrev ? variation(c.totalExpenses(), p.totalExpenses()) : null,
            hasPrev ? variation(c.totalIncome(),   p.totalIncome())   : null
        );
    }

    private Double variation(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) return null;
        return current.subtract(previous).multiply(BigDecimal.valueOf(100))
                .divide(previous, 1, RoundingMode.HALF_UP).doubleValue();
    }
}
