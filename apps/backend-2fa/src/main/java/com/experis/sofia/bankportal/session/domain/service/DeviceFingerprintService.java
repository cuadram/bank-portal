package com.experis.sofia.bankportal.session.domain.service;

import com.experis.sofia.bankportal.session.domain.model.DeviceInfo;
import ua_parser.Client;
import ua_parser.Parser;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * Servicio de dominio para fingerprinting de dispositivos.
 * Usa ua-parser-java (DEBT-004) para detección precisa de OS y browser,
 * resolviendo la clasificación incorrecta de Edge como Chrome (WARN-F2-002 Sprint 3).
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4 (DEBT-004)
 */
@Service
public class DeviceFingerprintService {

    private final Parser uaParser = new Parser();

    /**
     * Calcula el fingerprint hash SHA-256 de un dispositivo.
     *
     * @param userAgent cabecera User-Agent completa
     * @param ipSubnet  subred /16 de la IP (ej. "192.168")
     * @return hash Base64URL del fingerprint
     */
    public String computeHash(String userAgent, String ipSubnet) {
        try {
            String input = (userAgent != null ? userAgent : "") + "|" + ipSubnet;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    /**
     * Extrae información de dispositivo legible usando ua-parser-java.
     * Detecta correctamente Edge vs Chrome, Safari vs Chrome en iOS, etc.
     *
     * @param userAgent cabecera User-Agent
     * @return {@link DeviceInfo} con os, browser y deviceType precisos
     */
    public DeviceInfo extractDeviceInfo(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return new DeviceInfo("unknown", "unknown", "desktop", userAgent);
        }

        Client client = uaParser.parse(userAgent);

        String os     = normalizeOs(client.os.family);
        String browser = normalizeBrowser(client.userAgent.family);
        String device  = detectDeviceType(userAgent.toLowerCase(), client);

        return new DeviceInfo(os, browser, device, userAgent);
    }

    public String extractIpSubnet(String rawIp) {
        if (rawIp == null || rawIp.isBlank()) return "unknown";
        String[] parts = rawIp.split("\\.");
        if (parts.length < 2) return "unknown";
        return parts[0] + "." + parts[1];
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private String normalizeOs(String osFamily) {
        if (osFamily == null) return "unknown";
        return switch (osFamily) {
            case "Windows"           -> "Windows";
            case "Mac OS X"          -> "macOS";
            case "iOS"               -> "iOS";
            case "Android"           -> "Android";
            case "Ubuntu", "Fedora",
                 "Debian", "Linux"   -> "Linux";
            default                  -> osFamily;
        };
    }

    private String normalizeBrowser(String browserFamily) {
        if (browserFamily == null) return "unknown";
        // ua-parser detecta "Edge" correctamente — no lo confunde con Chrome
        return switch (browserFamily) {
            case "Edge"              -> "Edge";
            case "Chrome"            -> "Chrome";
            case "Firefox"           -> "Firefox";
            case "Safari"            -> "Safari";
            case "Samsung Internet"  -> "Samsung Internet";
            default                  -> browserFamily;
        };
    }

    private String detectDeviceType(String ua, Client client) {
        // ua-parser no tiene campo deviceType directo en v1.x — inferimos del device.family
        String deviceFamily = client.device != null ? client.device.family : "";
        if ("Spider".equals(deviceFamily)) return "bot";
        if (ua.contains("mobile") || ua.contains("android") && !ua.contains("tablet")) return "mobile";
        if (ua.contains("tablet") || ua.contains("ipad")) return "tablet";
        return "desktop";
    }
}
