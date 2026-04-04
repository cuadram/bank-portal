// FEAT-018: ExportService Angular
// LA-019-09: URLs en environment.ts Y environment.prod.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ExportFilters {
  fechaDesde: string;   // YYYY-MM-DD
  fechaHasta: string;
  tipoMovimiento: string;
}

export interface ExportPreviewResponse {
  count: number;
  exceedsLimit: boolean;
  limitMaxRecords: number;
}

export interface ExportRequest extends ExportFilters {
  formato: 'PDF' | 'CSV';
}

@Injectable({ providedIn: 'root' })
export class ExportService {

  private readonly baseUrl = environment.apiUrl + '/accounts';

  constructor(private http: HttpClient) {}

  preview(accountId: string, filters: ExportFilters): Observable<ExportPreviewResponse> {
    const params = new HttpParams()
      .set('fechaDesde', filters.fechaDesde)
      .set('fechaHasta', filters.fechaHasta)
      .set('tipoMovimiento', filters.tipoMovimiento);

    return this.http.get<ExportPreviewResponse>(
      `${this.baseUrl}/${accountId}/exports/preview`,
      { params }
    );
  }

  exportDocument(accountId: string, request: ExportRequest): Observable<Blob> {
    const format = request.formato.toLowerCase();
    return this.http.post(
      `${this.baseUrl}/${accountId}/exports/${format}`,
      { fechaDesde: request.fechaDesde, fechaHasta: request.fechaHasta,
        tipoMovimiento: request.tipoMovimiento },
      { responseType: 'blob' }
    );
  }

  triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  buildFilename(accountId: string, format: 'PDF' | 'CSV'): string {
    const suffix = accountId.slice(-8);
    const date = new Date().toISOString().slice(0, 10);
    return `movimientos_${suffix}_${date}.${format.toLowerCase()}`;
  }
}
