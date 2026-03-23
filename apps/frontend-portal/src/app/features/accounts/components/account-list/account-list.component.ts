import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountService, AccountSummary } from '../../services/account.service';

/**
 * US-701 — Listado de cuentas con saldo actualizado.
 *
 * Estados: loading → cuentas cargadas | empty state | error state.
 * Skeleton loader durante la carga inicial (RNF-D07-01: p95 < 500ms).
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
@Component({
  selector: 'app-account-list',
  template: `
    <!-- Skeleton loader (US-701: loading state) -->
    <div *ngIf="loading" class="account-grid" aria-busy="true" aria-label="Cargando cuentas">
      <div *ngFor="let i of [1,2]" class="account-card account-card--skeleton">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--iban"></div>
        <div class="skeleton skeleton--balance"></div>
      </div>
    </div>

    <!-- Error state -->
    <div *ngIf="!loading && error" class="account-alert account-alert--error" role="alert">
      <span class="account-alert__icon">⚠</span>
      <span>No podemos actualizar los saldos en este momento. Mostrando datos en caché.</span>
    </div>

    <!-- Empty state (US-701: sin cuentas) -->
    <div *ngIf="!loading && !error && accounts.length === 0"
         class="account-empty" role="status">
      <p class="account-empty__text">
        Aún no tienes cuentas asociadas. Contacta con tu oficina.
      </p>
    </div>

    <!-- Listado de cuentas -->
    <div *ngIf="!loading && accounts.length > 0" class="account-grid">
      <div *ngFor="let account of accounts"
           class="account-card"
           [class.account-card--inactive]="false"
           (click)="selectAccount(account)"
           (keydown.enter)="selectAccount(account)"
           tabindex="0"
           role="button"
           [attr.aria-label]="'Ver movimientos de ' + account.alias">

        <div class="account-card__header">
          <span class="account-card__alias">{{ account.alias }}</span>
          <span class="account-card__type account-card__type--{{ account.type | lowercase }}">
            {{ typeLabel(account.type) }}
          </span>
        </div>

        <div class="account-card__iban">{{ account.ibanMasked }}</div>

        <!-- Saldo disponible (principal) -->
        <div class="account-card__balance">
          <span class="account-card__balance-label">Saldo disponible</span>
          <span class="account-card__balance-amount"
                [class.account-card__balance-amount--negative]="account.availableBalance < 0">
            {{ account.availableBalance | currency:'EUR':'symbol':'1.2-2':'es' }}
          </span>
        </div>

        <!-- Saldo retenido (si aplica) -->
        <div *ngIf="account.retainedBalance > 0" class="account-card__retained">
          <span class="account-card__retained-label">Retenido</span>
          <span class="account-card__retained-amount">
            {{ account.retainedBalance | currency:'EUR':'symbol':'1.2-2':'es' }}
          </span>
        </div>

      </div>
    </div>
  `
})
export class AccountListComponent implements OnInit, OnDestroy {

  accounts: AccountSummary[] = [];
  loading  = true;
  error    = false;
  selected: AccountSummary | null = null;

  private destroy$ = new Subject<void>();

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAccounts(): void {
    this.loading = true;
    this.error   = false;

    this.accountService.getAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  accounts => { this.accounts = accounts; this.loading = false; },
        error: ()       => { this.loading  = false;    this.error   = true;  }
      });
  }

  selectAccount(account: AccountSummary): void {
    this.selected = account;
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      CORRIENTE: 'Cuenta corriente',
      AHORRO:    'Cuenta ahorro',
      NOMINA:    'Cuenta nómina'
    };
    return labels[type] ?? type;
  }
}
