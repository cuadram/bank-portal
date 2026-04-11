package com.experis.sofia.bankportal.auth.infrastructure;

import com.experis.sofia.bankportal.auth.domain.UserAccount;
import com.experis.sofia.bankportal.auth.domain.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.sql.Timestamp;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementación JDBC de UserAccountRepository.
 * Lee/escribe la tabla users — FEAT-006 Sprint 7.
 */
@Repository
@RequiredArgsConstructor
public class JdbcUserAccountRepository implements UserAccountRepository {

    private final JdbcClient jdbc;

    @Override
    public Optional<UserAccount> findById(UUID userId) {
        return jdbc.sql(
            "SELECT id, email, account_status, failed_otp_attempts, locked_at, " +
            "password_hash, two_factor_enabled, created_at FROM users WHERE id = :id")
            .param("id", userId)
            .query((rs, n) -> {
                UserAccount u = new UserAccount();
                u.setId((UUID) rs.getObject("id"));
                u.setEmail(rs.getString("email"));
                u.setAccountStatus(rs.getString("account_status"));
                u.setFailedOtpAttempts(rs.getInt("failed_otp_attempts"));
                var lockedAt = rs.getTimestamp("locked_at");
                if (lockedAt != null) u.setLockedAt(lockedAt.toInstant());
                u.setPasswordHash(rs.getString("password_hash"));
                u.setTotpEnabled(rs.getBoolean("two_factor_enabled"));
                var createdAt = rs.getTimestamp("created_at");
                if (createdAt != null) u.setCreatedAt(createdAt.toInstant());
                return u;
            })
            .optional();
    }

    @Override
    public Optional<UserAccount> findByEmail(String email) {
        return jdbc.sql(
            "SELECT id, email, account_status, failed_otp_attempts, locked_at, " +
            "password_hash, two_factor_enabled, created_at FROM users WHERE email = :email")
            .param("email", email)
            .query((rs, n) -> {
                UserAccount u = new UserAccount();
                u.setId((UUID) rs.getObject("id"));
                u.setEmail(rs.getString("email"));
                u.setAccountStatus(rs.getString("account_status"));
                u.setFailedOtpAttempts(rs.getInt("failed_otp_attempts"));
                var lockedAt = rs.getTimestamp("locked_at");
                if (lockedAt != null) u.setLockedAt(lockedAt.toInstant());
                u.setPasswordHash(rs.getString("password_hash"));
                u.setTotpEnabled(rs.getBoolean("two_factor_enabled"));
                var createdAt = rs.getTimestamp("created_at");
                if (createdAt != null) u.setCreatedAt(createdAt.toInstant());
                return u;
            })
            .optional();
    }

    @Override
    public void save(UserAccount account) {
        int updated = jdbc.sql(
            "UPDATE users SET account_status = :status, failed_otp_attempts = :attempts, " +
            "locked_at = :lockedAt, password_hash = :pwHash, updated_at = now() " +
            "WHERE id = :id")
            .param("status",   account.getAccountStatus())
            .param("attempts", account.getFailedOtpAttempts())
            .param("lockedAt", account.getLockedAt() != null ? Timestamp.from(account.getLockedAt()) : null)
            .param("pwHash",   account.getPasswordHash())
            .param("id",       account.getId())
            .update();
        if (updated == 0)
            throw new IllegalStateException("UserAccount not found for update: " + account.getId());
    }
}
