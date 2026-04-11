import { Component, Input, OnChanges } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { MonthlyEvolution } from '../../services/dashboard.service';

/**
 * EvolutionChartComponent — barras Chart.js con evolución 6 meses.
 * US-1104 FEAT-011 Sprint 13.
 */
@Component({
  selector: 'app-evolution-chart',
  template: `
    <div class="chart-container">
      <h3>Evolución últimos 6 meses</h3>
      <div *ngIf="loading" class="skeleton-chart"></div>
      <canvas *ngIf="!loading && chartData" baseChart
        [data]="chartData"
        [options]="chartOptions"
        type="bar">
      </canvas>
    </div>
  `,
  styles: [`
    .chart-container { background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    h3 { color: #1B3A6B; margin-top: 0; }
    .skeleton-chart { height: 220px; background: #f0f0f0; border-radius: 4px; }
  `]
})
export class EvolutionChartComponent implements OnChanges {
  @Input() evolution: MonthlyEvolution[] | null = null;
  @Input() loading = true;

  private readonly MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  chartData: ChartData<'bar'> | null = null;
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } }
  };

  ngOnChanges(): void {
    if (this.evolution?.length) {
      const labels = this.evolution.map(e =>
        `${this.MONTHS[e.month - 1]}-${String(e.year).slice(2)}`);
      this.chartData = {
        labels,
        datasets: [
          {
            label: 'Ingresos',
            data: this.evolution.map(e => e.totalIncome),
            backgroundColor: 'rgba(33,150,243,0.6)'
          },
          {
            label: 'Gastos',
            data: this.evolution.map(e => e.totalExpenses),
            backgroundColor: 'rgba(198,40,40,0.6)'
          }
        ]
      };
    }
  }
}
