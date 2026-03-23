import { Component, Input } from '@angular/core';
import { BudgetAlert } from '../../services/dashboard.service';

/**
 * BudgetAlertsComponent — banner de alerta cuando se supera el 80%.
 * US-1105 FEAT-011 Sprint 13.
 */
@Component({
  selector: 'app-budget-alerts',
  template: `
    <div *ngIf="alerts && alerts.length > 0" class="alert-banner">
      <span class="icon">⚠️</span>
      <div>
        <strong>Alerta de presupuesto</strong>
        <p>Has usado el <strong>{{ alerts[0].usedPercent | number:'1.1-1' }}%</strong>
           de tu presupuesto mensual
           ({{ alerts[0].currentAmount | currency:'EUR':'symbol':'1.2-2':'es' }}
           de {{ alerts[0].monthlyBudget | currency:'EUR':'symbol':'1.2-2':'es' }}).</p>
      </div>
    </div>
  `,
  styles: [`
    .alert-banner {
      display: flex; align-items: flex-start; gap: 1rem;
      background: #fff3e0; border: 1px solid #ff9800;
      border-left: 4px solid #e65100;
      border-radius: 8px; padding: 1rem 1.5rem;
      margin-bottom: 1rem;
    }
    .icon { font-size: 1.5rem; }
    p { margin: .25rem 0 0; color: #555; font-size: .9rem; }
  `]
})
export class BudgetAlertsComponent {
  @Input() alerts: BudgetAlert[] | null = null;
}
