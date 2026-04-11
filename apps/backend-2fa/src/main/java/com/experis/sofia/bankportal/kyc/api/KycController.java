package com.experis.sofia.bankportal.kyc.api;

import com.experis.sofia.bankportal.kyc.application.*;
import com.experis.sofia.bankportal.kyc.application.dto.*;
import com.experis.sofia.bankportal.kyc.domain.DocumentType;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

/**
 * REST API — Onboarding KYC — endpoints del usuario.
 * FEAT-013 US-1302/1304 — Sprint 15.
 *
 * userId extraído de atributos de request inyectados por JwtAuthenticationFilter.
 *
 * @author SOFIA Developer Agent — Sprint 15
 */
@RestController
@RequestMapping("/api/v1/kyc")
@RequiredArgsConstructor
public class KycController {

    private final GetKycStatusUseCase  getStatus;
    private final UploadDocumentUseCase uploadDocument;

    private UUID userId(HttpServletRequest req) {
        return (UUID) req.getAttribute("authenticatedUserId");
    }

    // ── US-1304 — Consultar estado KYC ────────────────────────────────────────
    @GetMapping("/status")
    public ResponseEntity<KycStatusResponse> getStatus(HttpServletRequest req) {
        return ResponseEntity.ok(getStatus.execute(userId(req)));
    }

    // ── US-1302 — Subir documento ─────────────────────────────────────────────
    @PostMapping("/documents")
    public ResponseEntity<DocumentUploadResponse> uploadDocument(
            @RequestParam DocumentType documentType,
            @RequestParam String side,
            @RequestParam MultipartFile file,
            HttpServletRequest req) {
        DocumentUploadResponse result = uploadDocument.execute(
                userId(req), documentType, side.toUpperCase(), file);
        return ResponseEntity.status(201).body(result);
    }
}
