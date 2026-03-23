import {
  Component, OnInit, OnDestroy, Input,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AccountService, Transaction, TransactionFilter } from '../../services/account.service';

/**
 * US-702 / US-703 — Historial de movimientos paginado con filtros y búsqueda.
 *
 * - Paginación offset-based sobre el backend (Spring Pageable)
 * - Filtros: rango de fechas, tipo (CARGO/ABONO)
 * - Búsqueda full-text con debounce 300ms (US-703, mín. 3 chars)
 * - Botón "Cargar más" (infinite scroll progresivo)
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
@Component({
  selector: 'app-transaction-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Filtros (US-702) -->
    <div class="txn-filters" role="search">
      <input type="date" [(ngModel)]="filter.from"
             (change)="applyFilters()"
             aria-label="Fecha desde" class="txn-filter__input" />
      <input type="date" [(ngModel)]="filter.to"
             (change)="applyFilters()"
             aria-label="Fecha hasta" class="txn-filter__input" />
      <select [(ngModel)]="filter.type"
              (change)="applyFilters()"
              aria-label="Tipo de movimiento" class="txn-filter__select">
        <option value="">Todos</option>
        <option value="CARGO">Cargos</option>
        <option value="ABONO">Abonos</option>
      </select>

      <!-- Búsqueda full-text (US-703) — debounce 300ms -->
      <input type="search"
             [formControl]="searchCtrl"
             placeholder="Buscar movimientos..."
             aria-label="Buscar por concepto, importe o fecha"
             class="txn-filter__search" />

      <button (click)="clearFilters()" class="txn-filter__clear"
              aria-label="Limpiar filtros">Limpiar</button>
    </div>

    <!-- Contador de resultados -->
    <div *ngIf="!loading && totalElements > 0"
         class="txn-count" role="status" aria-live="polite">
      {{ totalElements }} movimientos encontrados
    </div>

    <!-- Skeleton loader -->
    <div *ngIf="loading && transactions.length === 0" class="txn-skeleton">
      <div *ngFor="let i of [1,2,3,4,5]" class="txn-skeleton__row">
        <div class="skeleton skeleton--sm"></div>
        <div class="skeleton skeleton--lg"></div>
        <div class="skeleton skeleton--md"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div *ngIf="!loading && transactions.length === 0"
         class="txn-empty" role="status">
      <p>No hay movimientos para el período seleccionado.</p>
      <button *ngIf="hasActiveFilters()" (click)="clearFilters()"
              class="txn-empty__clear">Limpiar filtros</button>
    </div>

    <!-- Lista de movimientos -->
    <ul *ngIf="transactions.length > 0" class="txn-list" role="list">
      <li *ngFor="let txn of transactions; trackBy: trackById"
          class="txn-item"
          [class.txn-item--cargo]="txn.type === 'CARGO'"
          [class.txn-item--abono]="txn.type === 'ABONO'"
          role="listitem">

        <div class="txn-item__date">
          {{ txn.transactionDate | date:'dd/MM/yyyy HH:mm':'':'es' }}
        </div>
        <div class="txn-item__concept"
             [innerHTML]="highlight(txn.concept)"></div>
        <div class="txn-item__category">{{ txn.category }}</div>

        <div class="txn-item__amount"
             [class.txn-item__amount--negative]="txn.amount < 0">
          {{ txn.amount | currency:'EUR':'symbol':'1.2-2':'es' }}
        </div>
        <div class="txn-item__balance">
          Saldo: {{ txn.balanceAfter | currency:'EUR':'symbol':'1.2-2':'es' }}
        </div>
      </li>
    </ul>

    <!-- Cargar más -->
    <div *ngIf="transactions.length > 0 && !isLastPage"
         class="txn-load-more">
      <button (click)="loadMore()"
              [disabled]="loading"
              class="txn-load-more__btn"
              aria-label="Cargar más movimientos">
        {{ loading ? 'Cargando...' : 'Cargar más' }}
      </button>
    </div>
  `
})
export class TransactionListComponent implements OnInit, OnDestroy {

  @Input() accountId!: string;

  transactions:  Transaction[] = [];
  loading        = false;
  totalElements  = 0;
  isLastPage     = false;

  filter: TransactionFilter = {};
  searchCtrl = new FormControl('');

  private currentPage = 0;
  private destroy$    = new Subject<void>();

  constructor(
    private accountService: AccountService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // US-703: debounce 300ms en búsqueda, mín. 3 chars
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => {
      const trimmed = (q ?? '').trim();
      this.filter.q = trimmed.length >= 3 ? trimmed : undefined;
      this.resetAndLoad();
    });

    this.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    this.resetAndLoad();
  }

  clearFilters(): void {
    this.filter = {};
    this.searchCtrl.setValue('', { emitEvent: false });
    this.resetAndLoad();
  }

  loadMore(): void {
    this.currentPage++;
    this.load(false);
  }

  hasActiveFilters(): boolean {
    return !!(this.filter.from || this.filter.to ||
              this.filter.type || this.filter.q);
  }

  trackById(_: number, txn: Transaction): string {
    return txn.id;
  }

  /** US-703: resalta el término buscado en el concepto. */
  highlight(concept: string): string {
    const q = (this.filter.q ?? '').trim();
    if (!q) return concept;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return concept.replace(re, '<mark>$1</mark>');
  }

  private resetAndLoad(): void {
    this.currentPage  = 0;
    this.transactions = [];
    this.load(true);
  }

  private load(reset: boolean): void {
    if (!this.accountId) return;
    this.loading = true;

    const params: TransactionFilter = {
      ...this.filter,
      page: this.currentPage,
      size: 20
    };

    this.accountService.getTransactions(this.accountId, params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: page => {
          this.transactions  = reset
            ? page.content
            : [...this.transactions, ...page.content];
          this.totalElements = page.totalElements;
          this.isLastPage    = page.last;
          this.loading       = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
