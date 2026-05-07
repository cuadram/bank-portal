import { Component, Input } from '@angular/core';

/**
 * GoalProgressBarComponent — US-024-02 · US-024-03 · US-024-08
 *
 * Barra de progreso reutilizable para objetivos de ahorro.
 * Mapping fiel al prototipo PROTO-FEAT-024-sprint26.html:
 *   .goal-pbar    height 8px · background var(--color-border) · radius full
 *   .goal-pfill   transition width 400ms ease
 *   .ok    linear-gradient(90deg, #00897B, #26A69A)  · progressPct < 100 · noRisk
 *   .warn  linear-gradient(90deg, #F57F17, #FFA726)  · noRisk=false (RN-F024-08)
 *   .full  linear-gradient(90deg, #1B5E99, #42A5F5)  · progressPct >= 100
 *
 * Inputs:
 *   - progressPct: number 0..100 (saturado · LA-CORE-055 monto siempre positivo)
 *   - atRisk?: boolean (default false) → variant 'warn'
 *
 * A11y: role="progressbar" + aria-valuenow / valuemin / valuemax.
 */
@Component({
  selector: 'app-goal-progress-bar',
  template: `
    <div class="goal-pbar"
         role="progressbar"
         [attr.aria-valuenow]="clampedPct"
         aria-valuemin="0"
         aria-valuemax="100"
         [attr.aria-label]="'Progreso del objetivo: ' + clampedPct + '%'">
      <div class="goal-pfill"
           [class.ok]="variant === 'ok'"
           [class.warn]="variant === 'warn'"
           [class.full]="variant === 'full'"
           [style.width.%]="clampedPct"></div>
    </div>
  `,
  styles: [`
    .goal-pbar {
      height: 8px;
      background: var(--color-border, #e5e7eb);
      border-radius: var(--radius-full, 9999px);
      overflow: hidden;
      margin: var(--sp-3, 12px) 0;
    }
    .goal-pfill {
      height: 100%;
      border-radius: var(--radius-full, 9999px);
      transition: width 400ms ease;
    }
    .goal-pfill.ok   { background: linear-gradient(90deg, #00897B, #26A69A); }
    .goal-pfill.warn { background: linear-gradient(90deg, #F57F17, #FFA726); }
    .goal-pfill.full { background: linear-gradient(90deg, #1B5E99, #42A5F5); }
  `]
})
export class GoalProgressBarComponent {
  @Input({ required: true }) progressPct: number = 0;
  @Input() atRisk: boolean = false;

  get clampedPct(): number {
    if (typeof this.progressPct !== 'number' || isNaN(this.progressPct)) return 0;
    return Math.max(0, Math.min(100, this.progressPct));
  }

  get variant(): 'ok' | 'warn' | 'full' {
    if (this.clampedPct >= 100) return 'full';
    if (this.atRisk) return 'warn';
    return 'ok';
  }
}
