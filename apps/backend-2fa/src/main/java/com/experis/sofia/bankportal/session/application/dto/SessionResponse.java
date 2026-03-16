package com.experis.sofia.bankportal.session.application.dto;

import java.time.LocalDateTime;

/**
 * DTO de respuesta para una sesión activa (US-101).
 *
 * @param sessionId    identificador de la sesión
 * @param os           sistema operativo del dispositivo
 * @param browser      navegador del dispositivo
 * @param deviceType   tipo: desktop | mobile | tablet
 * @param ipMasked     IP enmascarada: 192.168.x.x
 * @param lastActivity último acceso registrado
 * @param createdAt    momento de creación de la sesión
 * @param isCurrent    {@code true} si es la sesión del request actual
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
public record SessionResponse(
        String sessionId,
        String os,
        String browser,
        String deviceType,
        String ipMasked,
        LocalDateTime lastActivity,
        LocalDateTime createdAt,
        boolean isCurrent
) {}
