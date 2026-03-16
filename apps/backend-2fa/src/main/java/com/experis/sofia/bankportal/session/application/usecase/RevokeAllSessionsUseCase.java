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
 * Caso de uso US-102 — Revocar TODAS las sesiones excepto la actual.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Service
@RequiredArgsConstructor
public class RevokeAllSessionsUseCase {

    private final UserSessionRepository sessionRepository;
    private final SessionRedisAdapter   redisAdapter;
    private final TwoFactorService      twoFactorService;
    private final AuditLogService       auditLogService;

    /**
     * @param userId     ID del usuario autenticado
     * @param currentJti JTI de la sesión actual — se excluye de la revocación
     * @param otpCode    código OTP de confirmación
     */
    @Transactional
    public void execute(UUID userId, String currentJti, String otpCode) {
        // 1. Verificar OTP
        twoFactorService.verifyCurrentOtp(userId, otpCode);

        // 2. Obtener todas las sesiones activas excepto la actual
        var sessionsToRevoke = sessionRepository.findAllActiveByUserId(userId).stream()
                .filter(s -> !s.getJti().equals(currentJti))
                .toList();

        // 3. Revocar cada sesión: blacklist Redis + mark en PostgreSQL
        for (var session : sessionsToRevoke) {
            long minutesElapsed = Duration.between(session.getCreatedAt(), LocalDateTime.now()).toMinutes();
            long remaining = Math.max(1, 60 - minutesElapsed);

            redisAdapter.addToBlacklist(session.getJti(), Duration.ofMinutes(remaining));
            session.revoke(SessionRevocationReason.MANUAL);
            sessionRepository.save(session);
        }

        // 4. Audit log
        auditLogService.log("SESSION_REVOKE_ALL", userId,
                "revoked=" + sessionsToRevoke.size());
    }
}
