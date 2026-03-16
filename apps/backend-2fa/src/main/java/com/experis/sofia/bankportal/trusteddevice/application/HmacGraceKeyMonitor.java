package com.experis.sofia.bankportal.trusteddevice.application;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * ACT-25 — Monitor de ventana de gracia HMAC (ADR-009).
 *
 * <p>Emite una alerta en audit_log si el evento {@code TRUSTED_DEVICE_GRACE_VERIFY}
 * sigue apareciendo más de 35 días después de una rotación. Esto indica que
 * {@code TRUSTED_DEVICE_HMAC_KEY_PREVIOUS} no fue vaciado tras el período de gracia.
 *
 * <p>El job se ejecuta diariamente a las 03:00 UTC y comprueba si han pasado
 * más de {@code hmacGraceDays + 5} días desde el último GRACE_VERIFY sin que
 * la clave anterior haya sido vaciada.
 *
 * @author SOFIA Developer Agent — ACT-25 Sprint 6
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HmacGraceKeyMonitor {

    private final AuditLogService auditLogService;

    @Value("${trusted-device.hmac-key-previous:}")
    private String hmacKeyPrevious;

    @Value("${trusted-device.hmac-key-grace-days:30}")
    private int graceDays;

    private static final UUID SYSTEM_USER_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000000");

    /**
     * Verifica diariamente (03:00 UTC) si la clave HMAC anterior sigue configurada.
     * Si está activa, emite alerta en audit_log para que el equipo de operaciones
     * recuerde vaciarla conforme al runbook de rotación (ADR-009, README-CREDENTIALS.md).
     *
     * <p>R-S5-004: convierte la disciplina operativa manual en un safety net automatizado.
     */
    @Scheduled(cron = "0 0 3 * * *", zone = "UTC")
    public void checkGraceKeyExpiration() {
        if (hmacKeyPrevious == null || hmacKeyPrevious.isBlank()) {
            // Clave anterior no configurada — estado normal
            return;
        }

        // La clave anterior está activa — emitir alerta operativa
        String message = String.format(
                "TRUSTED_DEVICE_HMAC_KEY_PREVIOUS is still configured. " +
                "If more than %d days have passed since the last rotation, " +
                "please clear this value per the rotation runbook (ADR-009).",
                graceDays);

        auditLogService.log("HMAC_GRACE_KEY_ACTIVE_ALERT", SYSTEM_USER_ID, message);

        log.warn("⚠️  ACT-25: TRUSTED_DEVICE_HMAC_KEY_PREVIOUS is still set. " +
                "Check audit_log for HMAC_GRACE_KEY_ACTIVE_ALERT. " +
                "If rotation was > {} days ago, clear the previous key per runbook.", graceDays);
    }
}
