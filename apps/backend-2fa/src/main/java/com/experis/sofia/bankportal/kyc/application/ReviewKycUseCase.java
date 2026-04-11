package com.experis.sofia.bankportal.kyc.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.kyc.application.dto.KycReviewRequest;
import com.experis.sofia.bankportal.kyc.domain.KycStatus;
import com.experis.sofia.bankportal.kyc.domain.KycVerification;
import com.experis.sofia.bankportal.kyc.domain.KycVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Revisión manual de verificación KYC por operador del banco.
 * FEAT-013 US-1307 — PATCH /api/v1/admin/kyc/{kycId}
 * Requiere ROLE_KYC_REVIEWER — verificado en SecurityConfig.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewKycUseCase {

    private final KycVerificationRepository kycRepo;
    private final AuditLogService           auditLog;

    @Transactional
    public KycVerification execute(UUID kycId, UUID reviewerId, KycReviewRequest req) {
        KycVerification kyc = kycRepo.findById(kycId)
                .orElseThrow(() -> new ReviewKycException("KYC_NOT_FOUND"));

        // Solo se puede revisar si está en SUBMITTED
        if (kyc.getStatus() != KycStatus.SUBMITTED)
            throw new ReviewKycException("INVALID_KYC_TRANSITION");

        // Validar reason obligatorio para REJECT
        if ("REJECT".equals(req.action()) &&
                (req.reason() == null || req.reason().isBlank()))
            throw new ReviewKycException("REASON_REQUIRED_FOR_REJECTION");

        KycStatus newStatus = "APPROVE".equals(req.action())
                ? KycStatus.APPROVED : KycStatus.REJECTED;

        kyc.setStatus(newStatus);
        kyc.setReviewedAt(LocalDateTime.now());
        kyc.setReviewerId(reviewerId);
        if (newStatus == KycStatus.REJECTED) kyc.setRejectionReason(req.reason());

        kycRepo.save(kyc);

        String eventType = newStatus == KycStatus.APPROVED
                ? "KYC_MANUAL_APPROVED" : "KYC_MANUAL_REJECTED";
        auditLog.log(eventType, kyc.getUserId(),
                "kycId=" + kycId + " reviewerId=" + reviewerId +
                (req.reason() != null ? " reason=" + req.reason() : ""));

        log.info("[US-1307] KYC {} reviewerId={} kycId={}", newStatus, reviewerId, kycId);
        return kyc;
    }

    public static class ReviewKycException extends RuntimeException {
        public ReviewKycException(String code) { super(code); }
    }
}
