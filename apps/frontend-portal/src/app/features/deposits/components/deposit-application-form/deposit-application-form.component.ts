import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { DepositService } from '../../services/deposit.service';
import { SimulationResponse } from '../../models/deposit.model';

@Component({
  selector: 'app-deposit-application-form',
  template: `
    <div class="apertura-page">

      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a class="bc-link" (click)="goBack()">Mis Depósitos</a>
        <span class="bc-sep">›</span>
        <span>Nuevo depósito</span>
      </div>

      <!-- Título -->
      <h1 class="page-title">Nuevo depósito a plazo fijo</h1>

      <!-- Stepper -->
      <div class="stepper">
        <div class="step" [class.active]="step===1" [class.done]="step>1">
          <div class="step-circle">{{ step>1 ? '✓' : '1' }}</div>
          <div class="step-label">Importe y plazo</div>
        </div>
        <div class="step-line" [class.done]="step>1"></div>
        <div class="step" [class.active]="step===2">
          <div class="step-circle">2</div>
          <div class="step-label">Confirmación 2FA</div>
        </div>
      </div>

      <!-- ───── PASO 1 ───── -->
      <div class="card card-step1" *ngIf="step===1">
        <div class="card-header">
          <span class="card-title">Paso 1 — Configura tu depósito</span>
        </div>
        <div class="card-body" [formGroup]="form">
          <div class="form-row">
            <!-- Importe -->
            <div class="form-group">
              <label class="form-label">Importe <span class="req">*</span></label>
              <input class="form-input" type="number" formControlName="importe"
                min="1000" placeholder="Mín. 1.000 €" (input)="recalculate()">
              <div class="form-hint">Mínimo 1.000 € · FGD hasta 100.000 €</div>
            </div>
            <!-- Plazo -->
            <div class="form-group">
              <label class="form-label">Plazo <span class="req">*</span></label>
              <select class="form-input form-select" formControlName="plazoMeses" (change)="recalculate()">
                <option value="3">3 meses</option>
                <option value="6">6 meses</option>
                <option value="12">12 meses</option>
                <option value="24">24 meses</option>
                <option value="36">36 meses</option>
                <option value="60">60 meses</option>
              </select>
            </div>
          </div>

          <!-- Cuenta de cargo -->
          <div class="form-group">
            <label class="form-label">Cuenta de cargo <span class="req">*</span></label>
            <select class="form-input form-select" formControlName="cuentaOrigenId">
              <option value="22222222-2222-2222-2222-222222222222">ES12 **** 1234 — Cuenta Ahorro (saldo: 12.500,00 €)</option>
              <option value="33333333-3333-3333-3333-333333333333">ES91 **** 1332 — Cuenta Corriente (saldo: 8.799,89 €)</option>
            </select>
          </div>

          <!-- Al vencimiento -->
          <div class="form-group">
            <label class="form-label">Al vencimiento</label>
            <select class="form-input form-select" formControlName="renovacion">
              <option value="RENEW_MANUAL">Renovación manual (esperar instrucción)</option>
              <option value="RENEW_AUTO">Renovación automática</option>
              <option value="CANCEL_AT_MATURITY">Cancelar al vencimiento</option>
            </select>
            <div class="form-hint">Podrás cambiar esta instrucción en cualquier momento</div>
          </div>

          <!-- Resumen sim-result-panel -->
          <div class="sim-result-panel" *ngIf="sim">
            <div class="sim-header">💰 Resumen — TIN {{ (sim.tin*100)|number:'1.2-2':'es' }}% · TAE {{ (sim.tae*100)|number:'1.4-4':'es' }}%</div>
            <div class="sim-row"><span>Intereses brutos</span><span>{{ sim.interesesBrutos|number:'1.2-2':'es' }} €</span></div>
            <div class="sim-row"><span>IRPF estimado ({{ irpfPct }})</span><span class="neg">−{{ sim.retencionIrpf|number:'1.2-2':'es' }} €</span></div>
            <div class="sim-row sim-row--total"><span>Total al vencimiento</span><span>{{ sim.totalVencimiento|number:'1.2-2':'es' }} €</span></div>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-ghost" (click)="goToSimulator()">← Volver al simulador</button>
          <button class="btn btn-primary" [disabled]="form.invalid" (click)="goStep2()">Continuar → verificar con OTP</button>
        </div>
      </div>

      <!-- ───── PASO 2 ───── -->
      <div class="card card-step2" *ngIf="step===2">
        <div class="card-header">
          <span class="card-title">🔐 Verificación de seguridad (SCA/PSD2)</span>
        </div>
        <div class="card-body otp-body">
          <p class="otp-intro">
            Introduce el código de 6 dígitos de tu app autenticadora para confirmar la apertura de
            <strong>{{ form.get('importe')?.value|number:'1.2-2':'es' }} €</strong> a
            <strong>{{ form.get('plazoMeses')?.value }} meses</strong>.
          </p>

          <!-- 6 inputs OTP separados -->
          <div class="otp-inputs">
            <input *ngFor="let i of [0,1,2,3,4,5]"
              class="otp-input" [class.filled]="otp[i]"
              type="text" maxlength="1" inputmode="numeric"
              [value]="otp[i]||''"
              (input)="onOtpInput($event, i)"
              (keydown)="onOtpKey($event, i)"
              [id]="'otp'+i">
          </div>

          <!-- Countdown -->
          <div class="countdown">
            Código válido durante <span class="countdown-val">{{ countdownStr }}</span> ·
            <a class="countdown-link" (click)="resetCountdown()">Reenviar</a>
          </div>

          <!-- Precontractual -->
          <div class="precontractual" *ngIf="sim">
            <strong>Resumen de la operación</strong><br>
            Depósito {{ form.get('plazoMeses')?.value }} meses · {{ form.get('importe')?.value|number:'1.2-2':'es' }} € · TIN {{ (sim.tin*100)|number:'1.2-2':'es' }}% / TAE {{ (sim.tae*100)|number:'1.4-4':'es' }}%<br>
            <span class="prec-sub">Cargo: ES12 **** 1234 · Vencimiento: {{ vencimientoStr }}</span>
          </div>

          <div class="alert-error-box" *ngIf="error">{{ error }}</div>
        </div>
        <div class="card-footer">
          <button class="btn btn-ghost" (click)="step=1">← Modificar</button>
          <button class="btn btn-primary" [disabled]="otpStr.length<6 || loading" (click)="submit()">
            {{ loading ? 'Procesando...' : 'Confirmar apertura' }}
          </button>
        </div>
      </div>

      <!-- ───── PASO 3: ÉXITO ───── -->
      <div class="success-wrapper" *ngIf="step===3 && depositCreado">
        <div class="success-card">
          <div class="success-body">
            <div class="success-icon">🎉</div>
            <h2 class="success-title">¡Depósito abierto!</h2>
            <p class="success-subtitle">Tu depósito a plazo fijo ha sido contratado correctamente.</p>
            <span class="badge badge-neutral success-ref">Ref: {{ depositCreado.referencia || depositCreado.id?.slice(0,8).toUpperCase() }}</span>

            <!-- Resumen irpf-panel -->
            <div class="success-irpf-panel">
              <div class="success-irpf-title">Resumen del depósito</div>
              <div class="success-irpf-row">
                <span>Importe depositado</span>
                <span class="success-irpf-bold">{{ depositCreado.importe | number:'1.2-2':'es' }} €</span>
              </div>
              <div class="success-irpf-row">
                <span>TIN / TAE</span>
                <span>{{ (depositCreado.tin * 100) | number:'1.2-2':'es' }}% / {{ (depositCreado.tae * 100) | number:'1.2-2':'es' }}%</span>
              </div>
              <div class="success-irpf-row">
                <span>Vencimiento</span>
                <span>{{ depositCreado.fechaVencimiento | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="success-irpf-row success-irpf-row--last">
                <span>Recibirás (neto IRPF)</span>
                <span>{{ depositCreado.totalVencimiento | number:'1.2-2':'es' }} €</span>
              </div>
            </div>

            <!-- Alert info -->
            <div class="success-alert-info">
              ℹ Recibirás una notificación 7 días antes del vencimiento.
            </div>

            <button class="btn btn-primary btn-full" (click)="goBack()">Ver mis depósitos →</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .apertura-page {
      font-family: 'Inter','Roboto',Arial,sans-serif;
      color: #1A2332;
    }

    /* Breadcrumb */
    .breadcrumb { display:flex; align-items:center; gap:8px; font-size:12px; color:#4A5568; margin-bottom:16px; }
    .bc-link { color:#1B5E99; cursor:pointer; }
    .bc-link:hover { text-decoration:underline; }
    .bc-sep { opacity:.4; }

    /* Título */
    .page-title { font-size:24px; font-weight:700; color:#1A2332; margin:0 0 24px; line-height:1.2; }

    /* Stepper */
    .stepper { display:flex; align-items:center; margin-bottom:32px; }
    .step { display:flex; align-items:center; flex:1; }
    .step-circle {
      width:32px; height:32px; border-radius:50%;
      border:2px solid #E8ECF0; background:#fff;
      display:flex; align-items:center; justify-content:center;
      font-size:12px; font-weight:700; color:#9CA3AF; flex-shrink:0;
      transition:200ms;
    }
    .step.active .step-circle { border-color:#1B5E99; background:#1B5E99; color:#fff; }
    .step.done  .step-circle { border-color:#00897B; background:#00897B; color:#fff; }
    .step-label { margin-left:8px; font-size:12px; color:#9CA3AF; white-space:nowrap; }
    .step.active .step-label { color:#1B5E99; font-weight:600; }
    .step.done  .step-label  { color:#4A5568; }
    .step-line { flex:1; height:2px; background:#E8ECF0; margin:0 12px; }
    .step-line.done { background:#00897B; }

    /* Cards */
    .card { background:#fff; border-radius:12px; border:1px solid #E8ECF0; box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .card-step1 { max-width:600px; }
    .card-step2 { max-width:520px; }
    .card-header {
      padding:20px 24px; border-bottom:1px solid #E8ECF0;
      display:flex; align-items:center; justify-content:space-between;
    }
    .card-title { font-size:16px; font-weight:600; color:#1A2332; }
    .card-body { padding:24px; }
    .card-footer {
      padding:16px 24px; border-top:1px solid #E8ECF0;
      display:flex; justify-content:flex-end; gap:12px;
    }

    /* Form */
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    @media(max-width:520px){ .form-row{grid-template-columns:1fr;} }
    .form-group { margin-bottom:20px; }
    .form-label { display:block; font-size:14px; font-weight:500; color:#1A2332; margin-bottom:8px; }
    .req { color:#E53935; margin-left:2px; }
    .form-input {
      width:100%; padding:12px 16px;
      border:1.5px solid #D1D5DB; border-radius:8px;
      font-size:14px; font-family:'Inter','Roboto',Arial,sans-serif;
      color:#1A2332; background:#fff; outline:none;
      transition:200ms; box-sizing:border-box;
    }
    .form-input:focus { border-color:#1B5E99; box-shadow:0 0 0 3px rgba(27,94,153,.12); }
    .form-select {
      appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%234A5568' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
      background-repeat:no-repeat; background-position:right 12px center;
      padding-right:36px; cursor:pointer;
    }
    .form-hint { font-size:12px; color:#4A5568; margin-top:4px; }

    /* Sim result panel */
    .sim-result-panel {
      background:#E3F0FB; border:1px solid #B3D4F0;
      border-radius:12px; padding:24px;
    }
    .sim-header { font-size:12px; font-weight:700; color:#1B5E99; margin-bottom:8px; }
    .sim-row {
      display:flex; justify-content:space-between;
      padding:8px 0; border-bottom:1px solid #B3D4F0;
      font-size:14px; color:#4A5568;
    }
    .sim-row span:last-child { font-weight:600; color:#1A2332; }
    .sim-row:last-child { border-bottom:none; }
    .sim-row--total { font-size:16px; font-weight:700; color:#1B5E99; padding-top:12px; }
    .sim-row--total span:last-child { color:#1B5E99; }
    .neg { color:#E53935 !important; }

    /* OTP step 2 */
    .otp-body { text-align:center; }
    .otp-intro { font-size:14px; color:#4A5568; margin-bottom:16px; line-height:1.6; }
    .otp-inputs { display:flex; gap:12px; justify-content:center; margin:20px 0; }
    .otp-input {
      width:52px; height:64px;
      border:2px solid #D1D5DB; border-radius:8px;
      font-size:24px; font-weight:700; text-align:center;
      color:#1A2332; font-family:monospace;
      transition:200ms; outline:none;
    }
    .otp-input:focus { border-color:#1B5E99; box-shadow:0 0 0 3px rgba(27,94,153,.12); }
    .otp-input.filled { border-color:#1B5E99; color:#1B5E99; }

    /* Countdown */
    .countdown { font-size:12px; color:#4A5568; margin-top:8px; }
    .countdown-val { font-weight:600; color:#F57F17; }
    .countdown-link { color:#1B5E99; cursor:pointer; text-decoration:none; }
    .countdown-link:hover { text-decoration:underline; }

    /* Precontractual */
    .precontractual {
      background:#FFF8E1; border:1px solid #FFE082;
      border-radius:8px; padding:16px;
      font-size:13px; color:#7c4700;
      text-align:left; margin-top:20px;
      line-height:1.6;
    }
    .prec-sub { color:#9C7A00; }

    /* ── PASO 3: SUCCESS ── */
    .success-wrapper {
      display:flex; align-items:center; justify-content:center;
      min-height:500px;
    }
    .success-card {
      background:#fff; border-radius:12px;
      border:1px solid #E8ECF0;
      box-shadow:0 1px 4px rgba(0,0,0,.08);
      width:100%; max-width:460px;
    }
    .success-body {
      text-align:center; padding:48px 32px;
    }
    .success-icon { font-size:64px; margin-bottom:16px; }
    .success-title {
      font-size:24px; font-weight:700; color:#1A2332;
      margin:0 0 12px;
    }
    .success-subtitle { color:#4A5568; margin-bottom:8px; font-size:14px; }
    .success-ref {
      display:inline-flex; margin-bottom:24px;
      font-size:13px; font-family:monospace;
    }
    .badge-neutral { background:#F5F7FA; color:#4A5568; }

    /* irpf-panel en éxito */
    .success-irpf-panel {
      background:#FFF8E1; border:1px solid #FFE082;
      border-radius:8px; padding:20px;
      text-align:left; margin:16px 0 24px;
    }
    .success-irpf-title {
      font-size:12px; font-weight:700; color:#7c4700; margin-bottom:12px;
    }
    .success-irpf-row {
      display:flex; justify-content:space-between;
      padding:8px 0; border-bottom:1px solid #FFE082;
      font-size:14px; color:#4A5568;
    }
    .success-irpf-row--last { border-bottom:none; }
    .success-irpf-bold { font-weight:700; color:#1A2332; }

    /* Alert info en éxito */
    .success-alert-info {
      background:#E3F2FD; border-left:4px solid #1976D2;
      color:#0c3a6e; padding:16px 20px;
      border-radius:8px; font-size:13px;
      text-align:left; margin-bottom:16px;
    }

    .btn-full { width:100%; justify-content:center; }

    /* Error */
    .alert-error-box {
      background:#FFEBEE; border-left:4px solid #E53935;
      color:#7f1d1d; padding:12px 16px; border-radius:8px;
      font-size:13px; margin-top:12px; text-align:left;
    }

    /* Buttons */
    .btn {
      display:inline-flex; align-items:center; gap:8px;
      padding:8px 20px; border-radius:8px;
      font-size:14px; font-weight:500; cursor:pointer;
      transition:200ms; border:none;
      font-family:'Inter','Roboto',Arial,sans-serif; line-height:1.5;
    }
    .btn-primary { background:#1B5E99; color:#fff; box-shadow:0 2px 8px rgba(27,94,153,.30); }
    .btn-primary:hover { background:#0D3E6E; }
    .btn-primary:disabled { opacity:.6; cursor:not-allowed; }
    .btn-ghost { background:transparent; color:#4A5568; }
    .btn-ghost:hover { background:#F5F7FA; color:#1A2332; }
  `]
})
export class DepositApplicationFormComponent implements OnInit, OnDestroy {
  form: FormGroup;
  step = 1;
  otp: string[] = ['','','','','',''];
  sim: SimulationResponse | null = null;
  irpfPct = '19%';
  loading = false;
  error = '';
  depositCreado: any = null;
  countdown = 30;
  countdownStr = '00:30';
  private timerSub?: Subscription;

  get otpStr(): string { return this.otp.join(''); }
  get vencimientoStr(): string {
    const m = +this.form.get('plazoMeses')?.value || 12;
    const d = new Date(); d.setMonth(d.getMonth() + m);
    return d.toLocaleDateString('es-ES', {day:'2-digit',month:'2-digit',year:'numeric'});
  }

  constructor(
    private fb: FormBuilder,
    private depositService: DepositService,
    private router: Router
  ) {
    this.form = this.fb.group({
      importe:       [10000, [Validators.required, Validators.min(1000)]],
      plazoMeses:    [12,    [Validators.required]],
      cuentaOrigenId:['22222222-2222-2222-2222-222222222222', Validators.required],
      renovacion:    ['RENEW_MANUAL', Validators.required]
    });
  }

  ngOnInit(): void { this.recalculate(); }
  ngOnDestroy(): void { this.timerSub?.unsubscribe(); }

  recalculate(): void {
    const { importe, plazoMeses } = this.form.value;
    if (!importe || importe < 1000 || !plazoMeses) return;
    this.depositService.simulate({ importe: +importe, plazoMeses: +plazoMeses }).subscribe(r => {
      if (!r) return;
      this.sim = r;
      this.irpfPct = r.interesesBrutos > 50000 ? '23%' : r.interesesBrutos > 6000 ? '21%' : '19%';
    });
  }

  goStep2(): void {
    if (this.form.invalid) return;
    this.step = 2;
    this.otp = ['','','','','',''];
    this.resetCountdown();
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g,'').slice(-1);
    this.otp[index] = val;
    input.value = val;
    if (val && index < 5) {
      const next = document.getElementById('otp'+(index+1)) as HTMLInputElement;
      next?.focus();
    }
  }

  onOtpKey(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      const prev = document.getElementById('otp'+(index-1)) as HTMLInputElement;
      prev?.focus();
    }
  }

  resetCountdown(): void {
    this.timerSub?.unsubscribe();
    this.countdown = 30;
    this.countdownStr = '00:30';
    this.timerSub = interval(1000).pipe(take(30)).subscribe(() => {
      this.countdown--;
      const s = this.countdown.toString().padStart(2,'0');
      this.countdownStr = '00:' + s;
    });
  }

  submit(): void {
    if (this.otpStr.length < 6) return;
    this.loading = true; this.error = '';
    const req = { ...this.form.value, otp: this.otpStr, plazoMeses: +this.form.value.plazoMeses, importe: +this.form.value.importe };
    this.depositService.openDeposit(req).subscribe(d => {
      this.loading = false;
      if (d) { this.depositCreado = d; this.step = 3; }
      else { this.error = 'OTP incorrecto o error al contratar. Inténtalo de nuevo.'; }
    });
  }

  // LA-023-01: NUNCA [href] para navegación interna
  goBack(): void        { this.router.navigate(['/depositos']); }
  goToSimulator(): void { this.router.navigate(['/depositos','simulate']); }
}
