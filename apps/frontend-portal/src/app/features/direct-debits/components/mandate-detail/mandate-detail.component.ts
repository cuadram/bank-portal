import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Mandate, DirectDebit } from '../../models/mandate.model';
import { DirectDebitService } from '../../services/direct-debit.service';

const SHARED_STYLES = `
  .page-container { font-family: Arial, sans-serif; }
  .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
  .page-title { color:#1B3A6B; margin:0; font-size:1.4rem; }
  .card { background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:1.5rem; margin-bottom:1rem; }
  .btn-primary { background:#1B3A6B; color:#fff; border:none; border-radius:6px; padding:.6rem 1.2rem; cursor:pointer; font-weight:600; }
  .btn-danger { background:#c62828; color:#fff; border:none; border-radius:6px; padding:.6rem 1.2rem; cursor:pointer; font-weight:600; }
  .btn-secondary { background:#fff; color:#1B3A6B; border:1px solid #1B3A6B; border-radius:6px; padding:.5rem 1rem; cursor:pointer; }
  .skeleton-row { height:20px; background:#f0f0f0; border-radius:4px; margin-bottom:.75rem; }
`;

@Component({
  selector: 'app-mandate-detail',
  template: `
    <div class="page-container">
      <div *ngIf="loading" class="card">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]"></div>
      </div>
      <div *ngIf="errorMsg" class="card" style="color:#c62828">⚠️ {{ errorMsg }}</div>

      <ng-container *ngIf="mandate && !loading">
        <div class="page-header">
          <div>
            <h2 class="page-title">{{ mandate.creditorName }}</h2>
            <span class="badge" [class.badge-active]="mandate.status==='ACTIVE'" [class.badge-cancelled]="mandate.status!=='ACTIVE'">
              {{ mandate.status === 'ACTIVE' ? 'Activa' : 'Cancelada' }}
            </span>
          </div>
          <div style="display:flex;gap:.5rem">
            <button class="btn-secondary" (click)="router.navigate(['/direct-debits'])">← Volver</button>
            <button class="btn-danger" *ngIf="mandate.status==='ACTIVE'" (click)="cancelMandate()">Cancelar mandato</button>
          </div>
        </div>

        <div class="info-grid">
          <div class="card">
            <h3 class="section-title">Datos del mandato</h3>
            <dl class="detail-list">
              <div class="detail-row"><dt>IBAN acreedor</dt><dd class="mono">{{ mandate.creditorIban }}</dd></div>
              <div class="detail-row"><dt>Referencia (UMR)</dt><dd class="mono">{{ mandate.mandateRef }}</dd></div>
              <div class="detail-row"><dt>Tipo</dt><dd>{{ mandate.mandateType }}</dd></div>
              <div class="detail-row"><dt>Fecha autorización</dt><dd>{{ mandate.signedAt }}</dd></div>
              <div class="detail-row" *ngIf="mandate.cancelledAt"><dt>Fecha cancelación</dt><dd>{{ mandate.cancelledAt }}</dd></div>
            </dl>
          </div>
        </div>

        <div class="card">
          <h3 class="section-title">Historial de recibos</h3>
          <div *ngIf="debits.length === 0" class="empty-state">No hay recibos registrados para este mandato.</div>
          <table class="data-table" *ngIf="debits.length > 0">
            <thead>
              <tr><th>Vencimiento</th><th>Importe</th><th>Estado</th><th>Motivo devolución</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of debits" class="table-row">
                <td>{{ d.dueDate }}</td>
                <td><strong>{{ d.amount | number:'1.2-2' }} {{ d.currency }}</strong></td>
                <td>
                  <span class="badge" [ngClass]="statusClass(d.status)">{{ statusLabel(d.status) }}</span>
                </td>
                <td>{{ d.returnReason ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    ${SHARED_STYLES}
    .info-grid { display:grid; gap:1rem; margin-bottom:1rem; }
    .section-title { color:#1B3A6B; font-size:1rem; margin:0 0 1rem; border-bottom:2px solid #f0f0f0; padding-bottom:.5rem; }
    .detail-list { margin:0; }
    .detail-row { display:flex; justify-content:space-between; padding:.5rem 0; border-bottom:1px solid #f9f9f9; }
    .detail-row dt { color:#666; font-size:.85rem; }
    .detail-row dd { margin:0; font-weight:600; font-size:.9rem; }
    .mono { font-family:'Courier New',monospace; font-size:.85rem; }
    .badge { padding:.3rem .7rem; border-radius:20px; font-size:.75rem; font-weight:600; }
    .badge-active { background:#e8f5e9; color:#2e7d32; }
    .badge-cancelled { background:#f5f5f5; color:#757575; }
    .badge-pending { background:#fff8e1; color:#f57f17; }
    .badge-charged { background:#e8f5e9; color:#2e7d32; }
    .badge-returned { background:#fce4ec; color:#c62828; }
    .badge-rejected { background:#fce4ec; color:#c62828; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table th { text-align:left; padding:.75rem 1rem; font-size:.8rem; color:#666; text-transform:uppercase; border-bottom:2px solid #f0f0f0; }
    .data-table td { padding:.75rem 1rem; border-bottom:1px solid #f5f5f5; font-size:.9rem; }
    .table-row:hover { background:#f9fafb; }
    .empty-state { text-align:center; padding:2rem; color:#999; }
  `]
})
export class MandateDetailComponent implements OnInit {
  mandate?: Mandate;
  debits: DirectDebit[] = [];
  loading = true;
  errorMsg = '';

  constructor(private route: ActivatedRoute, public router: Router, private service: DirectDebitService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getMandate(id).subscribe({
      next: m => {
        this.mandate = m;
        this.service.getDebits({}).subscribe({
          next: res => { this.debits = res.content; this.loading = false; },
          error: () => { this.loading = false; }
        });
      },
      error: e => { this.errorMsg = e.message; this.loading = false; }
    });
  }

  cancelMandate(): void {
    if (this.mandate) this.router.navigate(['/direct-debits', this.mandate.id, 'cancel']);
  }

  statusLabel(s: string): string {
    return { PENDING:'Pendiente', CHARGED:'Cobrado', RETURNED:'Devuelto', REJECTED:'Rechazado' }[s] ?? s;
  }

  statusClass(s: string): string {
    return { PENDING:'badge-pending', CHARGED:'badge-charged', RETURNED:'badge-returned', REJECTED:'badge-rejected' }[s] ?? '';
  }
}
