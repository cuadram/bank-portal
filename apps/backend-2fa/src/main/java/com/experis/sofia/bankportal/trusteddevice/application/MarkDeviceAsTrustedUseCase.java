package com.experis.sofia.bankportal.trusteddevice.application;

import com.experis.sofia.bankportal.session.domain.model.DeviceInfo;
import com.experis.sofia.bankportal.session.domain.service.DeviceFingerprintService;
import com.experis.sofia.bankportal.session.domain.service.SessionDomainService;
import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDevice;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDeviceRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Caso de uso US-201 — Marcar dispositivo como de confianza tras login 2FA.
 *
 * Genera un trust token HMAC firmado y lo persiste como cookie HttpOnly (ADR-008):
 * {@code Set-Cookie: bp_trust=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/login; Max-Age=2592000}
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MarkDeviceAsTrustedUseCase {

    private static final int  MAX_TRUSTED_DEVICES = 10;
    private static final int  TRUST_TTL_DAYS      = 30;
    private static final String COOKIE_NAME       = "bp_trust";

    private final TrustedDeviceRepository  deviceRepository;
    private final DeviceFingerprintService fingerprintService;
    private final SessionDomainService     domainService;
    private final AuditLogService          auditLogService;

    @Value("${trusted-device.hmac-key}")
    private String hmacKey;

    @Value("${spring.profiles.active:prod}")
    private String activeProfile;

    /**
     * Marca el dispositivo actual como de confianza.
     * Si ya existe un trust token válido para ese fingerprint, lo renueva.
     * Si el usuario tiene 10 dispositivos de confianza, eviciona el menos usado (LRU).
     *
     * @param userId     ID del usuario autenticado
     * @param deviceInfo info del dispositivo extraída del User-Agent
     * @param rawIp      IP del cliente (se enmascara)
     * @param response   HttpServletResponse para establecer la cookie
     */
    @Transactional
    public void execute(UUID userId, DeviceInfo deviceInfo, String rawIp,
                         HttpServletResponse response) {

        String ipSubnet    = fingerprintService.extractIpSubnet(rawIp);
        String fingerprint = fingerprintService.computeHash(deviceInfo.rawUserAgent(), ipSubnet);

        // Revocar trust anterior del mismo fingerprint si existe
        deviceRepository.findActiveByUserIdAndFingerprint(userId, fingerprint)
                .ifPresent(existing -> {
                    existing.revoke("RENEWED");
                    deviceRepository.save(existing);
                });

        // Evicción LRU si se supera el límite
        int count = deviceRepository.countActiveByUserId(userId);
        if (count >= MAX_TRUSTED_DEVICES) {
            deviceRepository.findAllActiveByUserId(userId).stream()
                    .min((a, b) -> a.getLastUsedAt().compareTo(b.getLastUsedAt()))
                    .ifPresent(lru -> {
                        lru.revoke("LRU_EVICTION");
                        deviceRepository.save(lru);
                        log.info("Evicted LRU trusted device for userId={}", userId);
                    });
        }

        // Generar trust token
        String token     = generateTrustToken(userId, fingerprint);
        String tokenHash = sha256(token);

        // Persistir en BD
        var now       = LocalDateTime.now();
        var expiresAt = now.plusDays(TRUST_TTL_DAYS);
        var device = new TrustedDevice(
                UUID.randomUUID(), userId, tokenHash, fingerprint,
                deviceInfo.os(), deviceInfo.browser(),
                domainService.maskIp(rawIp), now, now, expiresAt
        );
        deviceRepository.save(device);

        // Establecer cookie HttpOnly (ADR-008)
        boolean isLocal  = "local".equals(activeProfile);
        ResponseCookie cookie = ResponseCookie.from(COOKIE_NAME, token)
                .httpOnly(true)
                .secure(!isLocal)
                .sameSite("Strict")
                .path("/api/v1/auth/login")
                .maxAge(TRUST_TTL_DAYS * 24 * 3600L)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        auditLogService.log("TRUSTED_DEVICE_CREATED", userId, device.getId().toString());
        log.info("Trusted device registered for userId={} deviceId={}", userId, device.getId());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String generateTrustToken(UUID userId, String fingerprint) {
        try {
            String payload = userId + ":" + fingerprint + ":" + System.currentTimeMillis();
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(hmacKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString((payload + ":" + HexFormat.of().formatHex(sig))
                            .getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Trust token generation failed", e);
        }
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                    digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
