package com.experis.sofia.bankportal.session.domain.repository;

import com.experis.sofia.bankportal.session.domain.model.KnownDevice;

import java.util.Optional;
import java.util.UUID;

/**
 * Puerto del dominio para persistencia de dispositivos conocidos.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
public interface KnownDeviceRepository {

    Optional<KnownDevice> findByUserIdAndFingerprintHash(UUID userId, String hash);

    KnownDevice save(KnownDevice device);
}
