import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { SavingsService } from '../../services/savings.service';
import { GoalDetail, SavingsGoal, UpdateGoalRequest, GoalStatus } from '../../models/savings.models';

/**
 * GoalEditFormComponent - Smart pantalla 'Editar meta' (US-024-06)
 *
 * Fase G.2 LOTE 2.3.
 *
 * El prototipo PROTO-FEAT-024-sprint26.html NO incluye una pantalla dedicada de
 * edicion (la unica referencia es el boton 'Editar' del header de detail linea 1370
 * con anotacion 'ANNOT-06 · Editar US-024-06 valida targetAmount ≥ reservedAmount').
 *
 * El LLD-frontend §2 manda ruta separada /:id/editar con su propio componente.
 * Reutilizamos la estructura visual de GoalCreateFormComponent (form-card sin
 * summary-box · sin icon-picker/color-picker/category-picker porque el contrato
 * UpdateGoalRequest del backend solo expone {name, targetAmount, targetDate, status}).
 *
 * Validaciones cliente (RN-F024-01..02 + RN-F024-12 reverso):
 *   - name: required, 1..100 chars (igual que create)
 *   - targetAmount: required, 100..500000 + targetAmount >= reservedAmount (custom)
 *     RN-F024-12 invariante: la reserva no puede superar el target despues de editar
 *   - targetDate: required, NO se valida hoy+30 al editar (la meta ya existe y
 *     puede tener fecha pasada en flujos esquina; el backend re-valida)
 *   - status: select ACTIVE | PAUSED (UpdateGoalRequest solo permite estos dos
 *     · ver SavingsDtos.java + SavingsExceptionHandler. CLOSED y COMPLETED se
 *     transicionan via DELETE/cierre o automaticamente, no via PUT)
 *
 * Manejo errores backend (consistente con LOTE 2.2 fix auditoria)
 *   - 404 GOAL_NOT_FOUND -> mensaje + redirect a lista
 *   - 403 GOAL_ACCESS_DENIED -> mensaje + redirect a lista
 *   - 422 RESERVED_EXCEEDS_TARGET -> mensaje contextual mostrando reservedAmount
 *   - 422 INSUFFICIENT_FUNDS -> mensaje generico
 *   - 400 VALIDATION_FAILED -> mensaje del backend
 *   - 401 -> sesion caducada
 *   - 0 -> sin conexion
 *
 * Sin signals · ReactiveForms · template + styles inline
 *
 * FEAT-024 Sprint 26.
 */
@Component({
  selector: 'app-goal-edit-form',
  template: `
    <section class="goal-edit">
      <div class="breadcrumb">
        <button type="button"
                class="btn btn-secondary btn-small"
                (click)="onCancel()"
                [disabled]="submitting"
                aria-label="Cancelar y volver al detalle de la meta">
          ← Cancelar
        </button>
        <span class="breadcrumb-text">
          Mis Metas / {{ goal?.name || '...' }} / Editar
        </span>
      </div>

      <div *ngIf="loading" class="loading" role="status" aria-live="polite">
        Cargando datos de la meta...
      </div>

      <div *ngIf="loadError" class="error-banner" role="alert">
        <span aria-hidden="true">⚠️</span>
        <span>{{ loadError }}</span>
        <button type="button" class="btn-link" (click)="onCancel()">Volver a Mis Metas</button>
      </div>

      <form *ngIf="!loading && !loadError && goal"
            class="form-card"
            [formGroup]="form"
            (ngSubmit)="onSubmit()"
            novalidate>
        <h2 class="form-title">Editar meta</h2>

        <div class="info-row">
          <span class="info-label">Reservado actual:</span>
          <span class="info-value">{{ formatCurrency(goal.reservedAmount) }}</span>
        </div>

        <div class="input-grid">
          <div class="field">
            <label class="form-label" for="edit-name">Nombre de la meta *</label>
            <input id="edit-name"
                   class="form-input"
                   type="text"
                   formControlName="name"
                   maxlength="100"
                   autocomplete="off">
            <div class="error" *ngIf="showError('name', 'required')">El nombre es obligatorio</div>
            <div class="error" *ngIf="showError('name', 'maxlength')">Máximo 100 caracteres</div>
          </div>

          <div class="field">
            <label class="form-label" for="edit-amount">Importe objetivo *</label>
            <input id="edit-amount"
                   class="form-input amount"
                   type="number"
                   formControlName="targetAmount"
                   min="100"
                   max="500000"
                   step="50">
            <div class="hint">
              Mínimo {{ formatCurrency(goal.reservedAmount) }} (saldo ya reservado · RN-F024-12)
            </div>
            <div class="error" *ngIf="showError('targetAmount', 'required')">El importe es obligatorio</div>
            <div class="error" *ngIf="showError('targetAmount', 'min')">Mínimo 100€</div>
            <div class="error" *ngIf="showError('targetAmount', 'max')">Máximo 500.000€</div>
            <div class="error" *ngIf="showError('targetAmount', 'belowReserved')">
              El nuevo objetivo no puede ser menor que el saldo reservado actual.
            </div>
          </div>

          <div class="field">
            <label class="form-label" for="edit-date">Fecha límite *</label>
            <input id="edit-date"
                   class="form-input"
                   type="date"
                   formControlName="targetDate">
            <div class="error" *ngIf="showError('targetDate', 'required')">La fecha es obligatoria</div>
          </div>

          <div class="field">
            <label class="form-label" for="edit-status">Estado</label>
            <select id="edit-status"
                    class="form-input"
                    formControlName="status">
              <option value="ACTIVE">Activa</option>
              <option value="PAUSED">Pausada</option>
            </select>
            <div class="hint">
              Pausar evita que las aportaciones automáticas se ejecuten.
            </div>
          </div>
        </div>

        <div class="error-banner" *ngIf="submissionError" role="alert">
          <span aria-hidden="true">⚠️</span>
          <span>{{ submissionError }}</span>
        </div>

        <div class="form-actions">
          <button type="button"
                  class="btn btn-secondary"
                  (click)="onCancel()"
                  [disabled]="submitting">Cancelar</button>
          <button type="submit"
                  class="btn btn-primary"
                  [disabled]="submitting || form.invalid">
            {{ submitting ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .goal-edit {
      display: block;
      padding: var(--sp-6, 24px);
      max-width: 800px;
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
    .form-card {
      background: var(--color-white, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      padding: var(--sp-5, 20px);
      box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
    }
    .form-title {
      font-size: var(--text-xl, 20px);
      margin: 0 0 var(--sp-4, 16px) 0;
      color: var(--color-text-primary, #1a1a1a);
      font-weight: 600;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sp-3, 12px) var(--sp-4, 16px);
      background: var(--color-bg-soft, #f9fafb);
      border-radius: var(--radius-md, 8px);
      margin-bottom: var(--sp-4, 16px);
    }
    .info-label {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
    }
    .info-value {
      font-size: var(--text-md, 16px);
      font-weight: 600;
      color: var(--color-text-primary, #1a1a1a);
      font-variant-numeric: tabular-nums;
    }
    .input-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sp-4, 16px);
    }
    .field { display: flex; flex-direction: column; }
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
    .form-input.amount { text-align: right; font-variant-numeric: tabular-nums; }
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
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--sp-3, 12px);
      margin-top: var(--sp-5, 20px);
      padding-top: var(--sp-4, 16px);
      border-top: 1px solid var(--color-border, #e5e7eb);
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
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    @media (max-width: 600px) {
      .input-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class GoalEditFormComponent implements OnInit, OnDestroy {
  goal: SavingsGoal | null = null;
  form!: FormGroup;
  loading = true;
  loadError: string | null = null;
  submitting = false;
  submissionError: string | null = null;

  private goalId: string = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly savingsService: SavingsService
  ) {}

  ngOnInit(): void {
    // Form vacio antes de la carga (evita errores de [formGroup] sobre null)
    this.form = this.fb.group({
      name:         ['', [Validators.required, Validators.maxLength(100)]],
      targetAmount: [0, [Validators.required, Validators.min(100), Validators.max(500000)]],
      targetDate:   ['', [Validators.required]],
      status:       ['ACTIVE' as GoalStatus, [Validators.required]]
    });

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        if (!id) {
          this.loadError = 'Identificador de meta no valido.';
          this.loading = false;
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

  // -------------------------------------------------------------------------
  // Carga inicial (prefill)
  // -------------------------------------------------------------------------

  private loadGoal(): void {
    this.loading = true;
    this.loadError = null;
    this.savingsService.getDetail(this.goalId).pipe(
      catchError((err: HttpErrorResponse) => {
        this.loadError = this.mapErrorToMessage(err, 'No se pudo cargar la meta.');
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(detail => {
      if (detail?.goal) {
        this.goal = detail.goal;
        this.prefillForm(detail.goal);
      }
      this.loading = false;
    });
  }

  private prefillForm(goal: SavingsGoal): void {
    // Status del backend puede ser ACTIVE/PAUSED/CLOSED/COMPLETED.
    // El form solo permite ACTIVE/PAUSED. Si la meta esta en CLOSED/COMPLETED
    // no deberia poder editarse pero no fallamos: dejamos el ultimo valor editable
    // (ACTIVE por defecto) y el usuario lo respetara o el backend rechazara.
    const editableStatus: GoalStatus = (goal.status === 'PAUSED') ? 'PAUSED' : 'ACTIVE';
    this.form.setValue({
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      status: editableStatus
    });
    // Reaplicar validador belowReserved cuando ya conocemos reservedAmount
    this.form.controls['targetAmount'].setValidators([
      Validators.required,
      Validators.min(100),
      Validators.max(500000),
      this.belowReservedValidator(goal.reservedAmount)
    ]);
    this.form.controls['targetAmount'].updateValueAndValidity();
  }

  // -------------------------------------------------------------------------
  // Helpers UI
  // -------------------------------------------------------------------------

  showError(controlName: string, errorKey: string): boolean {
    const c = this.form?.get(controlName);
    return !!c && c.touched && c.hasError(errorKey);
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
  // Validador custom: targetAmount >= reservedAmount (RN-F024-12 reverso)
  // -------------------------------------------------------------------------

  private belowReservedValidator(reservedAmount: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = Number(control.value);
      if (isNaN(v)) return null;
      return v < reservedAmount ? { belowReserved: true } : null;
    };
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
    const req: UpdateGoalRequest = {
      name: (v.name ?? '').trim(),
      targetAmount: Number(v.targetAmount),
      targetDate: v.targetDate,
      status: v.status as GoalStatus
    };

    this.submitting = true;
    this.savingsService.updateGoal(this.goalId, req)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/objetivos', this.goalId]);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.submissionError = this.mapErrorToMessage(err, 'No se pudieron guardar los cambios.');
        }
      });
  }

  // -------------------------------------------------------------------------
  // Mapeo errores backend (consistente con LOTE 2.2 fix auditoria)
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
      if (code === 'RESERVED_EXCEEDS_TARGET') {
        return backendMsg || 'El nuevo objetivo no puede ser menor que el saldo ya reservado.';
      }
      if (code === 'INSUFFICIENT_FUNDS') {
        return backendMsg || 'Saldo insuficiente para esta operacion.';
      }
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
