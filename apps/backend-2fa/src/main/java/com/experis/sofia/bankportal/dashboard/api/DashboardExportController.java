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

@RestController
@RequestMapping("/api/v1/dashboard/export")
@RequiredArgsConstructor
public class DashboardExportController {

    private final DashboardExportUseCase exportUseCase;

    private UUID userId(HttpServletRequest req) { return (UUID) req.getAttribute("authenticatedUserId"); }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(@RequestParam(defaultValue="current_month") String period, HttpServletRequest req) {
        String r = DashboardSummaryUseCase.resolvePeriod(period);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\"dashboard-"+r+".pdf\"")
                .contentType(MediaType.APPLICATION_PDF).body(exportUseCase.generatePdf(userId(req), r));
    }

    @GetMapping("/excel")
    public ResponseEntity<byte[]> exportExcel(@RequestParam(defaultValue="current_month") String period, HttpServletRequest req) {
        String r = DashboardSummaryUseCase.resolvePeriod(period);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\"dashboard-"+r+".xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(exportUseCase.generateExcel(userId(req), r));
    }
}
