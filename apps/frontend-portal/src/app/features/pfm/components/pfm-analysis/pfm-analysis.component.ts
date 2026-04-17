import { Component, OnInit } from '@angular/core';
import { PfmService } from '../../services/pfm.service';
import {
  PfmAnalysisResponse, CATEGORY_LABELS, CATEGORY_ICONS, formatYearMonth
} from '../../models/pfm.models';

/**
 * Smart — análisis comparativo mensual con barras dobles.
 * BUG-PO-005 fix: formato fecha 'Abril 2026' en lugar de '2026-04'. Botón ▶ disabled en mes actual.
 * BUG-PO-007 fix: 3 KPI cards superiores (Total actual / Total anterior / Variación global).
 * BUG-PO-021 fix: variación calculada sobre Math.abs(), color correcto (rojo=sube, verde=baja).
 * BUG-PO-030 fix: título "Análisis mensual" sobre tabs.
 * US-F023-04 · FEAT-023 Sprint 25.
 */
@Component({
  selector: 'app-pfm-analysis',
  template: `
    <div class="page-title" style="margin-bottom:1.5rem">Análisis mensual</div>

    <!-- Navegación periodo: BUG-PO-005 -->
    <div class="analysis-nav">
      <button class="nav-btn" (click)="prevMonth()">◀ {{ prevMonthLabel }}</button>
      <div class="analysis-period">{{ currentMonthLabel }}</div>
      <button class="nav-btn"
              (click)="nextMonth()"
              [disabled]="isCurrentMonth"
              [style.opacity]="isCurrentMonth ? '0.4' : '1'"
              [style.cursor]="isCurrentMonth ? 'not-allowed' : 'pointer'">
        {{ nextMonthLabel }} ▶
      </button>
    </div>

    <div *ngIf="loading" class="pfm-loading">Cargando análisis...</div>

    <div *ngIf="!loading && data">
      <!-- 3 KPI cards: BUG-PO-007 -->
      <div class="analysis-summary">
        <div class="kpi-card">
          <div class="kpi-label">Total {{ currentMonthLabel }}</div>
          <div class="kpi-value">{{ totalActual | number:'1.2-2' }} €</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total {{ prevMonthLabel }}</div>
          <div class="kpi-value">{{ totalAnterior | number:'1.2-2' }} €</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Variación global</div>
          <div class="kpi-value" [class.delta-up]="variacionGlobal > 0" [class.delta-down]="variacionGlobal < 0">
            {{ variacionGlobal > 0 ? '↑ +' : variacionGlobal < 0 ? '↓ ' : '' }}{{ variacionGlobal | number:'1.1-1' }}%
          </div>
        </div>
      </div>

      <!-- Tabla comparativa por categoría -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Comparativa por categoría</span>
          <div class="leyenda">
            <span class="ley-item"><span class="ley-dot actual"></span> {{ currentMonthLabel }}</span>
            <span class="ley-item"><span class="ley-dot anterior"></span> {{ prevMonthLabel }}</span>
          </div>
        </div>
        <div class="cat-rows">
          <div class="cat-row" *ngFor="let cat of data.categorias">
            <div class="cat-name">
              {{ catIcon(cat.categoryCode) }} {{ label(cat.categoryCode) }}
            </div>
            <div class="bars">
              <div class="bar actual-bar" [style.width]="barWidth(cat.totalMesActual)"></div>
              <div class="bar anterior-bar" [style.width]="barWidth(cat.totalMesAnterior)"></div>
            </div>
            <div class="amounts">
              <div class="amt-actual">{{ absVal(cat.totalMesActual) | number:'1.2-2' }} €</div>
              <div class="amt-prev">{{ absVal(cat.totalMesAnterior) | number:'1.2-2' }} €</div>
            </div>
            <!-- BUG-PO-021: variación correcta -->
            <div class="var-pct"
                 [class.delta-up]="catVariacion(cat) > 0"
                 [class.delta-down]="catVariacion(cat) < 0">
              {{ catVariacionLabel(cat) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-title { font-size:1.5rem; font-weight:700; color:#1A2332; }

    .analysis-nav {
      display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem;
    }
    .nav-btn {
      background:#fff; border:1px solid #E8ECF0; border-radius:8px;
      padding:.4rem 1rem; cursor:pointer; font-size:.9rem; color:#4A5568; transition:all .2s;
    }
    .nav-btn:hover:not(:disabled) { border-color:#1B5E99; color:#1B5E99; }
    .analysis-period { font-size:1.25rem; font-weight:700; color:#1A2332; }

    .analysis-summary {
      display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem; margin-bottom:1.5rem;
    }
    .kpi-card { background:#fff; border:1px solid #E8ECF0; border-radius:12px;
                padding:1.25rem; box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .kpi-label { font-size:.8rem; color:#4A5568; margin-bottom:.5rem; }
    .kpi-value { font-size:1.4rem; font-weight:700; color:#1A2332; font-variant-numeric:tabular-nums; }

    .delta-up   { color:#E53935; }
    .delta-down { color:#00897B; }

    .card { background:#fff; border:1px solid #E8ECF0; border-radius:12px;
            box-shadow:0 1px 4px rgba(0,0,0,.08); overflow:hidden; }
    .card-header {
      padding:1rem 1.25rem; border-bottom:1px solid #E8ECF0;
      display:flex; align-items:center; justify-content:space-between;
    }
    .card-title { font-size:1rem; font-weight:600; color:#1A2332; }
    .leyenda { display:flex; gap:1rem; font-size:.82rem; color:#4A5568; }
    .ley-item { display:flex; align-items:center; gap:.3rem; }
    .ley-dot { width:12px; height:12px; border-radius:2px; display:inline-block; }
    .ley-dot.actual   { background:#1B5E99; }
    .ley-dot.anterior { background:#c5d8ec; }

    .cat-rows { padding:0; }
    .cat-row  {
      display:grid; grid-template-columns:140px 1fr 110px 80px;
      align-items:center; gap:1rem; padding:.75rem 1.25rem;
      border-bottom:1px solid #E8ECF0; cursor:pointer; transition:background .15s;
    }
    .cat-row:last-child { border-bottom:none; }
    .cat-row:hover { background:#E3F0FB; }

    .cat-name { font-size:.85rem; font-weight:600; color:#1A2332; }
    .bars { display:flex; flex-direction:column; gap:.3rem; }
    .bar  { height:8px; border-radius:999px; transition:width .4s; min-width:3px; }
    .actual-bar   { background:#1B5E99; }
    .anterior-bar { background:#c5d8ec; }

    .amounts { text-align:right; font-variant-numeric:tabular-nums; }
    .amt-actual { font-size:.85rem; color:#1A2332; font-weight:500; }
    .amt-prev   { font-size:.75rem; color:#4A5568; }

    .var-pct { text-align:right; font-size:.85rem; font-weight:600;
               font-variant-numeric:tabular-nums; }

    .pfm-loading { color:#888; padding:2rem; text-align:center; }
  `]
})
export class PfmAnalysisComponent implements OnInit {
  data?: PfmAnalysisResponse;
  loading = true;
  currentMonth = new Date().toISOString().substring(0, 7);
  selectedMonth = this.currentMonth;

  get isCurrentMonth(): boolean { return this.selectedMonth >= this.currentMonth; }

  // BUG-PO-005: formato nombre mes
  get currentMonthLabel(): string { return formatYearMonth(this.selectedMonth); }
  get prevMonthLabel():    string { return formatYearMonth(this.prevMonthStr()); }
  get nextMonthLabel():    string { return formatYearMonth(this.nextMonthStr()); }

  // BUG-PO-001: Math.abs() en totales
  get totalActual():   number { return Math.abs(this.data?.totalActual   ?? 0); }
  get totalAnterior(): number { return Math.abs(this.data?.totalAnterior ?? 0); }

  // BUG-PO-021: variación correcta sobre valores absolutos
  get variacionGlobal(): number {
    if (!this.totalAnterior) return 0;
    return ((this.totalActual - this.totalAnterior) / this.totalAnterior) * 100;
  }

  constructor(private pfm: PfmService) {}
  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.pfm.getAnalysis(this.selectedMonth).subscribe({
      next: d => { this.data = d; this.loading = false; },
      error: () => this.loading = false
    });
  }

  prevMonth(): void { this.selectedMonth = this.prevMonthStr(); this.load(); }
  nextMonth(): void { if (!this.isCurrentMonth) { this.selectedMonth = this.nextMonthStr(); this.load(); } }

  prevMonthStr(): string {
    const d = new Date(this.selectedMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().substring(0, 7);
  }

  nextMonthStr(): string {
    const d = new Date(this.selectedMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().substring(0, 7);
  }

  label(code: string):   string { return CATEGORY_LABELS[code] || code; }
  catIcon(code: string): string { return CATEGORY_ICONS[code]  || '📦'; }
  absVal(n: number):     number { return Math.abs(n); }

  barWidth(amount: number): string {
    if (!this.data) return '0%';
    const max = Math.max(...this.data.categorias.flatMap(c =>
      [Math.abs(c.totalMesActual), Math.abs(c.totalMesAnterior)]));
    return max > 0 ? `${Math.min((Math.abs(amount) / max) * 100, 100)}%` : '0%';
  }

  catVariacion(cat: { totalMesActual: number; totalMesAnterior: number }): number {
    const prev = Math.abs(cat.totalMesAnterior);
    const curr = Math.abs(cat.totalMesActual);
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  }

  catVariacionLabel(cat: { totalMesActual: number; totalMesAnterior: number }): string {
    const prev = Math.abs(cat.totalMesAnterior);
    const v = this.catVariacion(cat);
    if (prev === 0) return '↑ Nuevo';
    return `${v > 0 ? '↑ +' : '↓ '}${Math.abs(v).toFixed(1)}%`;
  }
}
