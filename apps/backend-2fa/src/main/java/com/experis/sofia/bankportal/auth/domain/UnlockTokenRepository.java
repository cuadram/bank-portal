package com.experis.sofia.bankportal.auth.domain;

import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de tokens de desbloqueo de cuenta — FEAT-006 US-602.
 */
public interface UnlockTokenRepository {
    void save(UnlockToken token);
    Optional<UnlockToken> findByToken(String token);
    void deleteByToken(String token);
    void deleteExpiredBefore(java.time.Instant cutoff);
}
