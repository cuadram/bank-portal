import { Component, Input, OnChanges } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { SpendingCategory } from '../../services/dashboard.service';

/**
 * CategoriesChartComponent — donut Chart.js con categorías de gasto.
 * US-1103 FEAT-011 Sprint 13.
 */
@Component({
  selector: 'app-categories-chart',
  template: `
    <div class="chart-container">
      <h3>Gastos por categoría</h3>
      <div *ngIf="loading" class="skeleton-chart"></div>
      <canvas *ngIf="!loading && chartData" baseChart
        [data]="chartData"
        [options]="chartOptions"
        type="doughnut">
      </canvas>
      <ul *ngIf="!loading && categories" class="legend">
        <li *ngFor="let c of categories">
          <span class="dot" [style.background]="colorFor(c.category)"></span>
          {{ c.category }} — {{ c.amount | currency:'EUR':'symbol':'1.2-2':'es' }} ({{ c.percentage | number:'1.1-1' }}%)
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .chart-container { background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    h3 { color: #1B3A6B; margin-top: 0; }
    canvas { max-height: 260px; }
    .skeleton-chart { height: 260px; background: #f0f0f0; border-radius: 50%; margin: auto; width: 260px; }
    .legend { list-style: none; padding: 0; margin-top: 1rem; }
    .legend li { display: flex; align-items: center; gap: .5rem; margin-bottom: .3rem; font-size: .9rem; }
    .dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
  `]
})
export class CategoriesChartComponent implements OnChanges {
  @Input() categories: SpendingCategory[] | null = null;
  @Input() loading = true;

  private readonly COLORS: Record<string, string> = {
    ALIMENTACION: '#4CAF50',
    TRANSPORTE:   '#2196F3',
    SERVICIOS:    '#FF9800',
    OCIO:         '#9C27B0',
    OTROS:        '#9E9E9E'
  };

  chartData: ChartData<'doughnut'> | null = null;
  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: { legend: { display: false } }
  };

  ngOnChanges(): void {
    if (this.categories?.length) {
      this.chartData = {
        labels: this.categories.map(c => c.category),
        datasets: [{
          data: this.categories.map(c => c.amount),
          backgroundColor: this.categories.map(c => this.COLORS[c.category] ?? '#9E9E9E')
        }]
      };
    }
  }

  colorFor(category: string): string {
    return this.COLORS[category] ?? '#9E9E9E';
  }
}
