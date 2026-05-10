import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

import { SavingsService } from '../../services/savings.service';
import { SavingsWidget, WidgetGoalSummary, GOAL_CATEGORY_ICON } from '../../models/savings.models';

/**
 * SavingsWidgetComponent - Dashboard widget 'Mis Metas' (US-024-08)
 *
 * Fase G.4 LOTE G.4.
 *
 * Patron heredado de PfmWidgetComponent (FEAT-023 Sprint 25):
 *   - Vive en savings/components/savings-widget pero se DECLARA en DashboardModule
 *     (NO en SavingsModule) para reutilizarlo desde el dashboard sin lazy load.
 *   - LA-023-01: navegacion via router.navigateByUrl('/objetivos').
 *   - RN-F023-15 equivalente para savings: carga asincrona con degradacion elegante.
 *     Si el endpoint falla o devuelve vacio, el widget se oculta o muestra CTA.
 *
 * UI:
 *   - header: titulo '🎯 Mis Metas' + link 'Ver detalle →'
 *   - KPI principal: globalProgressPct + 'X de Y €' (totalReserved / totalTarget)
 *   - lista top 3 metas: icon + name + mini progress bar + percent
 *   - empty state CTA si activeGoalsCount === 0 -> 'Crea tu primera meta'
 *   - loading / error states (degradacion elegante: oculto si error sin metas)
 *
 * Sin signals · OnPush + cdr.markForCheck · destroy$ + takeUntil
 *
 * Endpoint backend: GET /api/v1/savings/dashboard-widget (LLD-backend §11 · DTO SavingsWidget)
 *
 * FEAT-024 Sprint 26.
 */
@Component({
  selector: 'app-savings-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="savings-widget" [class.error]="hasError">
      <div class="widget-header">
        <span class="widget-title">🎯 Mis Metas</span>
        <button type="button" class="widget-link" (click)="navigate()">Ver detalle →</button>
      </div>

      <div *ngIf="loading" class="widget-loading" role="status" aria-live="polite">
        Cargando metas...
      </div>

      <div *ngIf="!loading && hasError" class="widget-error">
        <p class="widget-error-msg">No se pudieron cargar tus metas en este momento.</p>
        <button type="button" class="widget-cta-btn" (click)="navigate()">Ver Mis Metas</button>
      </div>

      <div *ngIf="!loading && !hasError && data && data.activeGoalsCount === 0" class="widget-empty">
        <p class="widget-empty-msg">Aún no tienes metas de ahorro.</p>
        <button type="button" class="widget-cta-btn" (click)="navigateNew()">Crea tu primera meta</button>
      </div>

      <div *ngIf="!loading && !hasError && data && data.activeGoalsCount > 0" class="widget-content">
        <div class="widget-kpi">
          <span class="kpi-label">Progreso global · {{ data.activeGoalsCount }} {{ data.activeGoalsCount === 1 ? 'meta' : 'metas' }} activas</span>
          <span class="kpi-value">{{ clampPct(data.globalProgressPct) }}%</span>
          <span class="kpi-sub">
            {{ formatCurrency(data.totalReserved) }} de {{ formatCurrency(data.totalTarget) }}
          </span>
        </div>

        <div class="global-bar" aria-hidden="true">
          <div class="global-bar-fill" [style.width.%]="clampPct(data.globalProgressPct)"></div>
        </div>

        <div class="top-goals" *ngIf="data.topGoals && data.topGoals.length > 0">
          <div class="top-goal"
               *ngFor="let g of data.topGoals; trackBy: trackByGoalId"
               (click)="navigateGoal(g.id)"
               [attr.role]="'link'"
               tabindex="0">
            <span class="goal-icon">{{ g.icon || '🎯' }}</span>
            <div class="goal-meta">
              <div class="goal-name">{{ g.name }}</div>
              <div class="goal-progress" aria-hidden="true">
                <div class="goal-progress-fill" [style.width.%]="clampPct(g.progressPct)"></div>
              </div>
            </div>
            <div class="goal-pct">{{ clampPct(g.progressPct) }}%</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .savings-widget {
      background: #fff;
      border-radius: 10px;
      padding: 1rem 1.2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.07);
      min-width: 200px;
    }
    .savings-widget.error { opacity: 0.85; }
    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: .8rem;
    }
    .widget-title {
      font-weight: 700;
      color: #1e3a5f;
    }
    .widget-link {
      background: none;
      border: none;
      color: #2e86ab;
      cursor: pointer;
      font-size: .85rem;
    }
    .widget-link:hover { text-decoration: underline; }

    .widget-loading {
      color: #aaa;
      font-size: .85rem;
      text-align: center;
      padding: .5rem;
    }
    .widget-error,
    .widget-empty {
      text-align: center;
      padding: .5rem 0;
    }
    .widget-error-msg,
    .widget-empty-msg {
      color: #888;
      font-size: .85rem;
      margin: 0 0 .6rem 0;
    }
    .widget-cta-btn {
      width: 100%;
      padding: .5rem;
      background: #009688;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: .85rem;
      transition: background 200ms ease;
    }
    .widget-cta-btn:hover { background: #00796B; }

    .widget-kpi {
      display: flex;
      flex-direction: column;
      gap: .15rem;
      margin-bottom: .6rem;
    }
    .kpi-label {
      font-size: .75rem;
      color: #888;
    }
    .kpi-value {
      font-size: 1.4rem;
      font-weight: 700;
      color: #1e3a5f;
      font-variant-numeric: tabular-nums;
    }
    .kpi-sub {
      font-size: .75rem;
      color: #666;
      font-variant-numeric: tabular-nums;
    }

    .global-bar {
      width: 100%;
      height: 8px;
      background: #f3f4f6;
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: .8rem;
    }
    .global-bar-fill {
      height: 100%;
      background: #009688;
      transition: width 300ms ease;
    }

    .top-goals {
      display: flex;
      flex-direction: column;
      gap: .55rem;
      margin-top: .4rem;
    }
    .top-goal {
      display: flex;
      align-items: center;
      gap: .6rem;
      padding: .35rem 0;
      cursor: pointer;
      border-radius: 6px;
      transition: background 150ms ease;
    }
    .top-goal:hover,
    .top-goal:focus {
      background: #f9fafb;
      outline: none;
    }
    .goal-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      background: #e0f2f1;
      flex-shrink: 0;
    }
    .goal-meta {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: .15rem;
    }
    .goal-name {
      font-size: .82rem;
      color: #1e3a5f;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .goal-progress {
      width: 100%;
      height: 4px;
      background: #f3f4f6;
      border-radius: 999px;
      overflow: hidden;
    }
    .goal-progress-fill {
      height: 100%;
      background: #009688;
      transition: width 300ms ease;
    }
    .goal-pct {
      font-size: .8rem;
      font-weight: 600;
      color: #009688;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
      min-width: 36px;
      text-align: right;
    }
  `]
})
export class SavingsWidgetComponent implements OnInit, OnDestroy {
  data: SavingsWidget | null = null;
  loading = true;
  hasError = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly savingsService: SavingsService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadWidget();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWidget(): void {
    this.loading = true;
    this.hasError = false;
    this.savingsService.getWidget().pipe(
      catchError((_err: HttpErrorResponse) => {
        this.hasError = true;
        return of(null as unknown as SavingsWidget);
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe(w => {
      if (w) {
        this.data = w;
      }
      this.cdr.markForCheck();
    });
  }

  // -------------------------------------------------------------------------
  // Helpers UI
  // -------------------------------------------------------------------------

  navigate(): void {
    // LA-023-01: navegacion a feature lazy via router.navigateByUrl
    this.router.navigateByUrl('/objetivos');
  }

  navigateNew(): void {
    this.router.navigateByUrl('/objetivos/nuevo');
  }

  navigateGoal(id: string): void {
    if (!id) return;
    this.router.navigate(['/objetivos', id]);
  }

  trackByGoalId(_: number, goal: WidgetGoalSummary): string {
    return goal.id;
  }

  clampPct(value: number | null | undefined): number {
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return Math.round(Math.max(0, Math.min(100, value)));
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value ?? 0);
  }

  // GOAL_CATEGORY_ICON expuesto si fuera necesario fallback (el backend ya envia icon en WidgetGoalSummary)
  readonly GOAL_CATEGORY_ICON = GOAL_CATEGORY_ICON;
}
