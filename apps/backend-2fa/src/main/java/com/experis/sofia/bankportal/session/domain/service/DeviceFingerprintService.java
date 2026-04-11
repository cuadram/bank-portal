package com.experis.sofia.bankportal.session.domain.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * DEBT-010 — Extracción de fingerprint de dispositivo y subnet IP.
 * DEBT-004 — Detección correcta de browser/OS/deviceType via User-Agent parsing.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3 / DEBT-004/010 Sprint 8
 */
@Service
public class DeviceFingerprintService {

    // ─────────────────────────────────────────────────────────────────────────
    // DeviceInfo record
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Información extraída del User-Agent.
     *
     * @param browser    nombre del navegador: "Chrome", "Firefox", "Safari", "Edge", "unknown"
     * @param os         sistema operativo: "Windows", "macOS", "Linux", "Android", "iOS", "unknown"
     * @param deviceType tipo de dispositivo: "desktop", "mobile", "tablet"
     */
    public record DeviceInfo(String browser, String os, String deviceType) {
        public static DeviceInfo unknown() {
            return new DeviceInfo("unknown", "unknown", "desktop");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // extractDeviceInfo
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Extrae información del dispositivo del User-Agent.
     * DEBT-004: Edge detectado correctamente (no como Chrome) —
     * el token "Edg/" aparece después del token "Chrome/" en el UA de Edge.
     *
     * @param userAgent cabecera User-Agent; null retorna {@link DeviceInfo#unknown()}
     */
    public DeviceInfo extractDeviceInfo(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return DeviceInfo.unknown();

        String ua = userAgent.toLowerCase();

        // ── OS ────────────────────────────────────────────────────────────────
        String os;
        if (ua.contains("android"))         os = "Android";
        else if (ua.contains("iphone") || ua.contains("ipad")) os = "iOS";
        else if (ua.contains("windows"))    os = "Windows";
        else if (ua.contains("macintosh") || ua.contains("mac os x")) os = "macOS";
        else if (ua.contains("linux"))      os = "Linux";
        else                                os = "unknown";

        // ── DeviceType ────────────────────────────────────────────────────────
        String deviceType;
        if (ua.contains("mobile"))          deviceType = "mobile";
        else if (ua.contains("tablet") || ua.contains("ipad")) deviceType = "tablet";
        else                                deviceType = "desktop";

        // ── Browser ─ DEBT-004: orden importa — Edge antes que Chrome ─────────
        String browser;
        if (ua.contains("edg/") || ua.contains("edge/")) browser = "Edge";
        else if (ua.contains("firefox/"))   browser = "Firefox";
        else if (ua.contains("opr/") || ua.contains("opera/")) browser = "Opera";
        else if (ua.contains("samsungbrowser/")) browser = "Samsung";
        else if (ua.contains("chrome/"))    browser = "Chrome";
        else if (ua.contains("safari/"))    browser = "Safari";
        else                                browser = "unknown";

        return new DeviceInfo(browser, os, deviceType);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // extractIpSubnet — 2 primeros octetos
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Extrae los dos primeros octetos de una dirección IPv4.
     * Para IPv6 devuelve la dirección sin modificar.
     *
     * @param rawIp dirección IP raw; null retorna "unknown"
     * @return subnet (ej. "192.168"), "unknown" si null/blank
     */
    public String extractIpSubnet(String rawIp) {
        if (rawIp == null || rawIp.isBlank()) return "unknown";

        // Eliminar prefijo ::ffff: de IPv4-mapped IPv6
        String ip = rawIp.startsWith("::ffff:") ? rawIp.substring(7) : rawIp.trim();

        // IPv4: devolver primeros 2 octetos
        String[] parts = ip.split("\\.");
        if (parts.length >= 4) {
            return parts[0] + "." + parts[1];
        }

        return ip;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // maskIp
    // ─────────────────────────────────────────────────────────────────────────

    /** Enmascara el último octeto para mostrar al usuario. Ej: "192.168.x.x" */
    public String maskIp(String rawIp) {
        if (rawIp == null || rawIp.isBlank()) return "—";
        String subnet = extractIpSubnet(rawIp);
        if ("unknown".equals(subnet)) return "—";
        if (subnet.chars().filter(c -> c == '.').count() == 1) {
            return subnet + ".x.x";
        }
        return subnet;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // computeHash — URL-safe Base64 SHA-256
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Calcula el hash SHA-256 del fingerprint y lo devuelve como Base64 URL-safe (sin padding).
     * El test espera que no contenga '+', '/', '='.
     *
     * @param userAgent      cabecera User-Agent
     * @param subnetOrLang   subnet o Accept-Language para mezclar en el hash
     */
    public String computeHash(String userAgent, String subnetOrLang) {
        try {
            String input = (userAgent == null ? "" : userAgent)
                         + "|" + (subnetOrLang == null ? "" : subnetOrLang);
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(input.getBytes(StandardCharsets.UTF_8));
            // URL-safe Base64 sin padding — sin '+', '/', '='
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Error computing device fingerprint hash", e);
        }
    }
}
