package com.experis.sofia.bankportal.session.domain.repository;

import com.experis.sofia.bankportal.session.domain.model.UserSession;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Puerto del dominio para persistencia de sesiones.
 * La implementación vive en la capa de infraestructura (JPA).
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
public interface UserSessionRepository {

    /** Persiste una sesión nueva o actualiza una existente. */
    UserSession save(UserSession session);

    /** Busca una sesión activa por su ID y userId (protección IDOR). */
    Optional<UserSession> findActiveByIdAndUserId(UUID sessionId, UUID userId);

    /** Busca una sesión activa por su JTI. */
    Optional<UserSession> findActiveByJti(String jti);

    /**
     * Lista todas las sesiones activas de un usuario ordenadas por
     * {@code lastActivity} descendente (más reciente primero).
     */
    List<UserSession> findAllActiveByUserId(UUID userId);

    /**
     * Cuenta las sesiones activas de un usuario.
     * Se usa para el control de concurrencia (US-104).
     */
    int countActiveByUserId(UUID userId);
}
