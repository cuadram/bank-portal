/**
 * shared/components/otp-input/otp-input.component.ts
 * Componente reutilizable — Input OTP de 6 dígitos con auto-split
 * FEAT-001 | BankPortal — Banco Meridian
 *
 * Seguridad (LLD §6): autocomplete="one-time-code" conforme WCAG + PCI-DSS
 */
import {
  Component, Input, Output, EventEmitter,
  signal, computed, ElementRef, ViewChildren, QueryList,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'bp-otp-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OtpInputComponent {

  @Input() disabled = false;
  @Input() hasError = false;
  @Output() otpComplete = new EventEmitter<string>();
  @Output() otpChange = new EventEmitter<string>();

  readonly length = environment.otpInputLength;
  readonly digits = signal<string[]>(Array(this.length).fill(''));
  readonly currentOtp = computed(() => this.digits().join(''));
  readonly isComplete = computed(() => this.currentOtp().length === this.length &&
    this.digits().every(d => d !== ''));

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (value.length > 1) {
      // Pegado de código completo — distribuir dígitos
      this.distributePaste(value);
      return;
    }

    const updated = [...this.digits()];
    updated[index] = value.slice(-1);
    this.digits.set(updated);
    this.otpChange.emit(this.currentOtp());

    if (value && index < this.length - 1) {
      this.focusInput(index + 1);
    }

    if (this.isComplete()) {
      this.otpComplete.emit(this.currentOtp());
    }
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const updated = [...this.digits()];
      if (updated[index]) {
        updated[index] = '';
        this.digits.set(updated);
        this.otpChange.emit(this.currentOtp());
      } else if (index > 0) {
        updated[index - 1] = '';
        this.digits.set(updated);
        this.focusInput(index - 1);
        this.otpChange.emit(this.currentOtp());
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
    } else if (event.key === 'ArrowRight' && index < this.length - 1) {
      this.focusInput(index + 1);
    }
  }

  onFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  reset(): void {
    this.digits.set(Array(this.length).fill(''));
    this.focusInput(0);
  }

  private distributePaste(value: string): void {
    const chars = value.slice(0, this.length).split('');
    const updated = Array(this.length).fill('');
    chars.forEach((c, i) => { updated[i] = c; });
    this.digits.set(updated);
    this.otpChange.emit(this.currentOtp());
    const nextEmpty = updated.findIndex(d => !d);
    this.focusInput(nextEmpty === -1 ? this.length - 1 : nextEmpty);
    if (this.isComplete()) {
      this.otpComplete.emit(this.currentOtp());
    }
  }

  private focusInput(index: number): void {
    setTimeout(() => {
      const inputs = this.digitInputs?.toArray();
      inputs?.[index]?.nativeElement.focus();
    }, 0);
  }

  /** Índices para el template */
  get indices(): number[] {
    return Array.from({ length: this.length }, (_, i) => i);
  }
}
