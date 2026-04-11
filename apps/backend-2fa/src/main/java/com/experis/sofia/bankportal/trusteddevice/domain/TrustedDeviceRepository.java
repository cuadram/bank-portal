package com.experis.sofia.bankportal.trusteddevice.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Puerto del dominio para persistencia de dispositivos de confianza.
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4
 */
public interface TrustedDeviceRepository {

    TrustedDevice save(TrustedDevice device);

    /** Busca por hash del trust token — usado en el login filter. */
    Optional<TrustedDevice> findActiveByTokenHash(String tokenHash);

    /** Lista dispositivos activos del usuario ordenados por lastUsedAt DESC. */
    List<TrustedDevice> findAllActiveByUserId(UUID userId);

    /** Cuenta dispositivos activos — para límite máximo de 10. */
    int countActiveByUserId(UUID userId);

    /** Marca como revocados los dispositivos con fecha de expiración pasada. Retorna el número de registros actualizados. */
    default int markExpiredAsRevoked() { return 0; /* stub — impl en JPA */ }

    /** Busca por fingerprint de dispositivo — para detectar si ya tiene trust token. */
    Optional<TrustedDevice> findActiveByUserIdAndFingerprint(UUID userId, String fingerprintHash);
}
