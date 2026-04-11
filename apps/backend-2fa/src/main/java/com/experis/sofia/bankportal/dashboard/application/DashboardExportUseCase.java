package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.*;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Caso de uso — Exportación del dashboard a PDF y Excel.
 * US-1107 / US-1108 FEAT-011 Sprint 13.
 * Reutiliza los use cases de Sprint 12 — sin duplicación de lógica.
 *
 * @author SOFIA Developer Agent
 */
@Service
@RequiredArgsConstructor
public class DashboardExportUseCase {

    private final DashboardSummaryUseCase     summaryUseCase;
    private final SpendingCategoryService     categoryService;
    private final MonthlyEvolutionUseCase     evolutionUseCase;
    private final DashboardRepositoryPort     repo;
    private final PdfReportGenerator         pdfGenerator;
    private final ExcelReportGenerator       excelGenerator;

    /** Genera el PDF del dashboard para el período indicado (YYYY-MM). */
    public byte[] generatePdf(UUID userId, String period) {
        DashboardSummaryDto        summary   = summaryUseCase.getSummary(userId, period);
        List<SpendingCategoryDto>  cats      = categoryService.getCategories(userId, period);
        List<TopMerchantDto>       merchants = repo.findTopMerchants(userId, period, 5);
        return pdfGenerator.generate(period, summary, cats, merchants);
    }

    /** Genera el Excel del dashboard para el período indicado (YYYY-MM). */
    public byte[] generateExcel(UUID userId, String period) {
        DashboardSummaryDto        summary   = summaryUseCase.getSummary(userId, period);
        List<SpendingCategoryDto>  cats      = categoryService.getCategories(userId, period);
        List<MonthlyEvolutionDto>  evolution = evolutionUseCase.getEvolution(userId, 6);
        return excelGenerator.generate(period, summary, cats, evolution);
    }
}
