import { Component, Input } from '@angular/core';

/**
 * GoalProjectionBannerComponent — RN-F024-08
 *
 * Banner informativo de proyeccion del objetivo. Variante OK / WARN segun atRisk.
 * Pixel-perfect contra el prototipo PROTO-FEAT-024-sprint26.html (.alert-info).
 *
 * Cuando atRisk=true: emoji warning + texto 'A este ritmo no llegaras a tiempo'
 * + sugerencia de aporte mensual. Cuando atRisk=false (default): emoji ok +
 * proyeccion estimada de finalizacion. Texto OFF significa proyeccion no calculable
 * (sin aportaciones aun, o monthlyContribution=0 en GoalProjectionService backend).
 *
 * Inputs:
 *   - atRisk: boolean (default false)
 *   - projectedDate?: string (formato 'YYYY-MM' o 'Mes YYYY' precomputado backend)
 *   - suggestedMonthly?: number (importe sugerido EUR cuando atRisk)
 *   - currency?: string (default 'EUR')
 *
 * A11y: role="status" + aria-live polite (cambia dinamicamente al recalcular).
 */
@Component({
  selector: 'app-goal-projection-banner',
  template: `
    <div class="projection-banner"
         [class.banner-ok]="!atRisk"
         [class.banner-warn]="atRisk"
         role="status"
         aria-live="polite">
      <span class="banner-icon" aria-hidden="true">{{ atRisk ? '⚠️' : '✅' }}</span>
      <span class="banner-text">
        <ng-container *ngIf="atRisk; else okTpl">
          <strong>Atencion:</strong> a este ritmo no llegaras a tiempo.
          <ng-container *ngIf="suggestedMonthly && suggestedMonthly > 0">
            Sugerencia: aporta <strong>{{ formattedMonthly }}</strong>/mes.
          </ng-container>
        </ng-container>
        <ng-template #okTpl>
          <ng-container *ngIf="projectedDate; else noProjTpl">
            Proyeccion: alcanzaras tu objetivo en <strong>{{ projectedDate }}</strong>.
          </ng-container>
          <ng-template #noProjTpl>
            Realiza tu primera aportacion para ver la proyeccion.
          </ng-template>
        </ng-template>
      </span>
    </div>
  `,
  styles: [`
    .projection-banner {
      display: flex;
      gap: var(--sp-2, 8px);
      align-items: flex-start;
      padding: var(--sp-3, 12px);
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 14px);
      border-left: 4px solid;
      margin: var(--sp-3, 12px) 0;
    }
    .banner-ok {
      background: var(--color-info-light, #e3f2fd);
      color: var(--color-info, #0c3a6e);
      border-left-color: var(--color-info, #1976d2);
    }
    .banner-warn {
      background: var(--color-warning-light, #fff8e1);
      color: var(--color-warning, #b26a00);
      border-left-color: var(--color-warning, #f57f17);
    }
    .banner-icon {
      font-size: 18px;
      line-height: 1;
      flex-shrink: 0;
    }
    .banner-text {
      flex: 1;
      line-height: 1.4;
    }
  `]
})
export class GoalProjectionBannerComponent {
  @Input() atRisk: boolean = false;
  @Input() projectedDate: string | null = null;
  @Input() suggestedMonthly: number | null = null;
  @Input() currency: string = 'EUR';

  get formattedMonthly(): string {
    if (this.suggestedMonthly == null) return '';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this.suggestedMonthly);
  }
}
