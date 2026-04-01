/**
 * profile.service.ts — FEAT-012-A Sprint 14
 * RV-023 fix: eliminado import 'tap' no utilizado.
 * BUG-VER-001 fix (2026-04-01): getNotifications/getSessions devuelven of([]) en lugar de EMPTY
 *   para evitar que forkJoin en ProfilePageComponent quede bloqueado cuando los endpoints
 *   /api/v1/profile/notifications o /api/v1/profile/sessions devuelven 404.
 *   EMPTY completa sin emitir → forkJoin nunca emite → skeleton infinito.
 *   of([]) emite array vacío → forkJoin emite → componente renderiza con datos parciales.
 * @author SOFIA Developer Agent — Sprint 14 | RV-023 fix Code Review | BUG-VER-001 fix
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable, EMPTY, of } from 'rxjs';
import { catchError }          from 'rxjs/operators';
import {
  ProfileResponse, UpdateProfileRequest, ChangePasswordRequest,
  NotificationPreference, NotificationCode, SessionInfo
} from '../models/profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/profile';

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>(this.base).pipe(
      catchError(err => { console.error('[ProfileService] getProfile', err); return EMPTY; })
    );
  }

  updateProfile(req: UpdateProfileRequest): Observable<ProfileResponse> {
    return this.http.patch<ProfileResponse>(this.base, req).pipe(
      catchError(err => { console.error('[ProfileService] updateProfile', err); return EMPTY; })
    );
  }

  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/password`, req).pipe(
      catchError(err => { console.error('[ProfileService] changePassword', err); throw err; })
    );
  }

  getNotifications(): Observable<NotificationPreference[]> {
    // BUG-VER-001: of([]) en lugar de EMPTY — forkJoin requiere que todos los observables emitan
    return this.http.get<NotificationPreference[]>(`${this.base}/notifications`).pipe(
      catchError(err => { console.error('[ProfileService] getNotifications', err); return of([]); })
    );
  }

  updateNotifications(patch: Partial<Record<NotificationCode, boolean>>): Observable<NotificationPreference[]> {
    return this.http.patch<NotificationPreference[]>(`${this.base}/notifications`, patch).pipe(
      catchError(err => { console.error('[ProfileService] updateNotifications', err); return EMPTY; })
    );
  }

  getSessions(): Observable<SessionInfo[]> {
    // BUG-VER-001: of([]) en lugar de EMPTY — forkJoin requiere que todos los observables emitan
    return this.http.get<SessionInfo[]>(`${this.base}/sessions`).pipe(
      catchError(err => { console.error('[ProfileService] getSessions', err); return of([]); })
    );
  }

  revokeSession(jti: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/sessions/${jti}`).pipe(
      catchError(err => { console.error('[ProfileService] revokeSession', err); throw err; })
    );
  }
}
