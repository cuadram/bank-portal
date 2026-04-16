import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  DashboardService, DashboardSummary, SpendingCategory,
  MonthlyEvolution, MonthComparison, BudgetAlert, TopMerchant
} from './services/dashboard.service';

/**
 * DashboardComponent — dashboard analítico principal.
 * G1-FIX (2026-04-16): añadido topMerchants al forkJoin y al template.
 * El endpoint /top-merchants existía en backend y service pero no se llamaba.
 */
@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-page">
      <div class="dash-header">
        <div>
          <h1 class="dash-title">📊 Dashboard Analítico</h1>
          <p class="dash-subtitle">Resumen financiero del mes</p>
        </div>
        <div class="export-actions">
          <button (click)="exportPdf()"   class="btn-export">📄 PDF</button>
          <button (click)="exportExcel()" class="btn-export">📊 Excel</button>
        </div>
      </div>

      <app-budget-alerts [alerts]="alerts"></app-budget-alerts>

      <app-summary-cards [summary]="summary" [loading]="loading" [error]="hasError">
      </app-summary-cards>

      <div class="charts-grid">
        <div class="chart-col">
          <app-categories-chart [categories]="categories" [loading]="loading">
          </app-categories-chart>
        </div>
        <div class="chart-col">
          <app-month-comparison [comparison]="comparison" [loading]="loading">
          </app-month-comparison>
        </div>
      </div>

      <app-evolution-chart [evolution]="evolution" [loading]="loading">
      </app-evolution-chart>

      <!-- G1-FIX: top merchants integrado (endpoint /top-merchants ya existía) -->
      <app-top-merchants [merchants]="topMerchants" [loading]="loading">
      </app-top-merchants>
    </div>
  `,
  styles: [`
    .dashboard-page { font-family: Arial, sans-serif; }
    .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .dash-title { color: #1B3A6B; margin: 0; font-size: 1.5rem; }
    .dash-subtitle { color: #888; margin: .25rem 0 0; font-size: .9rem; }
    .export-actions { display: flex; gap: .5rem; }
    .btn-export { padding: .5rem 1rem; border: 1px solid #1B3A6B; border-radius: 6px;
      background: #fff; color: #1B3A6B; cursor: pointer; font-size: .9rem; transition: background .2s; }
    .btn-export:hover { background: #1B3A6B; color: #fff; }
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
    @media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null       = null;
  categories: SpendingCategory[] | null  = null;
  evolution: MonthlyEvolution[] | null   = null;
  comparison: MonthComparison | null     = null;
  alerts: BudgetAlert[] | null           = null;
  topMerchants: TopMerchant[] | null     = null;  // G1-FIX
  loading  = true;
  hasError = false;

  constructor(private dashService: DashboardService, private router: Router) {}

  ngOnInit(): void {
    forkJoin({
      summary:      this.dashService.getSummary(),
      categories:   this.dashService.getCategories(),
      evolution:    this.dashService.getEvolution(),
      comparison:   this.dashService.getComparison(),
      alerts:       this.dashService.getAlerts(),
      topMerchants: this.dashService.getTopMerchants()  // G1-FIX: llamada añadida
    }).subscribe({
      next: data => {
        this.summary      = data.summary;
        this.categories   = data.categories;
        this.evolution    = data.evolution;
        this.comparison   = data.comparison;
        this.alerts       = data.alerts;
        this.topMerchants = data.topMerchants;           // G1-FIX
        this.loading      = false;
        this.hasError     = !data.summary && !data.categories;
      },
      error: () => { this.loading = false; this.hasError = true; }
    });
  }

  exportPdf(): void   { this.dashService.downloadPdf(); }
  exportExcel(): void { this.dashService.downloadExcel(); }
}
