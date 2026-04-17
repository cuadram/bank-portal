import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PfmOverviewResponse, BudgetDto, BudgetCreateRequest,
  PfmAnalysisResponse, PfmDistributionResponse, PfmWidgetResponse
} from '../models/pfm.models';

/**
 * Servicio HTTP — Módulo PFM Mi Dinero.
 * Base: /api/v1/pfm · Auth: JWT via interceptor.
 * FEAT-023 Sprint 25.
 */
@Injectable({ providedIn: 'root' })
export class PfmService {

  private readonly base = '/api/v1/pfm';

  constructor(private http: HttpClient) {}

  getOverview(month?: string): Observable<PfmOverviewResponse> {
    const params = month ? new HttpParams().set('month', month) : undefined;
    return this.http.get<PfmOverviewResponse>(`${this.base}/overview`, { params });
  }

  getBudgets(): Observable<BudgetDto[]> {
    return this.http.get<BudgetDto[]>(`${this.base}/budgets`);
  }

  createBudget(req: BudgetCreateRequest): Observable<BudgetDto> {
    return this.http.post<BudgetDto>(`${this.base}/budgets`, req);
  }

  deleteBudget(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/budgets/${id}`);
  }

  getAnalysis(month?: string): Observable<PfmAnalysisResponse> {
    const params = month ? new HttpParams().set('month', month) : undefined;
    return this.http.get<PfmAnalysisResponse>(`${this.base}/analysis`, { params });
  }

  getDistribution(month?: string): Observable<PfmDistributionResponse> {
    const params = month ? new HttpParams().set('month', month) : undefined;
    return this.http.get<PfmDistributionResponse>(`${this.base}/distribution`, { params });
  }

  overrideCategory(txId: string, categoryCode: string): Observable<any> {
    return this.http.put(`${this.base}/movimientos/${txId}/category`, { categoryCode });
  }

  getWidget(): Observable<PfmWidgetResponse> {
    return this.http.get<PfmWidgetResponse>(`${this.base}/widget`);
  }
}
