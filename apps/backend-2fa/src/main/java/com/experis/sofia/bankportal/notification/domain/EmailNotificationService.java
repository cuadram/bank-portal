package com.experis.sofia.bankportal.notification.domain;

/**
 * Servicio de notificaciones por email — FEAT-006.
 */
public interface EmailNotificationService {
    void sendAccountLockedEmail(String toEmail, String unlockUrl);
    void sendAccountUnlockedEmail(String toEmail);
    void sendNewContextAlertEmail(String toEmail, String confirmUrl, String subnet);
    void sendContextConfirmLink(String toEmail, String confirmToken, String subnet);
    void sendGenericEmail(String toEmail, String subject, String body);
}
