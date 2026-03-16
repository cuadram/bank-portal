import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ActiveSession, UpdateTimeoutRequest, UpdateTimeoutResponse } from '../store/session.model';

/**
 * Servicio HTTP para el módulo de gestión de sesiones.
 * Mapea directamente a los endpoints definidos en el contrato OpenAPI v1.2.0.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Injectable({ providedIn: 'root' })
export class SessionService {

  private readonly http    = inject(HttpClient);
  private readonly baseUrl = '/api/v1/sessions';

  /**
   * US-101 — Obtiene las sesiones activas del usuario autenticado.
   * GET /api/v1/sessions
   */
  getActiveSessions(): Observable<ActiveSession[]> {
    return this.http.get<ActiveSession[]>(this.baseUrl);
  }

  /**
   * US-102 — Revoca una sesión individual.
   * DELETE /api/v1/sessions/{sessionId}
   * OTP requerido en header X-OTP-Code.
   */
  revokeSession(sessionId: string, otpCode: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${sessionId}`, {
      headers: new HttpHeaders({ 'X-OTP-Code': otpCode }),
    });
  }

  /**
   * US-102 — Revoca todas las sesiones excepto la actual.
   * DELETE /api/v1/sessions
   * OTP requerido en header X-OTP-Code.
   */
  revokeAllSessions(otpCode: string): Observable<void> {
    return this.http.delete<void>(this.baseUrl, {
      headers: new HttpHeaders({ 'X-OTP-Code': otpCode }),
    });
  }

  /**
   * US-103 — Actualiza el timeout de inactividad.
   * PUT /api/v1/sessions/timeout
   */
  updateTimeout(req: UpdateTimeoutRequest): Observable<UpdateTimeoutResponse> {
    return this.http.put<UpdateTimeoutResponse>(`${this.baseUrl}/timeout`, req);
  }
}
