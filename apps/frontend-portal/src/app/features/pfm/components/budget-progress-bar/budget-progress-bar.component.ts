import { Component, Input } from '@angular/core';
import { BudgetDto, CATEGORY_LABELS, CATEGORY_ICONS } from '../../models/pfm.models';

/**
 * Presentational — card de presupuesto con semáforo, border-left, badge y layout prototipo.
 * BUG-PO-001 fix: Math.abs() en spent y percentConsumed.
 * BUG-PO-003 fix: semáforo verde/naranja/rojo según % consumido real.
 * BUG-PO-004 fix: layout card con border-left + cabecera dos columnas + badge estado.
 * US-F023-02 · FEAT-023 Sprint 25.
 */
@Component({
  selector: 'app-budget-progress-bar',
  template: `
    <div class="budget-card" [style.border-left]="'4px solid ' + semColor">
      <!-- Cabecera: nombre izquierda / importe+% derecha -->
      <div class="budget-header">
        <div class="budget-name">
          <span class="cat-icon">{{ icon }}</span>
          {{ label }}
        </div>
        <div class="budget-amounts">
          <div class="budget-consumed" [style.color]="semColor">
            {{ spentAbs | number:'1.2-2' }} €
            <span class="budget-limit">/ {{ budget.amountLimit | number:'1.2-2' }} €</span>
          </div>
          <div class="budget-pct" [style.color]="semColor">{{ pctDisplay }}% consumido</div>
        </div>
      </div>

      <!-- Barra progreso -->
      <div class="bar-bg">
        <div class="bar-fill"
             [style.width.%]="pctClamped"
             [style.background]="semColor"></div>
      </div>

      <!-- Footer: estado + badge -->
      <div class="budget-footer">
        <div class="budget-status" [style.color]="semColor">{{ statusText }}</div>
        <span class="badge" [ngClass]="badgeClass">{{ badgeLabel }}</span>
      </div>
    </div>
  `,
  styles: [`
    .budget-card {
      background:#fff; border:1px solid #E8ECF0; border-radius:12px;
      padding:1.25rem; box-shadow:0 1px 4px rgba(0,0,0,.08); margin-bottom:1rem;
      /* border-left se aplica via [style.border-left] */
    }
    .budget-header {
      display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:.75rem;
    }
    .budget-name {
      font-size:1rem; font-weight:600; color:#1A2332;
      display:flex; align-items:center; gap:.5rem;
    }
    .cat-icon { font-size:1.25rem; }
    .budget-amounts { text-align:right; }
    .budget-consumed { font-size:1.1rem; font-weight:700; font-variant-numeric:tabular-nums; }
    .budget-limit { font-size:.82rem; color:#4A5568; font-weight:400; }
    .budget-pct { font-size:.8rem; font-weight:600; margin-top:2px; }

    .bar-bg   { height:10px; background:#F5F7FA; border-radius:999px; overflow:hidden; margin-bottom:.5rem; }
    .bar-fill { height:100%; border-radius:999px; transition:width .6s ease; }

    .budget-footer {
      display:flex; justify-content:space-between; align-items:center; margin-top:.25rem;
    }
    .budget-status { font-size:.85rem; font-weight:500; }

    .badge {
      display:inline-flex; align-items:center; padding:3px 10px;
      border-radius:999px; font-size:.72rem; font-weight:600;
    }
    .badge-success { background:#E0F2F1; color:#00695C; }
    .badge-warning { background:#FFF8E1; color:#F57F17; }
    .badge-error   { background:#FFEBEE; color:#C62828; }
  `]
})
export class BudgetProgressBarComponent {
  @Input() budget!: BudgetDto;

  // BUG-PO-001: Math.abs() — importes y porcentajes siempre positivos
  get spentAbs():    number { return Math.abs(this.budget.spent); }
  get pctDisplay():  number { return Math.round(Math.abs(this.budget.percentConsumed)); }
  get pctClamped():  number { return Math.min(this.pctDisplay, 100); }

  get label(): string { return CATEGORY_LABELS[this.budget.categoryCode] || this.budget.categoryCode; }
  get icon():  string { return CATEGORY_ICONS[this.budget.categoryCode]  || '📦'; }

  // BUG-PO-003: semáforo por % real
  get semColor(): string {
    const pct = this.pctDisplay;
    if (pct >= 100) return '#E53935'; // rojo
    if (pct >= 80)  return '#F57F17'; // naranja
    return '#00897B';                 // verde
  }

  get statusText(): string {
    const rem = this.budget.amountLimit - this.spentAbs;
    const pct = this.pctDisplay;
    if (pct >= 100) return `✗ Excedido en ${Math.abs(rem).toFixed(2)} €`;
    if (pct >= 80)  return `⚠ Quedan ${rem.toFixed(2)} €`;
    return `✓ Quedan ${rem.toFixed(2)} €`;
  }

  get badgeLabel(): string {
    const pct = this.pctDisplay;
    if (pct >= 100) return 'Excedido';
    if (pct >= 80)  return 'Atención';
    return 'Bien';
  }

  get badgeClass(): string {
    const pct = this.pctDisplay;
    if (pct >= 100) return 'badge badge-error';
    if (pct >= 80)  return 'badge badge-warning';
    return 'badge badge-success';
  }
}
