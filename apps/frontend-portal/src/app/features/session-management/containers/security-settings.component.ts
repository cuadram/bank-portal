import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionStore } from '../../store/session.store';
import { SessionCardComponent } from '../../components/session-card.component';
import { RevokeConfirmModalComponent } from '../../components/revoke-confirm-modal.component';

/**
 * Smart container — panel de Seguridad > Sesiones activas.
 * Orquesta el SessionStore y los componentes presentacionales.
 *
 * Ruta: /security/sessions
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [CommonModule, SessionCardComponent, RevokeConfirmModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Banner sesión eviccionada (US-104) -->
    @if (store.evictedBannerVisible()) {
      <div class="banner banner--warning" role="alert" aria-live="polite">
        <span>Tu sesión más antigua fue cerrada automáticamente por límite de sesiones.</span>
        <button class="banner__close" aria-label="Descartar aviso"
                (click)="store.dismissEvictedBanner()">✕</button>
      </div>
    }

    <section class="settings-section">
      <h1 class="settings-section__title">Sesiones activas</h1>
      <p class="settings-section__desc">
        Gestiona los dispositivos donde tienes sesión iniciada.
        Cierra las sesiones que no reconozcas.
      </p>

      <!-- Estado de carga -->
      @if (store.loading()) {
        <div class="loading-state" aria-busy="true" aria-label="Cargando sesiones">
          <span class="spinner" aria-hidden="true"></span>
          Cargando sesiones...
        </div>
      }

      <!-- Error global -->
      @if (store.error()) {
        <div class="error-banner" role="alert">{{ store.error() }}</div>
      }

      <!-- Sesión actual -->
      @if (store.currentSession(); as current) {
        <div class="sessions-group">
          <h2 class="sessions-group__label">Este dispositivo</h2>
          <app-session-card [session]="current" />
        </div>
      }

      <!-- Otras sesiones -->
      @if (store.otherSessions().length > 0) {
        <div class="sessions-group">
          <h2 class="sessions-group__label">Otros dispositivos</h2>

          @for (session of store.otherSessions(); track session.sessionId) {
            <app-session-card
              [session]="session"
              [isRevoking]="store.revoking() === session.sessionId"
              (revoke)="openRevokeModal($event)" />
          }

          <!-- Revocar todas -->
          <button
            class="btn btn--outline-danger"
            [disabled]="store.revoking() !== null"
            (click)="openRevokeAllModal()">
            Cerrar todas las demás sesiones
          </button>
        </div>
      } @else if (!store.loading()) {
        <p class="empty-state">No tienes otras sesiones activas.</p>
      }

      <!-- Timeout de inactividad (US-103) -->
      <div class="settings-group">
        <h2 class="settings-group__label">Tiempo de inactividad</h2>
        <p class="settings-group__desc">
          Tu sesión se cerrará automáticamente tras este período sin actividad.
        </p>
        <select
          class="timeout-select"
          aria-label="Tiempo de inactividad"
          [value]="store.timeoutMinutes()"
          (change)="onTimeoutChange($event)">
          <option value="15">15 minutos</option>
          <option value="30">30 minutos</option>
          <option value="60">60 minutos</option>
        </select>
      </div>
    </section>

    <!-- Modal de confirmación OTP -->
    @if (modalVisible()) {
      <app-revoke-confirm-modal
        (confirmed)="onModalConfirmed($event)"
        (cancelled)="closeModal()" />
    }
  `,
  styles: [`
    .banner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1rem; border-radius: var(--border-radius-md);
      margin-bottom: 1rem; font-size: 0.875rem;
    }
    .banner--warning {
      background: var(--color-background-warning);
      color: var(--color-text-warning);
      border: 1px solid var(--color-border-warning);
    }
    .banner__close {
      background: none; border: none; cursor: pointer;
      color: inherit; font-size: 1rem; padding: 0 0.25rem;
    }
    .settings-section { max-width: 680px; }
    .settings-section__title { font-size: 1.25rem; font-weight: 500; margin: 0 0 0.5rem; }
    .settings-section__desc  { color: var(--color-text-secondary); margin: 0 0 1.5rem; font-size: 0.875rem; }
    .sessions-group { margin-bottom: 1.5rem; }
    .sessions-group__label, .settings-group__label {
      font-size: 0.875rem; font-weight: 500;
      color: var(--color-text-secondary);
      margin: 0 0 0.75rem;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    app-session-card { display: block; margin-bottom: 0.75rem; }
    .loading-state {
      display: flex; align-items: center; gap: 0.5rem;
      color: var(--color-text-secondary); font-size: 0.875rem; padding: 1rem 0;
    }
    .error-banner {
      background: var(--color-background-danger);
      color: var(--color-text-danger);
      padding: 0.75rem 1rem;
      border-radius: var(--border-radius-md);
      margin-bottom: 1rem; font-size: 0.875rem;
    }
    .empty-state { color: var(--color-text-secondary); font-size: 0.875rem; }
    .btn { padding: 0.5rem 1rem; border-radius: var(--border-radius-md);
           border: 1px solid; cursor: pointer; font-size: 0.875rem; }
    .btn--outline-danger {
      border-color: var(--color-border-danger); color: var(--color-text-danger);
      background: transparent; margin-top: 0.5rem;
    }
    .btn--outline-danger:hover:not(:disabled) { background: var(--color-background-danger); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .settings-group { margin-top: 1.5rem; padding-top: 1.5rem;
                      border-top: 1px solid var(--color-border-tertiary); }
    .settings-group__desc { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0 0 0.75rem; }
    .timeout-select {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border-secondary);
      border-radius: var(--border-radius-md);
      background: var(--color-background-primary);
      color: var(--color-text-primary);
      font-size: 0.875rem;
    }
    .spinner {
      display: inline-block; width: 14px; height: 14px;
      border: 2px solid var(--color-border-secondary);
      border-top-color: var(--color-text-info);
      border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SecuritySettingsComponent implements OnInit {

  readonly store = inject(SessionStore);

  /** ID de la sesión pendiente de revocar (null = ninguna, 'all' = todas). */
  private pendingRevoke = signal<string | null>(null);
  readonly modalVisible  = signal(false);

  ngOnInit(): void {
    this.store.loadSessions();
  }

  openRevokeModal(sessionId: string): void {
    this.pendingRevoke.set(sessionId);
    this.modalVisible.set(true);
  }

  openRevokeAllModal(): void {
    this.pendingRevoke.set('all');
    this.modalVisible.set(true);
  }

  closeModal(): void {
    this.pendingRevoke.set(null);
    this.modalVisible.set(false);
  }

  async onModalConfirmed(otpCode: string): Promise<void> {
    const target = this.pendingRevoke();
    this.closeModal();

    if (target === 'all') {
      await this.store.revokeAllOtherSessions(otpCode);
    } else if (target) {
      await this.store.revokeSession(target, otpCode);
    }
  }

  onTimeoutChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    if ([15, 30, 60].includes(value)) {
      this.store.updateTimeout({ timeoutMinutes: value as 15 | 30 | 60 });
    }
  }
}
