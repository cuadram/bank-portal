import { Component, Input } from '@angular/core';
import { TopMerchant } from '../../services/dashboard.service';

/**
 * TopMerchantsComponent — ranking top 5 comercios por gasto mensual.
 * G1-FIX (2026-04-16): el endpoint /top-merchants existía en backend y en
 * DashboardService pero nunca se integraba en la UI. Componente creado y
 * conectado al forkJoin del DashboardComponent.
 * US-1106 FEAT-011 Sprint 13 (corrección coherencia).
 */
@Component({
  selector: 'app-top-merchants',
  template: `
    <div class="merchants-card">
      <h3>Top comercios del mes</h3>

      <ng-container *ngIf="loading">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]"></div>
      </ng-container>

      <ng-container *ngIf="!loading && (!merchants || merchants.length === 0)">
        <p class="empty-msg">Sin datos de comercios para este período.</p>
      </ng-container>

      <ul *ngIf="!loading && merchants && merchants.length > 0" class="merchant-list">
        <li *ngFor="let m of merchants; let i = index" class="merchant-item">
          <span class="rank">{{ i + 1 }}</span>
          <span class="name">{{ m.issuer }}</span>
          <span class="count">{{ m.count }} op.</span>
          <span class="amount">{{ m.totalAmount | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
        </li>
      </ul>
    </div>
  `,
  styles: [`
    .merchants-card {
      background: #fff;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,.1);
    }
    h3 { color: #1B3A6B; margin-top: 0; }
    .merchant-list { list-style: none; padding: 0; margin: 0; }
    .merchant-item {
      display: grid;
      grid-template-columns: 24px 1fr 60px 7rem;
      align-items: center;
      gap: .75rem;
      padding: .6rem 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: .9rem;
    }
    .merchant-item:last-child { border-bottom: none; }
    .rank {
      font-weight: 700;
      color: #1B3A6B;
      font-size: .85rem;
      text-align: center;
    }
    .name { color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .count { color: #999; font-size: .8rem; text-align: right; }
    .amount {
      font-weight: 600;
      color: #c62828;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .empty-msg { color: #9e9e9e; font-size: .9rem; margin: 0; }
    .skeleton-row {
      height: 20px;
      background: #f0f0f0;
      border-radius: 4px;
      margin-bottom: .6rem;
    }
  `]
})
export class TopMerchantsComponent {
  @Input() merchants: TopMerchant[] | null = null;
  @Input() loading = true;
}
