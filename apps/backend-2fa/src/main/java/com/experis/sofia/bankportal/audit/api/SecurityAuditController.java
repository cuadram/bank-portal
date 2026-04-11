package com.experis.sofia.bankportal.audit.api;

import com.experis.sofia.bankportal.audit.application.ExportSecurityHistoryUseCase;
import com.experis.sofia.bankportal.audit.application.SecurityDashboardUseCase;
import com.experis.sofia.bankportal.audit.application.SecurityPreferencesUseCase;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller REST para el Panel de Auditoría de Seguridad (FEAT-005 + FEAT-006 US-604).
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET  /api/v1/security/dashboard        — US-401 KPIs + SecurityScore (ACT-30)</li>
 *   <li>GET  /api/v1/security/export           — US-402 exportación PDF/CSV (PCI-DSS req. 10.7)</li>
 *   <li>GET  /api/v1/security/preferences      — US-403 preferencias unificadas</li>
 *   <li>PUT  /api/v1/security/preferences      — US-403 actualizar preferencias (R-F5-003)</li>
 *   <li>GET  /api/v1/security/config-history   — US-604 historial cambios configuración</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-005 Sprint 6 · FEAT-006 Sprint 7
 */
@Profile("!staging")
@RestController
@RequestMapping("/api/v1/security")
@RequiredArgsConstructor
public class SecurityAuditController {

    private final SecurityDashboardUseCase     dashboardUseCase;
    private final ExportSecurityHistoryUseCase exportUseCase;
    private final SecurityPreferencesUseCase   preferencesUseCase;

    /**
     * US-401 — Dashboard de seguridad con KPIs de los últimos 30 días y SecurityScore.
     *
     * <p>ACT-30: el claim {@code twoFaEnabled} del JWT es extraído explícitamente y pasado
     * al caso de uso para el cálculo del SecurityScore — evita una query adicional a BD.
     *
     * @param jwt JWT de sesión completa ({@code scope=full-session}, claim {@code twoFaEnabled})
     * @return {@link SecurityDashboardUseCase.SecurityDashboardResponse} con KPIs y score
     */
    @GetMapping("/dashboard")
    public ResponseEntity<SecurityDashboardUseCase.SecurityDashboardResponse> getDashboard(
            HttpServletRequest request) {

        UUID    userId      = (UUID) request.getAttribute("authenticatedUserId");
        boolean twoFaActive = false;
        return ResponseEntity.ok(dashboardUseCase.execute(userId, twoFaActive));
    }

    /**
     * US-402 — Exportar historial de seguridad en PDF o CSV.
     *
     * <p>La respuesta incluye el header {@code X-Content-SHA256} con el hash de integridad
     * del contenido (PCI-DSS 4.0 req. 10.7). Retorna HTTP 204 si no hay eventos en el período.
     *
     * @param format formato del archivo: {@code pdf} (default) o {@code csv}
     * @param days   ventana temporal: 30, 60 o 90 días (default 30)
     * @param jwt    JWT de sesión completa
     * @return archivo binario con header {@code Content-Disposition} y {@code X-Content-SHA256},
     *         o HTTP 204 si no hay eventos
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportHistory(
            @RequestParam(defaultValue = "pdf") String format,
            @RequestParam(defaultValue = "30")  int days,
            HttpServletRequest request) {

        UUID userId = (UUID) request.getAttribute("authenticatedUserId");

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
     * US-403 — Obtener preferencias de seguridad unificadas del usuario autenticado.
     *
     * <p>Devuelve el estado 2FA, timeout de sesión, conteo de dispositivos de confianza
     * y mapa de preferencias de notificación por {@code SecurityEventType}.
     *
     * @param jwt JWT de sesión completa
     * @return {@link SecurityPreferencesUseCase.SecurityPreferencesResponse} con todas las preferencias
     */
    @GetMapping("/preferences")
    public ResponseEntity<SecurityPreferencesUseCase.SecurityPreferencesResponse> getPreferences(
            HttpServletRequest request) {

        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        return ResponseEntity.ok(preferencesUseCase.getPreferences(userId));
    }

    /**
     * US-403 — Actualizar preferencias de seguridad del usuario autenticado.
     *
     * <p><b>R-F5-003:</b> desactivar un tipo de notificación solo afecta la visibilidad en el
     * Centro de Notificaciones. El {@code audit_log} permanece siempre activo por cumplimiento
     * normativo (PCI-DSS 4.0 req. 10.2) — este invariante se aplica en la capa de dominio.
     *
     * @param request cuerpo con {@code sessionTimeoutMinutes} y/o {@code notificationsByType}
     * @param jwt     JWT de sesión completa
     * @return HTTP 204 No Content si la actualización fue exitosa
     */
    @PutMapping("/preferences")
    public ResponseEntity<Void> updatePreferences(
            @RequestBody SecurityPreferencesUseCase.UpdateSecurityPreferencesRequest body,
            HttpServletRequest httpRequest) {

        UUID userId = (UUID) httpRequest.getAttribute("authenticatedUserId");
        preferencesUseCase.updatePreferences(userId, body);
        return ResponseEntity.noContent().build();
    }

    /**
     * US-604 — Historial paginado de cambios de configuración de seguridad.
     *
     * <p>Filtra {@code audit_log} por {@code event_category = 'CONFIG_CHANGE'} usando
     * {@link SecurityDashboardUseCase#getConfigHistory}. No requiere tabla nueva en BD —
     * reutiliza {@code AuditLogQueryRepository} con un predicado adicional.
     *
     * <p>Tipos de evento incluidos: {@code 2FA_ACTIVATED}, {@code 2FA_DEACTIVATED},
     * {@code SESSION_TIMEOUT_UPDATED}, {@code TRUSTED_DEVICE_CREATED/REVOKED},
     * {@code ACCOUNT_UNLOCKED}, {@code NOTIFICATION_PREFERENCES_UPDATED}.
     *
     * @param days ventana temporal en días hacia atrás (default 90, máx. 90)
     * @param jwt  JWT de sesión completa ({@code scope=full-session})
     * @return lista de {@link SecurityDashboardUseCase.AuditEventSummary} ordenada
     *         por {@code occurredAt DESC}, con flag {@code unusualLocation} si la subnet
     *         no está en {@code known_subnets} del usuario
     */
    @GetMapping("/config-history")
    public ResponseEntity<List<SecurityDashboardUseCase.AuditEventSummary>> getConfigHistory(
            @RequestParam(defaultValue = "90") int days,
            HttpServletRequest request) {

        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        return ResponseEntity.ok(dashboardUseCase.getConfigHistory(userId, days));
    }
}
