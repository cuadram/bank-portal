package com.experis.sofia.bankportal.notification.domain;

/**
 * Canal semántico de una notificación — FEAT-014.
 *
 * <p>Usado para filtrar el panel de notificaciones y el SSE stream por categoría.
 * Las notificaciones pre-FEAT-014 (FEAT-004) son SECURITY por defecto.
 */
public enum NotificationCategory {
    TRANSACTION,
    SECURITY,
    KYC,
    SYSTEM
}
