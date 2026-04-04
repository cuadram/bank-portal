import { Component, OnInit } from '@angular/core';
import { LoanService, Page } from '../../services/loan.service';
import { LoanSummary } from '../../models/loan.model';

@Component({
  selector: 'app-loan-list',
  template: `
    <div class="loan-list-page">
      <div class="page-header">
        <h1>Mis Préstamos</h1>
        <div class="header-actions">
          <a routerLink="/prestamos/simular" class="btn btn-secondary">🧮 Simular</a>
          <a routerLink="/prestamos/solicitar" class="btn btn-primary">+ Solicitar préstamo</a>
        </div>
      </div>

      <div *ngIf="loading" class="skeleton-list">
        <div class="skeleton-card" *ngFor="let i of [1,2,3]"></div>
      </div>

      <div *ngIf="!loading && loans.length === 0" class="empty-state">
        <span class="empty-icon">🏛</span>
        <h3>Sin préstamos activos</h3>
        <p>Solicita tu primer préstamo personal con condiciones adaptadas a ti.</p>
        <a routerLink="/prestamos/solicitar" class="btn btn-primary">Solicitar ahora</a>
      </div>

      <div *ngIf="!loading && loans.length > 0" class="loan-grid">
        <div class="loan-card" *ngFor="let loan of loans" [routerLink]="['/prestamos', loan.id]">
          <div class="loan-card-header">
            <span class="loan-tipo">{{ loan.tipo }}</span>
            <span class="loan-estado" [class]="'estado-' + loan.estado.toLowerCase()">{{ loan.estado }}</span>
          </div>
          <div class="loan-importe">{{ loan.importeOriginal | currency:'EUR':'symbol':'1.2-2':'es' }}</div>
          <div class="loan-meta">
            <div class="meta-item"><span class="meta-label">Cuota</span><span class="meta-value">{{ loan.cuotaMensual | currency:'EUR':'symbol':'1.2-2':'es' }}/mes</span></div>
            <div class="meta-item"><span class="meta-label">TAE</span><span class="meta-value">{{ loan.tae }}%</span></div>
            <div class="meta-item"><span class="meta-label">Pendiente</span><span class="meta-value">{{ loan.importePendiente | currency:'EUR':'symbol':'1.2-2':'es' }}</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    h1 { margin: 0; color: #1B3A6B; }
    .header-actions { display: flex; gap: .75rem; }
    .btn { padding: .55rem 1.1rem; border-radius: 6px; text-decoration: none; font-size: .9rem; cursor: pointer; border: none; }
    .btn-primary { background: #1B3A6B; color: #fff; }
    .btn-secondary { background: #fff; color: #1B3A6B; border: 1px solid #1B3A6B; }
    .loan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .loan-card { background: #fff; border-radius: 10px; padding: 1.25rem; cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.08); transition: box-shadow .15s; }
    .loan-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.15); }
    .loan-card-header { display: flex; justify-content: space-between; margin-bottom: .75rem; }
    .loan-tipo { font-weight: 600; color: #1B3A6B; text-transform: uppercase; font-size: .8rem; letter-spacing: .05em; }
    .loan-estado { font-size: .75rem; padding: .2rem .6rem; border-radius: 20px; font-weight: 600; }
    .estado-active { background: #d4edda; color: #155724; }
    .estado-pending { background: #fff3cd; color: #856404; }
    .estado-rejected { background: #f8d7da; color: #721c24; }
    .loan-importe { font-size: 1.6rem; font-weight: 700; color: #1B3A6B; margin-bottom: .75rem; }
    .loan-meta { display: flex; gap: 1rem; flex-wrap: wrap; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: .7rem; color: #888; text-transform: uppercase; }
    .meta-value { font-size: .9rem; font-weight: 600; color: #333; }
    .empty-state { text-align: center; padding: 3rem; background: #fff; border-radius: 10px; }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
    .skeleton-card { height: 140px; background: #eee; border-radius: 10px; margin-bottom: 1rem; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
  `]
})
export class LoanListComponent implements OnInit {
  loans: LoanSummary[] = [];
  loading = true;

  constructor(private loanService: LoanService) {}

  ngOnInit(): void {
    this.loanService.listLoans().subscribe(page => {
      this.loans = page.content;
      this.loading = false;
    });
  }
}
