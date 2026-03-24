package com.experis.sofia.bankportal.kyc.api;

import com.experis.sofia.bankportal.kyc.application.ReviewKycUseCase;
import com.experis.sofia.bankportal.kyc.application.dto.KycReviewRequest;
import com.experis.sofia.bankportal.kyc.domain.KycVerification;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * REST API — Revisión manual KYC por operadores del banco.
 * FEAT-013 US-1307 — Sprint 15.
 * Requiere ROLE_KYC_REVIEWER — protegido con @PreAuthorize.
 *
 * @author SOFIA Developer Agent — Sprint 15
 */
@RestController
@RequestMapping("/api/v1/admin/kyc")
@RequiredArgsConstructor
public class KycAdminController {

    private final ReviewKycUseCase reviewKyc;

    private UUID userId(HttpServletRequest req) {
        return (UUID) req.getAttribute("authenticatedUserId");
    }

    // ── US-1307 — Aprobar / Rechazar KYC ─────────────────────────────────────
    @PreAuthorize("hasRole('KYC_REVIEWER')")
    @PatchMapping("/{kycId}")
    public ResponseEntity<Map<String, Object>> review(
            @PathVariable UUID kycId,
            @Valid @RequestBody KycReviewRequest body,
            HttpServletRequest req) {

        KycVerification updated = reviewKyc.execute(kycId, userId(req), body);
        return ResponseEntity.ok(Map.of(
                "kycId",      updated.getId(),
                "newStatus",  updated.getStatus(),
                "reviewedAt", updated.getReviewedAt()
        ));
    }
}
