import { Component, Input } from '@angular/core';
import { GoalCategory, GOAL_CATEGORY_ICON, GOAL_CATEGORY_COLOR, GOAL_CATEGORY_LABEL } from '../../models/savings.models';

/**
 * CategoryIconComponent — RN-F024-07
 *
 * Renderiza el icono emoji + color de fondo asociados a una categoria de objetivo
 * de ahorro. Patron heredado del prototipo PROTO-FEAT-024-sprint26.html
 * (.goal-icon · 40x40 · radius-md · color blanco · font 20px).
 *
 * Mapping emoji: ver GOAL_CATEGORY_ICON en savings.models.ts.
 * Decision iconos: emoji unicode inline · consistencia con PFM/Bizum (LA-CORE-056).
 *
 * Inputs:
 *   - category: GoalCategory (obligatorio)
 *   - size?: number (default 40px) — ancho/alto en px
 *
 * A11y: aria-label con label de categoria (RNF-F024-04 WCAG 2.1 AA).
 */
@Component({
  selector: 'app-category-icon',
  template: `
    <span class="goal-icon"
          [style.width.px]="size"
          [style.height.px]="size"
          [style.background]="backgroundColor"
          [style.fontSize.px]="fontSize"
          [attr.aria-label]="label"
          role="img">{{ emoji }}</span>
  `,
  styles: [`
    .goal-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md, 8px);
      color: #fff;
      flex-shrink: 0;
      line-height: 1;
    }
  `]
})
export class CategoryIconComponent {
  @Input({ required: true }) category!: GoalCategory;
  @Input() size: number = 40;

  get emoji(): string {
    return GOAL_CATEGORY_ICON[this.category] ?? '🎯';
  }

  get backgroundColor(): string {
    return GOAL_CATEGORY_COLOR[this.category] ?? '#64748b';
  }

  get label(): string {
    return GOAL_CATEGORY_LABEL[this.category] ?? 'Objetivo';
  }

  get fontSize(): number {
    return Math.round(this.size * 0.5);
  }
}
