package com.experis.sofia.bankportal.kyc.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

/** Puerto de salida — documentos KYC subidos. FEAT-013 US-1302. */
public interface KycDocumentRepository extends JpaRepository<KycDocument, UUID> {
    List<KycDocument> findByKycId(UUID kycId);
    boolean existsByKycIdAndDocumentTypeAndSide(UUID kycId, DocumentType type, String side);
}
