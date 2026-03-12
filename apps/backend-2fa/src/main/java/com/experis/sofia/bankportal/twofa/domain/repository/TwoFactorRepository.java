package com.experis.sofia.bankportal.twofa.domain.repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de salida (output port) — repositorio de estado 2FA del usuario.
 *
 * <p>Define el contrato que el dominio necesita para persistir y consultar
 * el estado de enrolamiento TOTP. La implementación concreta reside en
 * {@code infrastructure.persistence.adapter.TwoFactorRepositoryAdapter}.</p>
 *
 * <p>FEAT-001 | US-001 | Arquitectura Hexagonal — Domain Layer</p>
 *
 * @since 1.0.0
 */
public interface TwoFactorRepository {

    /**
     * Busca el secreto TOTP cifrado de un usuario.
     *
     * @param userId UUID del usuario
     * @return secreto TOTP cifrado (AES-256-CBC Base64), vacío si no tiene secreto
     */
    Optional<String> findTotpSecretEncByUserId(UUID userId);

    /**
     * Retorna true si el usuario tiene 2FA activo ({@code two_factor_enabled = true}).
     *
     * @param userId UUID del usuario
     * @return true si 2FA está habilitado
     */
    boolean isTwoFactorEnabled(UUID userId);

    /**
     * Guarda el secreto TOTP cifrado y marca 2FA como pendiente de confirmación.
     *
     * <p>Establece {@code totp_secret_enc} con el valor cifrado y
     * deja {@code two_factor_enabled = false} hasta que el usuario
     * confirme con su primer OTP.</p>
     *
     * @param userId          UUID del usuario
     * @param totpSecretEnc   secreto cifrado (formato {@code iv:ciphertext} en Base64)
     */
    void saveTotpSecret(UUID userId, String totpSecretEnc);

    /**
     * Activa el 2FA para el usuario tras confirmar el primer OTP exitosamente.
     *
     * <p>Establece {@code two_factor_enabled = true} y
     * {@code two_factor_enrolled_at = NOW()} de forma atómica.</p>
     *
     * @param userId UUID del usuario
     */
    void enableTwoFactor(UUID userId);

    /**
     * Desactiva el 2FA y borra el secreto TOTP del usuario.
     *
     * <p>Establece {@code two_factor_enabled = false},
     * {@code totp_secret_enc = NULL} y
     * {@code two_factor_enrolled_at = NULL}.</p>
     *
     * @param userId UUID del usuario
     */
    void disableTwoFactor(UUID userId);

    /**
     * Verifica que el usuario existe en el sistema.
     *
     * @param userId UUID del usuario
     * @return true si el usuario existe
     */
    boolean existsById(UUID userId);
}
