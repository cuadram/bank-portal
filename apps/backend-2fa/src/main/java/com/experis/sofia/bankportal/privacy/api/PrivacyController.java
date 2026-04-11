package com.experis.sofia.bankportal.privacy.api;

import com.experis.sofia.bankportal.privacy.application.*;
import com.experis.sofia.bankportal.privacy.application.dto.*;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
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
 * DEBT-041 FIXED (Sprint 22): OTP validado por OtpValidationUseCase antes de initiateDeletion().
 *   CWE-287 — Improper Authentication. CVSS 4.8 → cerrado.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21 / DEBT-041 Sprint 22
 */
@RestController
@RequestMapping("/api/v1/privacy")
@RequiredArgsConstructor
public class PrivacyController {

    private final ConsentManagementService consentService;
    private final DataExportService        dataExportService;
    private final DeletionRequestService   deletionService;
    private final OtpValidationUseCase     otpValidationUseCase;   // DEBT-041

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
     * POST /api/v1/privacy/deletion-request — paso 1.
     * RN-F019-25: OTP 2FA obligatorio. DEBT-041 FIXED: OtpValidationUseCase.validate()
     * lanza InvalidOtpException (HTTP 401) si el código es incorrecto o expirado.
     * Solo si el OTP es válido se inicia el proceso de eliminación.
     */
    @PostMapping("/deletion-request")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResponseEntity<Map<String, String>> requestDeletion(
            @Valid @RequestBody DeletionRequestDto dto,
            HttpServletRequest req) {
        UUID uid = userId(req);
        otpValidationUseCase.validate(uid, dto.otpCode()); // DEBT-041: lanza 401 si OTP inválido
        deletionService.initiateDeletion(uid);
        return ResponseEntity.accepted().body(Map.of(
            "message", "Email de confirmación enviado. Tienes 24 horas para confirmar."
        ));
    }

    /**
     * GET /api/v1/privacy/deletion-request/confirm — paso 2 (enlace email).
     * RN-F019-26: token de un solo uso. TTL 24h validado en DeletionRequestService (DEBT-042).
     */
    @GetMapping("/deletion-request/confirm")
    public ResponseEntity<Void> confirmDeletion(@RequestParam UUID requestId) {
        deletionService.confirmDeletion(requestId);
        return ResponseEntity.ok().build();
    }
}
