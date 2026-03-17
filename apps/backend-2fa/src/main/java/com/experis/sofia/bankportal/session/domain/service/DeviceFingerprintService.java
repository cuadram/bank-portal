package com.experis.sofia.bankportal.session.domain.service;

import org.springframework.stereotype.Service;

/**
 * DEBT-010 — Centralización de extracción de subnet IP.
 *
 * <p>Elimina la duplicación de la lógica {@code extractIpSubnet()} que existía en:
 * <ul>
 *   <li>{@code LoginContextUseCase} (Sprint 7 — placeholder eliminado)</li>
 *   <li>{@code AccountAndContextController} (Sprint 7 — placeholder eliminado)</li>
 *   <li>Cualquier futuro componente que necesite calcular subnet</li>
 * </ul>
 *
 * <p>Convención: subnet = primeros 3 octetos de IPv4 (clase C /24).
 * Ejemplo: {@code "192.168.1.105"} → {@code "192.168.1"}
 *
 * <p>IPv6: se devuelve la dirección completa normalizada (sin simplificación).
 * Loopback (127.0.0.1, ::1) → {@code "127.0.0"} / {@code "::1"}.
 *
 * @author SOFIA Developer Agent — DEBT-010 Sprint 8
 */
@Service
public class DeviceFingerprintService {

    /**
     * Extrae los primeros 3 octetos de una dirección IPv4.
     * Para IPv6 devuelve la dirección sin modificar.
     *
     * @param rawIp dirección IP raw del request (puede incluir puerto en IPv6)
     * @return subnet normalizada, nunca {@code null}; cadena vacía si {@code rawIp} es null
     */
    public String extractIpSubnet(String rawIp) {
        if (rawIp == null || rawIp.isBlank()) return "";

        // Eliminar prefijo ::ffff: de IPv4-mapped IPv6
        String ip = rawIp.startsWith("::ffff:") ? rawIp.substring(7) : rawIp.trim();

        // IPv4: devolver primeros 3 octetos
        String[] parts = ip.split("\\.");
        if (parts.length == 4) {
            return parts[0] + "." + parts[1] + "." + parts[2];
        }

        // IPv6 u otro formato: devolver tal cual (no truncar)
        return ip;
    }

    /**
     * Sobrecarga para enmascarar el último octeto (mostrar al usuario).
     * Ejemplo: {@code "192.168.1.105"} → {@code "192.168.1.xxx"}
     */
    public String maskIp(String rawIp) {
        String subnet = extractIpSubnet(rawIp);
        if (subnet.isBlank()) return "—";
        // IPv4: añadir .xxx
        if (subnet.chars().filter(c -> c == '.').count() == 2) {
            return subnet + ".xxx";
        }
        return subnet;
    }
}
