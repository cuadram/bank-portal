package com.experis.sofia.bankportal.twofa.domain.repository;

import com.experis.sofia.bankportal.twofa.domain.model.UserCredentials;

import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de salida — repositorio de credenciales de usuario.
 *
 * <p>Contrato que el dominio necesita para el flujo de login.
 * La implementación concreta reside en
 * {@code infrastructure.persistence.adapter.UserRepositoryAdapter}.</p>
 *
 * <p>FEAT-001 | US-002 | Arquitectura Hexagonal — Domain Layer</p>
 *
 * @since 1.0.0
 */
public interface UserRepository {

    /**
     * Busca las credenciales de un usuario por su nombre de usuario.
     *
     * @param username nombre de usuario (case-sensitive)
     * @return {@link UserCredentials} si el usuario existe
     */
    Optional<UserCredentials> findByUsername(String username);

    /**
     * Busca las credenciales de un usuario por su UUID.
     *
     * @param userId UUID del usuario
     * @return {@link UserCredentials} si el usuario existe
     */
    Optional<UserCredentials> findById(UUID userId);
}
