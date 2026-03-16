package com.experis.sofia.bankportal.session.infrastructure.persistence;

import com.experis.sofia.bankportal.session.domain.model.DeviceInfo;
import com.experis.sofia.bankportal.session.domain.model.SessionRevocationReason;
import com.experis.sofia.bankportal.session.domain.model.UserSession;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad JPA para la tabla {@code user_sessions}.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Entity
@Table(name = "user_sessions", indexes = {
        @Index(name = "idx_user_sessions_user_active",
               columnList = "user_id"),
        @Index(name = "idx_user_sessions_jti",
               columnList = "jti", unique = true)
})
public class UserSessionEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    @Column(nullable = false, unique = true, length = 36)
    private String jti;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "device_info", columnDefinition = "jsonb")
    private DeviceInfoEmbeddable deviceInfo;

    @Column(name = "ip_masked", length = 32)
    private String ipMasked;

    @Column(name = "last_activity", nullable = false)
    private LocalDateTime lastActivity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "revoke_reason", length = 32)
    private SessionRevocationReason revokeReason;

    // ── Mapeos dominio ↔ entidad ──────────────────────────────────────────────

    public static UserSessionEntity fromDomain(UserSession session) {
        var e = new UserSessionEntity();
        e.id           = session.getId();
        e.userId       = session.getUserId();
        e.jti          = session.getJti();
        e.tokenHash    = session.getTokenHash();
        e.deviceInfo   = DeviceInfoEmbeddable.from(session.getDeviceInfo());
        e.ipMasked     = session.getIpMasked();
        e.lastActivity = session.getLastActivity();
        e.createdAt    = session.getCreatedAt();
        e.revokedAt    = session.getRevokedAt();
        e.revokeReason = session.getRevokeReason();
        return e;
    }

    public UserSession toDomain() {
        var session = new UserSession(
                id, userId, jti, tokenHash,
                deviceInfo != null ? deviceInfo.toDomain() : null,
                ipMasked, createdAt, lastActivity
        );
        if (revokedAt != null) {
            session.revoke(revokeReason);
        }
        return session;
    }

    // ── Embeddable para JSONB ─────────────────────────────────────────────────

    public record DeviceInfoEmbeddable(String os, String browser,
                                        String deviceType, String rawUserAgent) {
        public static DeviceInfoEmbeddable from(DeviceInfo d) {
            if (d == null) return new DeviceInfoEmbeddable("unknown","unknown","desktop","");
            return new DeviceInfoEmbeddable(d.os(), d.browser(), d.deviceType(), d.rawUserAgent());
        }
        public DeviceInfo toDomain() {
            return new DeviceInfo(os, browser, deviceType, rawUserAgent);
        }
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    public UUID getId()           { return id; }
    public String getJti()        { return jti; }
    public LocalDateTime getRevokedAt() { return revokedAt; }
}
