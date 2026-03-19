package com.experis.sofia.bankportal.auth.domain;

import java.util.Optional;

/**
 * Puerto de tokens de confirmación de contexto — FEAT-006 ADR-011.
 */
public interface ContextConfirmTokenRepository {
    void save(ContextConfirmToken token);
    Optional<ContextConfirmToken> findByRawToken(String rawToken);
    void deleteByRawToken(String rawToken);
}
