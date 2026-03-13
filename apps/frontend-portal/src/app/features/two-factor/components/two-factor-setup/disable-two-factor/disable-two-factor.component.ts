/**
 * components/two-factor-setup/disable-two-factor/disable-two-factor.component.ts
 * Formulario de desactivación de 2FA (contraseña + OTP).
 * US-004 — T-010 | FEAT-001 | BankPortal — Banco Meridian
 *
 * Flujo (LLD §2, diagrama de componentes):
 *   TwoFactorSetupComponent (vista DISABLE)
 *     └── DisableTwoFactorComponent
 *           ├── campo contraseña (signal, input text/password con toggle)
 *           ├── bp-otp-input (OTP de 6 dígitos)
 *           └── @Output disableConfirmed → TwoFactorSetupComponent.onDisableConfirmed()
 *
 * Backend: DELETE /2fa/disable { password, otp } (LLD backend §6)
 * Requiere: Bearer JWT de sesión completa (auth.interceptor.ts lo inyecta).
 *
 * Seguridad (LLD §6):
 *   - La contraseña se almacena en un signal local y se limpia en ngOnDestroy.
 *   - exhaustMap en el store: operación destructiva — no se puede cancelar en vuelo
 *     sin dejar el estado desincronizado.
 *   - El componente nunca persiste la contraseña ni el OTP fuera del ciclo de vida.
 */
import {
  Component, inject, OnDestroy, Output, EventEmitter,
  ChangeDetectionStrategy, signal, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TwoFactorStore } from '../../../store/two-factor.store';
import { OtpInputComponent } from '../../../../../shared/components/otp-input/otp-input.component';

@Component({
  selector: 'bp-disable-two-factor',
  standalone: true,
  imports: [CommonModule, OtpInputComponent],
  templateUrl: './disable-two-factor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DisableTwoFactorComponent implements OnDestroy {

  @Output() disableConfirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly store = inject(TwoFactorStore);

  /** Valor del campo contraseña — limpiado en ngOnDestroy */
  readonly password = signal('');

  /** Valor del OTP capturado desde bp-otp-input */
  readonly otpValue = signal('');

  /** Visibilidad de la contraseña (toggle show/hide) */
  readonly passwordVisible = signal(false);

  /** Errores de validación local (previo a llamada al backend) */
  readonly passwordError = signal(false);
  readonly otpHasError = signal(false);

  /**
   * Bandera que indica que onDisable() fue invocado en esta sesión del componente.
   * Patrón consistente con confirmAttempted (US-001) y verifyAttempted (US-002):
   * evita que disableEffect emita disableConfirmed al inicializar si store.status()
   * ya fuera 'DISABLED' (p.ej. navegación back).
   */
  private disableAttempted = false;

  /**
   * Effect: emite disableConfirmed cuando el store transiciona a 'DISABLED'
   * y el usuario inició la desactivación en ESTA sesión del componente.
   *
   * No depende de isLoading porque el patchState de éxito ya establece
   * isLoading=false y status='DISABLED' atómicamente.
   */
  private readonly disableEffect = effect(() => {
    if (this.store.status() === 'DISABLED' && !this.store.isLoading() && this.disableAttempted) {
      this.disableConfirmed.emit();
    }
  });

  onPasswordChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.password.set(value);
    if (this.passwordError()) {
      this.passwordError.set(false);
    }
  }

  onOtpChange(otp: string): void {
    this.otpValue.set(otp);
    if (this.otpHasError()) {
      this.otpHasError.set(false);
    }
  }

  onOtpComplete(otp: string): void {
    this.otpValue.set(otp);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.set(!this.passwordVisible());
  }

  onDisable(): void {
    const pwd = this.password().trim();
    const otp = this.otpValue();

    let valid = true;
    if (!pwd) {
      this.passwordError.set(true);
      valid = false;
    }
    if (otp.length !== 6) {
      this.otpHasError.set(true);
      valid = false;
    }
    if (!valid) return;

    this.disableAttempted = true;
    this.store.disableTwoFactor({ password: pwd, otp });
  }

  onCancel(): void {
    this.disableAttempted = false;
    this.store.clearError();
    this.cancelled.emit();
  }

  ngOnDestroy(): void {
    // Seguridad: limpiar la contraseña de la memoria del componente.
    this.password.set('');
    this.store.clearError();
  }
}
