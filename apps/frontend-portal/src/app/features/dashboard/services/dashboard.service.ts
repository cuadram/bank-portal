import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface DashboardSummary {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
}

export interface SpendingCategory {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface TopMerchant {
  issuer: string;
  totalAmount: number;
  count: number;
}

export interface MonthlyEvolution {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface MonthComparison {
  currentMonth: { period: string; totalIncome: number; totalExpenses: number };
  previousMonth: { period: string; totalIncome: number; totalExpenses: number } | null;
  expensesVariationPercent: number | null;
  incomeVariationPercent: number | null;
}

export interface BudgetAlert {
  type: string;
  threshold: number;
  monthlyBudget: number;
  currentAmount: number;
  usedPercent: number;
  triggeredAt: string;
}

/**
 * DashboardService — HTTP client para los endpoints del dashboard.
 * Errores capturados con catchError → null (nunca propaga excepciones a componentes).
 * US-1106 FEAT-011 Sprint 13.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private base = '/api/v1/dashboard';

  constructor(private http: HttpClient) {}

  getSummary(period = 'current_month'): Observable<DashboardSummary | null> {
    return this.http.get<DashboardSummary>(`${this.base}/summary`, { params: { period } })
      .pipe(catchError(() => of(null)));
  }

  getCategories(period = 'current_month'): Observable<SpendingCategory[] | null> {
    return this.http.get<SpendingCategory[]>(`${this.base}/categories`, { params: { period } })
      .pipe(catchError(() => of(null)));
  }

  getTopMerchants(period = 'current_month', limit = 5): Observable<TopMerchant[] | null> {
    return this.http.get<TopMerchant[]>(`${this.base}/top-merchants`, { params: { period, limit } })
      .pipe(catchError(() => of(null)));
  }

  getEvolution(months = 6): Observable<MonthlyEvolution[] | null> {
    return this.http.get<MonthlyEvolution[]>(`${this.base}/evolution`, { params: { months } })
      .pipe(catchError(() => of(null)));
  }

  getComparison(): Observable<MonthComparison | null> {
    return this.http.get<MonthComparison>(`${this.base}/comparison`)
      .pipe(catchError(() => of(null)));
  }

  getAlerts(): Observable<BudgetAlert[] | null> {
    return this.http.get<BudgetAlert[]>(`${this.base}/alerts`)
      .pipe(catchError(() => of(null)));
  }

  downloadPdf(period = 'current_month'): void {
    this.http.get(`${this.base}/export/pdf`, { params: { period }, responseType: 'blob' })
      .subscribe(blob => this.triggerDownload(blob, `dashboard-${period}.pdf`));
  }

  downloadExcel(period = 'current_month'): void {
    this.http.get(`${this.base}/export/excel`, { params: { period }, responseType: 'blob' })
      .subscribe(blob => this.triggerDownload(blob, `dashboard-${period}.xlsx`));
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
