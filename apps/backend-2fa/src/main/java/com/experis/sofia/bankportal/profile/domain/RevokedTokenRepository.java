package com.experis.sofia.bankportal.profile.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de salida — tokens JWT revocados.
 * ADR-022: blacklist híbrida Redis + PG. FEAT-012-A US-1205.
 */
public interface RevokedTokenRepository extends JpaRepository<RevokedToken, UUID> {
    Optional<RevokedToken> findByJtiAndUserId(String jti, UUID userId);
    boolean existsByJti(String jti);
}
