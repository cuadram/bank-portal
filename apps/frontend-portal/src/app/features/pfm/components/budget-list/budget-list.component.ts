import { Component, OnInit } from '@angular/core';
import { PfmService } from '../../services/pfm.service';
import { BudgetDto, formatYearMonth } from '../../models/pfm.models';

/**
 * Smart component — lista de presupuestos.
 * BUG-PO-008 fix: formulario como vista propia (showForm flag), no inline sobre lista.
 * BUG-PO-016 fix: subtítulo "Abril 2026 · N activos · máx. 10".
 * US-F023-02 · FEAT-023 Sprint 25.
 */
@Component({
  selector: 'app-budget-list',
  template: `
    <!-- Vista: Formulario nuevo presupuesto (pantalla propia) -->
    <div *ngIf="showForm">
      <app-budget-form
        (created)="onCreated($event)"
        (cancel)="showForm=false">
      </app-budget-form>
    </div>

    <!-- Vista: Lista de presupuestos -->
    <div *ngIf="!showForm">
      <div class="list-header">
        <div>
          <div class="page-title">Mis Presupuestos</div>
          <div class="page-sub">{{ mesLabel }} · {{ budgets.length }} activos · máx. 10</div>
        </div>
        <button class="btn-primary"
                (click)="showForm=true"
                [disabled]="budgets.length >= 10"
                [title]="budgets.length >= 10 ? 'Has alcanzado el máximo de 10 presupuestos' : ''">
          + Nuevo presupuesto
        </button>
      </div>

      <div *ngIf="loading" class="pfm-loading">Cargando presupuestos...</div>

      <div *ngIf="!loading && budgets.length === 0" class="empty-state">
        <div class="empty-icon">💰</div>
        <div class="empty-title">Sin presupuestos configurados</div>
        <div class="empty-sub">Crea tu primer presupuesto para controlar tu gasto mensual.</div>
        <button class="btn-primary" (click)="showForm=true">+ Crear presupuesto</button>
      </div>

      <app-budget-progress-bar
        *ngFor="let b of budgets"
        [budget]="b">
      </app-budget-progress-bar>
    </div>
  `,
  styles: [`
    .list-header {
      display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;
    }
    .page-title { font-size:1.5rem; font-weight:700; color:#1A2332; }
    .page-sub   { font-size:.85rem; color:#4A5568; margin-top:.25rem; }
    .btn-primary {
      background:#1e3a5f; color:#fff; border:none; padding:.5rem 1rem;
      border-radius:6px; cursor:pointer; font-size:.9rem; white-space:nowrap;
    }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
    .empty-state {
      display:flex; flex-direction:column; align-items:center; padding:3rem 1rem; text-align:center;
    }
    .empty-icon  { font-size:3rem; margin-bottom:1rem; opacity:.5; }
    .empty-title { font-size:1.1rem; font-weight:600; color:#1A2332; margin-bottom:.5rem; }
    .empty-sub   { font-size:.9rem; color:#4A5568; margin-bottom:1.5rem; }
    .pfm-loading { color:#888; padding:2rem; text-align:center; }
  `]
})
export class BudgetListComponent implements OnInit {
  budgets: BudgetDto[] = [];
  loading  = true;
  showForm = false;
  readonly mesLabel = formatYearMonth(new Date().toISOString().substring(0, 7));

  constructor(private pfm: PfmService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.pfm.getBudgets().subscribe({
      next: d => { this.budgets = d; this.loading = false; },
      error: () => this.loading = false
    });
  }

  onCreated(_b: BudgetDto): void {
    this.showForm = false;
    this.load();
  }
}
