import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActiveSession } from '../../store/session.model';

/**
 * Componente presentacional — tarjeta de una sesión activa.
 * Muestra: dispositivo, IP enmascarada, última actividad.
 * La sesión actual se destaca con badge y botón desactivado.
 *
 * Accesibilidad WCAG 2.1 AA:
 *  - aria-label en el botón de cierre con contexto del dispositivo
 *  - role="status" en el badge "Esta sesión"
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Component({
  selector: 'app-session-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="session-card" [class.session-card--current]="session.isCurrent">

      <!-- Header: icono dispositivo + badge -->
      <div class="session-card__header">
        <span class="session-card__device-icon" aria-hidden="true">
          {{ deviceIcon }}
        </span>
        <div class="session-card__device-info">
          <span class="session-card__device-name">
            {{ session.os }} · {{ session.browser }}
          </span>
          <span class="session-card__device-type">{{ session.deviceType }}</span>
        </div>
        @if (session.isCurrent) {
          <span class="badge badge--current" role="status">Esta sesión</span>
        }
      </div>

      <!-- Metadata -->
      <dl class="session-card__meta">
        <div class="session-card__meta-row">
          <dt>IP</dt>
          <dd>{{ session.ipMasked }}</dd>
        </div>
        <div class="session-card__meta-row">
          <dt>Último acceso</dt>
          <dd>{{ session.lastActivity | date:'dd/MM/yyyy HH:mm' }}</dd>
        </div>
        <div class="session-card__meta-row">
          <dt>Creada</dt>
          <dd>{{ session.createdAt | date:'dd/MM/yyyy HH:mm' }}</dd>
        </div>
      </dl>

      <!-- Acción -->
      @if (!session.isCurrent) {
        <button
          class="btn btn--danger"
          [disabled]="isRevoking"
          [attr.aria-label]="'Cerrar sesión en ' + session.os + ' ' + session.browser"
          [attr.aria-busy]="isRevoking"
          (click)="onRevoke()">
          @if (isRevoking) {
            <span class="spinner" aria-hidden="true"></span>
            Cerrando...
          } @else {
            Cerrar sesión
          }
        </button>
      }
    </div>
  `,
  styles: [`
    .session-card {
      border: 1px solid var(--color-border-tertiary);
      border-radius: var(--border-radius-lg);
      padding: 1rem;
      background: var(--color-background-primary);
    }
    .session-card--current {
      border-color: var(--color-border-info);
    }
    .session-card__header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .session-card__device-icon { font-size: 1.5rem; }
    .session-card__device-name { font-weight: 500; display: block; }
    .session-card__device-type { font-size: 0.75rem; color: var(--color-text-secondary); }
    .session-card__meta { display: flex; flex-direction: column; gap: 0.25rem; margin: 0 0 0.75rem; }
    .session-card__meta-row { display: flex; gap: 0.5rem; font-size: 0.875rem; }
    .session-card__meta-row dt { color: var(--color-text-secondary); min-width: 110px; }
    .badge--current {
      margin-left: auto;
      background: var(--color-background-info);
      color: var(--color-text-info);
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .btn { padding: 0.5rem 1rem; border-radius: var(--border-radius-md);
           border: 1px solid; cursor: pointer; font-size: 0.875rem; }
    .btn--danger { border-color: var(--color-border-danger); color: var(--color-text-danger);
                   background: transparent; }
    .btn--danger:hover:not(:disabled) { background: var(--color-background-danger); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner { display: inline-block; width: 12px; height: 12px;
               border: 2px solid currentColor; border-top-color: transparent;
               border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SessionCardComponent {
  @Input({ required: true }) session!: ActiveSession;
  @Input() isRevoking = false;
  @Output() revoke = new EventEmitter<string>();

  get deviceIcon(): string {
    switch (this.session.deviceType) {
      case 'mobile':  return '📱';
      case 'tablet':  return '⬜';
      default:        return '🖥';
    }
  }

  onRevoke(): void {
    this.revoke.emit(this.session.sessionId);
  }
}
