package com.experis.sofia.bankportal.audit.api;

import com.experis.sofia.bankportal.audit.application.ExportSecurityHistoryUseCase;
import com.experis.sofia.bankportal.audit.application.SecurityDashboardUseCase;
import com.experis.sofia.bankportal.audit.application.SecurityPreferencesUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller REST para el Panel de Auditoría de Seguridad (FEAT-005).
 *
 * Sprint 7 añade:
 * - GET /api/v1/security/preferences (US-403)
 * - PUT /api/v1/security/preferences (US-403)
 * - GET /api/v1/security/config-history (US-604)
 * - Extrae twoFaActive del claim JWT {@code twoFaEnabled} (ACT-30)
 *
 * @author SOFIA Developer Agent — FEAT-005 Sprint 6 · Sprint 7
 */
@RestController
@RequestMapping("/api/v1/security")
@RequiredArgsConstructor
public class SecurityAuditController {

    private final SecurityDashboardUseCase    dashboardUseCase;
    private final ExportSecurityHistoryUseCase exportUseCase;
    private final SecurityPreferencesUseCase  preferencesUseCase;

    /**
     * US-401 — Dashboard de seguridad.
     * ACT-30: claim {@code twoFaEnabled} del JWT extraído explícitamente.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<SecurityDashboardUseCase.SecurityDashboardResponse> getDashboard(
            @AuthenticationPrincipal Jwt jwt) {

        UUID    userId      = UUID.fromString(jwt.getSubject());
        // ACT-30: claim twoFaEnabled documentado en OpenAPI securitySchemes
        boolean twoFaActive = Boolean.TRUE.equals(jwt.getClaim("twoFaEnabled"));
        return ResponseEntity.ok(dashboardUseCase.execute(userId, twoFaActive));
    }

    /**
     * US-402 — Exportar historial en PDF o CSV.
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportHistory(
            @RequestParam(defaultValue = "pdf") String format,
            @RequestParam(defaultValue = "30")  int days,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());

        if (!format.equalsIgnoreCase("pdf") && !format.equalsIgnoreCase("csv")) {
            return ResponseEntity.badRequest().build();
        }
        if (days != 30 && days != 60 && days != 90) days = 30;

        var result = exportUseCase.execute(userId, format, days);
        if (result.isEmpty()) return ResponseEntity.noContent().build();

        var export = result.get();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(export.mediaType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + export.filename() + "\"")
                .header("X-Content-SHA256", export.sha256Hash())
                .body(export.content());
    }

    /**
     * US-403 — Obtener preferencias de seguridad unificadas.
     */
    @GetMapping("/preferences")
    public ResponseEntity<SecurityPreferencesUseCase.SecurityPreferencesResponse> getPreferences(
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(preferencesUseCase.getPreferences(userId));
    }

    /**
     * US-403 — Actualizar preferencias de seguridad.
     * Las preferencias de notificaciones solo afectan la visibilidad — audit_log siempre activo (R-F5-003).
     */
    @PutMapping("/preferences")
    public ResponseEntity<Void> updatePreferences(
            @RequestBody SecurityPreferencesUseCase.UpdateSecurityPreferencesRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        preferencesUseCase.updatePreferences(userId, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * US-604 — Historial de cambios de configuración de seguridad.
     */
    @GetMapping("/config-history")
    public ResponseEntity<List<SecurityDashboardUseCase.AuditEventSummary>> getConfigHistory(
            @RequestParam(defaultValue = "90") int days,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(dashboardUseCase.getConfigHistory(userId, days));
    }
}
