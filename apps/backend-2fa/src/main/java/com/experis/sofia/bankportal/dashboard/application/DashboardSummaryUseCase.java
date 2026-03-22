package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.DashboardSummaryDto;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;

/**
 * Caso de uso — Resumen financiero mensual.
 * US-1001 FEAT-010 Sprint 12.
 *
 * @author SOFIA Developer Agent
 */
@Service
@RequiredArgsConstructor
public class DashboardSummaryUseCase {

    private final DashboardRepositoryPort repo;

    public DashboardSummaryDto getSummary(UUID userId, String period) {
        BigDecimal income   = repo.sumIncome(userId, period);
        BigDecimal expenses = repo.sumExpenses(userId, period);
        int count           = repo.countTransactions(userId, period);
        BigDecimal net      = income.subtract(expenses);

        return new DashboardSummaryDto(period, income, expenses, net, count);
    }

    /**
     * Convierte el parámetro period al formato YYYY-MM.
     * Acepta: "current_month", "previous_month" o directamente "YYYY-MM".
     */
    public static String resolvePeriod(String param) {
        return switch (param) {
            case "current_month"  -> YearMonth.now().toString();
            case "previous_month" -> YearMonth.now().minusMonths(1).toString();
            default               -> param;
        };
    }
}
