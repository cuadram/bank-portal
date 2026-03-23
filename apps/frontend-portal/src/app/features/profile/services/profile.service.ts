/**
 * profile.service.ts — FEAT-012-A Sprint 14
 *
 * HTTP service para los 7 endpoints de perfil.
 * JwtInterceptor (ya existente en core) inyecta Bearer automáticamente.
 * catchError convierte errores HTTP en observables vacíos con log —
 * los componentes gestionan el estado de error de forma local.
 *
 * RV-016: todos los subscribe() en los componentes deben usar
 * takeUntilDestroyed(this.destroyRef) — ver ProfilePageComponent.
 *
 * @author SOFIA Developer Agent — Sprint 14
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable, EMPTY }   from 'rxjs';
import { catchError, tap }     from 'rxjs/operators';
import {
  ProfileResponse, UpdateProfileRequest, ChangePasswordRequest,
  NotificationPreference, NotificationCode, SessionInfo
} from '../models/profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/profile';

  // ── US-1201 ────────────────────────────────────────────────────────────────
  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(this.base).pipe(
      catchError(err => { console.error('[ProfileService] getProfile', err); return EMPTY; })
    );
  }

  // ── US-1202 ────────────────────────────────────────────────────────────────
  updateProfile(req: UpdateProfileRequest): Observable<ProfileResponse> {
    return this.http.patch<ProfileResponse>(this.base, req).pipe(
      catchError(err => { console.error('[ProfileService] updateProfile', err); return EMPTY; })
    );
  }

  // ── US-1203 ────────────────────────────────────────────────────────────────
  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/password`, req).pipe(
      catchError(err => { console.error('[ProfileService] changePassword', err); throw err; })
    );
  }

  // ── US-1204 ────────────────────────────────────────────────────────────────
  getNotifications(): Observable<NotificationPreference[]> {
    return this.http.get<NotificationPreference[]>(`${this.base}/notifications`).pipe(
      catchError(err => { console.error('[ProfileService] getNotifications', err); return EMPTY; })
    );
  }

  updateNotifications(patch: Partial<Record<NotificationCode, boolean>>): Observable<NotificationPreference[]> {
    return this.http.patch<NotificationPreference[]>(`${this.base}/notifications`, patch).pipe(
      catchError(err => { console.error('[ProfileService] updateNotifications', err); return EMPTY; })
    );
  }

  // ── US-1205 ────────────────────────────────────────────────────────────────
  getSessions(): Observable<SessionInfo[]> {
    return this.http.get<SessionInfo[]>(`${this.base}/sessions`).pipe(
      catchError(err => { console.error('[ProfileService] getSessions', err); return EMPTY; })
    );
  }

  revokeSession(jti: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/sessions/${jti}`).pipe(
      catchError(err => { console.error('[ProfileService] revokeSession', err); throw err; })
    );
  }
}
