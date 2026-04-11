package com.experis.sofia.bankportal.notification.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio Spring Data JPA para preferencias de canal — FEAT-014.
 */
public interface NotificationPreferenceRepository
        extends JpaRepository<NotificationPreference, UUID> {

    Optional<NotificationPreference> findByUserIdAndEventType(
            UUID userId, NotificationEventType eventType);

    List<NotificationPreference> findByUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM NotificationPreference p WHERE p.userId = :userId")
    void deleteByUserId(UUID userId);
}
