import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { DirectDebitService } from '../../services/direct-debit.service';
import { Mandate } from '../../models/mandate.model';

@Component({
  selector: 'app-cancel-mandate',
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">🗑️ Cancelar domiciliación</h2>
        <button class="btn-secondary" (click)="router.navigate(['/direct-debits'])">← Volver</button>
      </div>

      <div class="card" *ngIf="loadingMandate">
        <div class="skeleton-row" *ngFor="let i of [1,2,3]"></div>
      </div>

      <ng-container *ngIf="mandate && !loadingMandate">
        <div class="card mandate-summary">
          <h3 class="section-title">Domiciliación a cancelar</h3>
          <dl class="detail-list">
            <div class="detail-row"><dt>Acreedor</dt><dd>{{ mandate.creditorName }}</dd></div>
            <div class="detail-row"><dt>IBAN</dt><dd class="mono">{{ mandate.creditorIban }}</dd></div>
            <div class="detail-row"><dt>Referencia</dt><dd class="mono">{{ mandate.mandateRef }}</dd></div>
          </dl>
        </div>

        <div class="card warning-card">
          <p>⚠️ <strong>Atención:</strong> Al cancelar este mandato, el acreedor no podrá realizar nuevos cargos en tu cuenta. Esta acción no se puede deshacer.</p>
        </div>

        <div class="card">
          <h3 class="section-title">Verificación de seguridad</h3>
          <form [formGroup]="form" (ngSubmit)="cancel()" novalidate>
            <div class="form-group">
              <label class="form-label">Código OTP *</label>
              <input class="form-input otp-input" formControlName="otp" type="text"
                     inputmode="numeric" maxlength="6" placeholder="_ _ _ _ _ _"/>
              <span class="field-hint">Introduce el código de 6 dígitos enviado a tu dispositivo</span>
            </div>
            <div class="error-banner" *ngIf="errorMsg">⚠️ {{ errorMsg }}</div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="router.navigate(['/direct-debits'])">Cancelar</button>
              <button type="submit" class="btn-danger" [disabled]="form.invalid || loading">
                {{ loading ? 'Cancelando...' : '🗑️ Confirmar cancelación' }}
              </button>
            </div>
          </form>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page-container { font-family: Arial, sans-serif; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .page-title { color:#c62828; margin:0; font-size:1.4rem; }
    .card { background:#fff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,.08); padding:1.5rem; margin-bottom:1rem; }
    .btn-secondary { background:#fff; color:#1B3A6B; border:1px solid #1B3A6B; border-radius:6px; padding:.5rem 1rem; cursor:pointer; }
    .btn-danger { background:#c62828; color:#fff; border:none; border-radius:6px; padding:.65rem 1.4rem; cursor:pointer; font-weight:600; }
    .btn-danger:disabled { background:#ef9a9a; cursor:not-allowed; }
    .section-title { color:#1B3A6B; font-size:1rem; margin:0 0 1rem; border-bottom:2px solid #f0f0f0; padding-bottom:.5rem; }
    .detail-list { margin:0; }
    .detail-row { display:flex; justify-content:space-between; padding:.5rem 0; border-bottom:1px solid #f9f9f9; }
    .detail-row dt { color:#666; font-size:.85rem; }
    .detail-row dd { margin:0; font-weight:600; }
    .mono { font-family:'Courier New',monospace; font-size:.85rem; }
    .warning-card { background:#fff8e1; border-left:4px solid #f57f17; color:#555; font-size:.9rem; }
    .form-group { margin-bottom:1.2rem; }
    .form-label { display:block; font-size:.85rem; color:#444; font-weight:600; margin-bottom:.4rem; }
    .form-input { width:100%; padding:.7rem .9rem; border:1px solid #ddd; border-radius:6px; font-size:.95rem; box-sizing:border-box; }
    .form-input:focus { outline:none; border-color:#1B3A6B; box-shadow:0 0 0 3px rgba(27,58,107,.1); }
    .otp-input { font-size:1.5rem; text-align:center; letter-spacing:.3em; max-width:200px; }
    .field-hint { display:block; color:#888; font-size:.8rem; margin-top:.3rem; }
    .error-banner { background:#fce4ec; color:#c62828; border-radius:6px; padding:.75rem 1rem; margin-bottom:1rem; }
    .form-actions { display:flex; justify-content:flex-end; gap:.75rem; padding-top:1rem; border-top:1px solid #f0f0f0; }
    .skeleton-row { height:20px; background:#f0f0f0; border-radius:4px; margin-bottom:.75rem; }
  `]
})
export class CancelMandateComponent implements OnInit {
  mandate?: Mandate;
  loading = false;
  loadingMandate = true;
  errorMsg = '';

  form = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  constructor(private route: ActivatedRoute, public router: Router, private fb: FormBuilder, private service: DirectDebitService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getMandate(id).subscribe({
      next: m => { this.mandate = m; this.loadingMandate = false; },
      error: () => { this.errorMsg = 'No se pudo cargar la domiciliación.'; this.loadingMandate = false; }
    });
  }

  cancel(): void {
    if (this.form.invalid || !this.mandate) return;
    this.loading = true; this.errorMsg = '';
    this.service.cancelMandate(this.mandate.id, this.form.value.otp!).subscribe({
      next: () => this.router.navigate(['/direct-debits']),
      error: e => { this.errorMsg = e.message; this.loading = false; }
    });
  }
}
