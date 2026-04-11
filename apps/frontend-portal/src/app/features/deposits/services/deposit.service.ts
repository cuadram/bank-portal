import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Deposit, SimulateRequest, SimulationResponse,
  OpenDepositRequest, CancellationResult, Page, RenewalInstruction
} from '../models/deposit.model';

/**
 * Servicio de depósitos — FEAT-021 Sprint 23.
 * LA-STG-001: catchError devuelve of(valorDefecto) — NUNCA EMPTY.
 */
@Injectable({ providedIn: 'root' })
export class DepositService {
  private base = '/api/v1/deposits';

  constructor(private http: HttpClient) {}

  getDeposits(page = 0, size = 10): Observable<Page<Deposit>> {
    return this.http.get<Page<Deposit>>(this.base, { params: { page, size } }).pipe(
      catchError(() => of({ content: [], totalElements: 0, totalPages: 0, number: 0 }))
    );
  }

  getDepositById(id: string): Observable<Deposit | null> {
    return this.http.get<Deposit>(`${this.base}/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  simulate(req: SimulateRequest): Observable<SimulationResponse | null> {
    return this.http.post<SimulationResponse>(`${this.base}/simulate`, req).pipe(
      catchError(() => of(null))
    );
  }

  openDeposit(req: OpenDepositRequest): Observable<Deposit | null> {
    return this.http.post<Deposit>(this.base, req).pipe(
      catchError(() => of(null))
    );
  }

  setRenewal(id: string, instruction: string): Observable<Deposit | null> {
    return this.http.patch<Deposit>(`${this.base}/${id}/renewal`, { instruction }).pipe(
      catchError(() => of(null))
    );
  }

  cancelDeposit(id: string, otp: string): Observable<CancellationResult | null> {
    return this.http.post<CancellationResult>(`${this.base}/${id}/cancel`, null, { params: { otp } }).pipe(
      catchError(() => of(null))
    );
  }
}
