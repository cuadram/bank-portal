package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.DashboardSummaryDto;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardSummaryUseCase {

    private final DashboardRepositoryPort repo;

    public DashboardSummaryDto getSummary(UUID userId, String period) {
        BigDecimal income   = repo.sumIncome(userId, period);
        BigDecimal expenses = repo.sumExpenses(userId, period);
        int count           = repo.countTransactions(userId, period);
        return new DashboardSummaryDto(period, income, expenses, income.subtract(expenses), count);
    }

    public static String resolvePeriod(String param) {
        return switch (param) {
            case "current_month"  -> YearMonth.now().toString();
            case "previous_month" -> YearMonth.now().minusMonths(1).toString();
            default -> {
                if (!param.matches("\\d{4}-\\d{2}"))
                    throw new IllegalArgumentException(
                        "Periodo invalido: '" + param + "' — usar YYYY-MM, current_month o previous_month");
                yield param;
            }
        };
    }
}
