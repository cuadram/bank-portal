import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DepositService } from '../../services/deposit.service';
import { Deposit } from '../../models/deposit.model';

@Component({
  selector: 'app-deposit-list',
  template: `
    <div class="deposit-list-page">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">💰 Mis Depósitos</h1>
          <p class="page-subtitle">Gestiona tus depósitos a plazo fijo</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="goToSimulator()">🧮 Simular</button>
          <button class="btn btn-primary" (click)="goToNew()">+ Nuevo depósito</button>
        </div>
      </div>

      <!-- Loading skeleton -->
      <ng-container *ngIf="loading">
        <div class="deposit-card skeleton-card" *ngFor="let i of [1,2,3]">
          <div class="sk sk-header"></div>
          <div class="sk-grid">
            <div class="sk sk-kv" *ngFor="let j of [1,2,3,4]"></div>
          </div>
          <div class="sk sk-footer"></div>
        </div>
      </ng-container>

      <!-- Empty state -->
      <div *ngIf="!loading && deposits.length === 0" class="empty-state">
        <span class="empty-icon">🏦</span>
        <h3 class="empty-title">Aún no tienes depósitos</h3>
        <p class="empty-subtitle">Abre tu primer depósito a plazo fijo y empieza a rentabilizar tus ahorros. Usa el simulador sin ningún compromiso.</p>
        <div class="empty-actions">
          <button class="btn btn-secondary" (click)="goToSimulator()">🧮 Usar simulador</button>
          <button class="btn btn-primary" (click)="goToNew()">+ Abrir depósito</button>
        </div>
      </div>

      <!-- Lista de cards -->
      <div *ngIf="!loading && deposits.length > 0">
        <div class="deposit-card"
             *ngFor="let d of deposits"
             [class.deposit-card--matured]="d.estado !== 'ACTIVE'"
             (click)="goToDetail(d.id)">

          <!-- Card header: nombre + badges -->
          <div class="deposit-card-header">
            <span class="deposit-card-name">Depósito {{ d.plazoMeses }} meses</span>
            <div class="badges-group">
              <span *ngIf="d.fgdCovered" class="badge badge-fgd">🛡 FGD</span>
              <span class="badge" [ngClass]="estadoBadgeClass(d.estado)">
                ● {{ estadoLabel(d.estado) }}
              </span>
            </div>
          </div>

          <!-- Card grid 4 columnas: Importe | TIN | TAE | Vencimiento -->
          <div class="deposit-card-grid">
            <div class="deposit-kv">
              <span class="deposit-k">Importe</span>
              <span class="deposit-v">{{ d.importe | number:'1.2-2':'es' }} €</span>
            </div>
            <div class="deposit-kv">
              <span class="deposit-k">TIN</span>
              <span class="deposit-v">{{ (d.tin * 100) | number:'1.2-2':'es' }}%</span>
            </div>
            <div class="deposit-kv">
              <span class="deposit-k">TAE</span>
              <span class="deposit-v">{{ (d.tae * 100) | number:'1.2-4':'es' }}%</span>
            </div>
            <div class="deposit-kv">
              <span class="deposit-k">{{ d.estado === 'MATURED' ? 'Venció' : 'Vencimiento' }}</span>
              <span class="deposit-v">{{ d.fechaVencimiento | date:'dd/MM/yyyy' }}</span>
            </div>
          </div>

          <!-- Card footer: info apertura + botón detalle -->
          <div class="deposit-card-footer">
            <span class="deposit-footer-meta">
              {{ d.estado === 'MATURED'
                  ? 'Abonado en cuenta el ' + (d.fechaVencimiento | date:'dd/MM/yyyy')
                  : 'Apertura ' + (d.fechaApertura | date:'dd/MM/yyyy') + ' · ' + renovacionLabel(d.renovacion) }}
            </span>
            <button class="btn btn-sm" [ngClass]="d.estado === 'ACTIVE' ? 'btn-secondary' : 'btn-ghost'"
                    (click)="goToDetail(d.id); $event.stopPropagation()">
              Ver detalle →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .deposit-list-page {
      font-family: 'Inter', Arial, sans-serif;
      color: #1A2332;
    }

    /* Header */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px;
    }
    .page-title {
      font-size: 24px; font-weight: 700; color: #1A2332; margin: 0 0 4px;
    }
    .page-subtitle {
      font-size: 14px; color: #4A5568; margin: 0;
    }
    .header-actions { display: flex; gap: 12px; align-items: center; }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 20px; border-radius: 8px;
      font-size: 14px; font-weight: 500; cursor: pointer;
      transition: 200ms cubic-bezier(0.4,0,0.2,1); border: none;
      font-family: 'Inter', Arial, sans-serif; line-height: 1.5;
    }
    .btn-primary {
      background: #1B5E99; color: #fff;
      box-shadow: 0 2px 8px rgba(27,94,153,.30);
    }
    .btn-primary:hover { background: #0D3E6E; }
    .btn-secondary {
      background: transparent; color: #1B5E99;
      border: 1.5px solid #1B5E99;
    }
    .btn-secondary:hover { background: #E3F0FB; }
    .btn-ghost {
      background: transparent; color: #4A5568;
    }
    .btn-ghost:hover { background: #F5F7FA; color: #1A2332; }
    .btn-sm { padding: 4px 12px; font-size: 12px; }

    /* Deposit card */
    .deposit-card {
      background: #fff;
      border: 1px solid #E8ECF0;
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
      cursor: pointer;
      transition: 200ms cubic-bezier(0.4,0,0.2,1);
      margin-bottom: 12px;
    }
    .deposit-card:hover {
      box-shadow: 0 8px 32px rgba(0,0,0,.16);
      transform: translateY(-1px);
    }
    .deposit-card--matured { opacity: 0.65; }

    /* Card header */
    .deposit-card-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
    }
    .deposit-card-name {
      font-size: 16px; font-weight: 600; color: #1A2332;
    }
    .badges-group { display: flex; gap: 8px; align-items: center; }

    /* Badges */
    .badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 10px; border-radius: 9999px;
      font-size: 11px; font-weight: 600;
    }
    .badge-fgd { background: #E8F4FD; color: #1565C0; }
    .badge-success { background: #E0F2F1; color: #00695C; }
    .badge-error   { background: #FFEBEE; color: #C62828; }
    .badge-neutral { background: #F5F7FA; color: #4A5568; }

    /* Card grid 4 columnas */
    .deposit-card-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 12px; margin-bottom: 16px;
    }
    @media (max-width: 600px) { .deposit-card-grid { grid-template-columns: repeat(2, 1fr); } }
    .deposit-kv { display: flex; flex-direction: column; gap: 2px; }
    .deposit-k {
      font-size: 11px; color: #4A5568; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .deposit-v { font-size: 16px; font-weight: 700; color: #1A2332; }

    /* Card footer */
    .deposit-card-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 12px; border-top: 1px solid #E8ECF0;
    }
    .deposit-footer-meta { font-size: 12px; color: #4A5568; }

    /* Empty state */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 48px 24px; text-align: center;
      background: #fff; border-radius: 12px; border: 1px solid #E8ECF0;
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .empty-icon { font-size: 56px; margin-bottom: 16px; opacity: 0.5; display: block; }
    .empty-title { font-size: 18px; font-weight: 600; color: #1A2332; margin: 0 0 8px; }
    .empty-subtitle {
      font-size: 14px; color: #4A5568; margin: 0 0 24px;
      max-width: 360px;
    }
    .empty-actions { display: flex; gap: 12px; }

    /* Skeleton */
    .skeleton-card { cursor: default; }
    .skeleton-card:hover { transform: none; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .sk {
      background: linear-gradient(90deg, #F5F7FA 25%, #E8ECF0 50%, #F5F7FA 75%);
      background-size: 800px 100%; animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    .sk-header { height: 20px; width: 50%; margin-bottom: 16px; }
    .sk-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 16px; }
    .sk-kv { height: 40px; }
    .sk-footer { height: 16px; width: 70%; }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
  `]
})
export class DepositListComponent implements OnInit {
  deposits: Deposit[] = [];
  loading = true;

  constructor(private depositService: DepositService, private router: Router) {}

  ngOnInit(): void {
    this.depositService.getDeposits().subscribe(p => {
      this.deposits = p.content;
      this.loading = false;
    });
  }

  estadoLabel(estado: string): string {
    return estado === 'ACTIVE' ? 'Activo' : estado === 'MATURED' ? 'Vencido' : 'Cancelado';
  }

  estadoBadgeClass(estado: string): string {
    return estado === 'ACTIVE' ? 'badge-success' : estado === 'CANCELLED' ? 'badge-error' : 'badge-neutral';
  }

  renovacionLabel(renovacion: string): string {
    const map: Record<string, string> = {
      'RENEW_MANUAL':       'Renovación manual',
      'RENEW_AUTO':         'Auto renovación',
      'CANCEL_AT_MATURITY': 'Cancelar al vencer',
    };
    return map[renovacion] ?? renovacion;
  }

  // LA-023-01: NUNCA [href] para navegación interna
  goToDetail(id: string): void   { this.router.navigate(['/depositos', id]); }
  goToSimulator(): void           { this.router.navigate(['/depositos', 'simulate']); }
  goToNew(): void                 { this.router.navigate(['/depositos', 'new']); }
}
