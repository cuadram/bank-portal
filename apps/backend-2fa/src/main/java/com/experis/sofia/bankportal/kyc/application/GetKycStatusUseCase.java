package com.experis.sofia.bankportal.kyc.application;

import com.experis.sofia.bankportal.kyc.application.dto.KycStatusResponse;
import com.experis.sofia.bankportal.kyc.domain.KycStatus;
import com.experis.sofia.bankportal.kyc.domain.KycVerification;
import com.experis.sofia.bankportal.kyc.domain.KycVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/**
 * Consulta el estado KYC del usuario autenticado.
 * FEAT-013 US-1304 — GET /api/v1/kyc/status
 */
@Service
@RequiredArgsConstructor
public class GetKycStatusUseCase {

    private static final String KYC_WIZARD_URL = "/kyc";
    private static final int ESTIMATED_REVIEW_HOURS = 24;

    private final KycVerificationRepository kycRepo;

    @Transactional(readOnly = true)
    public KycStatusResponse execute(UUID userId) {
        return kycRepo.findByUserId(userId)
                .map(kyc -> new KycStatusResponse(
                        userId,
                        kyc.getStatus(),
                        kyc.getSubmittedAt(),
                        kyc.getRejectionReason(),
                        KYC_WIZARD_URL,
                        ESTIMATED_REVIEW_HOURS
                ))
                .orElseGet(() -> new KycStatusResponse(
                        userId,
                        KycStatus.NONE,
                        null, null,
                        KYC_WIZARD_URL,
                        ESTIMATED_REVIEW_HOURS
                ));
    }
}
