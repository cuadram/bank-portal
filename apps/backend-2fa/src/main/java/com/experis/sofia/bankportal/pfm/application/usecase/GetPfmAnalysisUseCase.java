package com.experis.sofia.bankportal.pfm.application.usecase;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import com.experis.sofia.bankportal.pfm.application.dto.PfmDtos.*;
import com.experis.sofia.bankportal.pfm.domain.repository.PfmTransactionReadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Análisis mensual comparativo mes actual vs anterior.
 * RN-F023-12: historial 12 meses.
 * RN-F023-13: solo categorías con ≥1 CARGO.
 * RN-F023-14: importes 2 decimales, tabular-nums (frontend).
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Service
@RequiredArgsConstructor
public class GetPfmAnalysisUseCase {

    private final PfmTransactionReadRepository txRepo;

    public PfmAnalysisResponse execute(UUID userId, YearMonth mes) {
        YearMonth mesAnterior = mes.minusMonths(1);

        List<CategoryAnalysisDto> categorias = Arrays.stream(SpendingCategory.values())
            .filter(cat -> !cat.isIngreso())
            .map(cat -> {
                BigDecimal actual   = txRepo.sumCargosByCategory(userId, mes,        cat.name());
                BigDecimal anterior = txRepo.sumCargosByCategory(userId, mesAnterior, cat.name());
                return new CategoryAnalysisDto(cat.name(), actual, anterior,
                    variacion(actual, anterior));
            })
            .filter(dto -> dto.totalMesActual().compareTo(BigDecimal.ZERO) > 0
                        || dto.totalMesAnterior().compareTo(BigDecimal.ZERO) > 0)
            .toList();

        BigDecimal totalActual   = categorias.stream().map(CategoryAnalysisDto::totalMesActual)
                                             .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAnterior = categorias.stream().map(CategoryAnalysisDto::totalMesAnterior)
                                             .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new PfmAnalysisResponse(
            mes.toString(), mesAnterior.toString(),
            totalActual.setScale(2, RoundingMode.HALF_EVEN),
            totalAnterior.setScale(2, RoundingMode.HALF_EVEN),
            variacion(totalActual, totalAnterior),
            categorias
        );
    }

    private double variacion(BigDecimal actual, BigDecimal anterior) {
        if (anterior.compareTo(BigDecimal.ZERO) == 0) return actual.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        return actual.subtract(anterior)
                     .multiply(BigDecimal.valueOf(100))
                     .divide(anterior, 1, RoundingMode.HALF_EVEN)
                     .doubleValue();
    }
}
