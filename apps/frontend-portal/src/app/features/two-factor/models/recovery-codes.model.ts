/**
 * models/recovery-codes.model.ts
 * Modelos de dominio — US-003: Códigos de recuperación
 * FEAT-001 | BankPortal — Banco Meridian
 */

/** Respuesta con los códigos de recuperación (GET /2fa/recovery-codes o POST /2fa/recovery-codes/generate) */
export interface RecoveryCodesResponse {
  /** Lista de códigos de recuperación en texto plano — mostrar UNA SOLA VEZ */
  codes: string[];
}

/** Estado actual de los códigos (GET /2fa/recovery-codes/status) */
export interface RecoveryCodesStatus {
  available: number;
  total: number;
}
