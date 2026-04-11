/**
 * kyc.service.ts — FEAT-013 Sprint 15
 * HTTP service para endpoints KYC.
 * @author SOFIA Developer Agent — Sprint 15
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient }          from '@angular/common/http';
import { Observable, EMPTY }   from 'rxjs';
import { catchError }          from 'rxjs/operators';
import { DocumentType, DocumentUploadResponse, KycStatusResponse } from '../models/kyc.models';

@Injectable({ providedIn: 'root' })
export class KycService {

  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/kyc';

  /** US-1304 — Consultar estado KYC */
  getStatus(): Observable<KycStatusResponse> {
    return this.http.get<KycStatusResponse>(`${this.base}/status`).pipe(
      catchError(err => { console.error('[KycService] getStatus', err); return EMPTY; })
    );
  }

  /** US-1302 — Subir documento de identidad */
  uploadDocument(documentType: DocumentType, side: string, file: File): Observable<DocumentUploadResponse> {
    const form = new FormData();
    form.append('documentType', documentType);
    form.append('side', side);
    form.append('file', file);
    return this.http.post<DocumentUploadResponse>(`${this.base}/documents`, form).pipe(
      catchError(err => { console.error('[KycService] uploadDocument', err); throw err; })
    );
  }
}
