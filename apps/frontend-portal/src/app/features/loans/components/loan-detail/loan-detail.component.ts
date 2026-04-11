import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoanService } from '../../services/loan.service';
import { LoanDetail, AmortizationRow } from '../../models/loan.model';

@Component({
  selector: 'app-loan-detail',
  template: `
    <div class="loan-detail-page">
      <div class="page-header">
        <a routerLink="/prestamos" class="back-link">← Mis Préstamos</a>
        <h1>Detalle del Préstamo</h1>
      </div>

      <div *ngIf="loading" class="skeleton-block"></div>

      <div *ngIf="!loading && loan" class="detail-container">
        <div class="detail-card">
          <div class="detail-header">
            <div>
              <div class="loan-tipo">{{ loan.tipo }}</div>
              <div class="loan-importe">{{ loan.importeOriginal | currency:'EUR':'symbol':'1.2-2':'es' }}</div>
            </div>
            <span class="loan-estado" [class]="'estado-' + loan.estado.toLowerCase()">{{ loan.estado }}</span>
          </div>

          <div class="detail-grid">
            <div class="detail-item"><span class="dl">Cuota mensual</span><span class="dv">{{ loan.cuotaMensual | currency:'EUR':'symbol':'1.2-2':'es' }}</span></div>
            <div class="detail-item"><span class="dl">TAE</span><span class="dv">{{ loan.tae }}%</span></div>
            <div class="detail-item"><span class="dl">Plazo</span><span class="dv">{{ loan.plazo }} meses</span></div>
            <div class="detail-item"><span class="dl">Capital pendiente</span><span class="dv">{{ loan.importePendiente | currency:'EUR':'symbol':'1.2-2':'es' }}</span></div>
            <div class="detail-item"><span class="dl">Coste total</span><span class="dv">{{ loan.costeTotal | currency:'EUR':'symbol':'1.2-2':'es' }}</span></div>
            <div class="detail-item"><span class="dl">Intereses totales</span><span class="dv">{{ loan.interesesTotales | currency:'EUR':'symbol':'1.2-2':'es' }}</span></div>
            <div class="detail-item"><span class="dl">Fecha inicio</span><span class="dv">{{ loan.fechaInicio }}</span></div>
            <div class="detail-item"><span class="dl">Fecha fin</span><span class="dv">{{ loan.fechaFin }}</span></div>
          </div>
        </div>

        <app-amortization-table *ngIf="amortization.length > 0" [rows]="amortization"></app-amortization-table>
      </div>

      <div *ngIf="!loading && !loan" class="error-state">
        <p>No se pudo cargar el préstamo.</p>
        <a routerLink="/prestamos" class="btn btn-primary">Volver</a>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .back-link { color: #1B3A6B; text-decoration: none; font-size: .9rem; }
    h1 { margin: .5rem 0 0; color: #1B3A6B; }
    .detail-card { background: #fff; border-radius: 10px; padding: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); margin-bottom: 1.5rem; }
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .loan-tipo { font-size: .8rem; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: .05em; }
    .loan-importe { font-size: 2rem; font-weight: 700; color: #1B3A6B; }
    .loan-estado { font-size: .8rem; padding: .3rem .8rem; border-radius: 20px; font-weight: 600; }
    .estado-active { background: #d4edda; color: #155724; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .detail-item { display: flex; flex-direction: column; }
    .dl { font-size: .75rem; color: #888; text-transform: uppercase; letter-spacing: .04em; }
    .dv { font-size: 1rem; font-weight: 600; color: #222; margin-top: .15rem; }
    .skeleton-block { height: 300px; background: #eee; border-radius: 10px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
    .error-state { text-align: center; padding: 2rem; }
    .btn { padding: .55rem 1.1rem; border-radius: 6px; text-decoration: none; background: #1B3A6B; color: #fff; }
  `]
})
export class LoanDetailComponent implements OnInit {
  loan: LoanDetail | null = null;
  amortization: AmortizationRow[] = [];
  loading = true;

  constructor(private route: ActivatedRoute, private loanService: LoanService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    // LA-STG-001: of(null)/of([]) en catchError — NUNCA EMPTY en forkJoin
    forkJoin({
      loan: this.loanService.getLoan(id),
      amortization: this.loanService.getAmortization(id)
    }).subscribe(({ loan, amortization }) => {
      this.loan = loan;
      this.amortization = amortization;
      this.loading = false;
    });
  }
}
