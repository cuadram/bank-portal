import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, timer, throwError } from 'rxjs';
import { retry } from 'rxjs/operators';
import {
  SavingsGoal, GoalDetail, GoalStatus, Allocation, AutoRule, Milestone,
  CloseResult, SavingsWidget, Page,
  CreateGoalRequest, UpdateGoalRequest, ContributeRequest, AutoRuleRequest
} from '../models/savings.models';

/**
 * Servicio HTTP — Módulo Savings (Objetivos de Ahorro).
 * Base: /api/v1/savings · Auth: JWT via interceptor.
 * FEAT-024 Sprint 26 · LLD-frontend §4.
 *
 * Convenciones:
 * - Patrón clásico HttpClient + Observable<T> (consistente con PfmService, BizumService).
 * - Sin signals ni state global — los smart components subscriben directo.
 * - LA-CORE-068: navegación interna NO usa [href]; pasa por router en componentes.
 * - LA-CORE-055: backend devuelve montos positivos en savings (DDL CHECK >= 0); Math.abs() solo
 *   aplica a movimientos derivados de cuentas, no a allocations.amount.
 * - SCA RN-F024-11: closeGoal acepta otp opcional. Backend responde 401 con código OTP_REQUIRED
 *   cuando reservedAmount > 30€ y no se envió header X-OTP.
 */
@Injectable({ providedIn: 'root' })
export class SavingsService {

  private readonly base = '/api/v1/savings';

  constructor(private http: HttpClient) {}

  // -------------------------------------------------------------------------
  // Goals (CRUD)
  // -------------------------------------------------------------------------

  listGoals(status?: GoalStatus): Observable<SavingsGoal[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<SavingsGoal[]>(`${this.base}/goals`, { params });
  }

  createGoal(req: CreateGoalRequest): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(`${this.base}/goals`, req);
  }

  getDetail(goalId: string): Observable<GoalDetail> {
    return this.http.get<GoalDetail>(`${this.base}/goals/${goalId}`);
  }

  updateGoal(goalId: string, req: UpdateGoalRequest): Observable<SavingsGoal> {
    return this.http.put<SavingsGoal>(`${this.base}/goals/${goalId}`, req);
  }

  /**
   * Cierra un objetivo. Si reservedAmount > 30€, el backend exige header X-OTP.
   * El componente debe interceptar 401 con error.code='OTP_REQUIRED' y reintentar con otp.
   */
  closeGoal(goalId: string, otp?: string): Observable<CloseResult> {
    const headers = otp ? new HttpHeaders({ 'X-OTP': otp }) : undefined;
    return this.http.delete<CloseResult>(`${this.base}/goals/${goalId}`, { headers });
  }

  // -------------------------------------------------------------------------
  // Contributions
  // -------------------------------------------------------------------------

  /**
   * Aporta a un objetivo de ahorro.
   *
   * BUG-S26-Q-008 / DR-S26-007 (B.4 quick patch Step 7 Sprint 26):
   * Backend devuelve 409 CONCURRENCY_CONFLICT tras agotar 3 retries optimistas en colision
   * de `@Version` sobre `SavingsGoalEntity`. La concurrencia adversarial midió 40% de
   * 409 final en test (10 hilos POST mismo goal); la probabilidad real <0.05% en uso normal.
   *
   * Estrategia: 1 reintento automatico transparente con backoff 500ms SOLO para 409
   * CONCURRENCY_CONFLICT. Si el segundo intento tambien falla, propagamos el error y el
   * componente lo mapea a un mensaje UX inline ('Conflicto de concurrencia. Reintenta.').
   *
   * Otros errores (404, 422, 401, 0, etc.) NO se reintentan — el reintento solo tiene
   * sentido para colisiones transitorias.
   *
   * Deuda formalizada: DEBT-Q-073 (refactor a patrón estándar en S27).
   */
  contribute(goalId: string, req: ContributeRequest): Observable<Allocation> {
    return this.http.post<Allocation>(`${this.base}/goals/${goalId}/contributions`, req).pipe(
      retry({
        count: 1,
        delay: (err: unknown) => {
          if (err instanceof HttpErrorResponse
              && err.status === 409
              && (err.error?.error === 'CONCURRENCY_CONFLICT')) {
            return timer(500);
          }
          return throwError(() => err);
        }
      })
    );
  }

  contributionHistory(goalId: string, page = 0, size = 20): Observable<Page<Allocation>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<Page<Allocation>>(`${this.base}/goals/${goalId}/contributions`, { params });
  }

  // -------------------------------------------------------------------------
  // Auto-rule (RN-F024-04)
  // -------------------------------------------------------------------------

  configureAutoRule(goalId: string, req: AutoRuleRequest): Observable<AutoRule> {
    return this.http.put<AutoRule>(`${this.base}/goals/${goalId}/auto-rule`, req);
  }

  pauseAutoRule(goalId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/goals/${goalId}/auto-rule`);
  }

  // -------------------------------------------------------------------------
  // Milestones (US-024-07)
  // -------------------------------------------------------------------------

  getMilestones(goalId: string): Observable<Milestone[]> {
    return this.http.get<Milestone[]>(`${this.base}/goals/${goalId}/milestones`);
  }

  // -------------------------------------------------------------------------
  // Dashboard widget (US-024-08)
  // -------------------------------------------------------------------------

  getWidget(): Observable<SavingsWidget> {
    return this.http.get<SavingsWidget>(`${this.base}/dashboard-widget`);
  }
}
