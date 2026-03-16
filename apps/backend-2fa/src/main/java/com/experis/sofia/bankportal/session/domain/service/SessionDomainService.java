package com.experis.sofia.bankportal.session.domain.service;

import com.experis.sofia.bankportal.session.domain.model.UserSession;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/**
 * Servicio de dominio con las reglas de negocio de sesiones.
 * No depende de ningún framework — solo lógica pura.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Service
public class SessionDomainService {

    /** Máximo de sesiones concurrentes por usuario (PCI-DSS req. 8.2). */
    public static final int MAX_CONCURRENT_SESSIONS = 3;

    /** Timeout máximo permitido por política bancaria (PCI-DSS). */
    public static final int MAX_TIMEOUT_MINUTES = 60;

    /** Timeout mínimo seleccionable por el usuario. */
    public static final int MIN_TIMEOUT_MINUTES = 5;

    /**
     * Encuentra la sesión menos recientemente activa (LRU) para evicción.
     * Precondición: la lista no debe estar vacía.
     *
     * @param activeSessions sesiones activas del usuario
     * @return la sesión con {@code lastActivity} más antigua
     * @throws IllegalArgumentException si la lista está vacía
     */
    public UserSession findLruSession(List<UserSession> activeSessions) {
        if (activeSessions.isEmpty()) {
            throw new IllegalArgumentException("Cannot find LRU in empty session list");
        }
        return activeSessions.stream()
                .min(Comparator.comparing(UserSession::getLastActivity))
                .orElseThrow();
    }

    /**
     * Valida que el timeout solicitado respeta la política institucional.
     *
     * @param timeoutMinutes valor solicitado por el usuario
     * @throws IllegalArgumentException si está fuera de rango
     */
    public void validateTimeout(int timeoutMinutes) {
        if (timeoutMinutes < MIN_TIMEOUT_MINUTES || timeoutMinutes > MAX_TIMEOUT_MINUTES) {
            throw new IllegalArgumentException(
                "SESSION_TIMEOUT_EXCEEDS_POLICY: timeout must be between "
                + MIN_TIMEOUT_MINUTES + " and " + MAX_TIMEOUT_MINUTES + " minutes");
        }
    }

    /**
     * Enmascara una dirección IP dejando visibles solo los dos primeros octetos.
     * Ejemplo: {@code 192.168.10.55} → {@code 192.168.x.x}
     *
     * @param rawIp dirección IP completa
     * @return IP enmascarada
     */
    public String maskIp(String rawIp) {
        if (rawIp == null || rawIp.isBlank()) return "unknown";
        String[] parts = rawIp.split("\\.");
        if (parts.length < 2) return "x.x.x.x";
        return parts[0] + "." + parts[1] + ".x.x";
    }

    /**
     * Extrae la subred /16 de una IP para fingerprinting de dispositivo.
     * Ejemplo: {@code 192.168.10.55} → {@code 192.168}
     */
    public String extractIpSubnet(String rawIp) {
        if (rawIp == null || rawIp.isBlank()) return "unknown";
        String[] parts = rawIp.split("\\.");
        if (parts.length < 2) return "unknown";
        return parts[0] + "." + parts[1];
    }
}
