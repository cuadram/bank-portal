// profile.models.ts — FEAT-012-A Sprint 14
// @author SOFIA Developer Agent

export interface AddressDto {
  street:     string | null;
  city:       string | null;
  postalCode: string | null;
  country:    string | null;
}

export interface ProfileResponse {
  userId:           string;
  fullName:         string;
  email:            string;        // read-only en UI
  phone:            string | null;
  address:          AddressDto | null;
  twoFactorEnabled: boolean;
  memberSince:      string;        // ISO-8601
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
  ipAddress: string;   // ya ofuscado por backend
  createdAt: string;   // ISO-8601
  current:   boolean;
}

export type NotificationCode =
  | 'NOTIF_TRANSFER_EMAIL'
  | 'NOTIF_TRANSFER_INAPP'
  | 'NOTIF_LOGIN_EMAIL'
  | 'NOTIF_BUDGET_ALERT'
  | 'NOTIF_EXPORT_EMAIL';

export interface NotificationPreference {
  code:    NotificationCode;
  enabled: boolean;
}
