package com.experis.sofia.bankportal.profile.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.profile.domain.RevokedToken;
import com.experis.sofia.bankportal.profile.domain.RevokedTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ManageSessionsUseCase {

    private static final String JTI_PREFIX = "jti:revoked:";

    private final RevokedTokenRepository revokedRepo;
    private final StringRedisTemplate    redis;
    private final AuditLogService        auditLog;

    @Transactional
    public void revoke(UUID userId, String jtiToRevoke, String currentJti, Instant tokenExpiresAt) {
        if (jtiToRevoke.equals(currentJti))
            throw new SessionException("CANNOT_REVOKE_CURRENT_SESSION");

        revokedRepo.findByJtiAndUserId(jtiToRevoke, userId)
                .orElseThrow(() -> new SessionException("SESSION_NOT_FOUND"));

        // Redis blacklist — TTL = tiempo restante del token
        Duration ttl = Duration.between(Instant.now(), tokenExpiresAt);
        if (!ttl.isNegative())
            redis.opsForValue().set(JTI_PREFIX + jtiToRevoke, userId.toString(), ttl);

        // Audit trail PG
        RevokedToken rt = new RevokedToken();
        rt.setJti(jtiToRevoke); rt.setUserId(userId);
        rt.setExpiresAt(LocalDateTime.ofInstant(tokenExpiresAt, ZoneOffset.UTC));
        revokedRepo.save(rt);

        auditLog.log("SESSION_REVOKED", userId, "jti=" + jtiToRevoke);
        log.info("[US-1205] Sesión revocada userId={} jti={}", userId, jtiToRevoke);
    }

    public boolean isRevoked(String jti) {
        return Boolean.TRUE.equals(redis.hasKey(JTI_PREFIX + jti))
                || revokedRepo.existsByJti(jti);
    }

    public static class SessionException extends RuntimeException {
        public SessionException(String code) { super(code); }
    }
}
