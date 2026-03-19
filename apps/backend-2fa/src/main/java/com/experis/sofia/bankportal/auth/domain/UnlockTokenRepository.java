package com.experis.sofia.bankportal.auth.domain;

import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de tokens de desbloqueo de cuenta — FEAT-006 US-602.
 */
public interface UnlockTokenRepository {
    void save(UnlockToken token);
    Optional<UnlockToken> findByRawToken(String rawToken);
    Optional<UnlockToken> findByToken(String token);
    void deleteByToken(String token);
    void deleteExpiredBefore(java.time.Instant cutoff);
    /** Invalida todos los tokens pendientes del usuario (llamado antes de generar nuevo). */
    void invalidateAllForUser(UUID userId);
}
