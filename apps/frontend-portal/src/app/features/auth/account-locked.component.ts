import {
  ChangeDetectionStrategy, Component, inject, input, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * US-601/602 — Pantalla de cuenta bloqueada + solicitud de enlace de desbloqueo.
 *
 * Renderiza cuando el interceptor HTTP detecta HTTP 423 (ACCOUNT_LOCKED).
 * Permite solicitar el enlace de desbloqueo por email.
 *
 * @author SOFIA Developer Agent — FEAT-006 US-601/602 Sprint 7
 */
@Component({
  selector: 'app-account-locked',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="al" role="alert" aria-live="assertive">
      <div class="al__icon" aria-hidden="true">🔒</div>
      <h1 class="al__title">Cuenta bloqueada temporalmente</h1>
      <p class="al__desc">
        Tu cuenta ha sido bloqueada por seguridad debido a múltiples intentos
        fallidos de verificación. No se requiere contactar con soporte.
      </p>

      @if (!requested()) {
        <button class="al__btn al__btn--primary"
                [disabled]="requesting()"
                [attr.aria-busy]="requesting()"
                (click)="requestUnlock()">
          @if (requesting()) { Enviando... } @else { Enviar enlace de desbloqueo }
        </button>
      } @else {
        <div class="al__success" role="status">
          <span aria-hidden="true">✅</span>
          Hemos enviado un enlace a tu email. El enlace expira en <strong>1 hora</strong>.
        </div>
      }

      @if (error()) {
        <div class="al__error" role="alert">{{ error() }}</div>
      }

      <div class="al__divider"></div>

      <p class="al__alt-title">¿Tienes un código de recuperación?</p>
      <a class="al__btn al__btn--secondary" routerLink="/auth/verify-recovery">
        Usar código de recuperación →
      </a>
    </div>
  `,
  styles: [`
    .al { max-width: 420px; margin: 4rem auto; text-align: center; padding: 2rem;
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-secondary);
          border-radius: var(--border-radius-xl); }
    .al__icon { font-size: 3rem; margin-bottom: 1rem; }
    .al__title { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.75rem;
                 color: var(--color-text-primary); }
    .al__desc { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0 0 1.5rem;
                line-height: 1.5; }
    .al__btn { display: block; width: 100%; padding: 0.75rem 1rem;
               border-radius: var(--border-radius-md); cursor: pointer;
               font-size: 0.9375rem; font-weight: 500; text-decoration: none;
               text-align: center; border: none; margin-bottom: 0.75rem; }
    .al__btn--primary { background: var(--color-background-info); color: var(--color-text-info);
                        border: 1px solid var(--color-border-info); }
    .al__btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .al__btn--secondary { background: transparent; color: var(--color-text-secondary);
                          border: 1px solid var(--color-border-secondary); }
    .al__success { background: var(--color-background-success); color: var(--color-text-success);
                   padding: 0.875rem; border-radius: var(--border-radius-md);
                   font-size: 0.875rem; margin-bottom: 0.75rem; }
    .al__error { background: var(--color-background-danger); color: var(--color-text-danger);
                 padding: 0.75rem; border-radius: var(--border-radius-md); font-size: 0.875rem; }
    .al__divider { height: 1px; background: var(--color-border-tertiary); margin: 1.5rem 0; }
    .al__alt-title { font-size: 0.8125rem; color: var(--color-text-secondary);
                     margin: 0 0 0.75rem; }
  `],
})
export class AccountLockedComponent {

  private readonly http = inject(HttpClient);

  readonly email      = input<string>('');
  readonly requesting = signal(false);
  readonly requested  = signal(false);
  readonly error      = signal<string | null>(null);

  async requestUnlock(): Promise<void> {
    if (!this.email()) {
      this.error.set('No se pudo determinar el email. Recarga la página e inténtalo de nuevo.');
      return;
    }
    this.requesting.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.http.post<void>('/api/v1/account/unlock', { email: this.email() })
      );
      this.requested.set(true);
    } catch {
      this.error.set('Error al enviar el email. Inténtalo de nuevo en unos momentos.');
    } finally {
      this.requesting.set(false);
    }
  }
}
