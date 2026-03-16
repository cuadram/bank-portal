import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SecurityPreferencesResponse, UpdateSecurityPreferencesRequest } from './security-preferences.component';

export interface SecurityDashboardResponse {
  loginCount30d:      number;
  failedAttempts30d:  number;
  activeSessions:     number;
  trustedDevices:     number;
  unreadNotifications: number;
  securityScore:      'SECURE' | 'REVIEW' | 'ALERT';
  recentEvents:       AuditEventSummary[];
  activityChart:      DailyActivityPoint[];
}

export interface AuditEventSummary {
  eventType:        string;
  description:      string;
  ipMasked:         string;
  occurredAt:       string;
  unusualLocation?: boolean;  // US-604: true si subnet no está en known_subnets
}

export interface DailyActivityPoint {
  date:  string;
  count: number;
}

/**
 * HTTP client para el Panel de Auditoría de Seguridad (FEAT-005).
 *
 * @author SOFIA Developer Agent — FEAT-005 Sprint 6
 */
@Injectable({ providedIn: 'root' })
export class SecurityAuditService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/security';

  getDashboard(): Observable<SecurityDashboardResponse> {
    return this.http.get<SecurityDashboardResponse>(`${this.base}/dashboard`);
  }

  exportHistory(format: 'pdf' | 'csv', days: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/export`, {
      params: { format, days: days.toString() },
      responseType: 'blob',
      observe: 'response',
    });
  }

  // ── US-403: Preferencias ─────────────────────────────────────────────────

  getPreferences(): Observable<SecurityPreferencesResponse> {
    return this.http.get<SecurityPreferencesResponse>(`${this.base}/preferences`);
  }

  updatePreferences(request: UpdateSecurityPreferencesRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/preferences`, request);
  }

  // ── US-604: Historial de configuración ───────────────────────────────────

  getConfigHistory(days = 90): Observable<AuditEventSummary[]> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<AuditEventSummary[]>(`${this.base}/config-history`, { params });
  }
}
