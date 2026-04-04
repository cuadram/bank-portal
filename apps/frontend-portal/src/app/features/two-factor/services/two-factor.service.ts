/**
 * services/two-factor.service.ts
 * HTTP Client — Endpoints 2FA del backend
 * FEAT-001 | BankPortal — Banco Meridian
 *
 * Contratos: docs/architecture/FEAT-001-LLD-backend.md § 6
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EnrollResponse, ConfirmEnrollRequest, ConfirmEnrollResponse } from '../models/enroll.model';
import { VerifyOtpRequest, VerifyOtpResponse } from '../models/verify.model';
import { RecoveryCodesResponse, RecoveryCodesStatus } from '../models/recovery-codes.model';

@Injectable({ providedIn: 'root' })
export class TwoFactorService {

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/2fa`;

  // ─── US-001: Enrolamiento ───────────────────────────────────────────

  /** POST /2fa/enroll — Inicia el enrolamiento, devuelve QR + secreto */
  enroll(): Observable<EnrollResponse> {
    return this.http.post<EnrollResponse>(`${this.base}/enroll`, {});
  }

  /** POST /2fa/enroll/confirm — Confirma el enrolamiento con el primer OTP */
  confirmEnroll(otp: string): Observable<ConfirmEnrollResponse> {
    const body: ConfirmEnrollRequest = { otp };
    return this.http.post<ConfirmEnrollResponse>(`${this.base}/enroll/confirm`, body);
  }

  // ─── US-002: Verificación OTP en login ─────────────────────────────

  /** POST /2fa/verify — Verifica OTP/recovery-code, devuelve access_token final */
  verifyOtp(request: VerifyOtpRequest): Observable<VerifyOtpResponse> {
    return this.http.post<VerifyOtpResponse>(`${this.base}/verify`, request);
  }

  // ─── US-003: Códigos de recuperación ───────────────────────────────

  /** GET /2fa/recovery-codes/status — Estado actual de los códigos */
  getRecoveryCodesStatus(): Observable<RecoveryCodesStatus> {
    return this.http.get<RecoveryCodesStatus>(`${this.base}/recovery-codes/status`);
  }

  /** POST /2fa/recovery-codes/generate — Regenera todos los códigos */
  generateRecoveryCodes(): Observable<RecoveryCodesResponse> {
    return this.http.post<RecoveryCodesResponse>(`${this.base}/recovery-codes/generate`, {});
  }

  // ─── US-004: Desactivar 2FA ─────────────────────────────────────────

  /** DELETE /2fa/disable — Desactiva 2FA (requiere OTP + password en body) */
  disable(otp: string, password: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/disable`, {
      body: { otp, password }
    });
  }
}
