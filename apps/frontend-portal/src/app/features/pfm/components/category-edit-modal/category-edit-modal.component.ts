import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PfmService } from '../../services/pfm.service';
import { MovimientoCategorizado, CATEGORY_LABELS } from '../../models/pfm.models';

/** Overlay — modal de recategorización manual. US-F023-06. */
@Component({
  selector: 'app-category-edit-modal',
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <h3>Cambiar categoría</h3>
        <p class="mov-concept">{{ mov.concept }}</p>
        <div class="cat-grid">
          <button *ngFor="let cat of categories" class="cat-btn"
                  [class.selected]="selected===cat.code"
                  (click)="selected=cat.code">
            {{ cat.icon }} {{ cat.label }}
          </button>
        </div>
        <p *ngIf="error" class="form-error">{{ error }}</p>
        <div class="modal-actions">
          <button class="btn-primary" [disabled]="saving" (click)="confirm()">Confirmar</button>
          <button class="btn-secondary" (click)="close.emit()">Cancelar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:1000}
    .modal-box{background:#fff;border-radius:10px;padding:1.5rem;width:420px;max-width:95vw}
    h3{color:#1e3a5f;margin:0 0 .5rem}
    .mov-concept{color:#888;font-size:.85rem;margin-bottom:1rem}
    .cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;margin-bottom:1rem}
    .cat-btn{padding:.4rem;border:1px solid #e0e4ea;border-radius:6px;cursor:pointer;font-size:.82rem;background:#f5f7fa}
    .cat-btn.selected{background:#1e3a5f;color:#fff;border-color:#1e3a5f}
    .modal-actions{display:flex;gap:.5rem}
    .btn-primary{background:#1e3a5f;color:#fff;border:none;padding:.5rem 1rem;border-radius:6px;cursor:pointer}
    .btn-secondary{background:#fff;border:1px solid #1e3a5f;color:#1e3a5f;padding:.5rem 1rem;border-radius:6px;cursor:pointer}
    .form-error{color:#c0392b;font-size:.85rem}
  `]
})
export class CategoryEditModalComponent {
  @Input() mov!: MovimientoCategorizado;
  @Output() close   = new EventEmitter<void>();
  @Output() updated = new EventEmitter<string>();

  selected = '';
  saving = false;
  error = '';

  categories = Object.entries(CATEGORY_LABELS)
    .filter(([code]) => !['NOMINA','TRANSFERENCIAS'].includes(code))
    .map(([code, label]) => ({ code, label, icon: (CATEGORY_ICONS as any)[code] || '📦' }));

  constructor(private pfm: PfmService) {}

  confirm(): void {
    if (!this.selected) return;
    this.saving = true;
    this.pfm.overrideCategory(this.mov.txId, this.selected).subscribe({
      next: () => { this.saving = false; this.updated.emit(this.selected); this.close.emit(); },
      error: e => { this.saving = false; this.error = e?.error?.error || 'Error al guardar'; }
    });
  }
}

import { CATEGORY_ICONS } from '../../models/pfm.models';
