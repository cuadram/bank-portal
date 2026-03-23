package com.experis.sofia.bankportal.profile.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

/** Puerto de salida — perfil de usuario. FEAT-012-A US-1201/1202. */
public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    Optional<UserProfile> findByUserId(UUID userId);
}
