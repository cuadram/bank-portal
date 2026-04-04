import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Mandate } from '../../models/mandate.model';
import { DirectDebitService } from '../../services/direct-debit.service';

const SHARED_STYLES = `
  .page-container { padding: 0; font-family: Arial, sans-serif; }
  .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
  .page-title { color:#1B3A6B; margin:0; font-size:1.5rem; }
  .page-subtitle { color:#888; margin:.3rem 0 0; font-size:.9rem; }
  .card { background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:1.5rem; margin-bottom:1rem; }
  .error-card { color:#c62828; text-align:center; }
  .btn-primary { background:#1B3A6B; color:#fff; border:none; border-radius:6px; padding:.6rem 1.2rem; cursor:pointer; font-weight:600; font-size:.9rem; }
  .btn-primary:hover { background:#152d55; }
  .btn-secondary { background:#fff; color:#1B3A6B; border:1px solid #1B3A6B; border-radius:6px; padding:.5rem 1rem; cursor:pointer; }
  .skeleton-row { height:40px; background:#f0f0f0; border-radius:4px; margin-bottom:.75rem; }
`;

@Component({
  selector: 'app-mandate-list',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">🔄 Domiciliaciones</h2>
          <p class="page-subtitle">Gestión de mandatos SEPA Direct Debit</p>
        </div>
        <button class="btn-primary" (click)="navigate(['/direct-debits','new'])">+ Nueva domiciliación</button>
      </div>

      <div class="stats-grid" *ngIf="!loading && !errorMsg">
        <div class="stat-card">
          <span class="stat-label">ACTIVAS</span>
          <span class="stat-value positive">{{ activeCount }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">CANCELADAS</span>
          <span class="stat-value">{{ mandates.length - activeCount }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">TOTAL MANDATOS</span>
          <span class="stat-value">{{ mandates.length }}</span>
        </div>
      </div>

      <div class="card" *ngIf="loading">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <div class="card error-card" *ngIf="errorMsg && !loading">
        <p>⚠️ {{ errorMsg }}</p>
        <button class="btn-secondary" (click)="loadMandates()">Reintentar</button>
      </div>

      <div class="card" *ngIf="!loading && !errorMsg">
        <table class="data-table">
          <thead>
            <tr>
              <th>Acreedor</th>
              <th>IBAN</th>
              <th>Referencia</th>
              <th>Estado</th>
              <th>Fecha alta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of mandates" class="table-row">
              <td><strong>{{ m.creditorName }}</strong></td>
              <td class="mono">{{ m.creditorIban }}</td>
              <td class="mono">{{ m.mandateRef }}</td>
              <td>
                <span class="badge" [class.badge-active]="m.status==='ACTIVE'" [class.badge-cancelled]="m.status!=='ACTIVE'">
                  {{ m.status === 'ACTIVE' ? 'Activa' : 'Cancelada' }}
                </span>
              </td>
              <td>{{ m.signedAt }}</td>
              <td><button class="btn-link" (click)="navigate(['/direct-debits', m.id])">Ver →</button></td>
            </tr>
            <tr *ngIf="mandates.length === 0">
              <td colspan="6" class="empty-state">No tienes domiciliaciones registradas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    ${SHARED_STYLES}
    .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.5rem; }
    .stat-card { background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:1.2rem 1.5rem; }
    .stat-label { display:block; font-size:.75rem; color:#666; text-transform:uppercase; letter-spacing:.05em; margin-bottom:.4rem; }
    .stat-value { display:block; font-size:2rem; font-weight:700; color:#1B3A6B; }
    .stat-value.positive { color:#2e7d32; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { text-align:left; padding:.75rem 1rem; font-size:.8rem; color:#666; text-transform:uppercase; border-bottom:2px solid #f0f0f0; }
    .data-table td { padding:.85rem 1rem; border-bottom:1px solid #f5f5f5; font-size:.9rem; vertical-align:middle; }
    .table-row:hover { background:#f9fafb; }
    .mono { font-family:'Courier New',monospace; font-size:.85rem; color:#555; }
    .badge { padding:.3rem .7rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .badge-active { background:#e8f5e9; color:#2e7d32; }
    .badge-cancelled { background:#f5f5f5; color:#757575; }
    .btn-link { background:none; border:none; color:#1B3A6B; cursor:pointer; font-weight:600; font-size:.85rem; }
    .btn-link:hover { text-decoration:underline; }
    .empty-state { text-align:center; padding:2rem; color:#999; }
  `]
})
export class MandateListComponent implements OnInit {
  mandates: Mandate[] = [];
  loading = true;
  errorMsg = '';

  get activeCount() { return this.mandates.filter(m => m.status === 'ACTIVE').length; }

  constructor(private service: DirectDebitService, private router: Router) {}

  ngOnInit(): void { this.loadMandates(); }

  loadMandates(): void {
    this.loading = true; this.errorMsg = '';
    this.service.getMandates().subscribe({
      next: res => { this.mandates = res.content; this.loading = false; },
      error: e => { this.errorMsg = e.message; this.loading = false; }
    });
  }

  navigate(path: string[]): void { this.router.navigate(path); }
}
