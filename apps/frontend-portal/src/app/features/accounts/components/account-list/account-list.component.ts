import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountService, AccountSummary } from '../../services/account.service';

@Component({
  selector: 'app-account-list',
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2 class="page-title">💳 Cuentas</h2>
          <p class="page-subtitle">Tus cuentas bancarias en Banco Meridian</p>
        </div>
      </div>

      <!-- Skeleton -->
      <div class="accounts-grid" *ngIf="loading">
        <div class="account-card skeleton-card" *ngFor="let i of [1,2]">
          <div class="sk sk-short"></div>
          <div class="sk sk-long"></div>
          <div class="sk sk-amount"></div>
        </div>
      </div>

      <!-- Error -->
      <div class="alert-error" *ngIf="!loading && error" role="alert">
        ⚠️ No se pueden cargar las cuentas. <button class="btn-link" (click)="loadAccounts()">Reintentar</button>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading && !error && accounts.length === 0">
        <p>No tienes cuentas asociadas. Contacta con tu oficina.</p>
      </div>

      <!-- Cuentas -->
      <div class="accounts-grid" *ngIf="!loading && accounts.length > 0">
        <div class="account-card" *ngFor="let acc of accounts"
             (click)="goToTransactions(acc)"
             (keydown.enter)="goToTransactions(acc)"
             tabindex="0" role="button"
             [attr.aria-label]="'Ver movimientos de ' + acc.alias">

          <div class="account-card__top">
            <div>
              <div class="account-alias">{{ acc.alias }}</div>
              <div class="account-iban">{{ acc.ibanMasked }}</div>
            </div>
            <span class="account-type-badge" [class.badge-corriente]="acc.type==='CORRIENTE'"
                  [class.badge-ahorro]="acc.type==='AHORRO'">
              {{ typeLabel(acc.type) }}
            </span>
          </div>

          <div class="account-card__balance">
            <div class="balance-section">
              <div class="balance-label">SALDO DISPONIBLE</div>
              <div class="balance-amount" [class.negative]="acc.availableBalance < 0">
                {{ acc.availableBalance | currency:'EUR':'symbol':'1.2-2':'es' }}
              </div>
            </div>
            <div class="balance-section retained" *ngIf="acc.retainedBalance > 0">
              <div class="balance-label">RETENIDO</div>
              <div class="balance-amount retained-amount">
                {{ acc.retainedBalance | currency:'EUR':'symbol':'1.2-2':'es' }}
              </div>
            </div>
          </div>

          <div class="account-card__footer">
            <span class="view-movements">Ver movimientos →</span>
          </div>
        </div>

        <!-- Totales dentro del grid -->
        <div class="totals-card" *ngIf="!loading && accounts.length > 0">
          <div class="total-item">
            <span class="total-label">Saldo total</span>
            <span class="total-amount">{{ totalBalance | currency:'EUR':'symbol':'1.2-2':'es' }}</span>
          </div>
          <div class="total-item">
            <span class="total-label">Número de cuentas</span>
            <span class="total-amount">{{ accounts.length }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { font-family: Arial, sans-serif; max-width: 700px; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .page-title { color:#1B3A6B; margin:0; font-size:1.5rem; }
    .page-subtitle { color:#888; margin:.25rem 0 0; font-size:.9rem; }

    .accounts-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:1.25rem; margin-bottom:1.25rem; }

    .account-card {
      background:#fff; border-radius:12px; padding:1.5rem;
      box-shadow:0 2px 12px rgba(0,0,0,.08);
      cursor:pointer; transition:transform .15s, box-shadow .15s;
      border:2px solid transparent;
    }
    .account-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(27,58,107,.15); border-color:#e0e8f5; }

    .account-card__top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; }
    .account-alias { font-size:1rem; font-weight:700; color:#1B3A6B; margin-bottom:.3rem; }
    .account-iban { font-family:'Courier New',monospace; font-size:.82rem; color:#888; }

    .account-type-badge { padding:.3rem .75rem; border-radius:20px; font-size:.72rem; font-weight:700; white-space:nowrap; }
    .badge-corriente { background:#e8edf5; color:#1B3A6B; }
    .badge-ahorro { background:#e8f5e9; color:#2e7d32; }

    .account-card__balance {
      background:#f4f6f9; border-radius:8px; padding:1rem 1.25rem;
      display:flex; gap:2rem; margin-bottom:1rem;
    }
    .balance-section { }
    .balance-label { font-size:.65rem; color:#888; letter-spacing:.08em; margin-bottom:.25rem; }
    .balance-amount { font-size:1.4rem; font-weight:700; color:#1B3A6B; }
    .balance-amount.negative { color:#c62828; }
    .retained { border-left:1px solid #e0e0e0; padding-left:2rem; }
    .retained-amount { font-size:1rem; color:#f57f17; }

    .account-card__footer { text-align:right; }
    .view-movements { font-size:.82rem; color:#1B3A6B; font-weight:600; }

    /* Totales */
    .totals-card {
      background:#1B3A6B; border-radius:10px; padding:1.25rem 1.5rem;
      display:flex; gap:3rem; color:#fff;
      grid-column: 1 / -1;
    }
    .total-item { display:flex; flex-direction:column; }
    .total-item:last-child { text-align:center; }
    .total-label { font-size:.72rem; opacity:.7; letter-spacing:.06em; display:block; margin-bottom:.3rem; }
    .total-amount { font-size:1.3rem; font-weight:700; }

    /* Skeleton */
    .skeleton-card { background:#fff; pointer-events:none; }
    .sk { background:#e8e8e8; border-radius:4px; margin-bottom:.75rem; }
    .sk-short  { height:14px; width:40%; }
    .sk-long   { height:12px; width:70%; }
    .sk-amount { height:32px; width:55%; margin-top:.5rem; }

    /* Alerts */
    .alert-error { background:#fce4ec; color:#c62828; border-radius:8px; padding:1rem 1.25rem; margin-bottom:1rem; }
    .btn-link { background:none; border:none; color:#c62828; cursor:pointer; font-weight:700; text-decoration:underline; }
    .empty-state { text-align:center; padding:3rem; color:#999; background:#fff; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
  `]
})
export class AccountListComponent implements OnInit, OnDestroy {
  accounts: AccountSummary[] = [];
  loading = true;
  error = false;

  private destroy$ = new Subject<void>();

  get totalBalance(): number {
    return this.accounts.reduce((sum, a) => sum + a.availableBalance, 0);
  }

  constructor(private accountService: AccountService, private router: Router) {}

  ngOnInit(): void { this.loadAccounts(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadAccounts(): void {
    this.loading = true; this.error = false;
    this.accountService.getAccounts().pipe(takeUntil(this.destroy$)).subscribe({
      next: accounts => { this.accounts = accounts; this.loading = false; },
      error: ()       => { this.loading = false; this.error = true; }
    });
  }

  goToTransactions(acc: AccountSummary): void {
    console.log('[DEBUG] Navigate to account:', acc.accountId, acc.alias);
    this.router.navigate(['/accounts', acc.accountId, 'transactions']);
  }

  typeLabel(type: string): string {
    return { CORRIENTE: 'Corriente', AHORRO: 'Ahorro', NOMINA: 'Nómina' }[type] ?? type;
  }
}
