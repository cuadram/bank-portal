import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  DashboardService, DashboardSummary, SpendingCategory,
  TopMerchant, MonthlyEvolution, MonthComparison, BudgetAlert
} from './services/dashboard.service';

/**
 * DashboardComponent — página principal del dashboard analítico.
 * Carga los datos en paralelo con forkJoin y gestiona estados de carga/error.
 * US-1101/1102/1103/1104/1105/1106 FEAT-011 Sprint 13.
 */
@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard-page">
      <header class="dash-header">
        <h1>🏦 Dashboard Analítico</h1>
        <div class="export-actions">
          <button (click)="exportPdf()" class="btn-export" title="Exportar PDF">📄 PDF</button>
          <button (click)="exportExcel()" class="btn-export" title="Exportar Excel">📊 Excel</button>
          <button (click)="logout()" class="btn-logout" title="Cerrar sesión">🔓 Salir</button>
        </div>
      </header>

      <!-- Alertas de presupuesto -->
      <app-budget-alerts [alerts]="alerts"></app-budget-alerts>

      <!-- Tarjetas resumen -->
      <app-summary-cards
        [summary]="summary"
        [loading]="loading"
        [error]="hasError">
      </app-summary-cards>

      <div class="charts-grid">
        <!-- Gráfico donut categorías + top comercios -->
        <div class="chart-col">
          <app-categories-chart
            [categories]="categories"
            [loading]="loading">
          </app-categories-chart>
        </div>

        <!-- Comparativa mes -->
        <div class="chart-col">
          <app-month-comparison
            [comparison]="comparison"
            [loading]="loading">
          </app-month-comparison>
        </div>
      </div>

      <!-- Evolución mensual -->
      <app-evolution-chart
        [evolution]="evolution"
        [loading]="loading">
      </app-evolution-chart>
    </div>
  `,
  styles: [`
    .dashboard-page { max-width: 1200px; margin: 0 auto; padding: 1.5rem; font-family: Arial, sans-serif; }
    .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .dash-header h1 { color: #1B3A6B; margin: 0; }
    .export-actions { display: flex; gap: .5rem; }
    .btn-export {
      padding: .5rem 1rem; border: 1px solid #1B3A6B; border-radius: 6px;
      background: #fff; color: #1B3A6B; cursor: pointer; font-size: .9rem;
      transition: background .2s;
    }
    .btn-export:hover { background: #1B3A6B; color: #fff; }
    .btn-logout {
      padding: .5rem 1rem; border: 1px solid #c62828; border-radius: 6px;
      background: #fff; color: #c62828; cursor: pointer; font-size: .9rem;
      transition: background .2s;
    }
    .btn-logout:hover { background: #c62828; color: #fff; }
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
    @media (max-width: 768px) {
      .charts-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  categories: SpendingCategory[] | null = null;
  evolution: MonthlyEvolution[] | null = null;
  comparison: MonthComparison | null = null;
  alerts: BudgetAlert[] | null = null;
  loading = true;
  hasError = false;

  constructor(private dashService: DashboardService, private router: Router) {}

  ngOnInit(): void {
    forkJoin({
      summary:    this.dashService.getSummary(),
      categories: this.dashService.getCategories(),
      evolution:  this.dashService.getEvolution(),
      comparison: this.dashService.getComparison(),
      alerts:     this.dashService.getAlerts()
    }).subscribe({
      next: data => {
        this.summary    = data.summary;
        this.categories = data.categories;
        this.evolution  = data.evolution;
        this.comparison = data.comparison;
        this.alerts     = data.alerts;
        this.loading    = false;
        this.hasError   = !data.summary && !data.categories;
      },
      error: () => {
        this.loading  = false;
        this.hasError = true;
      }
    });
  }

  exportPdf(): void   { this.dashService.downloadPdf(); }
  exportExcel(): void { this.dashService.downloadExcel(); }

  logout(): void {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}
