import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PfmService } from '../../services/pfm.service';
import { BudgetDto, CATEGORY_LABELS, CATEGORY_ICONS } from '../../models/pfm.models';

/**
 * Smart — formulario nuevo presupuesto como PANTALLA PROPIA (no inline).
 * BUG-PO-008 fix: card independiente máx 580px, fuera de la lista.
 * BUG-PO-009 fix: slider range 50-95 paso 5 con preview en euros en tiempo real.
 * BUG-PO-025 fix: label "Umbral de alerta push".
 * BUG-PO-026 fix: label "Importe mensual (€)" + hint rango.
 * BUG-PO-027 fix: botón "Crear presupuesto".
 * BUG-PO-028 fix: select categorías con emoji.
 * BUG-PO-029 fix: alert-info reinicio automático.
 * US-F023-02 · FEAT-023 Sprint 25.
 */
@Component({
  selector: 'app-budget-form',
  template: `
    <div class="form-page-header">
      <div class="page-title">Nuevo presupuesto</div>
    </div>

    <div class="form-card">
      <div class="card-header">
        <span class="card-title">Configura tu presupuesto mensual</span>
      </div>
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="submit()">

          <!-- Categoría -->
          <div class="form-group">
            <label class="form-label">
              Categoría <span class="req">*</span>
            </label>
            <select class="form-input" formControlName="categoryCode">
              <option value="">Selecciona una categoría</option>
              <option *ngFor="let cat of categories" [value]="cat.code">
                {{ cat.icon }} {{ cat.label }}
              </option>
            </select>
            <div class="form-error" *ngIf="form.get('categoryCode')?.invalid && form.get('categoryCode')?.touched">
              Selecciona una categoría
            </div>
          </div>

          <!-- Importe mensual -->
          <div class="form-group">
            <label class="form-label">
              Importe mensual (€) <span class="req">*</span>
            </label>
            <input class="form-input" type="number"
                   formControlName="amountLimit"
                   placeholder="0,00" min="0.01" max="99999.99" step="0.01"
                   (input)="updatePreview()">
            <div class="form-hint">Entre 0,01 € y 99.999,99 €</div>
            <div class="form-error" *ngIf="form.get('amountLimit')?.invalid && form.get('amountLimit')?.touched">
              Importe inválido
            </div>
          </div>

          <!-- Umbral alerta: BUG-PO-009 — slider con preview -->
          <div class="form-group">
            <label class="form-label">Umbral de alerta push</label>
            <div class="range-wrap">
              <input type="range" class="range-input"
                     formControlName="thresholdPercent"
                     min="50" max="95" step="5"
                     (input)="updatePreview()">
              <div class="range-value">{{ thresholdValue }}%</div>
            </div>
            <div class="form-hint" [innerHTML]="thresholdPreview"></div>
          </div>

          <!-- Alert reinicio: BUG-PO-029 -->
          <div class="alert alert-info">
            ℹ El presupuesto se reinicia automáticamente cada mes.
          </div>

          <!-- Error global -->
          <div class="form-error form-error-global" *ngIf="error">{{ error }}</div>

          <div class="card-footer">
            <button type="button" class="btn-ghost" (click)="cancel.emit()">Cancelar</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || saving">
              {{ saving ? 'Guardando...' : 'Crear presupuesto' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page-header { margin-bottom:1.5rem; }
    .page-title { font-size:1.5rem; font-weight:700; color:#1A2332; }

    .form-card { background:#fff; border:1px solid #E8ECF0; border-radius:12px;
                 max-width:580px; box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .card-header { padding:1.25rem 1.5rem; border-bottom:1px solid #E8ECF0;
                   display:flex; align-items:center; }
    .card-title  { font-size:1rem; font-weight:600; color:#1A2332; }
    .card-body   { padding:1.5rem; }
    .card-footer { padding:1rem 1.5rem; border-top:1px solid #E8ECF0;
                   display:flex; justify-content:flex-end; gap:.75rem; }

    .form-group { margin-bottom:1.25rem; }
    .form-label { display:block; font-size:.85rem; font-weight:500; color:#1A2332; margin-bottom:.5rem; }
    .req { color:#E53935; margin-left:2px; }
    .form-input {
      width:100%; padding:.6rem 1rem; border:1.5px solid #D1D5DB; border-radius:8px;
      font-size:.9rem; color:#1A2332; background:#fff; outline:none;
      transition:border-color .2s; box-sizing:border-box;
    }
    .form-input:focus { border-color:#1B5E99; box-shadow:0 0 0 3px rgba(27,94,153,.12); }
    .form-hint  { font-size:.78rem; color:#4A5568; margin-top:.3rem; }
    .form-error { font-size:.78rem; color:#E53935; margin-top:.3rem; }
    .form-error-global { background:#FFEBEE; padding:.6rem; border-radius:6px; margin-bottom:.5rem; }

    .range-wrap  { display:flex; align-items:center; gap:1rem; }
    .range-input { flex:1; accent-color:#1B5E99; cursor:pointer; }
    .range-value { font-size:1.1rem; font-weight:700; color:#1B5E99; min-width:48px; text-align:center; }

    .alert { display:flex; gap:.75rem; padding:1rem 1.25rem; border-radius:8px;
             font-size:.85rem; margin-bottom:.75rem; }
    .alert-info { background:#E3F2FD; border-left:4px solid #1976D2; color:#0c3a6e; }

    .btn-primary { background:#1B5E99; color:#fff; border:none; padding:.5rem 1.25rem;
                   border-radius:8px; cursor:pointer; font-size:.9rem; font-weight:500; }
    .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
    .btn-ghost   { background:transparent; color:#4A5568; border:none; padding:.5rem 1rem;
                   border-radius:8px; cursor:pointer; font-size:.9rem; }
    .btn-ghost:hover { background:#F5F7FA; }
  `]
})
export class BudgetFormComponent implements OnInit {
  @Output() created = new EventEmitter<BudgetDto>();
  @Output() cancel  = new EventEmitter<void>();

  form!: FormGroup;
  saving = false;
  error  = '';
  thresholdPreview = '';

  // BUG-PO-028: categorías con emoji
  categories = Object.entries(CATEGORY_LABELS)
    .filter(([code]) => !['NOMINA', 'TRANSFERENCIAS'].includes(code))
    .map(([code, label]) => ({ code, label, icon: CATEGORY_ICONS[code] || '📦' }));

  constructor(private fb: FormBuilder, private pfm: PfmService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      categoryCode:     ['', Validators.required],
      amountLimit:      [300, [Validators.required, Validators.min(0.01), Validators.max(99999.99)]],
      thresholdPercent: [80, Validators.required]
    });
    this.updatePreview();
  }

  get thresholdValue(): number {
    return this.form.get('thresholdPercent')?.value ?? 80;
  }

  // BUG-PO-009: preview en euros en tiempo real
  updatePreview(): void {
    const limit = +(this.form.get('amountLimit')?.value || 0);
    const pct   = +(this.form.get('thresholdPercent')?.value || 80);
    const euros = (limit * pct / 100).toFixed(2).replace('.', ',');
    const total = limit.toFixed(2).replace('.', ',');
    this.thresholdPreview =
      `Recibirás alerta push al alcanzar <strong>${euros} €</strong> de ${total} €`;
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = '';
    this.pfm.createBudget(this.form.value).subscribe({
      next: b => { this.saving = false; this.created.emit(b); },
      error: e => {
        this.saving = false;
        this.error = e?.error?.error || 'Error al crear el presupuesto';
      }
    });
  }
}
