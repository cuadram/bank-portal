package com.experis.sofia.bankportal.kyc.application.dto;

import com.experis.sofia.bankportal.kyc.domain.KycStatus;
import java.time.LocalDateTime;
import java.util.UUID;

/** Response de estado KYC — GET /api/v1/kyc/status. FEAT-013 US-1304. */
public record KycStatusResponse(
        UUID userId,
        KycStatus status,
        LocalDateTime submittedAt,
        String rejectionReason,
        String kycWizardUrl,
        int estimatedReviewHours
) {}
