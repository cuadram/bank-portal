import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  Mandate, MandatePage, CreateMandateRequest,
  DirectDebit, DirectDebitPage, DebitFilterParams
} from '../models/mandate.model';

/**
 * FEAT-017 Sprint 19 — DirectDebitService
 * HttpClient wrapper + reactive state (BehaviorSubject)
 */
@Injectable()
export class DirectDebitService {

  private readonly API = '/api/v1/direct-debits';
  private mandatesSubject = new BehaviorSubject<Mandate[]>([]);
  mandates$ = this.mandatesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getMandates(page = 0, size = 20): Observable<MandatePage> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<MandatePage>(`${this.API}/mandates`, { params }).pipe(
      tap(res => this.mandatesSubject.next(res.content)),
      catchError(this.handleError)
    );
  }

  getMandate(id: string): Observable<Mandate> {
    return this.http.get<Mandate>(`${this.API}/mandates/${id}`)
      .pipe(catchError(this.handleError));
  }

  createMandate(req: CreateMandateRequest): Observable<Mandate> {
    return this.http.post<Mandate>(`${this.API}/mandates`, req)
      .pipe(catchError(this.handleError));
  }

  cancelMandate(id: string, otp: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/mandates/${id}`, { body: { otp } })
      .pipe(catchError(this.handleError));
  }

  getDebits(filters: DebitFilterParams = {}): Observable<DirectDebitPage> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v != null) params = params.set(k, String(v)); });
    return this.http.get<DirectDebitPage>(`${this.API}/debits`, { params })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'No se pueden cargar las domiciliaciones. Inténtelo de nuevo.';
    if (error.error?.message) msg = error.error.message;
    else if (error.error?.error_code === 'MANDATE_CANCELLATION_BLOCKED_PSD2')
      msg = `No se puede cancelar: hay un cobro pendiente el ${error.error.due_date}`;
    return throwError(() => new Error(msg));
  }
}
