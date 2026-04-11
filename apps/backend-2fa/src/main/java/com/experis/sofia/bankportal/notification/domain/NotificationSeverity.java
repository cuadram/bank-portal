package com.experis.sofia.bankportal.notification.domain;

/**
 * Severidad de una notificación — FEAT-014.
 *
 * <p>HIGH: eventos de seguridad críticos (nuevo dispositivo, cambio de contraseña,
 * intentos 2FA fallidos). Ignora preferencias de usuario: siempre se entrega
 * por todos los canales habilitados en el sistema.
 *
 * <p>INFO: eventos transaccionales y de estado (transferencia completada,
 * KYC aprobado, etc.). Respeta preferencias de usuario.
 */
public enum NotificationSeverity {
    INFO,
    HIGH
}
