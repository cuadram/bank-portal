/**
 * components/otp-verification/otp-verification.component.ts
 * Pantalla de verificación OTP en el flujo de login con 2FA activo.
 * US-002 — T-007 | FEAT-001 | BankPortal — Banco Meridian
 *
 * Flujo (LLD §4):
 *   LoginComponent → guarda pre_auth_token en sessionStorage
 *   → navega a /auth/otp-verify (guard: twoFactorGuard)
 *   → usuario introduce OTP o código de recuperación
 *   → POST /2fa/verify (interceptor añade PreAuth header)
 *   → store guarda access_token en memoria, limpia pre_auth_token
 *   → navega a /dashboard
 *
 * Seguridad (LLD §6):
 *   - pre_auth_token limpiado en store.verifyLogin() tras éxito
 *   - access_token guardado SOLO en memoria (TwoFactorStore)
 *   - Sin persistencia en localStorage en ningún punto
 */
import {
  Component, inject,
  ChangeDetectionStrategy, signal, effect, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TwoFactorStore } from '../../store/two-factor.store';
import { OtpInputComponent } from '../../../../shared/components/otp-input/otp-input.component';

/** Modos de verificación disponibles en la pantalla */
type VerifyMode = 'OTP' | 'RECOVERY';

@Component({
  selector: 'bp-otp-verification',
  standalone: true,
  imports: [CommonModule, OtpInputComponent],
  templateUrl: './otp-verification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OtpVerificationComponent implements OnDestroy {

  readonly store = inject(TwoFactorStore);
  private readonly router = inject(Router);

  /** Modo actual: OTP estándar o código de recuperación */
  readonly mode = signal<VerifyMode>('OTP');

  /** Valor del OTP en modo estándar */
  readonly otpValue = signal('');

  /** Valor del código de recuperación en modo RECOVERY */
  readonly recoveryValue = signal('');

  /** Estado de error visual en OtpInputComponent */
  readonly otpHasError = signal(false);

  /** Error de validación local (recovery code vacío) */
  readonly localError = signal<string | null>(null);

  /**
   * Bandera que indica que onVerify() fue invocado en esta sesión.
   * Evita que verifyEffect navegue si el store ya tiene accessToken
   * de una sesión anterior (navegación back/forward).
   */
  private verifyAttempted = false;

  /**
   * Navegar a /dashboard cuando el store confirma accessToken.
   * Solo se ejecuta si el usuario inició la verificación en este componente.
   */
  private readonly verifyEffect = effect(() => {
    if (this.store.accessToken() && !this.store.isLoading() && this.verifyAttempted) {
      this.router.navigate(['/dashboard']);
    }
  });

  onOtpChange(otp: string): void {
    this.otpValue.set(otp);
    if (this.otpHasError()) this.otpHasError.set(false);
    if (this.store.error()) this.store.clearError();
  }

  onOtpComplete(otp: string): void {
    this.otpValue.set(otp);
  }

  /**
   * CR-NC-001 FIX: eliminado .toUpperCase() del handler.
   *
   * El problema original: `toUpperCase()` + `[value]="recoveryValue()"` +
   * `ChangeDetectionStrategy.OnPush` provocaba que Angular actualizara
   * `input.value` en el siguiente tick de CD, moviendo el cursor al final
   * del campo en cada keystroke de letra minúscula.
   *
   * Fix: el signal almacena el valor tal como lo escribe el usuario.
   * La normalización (.trim().toUpperCase()) se aplica únicamente en
   * onVerify() al momento de enviar, nunca durante la edición.
   * El CSS `text-transform: uppercase` ofrece feedback visual inmediato
   * sin afectar la posición del cursor.
   */
  onRecoveryChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.recoveryValue.set(value);
    if (this.localError()) this.localError.set(null);
    if (this.store.error()) this.store.clearError();
  }

  onVerify(): void {
    if (this.mode() === 'OTP') {
      if (this.otpValue().length !== 6) {
        this.otpHasError.set(true);
        return;
      }
      this.verifyAttempted = true;
      this.store.verifyLogin({ otp: this.otpValue() });
    } else {
      // Normalización en el punto de envío: trim + uppercase
      const code = this.recoveryValue().trim().toUpperCase();
      if (!code) {
        this.localError.set('Introduce el código de recuperación.');
        return;
      }
      this.verifyAttempted = true;
      this.store.verifyLogin({ recovery_code: code });
    }
  }

  onToggleMode(): void {
    this.otpValue.set('');
    this.recoveryValue.set('');
    this.otpHasError.set(false);
    this.localError.set(null);
    this.store.clearError();
    this.mode.update(m => m === 'OTP' ? 'RECOVERY' : 'OTP');
  }

  onCancel(): void {
    this.store.clearSession();
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    // Limpiar error global al destruir el componente (navegación manual sin completar flujo)
    this.store.clearError();
  }
}
