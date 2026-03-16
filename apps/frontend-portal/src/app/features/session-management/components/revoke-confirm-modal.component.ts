import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';

/**
 * Modal de confirmación para revocar sesión — solicita OTP al usuario.
 * Emite el código OTP cuando el usuario confirma.
 *
 * Accesibilidad WCAG 2.1 AA:
 *  - role="dialog" + aria-labelledby + aria-modal
 *  - Focus trap gestionado por el padre (CDK FocusTrap recomendado)
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Component({
  selector: 'app-revoke-confirm-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-backdrop" (click)="onCancel()" (keydown.escape)="onCancel()">
      <div class="modal"
           role="dialog"
           aria-modal="true"
           aria-labelledby="modal-title"
           (click)="$event.stopPropagation()">

        <h2 id="modal-title" class="modal__title">Confirmar cierre de sesión</h2>

        <p class="modal__desc">
          Introduce tu código de verificación (OTP) para cerrar la sesión seleccionada.
        </p>

        <div class="modal__field">
          <label for="otp-input" class="modal__label">Código OTP</label>
          <input
            id="otp-input"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            placeholder="123456"
            class="modal__input"
            [formControl]="otpControl"
            [class.modal__input--error]="otpControl.invalid && otpControl.touched"
            aria-describedby="otp-error" />
          @if (otpControl.invalid && otpControl.touched) {
            <span id="otp-error" class="modal__error" role="alert">
              Introduce un código de 6 dígitos
            </span>
          }
        </div>

        <div class="modal__actions">
          <button class="btn btn--secondary" (click)="onCancel()">Cancelar</button>
          <button
            class="btn btn--primary"
            [disabled]="otpControl.invalid"
            (click)="onConfirm()">
            Confirmar cierre
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: var(--color-background-primary);
      border-radius: var(--border-radius-lg);
      padding: 1.5rem;
      width: min(90vw, 420px);
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    }
    .modal__title  { font-size: 1.125rem; font-weight: 500; margin: 0 0 0.75rem; }
    .modal__desc   { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0 0 1rem; }
    .modal__field  { margin-bottom: 1rem; }
    .modal__label  { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; }
    .modal__input  {
      width: 100%; padding: 0.5rem 0.75rem;
      border: 1px solid var(--color-border-secondary);
      border-radius: var(--border-radius-md);
      font-size: 1.125rem; letter-spacing: 0.2em;
      background: var(--color-background-primary);
      color: var(--color-text-primary);
    }
    .modal__input--error { border-color: var(--color-border-danger); }
    .modal__error  { font-size: 0.75rem; color: var(--color-text-danger); margin-top: 0.25rem; display: block; }
    .modal__actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
    .btn { padding: 0.5rem 1.25rem; border-radius: var(--border-radius-md);
           border: 1px solid; cursor: pointer; font-size: 0.875rem; }
    .btn--primary   { background: var(--color-background-info); border-color: var(--color-border-info);
                      color: var(--color-text-info); }
    .btn--secondary { background: transparent; border-color: var(--color-border-secondary);
                      color: var(--color-text-primary); }
    .btn:disabled   { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class RevokeConfirmModalComponent {
  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  otpControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{6}$/),
  ]);

  onConfirm(): void {
    if (this.otpControl.valid) {
      this.confirmed.emit(this.otpControl.value!);
      this.otpControl.reset();
    }
  }

  onCancel(): void {
    this.otpControl.reset();
    this.cancelled.emit();
  }
}
