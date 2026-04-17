package com.experis.sofia.bankportal.pfm.application.usecase;

import com.experis.sofia.bankportal.pfm.application.dto.PfmDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * Widget dashboard — payload asíncrono.
 * RN-F023-15: degradación elegante si falla (manejado en controller con try-catch).
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Service
@RequiredArgsConstructor
public class GetPfmWidgetUseCase {

    private final GetPfmOverviewUseCase overviewUseCase;

    public PfmWidgetResponse execute(UUID userId) {
        var overview = overviewUseCase.execute(userId, YearMonth.now());

        // Top 3 categorías por importe
        List<PfmWidgetResponse.TopCategoria> top3 = overview.movimientos().stream()
            .filter(m -> !m.isIngreso())
            .collect(java.util.stream.Collectors.groupingBy(
                MovimientoCategoriadoDto::categoryCode,
                java.util.stream.Collectors.reducing(java.math.BigDecimal.ZERO,
                    m -> m.amount().abs(), java.math.BigDecimal::add)
            ))
            .entrySet().stream()
            .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
            .limit(3)
            .map(e -> new PfmWidgetResponse.TopCategoria(e.getKey(), e.getValue()))
            .toList();

        // Semáforo global: peor estado entre presupuestos
        String semaforo = overview.budgets().stream()
            .map(b -> b.status().name())
            .reduce("GREEN", (a, b) -> {
                if ("RED".equals(a) || "RED".equals(b)) return "RED";
                if ("ORANGE".equals(a) || "ORANGE".equals(b)) return "ORANGE";
                return "GREEN";
            });

        return new PfmWidgetResponse(overview.totalGastoMes(), top3, semaforo);
    }
}
