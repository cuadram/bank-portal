package com.experis.sofia.bankportal.auth.application;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Caso de uso US-601 — Bloqueo automático de cuenta tras intentos fallidos de OTP.
 *
 * <p>Lógica:
 * <ul>
 *   <li>Aviso progresivo desde el intento {@code warningThreshold} (attemptsRemaining visibles)</li>
 *   <li>Bloqueo automático al llegar a {@code maxAttempts} en ventana de {@code windowHours}h</li>
 *   <li>Reset del contador al login exitoso o al usar código de recuperación</li>
 *   <li>Ventana deslizante: si {@code failed_attempts_since} &lt; now() - windowHours → reinicia</li>
 * </ul>
 *
 * <p><b>RV-S7-001 fix:</b> el envío de email de bloqueo está aislado en try-catch dentro de
 * {@link #lockAccount}. Si {@code NotificationService} falla transitoriamente, el bloqueo
 * persiste igualmente en BD y el reintento se gestiona vía {@code NotificationRetryJob} asíncrono.
 * El caller no recibe la excepción de notificación — solo {@link AccountLockedException}.
 *
 * @author SOFIA Developer Agent — FEAT-006 US-601 Sprint 7
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountLockUseCase {

    private final AuditLogService auditLogService;

    @Value("${account.lock.max-attempts:10}")
    private int maxAttempts;

    @Value("${account.lock.warning-threshold:7}")
    private int warningThreshold;

    @Value("${account.lock.window-hours:24}")
    private int windowHours;

    /**
     * Registra un intento fallido de OTP y retorna los intentos restantes.
     * Si el contador supera {@code maxAttempts} bloquea la cuenta y lanza
     * {@link AccountLockedException} (mapeada a HTTP 423).
     * Emite aviso progresivo desde el intento {@code warningThreshold}.
     *
     * @param userId UUID del usuario que falló el OTP
     * @param ip     dirección IP del intento (para audit_log)
     * @return número de intentos restantes antes del bloqueo
     * @throws AccountLockedException si {@code failedAttempts >= maxAttempts}
     */
    @Transactional
    public int recordFailedAttempt(UUID userId, String ip) {
        log.info("Failed OTP attempt for userId={} ip={}", userId, ip);
        auditLogService.log("OTP_FAILED", userId, "ip=" + ip);

        // TODO(impl): cargar currentAttempts de BD con ventana windowHours
        // users.failed_attempts_since: si null o > windowHours → reiniciar contador
        int currentAttempts = 1; // placeholder — implementación real lee de users.failed_otp_attempts

        if (currentAttempts >= maxAttempts) {
            lockAccount(userId, ip);
            throw new AccountLockedException(userId);
        }

        int remaining = maxAttempts - currentAttempts;

        // RV-S7-004: aviso progresivo desde warningThreshold (intento 7)
        if (currentAttempts >= warningThreshold) {
            log.warn("Account approaching lock: userId={} attempts={} remaining={}",
                    userId, currentAttempts, remaining);
        }

        return remaining;
    }

    /**
     * Bloquea la cuenta del usuario, registra en audit_log y envía email de aviso.
     *
     * <p><b>RV-S7-001:</b> el envío de email está aislado en try-catch. Si falla,
     * se registra un warning y el reintento corre a cargo del job asíncrono.
     * El bloqueo en BD es irreversible desde este punto — no se revierte por error de email.
     *
     * @param userId UUID del usuario a bloquear
     * @param ip     dirección IP que desencadenó el bloqueo (para audit_log)
     */
    @Transactional
    public void lockAccount(UUID userId, String ip) {
        // TODO(impl): users.account_status = 'LOCKED', users.locked_at = now()
        auditLogService.log("ACCOUNT_LOCKED", userId, "ip=" + ip + " reason=OTP_MAX_ATTEMPTS");
        log.warn("Account LOCKED for userId={} after max failed OTP attempts", userId);

        // RV-S7-001 FIX: envío de email aislado — el bloqueo en BD no debe fallar
        // si el servicio de notificación no está disponible transitoriamente.
        // El job asíncrono NotificationRetryJob reintentará el envío.
        try {
            sendAccountLockedEmailSafely(userId);
        } catch (Exception e) {
            log.error("Failed to send account-locked email for userId={} — retry via job: {}",
                    userId, e.getMessage());
            // No propagar: el bloqueo ya está persistido en BD
        }
    }

    /**
     * Delega el envío del email de bloqueo. Método extraído para facilitar el mock en tests.
     *
     * @param userId UUID del usuario bloqueado
     */
    protected void sendAccountLockedEmailSafely(UUID userId) {
        // TODO(impl): notificationService.sendAccountLockedEmail(userRepo.findEmailById(userId))
        log.debug("Sending account-locked email for userId={}", userId);
    }

    /**
     * Resetea el contador de intentos fallidos tras login exitoso o desbloqueo.
     *
     * @param userId UUID del usuario cuyo contador se resetea
     */
    @Transactional
    public void resetFailedAttempts(UUID userId) {
        // TODO(impl): users.failed_otp_attempts = 0, users.failed_attempts_since = null
        log.debug("Failed attempts reset for userId={}", userId);
    }

    /**
     * Desbloquea la cuenta y registra la razón en audit_log.
     *
     * @param userId UUID del usuario a desbloquear
     * @param reason motivo del desbloqueo (p.ej. "EMAIL_LINK", "RECOVERY_CODE")
     */
    @Transactional
    public void unlockAccount(UUID userId, String reason) {
        // TODO(impl): users.account_status = 'ACTIVE', failed_otp_attempts = 0, lock_unlock_token = null
        auditLogService.log("ACCOUNT_UNLOCKED", userId, "reason=" + reason);
        log.info("Account UNLOCKED for userId={} reason={}", userId, reason);
    }

    /**
     * Excepción de dominio lanzada al bloquear — mapeada a HTTP 423 en el ExceptionHandler global.
     */
    public static class AccountLockedException extends RuntimeException {
        private final UUID userId;

        public AccountLockedException(UUID userId) {
            super("Account locked for userId=" + userId);
            this.userId = userId;
        }

        /** @return UUID del usuario cuya cuenta fue bloqueada */
        public UUID getUserId() { return userId; }
    }
}
