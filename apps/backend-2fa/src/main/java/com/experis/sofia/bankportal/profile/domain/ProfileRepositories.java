package com.experis.sofia.bankportal.profile.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByUserId(UUID userId);
}

interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, UUID> {
    @Query("SELECT ph FROM PasswordHistory ph WHERE ph.userId = :userId ORDER BY ph.createdAt DESC LIMIT 3")
    List<PasswordHistory> findTop3ByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserId(UUID userId);
    PasswordHistory findFirstByUserIdOrderByCreatedAtAsc(UUID userId);
}

interface RevokedTokenRepository extends JpaRepository<RevokedToken, UUID> {
    Optional<RevokedToken> findByJtiAndUserId(String jti, UUID userId);
    boolean existsByJti(String jti);
}
