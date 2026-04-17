package com.experis.sofia.bankportal.pfm.api.controller;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import com.experis.sofia.bankportal.pfm.application.dto.PfmDtos.*;
import com.experis.sofia.bankportal.pfm.application.usecase.*;
import com.experis.sofia.bankportal.pfm.domain.service.BudgetService;
import com.experis.sofia.bankportal.pfm.domain.service.UserRuleService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.UUID;

/**
 * REST Controller — Módulo PFM Mi Dinero.
 * Base: /api/v1/pfm · Auth: Bearer JWT (userId desde request attribute).
 * RN-F023-16: navegación Angular usa Router.navigateByUrl() — no href (LA-023-01).
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Slf4j
@Validated
@RestController
@RequestMapping("/api/v1/pfm")
@RequiredArgsConstructor
public class PfmController {

    private final GetPfmOverviewUseCase      overviewUseCase;
    private final BudgetService              budgetService;
    private final UserRuleService            userRuleService;
    private final GetPfmAnalysisUseCase      analysisUseCase;
    private final GetPfmDistributionUseCase  distributionUseCase;
    private final GetPfmWidgetUseCase        widgetUseCase;

    // ── Helper ─────────────────────────────────────────────────────────────────
    private UUID userId(HttpServletRequest req) {
        return (UUID) req.getAttribute("authenticatedUserId");
    }

    private YearMonth resolveMonth(String monthParam) {
        if (monthParam == null || monthParam.isBlank()) return YearMonth.now();
        try { return YearMonth.parse(monthParam); }
        catch (DateTimeParseException e) { return YearMonth.now(); }
    }

    // ── US-F023-01/02/03 — Overview: movimientos + presupuestos ───────────────
    @GetMapping("/overview")
    public ResponseEntity<PfmOverviewResponse> getOverview(
            @RequestParam(required = false) String month,
            HttpServletRequest req) {
        return ResponseEntity.ok(overviewUseCase.execute(userId(req), resolveMonth(month)));
    }

    // ── US-F023-02 — Presupuestos ──────────────────────────────────────────────
    @GetMapping("/budgets")
    public ResponseEntity<?> getBudgets(HttpServletRequest req) {
        var budgets = budgetService.getBudgets(userId(req));
        var dtos = budgets.stream().map(b -> {
            var spent = budgetService.getSpent(userId(req), b.getCategory(), YearMonth.now());
            return new BudgetDto(b.getId(), b.getCategory().name(), b.getAmountLimit(),
                spent, b.percentConsumed(spent), b.status(spent), b.getThresholdPercent());
        }).toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/budgets")
    public ResponseEntity<BudgetDto> createBudget(
            @Valid @RequestBody BudgetCreateRequest req,
            HttpServletRequest httpReq) {
        validateBudgetRequest(req);
        SpendingCategory category = SpendingCategory.valueOf(req.categoryCode());
        var budget = budgetService.createBudget(
            userId(httpReq), category,
            req.amountLimit(), req.thresholdPercent());
        return ResponseEntity.status(201).body(
            new BudgetDto(budget.getId(), budget.getCategory().name(),
                budget.getAmountLimit(), BigDecimal.ZERO, 0,
                com.experis.sofia.bankportal.pfm.domain.model.Budget.Status.GREEN,
                budget.getThresholdPercent()));
    }

    @DeleteMapping("/budgets/{id}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable UUID id, HttpServletRequest req) {
        budgetService.deleteBudget(id, userId(req));
        return ResponseEntity.noContent().build();
    }

    // ── US-F023-04 — Análisis comparativo ────────────────────────────────────
    @GetMapping("/analysis")
    public ResponseEntity<PfmAnalysisResponse> getAnalysis(
            @RequestParam(required = false) String month,
            HttpServletRequest req) {
        return ResponseEntity.ok(analysisUseCase.execute(userId(req), resolveMonth(month)));
    }

    // ── US-F023-07 — Distribución + top comercios ────────────────────────────
    @GetMapping("/distribution")
    public ResponseEntity<PfmDistributionResponse> getDistribution(
            @RequestParam(required = false) String month,
            HttpServletRequest req) {
        return ResponseEntity.ok(distributionUseCase.execute(userId(req), resolveMonth(month)));
    }

    // ── US-F023-06 — Override categoría ──────────────────────────────────────
    @PutMapping("/movimientos/{txId}/category")
    public ResponseEntity<?> overrideCategory(
            @PathVariable UUID txId,
            @Valid @RequestBody CategoryOverrideRequest req,
            HttpServletRequest httpReq) {
        SpendingCategory category;
        try { category = SpendingCategory.valueOf(req.categoryCode()); }
        catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Categoría no válida: " + req.categoryCode());
        }
        // RN-F023-19: NOMINA y TRANSFERENCIAS no son recategorizables
        if (category.isIngreso()) {
            return ResponseEntity.badRequest()
                .body("Los ingresos no pueden recategorizarse como gasto");
        }
        // Obtener concepto del movimiento (campo concept de transactions)
        // El concepto se usa como conceptPattern de la regla de usuario
        String conceptPattern = (req.concept() != null && !req.concept().isBlank())
                ? req.concept().trim().toUpperCase()
                : txId.toString();
        var rule = userRuleService.createRule(userId(httpReq), conceptPattern, category);
        return ResponseEntity.ok(java.util.Map.of(
            "txId", txId,
            "newCategory", category.name(),
            "ruleSaved", true,
            "ruleId", rule.getId()
        ));
    }

    // ── US-F023-05 — Widget dashboard ────────────────────────────────────────
    @GetMapping("/widget")
    public ResponseEntity<PfmWidgetResponse> getWidget(HttpServletRequest req) {
        try {
            return ResponseEntity.ok(widgetUseCase.execute(userId(req)));
        } catch (Exception e) {
            // RN-F023-15: degradación elegante — widget falla sin romper dashboard
            log.warn("[PFM-WIDGET] Degradacion elegante activada: {}", e.getMessage());
            return ResponseEntity.ok(
                new PfmWidgetResponse(BigDecimal.ZERO, java.util.List.of(), "GREEN"));
        }
    }

    // ── Validaciones ──────────────────────────────────────────────────────────
    private void validateBudgetRequest(BudgetCreateRequest req) {
        if (req.amountLimit() == null || req.amountLimit().compareTo(BigDecimal.ZERO) <= 0
                || req.amountLimit().compareTo(new BigDecimal("99999.99")) > 0)
            throw new IllegalArgumentException("Importe debe estar entre 0.01 y 99.999,99 EUR");
        if (req.thresholdPercent() == null
                || req.thresholdPercent() < 50 || req.thresholdPercent() > 95
                || req.thresholdPercent() % 5 != 0)
            throw new IllegalArgumentException("Umbral debe estar entre 50% y 95% en pasos de 5%");
        try { SpendingCategory.valueOf(req.categoryCode()); }
        catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Categoría no válida: " + req.categoryCode());
        }
    }
}
