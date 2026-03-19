package com.experis.sofia.bankportal.auth.domain;

import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de cuentas de usuario — FEAT-006.
 */
public interface UserAccountRepository {
    Optional<UserAccount> findById(UUID userId);
    Optional<UserAccount> findByEmail(String email);
    void save(UserAccount account);
}
