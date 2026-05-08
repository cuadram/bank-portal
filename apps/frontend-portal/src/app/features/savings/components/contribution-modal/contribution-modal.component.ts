import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { SavingsService } from '../../services/savings.service';
import { AccountService, AccountSummary } from '../../../accounts/services/account.service';
import { ContributeRequest, GoalDetail, SavingsGoal } from '../../models/savings.models';

/**
 * ContributionModalComponent - Smart pantalla 'Aportar a meta' (US-024-04)
 *
 * Fase G.3 LOTE G.3.
 *
 * Pixel-perfect contra prototipo PROTO-FEAT-024-sprint26.html lineas 1614-1710
 * (screen-savings-contribute). LA-CORE-056 BLOQUEANTE en G-4.
 *
 * Ruta: /objetivos/:id/aportar (anadida en savings-routing.module en G.3)
 *
 * Estructura observada en prototipo y replicada:
 *   - breadcrumb: boton 'Volver' (al detalle) + texto 'Mis Metas / {goal.name} / Aportar'
 *   - layout grid 2fr/1fr: form izquierda · summary-box impacto saldos derecha
 *   - input importe XL (font-size 2xl) [10..5000] + hint
 *   - select cuenta origen (NO multi-cuenta real - ver OBS-005 LOTE 2.2)
 *   - quick-amount pills: 50€ · 100€ · 500€ · 1000€ (botones que setValue)
 *   - alert-info 'Segregación virtual' (ADR-040 · RN-F024-05/15)
 *   - summary-box: Aportación · Reservado actual · Reservado tras aportar · Progreso
 *     + Disponible · Disponible tras aportar · Saldo contable (sin cambio)
 *   - alert-warning si la aportacion cruza un hito 25/50/75/100% (preview RN-F024-09)
 *   - acciones: Cancelar (vuelve a detalle) + Confirmar aportacion (POST /contributions)
 *
 * Validaciones cliente (RN-F024-03):
 *   - amount: required, 10..5000, no debe llevar reservedAmount > targetAmount (preview)
 *
 * Manejo errores backend (contrato real SavingsExceptionHandler Fase E):
 *   - 422 INSUFFICIENT_FUNDS -> mensaje contextual (saldo en cuenta < amount)
 *   - 422 RESERVED_EXCEEDS_TARGET -> mensaje contextual (reservedAmount + amount > targetAmount)
 *   - 404 GOAL_NOT_FOUND -> redirect a lista
 *   - 403 GOAL_ACCESS_DENIED -> redirect a lista
 *   - 400 VALIDATION_FAILED -> mensaje del backend
 *
 * OBS-008 (registro Step 5): el prototipo muestra select multi-cuenta pero el
 * SavingsGoal solo tiene sourceAccountId opcional y el endpoint requiere
 * sourceAccountId obligatorio en ContributeRequest. Como no tenemos endpoint
 * /accounts en savings, asumimos goal.sourceAccountId como cuenta por defecto.
 * Si goal.sourceAccountId es undefined, el backend rechazara con 400 - se mostrara
 * el error y se ofrecera al usuario completar primero el campo en GoalEditForm.
 *
 * OBS-009 (registro Step 5): el prototipo muestra 'Disponible' y 'Saldo contable'
 * en el summary-box pero el frontend no tiene endpoint para obtener el saldo de
 * la cuenta origen aqui. Mostramos placeholders neutros con tooltip que indica
 * que el saldo real se mostrara cuando el backend exponga AccountBalanceService.
 *
 * OnPush + cdr.markForCheck en mutaciones
 * Sin signals · ReactiveForms · destroy$ + takeUntil
 *
 * FEAT-024 Sprint 26.
 */
const QUICK_AMOUNTS: ReadonlyArray<number> = [50, 100, 500, 1000];

@Component({
  selector: 'app-contribution-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="contribute">
      <div class="breadcrumb">
        <button type="button"
                class="btn btn-secondary btn-small"
                (click)="onCancel()"
                [disabled]="submitting"
                aria-label="Volver al detalle de la meta">
          ← Volver
        </button>
        <span class="breadcrumb-text">
          Mis Metas / {{ goal?.name || '...' }} / Aportar
        </span>
      </div>

      <div *ngIf="loading" class="loading" role="status" aria-live="polite">
        Cargando datos de la meta...
      </div>

      <div *ngIf="loadError" class="error-banner" role="alert">
        <span aria-hidden="true">⚠️</span>
        <span>{{ loadError }}</span>
        <button type="button" class="btn-link" (click)="onCancel()">Volver</button>
      </div>

      <div class="contribute-grid" *ngIf="!loading && !loadError && goal">
        <form class="form-card" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <h2 class="form-title">Aportar a "{{ goal.name }}"</h2>
          <p class="form-subtitle">Mueve fondos desde tu cuenta a esta meta</p>

          <div class="input-grid">
            <div class="field full-width">
              <label class="form-label" for="contribute-amount">Importe a aportar *</label>
              <input id="contribute-amount"
                     class="form-input amount-xl"
                     type="number"
                     formControlName="amount"
                     min="10"
                     max="5000"
                     step="10"
                     autocomplete="off">
              <div class="hint">Entre 10€ y 5.000€ por aportación</div>
              <div class="error" *ngIf="showError('amount', 'required')">El importe es obligatorio</div>
              <div class="error" *ngIf="showError('amount', 'min')">Mínimo 10€</div>
              <div class="error" *ngIf="showError('amount', 'max')">Máximo 5.000€</div>
            </div>

            <div class="field full-width">
              <label class="form-label" for="contribute-account">Cuenta origen *</label>
              <select id="contribute-account"
                      class="form-input"
                      formControlName="sourceAccountId">
                <option *ngIf="loadingAccounts" value="" disabled>Cargando cuentas…</option>
                <option *ngIf="!loadingAccounts && accounts.length === 0" value="" disabled>
                  No tienes cuentas disponibles
                </option>
                <option *ngFor="let acc of accounts; trackBy: trackByAccount"
                        [value]="acc.accountId">
                  {{ acc.alias }} · {{ acc.ibanMasked }} · Disponible {{ formatCurrency(acc.availableBalance) }}
                </option>
              </select>
              <div class="error" *ngIf="accountsError">{{ accountsError }}</div>
              <div class="error" *ngIf="showError('sourceAccountId', 'required')">
                Debes seleccionar una cuenta origen
              </div>
            </div>
          </div>

          <div class="quick-amounts" role="group" aria-label="Importes rapidos">
            <button type="button"
                    *ngFor="let preset of quickAmounts; trackBy: trackByValue"
                    class="freq-pill"
                    [class.active]="selectedAmount === preset"
                    [disabled]="submitting"
                    (click)="onQuickAmount(preset)">{{ preset }}€</button>
          </div>

          <aside class="alert-info" role="note">
            <span class="alert-icon" aria-hidden="true">🏦</span>
            <span class="alert-text">
              <strong>Segregación virtual:</strong>
              El importe se reservará pero seguirá en tu cuenta. Tu saldo contable no cambia;
              tu saldo disponible sí.
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
                    [disabled]="submitting || form.invalid || wouldExceedTarget">
              {{ submitting ? 'Aportando...' : 'Confirmar aportación' }}
            </button>
          </div>
        </form>

        <aside class="summary-col" aria-label="Resumen impacto saldos">
          <div class="summary-box">
            <h4 class="summary-title">Resumen</h4>
            <div class="summary-row">
              <span>Aportación</span>
              <strong [class.zero]="contributionAmount <= 0">+{{ formatCurrency(contributionAmount) }}</strong>
            </div>
            <div class="summary-row">
              <span>Reservado actual</span>
              <strong>{{ formatCurrency(goal.reservedAmount) }}</strong>
            </div>
            <div class="summary-row highlight-success" *ngIf="contributionAmount > 0 && !wouldExceedTarget">
              <span>Reservado tras aportar</span>
              <strong>{{ formatCurrency(reservedAfter) }}</strong>
            </div>
            <div class="summary-row highlight-error" *ngIf="wouldExceedTarget">
              <span>Reservado tras aportar</span>
              <strong>{{ formatCurrency(reservedAfter) }} ⚠️</strong>
            </div>
            <div class="summary-row" *ngIf="contributionAmount > 0">
              <span>Progreso</span>
              <strong>{{ progressBefore }}% → {{ progressAfter }}%</strong>
            </div>

            <hr class="summary-divider" />

            <div class="summary-row" *ngIf="selectedAccount">
              <span>Saldo disponible actual</span>
              <strong>{{ formatCurrency(selectedAccount.availableBalance) }}</strong>
            </div>
            <div class="summary-row" *ngIf="selectedAccount && contributionAmount > 0">
              <span>Disponible tras aportar</span>
              <strong [class.highlight-error]="selectedAccount.availableBalance - contributionAmount < 0">
                {{ formatCurrency(selectedAccount.availableBalance - contributionAmount) }}
              </strong>
            </div>
            <div class="summary-row muted" *ngIf="selectedAccount">
              <span>Saldo contable</span>
              <strong>(sin cambio · ADR-040)</strong>
            </div>
            <div class="summary-row muted" *ngIf="!selectedAccount">
              <span>Selecciona una cuenta para ver saldos</span>
            </div>
          </div>

          <aside class="alert-info alert-success"
                 *ngIf="willCrossMilestone"
                 role="note">
            <span class="alert-icon" aria-hidden="true">🎉</span>
            <span class="alert-text">
              Tras esta aportación alcanzarás el <strong>hito {{ nextMilestonePercent }}%</strong>
              y recibirás una notificación.
            </span>
          </aside>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .contribute {
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
    .contribute-grid {
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
    .form-input.amount-xl {
      text-align: right;
      font-size: var(--text-2xl, 24px);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
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
    .quick-amounts {
      display: flex;
      gap: var(--sp-2, 8px);
      margin-top: var(--sp-3, 12px);
      flex-wrap: wrap;
    }
    .freq-pill {
      padding: 6px 16px;
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-full, 9999px);
      background: var(--color-white, #fff);
      color: var(--color-text-primary, #1a1a1a);
      font-size: var(--text-sm, 14px);
      cursor: pointer;
      transition: background 150ms ease, border-color 150ms ease;
    }
    .freq-pill:hover:not(:disabled) {
      background: var(--color-bg-soft, #f3f4f6);
    }
    .freq-pill.active {
      background: var(--color-primary, #1B5E99);
      color: var(--color-white, #fff);
      border-color: var(--color-primary, #1B5E99);
    }
    .freq-pill:disabled { opacity: 0.5; cursor: not-allowed; }
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
    .alert-info.alert-success {
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
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--sp-2, 8px);
      margin-bottom: var(--sp-2, 8px);
      font-size: var(--text-sm, 14px);
      color: var(--color-text-primary, #1a1a1a);
    }
    .summary-row strong { font-variant-numeric: tabular-nums; }
    .summary-row .zero { color: var(--color-text-secondary, #6b7280); }
    .summary-row.highlight-success { color: var(--color-success, #2e7d32); }
    .summary-row.highlight-error { color: var(--color-error, #d32f2f); }
    .summary-row.muted strong { color: var(--color-text-secondary, #6b7280); }
    .summary-row .placeholder { color: var(--color-text-secondary, #6b7280); }
    .summary-divider {
      border: none;
      border-top: 1px solid var(--color-border, #e5e7eb);
      margin: var(--sp-3, 12px) 0;
    }

    @media (max-width: 900px) {
      .contribute-grid { grid-template-columns: 1fr; }
      .summary-box { position: static; }
      .input-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ContributionModalComponent implements OnInit, OnDestroy {
  readonly quickAmounts = QUICK_AMOUNTS;

  goal: SavingsGoal | null = null;
  form!: FormGroup;
  loading = true;
  loadError: string | null = null;
  submitting = false;
  submissionError: string | null = null;
  selectedAmount: number | null = null;

  // Derivados de form.value para preview tiempo real
  contributionAmount = 0;
  reservedAfter = 0;
  progressBefore = 0;
  progressAfter = 0;
  wouldExceedTarget = false;
  willCrossMilestone = false;
  nextMilestonePercent: number | null = null;

  private goalId: string = '';
  private readonly destroy$ = new Subject<void>();

  // OBS-008/OBS-009 (DR-S26-008, fix Step 7 Sprint 26):
  // Lista de cuentas del usuario (multi-cuenta real, fidelidad prototipo HITL G-2c).
  accounts: AccountSummary[] = [];
  loadingAccounts = false;
  accountsError: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly savingsService: SavingsService,
    private readonly accountService: AccountService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      amount:           [null, [Validators.required, Validators.min(10), Validators.max(5000)]],
      sourceAccountId:  ['', [Validators.required]]
    });

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recomputePreview());

    // OBS-008/OBS-009: cargar cuentas del usuario en paralelo a la meta.
    this.loadAccounts();

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

  // -------------------------------------------------------------------------
  // Carga
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
        this.applyDefaultAccountSelection();
        this.recomputePreview();
      }
      this.loading = false;
      this.cdr.markForCheck();
    });
  }

  /**
   * OBS-008 (DR-S26-008, fix Step 7): carga la lista real de cuentas del usuario
   * desde GET /api/v1/accounts. Reemplaza el shortcut anterior que mostraba una
   * sola opción hard-coded "Cuenta principal".
   *
   * Si la carga falla, dejamos el select vacío y mostramos error UX (el form
   * controla 'sourceAccountId' como required, así que el botón Confirmar quedará
   * deshabilitado).
   */
  private loadAccounts(): void {
    this.loadingAccounts = true;
    this.accountsError = null;
    this.accountService.getAccounts().pipe(
      catchError((err: HttpErrorResponse) => {
        this.accountsError = this.mapErrorToMessage(err, 'No se pudieron cargar tus cuentas.');
        return of([] as AccountSummary[]);
      }),
      takeUntil(this.destroy$)
    ).subscribe(accs => {
      this.accounts = accs;
      this.loadingAccounts = false;
      this.applyDefaultAccountSelection();
      this.cdr.markForCheck();
    });
  }

  /**
   * Aplica la cuenta origen por defecto cuando ambas (goal + accounts) están cargadas.
   * Prioridad: goal.sourceAccountId si está en la lista de cuentas; si no, primera cuenta.
   */
  private applyDefaultAccountSelection(): void {
    if (this.form.controls['sourceAccountId'].value) return;
    if (!this.goal || this.accounts.length === 0) return;
    const preferred = this.goal.sourceAccountId
      && this.accounts.some(a => a.accountId === this.goal!.sourceAccountId)
      ? this.goal.sourceAccountId
      : this.accounts[0].accountId;
    this.form.controls['sourceAccountId'].setValue(preferred);
  }

  /**
   * OBS-009 (DR-S26-008, fix Step 7): cuenta seleccionada actualmente para mostrar
   * saldos disponibles en el summary-box (Disponible · Disponible tras aportar).
   */
  get selectedAccount(): AccountSummary | null {
    const id = this.form?.controls['sourceAccountId']?.value;
    return this.accounts.find(a => a.accountId === id) || null;
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

  trackByAccount(_: number, acc: AccountSummary): string {
    return acc.accountId;
  }

  onQuickAmount(preset: number): void {
    if (this.submitting) return;
    this.form.controls['amount'].setValue(preset);
    this.form.controls['amount'].markAsTouched();
    this.selectedAmount = preset;
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
  // Preview tiempo real
  // -------------------------------------------------------------------------

  private recomputePreview(): void {
    if (!this.goal) {
      this.contributionAmount = 0;
      this.reservedAfter = 0;
      this.progressBefore = 0;
      this.progressAfter = 0;
      this.wouldExceedTarget = false;
      this.willCrossMilestone = false;
      this.nextMilestonePercent = null;
      return;
    }

    const v = this.form?.value ?? {};
    const amt = Number(v.amount) || 0;
    this.contributionAmount = amt;

    // Sincronizar selectedAmount con quick-amount pills
    this.selectedAmount = QUICK_AMOUNTS.includes(amt as never) ? amt : null;

    const target = this.goal.targetAmount ?? 0;
    const reserved = this.goal.reservedAmount ?? 0;
    this.reservedAfter = reserved + amt;
    this.wouldExceedTarget = this.reservedAfter > target;

    this.progressBefore = target > 0 ? Math.round((reserved / target) * 100) : 0;
    this.progressAfter = target > 0 ? Math.min(100, Math.round((this.reservedAfter / target) * 100)) : 0;

    // Detectar si la aportacion cruza un hito 25/50/75/100 (RN-F024-09)
    const milestones = [25, 50, 75, 100];
    const crossed = milestones.find(m => this.progressBefore < m && this.progressAfter >= m);
    if (crossed && amt > 0) {
      this.willCrossMilestone = true;
      this.nextMilestonePercent = crossed;
    } else {
      this.willCrossMilestone = false;
      this.nextMilestonePercent = null;
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
    if (this.wouldExceedTarget) {
      this.submissionError = 'La aportacion superaria el objetivo. Reduce el importe.';
      return;
    }
    if (!this.goalId) return;

    this.submissionError = null;
    const v = this.form.value;
    const req: ContributeRequest = {
      amount: Number(v.amount),
      sourceAccountId: v.sourceAccountId
    };

    this.submitting = true;
    this.savingsService.contribute(this.goalId, req)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting = false;
          // Volver al detalle - el detail recarga via getDetail en ngOnInit
          this.router.navigate(['/objetivos', this.goalId]);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.submissionError = this.mapErrorToMessage(err, 'No se ha podido realizar la aportación.');
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
        return backendMsg || 'Saldo insuficiente en la cuenta origen para esta aportación.';
      }
      if (code === 'RESERVED_EXCEEDS_TARGET') {
        return backendMsg || 'La aportación superaría el objetivo. Reduce el importe.';
      }
      return backendMsg || fallback;
    }
    if (err.status === 400) {
      if (code === 'VALIDATION_FAILED' && backendMsg) return backendMsg;
      return backendMsg || 'Los datos enviados no son válidos.';
    }
    if (err.status === 409 && code === 'CONCURRENCY_CONFLICT') {
      // BUG-S26-Q-008 / DR-S26-007 (B.4): tras 1 retry automatico en SavingsService,
      // si persiste 409, mostramos mensaje UX inline. Deuda DEBT-Q-073.
      return 'Conflicto de concurrencia detectado. Espera unos segundos y reintenta la aportación.';
    }
    if (err.status === 401) return 'Tu sesión ha caducado. Inicia sesión de nuevo.';
    if (err.status === 0)   return 'Sin conexión al servidor. Reintenta más tarde.';
    return fallback;
  }
}
