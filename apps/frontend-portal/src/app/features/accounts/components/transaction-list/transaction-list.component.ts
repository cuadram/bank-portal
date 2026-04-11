import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AccountService, Transaction, TransactionFilter } from '../../services/account.service';

@Component({
  selector: 'app-transaction-list',
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">📋 Movimientos</h2>
          <p class="page-subtitle">{{ totalElements }} movimientos · Cuenta: {{ accountId }}</p>
        </div>
        <button class="btn-secondary" (click)="router.navigate(['/accounts'])">← Volver a cuentas</button>
      </div>

      <!-- Filtros -->
      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Desde</label>
            <input class="filter-input" type="date" [(ngModel)]="fromDate"/>
          </div>
          <div class="filter-group">
            <label class="filter-label">Hasta</label>
            <input class="filter-input" type="date" [(ngModel)]="toDate"/>
          </div>
          <div class="filter-group">
            <label class="filter-label">Tipo</label>
            <select class="filter-input" [(ngModel)]="filter.type">
              <option value="">Todos</option>
              <option value="ABONO">Ingresos</option>
              <option value="CARGO">Gastos</option>
            </select>
          </div>
          <div class="filter-group filter-search">
            <label class="filter-label">Buscar concepto</label>
            <input class="filter-input" type="text" [(ngModel)]="searchText" placeholder="Concepto..."
                   (keydown.enter)="applyFilters()"/>
          </div>
          <div class="filter-group filter-action">
            <label class="filter-label">&nbsp;</label>
            <div class="filter-buttons">
              <button class="btn-search" (click)="applyFilters()">🔍 Buscar</button>
              <button class="btn-clear" (click)="clearFilters()" *ngIf="hasActiveFilters()">✕ Limpiar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Skeleton -->
      <div class="transactions-card" *ngIf="loading && transactions.length === 0">
        <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]"></div>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading && transactions.length === 0">
        <p>No hay movimientos para el período seleccionado.</p>
        <button class="btn-secondary" *ngIf="hasActiveFilters()" (click)="clearFilters()">
          Limpiar filtros
        </button>
      </div>

      <!-- Lista -->
      <div class="transactions-card" *ngIf="transactions.length > 0">
        <div class="txn-item" *ngFor="let txn of transactions; trackBy: trackById"
             [class.txn-cargo]="txn.type === 'CARGO'"
             [class.txn-abono]="txn.type === 'ABONO'">

          <div class="txn-icon">
            {{ txn.type === 'ABONO' ? '↑' : '↓' }}
          </div>

          <div class="txn-info">
            <div class="txn-concept" [innerHTML]="highlight(txn.concept)"></div>
            <div class="txn-meta">
              <span class="txn-date">{{ txn.transactionDate | date:'dd/MM/yyyy':'':'es' }}</span>
              <span class="txn-category">{{ txn.category }}</span>
            </div>
          </div>

          <div class="txn-amounts">
            <div class="txn-amount" [class.amount-positive]="txn.type === 'ABONO'"
                 [class.amount-negative]="txn.type === 'CARGO'">
              {{ txn.type === 'ABONO' ? '+' : '' }}{{ txn.amount | currency:'EUR':'symbol':'1.2-2':'es' }}
            </div>
            <div class="txn-balance">
              Saldo: {{ txn.balanceAfter | currency:'EUR':'symbol':'1.2-2':'es' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Cargar más -->
      <div class="load-more" *ngIf="transactions.length > 0 && !isLastPage">
        <button class="btn-load-more" (click)="loadMore()" [disabled]="loading">
          {{ loading ? 'Cargando...' : 'Cargar más movimientos' }}
        </button>
      </div>

    </div>
  `,
  styles: [`
    .page-container { font-family: Arial, sans-serif; max-width: 860px; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; }
    .page-title { color:#1B3A6B; margin:0; font-size:1.4rem; }
    .page-subtitle { color:#888; margin:.25rem 0 0; font-size:.85rem; }
    .btn-secondary { background:#fff; color:#1B3A6B; border:1px solid #1B3A6B; border-radius:6px; padding:.5rem 1rem; cursor:pointer; font-size:.85rem; }

    /* Filtros */
    .filters-card { background:#fff; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.07); padding:1.25rem 1.5rem; margin-bottom:1rem; }
    .filters-grid { display:flex; gap:1rem; flex-wrap:wrap; align-items:flex-end; }
    .filter-group { display:flex; flex-direction:column; gap:.3rem; }
    .filter-search { flex:1; min-width:180px; }
    .filter-label { font-size:.72rem; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:.05em; }
    .filter-input { padding:.5rem .75rem; border:1px solid #ddd; border-radius:6px; font-size:.88rem; background:#fff; }
    .filter-input:focus { outline:none; border-color:#1B3A6B; }
    .filter-buttons { display:flex; gap:.5rem; }
    .btn-search { padding:.5rem 1rem; background:#1B3A6B; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:.85rem; font-weight:600; }
    .btn-search:hover { background:#152d55; }
    .btn-clear { padding:.5rem .9rem; background:#fce4ec; color:#c62828; border:none; border-radius:6px; cursor:pointer; font-size:.82rem; font-weight:600; }

    /* Transacciones */
    .transactions-card { background:#fff; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.07); overflow:hidden; margin-bottom:1rem; }

    .txn-item { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; border-bottom:1px solid #f5f5f5; transition:background .1s; }
    .txn-item:last-child { border-bottom:none; }
    .txn-item:hover { background:#f9fafb; }

    .txn-icon { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:1rem; flex-shrink:0; }
    .txn-abono .txn-icon { background:#e8f5e9; color:#2e7d32; }
    .txn-cargo .txn-icon { background:#fce4ec; color:#c62828; }

    .txn-info { flex:1; min-width:0; }
    .txn-concept { font-size:.9rem; font-weight:600; color:#222; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .txn-concept mark { background:#fff9c4; border-radius:2px; }
    .txn-meta { display:flex; gap:.75rem; margin-top:.2rem; }
    .txn-date { font-size:.78rem; color:#999; }
    .txn-category { font-size:.72rem; background:#f0f4fb; color:#1B3A6B; padding:.1rem .5rem; border-radius:10px; font-weight:600; }

    .txn-amounts { text-align:right; flex-shrink:0; }
    .txn-amount { font-size:1rem; font-weight:700; }
    .amount-positive { color:#2e7d32; }
    .amount-negative { color:#c62828; }
    .txn-balance { font-size:.75rem; color:#aaa; margin-top:.15rem; }

    /* Load more */
    .load-more { text-align:center; margin-top:.5rem; }
    .btn-load-more { background:#fff; border:1px solid #1B3A6B; color:#1B3A6B; border-radius:8px; padding:.65rem 2rem; cursor:pointer; font-weight:600; font-size:.9rem; }
    .btn-load-more:hover { background:#f0f4fb; }
    .btn-load-more:disabled { opacity:.5; cursor:not-allowed; }

    /* Skeleton */
    .skeleton-row { height:60px; background:linear-gradient(90deg,#f5f5f5 0%,#ebebeb 50%,#f5f5f5 100%); margin-bottom:1px; }

    .empty-state { text-align:center; padding:3rem; color:#999; background:#fff; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
  `]
})
export class TransactionListComponent implements OnInit, OnDestroy {

  transactions: Transaction[] = [];
  loading = false;
  totalElements = 0;
  isLastPage = false;
  filter: TransactionFilter = {};
  searchText = '';
  fromDate = '';   // YYYY-MM-DD del input date
  toDate = '';     // YYYY-MM-DD del input date
  searchCtrl = new FormControl(''); // mantenido para no romper imports

  protected accountId!: string;
  private currentPage = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private accountService: AccountService
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios del parámetro — se dispara cada vez que cambia la cuenta
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.accountId = params.get('id')!;
      console.log('[DEBUG] TransactionList accountId:', this.accountId);
      this.transactions = [];
      this.filter = {};
      this.searchText = '';
      this.fromDate = '';
      this.toDate = '';
      this.currentPage = 0;
      this.resetAndLoad();
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  applyFilters(): void {
    const trimmed = this.searchText.trim();
    this.filter.q = trimmed.length >= 1 ? trimmed : undefined;
    // Convertir fechas date-input (YYYY-MM-DD) a ISO 8601 datetime que espera el backend
    if (this.fromDate) this.filter.from = this.fromDate + 'T00:00:00Z';
    else this.filter.from = undefined;
    if (this.toDate) this.filter.to = this.toDate + 'T23:59:59Z';
    else this.filter.to = undefined;
    this.resetAndLoad();
  }

  clearFilters(): void {
    this.filter = {};
    this.searchText = '';
    this.fromDate = '';
    this.toDate = '';
    this.resetAndLoad();
  }

  loadMore(): void { this.currentPage++; this.load(false); }

  hasActiveFilters(): boolean {
    return !!(this.fromDate || this.toDate || this.filter.type || this.filter.q || this.searchText);
  }

  trackById(_: number, txn: Transaction): string { return txn.id; }

  highlight(concept: string): string {
    const q = (this.filter.q ?? '').trim();
    if (!q) return concept;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return concept.replace(re, '<mark>$1</mark>');
  }

  private resetAndLoad(): void {
    this.currentPage = 0; this.transactions = []; this.load(true);
  }

  private load(reset: boolean): void {
    if (!this.accountId) return;
    this.loading = true;
    this.accountService.getTransactions(this.accountId, { ...this.filter, page: this.currentPage, size: 20 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: page => {
          this.transactions  = reset ? page.content : [...this.transactions, ...page.content];
          this.totalElements = page.totalElements;
          this.isLastPage    = page.last;
          this.loading       = false;
        },
        error: () => { this.loading = false; }
      });
  }
}
