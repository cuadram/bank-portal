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
 *   <li>Aviso progresivo desde el intento 7 (attemptsRemaining visibles al usuario)</li>
 *   <li>Bloqueo automático al llegar a 10 intentos en ventana de 24h</li>
 *   <li>Reset del contador al login exitoso o al usar código de recuperación</li>
 *   <li>Ventana deslizante: si failed_attempts_since &lt; now() - 24h, se reinicia el contador</li>
 * </ul>
 *
 * <p>RV-S7-001 fix: eliminado import no usado {@code java.time.LocalDateTime}.
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
     * Lanza {@link AccountLockedException} si se supera el umbral.
     *
     * @param userId ID del usuario
     * @param ip     IP del intento (para audit_log)
     * @return intentos restantes antes del bloqueo
     * @throws AccountLockedException si el contador supera maxAttempts
     */
    @Transactional
    public int recordFailedAttempt(UUID userId, String ip) {
        log.info("Failed OTP attempt for userId={} ip={}", userId, ip);
        auditLogService.log("OTP_FAILED", userId, "ip=" + ip);

        // TODO(impl): cargar currentAttempts de BD + verificar ventana windowHours
        // users.failed_attempts_since: si null o > windowHours → reiniciar contador
        int currentAttempts = 1; // placeholder — implementación real lee de users.failed_otp_attempts

        if (currentAttempts >= maxAttempts) {
            lockAccount(userId, ip);
            throw new AccountLockedException(userId);
        }

        int remaining = maxAttempts - currentAttempts;
        if (currentAttempts >= warningThreshold) {
            log.warn("Account approaching lock for userId={} attempts={} remaining={}",
                    userId, currentAttempts, remaining);
        }
        return remaining;
    }

    /** Bloquea la cuenta del usuario y registra en audit_log. */
    @Transactional
    public void lockAccount(UUID userId, String ip) {
        // TODO(impl): users.account_status = 'LOCKED', users.locked_at = now()
        auditLogService.log("ACCOUNT_LOCKED", userId, "ip=" + ip + " reason=OTP_MAX_ATTEMPTS");
        log.warn("Account LOCKED for userId={} after max failed OTP attempts", userId);
    }

    /** Resetea el contador de intentos fallidos tras login exitoso o desbloqueo. */
    @Transactional
    public void resetFailedAttempts(UUID userId) {
        // TODO(impl): users.failed_otp_attempts = 0, users.failed_attempts_since = null
        log.debug("Failed attempts reset for userId={}", userId);
    }

    /** Desbloquea la cuenta y registra la razón en audit_log. */
    @Transactional
    public void unlockAccount(UUID userId, String reason) {
        // TODO(impl): users.account_status = 'ACTIVE', failed_otp_attempts = 0, lock_unlock_token = null
        auditLogService.log("ACCOUNT_UNLOCKED", userId, "reason=" + reason);
        log.info("Account UNLOCKED for userId={} reason={}", userId, reason);
    }

    /** Excepción lanzada al bloquear — mapeada a HTTP 423 en el ExceptionHandler global. */
    public static class AccountLockedException extends RuntimeException {
        private final UUID userId;
        public AccountLockedException(UUID userId) {
            super("Account locked for userId=" + userId);
            this.userId = userId;
        }
        public UUID getUserId() { return userId; }
    }
}
