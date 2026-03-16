package com.experis.sofia.bankportal.session.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio Spring Data JPA para {@link UserSessionEntity}.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
public interface UserSessionJpaRepository extends JpaRepository<UserSessionEntity, UUID> {

    @Query("""
            SELECT s FROM UserSessionEntity s
            WHERE s.id = :id AND s.userId = :userId AND s.revokedAt IS NULL
            """)
    Optional<UserSessionEntity> findActiveByIdAndUserId(
            @Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT s FROM UserSessionEntity s WHERE s.jti = :jti AND s.revokedAt IS NULL")
    Optional<UserSessionEntity> findActiveByJti(@Param("jti") String jti);

    @Query("""
            SELECT s FROM UserSessionEntity s
            WHERE s.userId = :userId AND s.revokedAt IS NULL
            ORDER BY s.lastActivity DESC
            """)
    List<UserSessionEntity> findAllActiveByUserId(@Param("userId") UUID userId);

    @Query("""
            SELECT COUNT(s) FROM UserSessionEntity s
            WHERE s.userId = :userId AND s.revokedAt IS NULL
            """)
    int countActiveByUserId(@Param("userId") UUID userId);
}
