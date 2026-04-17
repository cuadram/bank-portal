package com.experis.sofia.bankportal.pfm.application.usecase;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import com.experis.sofia.bankportal.pfm.application.dto.PfmDtos.*;
import com.experis.sofia.bankportal.pfm.domain.model.Budget;
import com.experis.sofia.bankportal.pfm.domain.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * Caso de uso — overview PFM: movimientos categorizados + presupuestos con consumo.
 * Evalúa alertas síncronamente tras categorización (RN-F023-11).
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Service
@RequiredArgsConstructor
public class GetPfmOverviewUseCase {

    private final PfmCategorizationService categorizationService;
    private final BudgetService            budgetService;
    private final PfmBudgetAlertService    alertService;
    private final com.experis.sofia.bankportal.pfm.domain.repository.PfmTransactionReadRepository txRepo;

    public PfmOverviewResponse execute(UUID userId, YearMonth month) {
        // 1. Movimientos categorizados
        var rawMovs = txRepo.findCargos(userId, month);
        var catMovs = categorizationService.categorizeAll(userId, rawMovs);

        List<MovimientoCategoriadoDto> movDtos = catMovs.stream().map(m ->
            new MovimientoCategoriadoDto(
                m.txId(), m.concept(), m.amount(),
                m.category().name(), label(m.category()),
                m.category().isIngreso()
            )
        ).toList();

        BigDecimal totalGasto = catMovs.stream()
            .filter(m -> !m.category().isIngreso())
            .map(PfmCategorizationService.MovimientoCategorizado::amount)
            .map(BigDecimal::abs)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalIngreso = catMovs.stream()
            .filter(m -> m.category().isIngreso())
            .map(PfmCategorizationService.MovimientoCategorizado::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Presupuestos con consumo + evaluación alertas
        List<Budget> budgets = budgetService.getBudgets(userId);
        List<BudgetDto> budgetDtos = budgets.stream().map(b -> {
            BigDecimal spent = budgetService.getSpent(userId, b.getCategory(), month);
            alertService.evaluateAndAlert(userId, b, spent);
            return new BudgetDto(
                b.getId(), b.getCategory().name(),
                b.getAmountLimit(), spent,
                b.percentConsumed(spent), b.status(spent),
                b.getThresholdPercent()
            );
        }).toList();

        return new PfmOverviewResponse(totalGasto, totalIngreso, movDtos, budgetDtos);
    }

    private String label(SpendingCategory cat) {
        return switch (cat) {
            case ALIMENTACION  -> "Alimentación";
            case TRANSPORTE    -> "Transporte";
            case SERVICIOS     -> "Servicios";
            case OCIO          -> "Ocio";
            case RESTAURANTES  -> "Restaurantes";
            case SALUD         -> "Salud";
            case HOGAR         -> "Hogar";
            case SUMINISTROS   -> "Suministros";
            case COMUNICACIONES -> "Comunicaciones";
            case EDUCACION     -> "Educación";
            case VIAJES        -> "Viajes";
            case SEGUROS       -> "Seguros";
            case NOMINA        -> "Nómina";
            case TRANSFERENCIAS -> "Transferencias";
            default            -> "Otros";
        };
    }
}
