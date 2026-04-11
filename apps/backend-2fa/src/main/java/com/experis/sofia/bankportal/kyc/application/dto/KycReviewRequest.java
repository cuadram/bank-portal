package com.experis.sofia.bankportal.kyc.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request para revisión manual KYC — PATCH /api/v1/admin/kyc/{kycId}.
 * FEAT-013 US-1307.
 */
public record KycReviewRequest(
        @NotBlank
        @Pattern(regexp = "APPROVE|REJECT")
        String action,
        String reason  // obligatorio si action = REJECT
) {}
