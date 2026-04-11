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
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller — Dashboard Analítico de Gastos y Movimientos.
 * US-1001/1002/1003/1004/1005 — FEAT-010 Sprint 12
 *
 * userId extraído de request.getAttribute("authenticatedUserId")
 * inyectado por JwtAuthenticationFilter (HMAC HS256 — ADR-001).
 *
 * @author SOFIA Developer Agent
 */
@Validated
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardSummaryUseCase summaryUseCase;
    private final SpendingCategoryService categoryService;
    private final MonthlyEvolutionUseCase evolutionUseCase;
    private final MonthComparisonUseCase  comparisonUseCase;
    private final BudgetAlertService      alertService;

    private UUID userId(HttpServletRequest req) {
        return (UUID) req.getAttribute("authenticatedUserId");
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> getSummary(
            @RequestParam(defaultValue = "current_month") String period,
            HttpServletRequest req) {
        return ResponseEntity.ok(
                summaryUseCase.getSummary(userId(req),
                        DashboardSummaryUseCase.resolvePeriod(period)));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<SpendingCategoryDto>> getCategories(
            @RequestParam(defaultValue = "current_month") String period,
            HttpServletRequest req) {
        return ResponseEntity.ok(
                categoryService.getCategories(userId(req),
                        DashboardSummaryUseCase.resolvePeriod(period)));
    }

    @GetMapping("/top-merchants")
    public ResponseEntity<List<TopMerchantDto>> getTopMerchants(
            @RequestParam(defaultValue = "current_month") String period,
            @RequestParam(defaultValue = "5") @Min(1) @Max(20) int limit,
            HttpServletRequest req) {
        return ResponseEntity.ok(
                categoryService.getTopMerchants(userId(req),
                        DashboardSummaryUseCase.resolvePeriod(period), limit));
    }

    @GetMapping("/evolution")
    public ResponseEntity<List<MonthlyEvolutionDto>> getEvolution(
            @RequestParam(defaultValue = "6") @Min(1) @Max(24) int months,
            HttpServletRequest req) {
        return ResponseEntity.ok(evolutionUseCase.getEvolution(userId(req), months));
    }

    @GetMapping("/comparison")
    public ResponseEntity<MonthComparisonDto> getComparison(HttpServletRequest req) {
        return ResponseEntity.ok(comparisonUseCase.getComparison(userId(req)));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<BudgetAlertDto>> getAlerts(HttpServletRequest req) {
        return ResponseEntity.ok(alertService.getActiveAlerts(userId(req)));
    }
}
