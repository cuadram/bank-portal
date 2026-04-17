import { Component, OnInit } from '@angular/core';
import { PfmService } from '../../services/pfm.service';
import {
  PfmDistributionResponse, CATEGORY_LABELS, CATEGORY_ICONS,
  PFM_CATEGORY_COLORS, formatYearMonth
} from '../../models/pfm.models';

/**
 * Smart — distribución donut CSS conic-gradient + top comercios.
 * BUG-PO-006 fix: gráfico donut conic-gradient real.
 * BUG-PO-019 fix: top-3 badge azul .merchant-rank.top3.
 * BUG-PO-020 fix: card resumen con total y mayor categoría.
 * BUG-PO-032 fix: título "Distribución de gasto · Abril 2026".
 * US-F023-07 · DEBT-047 · FEAT-023 Sprint 25.
 */
@Component({
  selector: 'app-pfm-distribution',
  template: `
    <div class="page-title">Distribución de gasto · {{ mesLabel }}</div>

    <div *ngIf="loading" class="pfm-loading">Cargando distribución...</div>

    <div *ngIf="!loading && data">
      <!-- Fila superior: donut+leyenda | card resumen -->
      <div class="top-grid">
        <!-- Card Donut + leyenda -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Por categoría</span>
          </div>
          <div class="card-body donut-layout">
            <!-- BUG-PO-006: conic-gradient real -->
            <div class="donut-chart" [style.background]="donutGradient"></div>
            <div class="dist-legend">
              <div class="dist-leg-row" *ngFor="let d of data.distribucion">
                <div class="dist-leg-dot" [style.background]="catColor(d.categoryCode)"></div>
                <span class="dist-leg-icon">{{ catIcon(d.categoryCode) }}</span>
                <span class="dist-leg-name">{{ label(d.categoryCode) }}</span>
                <span class="dist-leg-pct">{{ d.porcentaje | number:'1.1-1' }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BUG-PO-020: card resumen -->
        <div class="card">
          <div class="card-header"><span class="card-title">Resumen</span></div>
          <div class="card-body">
            <div class="resumen-total">{{ totalGasto | number:'1.2-2' }} €</div>
            <div class="resumen-sub">Total gasto CARGO {{ mesLabel }}</div>
            <div class="resumen-label">Mayor categoría de gasto</div>
            <div class="top-cat" *ngIf="topCategoria">
              <span class="top-cat-icon">{{ catIcon(topCategoria.categoryCode) }}</span>
              <div>
                <div class="top-cat-name">{{ label(topCategoria.categoryCode) }}</div>
                <div class="top-cat-detail">
                  {{ topCategoria.totalImporte | number:'1.2-2' }} € ·
                  {{ topCategoria.porcentaje | number:'1.1-1' }}% del total
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Top comercios -->
      <div class="card" style="margin-top:1.5rem">
        <div class="card-header">
          <span class="card-title">Top Comercios</span>
          <span class="card-period">{{ mesLabel }}</span>
        </div>
        <div class="merchant-list">
          <div class="merchant-row" *ngFor="let m of data.topComercios; let i=index">
            <!-- BUG-PO-019: badge top-3 azul -->
            <div class="merchant-rank" [class.top3]="i < 3">{{ i + 1 }}</div>
            <div class="merchant-info">
              <div class="merchant-name">{{ m.nombre }}</div>
              <div class="merchant-count">{{ m.numTransacciones }} transacción{{ m.numTransacciones !== 1 ? 'es' : '' }}</div>
            </div>
            <div class="merchant-amount">{{ m.totalImporte | number:'1.2-2' }} €</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-title { font-size:1.5rem; font-weight:700; color:#1A2332; margin-bottom:1.5rem; }

    .top-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; }

    .card { background:#fff; border:1px solid #E8ECF0; border-radius:12px;
            box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .card-header { padding:1rem 1.25rem; border-bottom:1px solid #E8ECF0;
                   display:flex; align-items:center; justify-content:space-between; }
    .card-title  { font-size:1rem; font-weight:600; color:#1A2332; }
    .card-period { font-size:.82rem; color:#4A5568; }
    .card-body   { padding:1.25rem; }

    /* Donut layout */
    .donut-layout { display:flex; align-items:center; gap:1.5rem; }
    /* BUG-PO-006: donut real */
    .donut-chart  {
      width:180px; height:180px; border-radius:50%; flex-shrink:0;
      box-shadow:0 4px 20px rgba(0,0,0,.12);
    }
    .dist-legend  { display:flex; flex-direction:column; gap:.5rem; flex:1; }
    .dist-leg-row { display:flex; align-items:center; gap:.5rem; font-size:.82rem; }
    .dist-leg-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; }
    .dist-leg-icon{ font-size:14px; }
    .dist-leg-name{ flex:1; color:#4A5568; }
    .dist-leg-pct { font-weight:600; color:#1A2332; font-variant-numeric:tabular-nums; min-width:38px; text-align:right; }

    /* Card resumen */
    .resumen-total { font-size:1.75rem; font-weight:700; color:#1A2332;
                     font-variant-numeric:tabular-nums; margin-bottom:.25rem; }
    .resumen-sub   { font-size:.8rem; color:#4A5568; margin-bottom:1.25rem; }
    .resumen-label { font-size:.82rem; color:#4A5568; margin-bottom:.5rem; }
    .top-cat       { display:flex; align-items:center; gap:.75rem; padding:.75rem;
                     background:#F5F7FA; border-radius:8px; }
    .top-cat-icon  { font-size:1.5rem; }
    .top-cat-name  { font-weight:600; color:#1A2332; }
    .top-cat-detail{ font-size:.8rem; color:#4A5568; }

    /* Comercios */
    .merchant-list { }
    .merchant-row  {
      display:flex; align-items:center; gap:1rem; padding:.75rem 1.25rem;
      border-bottom:1px solid #E8ECF0; cursor:pointer; transition:background .15s;
    }
    .merchant-row:last-child { border-bottom:none; }
    .merchant-row:hover { background:#E3F0FB; }

    /* BUG-PO-019: badge top-3 */
    .merchant-rank {
      width:28px; height:28px; border-radius:50%; background:#F5F7FA;
      display:flex; align-items:center; justify-content:center;
      font-size:.82rem; font-weight:700; color:#4A5568; flex-shrink:0;
    }
    .merchant-rank.top3 { background:#1B5E99; color:#fff; }

    .merchant-info  { flex:1; min-width:0; }
    .merchant-name  { font-weight:500; color:#1A2332; font-size:.9rem; }
    .merchant-count { font-size:.78rem; color:#4A5568; }
    .merchant-amount{ width:7rem; text-align:right; font-variant-numeric:tabular-nums;
                      font-weight:600; color:#1A2332; flex-shrink:0; font-size:.9rem; }

    .pfm-loading { color:#888; padding:2rem; text-align:center; }
    @media(max-width:768px){ .top-grid { grid-template-columns:1fr; } }
  `]
})
export class PfmDistributionComponent implements OnInit {
  data?: PfmDistributionResponse;
  loading = true;
  readonly mesLabel = formatYearMonth(new Date().toISOString().substring(0, 7));

  constructor(private pfm: PfmService) {}

  ngOnInit(): void {
    this.pfm.getDistribution().subscribe({
      next: d => { this.data = d; this.loading = false; },
      error: () => this.loading = false
    });
  }

  label(code: string):    string { return CATEGORY_LABELS[code]       || code;      }
  catIcon(code: string):  string { return CATEGORY_ICONS[code]        || '📦';     }
  catColor(code: string): string { return PFM_CATEGORY_COLORS[code]   || '#9E9E9E'; }

  get totalGasto(): number {
    return this.data?.distribucion.reduce((s, d) => s + d.totalImporte, 0) ?? 0;
  }

  get topCategoria() {
    if (!this.data?.distribucion.length) return null;
    return [...this.data.distribucion].sort((a, b) => b.totalImporte - a.totalImporte)[0];
  }

  // BUG-PO-006: conic-gradient calculado dinámicamente
  get donutGradient(): string {
    if (!this.data?.distribucion.length) return '#E8ECF0';
    let pct = 0;
    const segments = this.data.distribucion.map(d => {
      const from = pct;
      pct += d.porcentaje;
      const color = this.catColor(d.categoryCode);
      return `${color} ${from.toFixed(1)}% ${pct.toFixed(1)}%`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }
}
