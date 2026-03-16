package com.experis.sofia.bankportal.session.infrastructure.persistence;

import com.experis.sofia.bankportal.session.domain.model.UserSession;
import com.experis.sofia.bankportal.session.domain.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Adaptador JPA — implementa el puerto {@link UserSessionRepository}.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Repository
@RequiredArgsConstructor
public class UserSessionRepositoryAdapter implements UserSessionRepository {

    private final UserSessionJpaRepository jpa;

    @Override
    public UserSession save(UserSession session) {
        return jpa.save(UserSessionEntity.fromDomain(session)).toDomain();
    }

    @Override
    public Optional<UserSession> findActiveByIdAndUserId(UUID sessionId, UUID userId) {
        return jpa.findActiveByIdAndUserId(sessionId, userId)
                  .map(UserSessionEntity::toDomain);
    }

    @Override
    public Optional<UserSession> findActiveByJti(String jti) {
        return jpa.findActiveByJti(jti).map(UserSessionEntity::toDomain);
    }

    @Override
    public List<UserSession> findAllActiveByUserId(UUID userId) {
        return jpa.findAllActiveByUserId(userId).stream()
                  .map(UserSessionEntity::toDomain)
                  .toList();
    }

    @Override
    public int countActiveByUserId(UUID userId) {
        return jpa.countActiveByUserId(userId);
    }
}
