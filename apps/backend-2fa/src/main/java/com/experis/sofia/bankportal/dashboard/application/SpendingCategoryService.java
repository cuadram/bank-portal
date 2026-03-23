package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.SpendingCategoryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.TopMerchantDto;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort.RawSpendingRecord;
import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpendingCategoryService {

    private final DashboardRepositoryPort      repo;
    private final SpendingCategorizationEngine engine;

    public List<SpendingCategoryDto> getCategories(UUID userId, String period) {
        List<SpendingCategoryDto> cached = repo.findCachedCategories(userId, period);
        if (!cached.isEmpty()) return cached;

        List<RawSpendingRecord> raw = repo.findRawSpendings(userId, period);
        if (raw.isEmpty()) return Collections.emptyList();

        Map<SpendingCategory, BigDecimal> totals = new EnumMap<>(SpendingCategory.class);
        Map<SpendingCategory, Integer>    counts  = new EnumMap<>(SpendingCategory.class);
        for (RawSpendingRecord r : raw) {
            SpendingCategory cat = engine.categorize(r.concept(), r.issuer());
            totals.merge(cat, r.amount(), BigDecimal::add);
            counts.merge(cat, 1, Integer::sum);
        }
        BigDecimal total = totals.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

        List<SpendingCategoryDto> result = totals.entrySet().stream()
            .map(e -> {
                double pct = total.compareTo(BigDecimal.ZERO) > 0
                    ? e.getValue().multiply(BigDecimal.valueOf(100))
                                  .divide(total, 1, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
                return new SpendingCategoryDto(e.getKey().name(), e.getValue(), pct,
                        counts.getOrDefault(e.getKey(), 0));
            })
            .sorted(Comparator.comparing(SpendingCategoryDto::amount).reversed())
            .collect(Collectors.toList());

        repo.upsertSpendingCategories(userId, period, result);
        return result;
    }

    public List<TopMerchantDto> getTopMerchants(UUID userId, String period, int limit) {
        return repo.findTopMerchants(userId, period, limit);
    }
}
