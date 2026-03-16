package com.experis.sofia.bankportal.session.application.usecase;

import com.experis.sofia.bankportal.session.domain.model.SessionRevocationReason;
import com.experis.sofia.bankportal.session.domain.repository.UserSessionRepository;
import com.experis.sofia.bankportal.session.infrastructure.cache.SessionRedisAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Caso de uso US-105b — Denegar sesión desde enlace de email "No fui yo".
 *
 * Implementa ADR-007 completo: token HMAC-SHA256 firmado con:
 * {@code HMAC-SHA256(key, "{jti}:{userId}:{expiresAt}")}
 *
 * Protecciones:
 * <ul>
 *   <li>Firma HMAC verificada contra clave del servidor</li>
 *   <li>TTL 24h — token expirado rechazado</li>
 *   <li>One-time use — Redis SET con TTL verifica uso único</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-002 cierre Sprint 4
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DenySessionByLinkUseCase {

    private final UserSessionRepository sessionRepository;
    private final SessionRedisAdapter   redisAdapter;
    private final AuditLogService       auditLogService;

    @Value("${session.deny-link.hmac-key}")
    private String hmacKey;

    @Value("${session.deny-link.ttl-hours:24}")
    private int ttlHours;

    private static final String DENY_USED_PREFIX = "sessions:deny-used:";

    /**
     * Genera un deny token para incluir en el email de alerta (US-105).
     *
     * @param jti       JWT ID de la sesión sospechosa
     * @param userId    ID del usuario propietario
     * @return token Base64URL firmado con HMAC-SHA256
     */
    public String generateDenyToken(String jti, UUID userId) {
        long expiresAt = Instant.now().plusSeconds((long) ttlHours * 3600).getEpochSecond();
        String payload = jti + ":" + userId + ":" + expiresAt;
        String signature = computeHmac(payload);
        String token = Base64.getUrlEncoder().withoutPadding()
                .encodeToString((payload + ":" + signature).getBytes(StandardCharsets.UTF_8));
        log.debug("Generated deny token for jti={} userId={}", jti, userId);
        return token;
    }

    /**
     * Verifica y ejecuta la denegación de una sesión desde el enlace del email.
     *
     * @param rawToken token extraído de la URL
     * @throws InvalidDenyTokenException si el token es inválido, expirado o ya usado
     */
    @Transactional
    public void execute(String rawToken) {
        // 1. Decodificar
        String decoded;
        try {
            decoded = new String(Base64.getUrlDecoder().decode(rawToken), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new InvalidDenyTokenException("TOKEN_INVALID");
        }

        // 2. Parsear payload: jti:userId:expiresAt:signature
        String[] parts = decoded.split(":");
        if (parts.length != 4) throw new InvalidDenyTokenException("TOKEN_INVALID");

        String jti       = parts[0];
        String userId    = parts[1];
        String expiresAt = parts[2];
        String signature = parts[3];

        // 3. Verificar firma HMAC
        String expectedSig = computeHmac(jti + ":" + userId + ":" + expiresAt);
        if (!constantTimeEquals(signature, expectedSig)) {
            throw new InvalidDenyTokenException("TOKEN_INVALID");
        }

        // 4. Verificar TTL
        long expiry = Long.parseLong(expiresAt);
        if (Instant.now().getEpochSecond() > expiry) {
            throw new InvalidDenyTokenException("TOKEN_EXPIRED");
        }

        // 5. Verificar one-time use (Redis)
        String usedKey = DENY_USED_PREFIX + jti;
        if (Boolean.TRUE.equals(redisAdapter.hasKey(usedKey))) {
            throw new InvalidDenyTokenException("TOKEN_ALREADY_USED");
        }
        redisAdapter.setKey(usedKey, "1", Duration.ofHours(ttlHours + 1));

        // 6. Revocar la sesión
        var userUuid = UUID.fromString(userId);
        sessionRepository.findActiveByJti(jti).ifPresent(session -> {
            long minutesElapsed = Duration.between(session.getCreatedAt(),
                    LocalDateTime.now()).toMinutes();
            long remaining = Math.max(1, 60 - minutesElapsed);

            redisAdapter.addToBlacklist(jti, Duration.ofMinutes(remaining));
            session.revoke(SessionRevocationReason.DENY_LINK);
            sessionRepository.save(session);
            auditLogService.log("SESSION_DENIED_BY_USER", userUuid, session.getId().toString());
            log.info("Session denied by email link: jti={} userId={}", jti, userId);
        });
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private String computeHmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] result = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(result);
        } catch (Exception e) {
            throw new IllegalStateException("HMAC computation failed", e);
        }
    }

    /** Comparación en tiempo constante para prevenir timing attacks. */
    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        byte[] ba = a.getBytes(StandardCharsets.UTF_8);
        byte[] bb = b.getBytes(StandardCharsets.UTF_8);
        if (ba.length != bb.length) return false;
        int result = 0;
        for (int i = 0; i < ba.length; i++) result |= ba[i] ^ bb[i];
        return result == 0;
    }

    public static class InvalidDenyTokenException extends RuntimeException {
        private final String code;
        public InvalidDenyTokenException(String code) {
            super(code);
            this.code = code;
        }
        public String getCode() { return code; }
    }
}
