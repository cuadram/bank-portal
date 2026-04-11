import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DepositService } from '../../services/deposit.service';

@Component({
  selector: 'app-deposit-detail',
  template: `
    <div class="detail-page">

      <!-- Breadcrumb -->
      <div class="breadcrumb" *ngIf="!loading">
        <a class="bc-link" (click)="goBack()">Mis Depósitos</a>
        <span class="bc-sep">›</span>
        <span>Depósito {{ deposit?.plazoMeses }} meses</span>
      </div>

      <!-- Skeleton -->
      <ng-container *ngIf="loading">
        <div class="sk sk-title"></div>
        <div class="sk-grid">
          <div class="sk sk-card"></div>
          <div class="sk sk-card"></div>
        </div>
      </ng-container>

      <!-- Contenido -->
      <ng-container *ngIf="!loading && deposit">

        <!-- Header: título + badges + botones -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Depósito {{ deposit.plazoMeses }} meses</h1>
            <div class="badges-row">
              <span *ngIf="deposit.fgdCovered" class="badge badge-fgd">🛡 FGD</span>
              <span class="badge" [ngClass]="estadoBadgeClass(deposit.estado)">
                ● {{ estadoLabel(deposit.estado) }}
              </span>
            </div>
          </div>
          <div class="header-actions" *ngIf="deposit.estado === 'ACTIVE'">
            <button class="btn btn-secondary" (click)="goToRenewal()">🔄 Renovación</button>
            <button class="btn btn-danger" (click)="goToCancel()">⛔ Cancelar</button>
          </div>
        </div>

        <!-- Grid 2 columnas -->
        <div class="grid-2">

          <!-- Col izquierda: Datos del depósito -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Datos del depósito</span>
            </div>
            <div class="card-body">
              <div class="dl-row">
                <span class="dl-label">Importe</span>
                <span class="dl-value loan-amount-big">{{ deposit.importe | number:'1.2-2':'es' }} €</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">TIN</span>
                <span class="dl-value">{{ (deposit.tin * 100) | number:'1.2-2':'es' }}% nominal anual</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">TAE</span>
                <span class="dl-value">{{ (deposit.tae * 100) | number:'1.2-2':'es' }}%</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Fecha apertura</span>
                <span class="dl-value">{{ deposit.fechaApertura | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Fecha vencimiento</span>
                <span class="dl-value">{{ deposit.fechaVencimiento | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Plazo</span>
                <span class="dl-value">{{ plazoEnDias }} días ({{ deposit.plazoMeses }} meses)</span>
              </div>
              <div class="dl-row">
                <span class="dl-label">Cuenta origen</span>
                <span class="dl-value dl-mono">{{ cuentaMasked }}</span>
              </div>
              <div class="dl-row dl-row--last">
                <span class="dl-label">Al vencimiento</span>
                <span class="dl-value">{{ renovacionLabel(deposit.renovacion) }}</span>
              </div>
            </div>
          </div>

          <!-- Col derecha: irpf-panel + alert -->
          <div>
            <div class="irpf-panel">
              <div class="irpf-panel-title">📊 Cuadro de liquidación fiscal</div>

              <!-- Intereses brutos -->
              <div class="irpf-row">
                <span>Intereses brutos al vencimiento</span>
                <span class="irpf-val-bold">{{ deposit.interesesBrutos | number:'1.2-2':'es' }} €</span>
              </div>

              <!-- Tramo aplicado -->
              <div class="irpf-row irpf-row--tramo">
                <span>Tramo aplicado: {{ irpfPct }} {{ tramoLabel }}</span>
                <span></span>
              </div>

              <!-- Retención IRPF -->
              <div class="irpf-row">
                <span>Retención IRPF en origen</span>
                <span class="irpf-val-error">− {{ deposit.retencionIrpf | number:'1.2-2':'es' }} €</span>
              </div>

              <hr class="irpf-hr">

              <!-- Intereses netos -->
              <div class="irpf-row">
                <span>Intereses netos</span>
                <span>{{ deposit.interesesNetos | number:'1.2-2':'es' }} €</span>
              </div>

              <!-- Total al vencimiento (último, bold + primary) -->
              <div class="irpf-row irpf-row--total">
                <span>Importe total al vencimiento</span>
                <span>{{ deposit.totalVencimiento | number:'1.2-2':'es' }} €</span>
              </div>
            </div>

            <!-- Alert IRPF provisional -->
            <div class="alert alert-info">
              ℹ La retención IRPF es provisional. El tipo definitivo depende de tu declaración anual de la renta.
            </div>
          </div>

        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .detail-page {
      font-family: 'Inter','Roboto',Arial,sans-serif;
      color: #1A2332;
    }

    /* Breadcrumb */
    .breadcrumb { display:flex; align-items:center; gap:8px; font-size:12px; color:#4A5568; margin-bottom:16px; }
    .bc-link { color:#1B5E99; cursor:pointer; }
    .bc-link:hover { text-decoration:underline; }
    .bc-sep { opacity:.4; }

    /* Page header */
    .page-header {
      display:flex; align-items:flex-start; justify-content:space-between;
      margin-bottom:24px;
    }
    .page-title { font-size:24px; font-weight:700; color:#1A2332; margin:0 0 8px; }
    .badges-row { display:flex; gap:8px; }
    .header-actions { display:flex; gap:12px; }

    /* Badges */
    .badge {
      display:inline-flex; align-items:center; gap:4px;
      padding:3px 10px; border-radius:9999px;
      font-size:11px; font-weight:600;
    }
    .badge-fgd     { background:#E8F4FD; color:#1565C0; }
    .badge-success { background:#E0F2F1; color:#00695C; }
    .badge-error   { background:#FFEBEE; color:#C62828; }
    .badge-neutral { background:#F5F7FA; color:#4A5568; }

    /* Buttons */
    .btn {
      display:inline-flex; align-items:center; gap:8px;
      padding:8px 20px; border-radius:8px;
      font-size:14px; font-weight:500; cursor:pointer;
      transition:200ms; border:none;
      font-family:'Inter','Roboto',Arial,sans-serif; line-height:1.5;
    }
    .btn-secondary {
      background:transparent; color:#1B5E99;
      border:1.5px solid #1B5E99;
    }
    .btn-secondary:hover { background:#E3F0FB; }
    .btn-danger { background:#E53935; color:#fff; }
    .btn-danger:hover { background:#c62828; }

    /* Grid 2 columnas */
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    @media(max-width:900px){ .grid-2{ grid-template-columns:1fr; } }

    /* Card */
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

    /* dl-rows */
    .dl-row {
      display:flex; gap:16px;
      padding:12px 0; border-bottom:1px solid #E8ECF0;
    }
    .dl-row--last { border-bottom:none; }
    .dl-label {
      font-size:12px; color:#4A5568;
      min-width:180px; flex-shrink:0;
    }
    .dl-value { font-size:14px; color:#1A2332; font-weight:500; }
    .loan-amount-big { font-size:28px; font-weight:700; color:#1B5E99; }
    .dl-mono { font-family:monospace; font-size:13px; }

    /* irpf-panel */
    .irpf-panel {
      background:#FFF8E1; border:1px solid #FFE082;
      border-radius:8px; padding:20px;
      margin-bottom:16px;
    }
    .irpf-panel-title {
      font-size:12px; font-weight:700; color:#7c4700;
      margin-bottom:12px;
    }
    .irpf-row {
      display:flex; justify-content:space-between;
      padding:8px 0; border-bottom:1px solid #FFE082;
      font-size:14px;
    }
    .irpf-row span:first-child { color:#4A5568; }
    .irpf-row--tramo {
      color:#7c4700 !important; font-size:12px;
    }
    .irpf-row--tramo span:first-child { color:#7c4700; font-size:12px; }
    .irpf-row--total {
      border-bottom:none;
      font-weight:700; font-size:16px; color:#1B5E99;
    }
    .irpf-row--total span:first-child { color:#4A5568; font-weight:700; }
    .irpf-val-bold { font-weight:600; }
    .irpf-val-error { color:#E53935; font-weight:600; }
    .irpf-hr {
      border:none; border-top:2px solid #FFE082;
      margin:8px 0;
    }

    /* Alert */
    .alert {
      display:flex; gap:12px;
      padding:16px 20px; border-radius:8px;
      font-size:12px;
    }
    .alert-info {
      background:#E3F2FD;
      border-left:4px solid #1976D2;
      color:#0c3a6e;
    }

    /* Skeleton */
    .sk { background:linear-gradient(90deg,#F5F7FA 25%,#E8ECF0 50%,#F5F7FA 75%); background-size:800px 100%; animation:shimmer 1.5s infinite; border-radius:8px; }
    .sk-title { height:28px; width:220px; margin-bottom:24px; }
    .sk-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .sk-card { height:340px; }
    @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  `]
})
export class DepositDetailComponent implements OnInit {
  deposit: any = null;
  loading = true;
  irpfPct = '19%';
  tramoLabel = '(intereses ≤ 6.000 €)';

  // Mock IBAN enmascarado hasta tener campo en DTO
  get cuentaMasked(): string {
    return this.deposit?.cuentaOrigenId ? 'ES12 **** **** 1234' : 'ES12 **** **** 1234';
  }

  get plazoEnDias(): number {
    if (!this.deposit?.plazoMeses) return 0;
    return Math.round(this.deposit.plazoMeses * 30.4375);
  }

  estadoLabel(estado: string): string {
    return estado === 'ACTIVE' ? 'Activo' : estado === 'MATURED' ? 'Vencido' : 'Cancelado';
  }

  estadoBadgeClass(estado: string): string {
    return estado === 'ACTIVE' ? 'badge-success' : estado === 'CANCELLED' ? 'badge-error' : 'badge-neutral';
  }

  renovacionLabel(renovacion: string): string {
    const map: Record<string,string> = {
      'RENEW_MANUAL':       'Renovación manual',
      'RENEW_AUTO':         'Renovación automática',
      'CANCEL_AT_MATURITY': 'Cancelar al vencimiento',
    };
    return map[renovacion] ?? renovacion;
  }

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
        if (d?.interesesBrutos) {
          if (d.interesesBrutos <= 6000)       { this.irpfPct = '19%'; this.tramoLabel = '(intereses ≤ 6.000 €)'; }
          else if (d.interesesBrutos <= 50000) { this.irpfPct = '21%'; this.tramoLabel = '(intereses ≤ 50.000 €)'; }
          else                                  { this.irpfPct = '23%'; this.tramoLabel = '(intereses > 50.000 €)'; }
        }
        this.loading = false;
      });
    });
  }

  // LA-023-01: NUNCA [href] para navegación interna
  goBack(): void      { this.router.navigate(['/depositos']); }
  goToRenewal(): void { this.router.navigate(['/depositos', this.deposit.id, 'renovacion']); }
  goToCancel(): void  { this.router.navigate(['/depositos', this.deposit.id, 'cancelar']); }
}
