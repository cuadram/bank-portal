import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { SavingsService } from '../../services/savings.service';
import { AutoRuleRequest, AutoRule, GoalDetail, SavingsGoal } from '../../models/savings.models';

/**
 * AutoRuleFormComponent - Smart pantalla 'Configurar regla automatica' (US-024-05)
 *
 * Fase G.3 LOTE G.3.
 *
 * Pixel-perfect contra prototipo PROTO-FEAT-024-sprint26.html lineas 1713-1830
 * (screen-savings-autorule). LA-CORE-056 BLOQUEANTE en G-4.
 *
 * Ruta: /objetivos/:id/auto (anadida en savings-routing.module en G.3)
 *
 * Estructura observada en prototipo y replicada:
 *   - breadcrumb: boton 'Volver' (al detalle) + texto 'Mis Metas / {goal.name} / Aportacion automatica'
 *   - layout grid 2fr/1fr: form izquierda · summary-box proximas ejecuciones derecha
 *   - input importe mensual [10..5000] + select dia [1,5,10,15,20,25,28] + select cuenta
 *   - alert-info 'Saldo insuficiente FAILED+notif sin bloquear ciclo' (RN-F024-04)
 *   - alert-warning 'Reintentos automaticos 1m/5m/15m'
 *   - footer: Pausar regla (DELETE) + Cancelar + Guardar regla (PUT)
 *   - summary-box: proximas 3 ejecuciones calculadas client-side desde dayOfMonth
 *
 * Validaciones cliente (RN-F024-13):
 *   - amount: required, 10..5000
 *   - dayOfMonth: required, 1..28 (RN-F024-13: evita meses cortos)
 *   - sourceAccountId: required
 *
 * Carga inicial: GET /goals/:id (incluye autoRule? si existe). Si la meta ya tiene
 * regla, prefill con sus datos. Si no, defaults: amount=100, dayOfMonth=5,
 * sourceAccountId=goal.sourceAccountId.
 *
 * Manejo errores backend:
 *   - 404 GOAL_NOT_FOUND -> redirect a lista
 *   - 403 GOAL_ACCESS_DENIED -> redirect a lista
 *   - 400 VALIDATION_FAILED -> mensaje del backend
 *   - 422 INSUFFICIENT_FUNDS -> contextual (raro en config, pero defensivo)
 *
 * OnPush + cdr.markForCheck en mutaciones
 * Sin signals · ReactiveForms · destroy$ + takeUntil
 *
 * FEAT-024 Sprint 26.
 */
interface UpcomingExecution { label: string; }

const DAY_OPTIONS: ReadonlyArray<number> = [1, 5, 10, 15, 20, 25, 28];

@Component({
  selector: 'app-auto-rule-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="autorule">
      <div class="breadcrumb">
        <button type="button"
                class="btn btn-secondary btn-small"
                (click)="onCancel()"
                [disabled]="submitting"
                aria-label="Volver al detalle de la meta">
          ← Volver
        </button>
        <span class="breadcrumb-text">
          Mis Metas / {{ goal?.name || '...' }} / Aportación automática
        </span>
      </div>

      <div *ngIf="loading" class="loading" role="status" aria-live="polite">
        Cargando configuración...
      </div>

      <div *ngIf="loadError" class="error-banner" role="alert">
        <span aria-hidden="true">⚠️</span>
        <span>{{ loadError }}</span>
        <button type="button" class="btn-link" (click)="onCancel()">Volver</button>
      </div>

      <div class="autorule-grid" *ngIf="!loading && !loadError && goal">
        <form class="form-card" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <h2 class="form-title">Aportación automática mensual</h2>
          <p class="form-subtitle">Ahorra sin esfuerzo. Configurable, pausable o eliminable cuando quieras.</p>

          <div class="input-grid">
            <div class="field">
              <label class="form-label" for="auto-amount">Importe mensual *</label>
              <input id="auto-amount"
                     class="form-input amount"
                     type="number"
                     formControlName="amount"
                     min="10"
                     max="5000"
                     step="10"
                     autocomplete="off">
              <div class="hint">Entre 10€ y 5.000€</div>
              <div class="error" *ngIf="showError('amount', 'required')">El importe es obligatorio</div>
              <div class="error" *ngIf="showError('amount', 'min')">Mínimo 10€</div>
              <div class="error" *ngIf="showError('amount', 'max')">Máximo 5.000€</div>
            </div>

            <div class="field">
              <label class="form-label" for="auto-day">Día del mes *</label>
              <select id="auto-day"
                      class="form-input"
                      formControlName="dayOfMonth">
                <option *ngFor="let d of dayOptions; trackBy: trackByValue" [ngValue]="d">
                  Día {{ d }}
                </option>
              </select>
              <div class="hint">RN-F024-13: solo días 1-28 (evita meses cortos)</div>
            </div>

            <div class="field full-width">
              <label class="form-label" for="auto-account">Cuenta origen *</label>
              <select id="auto-account"
                      class="form-input"
                      formControlName="sourceAccountId">
                <option [value]="goal.sourceAccountId || ''" *ngIf="goal.sourceAccountId">
                  Cuenta principal
                </option>
                <option value="" *ngIf="!goal.sourceAccountId" disabled>
                  Sin cuenta asignada — edita la meta primero
                </option>
              </select>
              <div class="error" *ngIf="showError('sourceAccountId', 'required')">
                Debes seleccionar una cuenta origen
              </div>
            </div>
          </div>

          <aside class="alert-info" role="note">
            <span class="alert-icon" aria-hidden="true">⚙️</span>
            <span class="alert-text">
              Si el día configurado no hay saldo suficiente, esta aportación se marcará como
              <strong>fallida</strong> y recibirás una notificación. La regla seguirá activa
              para el próximo mes.
            </span>
          </aside>

          <aside class="alert-info alert-warning" role="note">
            <span class="alert-icon" aria-hidden="true">🔁</span>
            <span class="alert-text">
              <strong>Reintentos automáticos:</strong>
              Si falla por error técnico (no por saldo), reintentamos 3 veces con espera
              1m / 5m / 15m antes de marcarla como fallida.
            </span>
          </aside>

          <div class="error-banner" *ngIf="submissionError" role="alert">
            <span aria-hidden="true">⚠️</span>
            <span>{{ submissionError }}</span>
          </div>

          <div class="form-actions">
            <button type="button"
                    class="btn btn-secondary btn-danger"
                    (click)="onPause()"
                    [disabled]="submitting || !hasExistingRule"
                    [title]="hasExistingRule ? 'Pausar la regla actual' : 'No hay regla activa que pausar'">
              Pausar regla
            </button>
            <div class="actions-right">
              <button type="button"
                      class="btn btn-secondary"
                      (click)="onCancel()"
                      [disabled]="submitting">Cancelar</button>
              <button type="submit"
                      class="btn btn-primary"
                      [disabled]="submitting || form.invalid">
                {{ submitting ? 'Guardando...' : 'Guardar regla' }}
              </button>
            </div>
          </div>
        </form>

        <aside class="summary-col" aria-label="Resumen ejecuciones">
          <div class="summary-box">
            <h4 class="summary-title">Próximas ejecuciones</h4>
            <div class="timeline-row"
                 *ngFor="let exec of upcomingExecutions; let last = last"
                 [class.last]="last">
              <div class="timeline-icon auto">🔁</div>
              <div class="timeline-body">
                <div class="timeline-title">{{ exec.label }}</div>
                <div class="timeline-sub">02:00 UTC</div>
              </div>
              <div class="timeline-amount">+{{ formatCurrency(currentAmount) }}</div>
            </div>
            <div class="summary-footer" *ngIf="projectedMonthsToTarget !== null">
              A {{ formatCurrency(currentAmount) }}/mes alcanzarás el objetivo
              en <strong>~{{ projectedMonthsToTarget }} {{ projectedMonthsToTarget === 1 ? 'mes' : 'meses' }}</strong>
              (sin contar saldo ya reservado).
            </div>
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .autorule {
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
    .loading {
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
    .autorule-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--sp-5, 20px);
    }
    .form-card {
      background: var(--color-white, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      padding: var(--sp-5, 20px);
      box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
    }
    .form-title {
      font-size: var(--text-xl, 20px);
      margin: 0 0 var(--sp-2, 8px) 0;
      color: var(--color-text-primary, #1a1a1a);
      font-weight: 600;
    }
    .form-subtitle {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
      margin: 0 0 var(--sp-4, 16px) 0;
    }
    .input-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sp-4, 16px);
    }
    .field { display: flex; flex-direction: column; }
    .field.full-width { grid-column: 1 / -1; }
    .form-label {
      font-size: var(--text-sm, 14px);
      font-weight: 500;
      color: var(--color-text-primary, #1a1a1a);
      margin-bottom: 6px;
    }
    .form-input {
      width: 100%;
      padding: 10px 12px;
      font-size: var(--text-sm, 14px);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      background: var(--color-white, #fff);
      box-sizing: border-box;
      transition: border-color 200ms ease;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--color-primary, #1B5E99);
      box-shadow: 0 0 0 3px rgba(27, 94, 153, 0.15);
    }
    .form-input.amount { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
    .hint {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: 4px;
    }
    .error {
      font-size: var(--text-xs, 12px);
      color: var(--color-error, #d32f2f);
      margin-top: 4px;
    }
    .alert-info {
      display: flex;
      gap: var(--sp-3, 12px);
      align-items: flex-start;
      padding: var(--sp-4, 16px);
      background: var(--color-info-light, #e3f2fd);
      border-left: 4px solid var(--color-info, #1976d2);
      border-radius: var(--radius-md, 8px);
      margin-top: var(--sp-4, 16px);
    }
    .alert-info.alert-warning {
      background: var(--color-warning-light, #fff8e1);
      border-left-color: var(--color-warning, #b26a00);
      margin-top: var(--sp-3, 12px);
    }
    .alert-icon { flex-shrink: 0; font-size: var(--text-lg, 18px); }
    .alert-text {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-primary, #1a1a1a);
      line-height: 1.5;
    }
    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--sp-3, 12px);
      margin-top: var(--sp-5, 20px);
      padding-top: var(--sp-4, 16px);
      border-top: 1px solid var(--color-border, #e5e7eb);
      flex-wrap: wrap;
    }
    .actions-right {
      display: flex;
      gap: var(--sp-3, 12px);
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

    .summary-col { display: flex; flex-direction: column; gap: var(--sp-3, 12px); }
    .summary-box {
      background: var(--color-white, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      padding: var(--sp-5, 20px);
      box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
      position: sticky;
      top: var(--sp-6, 24px);
      align-self: start;
    }
    .summary-title {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
      margin: 0 0 var(--sp-3, 12px) 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .timeline-row {
      display: flex;
      align-items: center;
      gap: var(--sp-2, 8px);
      padding: var(--sp-2, 8px) 0;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }
    .timeline-row.last { border-bottom: none; }
    .timeline-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      background: var(--color-success-light, #e8f5e9);
      flex-shrink: 0;
    }
    .timeline-body { flex: 1; min-width: 0; }
    .timeline-title {
      font-size: var(--text-xs, 12px);
      font-weight: 500;
      color: var(--color-text-primary, #1a1a1a);
    }
    .timeline-sub {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: 2px;
    }
    .timeline-amount {
      font-size: var(--text-xs, 12px);
      font-weight: 600;
      color: var(--color-success, #2e7d32);
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }
    .summary-footer {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: var(--sp-3, 12px);
      padding-top: var(--sp-3, 12px);
      border-top: 1px solid var(--color-border, #e5e7eb);
      line-height: 1.5;
    }

    @media (max-width: 900px) {
      .autorule-grid { grid-template-columns: 1fr; }
      .summary-box { position: static; }
      .input-grid { grid-template-columns: 1fr; }
      .form-actions { flex-direction: column; align-items: stretch; }
      .actions-right { width: 100%; }
      .actions-right .btn { flex: 1; }
    }
  `]
})
export class AutoRuleFormComponent implements OnInit, OnDestroy {
  readonly dayOptions = DAY_OPTIONS;

  goal: SavingsGoal | null = null;
  existingRule: AutoRule | null = null;
  form!: FormGroup;
  loading = true;
  loadError: string | null = null;
  submitting = false;
  submissionError: string | null = null;

  // Derivados
  upcomingExecutions: UpcomingExecution[] = [];
  currentAmount = 0;
  projectedMonthsToTarget: number | null = null;

  private goalId: string = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly savingsService: SavingsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      amount:           [100, [Validators.required, Validators.min(10), Validators.max(5000)]],
      dayOfMonth:       [5,   [Validators.required]],
      sourceAccountId:  ['',  [Validators.required]]
    });

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recomputeUpcoming());

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        if (!id) {
          this.loadError = 'Identificador de meta no valido.';
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }
        this.goalId = id;
        this.loadGoal();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get hasExistingRule(): boolean {
    return !!this.existingRule && this.existingRule.active;
  }

  // -------------------------------------------------------------------------
  // Carga inicial
  // -------------------------------------------------------------------------

  private loadGoal(): void {
    this.loading = true;
    this.loadError = null;
    this.savingsService.getDetail(this.goalId).pipe(
      catchError((err: HttpErrorResponse) => {
        this.loadError = this.mapErrorToMessage(err, 'No se pudo cargar la meta.');
        return of(null as unknown as GoalDetail);
      }),
      takeUntil(this.destroy$)
    ).subscribe(detail => {
      if (detail?.goal) {
        this.goal = detail.goal;
        this.existingRule = detail.autoRule || null;

        // Prefill: si hay regla existente, usar sus valores; si no, defaults
        if (detail.autoRule) {
          this.form.setValue({
            amount: detail.autoRule.amount,
            dayOfMonth: detail.autoRule.dayOfMonth,
            sourceAccountId: detail.autoRule.sourceAccountId
          });
        } else if (this.goal.sourceAccountId) {
          this.form.controls['sourceAccountId'].setValue(this.goal.sourceAccountId);
        }
        this.recomputeUpcoming();
      }
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  // -------------------------------------------------------------------------
  // Helpers UI
  // -------------------------------------------------------------------------

  showError(controlName: string, errorKey: string): boolean {
    const c = this.form?.get(controlName);
    return !!c && c.touched && c.hasError(errorKey);
  }

  trackByValue(_: number, value: number): number {
    return value;
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value ?? 0);
  }

  // -------------------------------------------------------------------------
  // Calculo proximas ejecuciones (3 meses adelante desde hoy)
  // -------------------------------------------------------------------------

  private recomputeUpcoming(): void {
    const v = this.form?.value ?? {};
    const day = Number(v.dayOfMonth);
    const amt = Number(v.amount) || 0;
    this.currentAmount = amt;

    if (!day || day < 1 || day > 28 || isNaN(day)) {
      this.upcomingExecutions = [];
      this.projectedMonthsToTarget = null;
      return;
    }

    const now = new Date();
    const execs: UpcomingExecution[] = [];
    let next = new Date(now.getFullYear(), now.getMonth(), day);
    if (next <= now) {
      // Ya pasamos este mes -> empezar el siguiente
      next = new Date(now.getFullYear(), now.getMonth() + 1, day);
    }
    for (let i = 0; i < 3; i++) {
      execs.push({
        label: new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(next)
      });
      next = new Date(next.getFullYear(), next.getMonth() + 1, day);
    }
    this.upcomingExecutions = execs;

    // Estimacion meses para alcanzar target (sin contar reservedAmount actual)
    if (this.goal && amt > 0) {
      const remaining = Math.max(0, (this.goal.targetAmount ?? 0) - (this.goal.reservedAmount ?? 0));
      this.projectedMonthsToTarget = remaining > 0 ? Math.ceil(remaining / amt) : 0;
    } else {
      this.projectedMonthsToTarget = null;
    }
    this.cdr.markForCheck();
  }

  // -------------------------------------------------------------------------
  // Acciones
  // -------------------------------------------------------------------------

  onCancel(): void {
    if (this.submitting) return;
    if (this.goalId) {
      this.router.navigate(['/objetivos', this.goalId]);
    } else {
      this.router.navigate(['/objetivos']);
    }
  }

  onSubmit(): void {
    if (this.submitting || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.goalId) return;

    this.submissionError = null;
    const v = this.form.value;
    const req: AutoRuleRequest = {
      amount: Number(v.amount),
      dayOfMonth: Number(v.dayOfMonth),
      sourceAccountId: v.sourceAccountId
    };

    this.submitting = true;
    this.savingsService.configureAutoRule(this.goalId, req)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/objetivos', this.goalId]);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.submissionError = this.mapErrorToMessage(err, 'No se pudo guardar la regla automatica.');
          this.cdr.markForCheck();
        }
      });
  }

  onPause(): void {
    if (this.submitting || !this.goalId || !this.hasExistingRule) return;

    if (!confirm('¿Pausar la regla automática? Podrás reactivarla más tarde guardando una nueva configuración.')) {
      return;
    }

    this.submitting = true;
    this.submissionError = null;
    this.savingsService.pauseAutoRule(this.goalId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/objetivos', this.goalId]);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.submissionError = this.mapErrorToMessage(err, 'No se pudo pausar la regla.');
          this.cdr.markForCheck();
        }
      });
  }

  // -------------------------------------------------------------------------
  // Mapeo errores backend
  // -------------------------------------------------------------------------

  private mapErrorToMessage(err: HttpErrorResponse, fallback: string): string {
    const code: string | undefined = err.error?.error;
    const backendMsg: string | undefined = err.error?.message;

    if (err.status === 404 && code === 'GOAL_NOT_FOUND') {
      return 'La meta no existe o ha sido cerrada.';
    }
    if (err.status === 403 && code === 'GOAL_ACCESS_DENIED') {
      return 'No tienes acceso a esta meta.';
    }
    if (err.status === 422) {
      if (code === 'INSUFFICIENT_FUNDS') {
        return backendMsg || 'Saldo insuficiente para esta operación.';
      }
      return backendMsg || fallback;
    }
    if (err.status === 400) {
      if (code === 'VALIDATION_FAILED' && backendMsg) return backendMsg;
      return backendMsg || 'Los datos enviados no son válidos.';
    }
    if (err.status === 401) return 'Tu sesión ha caducado. Inicia sesión de nuevo.';
    if (err.status === 0)   return 'Sin conexión al servidor. Reintenta más tarde.';
    return fallback;
  }
}
