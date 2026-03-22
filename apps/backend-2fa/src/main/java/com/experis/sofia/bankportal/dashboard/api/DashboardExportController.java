package com.experis.sofia.bankportal.dashboard.api;

import com.experis.sofia.bankportal.dashboard.application.DashboardExportUseCase;
import com.experis.sofia.bankportal.dashboard.application.DashboardSummaryUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller — Exportación del Dashboard Analítico.
 * US-1107 (PDF) / US-1108 (Excel) — FEAT-011 Sprint 13
 *
 * Endpoints:
 *   GET /api/v1/dashboard/export/pdf   → descarga PDF del dashboard
 *   GET /api/v1/dashboard/export/excel → descarga Excel del dashboard
 *
 * @author SOFIA Developer Agent
 */
@RestController
@RequestMapping("/api/v1/dashboard/export")
@RequiredArgsConstructor
public class DashboardExportController {

    private final DashboardExportUseCase exportUseCase;

    /**
     * GET /api/v1/dashboard/export/pdf?period=current_month
     * US-1107 — Exporta el dashboard del período a PDF (application/pdf).
     */
    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(defaultValue = "current_month") String period,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        String resolved = DashboardSummaryUseCase.resolvePeriod(period);
        byte[] pdf = exportUseCase.generatePdf(userId, resolved);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"dashboard-" + resolved + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    /**
     * GET /api/v1/dashboard/export/excel?period=current_month
     * US-1108 — Exporta el dashboard del período a Excel (.xlsx).
     */
    @GetMapping("/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(defaultValue = "current_month") String period,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        String resolved = DashboardSummaryUseCase.resolvePeriod(period);
        byte[] xlsx = exportUseCase.generateExcel(userId, resolved);

        String contentType =
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"dashboard-" + resolved + ".xlsx\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(xlsx);
    }
}
