package com.experis.sofia.bankportal.session.application.usecase;

import com.experis.sofia.bankportal.session.domain.model.SessionRevocationReason;
import com.experis.sofia.bankportal.session.domain.repository.UserSessionRepository;
import com.experis.sofia.bankportal.session.infrastructure.cache.SessionRedisAdapter;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Caso de uso US-102 — Revocar una sesión individual con confirmación OTP.
 *
 * <p>Flujo:
 * <ol>
 *   <li>Verificar OTP del usuario</li>
 *   <li>Validar que la sesión existe, pertenece al usuario y no es la actual</li>
 *   <li>Añadir JTI a la blacklist Redis</li>
 *   <li>Marcar sesión como revocada en PostgreSQL</li>
 *   <li>Registrar evento en audit_log</li>
 * </ol>
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Service
@RequiredArgsConstructor
public class RevokeSessionUseCase {

    private final UserSessionRepository sessionRepository;
    private final SessionRedisAdapter   redisAdapter;
    private final TwoFactorService      twoFactorService;
    private final AuditLogService       auditLogService;

    /**
     * @param sessionId  ID de la sesión a revocar
     * @param userId     ID del usuario autenticado (protección IDOR)
     * @param currentJti JTI de la sesión actual (no se puede revocar)
     * @param otpCode    código OTP de confirmación
     * @throws InvalidOtpException          si el OTP es incorrecto
     * @throws SessionNotFoundException     si la sesión no existe o ya fue revocada
     * @throws CannotRevokeCurrentException si se intenta revocar la sesión actual
     */
    @Transactional
    public void execute(UUID sessionId, UUID userId, String currentJti, String otpCode) {
        // 1. Verificar OTP
        twoFactorService.verifyCurrentOtp(userId, otpCode);

        // 2. Obtener sesión (protección IDOR: busca por sessionId + userId)
        var session = sessionRepository.findActiveByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        // 3. Impedir revocar la sesión actual
        if (session.getJti().equals(currentJti)) {
            throw new CannotRevokeCurrentSessionException();
        }

        // 4. Calcular TTL restante del JWT (max 60 min - tiempo transcurrido)
        long minutesElapsed = Duration.between(session.getCreatedAt(), LocalDateTime.now()).toMinutes();
        long remainingMinutes = Math.max(1, 60 - minutesElapsed);

        // 5. Blacklist en Redis
        redisAdapter.addToBlacklist(session.getJti(), Duration.ofMinutes(remainingMinutes));

        // 6. Marcar como revocada en PostgreSQL
        session.revoke(SessionRevocationReason.MANUAL);
        sessionRepository.save(session);

        // 7. Audit log
        auditLogService.log("SESSION_REVOKED", userId, session.getId().toString());
    }

    // ── Excepciones de dominio ────────────────────────────────────────────────

    public static class SessionNotFoundException extends RuntimeException {
        public SessionNotFoundException(UUID id) {
            super("SESSION_NOT_FOUND: " + id);
        }
    }

    public static class CannotRevokeCurrentSessionException extends RuntimeException {
        public CannotRevokeCurrentSessionException() {
            super("CANNOT_REVOKE_CURRENT_SESSION");
        }
    }
}
