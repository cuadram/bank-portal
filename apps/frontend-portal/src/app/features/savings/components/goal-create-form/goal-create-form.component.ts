import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SavingsService } from '../../services/savings.service';
import {
  CreateGoalRequest,
  GoalCategory,
  GOAL_CATEGORY_LABEL,
  GOAL_CATEGORY_ICON
} from '../../models/savings.models';

/**
 * GoalCreateFormComponent - Smart pantalla 'Crear nueva meta' (US-024-01)
 *
 * Fase G.2 LOTE 2.2.
 *
 * Pixel-perfect contra prototipo PROTO-FEAT-024-sprint26.html lineas 1477-1611
 * (screen-savings-create). LA-CORE-056 BLOQUEANTE en G-4.
 *
 * Estructura observada en prototipo y replicada:
 *   - breadcrumb: boton 'Cancelar' + texto 'Mis Metas / Nueva meta'
 *   - layout grid 2fr/1fr: form izquierda · summary-box preview derecha
 *   - input-grid 2x2: name + targetAmount + targetDate + category (CategoryPicker G.1)
 *   - icon-picker: 12 emojis predefinidos accesibles teclado WCAG 2.1.1
 *   - color-picker: 8 colores predefinidos (acento del icono)
 *   - alert-info limite 10 metas con counter dinamico activas
 *   - summary-box: vista previa goal-card en miniatura con datos del form en tiempo real
 *   - acciones footer: btn Cancelar (vuelve a /objetivos) + btn primary Crear meta
 *
 * Validaciones cliente (RN-F024-01..02):
 *   - name: required, 1..100 chars
 *   - targetAmount: required, 100..500000
 *   - targetDate: required, >= hoy+30 dias
 *   - category: required (default OTROS si no se elige)
 *   - icon: opcional (12 predefinidos)
 *   - color: opcional (8 predefinidos)
 *
 * Manejo errores backend (contrato real SavingsExceptionHandler Fase E):
 *   - 409 MAX_GOALS_REACHED -> banner contextual con limite (RN-F024-02)
 *   - 422 INSUFFICIENT_FUNDS / RESERVED_EXCEEDS_TARGET -> mensaje del backend
 *   - 400 VALIDATION_FAILED -> mensaje 'campo: descripcion' del backend
 *   - 400 BAD_REQUEST -> mensaje del backend o generico
 *   - 401 -> sesion caducada
 *   - 0 -> sin conexion
 *   - otros -> mensaje generico
 *
 * Decision LLD §5: usa <app-category-picker> G.1 (no <select> directo del prototipo).
 * El prototipo dibuja un <select> nativo pero el LLD obliga al componente picker
 * (consistencia + LA-CORE-057 cumplida internamente).
 *
 * Hallazgo OBS-005 (registro Step 5): prototipo no expone selector de cuenta
 * origen. sourceAccountId queda undefined - backend selecciona cuenta principal
 * por defecto. Pendiente alinear con LLD §3 si en futuro hay multi-cuenta.
 *
 * Sin signals · ReactiveForms · template + styles inline.
 *
 * FEAT-024 Sprint 26.
 */
const ICON_OPTIONS: ReadonlyArray<string> = [
  '✈️', '🏠', '🚗', '🛡️', '🎓', '💍',
  '👶', '💻', '📱', '🎁', '🐶', '🌴'
];

const COLOR_OPTIONS: ReadonlyArray<string> = [
  '#009688', '#1B5E99', '#00897B', '#F57F17',
  '#E53935', '#9C27B0', '#795548', '#607D8B'
];

const MAX_ACTIVE_GOALS = 10;
const MIN_DAYS_AHEAD = 30;

@Component({
  selector: 'app-goal-create-form',
  template: `
    <section class="goal-create">
      <div class="breadcrumb">
        <button type="button"
                class="btn btn-secondary btn-small"
                (click)="onCancel()"
                [disabled]="submitting"
                aria-label="Cancelar y volver a Mis Metas">
          ← Cancelar
        </button>
        <span class="breadcrumb-text">Mis Metas / Nueva meta</span>
      </div>

      <div class="create-grid">
        <form class="form-card" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <h2 class="form-title">Crear nueva meta</h2>

          <div class="input-grid">
            <div class="field">
              <label class="form-label" for="goal-name">Nombre de la meta *</label>
              <input id="goal-name"
                     class="form-input"
                     type="text"
                     formControlName="name"
                     placeholder="Ej: Viaje a Japón"
                     maxlength="100"
                     autocomplete="off">
              <div class="hint">Único por usuario</div>
              <div class="error" *ngIf="showError('name', 'required')">El nombre es obligatorio</div>
              <div class="error" *ngIf="showError('name', 'maxlength')">Máximo 100 caracteres</div>
            </div>

            <div class="field">
              <label class="form-label" for="goal-amount">Importe objetivo *</label>
              <input id="goal-amount"
                     class="form-input amount"
                     type="number"
                     formControlName="targetAmount"
                     placeholder="3000"
                     min="100"
                     max="500000"
                     step="50">
              <div class="hint">Entre 100€ y 500.000€</div>
              <div class="error" *ngIf="showError('targetAmount', 'required')">El importe es obligatorio</div>
              <div class="error" *ngIf="showError('targetAmount', 'min')">Mínimo 100€</div>
              <div class="error" *ngIf="showError('targetAmount', 'max')">Máximo 500.000€</div>
            </div>

            <div class="field">
              <label class="form-label" for="goal-date">Fecha límite *</label>
              <input id="goal-date"
                     class="form-input"
                     type="date"
                     formControlName="targetDate"
                     [min]="minTargetDate">
              <div class="hint">Mínimo 30 días desde hoy</div>
              <div class="error" *ngIf="showError('targetDate', 'required')">La fecha es obligatoria</div>
              <div class="error" *ngIf="showError('targetDate', 'minDate')">Debe ser al menos 30 días en el futuro</div>
            </div>

            <div class="field">
              <label class="form-label">Categoría *</label>
              <app-category-picker
                [value]="form.controls['category'].value"
                (valueChange)="onCategoryChange($event)"
                [disabled]="submitting"></app-category-picker>
            </div>
          </div>

          <div class="picker-section">
            <label class="form-label">Icono</label>
            <div class="icon-picker" role="radiogroup" aria-label="Seleccionar icono de la meta">
              <button type="button"
                      *ngFor="let icon of iconOptions; trackBy: trackByValue"
                      class="icon-pick"
                      [class.selected]="form.controls['icon'].value === icon"
                      role="radio"
                      [attr.aria-checked]="form.controls['icon'].value === icon"
                      [attr.aria-label]="'Icono ' + icon"
                      [disabled]="submitting"
                      (click)="onIconSelect(icon)">{{ icon }}</button>
            </div>
          </div>

          <div class="picker-section">
            <label class="form-label">Color</label>
            <div class="color-picker" role="radiogroup" aria-label="Seleccionar color de acento">
              <button type="button"
                      *ngFor="let color of colorOptions; trackBy: trackByValue"
                      class="color-pick"
                      [class.selected]="form.controls['color'].value === color"
                      [style.background]="color"
                      role="radio"
                      [attr.aria-checked]="form.controls['color'].value === color"
                      [attr.aria-label]="'Color ' + color"
                      [disabled]="submitting"
                      (click)="onColorSelect(color)"></button>
            </div>
          </div>

          <aside class="alert-info" role="note">
            <span class="alert-icon" aria-hidden="true">ℹ️</span>
            <span class="alert-text">
              Puedes tener hasta {{ maxActiveGoals }} metas activas simultáneamente.
              Tienes <strong>{{ activeGoalsCount }}</strong>
              {{ activeGoalsCount === 1 ? 'meta activa' : 'metas activas' }} ahora.
            </span>
          </aside>

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
                    [disabled]="submitting || form.invalid || activeGoalsCount >= maxActiveGoals">
              {{ submitting ? 'Creando...' : 'Crear meta' }}
            </button>
          </div>
        </form>

        <aside class="summary-box" aria-label="Vista previa de la meta">
          <h4 class="summary-title">Vista previa</h4>
          <div class="goal-card-preview">
            <div class="goal-card-head">
              <div class="goal-icon" [style.background]="previewColor">{{ previewIcon }}</div>
              <div class="goal-card-title">
                <div class="goal-name">{{ previewName }}</div>
                <div class="goal-cat">{{ previewCategoryLabel }} · {{ previewDateLabel }}</div>
              </div>
            </div>
            <div class="goal-amounts">
              <div>
                <div class="goal-amount">0,00 €</div>
                <div class="goal-target">de {{ previewTargetFormatted }}</div>
              </div>
              <div class="goal-percent">0%</div>
            </div>
            <div class="goal-pbar"><div class="goal-pfill ok" style="width:0%"></div></div>
          </div>
          <div class="summary-hint">Tras crearla podrás aportar fondos manuales o configurar una aportación automática.</div>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .goal-create {
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
    .create-grid {
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
      margin: 0 0 var(--sp-4, 16px) 0;
      color: var(--color-text-primary, #1a1a1a);
      font-weight: 600;
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
    .picker-section { margin-top: var(--sp-4, 16px); }
    .icon-picker {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: var(--sp-2, 8px);
    }
    .icon-pick {
      padding: 10px;
      font-size: 22px;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      background: var(--color-white, #fff);
      cursor: pointer;
      transition: border-color 150ms ease, background 150ms ease, transform 100ms ease;
    }
    .icon-pick:hover:not(:disabled) {
      background: var(--color-bg-soft, #f3f4f6);
    }
    .icon-pick.selected {
      border-color: var(--color-primary, #1B5E99);
      background: var(--color-primary-light, #e3edf7);
    }
    .icon-pick:focus-visible {
      outline: 2px solid var(--color-primary, #1B5E99);
      outline-offset: 2px;
    }
    .icon-pick:disabled { opacity: 0.5; cursor: not-allowed; }
    .color-picker {
      display: flex;
      gap: var(--sp-2, 8px);
      flex-wrap: wrap;
    }
    .color-pick {
      width: 36px;
      height: 36px;
      border: 2px solid transparent;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 100ms ease, box-shadow 150ms ease;
    }
    .color-pick.selected {
      border-color: var(--color-text-primary, #1a1a1a);
      transform: scale(1.1);
    }
    .color-pick:focus-visible {
      outline: 2px solid var(--color-primary, #1B5E99);
      outline-offset: 2px;
    }
    .color-pick:disabled { opacity: 0.5; cursor: not-allowed; }
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
    .goal-card-preview {
      padding: var(--sp-4, 16px);
      border: 1px dashed var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
    }
    .goal-card-head {
      display: flex;
      gap: var(--sp-3, 12px);
      align-items: center;
      margin-bottom: var(--sp-3, 12px);
    }
    .goal-icon {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: #fff;
      flex-shrink: 0;
    }
    .goal-card-title { flex: 1; min-width: 0; }
    .goal-name {
      font-size: var(--text-base, 16px);
      font-weight: 600;
      color: var(--color-text-primary, #1a1a1a);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .goal-cat {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: 2px;
    }
    .goal-amounts {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: var(--sp-2, 8px);
    }
    .goal-amount {
      font-size: var(--text-lg, 18px);
      font-weight: 700;
      color: var(--color-text-primary, #1a1a1a);
      font-variant-numeric: tabular-nums;
    }
    .goal-target {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      font-variant-numeric: tabular-nums;
    }
    .goal-percent {
      font-size: var(--text-md, 16px);
      font-weight: 600;
      color: var(--color-text-secondary, #6b7280);
      font-variant-numeric: tabular-nums;
    }
    .goal-pbar {
      width: 100%;
      height: 6px;
      background: var(--color-bg-soft, #f3f4f6);
      border-radius: 999px;
      margin-top: var(--sp-2, 8px);
      overflow: hidden;
    }
    .goal-pfill { height: 100%; transition: width 300ms ease; }
    .goal-pfill.ok { background: var(--color-success, #2e7d32); }
    .summary-hint {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: var(--sp-3, 12px);
    }

    @media (max-width: 900px) {
      .create-grid { grid-template-columns: 1fr; }
      .summary-box { position: static; }
      .input-grid { grid-template-columns: 1fr; }
      .icon-picker { grid-template-columns: repeat(4, 1fr); }
    }
  `]
})
export class GoalCreateFormComponent implements OnInit, OnDestroy {
  readonly iconOptions = ICON_OPTIONS;
  readonly colorOptions = COLOR_OPTIONS;
  readonly maxActiveGoals = MAX_ACTIVE_GOALS;
  readonly minTargetDate: string;

  form!: FormGroup;
  submitting = false;
  submissionError: string | null = null;
  activeGoalsCount = 0;

  // Datos derivados para preview (recalculados en valueChanges)
  previewName = 'Nueva meta';
  previewIcon: string = ICON_OPTIONS[0];
  previewColor: string = COLOR_OPTIONS[0];
  previewCategoryLabel = 'Otros';
  previewDateLabel = '-';
  previewTargetFormatted = '0,00 €';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly savingsService: SavingsService,
    private readonly router: Router
  ) {
    this.minTargetDate = this.computeMinDate();
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name:         ['', [Validators.required, Validators.maxLength(100)]],
      targetAmount: [null, [Validators.required, Validators.min(100), Validators.max(500000)]],
      targetDate:   ['', [Validators.required, this.minDateValidator()]],
      category:     ['OTROS' as GoalCategory, [Validators.required]],
      icon:         [ICON_OPTIONS[0]],
      color:        [COLOR_OPTIONS[0]]
    });

    // Refresca preview en cada cambio (sin signals)
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshPreview());

    this.refreshPreview();
    this.loadActiveGoalsCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -------------------------------------------------------------------------
  // Helpers de UI
  // -------------------------------------------------------------------------

  showError(controlName: string, errorKey: string): boolean {
    const c = this.form?.get(controlName);
    return !!c && c.touched && c.hasError(errorKey);
  }

  trackByValue(_: number, value: string): string {
    return value;
  }

  onCategoryChange(value: GoalCategory): void {
    this.form.controls['category'].setValue(value);
    this.form.controls['category'].markAsTouched();
  }

  onIconSelect(icon: string): void {
    if (this.submitting) return;
    this.form.controls['icon'].setValue(icon);
  }

  onColorSelect(color: string): void {
    if (this.submitting) return;
    this.form.controls['color'].setValue(color);
  }

  onCancel(): void {
    if (this.submitting) return;
    this.router.navigate(['/objetivos']);
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  onSubmit(): void {
    if (this.submitting) return;
    this.submissionError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.activeGoalsCount >= this.maxActiveGoals) {
      this.submissionError = `Ya tienes ${this.maxActiveGoals} metas activas. Cierra alguna antes de crear otra.`;
      return;
    }

    const v = this.form.value;
    const req: CreateGoalRequest = {
      name: (v.name ?? '').trim(),
      targetAmount: Number(v.targetAmount),
      targetDate: v.targetDate,
      category: v.category as GoalCategory,
      icon: v.icon || undefined,
      color: v.color || undefined
    };

    this.submitting = true;
    this.savingsService.createGoal(req).subscribe({
      next: (created) => {
        this.submitting = false;
        // Navegar al detalle de la meta recien creada
        this.router.navigate(['/objetivos', created.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.submissionError = this.mapErrorToMessage(err);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Carga inicial de count metas activas
  // -------------------------------------------------------------------------

  private loadActiveGoalsCount(): void {
    this.savingsService.listGoals('ACTIVE')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list) => { this.activeGoalsCount = list?.length ?? 0; },
        error: () => { this.activeGoalsCount = 0; }
      });
  }

  // -------------------------------------------------------------------------
  // Preview en tiempo real
  // -------------------------------------------------------------------------

  private refreshPreview(): void {
    const v = this.form?.value ?? {};
    this.previewName = (v.name && String(v.name).trim().length > 0) ? String(v.name).trim() : 'Nueva meta';
    this.previewIcon = v.icon || GOAL_CATEGORY_ICON[v.category as GoalCategory] || ICON_OPTIONS[0];
    this.previewColor = v.color || COLOR_OPTIONS[0];
    this.previewCategoryLabel = GOAL_CATEGORY_LABEL[v.category as GoalCategory] ?? 'Otros';
    this.previewDateLabel = this.formatDateLabel(v.targetDate);
    this.previewTargetFormatted = this.formatCurrency(Number(v.targetAmount) || 0);
  }

  private formatDateLabel(iso: string | null | undefined): string {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '-';
      return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(d);
    } catch {
      return '-';
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  // -------------------------------------------------------------------------
  // Validacion fecha minima (hoy + 30 dias)
  // -------------------------------------------------------------------------

  private computeMinDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + MIN_DAYS_AHEAD);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  private minDateValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = control.value;
      if (!v) return null;
      try {
        const target = new Date(v);
        const min = new Date(this.minTargetDate);
        if (isNaN(target.getTime())) return { minDate: true };
        return target < min ? { minDate: true } : null;
      } catch {
        return { minDate: true };
      }
    };
  }

  // -------------------------------------------------------------------------
  // Mapeo errores backend -> mensaje usuario
  // -------------------------------------------------------------------------

  /**
   * Mapea HttpErrorResponse del backend (SavingsExceptionHandler.java Fase E)
   * a mensaje localizado para el usuario.
   *
   * Contrato real backend (verificado contra SavingsExceptionHandler):
   *   - body shape: { error: 'CODE', message: '...', timestamp: ..., path: ... }
   *   - 409 CONFLICT  + error=MAX_GOALS_REACHED      -> RN-F024-02 (10 metas activas)
   *   - 422 UNPROC.   + error=INSUFFICIENT_FUNDS     -> saldo insuficiente
   *   - 422 UNPROC.   + error=RESERVED_EXCEEDS_TARGET-> reserva > objetivo
   *   - 400 BAD_REQ.  + error=VALIDATION_FAILED      -> @Valid fallo (formato 'campo: descripcion')
   *   - 400 BAD_REQ.  + error=BAD_REQUEST            -> IllegalArgumentException
   *   - 403 FORBIDDEN + error=GOAL_ACCESS_DENIED     -> ownership (no aplicable en create)
   *   - 401 UNAUTH.   + error=INVALID_OTP            -> SCA fallido (no aplicable en create)
   *   - 401 UNAUTH.   global                          -> JWT caducado
   *   - 0             -> sin conexion
   */
  private mapErrorToMessage(err: HttpErrorResponse): string {
    const code: string | undefined = err.error?.error;
    const backendMsg: string | undefined = err.error?.message;

    // 409 CONFLICT - limite metas activas (contrato backend: NO 422)
    if (err.status === 409 && code === 'MAX_GOALS_REACHED') {
      return `Has alcanzado el limite de ${this.maxActiveGoals} metas activas. Cierra alguna antes de crear otra.`;
    }

    // 422 UNPROCESSABLE_ENTITY - saldo / consistencia (no aplicable a create-goal habitualmente,
    // pero defensivo: si el backend evoluciona, mostramos el mensaje del backend)
    if (err.status === 422) {
      if (code === 'INSUFFICIENT_FUNDS')       return backendMsg || 'Saldo insuficiente para crear la meta.';
      if (code === 'RESERVED_EXCEEDS_TARGET')  return backendMsg || 'El importe reservado supera el objetivo.';
      return backendMsg || 'No se ha podido crear la meta. Revisa los datos.';
    }

    // 400 BAD_REQUEST - validacion @Valid o IllegalArgument
    if (err.status === 400) {
      // VALIDATION_FAILED viene con formato 'campo: mensaje', util para el usuario
      if (code === 'VALIDATION_FAILED' && backendMsg) return backendMsg;
      return backendMsg || 'Los datos del formulario no son validos.';
    }

    if (err.status === 401) return 'Tu sesion ha caducado. Inicia sesion de nuevo.';
    if (err.status === 0)   return 'Sin conexion al servidor. Reintenta mas tarde.';
    return 'No se ha podido crear la meta. Reintenta mas tarde.';
  }
}
