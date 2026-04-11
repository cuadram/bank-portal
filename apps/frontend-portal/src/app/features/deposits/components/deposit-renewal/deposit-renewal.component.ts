import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DepositService } from '../../services/deposit.service';

@Component({
  selector: 'app-deposit-renewal',
  template: `
    <div class="renewal-page" *ngIf="deposit">

      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a class="bc-link" (click)="goBack()">Mis Depósitos</a>
        <span class="bc-sep">›</span>
        <a class="bc-link" (click)="goToDetail()">Depósito {{ deposit.plazoMeses }} meses</a>
        <span class="bc-sep">›</span>
        <span>Renovación</span>
      </div>

      <!-- Título + subtítulo -->
      <h1 class="page-title">Instrucción al vencimiento</h1>
      <p class="page-subtitle">
        Indica qué debe ocurrir con tu depósito el
        <strong>{{ deposit.fechaVencimiento | date:'dd/MM/yyyy' }}</strong>
      </p>

      <div class="renew-container">
        <!-- Opciones de renovación -->
        <div class="renew-opts">
          <div class="renew-opt" *ngFor="let opt of opts"
            [class.sel]="selected === opt.value"
            (click)="selected = opt.value">
            <div class="renew-opt-icon">{{ opt.icon }}</div>
            <div>
              <div class="renew-opt-title">{{ opt.label }}</div>
              <div class="renew-opt-sub">{{ opt.desc }}</div>
            </div>
          </div>
        </div>

        <!-- Acciones -->
        <div class="renew-actions">
          <button class="btn btn-ghost" (click)="goToDetail()">← Volver</button>
          <button class="btn btn-primary" [disabled]="saving" (click)="save()">
            {{ saving ? 'Guardando...' : 'Guardar instrucción' }}
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
    .renewal-page { font-family:'Inter','Roboto',Arial,sans-serif; color:#1A2332; }

    /* Breadcrumb */
    .breadcrumb { display:flex; align-items:center; gap:8px; font-size:12px; color:#4A5568; margin-bottom:16px; }
    .bc-link { color:#1B5E99; cursor:pointer; }
    .bc-link:hover { text-decoration:underline; }
    .bc-sep { opacity:.4; }

    /* Título */
    .page-title { font-size:24px; font-weight:700; color:#1A2332; margin:0 0 8px; }
    .page-subtitle { font-size:14px; color:#4A5568; margin-bottom:24px; }

    /* Container */
    .renew-container { max-width:560px; }

    /* Opciones */
    .renew-opts { display:flex; flex-direction:column; gap:12px; margin-bottom:24px; }
    .renew-opt {
      display:flex; align-items:flex-start; gap:12px;
      padding:16px; border:2px solid #E8ECF0;
      border-radius:8px; cursor:pointer;
      transition:200ms;
    }
    .renew-opt:hover { border-color:#1B5E99; }
    .renew-opt.sel  { border-color:#1B5E99; background:#E3F0FB; }
    .renew-opt-icon { font-size:20px; flex-shrink:0; margin-top:2px; }
    .renew-opt-title { font-size:14px; font-weight:600; color:#1A2332; }
    .renew-opt-sub   { font-size:12px; color:#4A5568; margin-top:2px; }

    /* Acciones */
    .renew-actions { display:flex; gap:12px; }
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

    /* Skeleton */
    .sk { background:linear-gradient(90deg,#F5F7FA 25%,#E8ECF0 50%,#F5F7FA 75%); background-size:800px 100%; animation:shimmer 1.5s infinite; border-radius:8px; }
    .sk-title { height:28px; width:240px; margin-bottom:16px; }
    .sk-block { height:200px; max-width:560px; }
    @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  `]
})
export class DepositRenewalComponent implements OnInit {
  deposit: any = null;
  selected = 'RENEW_MANUAL';
  saving = false;

  opts = [
    {
      value: 'RENEW_AUTO',
      icon:  '🔁',
      label: 'Renovación automática',
      desc:  'El sistema renueva el depósito al mismo plazo con el TIN vigente en ese momento.'
    },
    {
      value: 'RENEW_MANUAL',
      icon:  '⏳',
      label: 'Esperar instrucción (actual)',
      desc:  'Recibirás una notificación 7 días antes. El depósito queda en espera hasta que decidas.'
    },
    {
      value: 'CANCEL_AT_MATURITY',
      icon:  '💳',
      label: 'Cancelar al vencimiento',
      desc:  'El importe más intereses netos se abonan en tu cuenta ES12 **** 1234.'
    }
  ];

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
        if (d?.renovacion) this.selected = d.renovacion;
      });
    });
  }

  save(): void {
    if (!this.deposit) return;
    this.saving = true;
    this.depositService.setRenewal(this.deposit.id, this.selected).subscribe(() => {
      this.saving = false;
      this.goToDetail();
    });
  }

  // LA-023-01: NUNCA [href] para navegación interna
  goToDetail(): void { this.router.navigate(['/depositos', this.deposit.id]); }
  goBack():     void { this.router.navigate(['/depositos']); }
}
