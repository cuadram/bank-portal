package com.experis.sofia.bankportal.dashboard.api;

import com.experis.sofia.bankportal.dashboard.application.DashboardExportUseCase;
import com.experis.sofia.bankportal.dashboard.application.DashboardSummaryUseCase;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller — Exportación del Dashboard Analítico.
 * US-1107 (PDF) / US-1108 (Excel) — FEAT-011 Sprint 13
 *
 * userId extraído de request.getAttribute("authenticatedUserId")
 * inyectado por JwtAuthenticationFilter (HMAC HS256 — ADR-001).
 *
 * @author SOFIA Developer Agent
 */
@RestController
@RequestMapping("/api/v1/dashboard/export")
@RequiredArgsConstructor
public class DashboardExportController {

    private final DashboardExportUseCase exportUseCase;

    private UUID userId(HttpServletRequest req) {
        return (UUID) req.getAttribute("authenticatedUserId");
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(defaultValue = "current_month") String period,
            HttpServletRequest req) {

        String resolved = DashboardSummaryUseCase.resolvePeriod(period);
        byte[] pdf = exportUseCase.generatePdf(userId(req), resolved);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"dashboard-" + resolved + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(defaultValue = "current_month") String period,
            HttpServletRequest req) {

        String resolved = DashboardSummaryUseCase.resolvePeriod(period);
        byte[] xlsx = exportUseCase.generateExcel(userId(req), resolved);

        String contentType =
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"dashboard-" + resolved + ".xlsx\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(xlsx);
    }
}
