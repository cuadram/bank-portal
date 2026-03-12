/**
 * models/enroll.model.ts
 * Modelos de dominio — US-001: Activar 2FA (enrolamiento TOTP)
 * FEAT-001 | BankPortal — Banco Meridian
 */

/** Respuesta del backend al iniciar el enrolamiento (POST /2fa/enroll) */
export interface EnrollResponse {
  /** Secreto TOTP en Base32 — mostrar al usuario para configuración manual */
  secret: string;
  /** URI otpauth:// para generar QR */
  qr_uri: string;
  /** Imagen QR codificada en Base64 (PNG) — lista para <img src="data:image/png;base64,..."> */
  qr_image_base64: string;
}

/** Cuerpo de la petición para confirmar el enrolamiento (POST /2fa/enroll/confirm) */
export interface ConfirmEnrollRequest {
  /** Código OTP de 6 dígitos generado por la app autenticadora */
  otp: string;
}

/** Respuesta de confirmación de enrolamiento */
export interface ConfirmEnrollResponse {
  message: string;
  /** Número de códigos de recuperación generados */
  recovery_codes_count: number;
}
