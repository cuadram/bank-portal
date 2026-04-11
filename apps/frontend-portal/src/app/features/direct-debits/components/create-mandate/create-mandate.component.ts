import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ibanValidator } from '../../validators/iban.validator';
import { DirectDebitService } from '../../services/direct-debit.service';

const SHARED_STYLES = `
  .page-container { font-family: Arial, sans-serif; }
  .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
  .page-title { color:#1B3A6B; margin:0; font-size:1.4rem; }
  .card { background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:1.5rem; margin-bottom:1rem; }
  .btn-primary { background:#1B3A6B; color:#fff; border:none; border-radius:6px; padding:.65rem 1.4rem; cursor:pointer; font-weight:600; font-size:.9rem; }
  .btn-primary:disabled { background:#9db4d0; cursor:not-allowed; }
  .btn-secondary { background:#fff; color:#1B3A6B; border:1px solid #1B3A6B; border-radius:6px; padding:.6rem 1.2rem; cursor:pointer; font-size:.9rem; }
`;

@Component({
  selector: 'app-create-mandate',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">+ Nueva domiciliación</h2>
          <p style="color:#888;margin:.3rem 0 0;font-size:.9rem">Mandato SEPA Direct Debit Core</p>
        </div>
        <button class="btn-secondary" (click)="router.navigate(['/direct-debits'])">← Cancelar</button>
      </div>

      <!-- Progress bar -->
      <div class="progress-bar">
        <div class="step" [class.active]="step>=1" [class.done]="step>1">
          <div class="step-circle">{{ step > 1 ? '✓' : '1' }}</div>
          <span>Acreedor</span>
        </div>
        <div class="step-line" [class.done]="step>1"></div>
        <div class="step" [class.active]="step>=2" [class.done]="step>2">
          <div class="step-circle">{{ step > 2 ? '✓' : '2' }}</div>
          <span>Resumen</span>
        </div>
        <div class="step-line" [class.done]="step>2"></div>
        <div class="step" [class.active]="step>=3">
          <div class="step-circle">3</div>
          <span>Confirmar</span>
        </div>
      </div>

      <div class="card">
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>

          <!-- Paso 1 -->
          <div *ngIf="step===1">
            <h3 class="section-title">Datos del acreedor</h3>
            <div class="form-group">
              <label class="form-label">Nombre del acreedor *</label>
              <input class="form-input" formControlName="creditorName" type="text" placeholder="Ej: Endesa Energía SAU"
                     [class.input-error]="form.get('creditorName')!.invalid && form.get('creditorName')!.touched"/>
              <span class="field-error" *ngIf="form.get('creditorName')!.invalid && form.get('creditorName')!.touched">
                El nombre es obligatorio (máx. 140 caracteres)
              </span>
            </div>
            <div class="form-group">
              <label class="form-label">IBAN del acreedor *</label>
              <input class="form-input mono" formControlName="creditorIban" type="text"
                     placeholder="ES91 2100 0418 4502 0005 1332"
                     [class.input-error]="ibanControl.invalid && ibanControl.touched"/>
              <span class="field-error" *ngIf="ibanControl.invalid && ibanControl.touched">{{ ibanError }}</span>
              <span class="field-hint" *ngIf="ibanControl.valid && ibanControl.value">✅ IBAN válido (SEPA)</span>
            </div>
            <div class="wizard-actions">
              <button type="button" class="btn-primary"
                      [disabled]="form.get('creditorName')!.invalid || ibanControl.invalid"
                      (click)="nextStep()">Siguiente →</button>
            </div>
          </div>

          <!-- Paso 2 -->
          <div *ngIf="step===2">
            <h3 class="section-title">Resumen del mandato</h3>
            <dl class="summary-list">
              <div class="summary-row">
                <dt>Acreedor</dt>
                <dd>{{ form.get('creditorName')!.value }}</dd>
              </div>
              <div class="summary-row">
                <dt>IBAN acreedor</dt>
                <dd class="mono">{{ form.get('creditorIban')!.value }}</dd>
              </div>
              <div class="summary-row">
                <dt>Tipo de mandato</dt>
                <dd>SEPA DD Core</dd>
              </div>
            </dl>
            <div class="legal-box">
              <p>⚖️ Al continuar, autorizas a <strong>{{ form.get('creditorName')!.value }}</strong> a realizar cargos en tu cuenta
              según el esquema SEPA DD Core. Puedes cancelar este mandato en cualquier momento desde este portal.</p>
            </div>
            <div class="wizard-actions">
              <button type="button" class="btn-secondary" (click)="prevStep()">← Atrás</button>
              <button type="button" class="btn-primary" (click)="step=3">Continuar →</button>
            </div>
          </div>

          <!-- Paso 3 -->
          <div *ngIf="step===3">
            <h3 class="section-title">Verificación de seguridad</h3>
            <p style="color:#555;margin-bottom:1.5rem">Introduce el código OTP de 6 dígitos enviado a tu dispositivo para autorizar la domiciliación.</p>
            <div class="form-group">
              <label class="form-label">Código OTP *</label>
              <input class="form-input otp-input" formControlName="otp" type="text" inputmode="numeric"
                     maxlength="6" placeholder="_ _ _ _ _ _"
                     [class.input-error]="form.get('otp')!.invalid && form.get('otp')!.touched"/>
              <span class="field-error" *ngIf="form.get('otp')!.invalid && form.get('otp')!.touched">Introduce 6 dígitos</span>
            </div>
            <div class="error-banner" *ngIf="errorMsg">⚠️ {{ errorMsg }}</div>
            <div class="wizard-actions">
              <button type="button" class="btn-secondary" (click)="prevStep()">← Atrás</button>
              <button type="submit" class="btn-primary" [disabled]="form.invalid || loading">
                {{ loading ? 'Procesando...' : '✅ Autorizar domiciliación' }}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    ${SHARED_STYLES}
    .progress-bar { display:flex; align-items:center; margin-bottom:2rem; }
    .step { display:flex; flex-direction:column; align-items:center; gap:.3rem; flex-shrink:0; }
    .step-circle { width:32px; height:32px; border-radius:50%; background:#e0e0e0; color:#999; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:.85rem; }
    .step.active .step-circle { background:#1B3A6B; color:#fff; }
    .step.done .step-circle { background:#2e7d32; color:#fff; }
    .step span { font-size:.75rem; color:#999; }
    .step.active span, .step.done span { color:#1B3A6B; font-weight:600; }
    .step-line { flex:1; height:2px; background:#e0e0e0; margin:0 .5rem; margin-bottom:1.2rem; }
    .step-line.done { background:#2e7d32; }
    .section-title { color:#1B3A6B; font-size:1rem; margin:0 0 1.5rem; border-bottom:2px solid #f0f0f0; padding-bottom:.5rem; }
    .form-group { margin-bottom:1.2rem; }
    .form-label { display:block; font-size:.85rem; color:#444; font-weight:600; margin-bottom:.4rem; }
    .form-input { width:100%; padding:.7rem .9rem; border:1px solid #ddd; border-radius:6px; font-size:.95rem; box-sizing:border-box; transition:border .2s; }
    .form-input:focus { outline:none; border-color:#1B3A6B; box-shadow:0 0 0 3px rgba(27,58,107,.1); }
    .input-error { border-color:#c62828 !important; }
    .field-error { display:block; color:#c62828; font-size:.8rem; margin-top:.3rem; }
    .field-hint { display:block; color:#2e7d32; font-size:.8rem; margin-top:.3rem; }
    .mono { font-family:'Courier New',monospace; }
    .otp-input { font-size:1.5rem; text-align:center; letter-spacing:.3em; max-width:200px; }
    .summary-list { margin:0 0 1.5rem; }
    .summary-row { display:flex; justify-content:space-between; padding:.7rem 0; border-bottom:1px solid #f5f5f5; }
    .summary-row dt { color:#666; font-size:.85rem; }
    .summary-row dd { margin:0; font-weight:600; }
    .legal-box { background:#f9fafb; border-left:3px solid #1B3A6B; padding:1rem; border-radius:0 6px 6px 0; margin-bottom:1.5rem; color:#555; font-size:.9rem; }
    .wizard-actions { display:flex; justify-content:flex-end; gap:.75rem; margin-top:1.5rem; padding-top:1rem; border-top:1px solid #f0f0f0; }
    .error-banner { background:#fce4ec; color:#c62828; border-radius:6px; padding:.75rem 1rem; margin-bottom:1rem; }
  `]
})
export class CreateMandateComponent {
  step = 1;
  loading = false;
  errorMsg = '';

  form = this.fb.group({
    creditorName: ['', [Validators.required, Validators.maxLength(140)]],
    creditorIban: ['', [Validators.required, ibanValidator]],
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  constructor(private fb: FormBuilder, private service: DirectDebitService, public router: Router) {}

  get ibanControl() { return this.form.get('creditorIban')!; }
  get ibanError(): string {
    if (this.ibanControl.hasError('notSepaCountry')) return 'El país del IBAN no pertenece a la zona SEPA';
    if (this.ibanControl.hasError('invalidIban')) return 'IBAN no válido — verifique el formato';
    return '';
  }

  nextStep(): void { if (this.form.get('creditorName')!.valid && this.ibanControl.valid) this.step++; }
  prevStep(): void { this.step--; }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true; this.errorMsg = '';
    const req = { ...this.form.value, accountId: 'acc00000-0000-0000-0000-000000000001' } as any;
    this.service.createMandate(req).subscribe({
      next: () => this.router.navigate(['/direct-debits']),
      error: e => { this.errorMsg = e.message; this.loading = false; }
    });
  }
}
