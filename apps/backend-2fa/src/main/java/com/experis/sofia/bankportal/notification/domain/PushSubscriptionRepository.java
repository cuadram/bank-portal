package com.experis.sofia.bankportal.notification.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositorio Spring Data JPA para suscripciones Web Push — FEAT-014.
 */
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {

    List<PushSubscription> findByUserId(UUID userId);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    long countByUserId(UUID userId);

    @Modifying
    @Query("DELETE FROM PushSubscription p WHERE p.endpoint = :endpoint")
    void deleteByEndpoint(String endpoint);

    @Modifying
    @Query("DELETE FROM PushSubscription p WHERE p.id = :id AND p.userId = :userId")
    int deleteByIdAndUserId(UUID id, UUID userId);
}
