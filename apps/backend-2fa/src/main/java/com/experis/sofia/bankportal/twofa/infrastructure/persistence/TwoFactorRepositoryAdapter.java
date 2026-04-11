package com.experis.sofia.bankportal.twofa.infrastructure.persistence;

import com.experis.sofia.bankportal.twofa.domain.repository.TwoFactorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/**
 * Adaptador JDBC para TwoFactorRepository — tabla users (FEAT-001).
 */
@Repository
@RequiredArgsConstructor
public class TwoFactorRepositoryAdapter implements TwoFactorRepository {

    private final JdbcClient jdbc;

    @Override
    public Optional<String> findTotpSecretEncByUserId(UUID userId) {
        return jdbc.sql("SELECT totp_secret_enc FROM users WHERE id = :id")
            .param("id", userId)
            .query(String.class)
            .optional();
    }

    @Override
    public boolean isTwoFactorEnabled(UUID userId) {
        return Boolean.TRUE.equals(
            jdbc.sql("SELECT two_factor_enabled FROM users WHERE id = :id")
                .param("id", userId)
                .query(Boolean.class)
                .optional()
                .orElse(false));
    }

    @Override
    public void saveTotpSecret(UUID userId, String totpSecretEnc) {
        jdbc.sql("UPDATE users SET totp_secret_enc = :secret, updated_at = now() WHERE id = :id")
            .param("secret", totpSecretEnc)
            .param("id", userId)
            .update();
    }

    @Override
    public void enableTwoFactor(UUID userId) {
        jdbc.sql("UPDATE users SET two_factor_enabled = true, two_factor_enrolled_at = now(), updated_at = now() WHERE id = :id")
            .param("id", userId)
            .update();
    }

    @Override
    public void disableTwoFactor(UUID userId) {
        jdbc.sql("UPDATE users SET two_factor_enabled = false, totp_secret_enc = null, two_factor_enrolled_at = null, updated_at = now() WHERE id = :id")
            .param("id", userId)
            .update();
    }

    @Override
    public boolean existsById(UUID userId) {
        return Boolean.TRUE.equals(
            jdbc.sql("SELECT COUNT(*) > 0 FROM users WHERE id = :id")
                .param("id", userId)
                .query(Boolean.class)
                .single());
    }
}
