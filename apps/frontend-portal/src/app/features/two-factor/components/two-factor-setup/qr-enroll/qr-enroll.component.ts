/**
 * components/two-factor-setup/qr-enroll/qr-enroll.component.ts
 * Muestra QR + campo OTP para confirmar el enrolamiento TOTP
 * US-001 — T-004 | FEAT-001 | BankPortal — Banco Meridian
 */
import {
  Component, inject, Output, EventEmitter,
  ChangeDetectionStrategy, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OtpInputComponent } from '../../../../shared/components/otp-input/otp-input.component';
import { TwoFactorStore } from '../../store/two-factor.store';

@Component({
  selector: 'bp-qr-enroll',
  standalone: true,
  imports: [CommonModule, OtpInputComponent],
  templateUrl: './qr-enroll.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrEnrollComponent {

  @Output() enrollConfirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly store = inject(TwoFactorStore);

  readonly otpValue = signal('');
  readonly otpHasError = signal(false);

  get qrSrc(): string {
    const b64 = this.store.pendingQrBase64();
    return b64 ? `data:image/png;base64,${b64}` : '';
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

  onConfirm(): void {
    const otp = this.otpValue();
    if (otp.length !== 6) {
      this.otpHasError.set(true);
      return;
    }
    this.store.confirmEnroll(otp);
    // El componente padre observa store.status() === 'ENABLED' para navegar
    this.enrollConfirmed.emit();
  }

  onCancel(): void {
    this.store.clearPendingEnroll();
    this.cancelled.emit();
  }
}
