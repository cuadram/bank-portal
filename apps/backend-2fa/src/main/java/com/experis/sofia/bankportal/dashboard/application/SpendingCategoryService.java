package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.SpendingCategoryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.TopMerchantDto;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort.RawSpendingRecord;
import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Caso de uso — Gastos por categoría y top comercios.
 * ADR-019: on-demand con caché materializada en spending_categories.
 * US-1002 FEAT-010 Sprint 12.
 *
 * @author SOFIA Developer Agent
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SpendingCategoryService {

    private final DashboardRepositoryPort repo;
    private final SpendingCategorizationEngine engine;

    public List<SpendingCategoryDto> getCategories(UUID userId, String period) {
        // Caché hit
        List<SpendingCategoryDto> cached = repo.findCachedCategories(userId, period);
        if (!cached.isEmpty()) return cached;

        // Caché miss — calcular desde raw data
        List<RawSpendingRecord> raw = repo.findRawSpendings(userId, period);
        if (raw.isEmpty()) return Collections.emptyList();

        // Agrupar por categoría
        Map<SpendingCategory, BigDecimal> totals = new EnumMap<>(SpendingCategory.class);
        Map<SpendingCategory, Integer> counts   = new EnumMap<>(SpendingCategory.class);

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
                                          .divide(total, 1, RoundingMode.HALF_UP)
                                          .doubleValue()
                            : 0.0;
                    return new SpendingCategoryDto(
                            e.getKey().name(), e.getValue(), pct,
                            counts.getOrDefault(e.getKey(), 0));
                })
                .sorted(Comparator.comparing(SpendingCategoryDto::amount).reversed()) // RV-010: BigDecimal usa Comparable, no comparingDouble
                .collect(Collectors.toList());

        // Persistir caché
        repo.upsertSpendingCategories(userId, period, result);
        return result;
    }

    public List<TopMerchantDto> getTopMerchants(UUID userId, String period, int limit) {
        return repo.findTopMerchants(userId, period, limit);
    }
}
