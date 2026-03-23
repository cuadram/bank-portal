/**
 * profile.service.ts — FEAT-012-A Sprint 14
 * RV-023 fix: eliminado import 'tap' no utilizado.
 * @author SOFIA Developer Agent — Sprint 14 | RV-023 fix Code Review
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable, EMPTY }   from 'rxjs';
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
    return this.http.get<NotificationPreference[]>(`${this.base}/notifications`).pipe(
      catchError(err => { console.error('[ProfileService] getNotifications', err); return EMPTY; })
    );
  }

  updateNotifications(patch: Partial<Record<NotificationCode, boolean>>): Observable<NotificationPreference[]> {
    return this.http.patch<NotificationPreference[]>(`${this.base}/notifications`, patch).pipe(
      catchError(err => { console.error('[ProfileService] updateNotifications', err); return EMPTY; })
    );
  }

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
