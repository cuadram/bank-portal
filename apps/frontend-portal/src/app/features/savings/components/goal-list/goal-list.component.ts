import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { SavingsService } from '../../services/savings.service';
import { SavingsGoal } from '../../models/savings.models';

/**
 * GoalListComponent - Smart pantalla 'Mis Metas' (US-024-02)
 *
 * Fase G.2 LOTE 2.1.
 *
 * Pixel-perfect contra prototipo PROTO-FEAT-024-sprint26.html lineas 1190-1322
 * (screen-savings-list). LA-CORE-056 BLOQUEANTE en G-4.
 *
 * Estructura observada en prototipo y replicada en template:
 *   - page-head: h1 'Mis Metas' + subtitle agregada (count + reservedTotal) + boton primary 'Nueva meta'
 *   - goals-grid: render de <app-goal-card> por cada meta (G.1 LOTE 3)
 *   - alert-info Ley 10/2014 (footer informativo inline · no es componente reutilizable)
 *   - empty-state: <app-savings-empty-state> si lista vacia (G.1 LOTE 2)
 *
 * Sin filtro UI por status: prototipo verificado (lineas 1220-1228) no expone selector.
 * Llamada unica SavingsService.listGoals('ACTIVE') en ngOnInit. Si en sprints futuros
 * se anaden tabs/filtros, se incorporaran con BehaviorSubject + switchMap.
 *
 * Sin signals: patron clasico OnInit + Observable async pipe (decision PO chat anterior · drift Code Reviewer).
 * OnPush + trackBy para performance (LLD seccion 10).
 *
 * Navegacion: NUNCA [href] (LA-CORE-068). Card click via (clicked) emitido por
 * GoalCard -> router.navigate(['/objetivos', goal.id]).
 *
 * FEAT-024 Sprint 26.
 */
@Component({
  selector: 'app-goal-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="goal-list">
      <header class="page-head">
        <div class="page-head-text">
          <h1 class="page-title">Mis Metas</h1>
          <p class="page-subtitle" *ngIf="!loading && goals.length > 0">
            Ahorra con propósito ·
            {{ goals.length }} {{ goals.length === 1 ? 'meta activa' : 'metas activas' }} ·
            {{ formattedReservedTotal }} reservados
          </p>
          <p class="page-subtitle" *ngIf="!loading && goals.length === 0">
            Ahorra con propósito · sin metas activas
          </p>
          <p class="page-subtitle" *ngIf="loading">Cargando metas...</p>
        </div>
        <button type="button"
                class="btn btn-primary"
                (click)="onCreateClick()"
                [disabled]="loading"
                aria-label="Crear nueva meta de ahorro">
          + Nueva meta
        </button>
      </header>

      <ng-container *ngIf="!loading">
        <div class="goals-grid" *ngIf="goals.length > 0; else emptyTpl">
          <app-goal-card
            *ngFor="let goal of goals; trackBy: trackByGoalId"
            [goal]="goal"
            (clicked)="onGoalClick($event)"></app-goal-card>
        </div>

        <ng-template #emptyTpl>
          <app-savings-empty-state (createClicked)="onCreateClick()"></app-savings-empty-state>
        </ng-template>

        <aside class="alert-info" *ngIf="goals.length > 0" role="note">
          <span class="alert-icon" aria-hidden="true">ℹ️</span>
          <span class="alert-text">
            Tu dinero reservado en metas se mantiene en tu cuenta de ahorro.
            No pierdes disponibilidad y no devenga intereses adicionales.
          </span>
        </aside>
      </ng-container>

      <div class="error-banner" *ngIf="errorMessage" role="alert">
        <span aria-hidden="true">⚠️</span>
        <span>{{ errorMessage }}</span>
        <button type="button" class="btn-link" (click)="reload()">Reintentar</button>
      </div>
    </section>
  `,
  styles: [`
    .goal-list {
      display: block;
      padding: var(--sp-6, 24px);
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sp-6, 24px);
      gap: var(--sp-4, 16px);
      flex-wrap: wrap;
    }
    .page-head-text { flex: 1; min-width: 0; }
    .page-title {
      font-size: var(--text-2xl, 24px);
      color: var(--color-text-primary, #1a1a1a);
      margin: 0;
      font-weight: 600;
    }
    .page-subtitle {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
      margin: 4px 0 0 0;
    }
    .btn {
      padding: 10px 20px;
      border-radius: var(--radius-md, 8px);
      border: none;
      font-size: var(--text-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      transition: background 200ms ease, opacity 200ms ease;
      flex-shrink: 0;
    }
    .btn-primary {
      background: var(--color-primary, #1B5E99);
      color: var(--color-white, #fff);
    }
    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #154872);
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .goals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--sp-4, 16px);
      margin-bottom: var(--sp-6, 24px);
    }
    .alert-info {
      display: flex;
      gap: var(--sp-3, 12px);
      align-items: flex-start;
      padding: var(--sp-4, 16px);
      background: var(--color-info-light, #e3f2fd);
      border-left: 4px solid var(--color-info, #1976d2);
      border-radius: var(--radius-md, 8px);
      margin-top: var(--sp-6, 24px);
    }
    .alert-icon { flex-shrink: 0; font-size: var(--text-lg, 18px); }
    .alert-text {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-primary, #1a1a1a);
      line-height: 1.5;
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
      margin-top: var(--sp-4, 16px);
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
    @media (max-width: 600px) {
      .goal-list { padding: var(--sp-4, 16px); }
      .page-head { flex-direction: column; align-items: stretch; }
      .btn-primary { width: 100%; }
    }
  `]
})
export class GoalListComponent implements OnInit {
  goals: SavingsGoal[] = [];
  loading = true;
  errorMessage: string | null = null;

  constructor(
    private readonly savingsService: SavingsService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadGoals();
  }

  /**
   * Carga inicial / recarga: GET /api/v1/savings/goals?status=ACTIVE.
   * No usa forkJoin - llamada simple. catchError con throwError invalido aqui;
   * usamos catchError + of([]) + bandera errorMessage para soporte 'Reintentar'.
   * GR-007 cumplida (catchError con valor por defecto explicito + signaling).
   */
  reload(): void {
    this.loadGoals();
  }

  private loadGoals(): void {
    this.loading = true;
    this.errorMessage = null;
    this.savingsService.listGoals('ACTIVE').pipe(
      catchError(err => {
        this.errorMessage = 'No se pudieron cargar tus metas. Reintenta mas tarde.';
        return of([] as SavingsGoal[]);
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck(); // OnPush requiere CD manual tras mutacion imperativa
      })
    ).subscribe(list => {
      this.goals = list ?? [];
      this.cdr.markForCheck();
    });
  }

  trackByGoalId(_: number, goal: SavingsGoal): string {
    return goal.id;
  }

  /**
   * Click en card -> detalle. NUNCA [href] (LA-CORE-068).
   * router.navigate con id dinamico en path.
   */
  onGoalClick(goal: SavingsGoal): void {
    if (!goal?.id) return;
    this.router.navigate(['/objetivos', goal.id]);
  }

  onCreateClick(): void {
    this.router.navigate(['/objetivos', 'nuevo']);
  }

  /**
   * Total reservado agregado client-side desde la lista.
   * El prototipo (linea 1224) muestra '1.500€ reservados' calculado asi.
   * Math.abs NO necesario aqui: reservedAmount es positivo por DDL CHECK >= 0
   * (LA-CORE-055 reverso: aplica solo a movimientos derivados de cuentas, no a savings).
   */
  get reservedTotal(): number {
    return this.goals.reduce((acc, g) => acc + (g?.reservedAmount ?? 0), 0);
  }

  get formattedReservedTotal(): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this.reservedTotal);
  }
}
