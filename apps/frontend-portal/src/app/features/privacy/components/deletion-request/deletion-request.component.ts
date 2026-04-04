// deletion-request.component.ts — FEAT-019 Sprint 21 — RF-019-06
// RN-F019-25: OTP obligatorio. ADR-032: soft delete + anonimización 30 días.
import { Component, Output, EventEmitter, inject } from '@angular/core';
import { FormControl, Validators }                 from '@angular/forms';
import { PrivacyService }                          from '../../services/privacy.service';

type Step = 'info' | 'otp' | 'confirm';

@Component({
  selector: 'app-deletion-request',
  standalone: false,
  template: `
    <div class="danger-card">
      <div class="card-row">
        <div class="danger-icon">🗑️</div>
        <div class="card-info">
          <div class="card-title danger-title">Eliminar mi cuenta</div>
          <div class="card-desc">Acción permanente. Datos anonimizados en 30 días · GDPR Art.17</div>
        </div>
        <button class="btn-danger" (click)="open()" *ngIf="!showModal">Solicitar</button>
      </div>
    </div>

    <!-- Modal multi-paso -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeIfOutside($event)">
      <div class="modal" id="deletion-modal">

        <!-- Paso 1: Información -->
        <ng-container *ngIf="step === 'info'">
          <div class="step-dots"><span class="dot active"></span><span class="dot"></span><span class="dot"></span></div>
          <h3>⚠️ Antes de continuar</h3>
          <ul class="warn-list">
            <li class="bad">Perderás acceso permanente a BankPortal</li>
            <li class="bad">Tus datos personales serán anonimizados en 30 días</li>
            <li class="bad">Las sesiones activas se cerrarán inmediatamente</li>
            <li class="good">Historial de movimientos conservado por obligación legal</li>
          </ul>
          <div class="modal-actions">
            <button class="btn-outline" (click)="close()">Cancelar</button>
            <button class="btn-danger" (click)="step = 'otp'">Continuar →</button>
          </div>
        </ng-container>

        <!-- Paso 2: OTP -->
        <ng-container *ngIf="step === 'otp'">
          <div class="step-dots"><span class="dot done"></span><span class="dot active"></span><span class="dot"></span></div>
          <h3>🔐 Verificación de seguridad</h3>
          <p class="modal-sub">Introduce el código enviado a tu teléfono</p>
          <input class="otp-input"
                 [formControl]="otpControl"
                 maxlength="6"
                 placeholder="_ _ _ _ _ _"
                 autocomplete="one-time-code">
          <div *ngIf="otpError" class="error-msg">{{ otpError }}</div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="step = 'info'">← Atrás</button>
            <button class="btn-primary"
                    [disabled]="otpControl.invalid || isSubmitting"
                    (click)="submitOtp()">
              {{ isSubmitting ? 'Verificando...' : 'Verificar' }}
            </button>
          </div>
        </ng-container>

        <!-- Paso 3: Confirmación email -->
        <ng-container *ngIf="step === 'confirm'">
          <div class="step-dots"><span class="dot done"></span><span class="dot done"></span><span class="dot active"></span></div>
          <h3>📧 Confirma en tu email</h3>
          <p class="modal-sub">
            Hemos enviado un email de confirmación.<br>
            Haz clic en el enlace para confirmar la eliminación.<br>
            <strong>El enlace caduca en 24 horas.</strong>
          </p>
          <div class="modal-actions">
            <button class="btn-primary" (click)="close()">Entendido</button>
          </div>
        </ng-container>

      </div>
    </div>
  `,
  styles: [`
    .danger-card { background: #FFF5F5; border: 1px solid #FCA5A5; border-radius: 12px; padding: 20px; }
    .card-row { display: flex; align-items: center; gap: 14px; }
    .danger-icon { width: 44px; height: 44px; background: #FEE2E2; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .card-info { flex: 1; }
    .card-title { font-size: 14px; font-weight: 600; }
    .danger-title { color: #B91C1C; }
    .card-desc { font-size: 12px; color: #6B7280; margin-top: 3px; }
    .btn-danger  { background: #EF4444; color: white; border: none;
      padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; }
    .btn-danger:hover { background: #DC2626; }
    .btn-primary { background: #1B3E7E; color: white; border: none;
      padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-outline { background: white; color: #1B3E7E; border: 1px solid #1B3E7E;
      padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5);
      display: flex; align-items: center; justify-content: center; z-index: 100; }
    .modal { background: white; border-radius: 16px; padding: 30px; max-width: 420px;
      width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
    .modal h3 { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 12px; }
    .modal-sub { font-size: 14px; color: #6B7280; margin-bottom: 16px; line-height: 1.5; }
    .step-dots { display: flex; gap: 8px; margin-bottom: 16px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #E5E7EB; }
    .dot.active { background: #1B3E7E; }
    .dot.done   { background: #22C55E; }
    .warn-list { list-style: none; padding: 14px; background: #FFF7ED;
      border-radius: 8px; margin: 0 0 16px; }
    .warn-list li { font-size: 13px; padding: 3px 0; color: #374151; }
    .warn-list .bad::before  { content: '✗ '; color: #EF4444; }
    .warn-list .good::before { content: '✓ '; color: #22C55E; }
    .otp-input { display: block; width: 100%; text-align: center; letter-spacing: .4em;
      font-size: 24px; font-weight: 700; color: #1B3E7E; border: 2px solid #E5E7EB;
      border-radius: 8px; padding: 12px; outline: none; margin-bottom: 8px; }
    .otp-input:focus { border-color: #1B3E7E; }
    .error-msg { font-size: 12px; color: #EF4444; margin-bottom: 12px; }
    .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
  `]
})
export class DeletionRequestComponent {
  @Output() deletionConfirmed = new EventEmitter<void>();

  private readonly privacySvc = inject(PrivacyService);

  showModal  = false;
  step: Step = 'info';
  otpControl = new FormControl('', [Validators.required, Validators.minLength(6)]);
  otpError:  string | null = null;
  isSubmitting = false;

  open():  void { this.showModal = true; this.step = 'info'; this.otpControl.reset(); this.otpError = null; }
  close(): void { this.showModal = false; }

  closeIfOutside(e: MouseEvent): void {
    if ((e.target as HTMLElement).id === 'deletion-modal') return;
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.close();
  }

  submitOtp(): void {
    if (this.otpControl.invalid) return;
    this.isSubmitting = true;
    this.otpError = null;
    this.privacySvc.requestDeletion(this.otpControl.value!).subscribe({
      next:  () => { this.isSubmitting = false; this.step = 'confirm'; },
      error: () => { this.isSubmitting = false; this.otpError = 'OTP inválido o expirado. Inténtalo de nuevo.'; }
    });
  }
}
