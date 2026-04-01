package com.experis.sofia.bankportal.privacy.infrastructure;

import com.experis.sofia.bankportal.privacy.domain.ConsentHistory;
import com.experis.sofia.bankportal.privacy.domain.ConsentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio JPA — historial de consentimientos (append-only).
 * RN-F019-16: solo INSERT, nunca UPDATE/DELETE.
 * @Primary sin @Profile — activo en todos los entornos (LA-019-08).
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
@Repository
public interface ConsentHistoryRepository extends JpaRepository<ConsentHistory, UUID> {

    /** Último estado de cada tipo de consentimiento para el usuario. */
    @Query("""
        SELECT c FROM ConsentHistory c
        WHERE c.userId = :userId
          AND c.createdAt = (
              SELECT MAX(c2.createdAt)
              FROM ConsentHistory c2
              WHERE c2.userId = :userId AND c2.tipo = c.tipo
          )
        """)
    List<ConsentHistory> findCurrentConsents(UUID userId);

    /** Valor actual de un tipo concreto de consentimiento. */
    @Query("""
        SELECT c FROM ConsentHistory c
        WHERE c.userId = :userId AND c.tipo = :tipo
        ORDER BY c.createdAt DESC
        LIMIT 1
        """)
    Optional<ConsentHistory> findLatest(UUID userId, ConsentType tipo);

    /** Historial completo de un tipo de consentimiento (para auditoría). */
    List<ConsentHistory> findByUserIdAndTipoOrderByCreatedAtDesc(UUID userId, ConsentType tipo);
}
