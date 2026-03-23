package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.*;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

/**
 * RV-015 (Sprint 14): @Transactional(readOnly=true) en ambos métodos —
 * garantiza snapshot consistente bajo carga concurrente.
 */
@Service
@RequiredArgsConstructor
public class DashboardExportUseCase {

    private final DashboardSummaryUseCase    summaryUseCase;
    private final SpendingCategoryService    categoryService;
    private final MonthlyEvolutionUseCase    evolutionUseCase;
    private final DashboardRepositoryPort    repo;
    private final PdfReportGenerator        pdfGenerator;
    private final ExcelReportGenerator      excelGenerator;

    @Transactional(readOnly = true)
    public byte[] generatePdf(UUID userId, String period) {
        DashboardSummaryDto       summary   = summaryUseCase.getSummary(userId, period);
        List<SpendingCategoryDto> cats      = categoryService.getCategories(userId, period);
        List<TopMerchantDto>      merchants = repo.findTopMerchants(userId, period, 5);
        return pdfGenerator.generate(period, summary, cats, merchants);
    }

    @Transactional(readOnly = true)
    public byte[] generateExcel(UUID userId, String period) {
        DashboardSummaryDto       summary   = summaryUseCase.getSummary(userId, period);
        List<SpendingCategoryDto> cats      = categoryService.getCategories(userId, period);
        List<MonthlyEvolutionDto> evolution = evolutionUseCase.getEvolution(userId, 6);
        return excelGenerator.generate(period, summary, cats, evolution);
    }
}
