package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.MonthlyEvolutionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Caso de uso — Evolución mensual últimos N meses.
 * Siempre devuelve exactamente N elementos (meses sin actividad = 0).
 * US-1003 FEAT-010 Sprint 12.
 *
 * @author SOFIA Developer Agent
 */
@Service
@RequiredArgsConstructor
public class MonthlyEvolutionUseCase {

    private final DashboardSummaryUseCase summaryUseCase;

    public List<MonthlyEvolutionDto> getEvolution(UUID userId, int months) {
        YearMonth current = YearMonth.now();
        List<MonthlyEvolutionDto> result = new ArrayList<>(months);

        for (int i = months - 1; i >= 0; i--) {
            YearMonth ym     = current.minusMonths(i);
            String period    = ym.toString();
            var summary      = summaryUseCase.getSummary(userId, period);
            result.add(new MonthlyEvolutionDto(
                    ym.getYear(), ym.getMonthValue(),
                    summary.totalIncome(), summary.totalExpenses(), summary.netBalance()));
        }
        return result;
    }
}
