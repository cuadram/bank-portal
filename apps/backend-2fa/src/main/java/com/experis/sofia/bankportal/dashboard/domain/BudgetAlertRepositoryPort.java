package com.experis.sofia.bankportal.dashboard.domain;

import com.experis.sofia.bankportal.dashboard.application.dto.BudgetAlertDto;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface BudgetAlertRepositoryPort {
    void saveAlert(UUID userId, String period, BigDecimal monthlyBudget, int thresholdPct, BigDecimal currentAmount);
    List<BudgetAlertDto> findRecentAlerts(UUID userId, String currentPeriod);
    void markNotified(UUID userId, String period);
    boolean existsForPeriod(UUID userId, String period);
}
