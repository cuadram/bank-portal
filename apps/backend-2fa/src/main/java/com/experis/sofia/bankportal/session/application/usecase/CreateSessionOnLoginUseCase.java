package com.experis.sofia.bankportal.session.application.usecase;

import com.experis.sofia.bankportal.session.domain.model.DeviceInfo;
import com.experis.sofia.bankportal.session.domain.model.SessionRevocationReason;
import com.experis.sofia.bankportal.session.domain.model.UserSession;
import com.experis.sofia.bankportal.session.domain.repository.UserSessionRepository;
import com.experis.sofia.bankportal.session.domain.service.SessionDomainService;
import com.experis.sofia.bankportal.session.infrastructure.cache.SessionRedisAdapter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Caso de uso US-104 — Crear sesión con control de concurrencia LRU.
 * Invocado por AuthService tras login 2FA exitoso.
 *
 * <p>Si el usuario ya tiene {@code MAX_CONCURRENT_SESSIONS} sesiones activas,
 * la sesión LRU (menos recientemente activa) es eviccionada automáticamente.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Service
@RequiredArgsConstructor
public class CreateSessionOnLoginUseCase {

    private final UserSessionRepository sessionRepository;
    private final SessionRedisAdapter   redisAdapter;
    private final SessionDomainService  domainService;
    private final AuditLogService       auditLogService;

    /**
     * @param userId     ID del usuario que acaba de autenticarse
     * @param jti        JWT ID único del token emitido
     * @param tokenHash  SHA-256 del JWT para auditoría
     * @param deviceInfo información del dispositivo extraída del User-Agent
     * @param rawIp      IP del cliente (se enmascara antes de persistir)
     * @param sessionTimeoutMinutes timeout configurado por el usuario
     * @return la sesión recién creada
     */
    @Transactional
    public UserSession execute(UUID userId, String jti, String tokenHash,
                               DeviceInfo deviceInfo, String rawIp,
                               int sessionTimeoutMinutes) {

        // 1. Obtener sesiones activas
        var activeSessions = sessionRepository.findAllActiveByUserId(userId);

        // 2. Evicción LRU si se supera el límite
        if (activeSessions.size() >= SessionDomainService.MAX_CONCURRENT_SESSIONS) {
            var lruSession = domainService.findLruSession(activeSessions);

            long minutesElapsed = Duration.between(lruSession.getCreatedAt(),
                    LocalDateTime.now()).toMinutes();
            long remaining = Math.max(1, 60 - minutesElapsed);

            redisAdapter.addToBlacklist(lruSession.getJti(), Duration.ofMinutes(remaining));
            lruSession.revoke(SessionRevocationReason.SESSION_EVICTED);
            sessionRepository.save(lruSession);

            auditLogService.log("SESSION_EVICTED", userId, lruSession.getId().toString());
        }

        // 3. Crear nueva sesión
        var now = LocalDateTime.now();
        var newSession = new UserSession(
                UUID.randomUUID(), userId, jti, tokenHash, deviceInfo,
                domainService.maskIp(rawIp), now, now
        );
        sessionRepository.save(newSession);

        // 4. Registrar en Redis (para lookup rápido de actividad)
        redisAdapter.setActiveSession(userId.toString(), jti,
                newSession.getId().toString(),
                Duration.ofMinutes(sessionTimeoutMinutes));

        return newSession;
    }
}
