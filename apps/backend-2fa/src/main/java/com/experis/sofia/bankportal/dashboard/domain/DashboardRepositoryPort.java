package com.experis.sofia.bankportal.dashboard.domain;

import com.experis.sofia.bankportal.dashboard.application.dto.SpendingCategoryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.TopMerchantDto;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface DashboardRepositoryPort {
    BigDecimal sumIncome(UUID userId, String period);
    BigDecimal sumExpenses(UUID userId, String period);
    int countTransactions(UUID userId, String period);
    List<RawSpendingRecord> findRawSpendings(UUID userId, String period);
    List<TopMerchantDto> findTopMerchants(UUID userId, String period, int limit);
    List<SpendingCategoryDto> findCachedCategories(UUID userId, String period);
    void upsertSpendingCategories(UUID userId, String period, List<SpendingCategoryDto> categories);
    void deleteCachedCategories(UUID userId, String period);
    record RawSpendingRecord(String concept, String issuer, BigDecimal amount) {}
}
