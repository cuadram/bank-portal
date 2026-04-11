package com.experis.sofia.bankportal.profile.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de salida — historial de contraseñas.
 * ADR-021: tabla independiente password_history. FEAT-012-A US-1203.
 */
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, UUID> {

    @Query("SELECT ph FROM PasswordHistory ph WHERE ph.userId = :userId ORDER BY ph.createdAt DESC LIMIT 3")
    List<PasswordHistory> findTop3ByUserIdOrderByCreatedAtDesc(UUID userId);

    long countByUserId(UUID userId);

    PasswordHistory findFirstByUserIdOrderByCreatedAtAsc(UUID userId);
}
