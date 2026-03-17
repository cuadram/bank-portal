package com.experis.sofia.bankportal.auth.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.auth.domain.UnlockToken;
import com.experis.sofia.bankportal.auth.domain.UnlockTokenRepository;
import com.experis.sofia.bankportal.auth.domain.UserAccountRepository;
import com.experis.sofia.bankportal.notification.domain.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * US-602 — Desbloqueo de cuenta mediante enlace enviado por email.
 *
 * <p>Requisitos:
 * <ul>
 *   <li>R-F6-002: token HMAC con TTL 1h (patrón ADR-007 reutilizado)</li>
 *   <li>R-SEC-004: respuesta 204 sin indicar si el email existe (anti-enumeration)</li>
 *   <li>R-SEC-005: token de un solo uso — invalidado tras primer uso</li>
 *   <li>R-SEC-006: token invalidado si la cuenta se desbloquea por otro medio</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-006 Sprint 7 Semana 2
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountUnlockUseCase {

    private final UserAccountRepository     userAccountRepository;
    private final UnlockTokenRepository     unlockTokenRepository;
    private final EmailNotificationService  emailNotificationService;
    private final AuditLogService           auditLogService;

    /** TTL del token de desbloqueo: 1 hora (ADR-007 pattern). */
    static final long TOKEN_TTL_SECONDS = 3_600L;

    // ─────────────────────────────────────────────────────────────────────────
    // Caso 1: solicitar desbloqueo
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Genera un token de desbloqueo y lo envía al email registrado.
     *
     * <p>Siempre retorna sin excepción: si el email no existe o la cuenta no está
     * bloqueada, se descarta silenciosamente (R-SEC-004 anti-enumeration).
     *
     * @param email email introducido por el usuario en la pantalla de cuenta bloqueada
     */
    @Transactional
    public void requestUnlock(String email) {
        userAccountRepository.findByEmail(email)
            .filter(user -> "LOCKED".equals(user.getAccountStatus()))
            .ifPresent(user -> {
                // Invalida tokens anteriores pendientes para este usuario
                unlockTokenRepository.invalidateAllForUser(user.getId());

                String rawToken = UUID.randomUUID().toString();
                Instant expiresAt = Instant.now().plusSeconds(TOKEN_TTL_SECONDS);

                unlockTokenRepository.save(UnlockToken.of(user.getId(), rawToken, expiresAt));
                emailNotificationService.sendUnlockLink(email, rawToken);

                auditLogService.log("UNLOCK_LINK_SENT", user.getId(),
                        "email=<masked> ttl=" + TOKEN_TTL_SECONDS + "s");
                log.info("[US-602] Unlock link enviado · user={}", user.getId());
            });
        // Si email no encontrado o cuenta no LOCKED → no-op silencioso (anti-enumeration)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Caso 2: confirmar desbloqueo desde deep-link email
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Desbloquea la cuenta si el token es válido y no ha expirado.
     *
     * @param rawToken token incluido en el enlace del email
     * @throws UnlockTokenException si el token es inválido, ya usado o expirado
     */
    @Transactional
    public void unlockByToken(String rawToken) {
        UnlockToken token = unlockTokenRepository.findByRawToken(rawToken)
                .orElseThrow(() -> new UnlockTokenException("Token no encontrado"));

        if (token.isUsed()) {
            throw new UnlockTokenException("Token ya utilizado");
        }
        if (Instant.now().isAfter(token.getExpiresAt())) {
            throw new UnlockTokenException("Token expirado");
        }

        userAccountRepository.findById(token.getUserId()).ifPresent(user -> {
            user.setAccountStatus("ACTIVE");
            user.setFailedOtpAttempts(0);
            user.setLockedAt(null);
            userAccountRepository.save(user);
        });

        token.setUsed(true);
        unlockTokenRepository.save(token);

        auditLogService.log("ACCOUNT_UNLOCKED", token.getUserId(),
                "method=email-token");
        log.info("[US-602] Cuenta desbloqueada · user={}", token.getUserId());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Excepción de dominio
    // ─────────────────────────────────────────────────────────────────────────

    public static class UnlockTokenException extends RuntimeException {
        public UnlockTokenException(String message) {
            super(message);
        }
    }
}
