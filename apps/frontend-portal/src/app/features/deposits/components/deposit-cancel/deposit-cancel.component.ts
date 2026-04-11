import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DepositService } from '../../services/deposit.service';

@Component({
  selector: 'app-deposit-cancel',
  template: `
    <div class="cancel-page" *ngIf="deposit">

      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a class="bc-link" (click)="goToDetail()">Depósito {{ deposit.plazoMeses }} meses</a>
        <span class="bc-sep">›</span>
        <span>Cancelación anticipada</span>
      </div>

      <!-- Título + subtítulo -->
      <h1 class="page-title">⛔ Cancelación anticipada</h1>
      <p class="page-subtitle">
        Han transcurrido <strong>{{ diasTranscurridos }} días</strong>
        desde la apertura ({{ deposit.fechaApertura | date:'dd/MM/yyyy' }})
      </p>

      <div class="cancel-container">

        <!-- Alert advertencia -->
        <div class="alert alert-warning">
          ⚠ <span>La cancelación antes del vencimiento conlleva una
          <strong>penalización del {{ penalizacionPct }}%</strong>
          sobre los intereses devengados. Revisa el resumen.</span>
        </div>

        <!-- Resumen cancelación (card con cancel-rows) -->
        <div class="cancel-summary-card">
          <div class="cancel-row">
            <span class="cr-label">Importe depositado</span>
            <span class="cr-value cr-bold">{{ deposit.importe | number:'1.2-2':'es' }} €</span>
          </div>
          <div class="cancel-row">
            <span class="cr-label">Días transcurridos</span>
            <span class="cr-value">{{ diasTranscurridos }} días</span>
          </div>
          <div class="cancel-row">
            <span class="cr-label">Intereses devengados</span>
            <span class="cr-value">{{ interesesDevengados | number:'1.2-2':'es' }} €</span>
          </div>
          <div class="cancel-row cancel-row--penalty">
            <span class="cr-label cr-error">Penalización ({{ penalizacionPct }}%)</span>
            <span class="cr-value cr-error cr-bold">− {{ penalizacion | number:'1.2-2':'es' }} €</span>
          </div>
          <div class="cancel-row">
            <span class="cr-label">IRPF s/ intereses netos</span>
            <span class="cr-value cr-error">− {{ irpfCancelacion | number:'1.2-2':'es' }} €</span>
          </div>
          <div class="cancel-row cancel-row--total">
            <span>Recibirás</span>
            <span class="cr-total">{{ recibirasTotal | number:'1.2-2':'es' }} €</span>
          </div>
        </div>

        <!-- Card OTP -->
        <div class="card otp-card">
          <div class="card-header">
            <span class="card-title">🔐 Verificación OTP</span>
          </div>
          <div class="card-body otp-body">
            <p class="otp-intro">Introduce tu código OTP para confirmar la cancelación</p>
            <div class="otp-inputs">
              <input *ngFor="let i of [0,1,2,3,4,5]"
                class="otp-input" [class.filled]="otp[i]"
                type="text" maxlength="1" inputmode="numeric"
                [value]="otp[i]||''"
                (input)="onOtpInput($event, i)"
                (keydown)="onOtpKey($event, i)"
                [id]="'cotp'+i">
            </div>
          </div>
        </div>

        <div class="alert alert-error-box" *ngIf="error">{{ error }}</div>

        <!-- Acciones -->
        <div class="cancel-actions">
          <button class="btn btn-ghost" (click)="goToDetail()">← No cancelar</button>
          <button class="btn btn-danger" [disabled]="otpStr.length < 6 || loading" (click)="confirm()">
            {{ loading ? 'Procesando...' : 'Confirmar cancelación' }}
          </button>
        </div>

      </div>
    </div>

    <!-- Skeleton -->
    <div *ngIf="!deposit">
      <div class="sk sk-title"></div>
      <div class="sk sk-block"></div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    .cancel-page { font-family:'Inter','Roboto',Arial,sans-serif; color:#1A2332; }

    /* Breadcrumb */
    .breadcrumb { display:flex; align-items:center; gap:8px; font-size:12px; color:#4A5568; margin-bottom:16px; }
    .bc-link { color:#1B5E99; cursor:pointer; }
    .bc-link:hover { text-decoration:underline; }
    .bc-sep { opacity:.4; }

    /* Título */
    .page-title  { font-size:24px; font-weight:700; color:#1A2332; margin:0 0 8px; }
    .page-subtitle { font-size:14px; color:#4A5568; margin-bottom:24px; }

    /* Container */
    .cancel-container { max-width:560px; display:flex; flex-direction:column; gap:16px; }

    /* Alerts */
    .alert {
      display:flex; gap:12px;
      padding:16px 20px; border-radius:8px; font-size:14px;
    }
    .alert-warning { background:#FFF8E1; border-left:4px solid #F57F17; color:#7c4700; }
    .alert-error-box { background:#FFEBEE; border-left:4px solid #E53935; color:#7f1d1d; padding:12px 16px; border-radius:8px; font-size:13px; }

    /* Cancel summary card */
    .cancel-summary-card {
      background:#fff; border-radius:12px;
      border:1px solid #E8ECF0;
      box-shadow:0 1px 4px rgba(0,0,0,.08);
      overflow:hidden;
    }
    .cancel-row {
      display:flex; align-items:center; justify-content:space-between;
      padding:12px 24px; border-bottom:1px solid #E8ECF0;
      font-size:14px;
    }
    .cancel-row:last-child { border-bottom:none; }
    .cancel-row--penalty { background:#FFF0F0; }
    .cancel-row--total {
      background:#E3F0FB; border-top:2px solid #1B5E99;
      font-weight:700; font-size:16px;
    }
    .cr-label  { color:#4A5568; font-size:13px; }
    .cr-value  { font-weight:500; }
    .cr-bold   { font-weight:600; }
    .cr-error  { color:#E53935; }
    .cr-total  { font-size:20px; color:#1B5E99; font-weight:700; }

    /* Card OTP */
    .card {
      background:#fff; border-radius:12px;
      border:1px solid #E8ECF0;
      box-shadow:0 1px 4px rgba(0,0,0,.08);
    }
    .card-header {
      padding:20px 24px; border-bottom:1px solid #E8ECF0;
      display:flex; align-items:center;
    }
    .card-title { font-size:16px; font-weight:600; color:#1A2332; }
    .card-body { padding:24px; }
    .otp-body { text-align:center; }
    .otp-intro { font-size:13px; color:#4A5568; margin-bottom:12px; }
    .otp-inputs { display:flex; gap:12px; justify-content:center; }
    .otp-input {
      width:52px; height:64px;
      border:2px solid #D1D5DB; border-radius:8px;
      font-size:24px; font-weight:700; text-align:center;
      color:#1A2332; font-family:monospace;
      outline:none; transition:200ms;
    }
    .otp-input:focus { border-color:#1B5E99; box-shadow:0 0 0 3px rgba(27,94,153,.12); }
    .otp-input.filled { border-color:#1B5E99; color:#1B5E99; }

    /* Acciones */
    .cancel-actions { display:flex; gap:12px; }
    .btn {
      display:inline-flex; align-items:center; gap:8px;
      padding:8px 20px; border-radius:8px;
      font-size:14px; font-weight:500; cursor:pointer;
      transition:200ms; border:none;
      font-family:'Inter','Roboto',Arial,sans-serif; line-height:1.5;
    }
    .btn-ghost  { background:transparent; color:#4A5568; }
    .btn-ghost:hover { background:#F5F7FA; color:#1A2332; }
    .btn-danger { background:#E53935; color:#fff; }
    .btn-danger:hover { background:#c62828; }
    .btn-danger:disabled { opacity:.6; cursor:not-allowed; }

    /* Skeleton */
    .sk { background:linear-gradient(90deg,#F5F7FA 25%,#E8ECF0 50%,#F5F7FA 75%); background-size:800px 100%; animation:shimmer 1.5s infinite; border-radius:8px; }
    .sk-title { height:28px; width:240px; margin-bottom:16px; }
    .sk-block  { height:320px; max-width:560px; }
    @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  `]
})
export class DepositCancelComponent implements OnInit {
  deposit: any = null;
  otp: string[] = ['','','','','',''];
  loading = false;
  error = '';

  // Cálculos de cancelación (25% penalización, tramo IRPF 19%)
  penalizacionPct = 25;
  get diasTranscurridos(): number {
    if (!this.deposit?.fechaApertura) return 0;
    return Math.floor((Date.now() - new Date(this.deposit.fechaApertura).getTime()) / 86400000);
  }
  get interesesDevengados(): number {
    if (!this.deposit) return 0;
    return +(this.deposit.importe * this.deposit.tin * (this.diasTranscurridos / 365)).toFixed(2);
  }
  get penalizacion(): number {
    return +(this.interesesDevengados * this.penalizacionPct / 100).toFixed(2);
  }
  get interesesNetos(): number {
    return +(this.interesesDevengados - this.penalizacion).toFixed(2);
  }
  get irpfCancelacion(): number {
    return +(this.interesesNetos * 0.19).toFixed(2);
  }
  get recibirasTotal(): number {
    return +(this.deposit?.importe + this.interesesNetos - this.irpfCancelacion).toFixed(2);
  }
  get otpStr(): string { return this.otp.join(''); }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private depositService: DepositService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id')!;
      this.depositService.getDepositById(id).subscribe(d => {
        this.deposit = d;
      });
    });
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/,'').slice(-1);
    this.otp[index] = val; input.value = val;
    if (val && index < 5) (document.getElementById('cotp'+(index+1)) as HTMLInputElement)?.focus();
  }

  onOtpKey(event: KeyboardEvent, index: number): void {
    if (event.key==='Backspace' && !this.otp[index] && index>0)
      (document.getElementById('cotp'+(index-1)) as HTMLInputElement)?.focus();
  }

  confirm(): void {
    if (!this.deposit || this.otpStr.length < 6) return;
    this.loading = true; this.error = '';
    this.depositService.cancelDeposit(this.deposit.id, this.otpStr).subscribe(r => {
      this.loading = false;
      if (r) this.router.navigate(['/depositos']);
      else   this.error = 'OTP incorrecto o depósito no cancelable. Inténtalo de nuevo.';
    });
  }

  // LA-023-01: NUNCA [href] para navegación interna
  goToDetail(): void { this.router.navigate(['/depositos', this.deposit.id]); }
}
