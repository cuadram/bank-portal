/**
 * profile.service.ts — FEAT-012-A Sprint 14
 * RV-023 fix: eliminado import 'tap' no utilizado.
 * BUG-VER-001 fix (2026-04-01): getNotifications/getSessions → of([]) (LA-STG-001)
 * LA-STG-001 fix completo (2026-04-01): todos los métodos del servicio usan of(null)/of([])
 *   en catchError — ningún método retorna EMPTY porque este servicio se usa en forkJoin.
 * @author SOFIA Developer Agent — Sprint 14 | Code Review | BUG-VER-001 | LA-STG-001
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable, of }      from 'rxjs';
import { catchError }          from 'rxjs/operators';
import {
  ProfileResponse, UpdateProfileRequest, ChangePasswordRequest,
  NotificationPreference, NotificationCode, SessionInfo
} from '../models/profile.models';

@Injectable({ providedIn: 'root' })
export class ProfileService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/profile';

  getProfile(): Observable<ProfileResponse | null> {
    // LA-STG-001: of(null) en lugar de EMPTY — forkJoin requiere que todos los observables emitan
    return this.http.get<ProfileResponse>(this.base).pipe(
      catchError(err => { console.error('[ProfileService] getProfile', err); return of(null); })
    );
  }

  updateProfile(req: UpdateProfileRequest): Observable<ProfileResponse | null> {
    // LA-STG-001: of(null) en lugar de EMPTY
    return this.http.patch<ProfileResponse>(this.base, req).pipe(
      catchError(err => { console.error('[ProfileService] updateProfile', err); return of(null); })
    );
  }

  changePassword(req: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/password`, req).pipe(
      catchError(err => { console.error('[ProfileService] changePassword', err); throw err; })
    );
  }

  getNotifications(): Observable<NotificationPreference[]> {
    // LA-STG-001: of([]) en lugar de EMPTY — forkJoin requiere que todos los observables emitan
    return this.http.get<NotificationPreference[]>(`${this.base}/notifications`).pipe(
      catchError(err => { console.error('[ProfileService] getNotifications', err); return of([]); })
    );
  }

  updateNotifications(patch: Partial<Record<NotificationCode, boolean>>): Observable<NotificationPreference[]> {
    // LA-STG-001: of([]) en lugar de EMPTY
    return this.http.patch<NotificationPreference[]>(`${this.base}/notifications`, patch).pipe(
      catchError(err => { console.error('[ProfileService] updateNotifications', err); return of([]); })
    );
  }

  getSessions(): Observable<SessionInfo[]> {
    // LA-STG-001: of([]) en lugar de EMPTY — forkJoin requiere que todos los observables emitan
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
