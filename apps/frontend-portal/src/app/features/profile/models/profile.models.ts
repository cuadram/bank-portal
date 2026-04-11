// profile.models.ts — FEAT-012-A Sprint 14
// BUG-STG-022-003 fix: modelos actualizados para coincidir con APIs reales del backend.
//   NotificationChannelPreference: GET /api/v1/notifications/preferences
//   UserNotificationItem: GET /api/v1/profile/notifications
// @author SOFIA Developer Agent — Sprint 22 STG-Verification

export interface AddressDto {
  street:     string | null;
  city:       string | null;
  postalCode: string | null;
  country:    string | null;
}

export interface ProfileResponse {
  userId:           string;
  fullName:         string;
  email:            string;
  phone:            string | null;
  address:          AddressDto | null;
  twoFactorEnabled: boolean;
  memberSince:      string;
}

export interface UpdateProfileRequest {
  phone?:   string;
  address?: Partial<AddressDto>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword:     string;
  confirmPassword: string;
}

export interface SessionInfo {
  jti:       string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  current:   boolean;
}

// ── Preferencias de notificación — GET /api/v1/notifications/preferences ──────
// BUG-STG-022-003: modelo real del backend (FEAT-014 Sprint 16)
export interface NotificationChannelPreference {
  eventType:    string;  // e.g. TRANSFER_COMPLETED, SECURITY_NEW_DEVICE
  emailEnabled: boolean;
  pushEnabled:  boolean;
  inAppEnabled: boolean;
}

// Labels legibles por canal/eventType para la UI
export const NOTIFICATION_LABELS: Record<string, string> = {
  TRANSFER_COMPLETED:        'Transferencia enviada',
  TRANSFER_RECEIVED:         'Transferencia recibida',
  PAYMENT_COMPLETED:         'Pago completado',
  BILL_PAID:                 'Recibo pagado',
  BILL_DUE_SOON:             'Recibo próximo a vencer',
  BILL_OVERDUE:              'Recibo vencido',
  SECURITY_NEW_DEVICE:       'Inicio de sesión en nuevo dispositivo',
  SECURITY_PASSWORD_CHANGED: 'Cambio de contraseña',
  SECURITY_2FA_FAILED:       'Intento 2FA fallido',
  SECURITY_PHONE_CHANGED:    'Teléfono actualizado',
  CARD_BLOCKED:              'Tarjeta bloqueada',
  CARD_UNBLOCKED:            'Tarjeta desbloqueada',
  CARD_LIMITS_UPDATED:       'Límites de tarjeta actualizados',
  DEBIT_CHARGED:             'Recibo domiciliado cobrado',
  DEBIT_RETURNED:            'Recibo devuelto',
  DEBIT_REJECTED:            'Domiciliación rechazada',
  KYC_APPROVED:              'Verificación de identidad aprobada',
  KYC_REJECTED:              'Verificación de identidad rechazada',
  LOGIN_SUCCESS:             'Inicio de sesión',
  BUDGET_ALERT:              'Alerta de presupuesto',
  SCHEDULED_EXECUTED:        'Transferencia programada ejecutada',
  CARD_BLOCKED_FRAUD:        'Tarjeta bloqueada por seguridad',
};

// ── Notificaciones recibidas (inbox) — GET /api/v1/profile/notifications ───────
// BUG-STG-022-003: modelo real del backend (DEBT-043 Sprint 22)
export interface UserNotificationItem {
  id:              string;
  userId:          string;
  eventType:       string;
  title:           string;
  body:            string;
  actionUrl:       string | null;
  createdAt:       string;
  expiresAt:       string;
  read:            boolean;
  readAt:          string | null;
  category:        string;
  severity:        string;
  active:          boolean;
}

// ── Legacy (mantenido por compatibilidad, reemplazado por NotificationChannelPreference) ──
/** @deprecated Usar NotificationChannelPreference */
export type NotificationCode =
  | 'NOTIF_TRANSFER_EMAIL'
  | 'NOTIF_TRANSFER_INAPP'
  | 'NOTIF_LOGIN_EMAIL'
  | 'NOTIF_BUDGET_ALERT'
  | 'NOTIF_EXPORT_EMAIL';

/** @deprecated Usar NotificationChannelPreference */
export interface NotificationPreference {
  code:    NotificationCode;
  enabled: boolean;
}
