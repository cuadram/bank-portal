package com.experis.sofia.bankportal.export.controller;

import com.experis.sofia.bankportal.export.domain.ExportFormat;
import com.experis.sofia.bankportal.export.dto.ExportPreviewResponse;
import com.experis.sofia.bankportal.export.dto.ExportRequest;
import com.experis.sofia.bankportal.export.service.ExportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

/**
 * REST controller para exportación de movimientos.
 * FEAT-018 Sprint 20. PSD2 Art.47, GDPR Art.15.
 * HOTFIX-S20: paquete corregido; extrae userId de HttpServletRequest (no @AuthenticationPrincipal Jwt).
 */
@RestController
@RequestMapping("/api/v1/accounts/{accountId}/exports")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    /** POST /api/v1/accounts/{accountId}/exports/pdf */
    @PostMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable UUID accountId,
            @Valid @RequestBody ExportRequest request,
            HttpServletRequest httpRequest) {

        request.setFormato(ExportFormat.PDF);
        byte[] content = exportService.export(
                accountId, request,
                extractUserId(httpRequest),
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader(HttpHeaders.USER_AGENT));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + buildFilename(accountId, "pdf") + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(content);
    }

    /** POST /api/v1/accounts/{accountId}/exports/csv */
    @PostMapping("/csv")
    public ResponseEntity<byte[]> exportCsv(
            @PathVariable UUID accountId,
            @Valid @RequestBody ExportRequest request,
            HttpServletRequest httpRequest) {

        request.setFormato(ExportFormat.CSV);
        byte[] content = exportService.export(
                accountId, request,
                extractUserId(httpRequest),
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader(HttpHeaders.USER_AGENT));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + buildFilename(accountId, "csv") + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(content);
    }

    /** GET /api/v1/accounts/{accountId}/exports/preview */
    @GetMapping("/preview")
    public ResponseEntity<ExportPreviewResponse> preview(
            @PathVariable UUID accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(defaultValue = "TODOS") String tipoMovimiento) {

        long count = exportService.countExportable(accountId, fechaDesde, fechaHasta, tipoMovimiento);
        return ResponseEntity.ok(new ExportPreviewResponse(count, count > 500));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String buildFilename(UUID accountId, String ext) {
        String suffix = accountId.toString().replace("-", "").substring(24);
        return "movimientos_" + suffix + "_" + LocalDate.now() + "." + ext;
    }

    /**
     * Extrae el userId del atributo del request establecido por JwtAuthenticationFilter.
     * Evita @AuthenticationPrincipal Jwt que causa HTTP 403 (DEBT-022).
     */
    private String extractUserId(HttpServletRequest req) {
        Object uid = req.getAttribute("userId");
        return uid != null ? uid.toString() : "unknown";
    }
}
