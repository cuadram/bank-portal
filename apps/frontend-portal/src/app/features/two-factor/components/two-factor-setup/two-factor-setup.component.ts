/**
 * components/two-factor-setup/two-factor-setup.component.ts
 * Contenedor principal — Activa/desactiva 2FA, muestra estado actual
 * US-001 — T-004 | US-004 — T-010 | FEAT-001 | BankPortal — Banco Meridian
 */
import {
  Component, inject,
  ChangeDetectionStrategy, signal, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TwoFactorStore } from '../../store/two-factor.store';
import { QrEnrollComponent } from './qr-enroll/qr-enroll.component';
import { DisableTwoFactorComponent } from './disable-two-factor/disable-two-factor.component';

type SetupView = 'STATUS' | 'QR_ENROLL' | 'DISABLE';

@Component({
  selector: 'bp-two-factor-setup',
  standalone: true,
  imports: [CommonModule, QrEnrollComponent, DisableTwoFactorComponent],
  templateUrl: './two-factor-setup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwoFactorSetupComponent {

  readonly store = inject(TwoFactorStore);
  private readonly router = inject(Router);

  readonly currentView = signal<SetupView>('STATUS');

  /**
   * CR-NC-001 FIX: navegar a QR_ENROLL solo cuando el store ha recibido
   * el QR del backend (pendingQrBase64 presente). Evita mostrar la vista
   * vacía si el backend falla o tarda.
   *
   * CR-NC-007 FIX: eliminado implements OnDestroy + ngOnDestroy vacío.
   * Los effects creados dentro del injection context de un componente
   * se destruyen automáticamente al destruirse el componente (Angular 17+).
   */
  private readonly enrollEffect = effect(() => {
    if (this.store.pendingQrBase64() && this.store.status() === 'PENDING') {
      this.currentView.set('QR_ENROLL');
    }
  });

  onActivate2FA(): void {
    this.store.startEnroll(undefined as unknown as void);
  }

  onDeactivate2FA(): void {
    this.currentView.set('DISABLE');
  }

  onEnrollConfirmed(): void {
    this.router.navigate(['/security/2fa/recovery-codes']);
  }

  onEnrollCancelled(): void {
    this.currentView.set('STATUS');
  }

  onRegenerateRecoveryCodes(): void {
    this.router.navigate(['/security/2fa/recovery-codes']);
  }

  /** US-004: el usuario ha desactivado 2FA exitosamente — volver a STATUS */
  onDisableConfirmed(): void {
    this.currentView.set('STATUS');
  }

  /** US-004: el usuario cancela la desactivación — volver a STATUS */
  onDisableCancelled(): void {
    this.currentView.set('STATUS');
  }
}
