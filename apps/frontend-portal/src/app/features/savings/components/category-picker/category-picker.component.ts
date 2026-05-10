import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GoalCategory, GOAL_CATEGORY_ICON, GOAL_CATEGORY_LABEL } from '../../models/savings.models';

/**
 * CategoryPickerComponent - RN-F024-07
 *
 * Select tipado de GoalCategory con preview emoji + label inline.
 * Patron LA-CORE-057: [(ngModel)] + FormsModule en lugar de (change) unidireccional
 * para soportar reset programatico (form.reset() en GoalCreateFormComponent).
 *
 * Patron heredado del prototipo PROTO-FEAT-024-sprint26.html lineas 1518-1525:
 *   <select class="form-input">
 *     <option value="VIAJE" selected>VIAJE Viaje</option>
 *     ... (6 categorias)
 *   </select>
 *
 * Inputs:
 *   - value: GoalCategory (ngModel two-way)
 * Outputs:
 *   - valueChange: GoalCategory (ngModelChange)
 *
 * Nota: el icon-picker visual 12-iconos + color-picker 8-colores del prototipo
 * (lineas 1535-1560) son layout cosmetico del formulario, viven en GoalCreateFormComponent
 * (LOTE 2 G.2). Este componente solo gestiona la categoria semantica (enum tipado).
 *
 * A11y: <label for> + <select> nativo · navegable teclado por defecto WCAG 2.1.1.
 */
@Component({
  selector: 'app-category-picker',
  template: `
    <div class="category-picker-wrap">
      <select class="form-input category-select"
              [ngModel]="value"
              (ngModelChange)="onChange($event)"
              [attr.aria-label]="ariaLabel"
              [disabled]="disabled">
        <option *ngFor="let cat of categories" [value]="cat">
          {{ iconOf(cat) }} {{ labelOf(cat) }}
        </option>
      </select>
    </div>
  `,
  styles: [`
    .category-picker-wrap {
      width: 100%;
    }
    .category-select {
      width: 100%;
      padding: var(--sp-3, 12px);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 8px);
      background: var(--color-white, #fff);
      font-size: var(--text-base, 16px);
      color: var(--color-text-primary, #1a1a1a);
      cursor: pointer;
    }
    .category-select:focus {
      outline: 2px solid var(--color-primary, #1B5E99);
      outline-offset: 2px;
    }
    .category-select:disabled {
      background: var(--color-surface, #f5f5f5);
      color: var(--color-text-secondary, #6b7280);
      cursor: not-allowed;
    }
  `]
})
export class CategoryPickerComponent {
  @Input() value: GoalCategory = 'OTROS';
  @Input() ariaLabel: string = 'Seleccionar categoria de objetivo';
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<GoalCategory>();

  readonly categories: GoalCategory[] = ['VIAJE', 'HOGAR', 'VEHICULO', 'EMERGENCIA', 'EDUCACION', 'OTROS'];

  iconOf(cat: GoalCategory): string {
    return GOAL_CATEGORY_ICON[cat] ?? '🎯';
  }

  labelOf(cat: GoalCategory): string {
    return GOAL_CATEGORY_LABEL[cat] ?? cat;
  }

  onChange(v: GoalCategory): void {
    this.value = v;
    this.valueChange.emit(v);
  }
}
