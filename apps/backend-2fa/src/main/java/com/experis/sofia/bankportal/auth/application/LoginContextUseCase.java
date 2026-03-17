package com.experis.sofia.bankportal.auth.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.auth.domain.KnownSubnet;
import com.experis.sofia.bankportal.auth.domain.KnownSubnetRepository;
import com.experis.sofia.bankportal.auth.domain.ContextConfirmToken;
import com.experis.sofia.bankportal.auth.domain.ContextConfirmTokenRepository;
import com.experis.sofia.bankportal.notification.domain.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * US-603 — Autenticación contextual: detección de subnet nueva y confirmación por email.
 *
 * <p>Flujo completo (ADR-011):
 * <ol>
 *   <li>Login OTP correcto → {@link #evaluateContext} compara subnet actual contra known_subnets</li>
 *   <li>Subnet conocida   → devuelve {@code FullSession} → JWT scope=full-session emitido</li>
 *   <li>Subnet nueva      → devuelve {@code ContextPending} → JWT scope=context-pending emitido
 *       con claim {@code pendingSubnet}</li>
 *   <li>Usuario confirma desde email deep-link → {@link #confirmContext} valida token,
 *       registra subnet, emite evento de auditoría</li>
 * </ol>
 *
 * <p>El claim {@code pendingSubnet} en el JWT de scope=context-pending permite al endpoint
 * /confirm-context verificar que la confirmación proviene de la misma red que el intento
 * original — defensa en profundidad sin estado en servidor (ADR-011 §Seguridad).
 *
 * @author SOFIA Developer Agent — FEAT-006 Sprint 7 Semana 2
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginContextUseCase {

    private final KnownSubnetRepository          knownSubnetRepository;
    private final ContextConfirmTokenRepository  confirmTokenRepository;
    private final EmailNotificationService       emailNotificationService;
    private final AuditLogService                auditLogService;

    /** TTL del token de confirmación de contexto: 30 minutos. */
    static final long CONFIRM_TOKEN_TTL_SECONDS = 1_800L;

    // ─────────────────────────────────────────────────────────────────────────
    // Sealed interface — resultado de evaluación de contexto
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resultado sellado de la evaluación del contexto de red.
     * El caller (filtro JWT) inspecciona el tipo para decidir qué scope emitir.
     */
    public sealed interface ContextEvaluationResult
            permits ContextEvaluationResult.FullSession,
                    ContextEvaluationResult.ContextPending {

        boolean isFullSession();
        boolean isContextPending();

        /** Subnet reconocida → emite JWT full-session. */
        record FullSession() implements ContextEvaluationResult {
            @Override public boolean isFullSession()    { return true;  }
            @Override public boolean isContextPending() { return false; }
        }

        /**
         * Subnet desconocida → emite JWT context-pending.
         * @param pendingSubnet subnet del intento de login (se incluye en claim JWT)
         * @param confirmToken  token de confirmación enviado por email
         */
        record ContextPending(String pendingSubnet, String confirmToken)
                implements ContextEvaluationResult {
            @Override public boolean isFullSession()    { return false; }
            @Override public boolean isContextPending() { return true;  }
        }

        // ── Factory methods ─────────────────────────────────────────────────
        static ContextEvaluationResult fullSession() {
            return new FullSession();
        }
        static ContextEvaluationResult contextPending(String subnet, String token) {
            return new ContextPending(subnet, token);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Caso 1: evaluar contexto post-OTP
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Evalúa si la subnet del login actual está entre las conocidas del usuario.
     *
     * <p>Si es nueva: genera token de confirmación, envía email y devuelve
     * {@code ContextPending} con el token y la subnet para incluirlos en el JWT.
     *
     * @param userId     identificador del usuario autenticado (OTP correcto)
     * @param userEmail  email del usuario para el envío de la confirmación
     * @param subnet     subnet del cliente (ej. "192.168.1") — primeros 3 octetos
     * @return resultado sellado
     */
    @Transactional
    public ContextEvaluationResult evaluateContext(UUID userId, String userEmail, String subnet) {
        boolean isKnown = knownSubnetRepository.existsByUserIdAndSubnet(userId, subnet);

        if (isKnown) {
            auditLogService.log("LOGIN_KNOWN_CONTEXT", userId, "subnet=" + subnet);
            log.debug("[US-603] Subnet conocida · user={} subnet={}", userId, subnet);
            return ContextEvaluationResult.fullSession();
        }

        // Subnet nueva → flujo context-pending
        String rawToken = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(CONFIRM_TOKEN_TTL_SECONDS);

        confirmTokenRepository.save(ContextConfirmToken.of(userId, subnet, rawToken, expiresAt));
        emailNotificationService.sendContextConfirmLink(userEmail, rawToken, subnet);

        auditLogService.log("LOGIN_NEW_CONTEXT_DETECTED", userId,
                "subnet=" + subnet + " confirmToken=<generated>");
        log.info("[US-603] Subnet nueva detectada · user={} subnet={}", userId, subnet);

        return ContextEvaluationResult.contextPending(subnet, rawToken);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Caso 2: confirmar contexto desde deep-link email
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Valida el token de confirmación y registra la subnet como conocida.
     *
     * <p>La verificación de que {@code currentSubnet} coincide con {@code pendingSubnet}
     * del token la realiza el caller (filtro JWT) con el claim del token. Este método
     * se limita a: validez del token + persistencia de subnet + auditoría.
     *
     * @param userId         del JWT scope=context-pending
     * @param pendingSubnet  subnet del claim JWT (verificada por filtro)
     * @param currentSubnet  subnet de la request actual (para log de auditoría)
     * @param rawToken       token recibido en el deep-link
     * @throws ContextConfirmException si el token es inválido, ya usado o expirado
     */
    @Transactional
    public void confirmContext(UUID userId, String pendingSubnet,
                               String currentSubnet, String rawToken) {

        ContextConfirmToken token = confirmTokenRepository.findByRawToken(rawToken)
                .orElseThrow(() -> new ContextConfirmException("Token no encontrado"));

        if (token.isUsed()) {
            throw new ContextConfirmException("Token ya utilizado");
        }
        if (Instant.now().isAfter(token.getExpiresAt())) {
            throw new ContextConfirmException("Token expirado");
        }
        if (!token.getUserId().equals(userId)) {
            throw new ContextConfirmException("Token no pertenece al usuario");
        }

        // Registrar subnet como conocida
        knownSubnetRepository.save(KnownSubnet.of(userId, pendingSubnet));

        token.setUsed(true);
        confirmTokenRepository.save(token);

        auditLogService.log("LOGIN_NEW_CONTEXT_CONFIRMED", userId,
                "subnet=" + pendingSubnet + " confirmFrom=" + currentSubnet);
        log.info("[US-603] Contexto confirmado · user={} subnet={}", userId, pendingSubnet);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Excepción de dominio
    // ─────────────────────────────────────────────────────────────────────────

    public static class ContextConfirmException extends RuntimeException {
        public ContextConfirmException(String message) {
            super(message);
        }
    }
}
