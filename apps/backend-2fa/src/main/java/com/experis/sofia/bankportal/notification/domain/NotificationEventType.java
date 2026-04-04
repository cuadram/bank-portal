package com.experis.sofia.bankportal.notification.domain;

/**
 * Tipos de evento de negocio que generan notificaciones multicanal — FEAT-014.
 *
 * <p>Cada tipo pertenece a una {@link NotificationCategory} y tiene una
 * {@link NotificationSeverity} por defecto.
 */
public enum NotificationEventType {

    // ── Transaccionales ─────────────────────────────────────────────────────
    TRANSFER_COMPLETED (NotificationCategory.TRANSACTION, NotificationSeverity.INFO),
    TRANSFER_RECEIVED  (NotificationCategory.TRANSACTION, NotificationSeverity.INFO),
    PAYMENT_COMPLETED  (NotificationCategory.TRANSACTION, NotificationSeverity.INFO),
    BILL_PAID          (NotificationCategory.TRANSACTION, NotificationSeverity.INFO),

    // ── Seguridad ────────────────────────────────────────────────────────────
    SECURITY_NEW_DEVICE       (NotificationCategory.SECURITY, NotificationSeverity.HIGH),
    SECURITY_PASSWORD_CHANGED (NotificationCategory.SECURITY, NotificationSeverity.HIGH),
    SECURITY_2FA_FAILED       (NotificationCategory.SECURITY, NotificationSeverity.HIGH),
    SECURITY_PHONE_CHANGED    (NotificationCategory.SECURITY, NotificationSeverity.HIGH),

    // ── Tarjetas (FEAT-016) ──────────────────────────────────────────────────
    CARD_BLOCKED        (NotificationCategory.SECURITY, NotificationSeverity.INFO),
    CARD_UNBLOCKED      (NotificationCategory.SECURITY, NotificationSeverity.INFO),
    CARD_LIMITS_UPDATED (NotificationCategory.TRANSACTION, NotificationSeverity.INFO),
    DEBIT_CHARGED       (NotificationCategory.TRANSACTION, NotificationSeverity.INFO),
    DEBIT_RETURNED      (NotificationCategory.TRANSACTION, NotificationSeverity.HIGH),
    DEBIT_REJECTED      (NotificationCategory.TRANSACTION, NotificationSeverity.HIGH),

    // ── KYC ─────────────────────────────────────────────────────────────────
    KYC_APPROVED (NotificationCategory.KYC, NotificationSeverity.INFO),
    KYC_REJECTED (NotificationCategory.KYC, NotificationSeverity.HIGH);

    private final NotificationCategory defaultCategory;
    private final NotificationSeverity defaultSeverity;

    NotificationEventType(NotificationCategory cat, NotificationSeverity sev) {
        this.defaultCategory = cat;
        this.defaultSeverity = sev;
    }

    public NotificationCategory getDefaultCategory() { return defaultCategory; }
    public NotificationSeverity getDefaultSeverity()  { return defaultSeverity; }
}
