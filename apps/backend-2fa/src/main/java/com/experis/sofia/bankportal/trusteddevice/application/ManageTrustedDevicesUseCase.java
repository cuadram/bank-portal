package com.experis.sofia.bankportal.trusteddevice.application;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDevice;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Caso de uso US-202 — Listar y revocar dispositivos de confianza.
 * Caso de uso US-204 — Limpieza nocturna de dispositivos expirados.
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ManageTrustedDevicesUseCase {

    private final TrustedDeviceRepository deviceRepository;
    private final AuditLogService         auditLogService;

    /** US-202 — Lista dispositivos de confianza activos del usuario. */
    @Transactional(readOnly = true)
    public List<TrustedDevice> listActive(UUID userId) {
        return deviceRepository.findAllActiveByUserId(userId);
    }

    /**
     * US-202 — Revoca un dispositivo de confianza individual.
     *
     * @throws TrustedDeviceNotFoundException si el dispositivo no existe o no pertenece al usuario
     */
    @Transactional
    public void revokeOne(UUID deviceId, UUID userId) {
        deviceRepository.findAllActiveByUserId(userId).stream()
                .filter(d -> d.getId().equals(deviceId))
                .findFirst()
                .ifPresentOrElse(
                        device -> {
                            device.revoke("MANUAL");
                            deviceRepository.save(device);
                            auditLogService.log("TRUSTED_DEVICE_REVOKED", userId, deviceId.toString());
                            log.info("Trusted device revoked userId={} deviceId={}", userId, deviceId);
                        },
                        () -> { throw new TrustedDeviceNotFoundException(deviceId); }
                );
    }

    /** US-202 — Revoca todos los dispositivos de confianza del usuario. */
    @Transactional
    public void revokeAll(UUID userId) {
        List<TrustedDevice> active = deviceRepository.findAllActiveByUserId(userId);
        active.forEach(d -> {
            d.revoke("MANUAL_ALL");
            deviceRepository.save(d);
        });
        auditLogService.log("TRUSTED_DEVICE_REVOKE_ALL", userId, "revoked=" + active.size());
        log.info("All trusted devices revoked for userId={} count={}", userId, active.size());
    }

    /**
     * US-204 — Job de limpieza nocturna de dispositivos expirados.
     * Ejecuta diariamente a las 02:00 UTC.
     * Fallback: la verificación de TTL en el login actúa como segunda línea (R-F3-004).
     */
    @Scheduled(cron = "0 0 2 * * *", zone = "UTC")
    @Transactional
    public void cleanupExpired() {
        // La query filtra registros con expires_at < NOW() y revoked_at IS NULL
        // Implementado en el adaptador JPA mediante @Query
        int cleaned = deviceRepository.markExpiredAsRevoked();
        if (cleaned > 0) {
            auditLogService.log("TRUSTED_DEVICE_EXPIRED_CLEANUP",
                    UUID.fromString("00000000-0000-0000-0000-000000000000"),
                    "count=" + cleaned);
            log.info("Cleaned up {} expired trusted devices", cleaned);
        }
    }

    public static class TrustedDeviceNotFoundException extends RuntimeException {
        public TrustedDeviceNotFoundException(UUID id) {
            super("TRUSTED_DEVICE_NOT_FOUND: " + id);
        }
    }
}
