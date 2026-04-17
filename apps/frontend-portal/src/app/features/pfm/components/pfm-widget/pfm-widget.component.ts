import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PfmService } from '../../services/pfm.service';
import { PfmWidgetResponse, CATEGORY_LABELS, CATEGORY_ICONS } from '../../models/pfm.models';

/**
 * Presentational — widget dashboard "¿Cómo voy este mes?".
 * RN-F023-15: carga asíncrona con degradación elegante.
 * RN-F023-16: navegación con Router.navigateByUrl() (LA-023-01).
 * US-F023-05. FEAT-023 Sprint 25.
 */
@Component({
  selector: 'app-pfm-widget',
  template: `
    <div class="pfm-widget" [class.error]="hasError">
      <div class="widget-header">
        <span class="widget-title">💰 Mi Dinero</span>
        <button class="widget-link" (click)="navigate()">Ver detalle →</button>
      </div>
      <div *ngIf="loading" class="widget-loading">Cargando...</div>
      <div *ngIf="!loading && hasError" class="widget-cta">
        <button (click)="navigate()">Configura tus presupuestos</button>
      </div>
      <div *ngIf="!loading && data">
        <div class="widget-kpi">
          <span class="kpi-label">Gasto total</span>
          <span class="kpi-value">{{ data.gastoTotalMes | number:'1.2-2' }} €</span>
        </div>
        <div class="semaforo" [class]="data.semaforo">{{ semaforoIcon }}</div>
        <div class="top-cats">
          <div class="top-cat" *ngFor="let c of data.topCategorias">
            <span>{{ icon(c.categoryCode) }} {{ label(c.categoryCode) }}</span>
            <span class="top-amt">{{ c.importe | number:'1.2-2' }} €</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pfm-widget{background:#fff;border-radius:10px;padding:1rem 1.2rem;
                box-shadow:0 2px 8px rgba(0,0,0,.07);min-width:200px}
    .widget-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem}
    .widget-title{font-weight:700;color:#1e3a5f}
    .widget-link{background:none;border:none;color:#2e86ab;cursor:pointer;font-size:.85rem}
    .widget-loading{color:#aaa;font-size:.85rem;text-align:center;padding:.5rem}
    .kpi-label{display:block;font-size:.75rem;color:#888}
    .kpi-value{font-size:1.3rem;font-weight:700;color:#1e3a5f;font-variant-numeric:tabular-nums}
    .semaforo{width:16px;height:16px;border-radius:50%;margin:.5rem 0;display:inline-block}
    .semaforo.GREEN{background:#27ae60}.semaforo.ORANGE{background:#f39c12}.semaforo.RED{background:#c0392b}
    .top-cats{margin-top:.6rem;display:flex;flex-direction:column;gap:.3rem}
    .top-cat{display:flex;justify-content:space-between;font-size:.82rem;color:#444}
    .top-amt{font-variant-numeric:tabular-nums;color:#1e3a5f}
    .widget-cta button{width:100%;padding:.5rem;background:#1e3a5f;color:#fff;
                       border:none;border-radius:6px;cursor:pointer;font-size:.85rem}
  `]
})
export class PfmWidgetComponent implements OnInit {
  data?: PfmWidgetResponse;
  loading = true;
  hasError = false;

  constructor(private pfm: PfmService, private router: Router) {}

  ngOnInit(): void {
    this.pfm.getWidget().subscribe({
      next: d => { this.data = d; this.loading = false; },
      error: () => { this.hasError = true; this.loading = false; }   // RN-F023-15 degradación
    });
  }

  navigate(): void { this.router.navigateByUrl('/pfm'); }   // LA-023-01

  get semaforoIcon(): string {
    return { GREEN: '🟢', ORANGE: '🟡', RED: '🔴' }[this.data?.semaforo ?? 'GREEN'] ?? '🟢';
  }

  label(code: string): string { return CATEGORY_LABELS[code] || code; }
  icon(code: string):  string { return CATEGORY_ICONS[code]  || '📦'; }
}
