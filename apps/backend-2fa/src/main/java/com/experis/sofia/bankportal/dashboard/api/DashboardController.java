package com.experis.sofia.bankportal.dashboard.api;

import com.experis.sofia.bankportal.dashboard.application.BudgetAlertService;
import com.experis.sofia.bankportal.dashboard.application.DashboardSummaryUseCase;
import com.experis.sofia.bankportal.dashboard.application.MonthComparisonUseCase;
import com.experis.sofia.bankportal.dashboard.application.MonthlyEvolutionUseCase;
import com.experis.sofia.bankportal.dashboard.application.SpendingCategoryService;
import com.experis.sofia.bankportal.dashboard.application.dto.BudgetAlertDto;
import com.experis.sofia.bankportal.dashboard.application.dto.DashboardSummaryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.MonthComparisonDto;
import com.experis.sofia.bankportal.dashboard.application.dto.MonthlyEvolutionDto;
import com.experis.sofia.bankportal.dashboard.application.dto.SpendingCategoryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.TopMerchantDto;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller — Dashboard Analítico de Gastos y Movimientos.
 * US-1001/1002/1003/1004/1005 — FEAT-010 Sprint 12
 *
 * Endpoints:
 *   GET /api/v1/dashboard/summary          → resumen financiero mensual
 *   GET /api/v1/dashboard/categories       → gastos por categoría
 *   GET /api/v1/dashboard/top-merchants    → top emisores/comercios
 *   GET /api/v1/dashboard/evolution        → serie temporal N meses
 *   GET /api/v1/dashboard/comparison       → comparativa mes vs anterior
 *   GET /api/v1/dashboard/alerts           → alertas de presupuesto activas
 *
 * @author SOFIA Developer Agent
 */
@Validated
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardSummaryUseCase    summaryUseCase;
    private final SpendingCategoryService    categoryService;
    private final MonthlyEvolutionUseCase    evolutionUseCase;
    private final MonthComparisonUseCase     comparisonUseCase;
    private final BudgetAlertService         alertService;

    /**
     * GET /api/v1/dashboard/summary?period={current_month|previous_month|YYYY-MM}
     * US-1001 — Resumen financiero del período.
     */
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> getSummary(
            @RequestParam(defaultValue = "current_month") String period,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                summaryUseCase.getSummary(userId, DashboardSummaryUseCase.resolvePeriod(period)));
    }

    /**
     * GET /api/v1/dashboard/categories?period=
     * US-1002 — Gastos agrupados por categoría con ADR-019 caché.
     */
    @GetMapping("/categories")
    public ResponseEntity<List<SpendingCategoryDto>> getCategories(
            @RequestParam(defaultValue = "current_month") String period,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                categoryService.getCategories(userId, DashboardSummaryUseCase.resolvePeriod(period)));
    }

    /**
     * GET /api/v1/dashboard/top-merchants?period=&limit=5
     * US-1002 — Top N emisores/comercios por importe.
     */
    @GetMapping("/top-merchants")
    public ResponseEntity<List<TopMerchantDto>> getTopMerchants(
            @RequestParam(defaultValue = "current_month") String period,
            @RequestParam(defaultValue = "5") @Min(1) @Max(20) int limit,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(
                categoryService.getTopMerchants(userId,
                        DashboardSummaryUseCase.resolvePeriod(period), limit));
    }

    /**
     * GET /api/v1/dashboard/evolution?months=6
     * US-1003 — Serie temporal últimos N meses (siempre N elementos).
     */
    @GetMapping("/evolution")
    public ResponseEntity<List<MonthlyEvolutionDto>> getEvolution(
            @RequestParam(defaultValue = "6") @Min(1) @Max(24) int months,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(evolutionUseCase.getEvolution(userId, months));
    }

    /**
     * GET /api/v1/dashboard/comparison
     * US-1004 — Comparativa mes actual vs anterior con variación %.
     */
    @GetMapping("/comparison")
    public ResponseEntity<MonthComparisonDto> getComparison(
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(comparisonUseCase.getComparison(userId));
    }

    /**
     * GET /api/v1/dashboard/alerts
     * US-1005 — Alertas de presupuesto activas (últimos 3 meses).
     */
    @GetMapping("/alerts")
    public ResponseEntity<List<BudgetAlertDto>> getAlerts(
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(alertService.getActiveAlerts(userId));
    }
}
