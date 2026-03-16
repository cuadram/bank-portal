package com.experis.sofia.bankportal.session.domain.model;

/**
 * Value object — información del dispositivo extraída del User-Agent.
 * Inmutable por diseño.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
public record DeviceInfo(
        String os,
        String browser,
        String deviceType,   // "desktop" | "mobile" | "tablet"
        String rawUserAgent
) {}
