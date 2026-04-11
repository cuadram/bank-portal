/**
 * profile.service.ts — FEAT-012-A Sprint 14
 * BUG-STG-022-003 fix (Sprint 22 STG-Verification):
 *   getNotificationPreferences() → /api/v1/notifications/preferences (endpoint correcto FEAT-014)
 *   getNotificationInbox()       → /api/v1/profile/notifications (inbox DEBT-043)
 *   getNotifications() mantenido por compatibilidad → llama al preferences (fix)
 *
 * LA-STG-001: todos los métodos usan of(null)/of([]) en catchError (nunca EMPTY en forkJoin).
 * @author SOFIA Developer Agent — Sprint 14 | BUG-VER-001 | LA-STG-001 | BUG-STG-022-003
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable, of }      from 'rxjs';
import { catchError }          from 'rxjs/operators';
import {
  ProfileResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  NotificationChannelPreference,
  UserNotificationItem,
  SessionInfo
} from '../models/profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/profile';
  private readonly notifBase = '/api/v1/notifications';

  getProfile(): Observable<ProfileResponse | null> {
    return this.http.get<ProfileResponse>(this.base).pipe(
      catchError(err => { console.error('[ProfileService] getProfile', err); return of(null); })
    );
  }

  updateProfile(req: UpdateProfileRequest): Observable<ProfileResponse | null> {
    return this.http.patch<ProfileResponse>(this.base, req).pipe(
      catchError(err => { console.error('[ProfileService] updateProfile', err); return of(null); })
    );
  }

  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/password`, req).pipe(
      catchError(err => { console.error('[ProfileService] changePassword', err); throw err; })
    );
  }

  /**
   * BUG-STG-022-003 fix: preferencias de canal por tipo de evento.
   * Endpoint correcto: GET /api/v1/notifications/preferences (FEAT-014 Sprint 16).
   * Devuelve: [{eventType, emailEnabled, pushEnabled, inAppEnabled}]
   */
  getNotificationPreferences(): Observable<NotificationChannelPreference[]> {
    return this.http.get<NotificationChannelPreference[]>(`${this.notifBase}/preferences`).pipe(
      catchError(err => { console.error('[ProfileService] getNotificationPreferences', err); return of([]); })
    );
  }

  /**
   * PATCH de preferencias — /api/v1/notifications/preferences.
   */
  updateNotificationPreferences(patch: Partial<NotificationChannelPreference>): Observable<NotificationChannelPreference[]> {
    return this.http.patch<NotificationChannelPreference[]>(`${this.notifBase}/preferences`, patch).pipe(
      catchError(err => { console.error('[ProfileService] updateNotificationPreferences', err); return of([]); })
    );
  }

  /**
   * Inbox de notificaciones recibidas — GET /api/v1/profile/notifications (DEBT-043).
   * Devuelve las últimas 20 notificaciones del usuario.
   */
  getNotificationInbox(): Observable<UserNotificationItem[]> {
    return this.http.get<UserNotificationItem[]>(`${this.base}/notifications`).pipe(
      catchError(err => { console.error('[ProfileService] getNotificationInbox', err); return of([]); })
    );
  }

  getSessions(): Observable<SessionInfo[]> {
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
