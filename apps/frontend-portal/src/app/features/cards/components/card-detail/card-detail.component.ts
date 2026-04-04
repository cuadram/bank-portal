import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Card } from '../../models/card.model';
import { CardService } from '../../services/card.service';

@Component({
  selector: 'app-card-detail',
  template: `
    <div class="page-container">

      <!-- Skeleton -->
      <div *ngIf="loading" class="skeleton-page">
        <div class="sk-header"></div>
        <div class="sk-card"></div>
      </div>

      <ng-container *ngIf="card && !loading">

        <!-- Header -->
        <div class="page-header">
          <div>
            <h2 class="page-title">💎 Detalle de tarjeta</h2>
            <p class="page-subtitle">{{ card.cardType === 'DEBIT' ? 'Tarjeta de Débito' : 'Tarjeta de Crédito' }}</p>
          </div>
          <button class="btn-secondary" (click)="router.navigate(['/cards'])">← Volver</button>
        </div>

        <!-- Tarjeta visual -->
        <div class="card-visual" [class.card-blocked]="card.status==='BLOCKED'">
          <div class="card-top">
            <span class="card-type-label">{{ card.cardType === 'DEBIT' ? 'DÉBITO' : 'CRÉDITO' }}</span>
            <span class="card-badge" [class.badge-active]="card.status==='ACTIVE'" [class.badge-blocked]="card.status==='BLOCKED'">
              {{ card.status === 'ACTIVE' ? 'Activa' : card.status === 'BLOCKED' ? 'Bloqueada' : card.status }}
            </span>
          </div>
          <div class="card-chip">◼◼◼</div>
          <div class="card-pan">{{ card.panMasked }}</div>
          <div class="card-bottom">
            <div>
              <div class="card-meta-label">VENCIMIENTO</div>
              <div class="card-meta-value">{{ card.expirationDate }}</div>
            </div>
            <div class="card-logo">{{ card.cardType === 'CREDIT' ? 'VISA' : 'MC' }}</div>
          </div>
        </div>

        <!-- Feedback global -->
        <div class="alert alert-success" *ngIf="actionSuccess">✅ Operación realizada correctamente.</div>
        <div class="alert alert-error" *ngIf="actionError">❌ {{ actionError }}</div>

        <!-- Acciones rápidas -->
        <div class="actions-grid">
          <button class="action-btn" (click)="toggleAction('limits')" [class.action-active]="activeAction==='limits'">
            <span class="action-icon">✏️</span>
            <span>Límites</span>
          </button>
          <button class="action-btn" (click)="toggleAction('pin')" [class.action-active]="activeAction==='pin'"
                  [disabled]="card.status==='BLOCKED'">
            <span class="action-icon">🔑</span>
            <span>Cambiar PIN</span>
          </button>
          <button class="action-btn action-btn--danger" *ngIf="card.status==='ACTIVE'"
                  (click)="toggleAction('block')" [class.action-active]="activeAction==='block'">
            <span class="action-icon">🔒</span>
            <span>Bloquear</span>
          </button>
          <button class="action-btn action-btn--success" *ngIf="card.status==='BLOCKED'"
                  (click)="toggleAction('unblock')" [class.action-active]="activeAction==='unblock'">
            <span class="action-icon">🔓</span>
            <span>Desbloquear</span>
          </button>
        </div>

        <!-- Panel: Límites -->
        <div class="panel" *ngIf="activeAction==='limits'">
          <h3 class="panel-title">Modificar límites</h3>
          <form [formGroup]="limitsForm" (ngSubmit)="submitLimits()" novalidate>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Límite diario ({{ card.dailyLimitMin | currency:'EUR':'symbol':'1.0-0':'es' }} – {{ card.dailyLimitMax | currency:'EUR':'symbol':'1.0-0':'es' }})</label>
                <input class="form-input" type="number" formControlName="dailyLimit"/>
              </div>
              <div class="form-group">
                <label class="form-label">Límite mensual ({{ card.monthlyLimitMin | currency:'EUR':'symbol':'1.0-0':'es' }} – {{ card.monthlyLimitMax | currency:'EUR':'symbol':'1.0-0':'es' }})</label>
                <input class="form-input" type="number" formControlName="monthlyLimit"/>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Código OTP</label>
              <input class="form-input otp-input" type="text" formControlName="otpCode" maxlength="6" placeholder="_ _ _ _ _ _"/>
            </div>
            <div class="field-error" *ngIf="limitsForm.hasError('monthlyBelowDaily')">El límite mensual debe ser mayor que el diario</div>
            <div class="panel-actions">
              <button type="button" class="btn-secondary" (click)="activeAction='none'">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="limitsForm.invalid">Guardar límites</button>
            </div>
          </form>
        </div>

        <!-- Panel: PIN -->
        <div class="panel" *ngIf="activeAction==='pin'">
          <h3 class="panel-title">Cambiar PIN</h3>
          <form [formGroup]="pinForm" (ngSubmit)="submitPin()" novalidate>
            <div class="form-group">
              <label class="form-label">Nuevo PIN (4 dígitos)</label>
              <input class="form-input otp-input" type="password" formControlName="newPin" maxlength="4" placeholder="••••"/>
              <span class="field-error" *ngIf="pinForm.get('newPin')!.hasError('pinTrivial') && pinForm.get('newPin')!.touched">
                PIN demasiado simple (evita 1234, 0000, etc.)
              </span>
            </div>
            <div class="form-group">
              <label class="form-label">Código OTP</label>
              <input class="form-input otp-input" type="text" formControlName="otpCode" maxlength="6" placeholder="_ _ _ _ _ _"/>
            </div>
            <div class="panel-actions">
              <button type="button" class="btn-secondary" (click)="activeAction='none'">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="pinForm.invalid">Cambiar PIN</button>
            </div>
          </form>
        </div>

        <!-- Panel: Bloquear -->
        <div class="panel panel--warning" *ngIf="activeAction==='block'">
          <h3 class="panel-title">🔒 Bloquear tarjeta</h3>
          <p class="panel-desc">Al bloquear la tarjeta no podrás realizar pagos ni retiradas. Puedes desbloquearla en cualquier momento.</p>
          <div class="form-group">
            <label class="form-label">Código OTP</label>
            <input class="form-input otp-input" type="text" #blockOtp maxlength="6" placeholder="_ _ _ _ _ _"/>
          </div>
          <div class="panel-actions">
            <button type="button" class="btn-secondary" (click)="activeAction='none'">Cancelar</button>
            <button type="button" class="btn-danger" (click)="blockCard(blockOtp.value)">Confirmar bloqueo</button>
          </div>
        </div>

        <!-- Panel: Desbloquear -->
        <div class="panel panel--info" *ngIf="activeAction==='unblock'">
          <h3 class="panel-title">🔓 Desbloquear tarjeta</h3>
          <p class="panel-desc">La tarjeta volverá a estar operativa inmediatamente.</p>
          <div class="form-group">
            <label class="form-label">Código OTP</label>
            <input class="form-input otp-input" type="text" #unblockOtp maxlength="6" placeholder="_ _ _ _ _ _"/>
          </div>
          <div class="panel-actions">
            <button type="button" class="btn-secondary" (click)="activeAction='none'">Cancelar</button>
            <button type="button" class="btn-primary" (click)="unblockCard(unblockOtp.value)">Confirmar desbloqueo</button>
          </div>
        </div>

        <!-- Info adicional -->
        <div class="info-card">
          <h3 class="panel-title">Información de la cuenta</h3>
          <div class="info-row"><span class="info-label">Cuenta asociada</span><span class="mono">{{ card.accountId }}</span></div>
          <div class="info-row"><span class="info-label">Límite diario actual</span><span>{{ card.dailyLimit | currency:'EUR':'symbol':'1.2-2':'es' }}</span></div>
          <div class="info-row"><span class="info-label">Límite mensual actual</span><span>{{ card.monthlyLimit | currency:'EUR':'symbol':'1.2-2':'es' }}</span></div>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .page-container { font-family: Arial, sans-serif; max-width: 720px; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; }
    .page-title { color:#1B3A6B; margin:0; font-size:1.4rem; }
    .page-subtitle { color:#888; margin:.25rem 0 0; font-size:.9rem; }
    .btn-secondary { background:#fff; color:#1B3A6B; border:1px solid #1B3A6B; border-radius:6px; padding:.5rem 1rem; cursor:pointer; font-size:.85rem; }
    .btn-primary { background:#1B3A6B; color:#fff; border:none; border-radius:6px; padding:.6rem 1.2rem; cursor:pointer; font-weight:600; font-size:.9rem; }
    .btn-primary:disabled { background:#9db4d0; cursor:not-allowed; }
    .btn-danger { background:#c62828; color:#fff; border:none; border-radius:6px; padding:.6rem 1.2rem; cursor:pointer; font-weight:600; }

    /* Tarjeta visual */
    .card-visual {
      background: linear-gradient(135deg,#1B3A6B 0%,#2d5aa0 60%,#1a4080 100%);
      border-radius:16px; padding:1.5rem 2rem; color:#fff; margin-bottom:1.5rem;
      box-shadow:0 8px 24px rgba(27,58,107,.35); position:relative; overflow:hidden;
    }
    .card-visual::before { content:''; position:absolute; top:-40px; right:-40px; width:160px; height:160px; border-radius:50%; background:rgba(255,255,255,.06); }
    .card-blocked { background:linear-gradient(135deg,#5d5d5d,#3d3d3d); }
    .card-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; }
    .card-type-label { font-size:.7rem; letter-spacing:.12em; font-weight:700; opacity:.8; }
    .card-badge { font-size:.7rem; font-weight:700; padding:.25rem .7rem; border-radius:20px; }
    .badge-active { background:rgba(46,125,50,.35); color:#a5d6a7; }
    .badge-blocked { background:rgba(198,40,40,.35); color:#ef9a9a; }
    .card-chip { font-size:1.2rem; opacity:.6; margin:.5rem 0; }
    .card-pan { font-size:1.2rem; font-family:'Courier New',monospace; letter-spacing:.15em; font-weight:600; margin:.5rem 0; }
    .card-bottom { display:flex; justify-content:space-between; align-items:flex-end; margin-top:.5rem; }
    .card-meta-label { font-size:.6rem; letter-spacing:.1em; opacity:.6; }
    .card-meta-value { font-size:.85rem; font-weight:600; }
    .card-logo { font-size:1.1rem; font-weight:900; opacity:.85; }

    /* Alertas */
    .alert { padding:.75rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:.9rem; }
    .alert-success { background:#e8f5e9; color:#2e7d32; }
    .alert-error { background:#fce4ec; color:#c62828; }

    /* Acciones */
    .actions-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:.75rem; margin-bottom:1.5rem; }
    .action-btn { display:flex; flex-direction:column; align-items:center; gap:.4rem; padding:1rem; background:#fff;
      border:2px solid #e8edf5; border-radius:10px; cursor:pointer; font-size:.85rem; font-weight:600; color:#1B3A6B;
      transition:all .15s; }
    .action-btn:hover { border-color:#1B3A6B; background:#f0f4fb; }
    .action-btn.action-active { border-color:#1B3A6B; background:#e8edf5; }
    .action-btn:disabled { opacity:.4; cursor:not-allowed; }
    .action-btn--danger { color:#c62828; }
    .action-btn--danger:hover { border-color:#c62828; background:#fce4ec; }
    .action-btn--success { color:#2e7d32; }
    .action-btn--success:hover { border-color:#2e7d32; background:#e8f5e9; }
    .action-icon { font-size:1.4rem; }

    /* Panel de acción */
    .panel { background:#fff; border-radius:10px; box-shadow:0 2px 12px rgba(0,0,0,.08); padding:1.5rem; margin-bottom:1rem; border-top:3px solid #1B3A6B; }
    .panel--warning { border-top-color:#f57f17; }
    .panel--info { border-top-color:#2e7d32; }
    .panel-title { color:#1B3A6B; margin:0 0 1rem; font-size:1rem; }
    .panel-desc { color:#555; font-size:.9rem; margin-bottom:1rem; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .form-group { margin-bottom:1rem; }
    .form-label { display:block; font-size:.8rem; color:#444; font-weight:600; margin-bottom:.35rem; }
    .form-input { width:100%; padding:.65rem .9rem; border:1px solid #ddd; border-radius:6px; font-size:.9rem; box-sizing:border-box; }
    .form-input:focus { outline:none; border-color:#1B3A6B; box-shadow:0 0 0 3px rgba(27,58,107,.1); }
    .otp-input { font-size:1.2rem; text-align:center; letter-spacing:.2em; max-width:180px; }
    .field-error { color:#c62828; font-size:.8rem; margin-top:.25rem; }
    .panel-actions { display:flex; justify-content:flex-end; gap:.5rem; padding-top:1rem; border-top:1px solid #f0f0f0; margin-top:.5rem; }

    /* Info card */
    .info-card { background:#fff; border-radius:10px; box-shadow:0 2px 12px rgba(0,0,0,.08); padding:1.5rem; }
    .info-row { display:flex; justify-content:space-between; padding:.6rem 0; border-bottom:1px solid #f5f5f5; font-size:.9rem; }
    .info-label { color:#666; }
    .mono { font-family:'Courier New',monospace; font-size:.85rem; }

    /* Skeleton */
    .skeleton-page { }
    .sk-header { height:40px; background:#e0e0e0; border-radius:8px; margin-bottom:1rem; width:40%; }
    .sk-card { height:200px; background:linear-gradient(135deg,#ddd,#ccc); border-radius:16px; }
  `]
})
export class CardDetailComponent implements OnInit {
  card?: Card;
  loading = true;
  activeAction: 'none' | 'block' | 'unblock' | 'limits' | 'pin' = 'none';
  limitsForm!: FormGroup;
  pinForm!: FormGroup;
  actionSuccess = false;
  actionError = '';

  constructor(private route: ActivatedRoute, public router: Router, private cardService: CardService, private fb: FormBuilder) {}

  ngOnInit(): void {
    const cardId = this.route.snapshot.paramMap.get('id')!;
    this.cardService.getCard(cardId).subscribe({
      next: card => { this.card = card; this.loading = false; this.initLimitsForm(card); this.initPinForm(); },
      error: () => { this.loading = false; }
    });
  }

  toggleAction(action: typeof this.activeAction): void {
    this.activeAction = this.activeAction === action ? 'none' : action;
    this.actionSuccess = false; this.actionError = '';
  }

  initLimitsForm(card: Card): void {
    this.limitsForm = this.fb.group({
      dailyLimit:   [card.dailyLimit,   [Validators.required, Validators.min(card.dailyLimitMin),   Validators.max(card.dailyLimitMax)]],
      monthlyLimit: [card.monthlyLimit, [Validators.required, Validators.min(card.monthlyLimitMin), Validators.max(card.monthlyLimitMax)]],
      otpCode:      ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    }, { validators: this.monthlyAboveDailyValidator });
  }

  monthlyAboveDailyValidator(g: AbstractControl): ValidationErrors | null {
    return g.get('monthlyLimit')!.value < g.get('dailyLimit')!.value ? { monthlyBelowDaily: true } : null;
  }

  submitLimits(): void {
    if (this.limitsForm.invalid || !this.card) return;
    const { dailyLimit, monthlyLimit, otpCode } = this.limitsForm.value;
    this.cardService.updateLimits(this.card.id, { dailyLimit, monthlyLimit, otpCode }).subscribe({
      next: () => { this.actionSuccess = true; this.activeAction = 'none'; },
      error: e => { this.actionError = e.error?.message || 'Error al actualizar límites'; }
    });
  }

  initPinForm(): void {
    this.pinForm = this.fb.group({
      newPin:  ['', [Validators.required, Validators.pattern(/^\d{4}$/), this.trivialPinValidator]],
      otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  trivialPinValidator(ctrl: AbstractControl): ValidationErrors | null {
    return /^(\d)\1{3}$|^1234$|^4321$|^0000$|^9999$/.test(ctrl.value) ? { pinTrivial: true } : null;
  }

  submitPin(): void {
    if (this.pinForm.invalid || !this.card) return;
    const { newPin, otpCode } = this.pinForm.value;
    this.cardService.changePin(this.card.id, { newPin, otpCode }).subscribe({
      next: () => { this.actionSuccess = true; this.activeAction = 'none'; this.pinForm.reset(); },
      error: e => { this.actionError = e.error?.message || 'Error al cambiar PIN'; }
    });
  }

  blockCard(otpCode: string): void {
    if (!this.card) return;
    this.cardService.blockCard(this.card.id, otpCode).subscribe({
      next: () => { this.card!.status = 'BLOCKED'; this.activeAction = 'none'; this.actionSuccess = true; },
      error: e => { this.actionError = e.error?.message || 'Error al bloquear'; }
    });
  }

  unblockCard(otpCode: string): void {
    if (!this.card) return;
    this.cardService.unblockCard(this.card.id, otpCode).subscribe({
      next: () => { this.card!.status = 'ACTIVE'; this.activeAction = 'none'; this.actionSuccess = true; },
      error: e => { this.actionError = e.error?.message || 'Error al desbloquear'; }
    });
  }
}
