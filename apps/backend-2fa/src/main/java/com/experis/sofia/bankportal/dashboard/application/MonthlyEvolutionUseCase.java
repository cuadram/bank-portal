package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.MonthlyEvolutionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MonthlyEvolutionUseCase {

    private final DashboardSummaryUseCase summaryUseCase;

    public List<MonthlyEvolutionDto> getEvolution(UUID userId, int months) {
        YearMonth current = YearMonth.now();
        List<MonthlyEvolutionDto> result = new ArrayList<>(months);
        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym = current.minusMonths(i);
            var s = summaryUseCase.getSummary(userId, ym.toString());
            result.add(new MonthlyEvolutionDto(ym.getYear(), ym.getMonthValue(),
                    s.totalIncome(), s.totalExpenses(), s.netBalance()));
        }
        return result;
    }
}
