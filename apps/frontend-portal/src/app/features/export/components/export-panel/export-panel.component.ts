/**
 * export-panel.component.ts — FEAT-018 Sprint 20
 * Exportación de movimientos PDF/CSV. PSD2 Art.47, GDPR Art.15.
 */
import { Component, OnInit } from '@angular/core';
import { AccountService, AccountSummary } from '../../../accounts/services/account.service';
import { ExportService, ExportFilters, ExportPreviewResponse } from '../../services/export.service';

@Component({
  selector: 'app-export-panel',
  standalone: false,
  template: `
    <div class="export-page">
      <div class="page-header">
        <h2>Exportación de Movimientos</h2>
        <p class="subtitle">Descarga tu extracto en PDF o CSV · Máx. 12 meses · Máx. 500 registros (PSD2 Art.47)</p>
      </div>

      <div *ngIf="errorMsg" class="alert-danger">{{ errorMsg }}</div>

      <div class="export-card">

        <!-- 1. Cuenta -->
        <div class="form-section">
          <label class="form-label">Cuenta</label>
          <select class="form-select" [(ngModel)]="selectedAccountId"
                  (change)="resetPreview()" [disabled]="loadingAccounts">
            <option value="">{{ loadingAccounts ? 'Cargando cuentas...' : 'Selecciona una cuenta' }}</option>
            <option *ngFor="let acc of accounts" [value]="acc.accountId || acc.id">
              {{ acc.alias }} — {{ acc.ibanMasked }}
            </option>
          </select>
        </div>

        <!-- 2. Fechas -->
        <div class="form-row">
          <div class="form-section">
            <label class="form-label">Fecha desde</label>
            <input type="date" class="form-input" [(ngModel)]="fechaDesde"
                   [min]="minDate" [max]="today" (change)="resetPreview()"/>
          </div>
          <div class="form-section">
            <label class="form-label">Fecha hasta</label>
            <input type="date" class="form-input" [(ngModel)]="fechaHasta"
                   [min]="fechaDesde" [max]="today" (change)="resetPreview()"/>
          </div>
        </div>

        <!-- 3. Tipo movimiento -->
        <div class="form-section">
          <label class="form-label">Tipo de movimiento</label>
          <select class="form-select" [(ngModel)]="tipoMovimiento" (change)="resetPreview()">
            <option value="TODOS">Todos</option>
            <option value="CARGO">Cargos</option>
            <option value="ABONO">Abonos</option>
            <option value="DOMICILIACION">Domiciliaciones</option>
            <option value="TRANSFERENCIA_EMITIDA">Transferencias emitidas</option>
            <option value="TRANSFERENCIA_RECIBIDA">Transferencias recibidas</option>
          </select>
        </div>

        <!-- 4. Preview -->
        <div class="preview-row">
          <button class="btn btn-secondary" (click)="preview()"
                  [disabled]="!canPreview || loadingPreview">
            {{ loadingPreview ? 'Consultando...' : 'Vista previa' }}
          </button>
          <div *ngIf="previewResult !== null" class="preview-badge"
               [class.badge-warn]="previewResult.exceedsLimit"
               [class.badge-ok]="!previewResult.exceedsLimit">
            <ng-container *ngIf="!previewResult.exceedsLimit">
              {{ previewResult.count }} registros — listo para exportar
            </ng-container>
            <ng-container *ngIf="previewResult.exceedsLimit">
              {{ previewResult.count }} registros superan el límite de 500 — reduce el rango de fechas
            </ng-container>
          </div>
        </div>

        <!-- 5. Botones descarga -->
        <div class="download-row">
          <button class="btn btn-pdf" (click)="exportar('PDF')"
                  [disabled]="!canExport || loadingPdf">
            <span>📄</span>
            {{ loadingPdf ? 'Generando PDF...' : 'Descargar PDF' }}
          </button>
          <button class="btn btn-csv" (click)="exportar('CSV')"
                  [disabled]="!canExport || loadingCsv">
            <span>📊</span>
            {{ loadingCsv ? 'Generando CSV...' : 'Descargar CSV' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .export-page { max-width: 680px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    h2 { font-size: 1.4rem; font-weight: 700; color: #1B3A6B; margin: 0 0 .25rem; }
    .subtitle { color: #666; font-size: .875rem; margin: 0; }
    .alert-danger { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b;
      border-radius: 8px; padding: .75rem 1rem; margin-bottom: 1rem; font-size: .875rem; }
    .export-card { background: #fff; border-radius: 12px; padding: 1.75rem;
      box-shadow: 0 2px 10px rgba(0,0,0,.07); }
    .form-section { margin-bottom: 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-label { display: block; font-size: .8rem; font-weight: 600; color: #374151;
      margin-bottom: .35rem; text-transform: uppercase; letter-spacing: .04em; }
    .form-select, .form-input { width: 100%; padding: .55rem .75rem; border: 1px solid #d1d5db;
      border-radius: 8px; font-size: .9rem; color: #111827; background: #fff;
      outline: none; box-sizing: border-box; }
    .form-select:disabled { background: #f3f4f6; color: #9ca3af; }
    .preview-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .preview-badge { font-size: .875rem; padding: .45rem .9rem; border-radius: 20px; font-weight: 500; }
    .badge-ok   { background: #d1fae5; color: #065f46; }
    .badge-warn { background: #fef3c7; color: #92400e; }
    .download-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .btn { display: flex; align-items: center; justify-content: center; gap: .5rem;
      padding: .7rem 1.25rem; border: none; border-radius: 8px; font-size: .9rem;
      font-weight: 600; cursor: pointer; }
    .btn:disabled { opacity: .45; cursor: not-allowed; }
    .btn-secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
    .btn-pdf { background: #1B3A6B; color: #fff; }
    .btn-csv { background: #065f46; color: #fff; }
    @media (max-width: 520px) { .form-row, .download-row { grid-template-columns: 1fr; } }
  `]
})
export class ExportPanelComponent implements OnInit {

  accounts:          AccountSummary[]              = [];
  selectedAccountId  = '';
  fechaDesde         = '';
  fechaHasta         = '';
  tipoMovimiento     = 'TODOS';
  today              = new Date().toISOString().slice(0, 10);
  minDate            = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  loadingAccounts = true;
  loadingPreview  = false;
  loadingPdf      = false;
  loadingCsv      = false;

  previewResult:  ExportPreviewResponse | null = null;
  errorMsg:       string | null                = null;

  constructor(
    private accountSvc: AccountService,
    private exportSvc:  ExportService
  ) {}

  ngOnInit(): void {
    const d = new Date();
    this.fechaHasta = this.today;
    d.setMonth(d.getMonth() - 1);
    this.fechaDesde = d.toISOString().slice(0, 10);

    this.accountSvc.getAccounts().subscribe({
      next: (accs: AccountSummary[]) => { this.accounts = accs; this.loadingAccounts = false; },
      error: () => { this.errorMsg = 'No se pudieron cargar las cuentas.'; this.loadingAccounts = false; }
    });
  }

  resetPreview(): void { this.previewResult = null; }

  get canPreview(): boolean {
    return !!this.selectedAccountId && !!this.fechaDesde && !!this.fechaHasta;
  }

  get canExport(): boolean {
    return this.canPreview && this.previewResult !== null && !this.previewResult.exceedsLimit;
  }

  preview(): void {
    if (!this.canPreview) return;
    this.loadingPreview = true;
    this.errorMsg = null;
    this.exportSvc.preview(this.selectedAccountId, this.filters).subscribe({
      next: (res: ExportPreviewResponse) => { this.previewResult = res; this.loadingPreview = false; },
      error: () => { this.errorMsg = 'Error al consultar vista previa.'; this.loadingPreview = false; }
    });
  }

  exportar(formato: 'PDF' | 'CSV'): void {
    if (!this.canExport) return;
    if (formato === 'PDF') { this.loadingPdf = true; } else { this.loadingCsv = true; }
    this.errorMsg = null;

    this.exportSvc.exportDocument(this.selectedAccountId, { ...this.filters, formato }).subscribe({
      next: (blob: Blob) => {
        this.exportSvc.triggerDownload(blob, this.exportSvc.buildFilename(this.selectedAccountId, formato));
        if (formato === 'PDF') { this.loadingPdf = false; } else { this.loadingCsv = false; }
      },
      error: () => {
        this.errorMsg = `Error al generar el ${formato}. Inténtalo de nuevo.`;
        if (formato === 'PDF') { this.loadingPdf = false; } else { this.loadingCsv = false; }
      }
    });
  }

  private get filters(): ExportFilters {
    return { fechaDesde: this.fechaDesde, fechaHasta: this.fechaHasta, tipoMovimiento: this.tipoMovimiento };
  }
}
