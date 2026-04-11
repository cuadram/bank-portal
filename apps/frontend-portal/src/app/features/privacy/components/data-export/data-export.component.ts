// data-export.component.ts — FEAT-019 Sprint 21 — RF-019-05
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DataExportResponse } from '../../services/privacy.service';

@Component({
  selector: 'app-data-export',
  standalone: false,
  template: `
    <div class="export-card">
      <div class="card-row">
        <div class="card-icon">📥</div>
        <div class="card-info">
          <div class="card-title">Descargar mis datos</div>
          <div class="card-desc">
            Recibe un JSON con todos tus datos personales · GDPR Art.15 y Art.20
          </div>
          <div *ngIf="exportStatus" class="export-status"
               [class.pending]="exportStatus.estado !== 'COMPLETED'">
            Estado: <strong>{{ exportStatus.estado }}</strong>
            <span *ngIf="exportStatus.estado === 'PENDING'">
              · Recibirás una notificación push cuando esté listo (máx. 24h)
            </span>
          </div>
        </div>
        <button class="btn-outline"
                [disabled]="exportStatus?.estado === 'PENDING' || exportStatus?.estado === 'IN_PROGRESS'"
                (click)="onRequest()">
          {{ exportStatus ? 'En proceso...' : 'Solicitar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .export-card { background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; }
    .card-row { display: flex; align-items: center; gap: 14px; }
    .card-icon { width: 44px; height: 44px; background: #EFF6FF; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .card-info { flex: 1; }
    .card-title { font-size: 14px; font-weight: 600; color: #111827; }
    .card-desc  { font-size: 12px; color: #6B7280; margin-top: 3px; }
    .export-status { font-size: 12px; color: #1B3E7E; margin-top: 4px; }
    .export-status.pending { color: #D97706; }
    .btn-outline { background: white; color: #1B3E7E; border: 1px solid #1B3E7E;
      padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; white-space: nowrap; }
    .btn-outline:disabled { opacity: .5; cursor: not-allowed; }
    .btn-outline:not(:disabled):hover { background: #EFF6FF; }
  `]
})
export class DataExportComponent {
  @Input()  exportStatus: DataExportResponse | null = null;
  @Output() exportRequested = new EventEmitter<void>();

  onRequest(): void { this.exportRequested.emit(); }
}
