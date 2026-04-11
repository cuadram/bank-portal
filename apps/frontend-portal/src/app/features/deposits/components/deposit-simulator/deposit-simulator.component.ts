import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DepositService } from '../../services/deposit.service';
import { SimulationResponse } from '../../models/deposit.model';

@Component({
  selector: 'app-deposit-simulator',
  template: `
    <div class="simulator-page">

      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a class="breadcrumb-link" (click)="goBack()">Mis Depósitos</a>
        <span class="breadcrumb-sep">›</span>
        <span>Simulador</span>
      </div>

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">🧮 Simulador de Depósito</h1>
          <p class="page-subtitle">Calcula tu rentabilidad antes de contratar, sin ningún compromiso</p>
        </div>
      </div>

      <div class="sim-container">

        <!-- Card: inputs -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">¿Cuánto y cuánto tiempo?</span>
          </div>
          <div class="card-body">
            <form [formGroup]="form">
              <div class="form-row">
                <!-- Importe -->
                <div class="form-group">
                  <label class="form-label">
                    Importe a depositar <span class="req">*</span>
                  </label>
                  <input class="form-input" type="number" formControlName="importe"
                    min="1000" step="1000" (input)="onInput()">
                  <div class="form-hint">Mínimo 1.000 € · FGD hasta 100.000 €</div>
                  <div class="form-error" *ngIf="form.get('importe')?.invalid && form.get('importe')?.touched">
                    Importe mínimo 1.000 €
                  </div>
                </div>

                <!-- Plazo (select) -->
                <div class="form-group">
                  <label class="form-label">Plazo <span class="req">*</span></label>
                  <select class="form-input form-select" formControlName="plazoMeses" (change)="onInput()">
                    <option value="3">3 meses</option>
                    <option value="6">6 meses</option>
                    <option value="12">12 meses</option>
                    <option value="24">24 meses</option>
                    <option value="36">36 meses</option>
                    <option value="60">60 meses</option>
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- Panel resultado azul -->
        <div class="sim-result-panel" *ngIf="result">
          <div class="sim-result-header">
            💰 Resultado estimado · TIN {{ (result.tin * 100) | number:'1.2-2':'es' }}% · TAE {{ (result.tae * 100) | number:'1.4-4':'es' }}%
          </div>
          <div class="sim-dep-row">
            <span>Intereses brutos</span>
            <span>{{ result.interesesBrutos | number:'1.2-2':'es' }} €</span>
          </div>
          <div class="sim-dep-row">
            <span>Retención IRPF ({{ irpfPct }})</span>
            <span class="neg">−{{ result.retencionIrpf | number:'1.2-2':'es' }} €</span>
          </div>
          <div class="sim-dep-row">
            <span>Intereses netos</span>
            <span>{{ result.interesesNetos | number:'1.2-2':'es' }} €</span>
          </div>
          <div class="sim-dep-row sim-dep-row--total">
            <span>Total al vencimiento</span>
            <span>{{ result.totalVencimiento | number:'1.2-2':'es' }} €</span>
          </div>
        </div>

        <!-- Alert FGD v2 — texto exacto prototipo PROTO-FEAT-021-sprint23 -->
        <div class="alert alert-info">
          🛡 <span>Los depósitos en Banco Meridian están cubiertos por el <strong>Fondo de Garantía de Depósitos</strong> hasta <strong>100.000 €</strong> por titular y entidad (RDL 16/2011).</span>
        </div>

        <!-- Acciones -->
        <div class="sim-actions">
          <button class="btn btn-ghost" (click)="goBack()">← Volver</button>
          <button class="btn btn-primary" (click)="goToNew()">Contratar este depósito →</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .simulator-page {
      font-family: 'Inter', 'Roboto', Arial, sans-serif;
      color: #1A2332;
    }

    /* Breadcrumb */
    .breadcrumb {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; color: #4A5568; margin-bottom: 16px;
    }
    .breadcrumb-link {
      color: #1B5E99; cursor: pointer; text-decoration: none;
    }
    .breadcrumb-link:hover { text-decoration: underline; }
    .breadcrumb-sep { opacity: 0.4; }

    /* Page header */
    .page-header { margin-bottom: 24px; }
    .page-title {
      font-size: 24px; font-weight: 700; color: #1A2332;
      margin: 0 0 4px; line-height: 1.2;
    }
    .page-subtitle { font-size: 14px; color: #4A5568; margin: 0; }

    /* Container */
    .sim-container { max-width: 640px; display: flex; flex-direction: column; gap: 16px; }

    /* Card */
    .card {
      background: #fff;
      border: 1px solid #E8ECF0;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
    }
    .card-header {
      padding: 20px 24px;
      border-bottom: 1px solid #E8ECF0;
      display: flex; align-items: center; justify-content: space-between;
    }
    .card-title { font-size: 16px; font-weight: 600; color: #1A2332; }
    .card-body { padding: 24px; }

    /* Form */
    .form-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }
    @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }
    .form-group { margin-bottom: 0; }
    .form-label {
      display: block; font-size: 14px; font-weight: 500;
      color: #1A2332; margin-bottom: 8px;
    }
    .req { color: #E53935; margin-left: 2px; }
    .form-input {
      width: 100%; padding: 12px 16px;
      border: 1.5px solid #D1D5DB; border-radius: 8px;
      font-size: 14px; font-family: 'Inter', 'Roboto', Arial, sans-serif;
      color: #1A2332; background: #fff;
      transition: 200ms; outline: none; box-sizing: border-box;
    }
    .form-input:focus {
      border-color: #1B5E99;
      box-shadow: 0 0 0 3px rgba(27,94,153,.12);
    }
    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%234A5568' d='M6 8L0 0h12z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 36px;
      cursor: pointer;
    }
    .form-hint { font-size: 12px; color: #4A5568; margin-top: 4px; }
    .form-error { font-size: 12px; color: #E53935; margin-top: 4px; }

    /* Result panel — azul claro igual que prototipo */
    .sim-result-panel {
      background: #E3F0FB;
      border: 1px solid #B3D4F0;
      border-radius: 12px;
      padding: 24px;
    }
    .sim-result-header {
      font-size: 12px; font-weight: 700;
      color: #1B5E99; margin-bottom: 12px;
    }
    .sim-dep-row {
      display: flex; justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #B3D4F0;
      font-size: 14px; color: #4A5568;
    }
    .sim-dep-row span:last-child { font-weight: 600; color: #1A2332; }
    .sim-dep-row:last-child { border-bottom: none; }
    .sim-dep-row--total {
      padding-top: 12px;
      font-size: 18px; font-weight: 700; color: #1B5E99;
      border-bottom: none;
    }
    .sim-dep-row--total span:last-child { color: #1B5E99; }
    .neg { color: #E53935 !important; }

    /* Alert info — igual que prototipo */
    .alert {
      display: flex; gap: 12px;
      padding: 16px 20px; border-radius: 8px;
      font-size: 13px;
    }
    .alert-info {
      background: #E3F2FD;
      border-left: 4px solid #1976D2;
      color: #0c3a6e;
    }

    /* Botones */
    .sim-actions { display: flex; gap: 12px; }
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 20px; border-radius: 8px;
      font-size: 14px; font-weight: 500; cursor: pointer;
      transition: 200ms; border: none;
      font-family: 'Inter', 'Roboto', Arial, sans-serif; line-height: 1.5;
    }
    .btn-primary {
      background: #1B5E99; color: #fff;
      box-shadow: 0 2px 8px rgba(27,94,153,.30);
    }
    .btn-primary:hover { background: #0D3E6E; }
    .btn-ghost { background: transparent; color: #4A5568; }
    .btn-ghost:hover { background: #F5F7FA; color: #1A2332; }
  `]
})
export class DepositSimulatorComponent implements OnInit, OnDestroy {
  form: FormGroup;
  result: SimulationResponse | null = null;
  irpfPct = '19%';
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private depositService: DepositService,
    private router: Router
  ) {
    this.form = this.fb.group({
      importe:    [10000, [Validators.required, Validators.min(1000)]],
      plazoMeses: [12,    [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Debounce 300ms en cambios del formulario (criterio UX US-F021-03)
    this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntil(this.destroy$)
    ).subscribe(() => { if (this.form.valid) this.simulate(); });

    this.simulate(); // cálculo inicial
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onInput(): void {
    // Trigger inmediato para select de plazo
    if (this.form.valid) this.simulate();
  }

  simulate(): void {
    if (this.form.invalid) return;
    const { importe, plazoMeses } = this.form.value;
    this.depositService.simulate({ importe: +importe, plazoMeses: +plazoMeses }).subscribe(r => {
      if (!r) return;
      this.result = r;
      const b = r.interesesBrutos;
      this.irpfPct = b > 50000 ? '23%' : b > 6000 ? '21%' : '19%';
    });
  }

  // LA-023-01: NUNCA [href] para navegación interna
  goToNew(): void { this.router.navigate(['/depositos', 'new']); }
  goBack(): void  { this.router.navigate(['/depositos']); }
}
