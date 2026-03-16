package com.experis.sofia.bankportal.trusteddevice.application;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import com.experis.sofia.bankportal.session.domain.service.DeviceFingerprintService;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDevice;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDeviceRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Caso de uso US-203 — Validar trust token en el flujo de login.
 * DEBT-006 (ADR-009): verificación con clave dual para soportar rotación
 * de {@code TRUSTED_DEVICE_HMAC_KEY} sin invalidar tokens activos.
 *
 * <p>Algoritmo de verificación (orden de prioridad):
 * <ol>
 *   <li>Verificar con clave activa {@code hmacKey}</li>
 *   <li>Si falla y {@code hmacKeyPrevious} no está vacía: verificar con clave anterior</li>
 *   <li>Si ambas fallan: retornar false → flujo 2FA normal</li>
 * </ol>
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4 · DEBT-006 Sprint 5
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ValidateTrustedDeviceUseCase {

    private static final String COOKIE_NAME = "bp_trust";

    private final TrustedDeviceRepository  deviceRepository;
    private final DeviceFingerprintService fingerprintService;
    private final AuditLogService          auditLogService;

    @Value("${trusted-device.hmac-key}")
    private String hmacKey;

    /** Clave anterior para ventana de gracia durante rotación (ADR-009). Vacía si no hay rotación activa. */
    @Value("${trusted-device.hmac-key-previous:}")
    private String hmacKeyPrevious;

    /**
     * Valida si el request proviene de un dispositivo de confianza activo.
     * Implementa clave dual para rotación sin impacto (DEBT-006).
     *
     * @param request HttpServletRequest con cookie bp_trust
     * @param userId  ID del usuario intentando login
     * @param rawIp   IP del cliente
     * @return {@code true} si el dispositivo es de confianza y el login puede omitir OTP
     */
    @Transactional
    public boolean validate(HttpServletRequest request, UUID userId, String rawIp) {
        String trustToken = extractCookie(request);
        if (trustToken == null) return false;

        String tokenHash = sha256(trustToken);
        String ipSubnet  = fingerprintService.extractIpSubnet(rawIp);

        Optional<TrustedDevice> deviceOpt = deviceRepository.findActiveByTokenHash(tokenHash);
        if (deviceOpt.isEmpty()) {
            log.debug("Trust token not found in DB for userId={}", userId);
            return false;
        }

        TrustedDevice device = deviceOpt.get();

        // Verificar ownership (IDOR protection)
        if (!device.getUserId().equals(userId)) {
            log.warn("Trust token userId mismatch — possible theft attempt userId={}", userId);
            return false;
        }

        // Verificar fingerprint del dispositivo actual
        String ua          = extractUserAgent(request);
        String currentFp   = fingerprintService.computeHash(ua, ipSubnet);
        if (!device.getDeviceFingerprintHash().equals(currentFp)) {
            log.info("Device fingerprint mismatch for userId={} — OTP required", userId);
            return false;
        }

        // Verificar estado activo (no revocado, no expirado)
        if (!device.isActive()) {
            log.info("Inactive/expired trusted device for userId={}", userId);
            return false;
        }

        // DEBT-006 — Verificar firma HMAC con clave dual (ADR-009)
        boolean validWithCurrentKey  = verifyHmac(trustToken, hmacKey);
        boolean validWithPreviousKey = !validWithCurrentKey
                && hmacKeyPrevious != null && !hmacKeyPrevious.isBlank()
                && verifyHmac(trustToken, hmacKeyPrevious);

        if (!validWithCurrentKey && !validWithPreviousKey) {
            log.info("Trust token HMAC verification failed for userId={}", userId);
            return false;
        }

        // Registrar uso
        device.recordUse();
        deviceRepository.save(device);

        if (validWithPreviousKey) {
            // Auditar uso de clave anterior — permite monitorizar la transición (ADR-009)
            auditLogService.log("TRUSTED_DEVICE_GRACE_VERIFY", userId,
                    "deviceId=" + device.getId() + " usingPreviousKey=true");
            log.info("Trusted device login via grace key for userId={} deviceId={}",
                    userId, device.getId());
        } else {
            auditLogService.log("TRUSTED_DEVICE_LOGIN", userId, device.getId().toString());
            log.info("Trusted device login — OTP skipped for userId={} deviceId={}",
                    userId, device.getId());
        }

        return true;
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private boolean verifyHmac(String token, String key) {
        if (key == null || key.isBlank()) return false;
        try {
            // El token es Base64URL(payload:signature)
            String decoded = new String(
                    java.util.Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
            int lastColon = decoded.lastIndexOf(':');
            if (lastColon < 0) return false;

            String payload    = decoded.substring(0, lastColon);
            String storedSig  = decoded.substring(lastColon + 1);
            String computedSig = computeHmac(payload, key);

            return constantTimeEquals(storedSig, computedSig);
        } catch (Exception e) {
            return false;
        }
    }

    private String computeHmac(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }

    /** Comparación en tiempo constante — previene timing attacks. */
    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        byte[] ba = a.getBytes(StandardCharsets.UTF_8);
        byte[] bb = b.getBytes(StandardCharsets.UTF_8);
        if (ba.length != bb.length) return false;
        int result = 0;
        for (int i = 0; i < ba.length; i++) result |= ba[i] ^ bb[i];
        return result == 0;
    }

    private String extractCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        return Arrays.stream(cookies)
                .filter(c -> COOKIE_NAME.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst().orElse(null);
    }

    private String extractUserAgent(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        return ua != null ? ua : "";
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
