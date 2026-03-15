package com.experis.sofia.bankportal.twofa.domain.repository;

import com.experis.sofia.bankportal.twofa.domain.model.TwoFactorEventType;

import java.util.UUID;

/**
 * Puerto de salida — repositorio de auditoría inmutable (INSERT-only).
 *
 * <p>Contrato de dominio para registrar eventos 2FA en la tabla
 * {@code audit_log}. Nunca se actualizan ni borran registros (PCI-DSS req. 10).</p>
 *
 * <p>FEAT-001 | US-005 | ADR-003 — Implementado vía AOP en producción,
 * pero el repositorio es accesible directamente cuando se requiere
 * registro programático.</p>
 *
 * @since 1.0.0
 */
public interface AuditLogRepository {

    /**
     * Registra un evento de auditoría 2FA.
     *
     * @param userId    UUID del usuario (puede ser null para intentos previos a auth)
     * @param eventType tipo de evento {@link TwoFactorEventType}
     * @param ipAddress dirección IP del cliente (IPv4 o IPv6)
     * @param userAgent User-Agent del cliente
     * @param result    resultado: {@code "SUCCESS"}, {@code "FAILURE"} o {@code "BLOCKED"}
     */
    void log(UUID userId, TwoFactorEventType eventType,
             String ipAddress, String userAgent, String result);
}
