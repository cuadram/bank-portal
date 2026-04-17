package com.experis.sofia.bankportal.pfm.application.usecase;

import com.experis.sofia.bankportal.pfm.application.dto.PfmDtos.*;
import com.experis.sofia.bankportal.pfm.domain.repository.PfmTransactionReadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * Distribución de gasto (donut) + top-10 comercios.
 * RN-F023-20: UNION transactions + bill_payments (DEBT-047 cerrado en ADR-039).
 * RN-F023-21: excluir transferencias y nóminas.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Service
@RequiredArgsConstructor
public class GetPfmDistributionUseCase {

    private final PfmTransactionReadRepository txRepo;
    private final GetPfmOverviewUseCase        overviewUseCase;

    public PfmDistributionResponse execute(UUID userId, YearMonth mes) {
        // Distribución por categoría desde el overview (usa caché de categorización)
        var overview = overviewUseCase.execute(userId, mes);
        BigDecimal total = overview.totalGastoMes();

        var distribucion = overview.movimientos().stream()
            .filter(m -> !m.isIngreso())
            .collect(java.util.stream.Collectors.groupingBy(
                MovimientoCategoriadoDto::categoryCode,
                java.util.stream.Collectors.reducing(BigDecimal.ZERO,
                    m -> m.amount().abs(), BigDecimal::add)
            ))
            .entrySet().stream()
            .map(e -> new DistribucionCategoriaDto(
                e.getKey(), e.getValue().setScale(2, RoundingMode.HALF_EVEN),
                total.compareTo(BigDecimal.ZERO) > 0
                    ? e.getValue().multiply(BigDecimal.valueOf(100))
                        .divide(total, 1, RoundingMode.HALF_EVEN).doubleValue()
                    : 0.0
            ))
            .sorted((a, b) -> b.totalImporte().compareTo(a.totalImporte()))
            .toList();

        // Top-10 comercios (DEBT-047 — UNION transactions + bill_payments)
        List<TopComercioDto> topComercios = txRepo.findTopComerciosUnificados(userId, mes, 10)
            .stream()
            .map(r -> new TopComercioDto(r.nombre(), r.totalImporte(), r.numTransacciones()))
            .toList();

        return new PfmDistributionResponse(mes.toString(), distribucion, topComercios);
    }
}
