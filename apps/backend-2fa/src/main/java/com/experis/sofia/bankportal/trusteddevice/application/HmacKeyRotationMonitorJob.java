package com.experis.sofia.bankportal.trusteddevice.application;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * ACT-25 — Monitorización automática del estado de HMAC_KEY_PREVIOUS.
 *
 * <p>Registra {@code HMAC_KEY_PREVIOUS_ROTATION_OVERDUE} en audit_log cada día
 * mientras {@code TRUSTED_DEVICE_HMAC_KEY_PREVIOUS} esté configurado, para que
 * el equipo de operaciones pueda detectar que la ventana de gracia sigue activa
 * y vaciar la clave cuando hayan transcurrido {@code graceDays} días (ADR-009).
 *
 * <p>RV-S6-001 fix: eliminado import no usado TrustedDeviceRepository.
 *
 * @author SOFIA Developer Agent — Sprint 6 (ACT-25)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HmacKeyRotationMonitorJob {

    private final AuditLogService auditLogService;

    @Value("${trusted-device.hmac-key-previous:}")
    private String hmacKeyPrevious;

    @Value("${trusted-device.hmac-key-grace-days:30}")
    private int graceDays;

    private static final UUID SYSTEM_UUID =
            UUID.fromString("00000000-0000-0000-0000-000000000000");

    /**
     * Ejecuta diariamente a las 03:00 UTC.
     * Si la clave anterior está vacía — estado normal, no registra nada.
     * Si la clave anterior está presente — registra OVERDUE en audit_log.
     */
    @Scheduled(cron = "0 0 3 * * *", zone = "UTC")
    public void checkKeyPreviousStatus() {
        if (hmacKeyPrevious == null || hmacKeyPrevious.isBlank()) {
            log.debug("HMAC rotation monitor: TRUSTED_DEVICE_HMAC_KEY_PREVIOUS is empty — OK");
            return;
        }

        String message = String.format(
                "TRUSTED_DEVICE_HMAC_KEY_PREVIOUS is set. " +
                "If rotation occurred >%d days ago, clear this key. " +
                "Monitor TRUSTED_DEVICE_GRACE_VERIFY events in audit_log.",
                graceDays);

        auditLogService.log("HMAC_KEY_PREVIOUS_ROTATION_OVERDUE", SYSTEM_UUID, message);
        log.warn("ACT-25: TRUSTED_DEVICE_HMAC_KEY_PREVIOUS is set — verify rotation date " +
                "and clear if grace period ({} days) has elapsed.", graceDays);
    }
}
