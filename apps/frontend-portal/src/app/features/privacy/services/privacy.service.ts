// privacy.service.ts — FEAT-019 Sprint 21
// HTTP client para /api/v1/privacy/**
import { Injectable, inject } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable }          from 'rxjs';
import { catchError }          from 'rxjs/operators';
import { EMPTY }               from 'rxjs';

export type ConsentType = 'MARKETING' | 'ANALYTICS' | 'COMMUNICATIONS' | 'SECURITY';
export type GdprRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface ConsentResponse {
  tipo: ConsentType;
  activo: boolean;
  updatedAt: string;
}

export interface DataExportResponse {
  requestId: string;
  estado: GdprRequestStatus;
  slaDeadline: string;
}

export interface ConsentUpdateRequest {
  tipo: ConsentType;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class PrivacyService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/privacy';

  // RF-019-04: consentimientos
  getConsents(): Observable<ConsentResponse[]> {
    return this.http.get<ConsentResponse[]>(`${this.base}/consents`).pipe(
      catchError(err => { console.error('[PrivacyService] getConsents', err); return EMPTY; })
    );
  }

  updateConsent(dto: ConsentUpdateRequest): Observable<ConsentResponse> {
    return this.http.patch<ConsentResponse>(`${this.base}/consents`, dto).pipe(
      catchError(err => { console.error('[PrivacyService] updateConsent', err); throw err; })
    );
  }

  // RF-019-05: portabilidad
  requestDataExport(): Observable<DataExportResponse> {
    return this.http.post<DataExportResponse>(`${this.base}/data-export`, {}).pipe(
      catchError(err => { console.error('[PrivacyService] requestDataExport', err); throw err; })
    );
  }

  getExportStatus(): Observable<DataExportResponse> {
    return this.http.get<DataExportResponse>(`${this.base}/data-export/status`).pipe(
      catchError(err => { console.error('[PrivacyService] getExportStatus', err); return EMPTY; })
    );
  }

  // RF-019-06: eliminación
  requestDeletion(otpCode: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/deletion-request`, { otpCode }).pipe(
      catchError(err => { console.error('[PrivacyService] requestDeletion', err); throw err; })
    );
  }
}
