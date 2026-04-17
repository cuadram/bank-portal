import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MovimientoCategorizado, CATEGORY_LABELS, CATEGORY_ICONS } from '../../models/pfm.models';

/** Presentational — fila de movimiento con botón de recategorización. US-F023-06. */
@Component({
  selector: 'app-pfm-movimiento-row',
  template: `
    <td>{{ mov.concept }}</td>
    <td><span class="cat-badge">{{ icon }} {{ label }}</span>
        <button *ngIf="!mov.isIngreso" class="edit-btn" (click)="edit.emit(mov)">✏️</button></td>
    <td class="amt" [class.ingreso]="mov.isIngreso" [class.cargo]="!mov.isIngreso">
      {{ (mov.isIngreso?'+':'-') }}{{ mov.amount | number:'1.2-2' }} €</td>
  `,
  styles: [`.cat-badge{background:#e8edf5;border-radius:4px;padding:.2rem .5rem;font-size:.82rem}
    .edit-btn{border:none;background:none;cursor:pointer;margin-left:.3rem;font-size:.8rem}
    .amt{text-align:right;font-variant-numeric:tabular-nums;width:7rem}
    .cargo{color:#c0392b}.ingreso{color:#27ae60}`]
})
export class PfmMovimientoRowComponent {
  @Input() mov!: MovimientoCategorizado;
  @Output() edit = new EventEmitter<MovimientoCategorizado>();
  get label(): string { return CATEGORY_LABELS[this.mov.categoryCode] || this.mov.categoryCode; }
  get icon():  string { return CATEGORY_ICONS[this.mov.categoryCode]  || '📦'; }
}
