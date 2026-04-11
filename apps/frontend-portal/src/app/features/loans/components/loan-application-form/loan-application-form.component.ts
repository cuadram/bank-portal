import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanService } from '../../services/loan.service';

@Component({
  selector: 'app-loan-application-form',
  template: `
    <div class="apply-page">
      <div class="page-header">
        <a routerLink="/prestamos" class="back-link">← Mis Préstamos</a>
        <h1>Solicitar Préstamo Personal</h1>
      </div>

      <!-- Stepper -->
      <div class="stepper">
        <div class="step" [class.active]="currentStep >= 1" [class.done]="currentStep > 1">
          <span class="step-num">1</span><span class="step-label">Datos</span>
        </div>
        <div class="step-line"></div>
        <div class="step" [class.active]="currentStep >= 2" [class.done]="currentStep > 2">
          <span class="step-num">2</span><span class="step-label">Revisión</span>
        </div>
        <div class="step-line"></div>
        <div class="step" [class.active]="currentStep >= 3">
          <span class="step-num">3</span><span class="step-label">OTP</span>
        </div>
      </div>

      <div class="form-card card">

        <!-- Step 1: Datos -->
        <div *ngIf="currentStep === 1" [formGroup]="dataForm">
          <h3>Condiciones del préstamo</h3>
          <div class="form-group">
            <label>Importe (€)</label>
            <input type="number" formControlName="importe" class="form-control" min="1000" max="60000"/>
          </div>
          <div class="form-group">
            <label>Plazo (meses)</label>
            <input type="number" formControlName="plazo" class="form-control" min="12" max="84"/>
          </div>
          <div class="form-group">
            <label>Finalidad</label>
            <select formControlName="finalidad" class="form-control">
              <option value="CONSUMO">Consumo</option>
              <option value="VEHICULO">Vehículo</option>
              <option value="REFORMA">Reforma del hogar</option>
              <option value="OTROS">Otros</option>
            </select>
          </div>
          <button class="btn btn-primary" [disabled]="dataForm.invalid" (click)="nextStep()">Continuar →</button>
        </div>

        <!-- Step 2: Revisión -->
        <div *ngIf="currentStep === 2">
          <h3>Revisa tu solicitud</h3>
          <div class="review-grid">
            <div class="review-item"><span>Importe</span><strong>{{ dataForm.value.importe | currency:'EUR':'symbol':'1.2-2':'es' }}</strong></div>
            <div class="review-item"><span>Plazo</span><strong>{{ dataForm.value.plazo }} meses</strong></div>
            <div class="review-item"><span>Finalidad</span><strong>{{ dataForm.value.finalidad }}</strong></div>
            <div class="review-item"><span>TAE</span><strong>6,50%</strong></div>
          </div>
          <p class="legal-note">Al continuar, confirmas haber leído el contrato de crédito al consumo (Ley 16/2011) y la información PSD2.</p>
          <div class="btn-row">
            <button class="btn btn-secondary" (click)="prevStep()">← Atrás</button>
            <button class="btn btn-primary" (click)="nextStep()">Confirmar y validar →</button>
          </div>
        </div>

        <!-- Step 3: OTP -->
        <div *ngIf="currentStep === 3" [formGroup]="otpForm">
          <h3>Validación de seguridad</h3>
          <p>Introduce el código OTP de 6 dígitos enviado a tu dispositivo registrado.</p>
          <div class="form-group">
            <input type="text" formControlName="otpCode" class="form-control otp-input"
                   maxlength="6" placeholder="● ● ● ● ● ●" inputmode="numeric"/>
          </div>
          <div *ngIf="error" class="error-msg">{{ error }}</div>
          <div class="btn-row">
            <button class="btn btn-secondary" (click)="prevStep()">← Atrás</button>
            <button class="btn btn-primary" [disabled]="otpForm.invalid || submitting" (click)="submit()">
              {{ submitting ? 'Enviando...' : 'Enviar solicitud' }}
            </button>
          </div>
        </div>

        <!-- Resultado -->
        <div *ngIf="currentStep === 4" class="result-step">
          <div class="result-icon" [class.rejected]="resultEstado === 'REJECTED'">
            {{ resultEstado === 'REJECTED' ? '❌' : '✅' }}
          </div>
          <h3>{{ resultEstado === 'REJECTED' ? 'Solicitud rechazada' : 'Solicitud enviada' }}</h3>
          <p>{{ resultMensaje }}</p>
          <a routerLink="/prestamos" class="btn btn-primary">Ver mis préstamos</a>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .back-link { color: #1B3A6B; text-decoration: none; font-size: .9rem; }
    h1 { margin: .5rem 0 0; color: #1B3A6B; }
    .stepper { display: flex; align-items: center; margin-bottom: 2rem; }
    .step { display: flex; align-items: center; gap: .4rem; }
    .step-num { width: 28px; height: 28px; border-radius: 50%; background: #ddd; color: #888; display: flex; align-items: center; justify-content: center; font-size: .85rem; font-weight: 700; }
    .step.active .step-num { background: #1B3A6B; color: #fff; }
    .step.done .step-num { background: #28a745; color: #fff; }
    .step-label { font-size: .85rem; color: #888; }
    .step.active .step-label { color: #1B3A6B; font-weight: 600; }
    .step-line { flex: 1; height: 2px; background: #ddd; margin: 0 .75rem; }
    .card { background: #fff; border-radius: 10px; padding: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,.08); max-width: 520px; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; font-size: .85rem; font-weight: 600; color: #333; margin-bottom: .3rem; }
    .form-control { width: 100%; padding: .6rem .8rem; border: 1px solid #ddd; border-radius: 6px; font-size: .9rem; box-sizing: border-box; }
    .otp-input { text-align: center; letter-spacing: .4em; font-size: 1.4rem; font-weight: 700; }
    .btn { padding: .65rem 1.25rem; border-radius: 6px; border: none; cursor: pointer; font-size: .9rem; text-decoration: none; }
    .btn-primary { background: #1B3A6B; color: #fff; }
    .btn-secondary { background: #fff; color: #1B3A6B; border: 1px solid #1B3A6B; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }
    .btn-row { display: flex; gap: .75rem; margin-top: 1.5rem; }
    .review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin: 1rem 0; }
    .review-item { background: #f8f9fa; border-radius: 6px; padding: .75rem; display: flex; flex-direction: column; gap: .2rem; }
    .review-item span { font-size: .75rem; color: #888; text-transform: uppercase; }
    .legal-note { font-size: .8rem; color: #666; border-left: 3px solid #1B3A6B; padding-left: .75rem; margin: 1rem 0; }
    .error-msg { color: #dc3545; font-size: .85rem; margin-top: .5rem; }
    .result-step { text-align: center; padding: 1rem 0; }
    .result-icon { font-size: 3rem; margin-bottom: 1rem; }
    h3 { color: #1B3A6B; margin: 0 0 1rem; }
  `]
})
export class LoanApplicationFormComponent {
  currentStep = 1;
  submitting = false;
  error = '';
  resultEstado = '';
  resultMensaje = '';

  dataForm: FormGroup;
  otpForm: FormGroup;

  constructor(private fb: FormBuilder, private loanService: LoanService, private router: Router) {
    this.dataForm = this.fb.group({
      importe:  [15000, [Validators.required, Validators.min(1000), Validators.max(60000)]],
      plazo:    [36,    [Validators.required, Validators.min(12), Validators.max(84)]],
      finalidad: ['CONSUMO', Validators.required]
    });
    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  nextStep(): void { this.currentStep++; }
  prevStep(): void { this.currentStep--; }

  submit(): void {
    if (this.otpForm.invalid) return;
    this.submitting = true;
    this.error = '';
    const req = { ...this.dataForm.value, otpCode: this.otpForm.value.otpCode };
    this.loanService.apply(req).subscribe(res => {
      this.submitting = false;
      if (res) {
        this.resultEstado = res.estado;
        this.resultMensaje = res.mensaje;
        this.currentStep = 4;
      } else {
        this.error = 'OTP inválido o error en la solicitud. Inténtalo de nuevo.';
      }
    });
  }
}
