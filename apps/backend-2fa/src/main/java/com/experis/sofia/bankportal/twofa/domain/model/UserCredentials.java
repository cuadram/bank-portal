package com.experis.sofia.bankportal.twofa.domain.model;

import java.util.UUID;

/**
 * Modelo de dominio — credenciales del usuario para el flujo de login.
 *
 * <p>Proyección ligera de {@code UserEntity}: solo los campos que el
 * dominio necesita para autenticación. No expone la entidad JPA.</p>
 *
 * <p>FEAT-001 | US-002 | Arquitectura Hexagonal — Domain Model</p>
 *
 * @param userId           UUID del usuario
 * @param username         nombre de usuario (login)
 * @param email            email del usuario
 * @param passwordHash     hash BCrypt de la contraseña (para validación)
 * @param twoFactorEnabled true si el usuario tiene 2FA activo
 * @since 1.0.0
 */
public record UserCredentials(
    UUID userId,
    String username,
    String email,
    String passwordHash,
    boolean twoFactorEnabled
) {}
