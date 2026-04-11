import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  LoanSummary, LoanDetail, SimulateRequest, SimulationResponse,
  ApplyLoanRequest, LoanApplicationResponse, AmortizationRow
} from '../models/loan.model';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly base = '/api/v1/loans';

  constructor(private http: HttpClient) {}

  listLoans(page = 0, size = 10): Observable<Page<LoanSummary>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<LoanSummary>>(this.base, { params }).pipe(
      catchError(() => of({ content: [], totalElements: 0, totalPages: 0, size, number: 0 }))
    );
  }

  getLoan(id: string): Observable<LoanDetail | null> {
    return this.http.get<LoanDetail>(`${this.base}/${id}`).pipe(
      catchError(() => of(null))  // LA-STG-001: of(null) nunca EMPTY
    );
  }

  getAmortization(id: string): Observable<AmortizationRow[]> {
    return this.http.get<AmortizationRow[]>(`${this.base}/${id}/amortization`).pipe(
      catchError(() => of([]))    // LA-STG-001: of([]) nunca EMPTY
    );
  }

  simulate(req: SimulateRequest): Observable<SimulationResponse | null> {
    return this.http.post<SimulationResponse>(`${this.base}/simulate`, req).pipe(
      catchError(() => of(null))
    );
  }

  apply(req: ApplyLoanRequest): Observable<LoanApplicationResponse | null> {
    return this.http.post<LoanApplicationResponse>(`${this.base}/applications`, req).pipe(
      catchError(() => of(null))
    );
  }

  cancelApplication(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/applications/${id}`).pipe(
      catchError(() => of(undefined as void))
    );
  }
}
