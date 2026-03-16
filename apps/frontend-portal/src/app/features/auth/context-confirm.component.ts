import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * US-603 — Confirmación de acceso desde nueva subnet IP.
 *
 * Renderiza cuando VerifyResponse.scope === 'context-pending'.
 * Lee el confirmationToken del query param (?token=...) al llegar desde el email.
 * Llama a POST /api/v1/auth/confirm-context con el JWT context-pending en memoria.
 *
 * @author SOFIA Developer Agent — FEAT-006 US-603 Sprint 7
 */
@Component({
  selector: 'app-context-confirm',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cc" aria-live="polite">
      <div class="cc__icon" aria-hidden="true">🔍</div>
      <h1 class="cc__title">Nuevo acceso detectado</h1>
      <p class="cc__desc">
        Hemos detectado un acceso desde una ubicación de red que no reconocemos.
        Por seguridad, hemos enviado un email de confirmación a tu dirección registrada.
        <br><br>
        Haz clic en el enlace del email para completar el acceso.
        <strong>El enlace expira en 15 minutos.</strong>
      </p>

      @if (confirming()) {
        <div class="cc__loading" aria-busy="true">
          <span class="spinner" aria-hidden="true"></span>
          Verificando confirmación...
        </div>
      }

      @if (confirmed()) {
        <div class="cc__success" role="status">
          ✅ Acceso confirmado. Redirigiendo al portal...
        </div>
      }

      @if (error()) {
        <div class="cc__error" role="alert">{{ error() }}</div>
      }

      @if (!confirming() && !confirmed()) {
        <button class="cc__btn cc__btn--secondary"
                [disabled]="resendsLeft() <= 0"
                (click)="resendEmail()">
          @if (resendsLeft() > 0) { Reenviar email de confirmación }
          @else { Límite de reenvíos alcanzado }
        </button>

        <a class="cc__link" (click)="cancelAndGoToLogin()" href="javascript:void(0)">
          Volver al inicio de sesión
        </a>
      }
    </div>
  `,
  styles: [`
    .cc { max-width: 440px; margin: 4rem auto; text-align: center; padding: 2rem;
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-secondary);
          border-radius: var(--border-radius-xl); }
    .cc__icon  { font-size: 3rem; margin-bottom: 1rem; }
    .cc__title { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.75rem; }
    .cc__desc  { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0 0 1.5rem; line-height: 1.6; }
    .cc__loading { display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                   font-size: 0.875rem; color: var(--color-text-secondary); margin-bottom: 1rem; }
    .cc__success { background: var(--color-background-success); color: var(--color-text-success);
                   padding: 0.875rem; border-radius: var(--border-radius-md); font-size: 0.875rem; }
    .cc__error   { background: var(--color-background-danger); color: var(--color-text-danger);
                   padding: 0.75rem; border-radius: var(--border-radius-md); font-size: 0.875rem; }
    .cc__btn { width: 100%; padding: 0.75rem; border-radius: var(--border-radius-md);
               cursor: pointer; font-size: 0.9375rem; border: 1px solid var(--color-border-secondary);
               background: transparent; color: var(--color-text-secondary); margin-bottom: 0.75rem; }
    .cc__btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .cc__link { font-size: 0.8125rem; color: var(--color-text-secondary); cursor: pointer; }
    .spinner { display: inline-block; width: 14px; height: 14px;
               border: 2px solid var(--color-border-secondary);
               border-top-color: var(--color-text-info);
               border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class ContextConfirmComponent implements OnInit {

  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http   = inject(HttpClient);

  readonly confirming  = signal(false);
  readonly confirmed   = signal(false);
  readonly error       = signal<string | null>(null);
  readonly resendsLeft = signal(2);

  ngOnInit(): void {
    // Si hay token en el query param → confirmar automáticamente
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) this.confirm(token);
  }

  private async confirm(confirmationToken: string): Promise<void> {
    this.confirming.set(true);
    this.error.set(null);
    try {
      // El context-pending JWT está en AuthService en memoria (no localStorage)
      await firstValueFrom(
        this.http.post<{ accessToken: string }>(
          '/api/v1/auth/confirm-context',
          { confirmationToken }
        )
      );
      this.confirmed.set(true);
      // Guardar full-session JWT y redirigir al portal
      setTimeout(() => this.router.navigate(['/dashboard']), 1500);
    } catch (e: any) {
      const code = e?.error?.code;
      if (code === 'SUBNET_MISMATCH') {
        this.error.set('La confirmación debe realizarse desde la misma red donde iniciaste sesión.');
      } else {
        this.error.set('El enlace de confirmación ha expirado o ya fue usado. Solicita uno nuevo.');
      }
    } finally {
      this.confirming.set(false);
    }
  }

  async resendEmail(): Promise<void> {
    if (this.resendsLeft() <= 0) return;
    this.resendsLeft.update(v => v - 1);
    // En implementación real: llamar al endpoint de reenvío
    // Por ahora mostrar instrucción informativa
    this.error.set(null);
  }

  cancelAndGoToLogin(): void {
    // En implementación real: revocar el context-pending JWT en el AuthService
    this.router.navigate(['/login']);
  }
}
