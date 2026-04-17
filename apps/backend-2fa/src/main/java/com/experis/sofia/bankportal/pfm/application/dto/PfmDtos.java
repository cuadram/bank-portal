package com.experis.sofia.bankportal.pfm.application.dto;

import com.experis.sofia.bankportal.pfm.domain.model.Budget.Status;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTOs del módulo PFM agrupados en un fichero para compactar el árbol.
 * FEAT-023 Sprint 25 · ADR-037.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
public final class PfmDtos {

    private PfmDtos() {}

    // ── Request ───────────────────────────────────────────────────────────────

    public record BudgetCreateRequest(
        String categoryCode,     // PfmCategory.name()
        BigDecimal amountLimit,  // > 0 ≤ 99999.99
        Integer thresholdPercent // 50-95 step 5
    ) {}

    public record CategoryOverrideRequest(
        String categoryCode,     // SpendingCategory.name()
        String concept           // Concepto del movimiento — usado como conceptPattern en pfm_user_rules (RV-M01)
    ) {}

    // ── Response ──────────────────────────────────────────────────────────────

    public record MovimientoCategoriadoDto(
        UUID txId,
        String concept,
        BigDecimal amount,
        String categoryCode,
        String categoryLabel,
        boolean isIngreso       // NOMINA o TRANSFERENCIAS
    ) {}

    public record BudgetDto(
        UUID id,
        String categoryCode,
        BigDecimal amountLimit,
        BigDecimal spent,
        int percentConsumed,
        Status status,
        int thresholdPercent
    ) {}

    public record PfmOverviewResponse(
        BigDecimal totalGastoMes,
        BigDecimal totalIngresoMes,
        List<MovimientoCategoriadoDto> movimientos,
        List<BudgetDto> budgets
    ) {}

    public record CategoryAnalysisDto(
        String categoryCode,
        BigDecimal totalMesActual,
        BigDecimal totalMesAnterior,
        double variacionPct     // positivo = aumento, negativo = reducción
    ) {}

    public record PfmAnalysisResponse(
        String mes,             // YYYY-MM mes actual
        String mesAnterior,     // YYYY-MM mes anterior
        BigDecimal totalActual,
        BigDecimal totalAnterior,
        double variacionGlobalPct,
        List<CategoryAnalysisDto> categorias
    ) {}

    public record TopComercioDto(
        String nombre,
        BigDecimal totalImporte,
        int numTransacciones
    ) {}

    public record DistribucionCategoriaDto(
        String categoryCode,
        BigDecimal totalImporte,
        double porcentaje        // sobre total CARGOs excl. NOMINA+TRANSFERENCIAS
    ) {}

    public record PfmDistributionResponse(
        String mes,
        List<DistribucionCategoriaDto> distribucion,
        List<TopComercioDto> topComercios
    ) {}

    public record PfmWidgetResponse(
        BigDecimal gastoTotalMes,
        List<TopCategoria> topCategorias,   // top 3
        String semaforo                     // GREEN / ORANGE / RED
    ) {
        public record TopCategoria(String categoryCode, BigDecimal importe) {}
    }
}
