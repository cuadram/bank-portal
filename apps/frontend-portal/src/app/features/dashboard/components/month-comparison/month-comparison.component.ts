import { Component, Input } from '@angular/core';
import { MonthComparison } from '../../services/dashboard.service';

/**
 * MonthComparisonComponent — variación % mes actual vs anterior.
 * US-1104 FEAT-011 Sprint 13.
 */
@Component({
  selector: 'app-month-comparison',
  template: `
    <div class="comparison-card">
      <h3>Mes actual vs anterior</h3>
      <ng-container *ngIf="loading">
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </ng-container>
      <div *ngIf="!loading && comparison">
        <div class="row">
          <div class="row-left">
            <span class="row-label">Gastos este mes</span>
            <strong>{{ comparison.currentMonth.totalExpenses | currency:'EUR':'symbol':'1.2-2':'es' }}</strong>
          </div>
          <span class="badge" [class.up]="(comparison.expensesVariationPercent ?? 0) > 0"
                              [class.down]="(comparison.expensesVariationPercent ?? 0) < 0">
            <ng-container *ngIf="comparison.expensesVariationPercent !== null">
              {{ comparison.expensesVariationPercent > 0 ? '↑' : '↓' }}
              {{ comparison.expensesVariationPercent | number:'1.1-1' }}%
            </ng-container>
            <ng-container *ngIf="comparison.expensesVariationPercent === null">—</ng-container>
          </span>
        </div>
        <div class="row">
          <div class="row-left">
            <span class="row-label">Gastos mes anterior</span>
            <strong *ngIf="comparison.previousMonth">
              {{ comparison.previousMonth.totalExpenses | currency:'EUR':'symbol':'1.2-2':'es' }}
            </strong>
            <span *ngIf="!comparison.previousMonth" class="muted">Sin datos</span>
          </div>
          <span class="badge-placeholder"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .comparison-card { background:#fff; padding:1.5rem; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.1); }
    h3 { color:#1B3A6B; margin-top:0; }
    .row { display:flex; align-items:center; justify-content:space-between; margin-bottom:.8rem; }
    .row-left { display:flex; align-items:center; gap:.75rem; }
    .row-label { color:#555; font-size:.9rem; width:10rem; flex-shrink:0; }
    .row-left strong, .row-left .muted { display:inline-block; width:7rem; text-align:right; font-variant-numeric:tabular-nums; }
    .badge-placeholder { min-width:60px; }
    .badge { padding:.2rem .6rem; border-radius:12px; font-size:.8rem; font-weight:600; }
    .badge.up { background:#ffebee; color:#c62828; }
    .badge.down { background:#e8f5e9; color:#2e7d32; }
    .muted { color:#9e9e9e; }
    .skeleton-line { height:20px; background:#f0f0f0; border-radius:4px; margin-bottom:.8rem; }
  `]
})
export class MonthComparisonComponent {
  @Input() comparison: MonthComparison | null = null;
  @Input() loading = true;
}
