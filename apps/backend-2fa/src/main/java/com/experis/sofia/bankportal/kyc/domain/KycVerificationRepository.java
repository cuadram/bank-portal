package com.experis.sofia.bankportal.kyc.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

/** Puerto de salida — verificaciones KYC. FEAT-013 US-1301. */
public interface KycVerificationRepository extends JpaRepository<KycVerification, UUID> {
    Optional<KycVerification> findByUserId(UUID userId);
    boolean existsByUserIdAndStatus(UUID userId, KycStatus status);
}
