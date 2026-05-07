import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

import { SavingsService } from '../../services/savings.service';
import { Allocation, Page } from '../../models/savings.models';

/**
 * ContributionHistoryComponent - Smart paginado (US-024-03)
 *
 * Fase G.2 LOTE 2.3.
 *
 * Pixel-perfect contra prototipo PROTO-FEAT-024-sprint26.html lineas 1401-1440
 * (timeline embebido en screen-savings-detail). LA-CORE-056 BLOQUEANTE en G-4.
 *
 * Renderiza el historial de aportaciones de una meta (paginado server-side
 * via Spring Data Page<T>), invocando GET /api/v1/savings/goals/{id}/contributions
 * con page/size querystring.
 *
 * Cada Allocation se muestra como timeline-row con:
 *   - icon: 💸 si type=MANUAL · 🔁 si type=AUTO
 *   - title: 'Aportacion manual' | 'Aportacion automatica' | 'Aportacion fallida' (status=FAILED)
 *   - sub:   formatted executedAt + cuenta + (allocationMonth para AUTO) + (failureReason para FAILED)
 *   - amount: '+X,XX €' formato es-ES (oculto si status=FAILED)
 *
 * Decision: NO se mezclan milestones aqui (los milestones se muestran en el header
 * card de GoalDetail como milestone-strip 4 dots con etiquetas). El DTO backend
 * separa GoalDetail.recentAllocations de GoalDetail.milestones (LLD-frontend §3).
 * El prototipo (lineas 1402-1408 y 1433-1439) MEZCLA hitos en la timeline pero esa
 * es solo una decision visual del prototipo · seguir el contrato del DTO es mas
 * correcto y simplifica el componente. Si el PO insiste en G-4 visual review se
 * puede unificar como mejora.
 *
 * Paginacion sin @angular/cdk (decision PO override). Botones 'Anterior' /
 * 'Siguiente' + indicador 'Pagina N de M'. Tamano fijo 20 (LLD-backend §11).
 *
 * Empty-state textual sencillo si page.empty || totalElements==0.
 *
 * OnPush + cdr.markForCheck() en mutaciones (LA aprendida en auditoria LOTE 2.1)
 * Sin signals · destroy$ + takeUntil
 *
 * Inputs:
 *   - goalId: string (obligatorio)
 *
 * FEAT-024 Sprint 26.
 */
@Component({
  selector: 'app-contribution-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contrib-history">
      <div *ngIf="loading" class="loading" role="status" aria-live="polite">
        Cargando aportaciones...
      </div>

      <div *ngIf="errorMessage" class="error" role="alert">
        <span aria-hidden="true">⚠️</span>
        <span>{{ errorMessage }}</span>
        <button type="button" class="btn-link" (click)="reload()">Reintentar</button>
      </div>

      <ng-container *ngIf="!loading && !errorMessage">
        <div *ngIf="items.length === 0" class="empty">
          Aún no hay aportaciones registradas para esta meta.
        </div>

        <div class="timeline" *ngIf="items.length > 0">
          <div class="timeline-row"
               *ngFor="let alloc of items; trackBy: trackByAlloc"
               [class.failed]="alloc.status === 'FAILED'">
            <div class="timeline-icon"
                 [class.auto]="alloc.type === 'AUTO' && alloc.status !== 'FAILED'"
                 [class.failed]="alloc.status === 'FAILED'">
              {{ iconFor(alloc) }}
            </div>
            <div class="timeline-body">
              <div class="timeline-title">{{ titleFor(alloc) }}</div>
              <div class="timeline-sub">{{ subtitleFor(alloc) }}</div>
            </div>
            <div class="timeline-amount"
                 *ngIf="alloc.status !== 'FAILED'">
              +{{ formatCurrency(alloc.amount) }}
            </div>
          </div>
        </div>

        <nav class="pagination" *ngIf="totalPages > 1" aria-label="Paginacion del historial">
          <button type="button"
                  class="btn btn-secondary btn-small"
                  [disabled]="page === 0 || loading"
                  (click)="prevPage()"
                  aria-label="Pagina anterior">← Anterior</button>
          <span class="page-indicator">Página {{ page + 1 }} de {{ totalPages }}</span>
          <button type="button"
                  class="btn btn-secondary btn-small"
                  [disabled]="page >= totalPages - 1 || loading"
                  (click)="nextPage()"
                  aria-label="Pagina siguiente">Siguiente →</button>
        </nav>
      </ng-container>
    </div>
  `,
  styles: [`
    .contrib-history { display: block; }
    .loading {
      padding: var(--sp-4, 16px);
      text-align: center;
      color: var(--color-text-secondary, #6b7280);
      font-size: var(--text-sm, 14px);
    }
    .error {
      display: flex;
      gap: var(--sp-3, 12px);
      align-items: center;
      padding: var(--sp-3, 12px);
      background: var(--color-error-light, #ffebee);
      border-left: 4px solid var(--color-error, #d32f2f);
      border-radius: var(--radius-md, 8px);
      color: var(--color-text-primary, #1a1a1a);
      font-size: var(--text-sm, 14px);
    }
    .empty {
      padding: var(--sp-4, 16px);
      text-align: center;
      color: var(--color-text-secondary, #6b7280);
      font-size: var(--text-sm, 14px);
      border: 1px dashed var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
    }
    .btn-link {
      background: none;
      border: none;
      color: var(--color-primary, #1B5E99);
      cursor: pointer;
      text-decoration: underline;
      font-size: var(--text-sm, 14px);
      margin-left: auto;
    }
    .timeline {
      display: flex;
      flex-direction: column;
      gap: var(--sp-3, 12px);
    }
    .timeline-row {
      display: flex;
      gap: var(--sp-3, 12px);
      align-items: center;
      padding: var(--sp-3, 12px);
      background: var(--color-bg-soft, #f9fafb);
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--color-border, #e5e7eb);
    }
    .timeline-row.failed {
      background: var(--color-error-light, #ffebee);
      border-color: var(--color-error, #d32f2f);
    }
    .timeline-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      background: var(--color-primary-light, #e3edf7);
      flex-shrink: 0;
    }
    .timeline-icon.auto {
      background: var(--color-success-light, #e8f5e9);
    }
    .timeline-icon.failed {
      background: var(--color-error-light, #ffebee);
    }
    .timeline-body { flex: 1; min-width: 0; }
    .timeline-title {
      font-size: var(--text-sm, 14px);
      font-weight: 500;
      color: var(--color-text-primary, #1a1a1a);
    }
    .timeline-sub {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: 2px;
    }
    .timeline-amount {
      font-size: var(--text-md, 16px);
      font-weight: 600;
      color: var(--color-success, #2e7d32);
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--sp-3, 12px);
      margin-top: var(--sp-4, 16px);
      padding-top: var(--sp-3, 12px);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }
    .page-indicator {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
    }
    .btn {
      padding: 10px 20px;
      border-radius: var(--radius-md, 8px);
      border: none;
      font-size: var(--text-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      transition: background 200ms ease, opacity 200ms ease;
    }
    .btn-small { padding: 6px 14px; font-size: var(--text-xs, 12px); }
    .btn-secondary {
      background: var(--color-white, #fff);
      color: var(--color-text-primary, #1a1a1a);
      border: 1px solid var(--color-border, #e5e7eb);
    }
    .btn-secondary:hover:not(:disabled) { background: var(--color-bg-soft, #f3f4f6); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class ContributionHistoryComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) goalId!: string;

  items: Allocation[] = [];
  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;
  loading = true;
  errorMessage: string | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly savingsService: SavingsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPage(0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Si el padre cambia el goalId (poco probable en este flujo, pero defensivo),
    // resetear paginacion y recargar.
    if (changes['goalId'] && !changes['goalId'].firstChange) {
      this.page = 0;
      this.items = [];
      this.totalPages = 0;
      this.totalElements = 0;
      this.loadPage(0);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -------------------------------------------------------------------------
  // Acciones de paginacion
  // -------------------------------------------------------------------------

  reload(): void {
    this.loadPage(this.page);
  }

  prevPage(): void {
    if (this.page > 0 && !this.loading) this.loadPage(this.page - 1);
  }

  nextPage(): void {
    if (this.page < this.totalPages - 1 && !this.loading) this.loadPage(this.page + 1);
  }

  trackByAlloc(_: number, alloc: Allocation): string {
    return alloc.id;
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  iconFor(alloc: Allocation): string {
    if (alloc.status === 'FAILED') return '⚠️';
    return alloc.type === 'AUTO' ? '🔁' : '💸';
  }

  titleFor(alloc: Allocation): string {
    if (alloc.status === 'FAILED') return 'Aportación fallida';
    return alloc.type === 'AUTO' ? 'Aportación automática' : 'Aportación manual';
  }

  subtitleFor(alloc: Allocation): string {
    const parts: string[] = [];
    parts.push(this.formatDateTime(alloc.executedAt));
    parts.push('Cuenta principal');
    if (alloc.type === 'AUTO' && alloc.allocationMonth) {
      parts.push('Regla mensual ' + alloc.allocationMonth);
    }
    if (alloc.status === 'FAILED' && alloc.failureReason) {
      parts.push('Motivo: ' + alloc.failureReason);
    }
    return parts.join(' · ');
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value ?? 0);
  }

  formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '-';
      return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return '-';
    }
  }

  // -------------------------------------------------------------------------
  // Carga
  // -------------------------------------------------------------------------

  private loadPage(page: number): void {
    if (!this.goalId) return;
    this.loading = true;
    this.errorMessage = null;

    this.savingsService.contributionHistory(this.goalId, page, this.size).pipe(
      catchError((err: HttpErrorResponse) => {
        this.errorMessage = this.mapErrorToMessage(err);
        return of(null as unknown as Page<Allocation>);
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe(p => {
      if (!p) {
        // error: dejar items previos intactos para que reload no pise UX
        this.cdr.markForCheck();
        return;
      }
      this.items = p.content ?? [];
      this.page = p.number ?? 0;
      this.totalPages = p.totalPages ?? 0;
      this.totalElements = p.totalElements ?? 0;
      this.cdr.markForCheck();
    });
  }

  private mapErrorToMessage(err: HttpErrorResponse): string {
    const code: string | undefined = err.error?.error;
    const backendMsg: string | undefined = err.error?.message;
    if (err.status === 404 && code === 'GOAL_NOT_FOUND') {
      return 'La meta no existe o ha sido cerrada.';
    }
    if (err.status === 403 && code === 'GOAL_ACCESS_DENIED') {
      return 'No tienes acceso a esta meta.';
    }
    if (err.status === 401) return 'Tu sesion ha caducado.';
    if (err.status === 0)   return 'Sin conexion al servidor.';
    return backendMsg || 'No se pudieron cargar las aportaciones.';
  }
}
