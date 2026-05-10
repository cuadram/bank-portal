import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SavingsGoal, GOAL_CATEGORY_LABEL } from '../../models/savings.models';

/**
 * GoalCardComponent - US-024-02
 *
 * Tarjeta clickable de objetivo en la lista. Pixel-perfect contra el prototipo
 * PROTO-FEAT-024-sprint26.html lineas 1230-1322 (.goal-card).
 *
 * Composicion:
 *   - CategoryIconComponent (40x40 emoji + color · LOTE 1)
 *   - GoalProgressBarComponent (variant ok/warn/full · LOTE 1)
 *   - Layout interno: name, category-label, target-date, amount, target, percent
 *   - Risk badge (.goal-risk-badge.ok | .risk) segun goal.projectionRisk
 *
 * Inputs:
 *   - goal: SavingsGoal (obligatorio)
 *   - currency?: string (default 'EUR')
 * Outputs:
 *   - clicked: emite el SavingsGoal completo al pulsar la card
 *
 * Decision LA-CORE-068: NO usar [href] - card clickable via (click) emitido al padre
 * que decidira si navega o abre modal. El padre (GoalListComponent G.2) usara
 * router.navigate(['/objetivos', goal.id]) sin reload.
 *
 * A11y: role="button" + tabindex="0" + (keydown.enter) para soporte teclado.
 */
@Component({
  selector: 'app-goal-card',
  template: `
    <article class="goal-card"
             role="button"
             tabindex="0"
             [attr.aria-label]="'Ver detalle de meta: ' + goal.name"
             (click)="clicked.emit(goal)"
             (keydown.enter)="clicked.emit(goal)"
             (keydown.space)="$event.preventDefault(); clicked.emit(goal)">

      <div class="goal-card-head">
        <app-category-icon [category]="goal.category" [size]="40"></app-category-icon>
        <div class="goal-card-title">
          <div class="goal-name">{{ goal.name }}</div>
          <div class="goal-cat">{{ categoryLabel }} · {{ formattedTargetDate }}</div>
        </div>
        <span class="goal-risk-badge"
              [class.risk]="goal.projectionRisk"
              [class.ok]="!goal.projectionRisk">
          {{ goal.projectionRisk ? '⚠ Riesgo' : '✓ En camino' }}
        </span>
      </div>

      <div class="goal-amounts">
        <div>
          <div class="goal-amount">{{ formattedReserved }}</div>
          <div class="goal-target">de {{ formattedTarget }}</div>
        </div>
        <div class="goal-percent"
             [class.percent-ok]="!goal.projectionRisk && goal.progressPct < 100"
             [class.percent-warn]="goal.projectionRisk"
             [class.percent-full]="goal.progressPct >= 100">{{ clampedPct }}%</div>
      </div>

      <app-goal-progress-bar
        [progressPct]="goal.progressPct"
        [atRisk]="goal.projectionRisk"></app-goal-progress-bar>
    </article>
  `,
  styles: [`
    .goal-card {
      background: var(--color-white, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      padding: var(--sp-4, 16px);
      box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
      cursor: pointer;
      transition: box-shadow 200ms ease, transform 200ms ease;
    }
    .goal-card:hover {
      box-shadow: var(--shadow-card-hover, 0 4px 12px rgba(0,0,0,0.12));
      transform: translateY(-2px);
    }
    .goal-card:focus-visible {
      outline: 2px solid var(--color-primary, #1B5E99);
      outline-offset: 2px;
    }
    .goal-card-head {
      display: flex;
      gap: var(--sp-3, 12px);
      align-items: center;
      margin-bottom: var(--sp-3, 12px);
    }
    .goal-card-title {
      flex: 1;
      min-width: 0;
    }
    .goal-name {
      font-size: var(--text-base, 16px);
      font-weight: 600;
      color: var(--color-text-primary, #1a1a1a);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .goal-cat {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: 2px;
    }
    .goal-risk-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--text-xs, 12px);
      font-weight: 500;
      flex-shrink: 0;
    }
    .goal-risk-badge.ok {
      background: var(--color-success-light, #e8f5e9);
      color: var(--color-success, #2e7d32);
    }
    .goal-risk-badge.risk {
      background: var(--color-warning-light, #fff8e1);
      color: var(--color-warning, #b26a00);
    }
    .goal-amounts {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: var(--sp-2, 8px);
    }
    .goal-amount {
      font-size: var(--text-lg, 18px);
      font-weight: 700;
      color: var(--color-text-primary, #1a1a1a);
      font-variant-numeric: tabular-nums;
    }
    .goal-target {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      font-variant-numeric: tabular-nums;
    }
    .goal-percent {
      font-size: var(--text-md, 16px);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .goal-percent.percent-ok   { color: var(--color-success, #2e7d32); }
    .goal-percent.percent-warn { color: var(--color-warning, #b26a00); }
    .goal-percent.percent-full { color: var(--color-info, #1976d2); }
  `]
})
export class GoalCardComponent {
  @Input({ required: true }) goal!: SavingsGoal;
  @Input() currency: string = 'EUR';
  @Output() clicked = new EventEmitter<SavingsGoal>();

  get categoryLabel(): string {
    return GOAL_CATEGORY_LABEL[this.goal.category] ?? this.goal.category;
  }

  get clampedPct(): number {
    const p = this.goal?.progressPct;
    if (typeof p !== 'number' || isNaN(p)) return 0;
    return Math.round(Math.max(0, Math.min(100, p)));
  }

  get formattedReserved(): string {
    return this.formatCurrency(this.goal?.reservedAmount ?? 0);
  }

  get formattedTarget(): string {
    return this.formatCurrency(this.goal?.targetAmount ?? 0);
  }

  get formattedTargetDate(): string {
    if (!this.goal?.targetDate) return '-';
    try {
      const d = new Date(this.goal.targetDate);
      return new Intl.DateTimeFormat('es-ES', {
        month: 'long',
        year: 'numeric'
      }).format(d);
    } catch {
      return this.goal.targetDate;
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
