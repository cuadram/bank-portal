/**
 * models/verify.model.ts
 * Modelos de dominio — US-002: Verificar OTP en flujo de login
 * FEAT-001 | BankPortal — Banco Meridian
 */

/** Cuerpo de la petición de verificación OTP (POST /2fa/verify) */
export interface VerifyOtpRequest {
  /** Código OTP de 6 dígitos (mutuamente exclusivo con recovery_code) */
  otp?: string;
  /** Código de recuperación (mutuamente exclusivo con otp) */
  recovery_code?: string;
}

/** Respuesta de verificación exitosa — contiene el access_token final */
export interface VerifyOtpResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
}
