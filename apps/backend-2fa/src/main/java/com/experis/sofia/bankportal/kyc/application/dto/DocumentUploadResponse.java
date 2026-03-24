package com.experis.sofia.bankportal.kyc.application.dto;

import com.experis.sofia.bankportal.kyc.domain.KycStatus;
import java.util.UUID;

/** Response tras subida de documento — POST /api/v1/kyc/documents. FEAT-013 US-1302. */
public record DocumentUploadResponse(UUID documentId, KycStatus kycStatus) {}
