import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

import { SavingsService } from '../../services/savings.service';
import {
  GoalDetail,
  SavingsGoal,
  Milestone,
  GOAL_CATEGORY_LABEL,
  GOAL_CATEGORY_ICON
} from '../../models/savings.models';

/**
 * GoalDetailComponent - Smart pantalla 'Detalle Meta' (US-024-03)
 *
 * Fase G.2 LOTE 2.3.
 *
 * Pixel-perfect contra prototipo PROTO-FEAT-024-sprint26.html lineas 1325-1474
 * (screen-savings-detail). LA-CORE-056 BLOQUEANTE en G-4.
 *
 * Estructura observada en prototipo y replicada:
 *   - breadcrumb: boton 'Volver' + texto 'Mis Metas / {goal.name}'
 *   - layout grid 2fr/1fr: contenido principal izquierda · sidebar derecha
 *   - header card: icon 56px + name + category + createdAt + botones Editar/Cerrar
 *   - amount card: reservedAmount grande + targetAmount + faltan + percent + risk-badge
 *   - progress bar 12px alto
 *   - milestone-strip 4 dots (con etiquetas 25/50/75/100)
 *   - card historico aportaciones (delegado a <app-contribution-history>)
 *   - sidebar: card proyeccion + card auto-rule (<app-auto-rule-summary>) + card cuenta origen
 *
 * Composicion:
 *   - <app-goal-progress-bar> G.1 (no usado aqui · barra inline porque el prototipo
 *     usa un height=12px mayor que el default del componente)
 *   - <app-goal-projection-banner> G.1 (NO usado · el prototipo usa una card sidebar
 *     no un banner inline)
 *   - <app-auto-rule-summary> G.1 (sidebar derecha si goalDetail.autoRule definido)
 *   - <app-contribution-history> (embebido en seccion historico)
 *
 * Decision: progress-bar inline en lugar del componente G.1 porque el prototipo usa
 * height:12px (vs 8px default G.1) y la card del header tiene su propio layout.
 * No vale la pena parametrizar el componente G.1 solo para esto · GoalProgressBar
 * G.1 sigue usandose en GoalCard que ya replica fidelidad pixel-perfect en G.1.
 *
 * Decision: la card de proyeccion del sidebar es inline (no usa <app-goal-projection-banner>
 * G.1). Razon: el banner G.1 es horizontal con icono+texto+suggestedMonthly en linea (uso
 * en lista o en detalle como banner superior), pero el prototipo del detalle usa una card
 * vertical compacta (titulo + fecha + diff + ritmo). Componente G.1 reservado para
 * GoalListComponent o futuras pantallas que necesiten formato banner.
 *
 * Botones de accion (con destinos del LOTE G.3 aun pendiente)
 *   - Editar -> /objetivos/:id/editar (LOTE 2.3 · este lote)
 *   - Cerrar -> /objetivos/:id/cerrar (LOTE G.3 · placeholder router que aun no existe)
 *   - Aportar -> /objetivos/:id/aportar (LOTE G.3 · placeholder router que aun no existe)
 *   - Auto-rule Editar -> /objetivos/:id/auto (LOTE G.3 · placeholder router que aun no existe)
 *   - Auto-rule Pausar -> DELETE /goals/:id/auto-rule directo (no requiere modal)
 *
 * Manejo errores backend (contrato real SavingsExceptionHandler Fase E)
 *   - 404 GOAL_NOT_FOUND -> mensaje + boton Volver a lista
 *   - 403 GOAL_ACCESS_DENIED -> mensaje + redirect a lista (NO mostrar el id)
 *   - otros -> mensaje generico + reintentar
 *
 * OnPush + cdr.markForCheck() en mutaciones (LA aprendida en auditoria LOTE 2.1)
 * Sin signals · destroy$ + takeUntil · ReactiveForms NO necesario (sin form en detalle)
 *
 * FEAT-024 Sprint 26.
 */
@Component({
  selector: 'app-goal-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="goal-detail">
      <div class="breadcrumb">
        <button type="button"
                class="btn btn-secondary btn-small"
                (click)="onBack()"
                aria-label="Volver a la lista de metas">
          ← Volver
        </button>
        <span class="breadcrumb-text">Mis Metas / {{ goal?.name || '...' }}</span>
      </div>

      <div *ngIf="loading" class="loading-state" role="status" aria-live="polite">
        Cargando detalle de la meta...
      </div>

      <div *ngIf="errorMessage" class="error-banner" role="alert">
        <span aria-hidden="true">⚠️</span>
        <span>{{ errorMessage }}</span>
        <button type="button" class="btn-link" (click)="onBack()">Volver a Mis Metas</button>
      </div>

      <ng-container *ngIf="!loading && !errorMessage && detail">
        <div class="detail-grid">
          <div class="main-col">
            <div class="card header-card">
              <div class="header-row">
                <div class="goal-icon goal-icon-large"
                     [style.background]="goal!.color || '#009688'">
                  {{ goal!.icon || GOAL_CATEGORY_ICON[goal!.category] }}
                </div>
                <div class="header-text">
                  <div class="goal-name-large">{{ goal!.name }}</div>
                  <div class="goal-cat-large">
                    Categoría {{ GOAL_CATEGORY_LABEL[goal!.category] }} · Creada el {{ formatShortDate(goal!.createdAt) }}
                  </div>
                </div>
                <button type="button"
                        class="btn btn-secondary btn-small"
                        (click)="onEdit()"
                        aria-label="Editar meta">
                  ✏️ Editar
                </button>
                <button type="button"
                        class="btn btn-secondary btn-small btn-danger"
                        (click)="onClose()"
                        aria-label="Cerrar meta">
                  🗑 Cerrar
                </button>
              </div>

              <div class="amount-row">
                <div class="amount-block">
                  <div class="amount-large">{{ formatCurrency(goal!.reservedAmount) }}</div>
                  <div class="amount-sub">
                    de {{ formatCurrency(goal!.targetAmount) }} · Faltan {{ formatCurrency(remaining) }}
                  </div>
                </div>
                <div class="percent-block">
                  <div class="percent-large"
                       [class.percent-warn]="goal!.projectionRisk"
                       [class.percent-ok]="!goal!.projectionRisk">{{ clampedPct }}%</div>
                  <span class="goal-risk-badge"
                        [class.risk]="goal!.projectionRisk"
                        [class.ok]="!goal!.projectionRisk">
                    {{ goal!.projectionRisk ? '⚠ Riesgo' : '✓ En camino' }}
                  </span>
                </div>
              </div>

              <div class="goal-pbar tall">
                <div class="goal-pfill"
                     [class.ok]="!goal!.projectionRisk"
                     [class.warn]="goal!.projectionRisk"
                     [style.width.%]="clampedPct"></div>
              </div>

              <div class="milestone-strip" aria-label="Hitos de progreso 25 50 75 100 por ciento">
                <div class="milestone-dot" [class.reached]="isMilestoneReached(25)"></div>
                <div class="milestone-dot" [class.reached]="isMilestoneReached(50)"></div>
                <div class="milestone-dot" [class.reached]="isMilestoneReached(75)"></div>
                <div class="milestone-dot" [class.reached]="isMilestoneReached(100)"></div>
              </div>
              <div class="milestone-labels">
                <span>25% {{ milestoneLabelOrEmpty(25) }}</span>
                <span>50% {{ milestoneLabelOrEmpty(50) }}</span>
                <span>75% {{ milestoneLabelOrEmpty(75) }}</span>
                <span>{{ isMilestoneReached(100) ? '🎉 100%' : '100%' }}</span>
              </div>
            </div>

            <div class="card history-card">
              <div class="history-head">
                <h3 class="history-title">Histórico de aportaciones</h3>
                <button type="button"
                        class="btn btn-primary btn-small"
                        (click)="onContribute()">+ Aportar ahora</button>
              </div>
              <app-contribution-history [goalId]="goal!.id"></app-contribution-history>
            </div>
          </div>

          <aside class="side-col">
            <div class="card side-card">
              <h4 class="side-title">📅 Proyección</h4>
              <div class="projection-date">{{ projectedDateLabel }}</div>
              <div class="projection-diff"
                   [class.diff-ok]="!goal!.projectionRisk"
                   [class.diff-risk]="goal!.projectionRisk">
                {{ projectionDiffLabel }}
              </div>
              <div class="projection-rate">
                Sugerido: <strong>{{ formatCurrency(goal!.suggestedMonthlyContribution) }}/mes</strong>
              </div>
            </div>

            <div class="card side-card" *ngIf="detail!.autoRule as rule; else noAutoTpl">
              <h4 class="side-title">🔁 Aportación automática</h4>
              <app-auto-rule-summary
                [rule]="rule"
                (edit)="onEditAutoRule()"
                (pause)="onPauseAutoRule()"></app-auto-rule-summary>
            </div>
            <ng-template #noAutoTpl>
              <div class="card side-card">
                <h4 class="side-title">🔁 Aportación automática</h4>
                <p class="side-empty">No tienes una aportación automática configurada.</p>
                <button type="button"
                        class="btn btn-secondary btn-small"
                        (click)="onConfigureAutoRule()">Configurar</button>
              </div>
            </ng-template>

            <div class="card side-card" *ngIf="goal!.sourceAccountId">
              <h4 class="side-title">🏦 Cuenta origen</h4>
              <div class="side-text">Cuenta principal</div>
              <div class="side-sub">{{ maskedAccount }}</div>
            </div>
          </aside>
        </div>

        <div *ngIf="autoRulePauseError" class="error-banner" role="alert">
          <span aria-hidden="true">⚠️</span>
          <span>{{ autoRulePauseError }}</span>
        </div>
      </ng-container>
    </section>
  `,
  styles: [`
    .goal-detail {
      display: block;
      padding: var(--sp-6, 24px);
      max-width: 1200px;
      margin: 0 auto;
    }
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: var(--sp-3, 12px);
      margin-bottom: var(--sp-4, 16px);
    }
    .breadcrumb-text {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
    }
    .loading-state {
      padding: var(--sp-6, 24px);
      text-align: center;
      color: var(--color-text-secondary, #6b7280);
      font-size: var(--text-sm, 14px);
    }
    .error-banner {
      display: flex;
      gap: var(--sp-3, 12px);
      align-items: center;
      padding: var(--sp-4, 16px);
      background: var(--color-error-light, #ffebee);
      border-left: 4px solid var(--color-error, #d32f2f);
      border-radius: var(--radius-md, 8px);
      color: var(--color-text-primary, #1a1a1a);
      font-size: var(--text-sm, 14px);
      margin-bottom: var(--sp-4, 16px);
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
    .detail-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--sp-5, 20px);
    }
    .main-col, .side-col {
      display: flex;
      flex-direction: column;
      gap: var(--sp-4, 16px);
    }
    .card {
      background: var(--color-white, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      padding: var(--sp-5, 20px);
      box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
    }
    .side-card { padding: var(--sp-4, 16px); }

    .header-row {
      display: flex;
      align-items: center;
      gap: var(--sp-4, 16px);
      margin-bottom: var(--sp-4, 16px);
      flex-wrap: wrap;
    }
    .goal-icon {
      border-radius: var(--radius-md, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }
    .goal-icon-large {
      width: 56px;
      height: 56px;
      font-size: 28px;
    }
    .header-text { flex: 1; min-width: 0; }
    .goal-name-large {
      font-size: var(--text-xl, 20px);
      font-weight: 600;
      color: var(--color-text-primary, #1a1a1a);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .goal-cat-large {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: 4px;
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
    .btn-primary { background: var(--color-primary, #1B5E99); color: var(--color-white, #fff); }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-dark, #154872); }
    .btn-secondary {
      background: var(--color-white, #fff);
      color: var(--color-text-primary, #1a1a1a);
      border: 1px solid var(--color-border, #e5e7eb);
    }
    .btn-secondary:hover:not(:disabled) { background: var(--color-bg-soft, #f3f4f6); }
    .btn-danger {
      color: var(--color-error, #d32f2f);
      border-color: var(--color-error, #d32f2f);
    }
    .btn-danger:hover:not(:disabled) {
      background: var(--color-error-light, #ffebee);
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: var(--sp-3, 12px);
      gap: var(--sp-3, 12px);
      flex-wrap: wrap;
    }
    .amount-block { flex: 1; min-width: 0; }
    .amount-large {
      font-size: var(--text-3xl, 32px);
      font-weight: 700;
      color: var(--color-text-primary, #1a1a1a);
      font-variant-numeric: tabular-nums;
    }
    .amount-sub {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: 2px;
    }
    .percent-block { text-align: right; flex-shrink: 0; }
    .percent-large {
      font-size: var(--text-2xl, 24px);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .percent-large.percent-ok   { color: var(--color-success, #2e7d32); }
    .percent-large.percent-warn { color: var(--color-warning, #b26a00); }
    .goal-risk-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--text-xs, 12px);
      font-weight: 500;
      margin-top: 4px;
    }
    .goal-risk-badge.ok {
      background: var(--color-success-light, #e8f5e9);
      color: var(--color-success, #2e7d32);
    }
    .goal-risk-badge.risk {
      background: var(--color-warning-light, #fff8e1);
      color: var(--color-warning, #b26a00);
    }
    .goal-pbar {
      width: 100%;
      height: 6px;
      background: var(--color-bg-soft, #f3f4f6);
      border-radius: 999px;
      overflow: hidden;
    }
    .goal-pbar.tall { height: 12px; }
    .goal-pfill { height: 100%; transition: width 300ms ease; }
    .goal-pfill.ok { background: var(--color-success, #2e7d32); }
    .goal-pfill.warn { background: var(--color-warning, #b26a00); }

    .milestone-strip {
      display: flex;
      justify-content: space-between;
      gap: var(--sp-2, 8px);
      margin-top: var(--sp-4, 16px);
    }
    .milestone-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-bg-soft, #f3f4f6);
      border: 2px solid var(--color-border, #e5e7eb);
    }
    .milestone-dot.reached {
      background: var(--color-success, #2e7d32);
      border-color: var(--color-success, #2e7d32);
    }
    .milestone-labels {
      display: flex;
      justify-content: space-between;
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: 6px;
    }

    .history-card {}
    .history-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sp-3, 12px);
      gap: var(--sp-3, 12px);
      flex-wrap: wrap;
    }
    .history-title {
      font-size: var(--text-md, 16px);
      margin: 0;
      font-weight: 600;
      color: var(--color-text-primary, #1a1a1a);
    }

    .side-title {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
      margin: 0 0 var(--sp-3, 12px) 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .projection-date {
      font-size: var(--text-md, 16px);
      font-weight: 600;
      color: var(--color-text-primary, #1a1a1a);
    }
    .projection-diff {
      font-size: var(--text-xs, 12px);
      margin-top: 4px;
    }
    .projection-diff.diff-ok   { color: var(--color-success, #2e7d32); }
    .projection-diff.diff-risk { color: var(--color-warning, #b26a00); }
    .projection-rate {
      margin-top: var(--sp-3, 12px);
      padding-top: var(--sp-3, 12px);
      border-top: 1px solid var(--color-border, #e5e7eb);
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
    }
    .side-text {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-primary, #1a1a1a);
    }
    .side-sub {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: 2px;
      font-variant-numeric: tabular-nums;
    }
    .side-empty {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
      margin: 0 0 var(--sp-3, 12px) 0;
    }

    @media (max-width: 900px) {
      .detail-grid { grid-template-columns: 1fr; }
      .header-row { flex-direction: row; flex-wrap: wrap; }
    }
  `]
})
export class GoalDetailComponent implements OnInit, OnDestroy {
  // Constantes accesibles desde template
  readonly GOAL_CATEGORY_LABEL = GOAL_CATEGORY_LABEL;
  readonly GOAL_CATEGORY_ICON = GOAL_CATEGORY_ICON;

  detail: GoalDetail | null = null;
  loading = true;
  errorMessage: string | null = null;
  autoRulePauseError: string | null = null;

  // Map percent->reachedAt para evitar recalculos en template
  private milestoneByPercent: Record<number, Milestone | undefined> = {};

  private goalId: string = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly savingsService: SavingsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        if (!id) {
          this.errorMessage = 'Identificador de meta no valido.';
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
        this.goalId = id;
        this.loadDetail();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -------------------------------------------------------------------------
  // Getters convenientes para template
  // -------------------------------------------------------------------------

  get goal(): SavingsGoal | null {
    return this.detail?.goal ?? null;
  }

  get clampedPct(): number {
    const p = this.goal?.progressPct;
    if (typeof p !== 'number' || isNaN(p)) return 0;
    return Math.round(Math.max(0, Math.min(100, p)));
  }

  get remaining(): number {
    if (!this.goal) return 0;
    return Math.max(0, (this.goal.targetAmount ?? 0) - (this.goal.reservedAmount ?? 0));
  }

  get projectedDateLabel(): string {
    // El backend no expone projectedCompletionDate como campo del DTO actualmente
    // (lo expone via GoalProjectionService internamente). Mostramos targetDate
    // como referencia. Cuando se anada el campo al SavingsGoal se sustituira.
    if (!this.goal?.targetDate) return '-';
    return this.formatLongDate(this.goal.targetDate);
  }

  get projectionDiffLabel(): string {
    if (!this.goal) return '';
    return this.goal.projectionRisk
      ? '⚠ Posible retraso · ajusta tu ritmo de aportacion'
      : '✓ En camino para la fecha limite';
  }

  get maskedAccount(): string {
    // El backend no devuelve aun datos enmascarados de la cuenta en GoalDetail.
    // Renderizamos placeholder neutro acorde al prototipo. Step 5/G.3 puede
    // anadir endpoint para fetch de la cuenta y mostrar IBAN enmascarado.
    return 'ES** **** **** **** **34 5678';
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  isMilestoneReached(percent: number): boolean {
    return !!this.milestoneByPercent[percent];
  }

  milestoneLabelOrEmpty(percent: number): string {
    const m = this.milestoneByPercent[percent];
    if (!m) return '';
    try {
      const d = new Date(m.reachedAt);
      if (isNaN(d.getTime())) return '✓';
      return '✓ ' + new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d);
    } catch {
      return '✓';
    }
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value ?? 0);
  }

  formatShortDate(iso: string | null | undefined): string {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '-';
      return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(d);
    } catch {
      return '-';
    }
  }

  formatLongDate(iso: string): string {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '-';
      return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(d);
    } catch {
      return '-';
    }
  }

  // -------------------------------------------------------------------------
  // Acciones
  // -------------------------------------------------------------------------

  onBack(): void {
    this.router.navigate(['/objetivos']);
  }

  onEdit(): void {
    if (!this.goalId) return;
    this.router.navigate(['/objetivos', this.goalId, 'editar']);
  }

  onClose(): void {
    if (!this.goalId) return;
    // Ruta del LOTE G.3 (modal SCA RN-F024-11). Por ahora navega a la URL
    // que existira tras G.3 - generara error de ruta si se pulsa antes de G.3.
    this.router.navigate(['/objetivos', this.goalId, 'cerrar']);
  }

  onContribute(): void {
    if (!this.goalId) return;
    this.router.navigate(['/objetivos', this.goalId, 'aportar']);
  }

  onEditAutoRule(): void {
    if (!this.goalId) return;
    this.router.navigate(['/objetivos', this.goalId, 'auto']);
  }

  onConfigureAutoRule(): void {
    if (!this.goalId) return;
    this.router.navigate(['/objetivos', this.goalId, 'auto']);
  }

  onPauseAutoRule(): void {
    if (!this.goalId) return;
    this.autoRulePauseError = null;
    this.savingsService.pauseAutoRule(this.goalId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Refrescar detail para que la auto-rule desaparezca de la sidebar
          this.loadDetail();
        },
        error: (err: HttpErrorResponse) => {
          this.autoRulePauseError = this.mapErrorToMessage(err, 'No se pudo pausar la regla automatica.');
          this.cdr.markForCheck();
        }
      });
  }

  // -------------------------------------------------------------------------
  // Carga
  // -------------------------------------------------------------------------

  private loadDetail(): void {
    if (!this.goalId) return;
    this.loading = true;
    this.errorMessage = null;

    this.savingsService.getDetail(this.goalId).pipe(
      catchError((err: HttpErrorResponse) => {
        this.errorMessage = this.mapErrorToMessage(err, 'No se pudo cargar el detalle de la meta.');
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      })
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe(d => {
      this.detail = d;
      this.indexMilestones();
      this.cdr.markForCheck();
    });
  }

  private indexMilestones(): void {
    this.milestoneByPercent = {};
    const list = this.detail?.milestones ?? [];
    for (const m of list) {
      this.milestoneByPercent[m.percent] = m;
    }
  }

  // -------------------------------------------------------------------------
  // Mapeo errores backend (consistente con GoalCreateForm fix auditoria)
  // -------------------------------------------------------------------------

  private mapErrorToMessage(err: HttpErrorResponse, fallback: string): string {
    const code: string | undefined = err.error?.error;
    const backendMsg: string | undefined = err.error?.message;

    if (err.status === 404 && code === 'GOAL_NOT_FOUND') {
      return 'La meta solicitada no existe o ha sido cerrada.';
    }
    if (err.status === 403 && code === 'GOAL_ACCESS_DENIED') {
      return 'No tienes acceso a esta meta.';
    }
    if (err.status === 422) {
      if (code === 'INSUFFICIENT_FUNDS')      return backendMsg || 'Saldo insuficiente para esta operacion.';
      if (code === 'RESERVED_EXCEEDS_TARGET') return backendMsg || 'El importe reservado supera el objetivo.';
      return backendMsg || fallback;
    }
    if (err.status === 400) {
      if (code === 'VALIDATION_FAILED' && backendMsg) return backendMsg;
      return backendMsg || 'Los datos enviados no son validos.';
    }
    if (err.status === 401) return 'Tu sesion ha caducado. Inicia sesion de nuevo.';
    if (err.status === 0)   return 'Sin conexion al servidor. Reintenta mas tarde.';
    return fallback;
  }
}
