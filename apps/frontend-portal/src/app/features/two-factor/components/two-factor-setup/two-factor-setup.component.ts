/**
 * components/two-factor-setup/two-factor-setup.component.ts
 * Contenedor principal — Activa/desactiva 2FA, muestra estado actual
 * US-001 — T-004 | FEAT-001 | BankPortal — Banco Meridian
 */
import {
  Component, inject, OnInit,
  ChangeDetectionStrategy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TwoFactorStore } from '../../store/two-factor.store';
import { QrEnrollComponent } from './qr-enroll/qr-enroll.component';

type SetupView = 'STATUS' | 'QR_ENROLL' | 'DISABLE';

@Component({
  selector: 'bp-two-factor-setup',
  standalone: true,
  imports: [CommonModule, QrEnrollComponent],
  templateUrl: './two-factor-setup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwoFactorSetupComponent implements OnInit {

  readonly store = inject(TwoFactorStore);
  private readonly router = inject(Router);

  readonly currentView = signal<SetupView>('STATUS');

  ngOnInit(): void {
    // Si status ya está en memoria, no re-fetch
    // En implementación futura: cargar status desde backend al iniciar
  }

  onActivate2FA(): void {
    this.store.startEnroll(undefined as unknown as void);
    this.currentView.set('QR_ENROLL');
  }

  onDeactivate2FA(): void {
    this.currentView.set('DISABLE');
  }

  onEnrollConfirmed(): void {
    // Navegar a recovery codes tras enrolamiento exitoso
    this.router.navigate(['/security/2fa/recovery-codes']);
  }

  onEnrollCancelled(): void {
    this.currentView.set('STATUS');
  }

  onRegenerateRecoveryCodes(): void {
    this.router.navigate(['/security/2fa/recovery-codes']);
  }
}
