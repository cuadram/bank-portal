import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AutoRule } from '../../models/savings.models';

/**
 * AutoRuleSummaryComponent - US-024-05
 *
 * Panel resumen de la regla de aportacion automatica configurada.
 * Pixel-perfect contra el prototipo PROTO-FEAT-024-sprint26.html lineas 1452-1462.
 *
 * Layout:
 *   - Header uppercase '🔁 Aportacion automatica' (text-sm · text-secondary)
 *   - Importe principal '{amount} € / mes' (text-md · weight 600)
 *   - Sub linea 'Dia {dayOfMonth} · Proxima {nextExecutionDate}' (text-xs · text-secondary)
 *   - Botonera 2 botones flex:1 'Editar' + 'Pausar' (color-error)
 *
 * Inputs:
 *   - rule: AutoRule (obligatorio · si null/inactiva mostrar otro componente padre)
 *   - currency?: string (default 'EUR')
 * Outputs:
 *   - edit: emitido al pulsar Editar
 *   - pause: emitido al pulsar Pausar
 *
 * Comportamiento: si rule.active === false, oculta botones Editar/Pausar y muestra
 * solo lectura como historico. Idempotencia pause delegada al backend (RN-F024-04).
 *
 * A11y: header con scope semantico h4 · botones con label descriptivo accesible.
 */
@Component({
  selector: 'app-auto-rule-summary',
  template: `
    <div class="auto-rule-summary" *ngIf="rule">
      <h4 class="summary-header">🔁 Aportacion automatica</h4>
      <div class="summary-amount">{{ formattedAmount }} / mes</div>
      <div class="summary-sub">
        Dia {{ rule.dayOfMonth }} · Proxima {{ formattedNext }}
      </div>
      <div class="summary-actions" *ngIf="rule.active">
        <button type="button"
                class="btn btn-secondary action-edit"
                (click)="edit.emit()"
                aria-label="Editar regla de aportacion automatica">Editar</button>
        <button type="button"
                class="btn btn-secondary action-pause"
                (click)="pause.emit()"
                aria-label="Pausar regla de aportacion automatica">Pausar</button>
      </div>
      <div class="summary-paused" *ngIf="!rule.active" role="status">
        Regla pausada
      </div>
    </div>
  `,
  styles: [`
    .auto-rule-summary {
      background: var(--color-white, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      padding: var(--sp-4, 16px);
      box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
    }
    .summary-header {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
      margin: 0 0 var(--sp-3, 12px);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }
    .summary-amount {
      font-size: var(--text-md, 16px);
      font-weight: 600;
      color: var(--color-text-primary, #1a1a1a);
      font-variant-numeric: tabular-nums;
    }
    .summary-sub {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: 4px;
    }
    .summary-actions {
      display: flex;
      gap: var(--sp-2, 8px);
      margin-top: var(--sp-3, 12px);
    }
    .summary-actions .btn {
      font-size: var(--text-xs, 12px);
      flex: 1;
    }
    .summary-actions .action-pause {
      color: var(--color-error, #d92020);
    }
    .summary-paused {
      margin-top: var(--sp-3, 12px);
      padding: var(--sp-2, 8px);
      background: var(--color-surface, #f5f5f5);
      border-radius: var(--radius-sm, 4px);
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      text-align: center;
    }
  `]
})
export class AutoRuleSummaryComponent {
  @Input({ required: true }) rule!: AutoRule;
  @Input() currency: string = 'EUR';
  @Output() edit = new EventEmitter<void>();
  @Output() pause = new EventEmitter<void>();

  get formattedAmount(): string {
    if (!this.rule || typeof this.rule.amount !== 'number') return '';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this.rule.amount);
  }

  get formattedNext(): string {
    if (!this.rule?.nextExecutionAt) return '-';
    try {
      const d = new Date(this.rule.nextExecutionAt);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(d);
    } catch {
      return this.rule.nextExecutionAt;
    }
  }
}
