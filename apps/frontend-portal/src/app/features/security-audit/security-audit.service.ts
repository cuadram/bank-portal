import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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
  eventType:   string;
  description: string;
  ipMasked:    string;
  occurredAt:  string;
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
}
