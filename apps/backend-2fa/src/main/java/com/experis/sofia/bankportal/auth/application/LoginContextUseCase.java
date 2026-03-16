package com.experis.sofia.bankportal.auth.application;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import com.experis.sofia.bankportal.session.domain.service.DeviceFingerprintService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Caso de uso US-603 — Autenticación contextual por subnet IP.
 *
 * <p>Evalúa si la subnet IP actual es conocida para el usuario.
 * Si es nueva → emite JWT {@code context-pending} (ADR-011) y envía email de confirmación.
 * Si es conocida → permite emisión de JWT {@code full-session} directamente.
 *
 * <p>Patrón ADR-007: token de confirmación HMAC-SHA256, TTL 15min, one-time use Redis.
 *
 * <p>RV-S7-003 fix: eliminado import no usado {@code java.security.MessageDigest}.
 *
 * @author SOFIA Developer Agent — FEAT-006 US-603 Sprint 7
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginContextUseCase {

    private final DeviceFingerprintService fingerprintService;
    private final AuditLogService          auditLogService;
    // TODO(impl): KnownSubnetRepository, EmailService, JwtService

    @Value("${context.confirm.hmac-key}")
    private String confirmHmacKey;

    @Value("${login.context.enabled:true}")
    private boolean contextCheckEnabled;

    @Value("${context.confirm.ttl-minutes:15}")
    private int confirmTtlMinutes;

    /**
     * Evalúa el contexto de login tras OTP correcto.
     *
     * @param userId ID del usuario autenticado
     * @param rawIp  IP del request de login
     * @return {@link ContextEvaluationResult} indicando si emitir full-session o context-pending
     */
    @Transactional
    public ContextEvaluationResult evaluate(UUID userId, String rawIp) {
        if (!contextCheckEnabled) {
            return ContextEvaluationResult.fullSession();
        }

        String subnet       = fingerprintService.extractIpSubnet(rawIp);
        boolean subnetKnown = isSubnetKnown(userId, subnet);

        if (subnetKnown) {
            log.debug("Known subnet {} for userId={} — full session", subnet, userId);
            return ContextEvaluationResult.fullSession();
        }

        log.info("New subnet {} detected for userId={} — context-pending required", subnet, userId);

        String confirmToken = generateConfirmToken(userId, subnet);
        // TODO(impl): knownSubnetRepo.save(KnownSubnet(userId, subnet, confirmed=false))
        // TODO(impl): emailService.sendContextConfirmEmail(userId, confirmToken, confirmTtlMinutes)

        auditLogService.log("LOGIN_NEW_CONTEXT_DETECTED", userId, "subnet=" + subnet);

        return ContextEvaluationResult.contextPending(subnet, confirmToken);
    }

    /**
     * Confirma el contexto desde el enlace del email.
     *
     * @param userId        del claim JWT context-pending
     * @param pendingSubnet del claim JWT context-pending
     * @param currentSubnet subnet actual del request de confirmación
     * @param confirmToken  token HMAC del email
     * @throws ContextConfirmException si subnet mismatch o token inválido
     */
    @Transactional
    public void confirmContext(UUID userId, String pendingSubnet,
                                String currentSubnet, String confirmToken) {
        if (!pendingSubnet.equals(currentSubnet)) {
            log.warn("Subnet mismatch userId={} pending={} current={}",
                    userId, pendingSubnet, currentSubnet);
            throw new ContextConfirmException("SUBNET_MISMATCH",
                    "La confirmación debe realizarse desde la misma red.");
        }

        if (!verifyConfirmToken(confirmToken, userId, pendingSubnet)) {
            throw new ContextConfirmException("TOKEN_INVALID",
                    "El token de confirmación es inválido o ha expirado.");
        }

        // TODO(impl): knownSubnetRepo.confirmSubnet(userId, pendingSubnet)
        auditLogService.log("LOGIN_NEW_CONTEXT_CONFIRMED", userId, "subnet=" + pendingSubnet);
        log.info("Context confirmed for userId={} subnet={}", userId, pendingSubnet);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean isSubnetKnown(UUID userId, String subnet) {
        // TODO(impl): knownSubnetRepo.existsConfirmed(userId, subnet)
        return false; // placeholder
    }

    private String generateConfirmToken(UUID userId, String subnet) {
        try {
            String payload = userId + ":" + subnet + ":" + System.currentTimeMillis();
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(confirmHmacKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String sig = HexFormat.of().formatHex(
                    mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
            return java.util.Base64.getUrlEncoder().withoutPadding()
                    .encodeToString((payload + ":" + sig).getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Token generation failed", e);
        }
    }

    private boolean verifyConfirmToken(String token, UUID userId, String subnet) {
        // TODO(impl): verificar HMAC + TTL + one-time use Redis (patrón ValidateTrustedDeviceUseCase)
        return token != null && !token.isBlank();
    }

    // ── Sealed result + Exceptions ────────────────────────────────────────────

    public sealed interface ContextEvaluationResult
            permits ContextEvaluationResult.FullSession, ContextEvaluationResult.ContextPending {

        record FullSession()                              implements ContextEvaluationResult {}
        record ContextPending(String subnet, String confirmToken) implements ContextEvaluationResult {}

        static ContextEvaluationResult fullSession()                      { return new FullSession(); }
        static ContextEvaluationResult contextPending(String s, String t) { return new ContextPending(s, t); }

        default boolean isFullSession()    { return this instanceof FullSession; }
        default boolean isContextPending() { return this instanceof ContextPending; }
    }

    public static class ContextConfirmException extends RuntimeException {
        private final String code;
        public ContextConfirmException(String code, String message) {
            super(message);
            this.code = code;
        }
        public String getCode() { return code; }
    }
}
