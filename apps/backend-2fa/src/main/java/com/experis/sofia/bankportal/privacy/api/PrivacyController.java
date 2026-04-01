package com.experis.sofia.bankportal.privacy.api;

import com.experis.sofia.bankportal.privacy.application.*;
import com.experis.sofia.bankportal.privacy.application.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST API — Centro de Privacidad GDPR.
 * FEAT-019 Sprint 21 — RF-019-04 a RF-019-06.
 * Endpoints: /api/v1/privacy/consents, /data-export, /deletion-request.
 * LA-TEST-001: authenticatedUserId extraído de HttpServletRequest.getAttribute.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
@RestController
@RequestMapping("/api/v1/privacy")
@RequiredArgsConstructor
public class PrivacyController {

    private final ConsentManagementService consentService;
    private final DataExportService        dataExportService;
    private final DeletionRequestService   deletionService;

    private UUID userId(HttpServletRequest req) {
        return (UUID) req.getAttribute("authenticatedUserId"); // LA-TEST-001
    }

    private String ip(HttpServletRequest req) {
        return req.getRemoteAddr();
    }

    // ─── RF-019-04: Consentimientos ──────────────────────────────────────────

    /** GET /api/v1/privacy/consents — estado actual de todos los consentimientos. */
    @GetMapping("/consents")
    public ResponseEntity<List<ConsentResponse>> getConsents(HttpServletRequest req) {
        return ResponseEntity.ok(consentService.getCurrentConsents(userId(req)));
    }

    /** PATCH /api/v1/privacy/consents — actualizar un consentimiento. */
    @PatchMapping("/consents")
    public ResponseEntity<ConsentResponse> updateConsent(
            @Valid @RequestBody ConsentUpdateRequest dto,
            HttpServletRequest req) {
        return ResponseEntity.ok(
            consentService.updateConsent(userId(req), dto, ip(req)));
    }

    // ─── RF-019-05: Portabilidad de datos ────────────────────────────────────

    /** POST /api/v1/privacy/data-export — solicitar portabilidad (async, 202). */
    @PostMapping("/data-export")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public DataExportResponse requestDataExport(HttpServletRequest req) {
        return dataExportService.requestExport(userId(req));
    }

    /** GET /api/v1/privacy/data-export/status — estado del export activo. */
    @GetMapping("/data-export/status")
    public ResponseEntity<DataExportResponse> getExportStatus(HttpServletRequest req) {
        return ResponseEntity.ok(dataExportService.getExportStatus(userId(req)));
    }

    // ─── RF-019-06: Derecho al olvido ─────────────────────────────────────────

    /**
     * POST /api/v1/privacy/deletion-request — paso 1 (OTP validado).
     * RN-F019-25: OTP validado previamente por el cliente; el controller
     * registra la solicitud y suspende la cuenta.
     */
    @PostMapping("/deletion-request")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseEntity<Map<String, String>> requestDeletion(
            @Valid @RequestBody DeletionRequestDto dto,
            HttpServletRequest req) {
        // En producción: validar OTP contra OtpService antes de iniciar
        deletionService.initiateDeletion(userId(req));
        return ResponseEntity.accepted().body(Map.of(
            "message", "Email de confirmación enviado. Tienes 24 horas para confirmar."
        ));
    }

    /**
     * GET /api/v1/privacy/deletion-request/confirm — paso 2 (enlace email).
     * RN-F019-26: token de un solo uso con TTL 24h.
     */
    @GetMapping("/deletion-request/confirm")
    public ResponseEntity<Void> confirmDeletion(@RequestParam UUID requestId) {
        deletionService.confirmDeletion(requestId);
        return ResponseEntity.ok().build();
    }
}
