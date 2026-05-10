import { Component, EventEmitter, Output } from '@angular/core';

/**
 * SavingsEmptyStateComponent - UX
 *
 * Estado vacio de la lista de objetivos cuando el usuario no tiene metas creadas.
 * Patron heredado del prototipo PROTO-FEAT-024-sprint26.html (.empty-state)
 * y del hermano PFM (PfmOverview empty-state lineas 927-940 prototipo).
 *
 * Layout: icono 64px + titulo + subtitulo + boton CTA primary.
 *
 * Outputs:
 *   - createClicked: emitido al pulsar 'Crear mi primera meta'
 *
 * A11y: rol implicito region · CTA enfocable + label descriptivo.
 */
@Component({
  selector: 'app-savings-empty-state',
  template: `
    <div class="empty-state" role="region" aria-label="Sin objetivos de ahorro">
      <div class="empty-icon" aria-hidden="true">🎯</div>
      <div class="empty-title">Aun no tienes metas de ahorro</div>
      <div class="empty-sub">
        Crea tu primera meta para empezar a ahorrar de forma organizada.
        Define un importe objetivo y una fecha limite, y BankPortal te ayudara a llegar.
      </div>
      <div class="empty-cta">
        <button type="button"
                class="btn btn-primary"
                (click)="createClicked.emit()">
          + Crear mi primera meta
        </button>
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--sp-12, 64px) var(--sp-6, 24px);
      text-align: center;
    }
    .empty-icon {
      font-size: 64px;
      line-height: 1;
      margin-bottom: var(--sp-4, 16px);
    }
    .empty-title {
      font-size: var(--text-xl, 20px);
      font-weight: 600;
      color: var(--color-text-primary, #1a1a1a);
      margin-bottom: var(--sp-2, 8px);
    }
    .empty-sub {
      font-size: var(--text-base, 16px);
      color: var(--color-text-secondary, #6b7280);
      max-width: 480px;
      line-height: 1.5;
      margin-bottom: var(--sp-5, 20px);
    }
    .empty-cta {
      display: flex;
      flex-direction: column;
      gap: var(--sp-3, 12px);
      width: 100%;
      max-width: 320px;
    }
    .empty-cta .btn {
      width: 100%;
      justify-content: center;
    }
  `]
})
export class SavingsEmptyStateComponent {
  @Output() createClicked = new EventEmitter<void>();
}
