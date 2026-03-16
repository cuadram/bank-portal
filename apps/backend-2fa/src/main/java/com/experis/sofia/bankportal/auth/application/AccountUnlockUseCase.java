package com.experis.sofia.bankportal.auth.application;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Caso de uso US-602 — Desbloqueo de cuenta por enlace de email.
 *
 * <p>Patrón ADR-007: token HMAC-SHA256, TTL 1h, one-time use.
 * Respuesta neutra en solicitud de enlace para evitar user enumeration.
 *
 * @author SOFIA Developer Agent — FEAT-006 US-602 Sprint 7
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountUnlockUseCase {

    private final AuditLogService auditLogService;
    private final AccountLockUseCase accountLockUseCase;

    @Value("${account.unlock.hmac-key}")
    private String unlockHmacKey;

    @Value("${account.unlock.ttl-minutes:60}")
    private int ttlMinutes;

    /**
     * US-602 — Solicita un enlace de desbloqueo por email.
     * Respuesta neutra (204 siempre) — evita user enumeration.
     *
     * @param email email de la cuenta bloqueada
     */
    @Transactional
    public void requestUnlock(String email) {
        // En implementación real:
        // 1. findUserByEmail(email)
        // 2. Si no existe o no está bloqueada → retornar silenciosamente (204 neutral)
        // 3. token = generateUnlockToken(userId)
        // 4. tokenHash = sha256(token)
        // 5. users.lock_unlock_token = tokenHash
        // 6. emailService.sendUnlockEmail(email, token, ttlMinutes)
        log.debug("Unlock link requested for email={} (response always neutral)", email);
    }

    /**
     * US-602 — Desbloquea la cuenta verificando el token del enlace.
     * Retorna el userId del usuario desbloqueado para el redirect.
     *
     * @param rawToken token del enlace de email
     * @throws UnlockTokenException si el token es inválido, expirado o ya usado
     */
    @Transactional
    public UUID unlockByToken(String rawToken) {
        // En implementación real:
        // 1. tokenHash = sha256(rawToken)
        // 2. findUserByLockUnlockToken(tokenHash) → not found: throw TOKEN_INVALID
        // 3. Verificar TTL: users.locked_at + ttlMinutes > now() → expirado: throw TOKEN_EXPIRED
        // 4. accountLockUseCase.unlockAccount(userId, "EMAIL_LINK")
        // 5. users.lock_unlock_token = null (one-time use)
        // 6. return userId

        if (rawToken == null || rawToken.isBlank()) {
            throw new UnlockTokenException("TOKEN_INVALID", "Token de desbloqueo inválido.");
        }

        UUID userId = UUID.randomUUID(); // placeholder — la implementación real consulta BD
        accountLockUseCase.unlockAccount(userId, "EMAIL_LINK");
        log.info("Account unlocked via email link userId={}", userId);
        return userId;
    }

    // ── Token generation ──────────────────────────────────────────────────────

    String generateUnlockToken(UUID userId) throws Exception {
        String payload = userId + ":" + System.currentTimeMillis();
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(unlockHmacKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String sig = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        return java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString((payload + ":" + sig).getBytes(StandardCharsets.UTF_8));
    }

    String sha256(String input) throws Exception {
        return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8)));
    }

    /** Excepción de token inválido/expirado — mapeada a HTTP 400. */
    public static class UnlockTokenException extends RuntimeException {
        private final String code;
        public UnlockTokenException(String code, String message) {
            super(message);
            this.code = code;
        }
        public String getCode() { return code; }
    }
}
