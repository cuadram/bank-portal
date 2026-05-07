import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';

import { SavingsService } from '../../services/savings.service';
import { CloseResult, GoalDetail, SavingsGoal } from '../../models/savings.models';

/**
 * GoalCloseModalComponent - Smart pantalla 'Cerrar meta' (US-024-06 · RN-F024-11 SCA)
 *
 * Fase G.3 LOTE G.3.
 *
 * Pantalla NO presente en el prototipo (el cierre es accion del boton 'Cerrar' del
 * detalle linea 1371 con anotacion ANNOT-07). Diseno propio basado en LLD §7
 * que describe el flujo SCA con OTP.
 *
 * Ruta: /objetivos/:id/cerrar (anadida en savings-routing.module en G.3)
 *
 * Flujo SCA RN-F024-11 (LLD §7 + SavingsExceptionHandler.handleInvalidOtp):
 *   1. Usuario navega a /objetivos/:id/cerrar
 *   2. Componente carga detail (GET /goals/:id) para mostrar resumen meta
 *   3. Usuario confirma cierre con boton primario
 *   4. Frontend invoca DELETE /goals/:id (SIN header X-OTP)
 *   5a. Si reservedAmount <= 30€ -> backend 200 con CloseResult -> exito + redirect lista
 *   5b. Si reservedAmount > 30€ -> backend 401 con error=INVALID_OTP/OTP_REQUIRED
 *       -> mostrar <bp-otp-input> y esperar OTP del usuario
 *   6. Cuando bp-otp-input emite (otpComplete), invocar DELETE de nuevo CON header X-OTP
 *   7a. Si OTP valido -> exito (CloseResult)
 *   7b. Si OTP invalido -> backend 401 con error=INVALID_OTP -> error en input + retry
 *
 * NOTA: el contrato exacto del codigo de error '401 OTP_REQUIRED' lo define el
 * SavingsController (Fase E commit 2c6c258), que diferencia entre:
 *   - 401 con error='OTP_REQUIRED' cuando body.otp == null y reservedAmount > threshold
 *   - 401 con error='INVALID_OTP' cuando OTP enviado es invalido
 * El frontend trata ambos como 'requiere OTP' pero distingue el mensaje.
 *
 * Composicion:
 *   - <bp-otp-input> standalone component de shared/components/otp-input
 *     Importado directamente en savings.module imports (no declarations)
 *
 * Resultado de cierre exitoso:
 *   - Mostrar CloseResult (returnedAmount, returnAccountId, closedAt) brevemente
 *   - Redirigir a /objetivos tras 1.5s
 *
 * OnPush + cdr.markForCheck en mutaciones
 * Sin signals · sin ReactiveForms (solo OTP via standalone component) · destroy$ + takeUntil
 *
 * FEAT-024 Sprint 26.
 */
const SCA_THRESHOLD = 30; // EUR · alineado con bank.savings.closure.sca-threshold (LLD-backend §6 + ADR-040)

@Component({
  selector: 'app-goal-close-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="goal-close">
      <div class="breadcrumb">
        <button type="button"
                class="btn btn-secondary btn-small"
                (click)="onCancel()"
                [disabled]="submitting"
                aria-label="Cancelar y volver al detalle">
          ← Cancelar
        </button>
        <span class="breadcrumb-text">
          Mis Metas / {{ goal?.name || '...' }} / Cerrar
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

      <ng-container *ngIf="!loading && !loadError && goal && !closeResult">
        <div class="close-card">
          <div class="close-header">
            <span class="close-icon" aria-hidden="true">🗑</span>
            <div>
              <h2 class="close-title">¿Cerrar la meta "{{ goal.name }}"?</h2>
              <p class="close-subtitle">Esta acción es irreversible. La meta pasará al estado CERRADA.</p>
            </div>
          </div>

          <div class="summary-rows">
            <div class="summary-row">
              <span>Saldo reservado actual</span>
              <strong>{{ formatCurrency(goal.reservedAmount) }}</strong>
            </div>
            <div class="summary-row highlight">
              <span>Se devolverá a tu cuenta</span>
              <strong>{{ formatCurrency(goal.reservedAmount) }}</strong>
            </div>
            <div class="summary-row">
              <span>Estado tras cerrar</span>
              <strong>CERRADA</strong>
            </div>
          </div>

          <aside class="alert-info alert-warning" *ngIf="requiresSca" role="note">
            <span class="alert-icon" aria-hidden="true">🔐</span>
            <span class="alert-text">
              Por importe superior a {{ formatCurrency(scaThreshold) }} es necesaria una
              <strong>verificación 2FA</strong>. Introduce el código de tu autenticador
              cuando se solicite.
            </span>
          </aside>

          <aside class="alert-info" *ngIf="!requiresSca" role="note">
            <span class="alert-icon" aria-hidden="true">ℹ️</span>
            <span class="alert-text">
              No se requiere 2FA para esta operación (saldo reservado &lt; {{ formatCurrency(scaThreshold) }}).
            </span>
          </aside>

          <div *ngIf="showOtp" class="otp-section">
            <label class="form-label">Código 2FA</label>
            <bp-otp-input
              [hasError]="!!otpError"
              [disabled]="submitting"
              (otpComplete)="onOtpComplete($event)"></bp-otp-input>
            <div class="error" *ngIf="otpError">{{ otpError }}</div>
            <div class="hint" *ngIf="!otpError">
              Introduce el código de 6 dígitos de tu app autenticadora.
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
            <button type="button"
                    class="btn btn-primary btn-danger"
                    (click)="onConfirmClose()"
                    [disabled]="submitting || showOtp">
              {{ submitting ? 'Cerrando...' : 'Cerrar meta' }}
            </button>
          </div>
        </div>
      </ng-container>

      <div class="success-card" *ngIf="closeResult" role="status" aria-live="polite">
        <span class="success-icon" aria-hidden="true">✓</span>
        <h2 class="success-title">Meta cerrada correctamente</h2>
        <p class="success-subtitle">
          Se han devuelto <strong>{{ formatCurrency(closeResult.returnedAmount) }}</strong>
          a tu cuenta de origen.
        </p>
        <p class="success-redirect">Redirigiendo a Mis Metas...</p>
      </div>
    </section>
  `,
  styles: [`
    .goal-close {
      display: block;
      padding: var(--sp-6, 24px);
      max-width: 700px;
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
    .close-card {
      background: var(--color-white, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 12px);
      padding: var(--sp-5, 20px);
      box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
    }
    .close-header {
      display: flex;
      gap: var(--sp-3, 12px);
      align-items: flex-start;
      margin-bottom: var(--sp-4, 16px);
    }
    .close-icon {
      font-size: 32px;
      flex-shrink: 0;
    }
    .close-title {
      font-size: var(--text-xl, 20px);
      margin: 0 0 var(--sp-2, 8px) 0;
      color: var(--color-text-primary, #1a1a1a);
      font-weight: 600;
    }
    .close-subtitle {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-secondary, #6b7280);
      margin: 0;
    }
    .summary-rows {
      background: var(--color-bg-soft, #f9fafb);
      border-radius: var(--radius-md, 8px);
      padding: var(--sp-4, 16px);
      margin-bottom: var(--sp-4, 16px);
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
    .summary-row:last-child { margin-bottom: 0; }
    .summary-row strong { font-variant-numeric: tabular-nums; }
    .summary-row.highlight { color: var(--color-success, #2e7d32); }
    .alert-info {
      display: flex;
      gap: var(--sp-3, 12px);
      align-items: flex-start;
      padding: var(--sp-4, 16px);
      background: var(--color-info-light, #e3f2fd);
      border-left: 4px solid var(--color-info, #1976d2);
      border-radius: var(--radius-md, 8px);
      margin-bottom: var(--sp-4, 16px);
    }
    .alert-info.alert-warning {
      background: var(--color-warning-light, #fff8e1);
      border-left-color: var(--color-warning, #b26a00);
    }
    .alert-icon { flex-shrink: 0; font-size: var(--text-lg, 18px); }
    .alert-text {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-primary, #1a1a1a);
      line-height: 1.5;
    }
    .otp-section {
      padding: var(--sp-4, 16px);
      background: var(--color-bg-soft, #f9fafb);
      border-radius: var(--radius-md, 8px);
      margin-bottom: var(--sp-4, 16px);
    }
    .form-label {
      font-size: var(--text-sm, 14px);
      font-weight: 500;
      color: var(--color-text-primary, #1a1a1a);
      margin-bottom: var(--sp-2, 8px);
      display: block;
    }
    .hint {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin-top: var(--sp-2, 8px);
    }
    .error {
      font-size: var(--text-xs, 12px);
      color: var(--color-error, #d32f2f);
      margin-top: var(--sp-2, 8px);
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
    .btn-primary.btn-danger {
      background: var(--color-error, #d32f2f);
    }
    .btn-primary.btn-danger:hover:not(:disabled) {
      background: #b71c1c;
    }
    .btn-secondary {
      background: var(--color-white, #fff);
      color: var(--color-text-primary, #1a1a1a);
      border: 1px solid var(--color-border, #e5e7eb);
    }
    .btn-secondary:hover:not(:disabled) { background: var(--color-bg-soft, #f3f4f6); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .success-card {
      background: var(--color-white, #fff);
      border: 1px solid var(--color-success, #2e7d32);
      border-radius: var(--radius-lg, 12px);
      padding: var(--sp-6, 24px);
      box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));
      text-align: center;
    }
    .success-icon {
      display: inline-flex;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--color-success, #2e7d32);
      color: var(--color-white, #fff);
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: var(--sp-3, 12px);
    }
    .success-title {
      font-size: var(--text-xl, 20px);
      color: var(--color-text-primary, #1a1a1a);
      font-weight: 600;
      margin: 0 0 var(--sp-2, 8px) 0;
    }
    .success-subtitle {
      font-size: var(--text-sm, 14px);
      color: var(--color-text-primary, #1a1a1a);
      margin: 0 0 var(--sp-3, 12px) 0;
    }
    .success-redirect {
      font-size: var(--text-xs, 12px);
      color: var(--color-text-secondary, #6b7280);
      margin: 0;
    }
  `]
})
export class GoalCloseModalComponent implements OnInit, OnDestroy {
  readonly scaThreshold = SCA_THRESHOLD;

  goal: SavingsGoal | null = null;
  loading = true;
  loadError: string | null = null;
  submitting = false;
  submissionError: string | null = null;
  showOtp = false;
  otpError: string | null = null;
  closeResult: CloseResult | null = null;

  private goalId: string = '';
  private readonly destroy$ = new Subject<void>();
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly savingsService: SavingsService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
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
    if (this.redirectTimer) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -------------------------------------------------------------------------
  // Estado derivado
  // -------------------------------------------------------------------------

  get requiresSca(): boolean {
    return !!this.goal && (this.goal.reservedAmount ?? 0) > this.scaThreshold;
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
        // Bloquear cierre si la meta ya esta CLOSED o COMPLETED
        if (this.goal.status === 'CLOSED' || this.goal.status === 'COMPLETED') {
          this.loadError = 'Esta meta ya esta cerrada.';
        }
      }
      this.loading = false;
      this.cdr.markForCheck();
    });
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

  /**
   * Primer intento de cierre: DELETE sin OTP.
   * Si el backend exige SCA (reservedAmount > 30€), responde 401 con
   * error='OTP_REQUIRED' y mostramos <bp-otp-input>.
   * Si reservedAmount <= 30€ el cierre procede directamente con 200.
   */
  onConfirmClose(): void {
    if (this.submitting || !this.goalId) return;
    this.submissionError = null;
    this.otpError = null;
    this.executeClose();
  }

  /**
   * Reintento con OTP. Llamado desde (otpComplete) del bp-otp-input.
   */
  onOtpComplete(otp: string): void {
    if (this.submitting || !this.goalId || !otp) return;
    this.submissionError = null;
    this.otpError = null;
    this.executeClose(otp);
  }

  private executeClose(otp?: string): void {
    this.submitting = true;
    this.cdr.markForCheck();

    this.savingsService.closeGoal(this.goalId, otp)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: CloseResult) => {
          this.submitting = false;
          this.closeResult = result;
          this.showOtp = false;
          this.cdr.markForCheck();
          // Redirect a Mis Metas tras 1.5s mostrando confirmacion
          this.redirectTimer = setTimeout(() => {
            this.router.navigate(['/objetivos']);
          }, 1500);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting = false;
          this.handleError(err, !!otp);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Distingue:
   *  - 401 OTP_REQUIRED (primer intento sin OTP) -> mostrar bp-otp-input
   *  - 401 INVALID_OTP (OTP enviado erroneo)     -> error en input + retry
   *  - resto                                     -> submissionError generico
   */
  private handleError(err: HttpErrorResponse, otpWasSent: boolean): void {
    const code: string | undefined = err.error?.error;
    const backendMsg: string | undefined = err.error?.message;

    if (err.status === 401 && (code === 'OTP_REQUIRED' || (code === 'INVALID_OTP' && !otpWasSent))) {
      // Primer intento o backend exige OTP pero el usuario no lo envio
      this.showOtp = true;
      this.otpError = null;
      return;
    }

    if (err.status === 401 && code === 'INVALID_OTP' && otpWasSent) {
      // OTP enviado y rechazado -> mostrar error en el input pero seguir mostrandolo
      this.showOtp = true;
      this.otpError = backendMsg || 'El código 2FA no es válido. Inténtalo de nuevo.';
      return;
    }

    // Otros errores -> banner de error general
    this.showOtp = false;
    this.submissionError = this.mapErrorToMessage(err, 'No se ha podido cerrar la meta.');
  }

  // -------------------------------------------------------------------------
  // Mapeo errores backend
  // -------------------------------------------------------------------------

  private mapErrorToMessage(err: HttpErrorResponse, fallback: string): string {
    const code: string | undefined = err.error?.error;
    const backendMsg: string | undefined = err.error?.message;

    if (err.status === 404 && code === 'GOAL_NOT_FOUND') {
      return 'La meta no existe o ya ha sido cerrada.';
    }
    if (err.status === 403 && code === 'GOAL_ACCESS_DENIED') {
      return 'No tienes acceso a esta meta.';
    }
    if (err.status === 409 && code === 'ILLEGAL_STATE') {
      return backendMsg || 'La meta no se puede cerrar en su estado actual.';
    }
    if (err.status === 422) {
      return backendMsg || fallback;
    }
    if (err.status === 400) {
      if (code === 'VALIDATION_FAILED' && backendMsg) return backendMsg;
      return backendMsg || 'Los datos enviados no son válidos.';
    }
    if (err.status === 401) return 'Tu sesión ha caducado. Inicia sesión de nuevo.';
    if (err.status === 0)   return 'Sin conexión al servidor. Reintenta más tarde.';
    return fallback;
  }
}
