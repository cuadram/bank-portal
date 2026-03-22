import { Component, OnInit, Input } from '@angular/core';
import { DashboardSummary } from '../../services/dashboard.service';

/**
 * SummaryCardsComponent — tarjetas ingresos / gastos / saldo neto.
 * Muestra skeleton loaders mientras carga y mensaje de error si falla.
 * US-1102 FEAT-011 Sprint 13.
 */
@Component({
  selector: 'app-summary-cards',
  template: `
    <div class="summary-grid">
      <ng-container *ngIf="loading">
        <div class="card skeleton" *ngFor="let i of [1,2,3]">
          <div class="skeleton-text"></div>
          <div class="skeleton-amount"></div>
        </div>
      </ng-container>

      <ng-container *ngIf="!loading && error">
        <div class="card error-card">
          <span>⚠️ No se pueden cargar los datos ahora mismo</span>
        </div>
      </ng-container>

      <ng-container *ngIf="!loading && !error && summary">
        <div class="card income">
          <h3>Ingresos del mes</h3>
          <p class="amount positive">{{ summary.totalIncome | currency:'EUR':'symbol':'1.2-2':'es' }}</p>
        </div>
        <div class="card expenses">
          <h3>Gastos del mes</h3>
          <p class="amount negative">{{ summary.totalExpenses | currency:'EUR':'symbol':'1.2-2':'es' }}</p>
        </div>
        <div class="card balance" [class.positive]="summary.netBalance >= 0" [class.negative]="summary.netBalance < 0">
          <h3>Saldo neto</h3>
          <p class="amount">{{ summary.netBalance | currency:'EUR':'symbol':'1.2-2':'es' }}</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .summary-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; }
    .card { padding: 1.5rem; border-radius: 8px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    .card h3 { margin: 0 0 .5rem; font-size: .85rem; color: #666; text-transform: uppercase; }
    .amount { font-size: 1.6rem; font-weight: 700; margin: 0; }
    .positive .amount, .amount.positive { color: #2e7d32; }
    .negative .amount, .amount.negative { color: #c62828; }
    .error-card { grid-column: 1/-1; color: #e53935; text-align: center; }
    .skeleton { background: #f5f5f5; }
    .skeleton-text { height: 12px; background: #ddd; border-radius: 4px; margin-bottom: 1rem; width: 60%; }
    .skeleton-amount { height: 32px; background: #ddd; border-radius: 4px; width: 80%; }
  `]
})
export class SummaryCardsComponent {
  @Input() summary: DashboardSummary | null = null;
  @Input() loading = true;
  @Input() error = false;
}
