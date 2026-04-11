package com.experis.sofia.bankportal.trusteddevice.infrastructure;

import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDevice;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class JdbcTrustedDeviceRepository implements TrustedDeviceRepository {

    private final JdbcClient jdbc;

    @Override
    public TrustedDevice save(TrustedDevice d) {
        try {
            int u = jdbc.sql("UPDATE trusted_devices SET last_used_at=:lu,revoked_at=:ra,revoke_reason=:rr WHERE id=:id")
                .param("lu",d.getLastUsedAt()).param("ra",d.getRevokedAt())
                .param("rr",d.getRevokeReason()).param("id",d.getId()).update();
            if(u==0)
                jdbc.sql("INSERT INTO trusted_devices (id,user_id,token_hash,device_fingerprint_hash,device_os,device_browser,ip_masked,created_at,last_used_at,expires_at) " +
                         "VALUES (:id,:uid,:th,:fp,:os,:br,:ip,:ca,:lu,:ea)")
                    .param("id",d.getId()).param("uid",d.getUserId()).param("th",d.getTokenHash())
                    .param("fp",d.getDeviceFingerprintHash()).param("os",d.getDeviceOs())
                    .param("br",d.getDeviceBrowser()).param("ip",d.getIpMasked())
                    .param("ca",d.getCreatedAt()).param("lu",d.getLastUsedAt())
                    .param("ea",d.getExpiresAt()).update();
        } catch(Exception ignored) {}
        return d;
    }

    @Override
    public Optional<TrustedDevice> findActiveByTokenHash(String tokenHash) {
        try {
            return jdbc.sql("SELECT id,user_id,token_hash,device_fingerprint_hash,device_os,device_browser,ip_masked,created_at,last_used_at,expires_at FROM trusted_devices WHERE token_hash=:h AND revoked_at IS NULL AND expires_at>now()")
                .param("h",tokenHash).query(this::map).optional();
        } catch(Exception e) { return Optional.empty(); }
    }

    @Override
    public List<TrustedDevice> findAllActiveByUserId(UUID userId) {
        try {
            return jdbc.sql("SELECT id,user_id,token_hash,device_fingerprint_hash,device_os,device_browser,ip_masked,created_at,last_used_at,expires_at FROM trusted_devices WHERE user_id=:uid AND revoked_at IS NULL AND expires_at>now()")
                .param("uid",userId).query(this::map).list();
        } catch(Exception e) { return List.of(); }
    }

    @Override
    public int countActiveByUserId(UUID userId) {
        try {
            return jdbc.sql("SELECT COUNT(*) FROM trusted_devices WHERE user_id=:uid AND revoked_at IS NULL AND expires_at>now()")
                .param("uid",userId).query(Integer.class).single();
        } catch(Exception e) { return 0; }
    }

    @Override
    public Optional<TrustedDevice> findActiveByUserIdAndFingerprint(UUID userId, String fingerprintHash) {
        try {
            return jdbc.sql("SELECT id,user_id,token_hash,device_fingerprint_hash,device_os,device_browser,ip_masked,created_at,last_used_at,expires_at FROM trusted_devices WHERE user_id=:uid AND device_fingerprint_hash=:fp AND revoked_at IS NULL AND expires_at>now()")
                .param("uid",userId).param("fp",fingerprintHash).query(this::map).optional();
        } catch(Exception e) { return Optional.empty(); }
    }

    private TrustedDevice map(java.sql.ResultSet rs, int n) throws java.sql.SQLException {
        return new TrustedDevice(
            (UUID)rs.getObject("id"), (UUID)rs.getObject("user_id"),
            rs.getString("token_hash"), rs.getString("device_fingerprint_hash"),
            rs.getString("device_os"), rs.getString("device_browser"), rs.getString("ip_masked"),
            rs.getTimestamp("created_at")!=null ? rs.getTimestamp("created_at").toLocalDateTime() : null,
            rs.getTimestamp("last_used_at")!=null ? rs.getTimestamp("last_used_at").toLocalDateTime() : null,
            rs.getTimestamp("expires_at")!=null ? rs.getTimestamp("expires_at").toLocalDateTime() : null
        );
    }
}
