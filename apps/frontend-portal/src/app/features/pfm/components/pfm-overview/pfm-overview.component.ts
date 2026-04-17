import { Component, OnInit } from '@angular/core';
import { PfmService } from '../../services/pfm.service';
import {
  PfmOverviewResponse, MovimientoCategorizado,
  CATEGORY_LABELS, CATEGORY_ICONS, PFM_CATEGORY_COLORS, PFM_CATEGORY_BG
} from '../../models/pfm.models';

/**
 * Smart component — resumen PFM: KPI cards + movimientos categorizados.
 * BUG-PO-001: Math.abs() importes CARGO.
 * BUG-PO-002: KPIs correctas (Gasto / Presupuestos activos / Categorías).
 * BUG-PO-010: icono cuadrado 36×36 por categoría.
 * BUG-PO-011: botón ✏️ conectado a CategoryEditModalComponent.
 * BUG-PO-024: badge con color PFM correcto.
 * US-F023-01 · FEAT-023 Sprint 25.
 */
@Component({
  selector: 'app-pfm-overview',
  template: `
    <div class="pfm-page-header">
      <div>
        <div class="page-title">Mi Dinero</div>
        <div class="page-sub">Resumen financiero · {{ mesLabel }}</div>
      </div>
      <span class="last-update">Última actualización: hace 2 min</span>
    </div>

    <div *ngIf="loading" class="pfm-loading">Cargando movimientos...</div>

    <div *ngIf="!loading && data">
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Gasto total mes</div>
          <div class="kpi-value red">{{ gastoTotal | number:'1.2-2' }} €</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Presupuestos activos</div>
          <div class="kpi-value">{{ presupuestosActivos }} / 10</div>
          <div class="kpi-sub" *ngIf="data.budgets.length > 0">
            <span class="dot-green">●</span> {{ budgetsGreen }} bien&nbsp;
            <span class="dot-orange">●</span> {{ budgetsOrange }} atención&nbsp;
            <span class="dot-red">●</span> {{ budgetsRed }} excedido
          </div>
          <div class="kpi-sub" *ngIf="data.budgets.length === 0">Sin presupuestos configurados</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Categorías detectadas</div>
          <div class="kpi-value">{{ categoriasDetectadas }}</div>
          <div class="kpi-sub">de {{ TOTAL_CATEGORIAS }} posibles este mes</div>
        </div>
      </div>

      <div class="mv-list-header">
        <div class="mv-list-title">Movimientos del mes categorizados</div>
        <select class="cat-filter" [(ngModel)]="filtroCategoria">
          <option value="">Todas las categorías</option>
          <option *ngFor="let cat of categoriasFiltro" [value]="cat.code">{{ cat.label }}</option>
        </select>
      </div>

      <div class="mv-list">
        <div class="mv-row" *ngFor="let m of movimientosFiltrados">
          <div class="mv-icon" [style.background]="catBg(m.categoryCode)">{{ icon(m.categoryCode) }}</div>
          <div class="mv-info">
            <div class="mv-concept">{{ m.concept }}</div>
            <div class="mv-meta">
              <span class="cat-badge" [style.background]="catColor(m.categoryCode)">
                {{ label(m.categoryCode) }}
              </span>
            </div>
          </div>
          <div class="mv-amount" [class.ingreso]="m.isIngreso" [class.cargo]="!m.isIngreso">
            {{ m.isIngreso ? '+' : '-' }}{{ abs(m.amount) | number:'1.2-2' }} €
          </div>
          <button class="mv-edit"
                  [disabled]="m.isIngreso"
                  [style.opacity]="m.isIngreso ? '0.3' : '1'"
                  [style.cursor]="m.isIngreso ? 'not-allowed' : 'pointer'"
                  [title]="m.isIngreso ? 'Los ingresos no son recategorizables' : 'Editar categoría'"
                  (click)="!m.isIngreso && abrirModal(m)">✏️</button>
        </div>
      </div>

      <div class="mv-pagination">
        Mostrando {{ movimientosFiltrados.length }} de {{ data.movimientos.length }} movimientos
        <a class="ver-todos" *ngIf="filtroCategoria" (click)="filtroCategoria=''">· Ver todos</a>
      </div>
    </div>

    <!-- Modal recategorización: BUG-PO-011 -->
    <app-category-edit-modal
      *ngIf="modalMov"
      [mov]="modalMov"
      (close)="cerrarModal()"
      (updated)="onCategoryUpdated($event)">
    </app-category-edit-modal>
  `,
  styles: [`
    .pfm-page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; }
    .page-title  { font-size:1.5rem; font-weight:700; color:#1A2332; }
    .page-sub    { font-size:.9rem; color:#4A5568; margin-top:.25rem; }
    .last-update { font-size:.8rem; color:#9CA3AF; }
    .kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; margin-bottom:1.5rem; }
    .kpi-card { background:#fff; border:1px solid #E8ECF0; border-radius:12px; padding:1.25rem;
                box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .kpi-label { font-size:.8rem; color:#4A5568; margin-bottom:.5rem; }
    .kpi-value { font-size:1.5rem; font-weight:700; color:#1A2332; font-variant-numeric:tabular-nums; }
    .kpi-value.red { color:#E53935; }
    .kpi-sub   { font-size:.8rem; color:#4A5568; margin-top:.25rem; }
    .dot-green { color:#00897B; } .dot-orange { color:#F57F17; } .dot-red { color:#E53935; }
    .mv-list-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; }
    .mv-list-title  { font-size:1rem; font-weight:600; color:#1A2332; }
    .cat-filter { font-size:.82rem; padding:.3rem .6rem; border:1px solid #E8ECF0;
                  border-radius:4px; background:#fff; color:#4A5568; }
    .mv-list { background:#fff; border:1px solid #E8ECF0; border-radius:12px;
               box-shadow:0 1px 4px rgba(0,0,0,.08); overflow:hidden; }
    .mv-row  { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem;
               border-bottom:1px solid #E8ECF0; transition:background .2s; }
    .mv-row:last-child { border-bottom:none; }
    .mv-row:hover { background:#E3F0FB; }
    .mv-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center;
               justify-content:center; font-size:18px; flex-shrink:0; }
    .mv-info { flex:1; }
    .mv-concept { font-size:.9rem; font-weight:500; color:#1A2332; }
    .mv-meta    { margin-top:3px; }
    .cat-badge  { display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px;
                  font-size:.72rem; font-weight:600; color:#fff; }
    .mv-amount  { width:7rem; text-align:right; font-variant-numeric:tabular-nums;
                  font-size:.9rem; font-weight:600; flex-shrink:0; }
    .mv-amount.cargo   { color:#E53935; }
    .mv-amount.ingreso { color:#00897B; }
    .mv-edit { background:none; border:none; cursor:pointer; font-size:15px;
               color:#9CA3AF; padding:.25rem; border-radius:4px; transition:all .2s; }
    .mv-edit:hover:not(:disabled) { background:#F5F7FA; color:#1B5E99; }
    .mv-pagination { text-align:center; padding:.75rem; font-size:.82rem; color:#4A5568; }
    .ver-todos { color:#1B5E99; cursor:pointer; }
    .pfm-loading { color:#888; padding:2rem; text-align:center; }
  `]
})
export class PfmOverviewComponent implements OnInit {
  data?: PfmOverviewResponse;
  loading = true;
  filtroCategoria = '';
  modalMov: MovimientoCategorizado | null = null;
  readonly TOTAL_CATEGORIAS = 14;
  readonly mesLabel = 'Abril 2026';

  constructor(private pfm: PfmService) {}

  ngOnInit(): void {
    this.pfm.getOverview().subscribe({
      next: d => { this.data = d; this.loading = false; },
      error: () => this.loading = false
    });
  }

  get gastoTotal():          number { return Math.abs(this.data?.totalGastoMes ?? 0); }
  get presupuestosActivos(): number { return this.data?.budgets?.length ?? 0; }
  get budgetsGreen():        number { return this.data?.budgets?.filter(b => b.status === 'GREEN').length  ?? 0; }
  get budgetsOrange():       number { return this.data?.budgets?.filter(b => b.status === 'ORANGE').length ?? 0; }
  get budgetsRed():          number { return this.data?.budgets?.filter(b => b.status === 'RED').length    ?? 0; }
  get variacionMes():        number | null { return null; }

  get categoriasDetectadas(): number {
    if (!this.data) return 0;
    return new Set(this.data.movimientos.map(m => m.categoryCode)).size;
  }

  get categoriasFiltro(): { code: string; label: string }[] {
    if (!this.data) return [];
    return [...new Set(this.data.movimientos.map(m => m.categoryCode))]
      .map(code => ({ code, label: CATEGORY_LABELS[code] || code }));
  }

  get movimientosFiltrados(): MovimientoCategorizado[] {
    if (!this.data) return [];
    if (!this.filtroCategoria) return this.data.movimientos;
    return this.data.movimientos.filter(m => m.categoryCode === this.filtroCategoria);
  }

  filtrar(_e: Event): void { /* reemplazado por [(ngModel)] */ }

  abrirModal(m: MovimientoCategorizado): void  { this.modalMov = m; }
  cerrarModal(): void                           { this.modalMov = null; }

  onCategoryUpdated(newCode: string): void {
    if (this.data && this.modalMov) {
      const mov = this.data.movimientos.find(m => m.txId === this.modalMov!.txId);
      if (mov) {
        mov.categoryCode  = newCode;
        mov.categoryLabel = CATEGORY_LABELS[newCode] || newCode;
      }
    }
    this.cerrarModal();
  }

  abs(n: number):         number { return Math.abs(n); }
  label(code: string):    string { return CATEGORY_LABELS[code]     || code;      }
  icon(code: string):     string { return CATEGORY_ICONS[code]      || '📦';    }
  catColor(code: string): string { return PFM_CATEGORY_COLORS[code] || '#9E9E9E'; }
  catBg(code: string):    string { return PFM_CATEGORY_BG[code]     || '#F5F5F5'; }
}
