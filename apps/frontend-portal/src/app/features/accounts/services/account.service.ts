import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AccountSummary {
  id: string;
  alias: string;
  ibanMasked: string;
  type: 'CORRIENTE' | 'AHORRO' | 'NOMINA';
  availableBalance: number;
  retainedBalance: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  transactionDate: string;
  concept: string;
  amount: number;
  balanceAfter: number;
  category: string;
  type: 'CARGO' | 'ABONO';
}

export interface TransactionPage {
  content: Transaction[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export interface TransactionFilter {
  from?: string;
  to?: string;
  type?: 'CARGO' | 'ABONO';
  minAmount?: number;
  maxAmount?: number;
  q?: string;
  page?: number;
  size?: number;
}

/**
 * US-701/702/703 — Servicio HTTP para cuentas y movimientos bancarios.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly base = `${environment.apiUrl}/api/v1/accounts`;

  constructor(private http: HttpClient) {}

  /** US-701: listado de cuentas con saldo del usuario autenticado. */
  getAccounts(): Observable<AccountSummary[]> {
    return this.http.get<AccountSummary[]>(this.base);
  }

  /**
   * US-702/703: movimientos paginados con filtros opcionales.
   * Todos los parámetros del filtro son opcionales y combinables.
   */
  getTransactions(accountId: string, filter: TransactionFilter = {}): Observable<TransactionPage> {
    let params = new HttpParams();
    if (filter.from)      params = params.set('from',      filter.from);
    if (filter.to)        params = params.set('to',        filter.to);
    if (filter.type)      params = params.set('type',      filter.type);
    if (filter.minAmount != null) params = params.set('minAmount', String(filter.minAmount));
    if (filter.maxAmount != null) params = params.set('maxAmount', String(filter.maxAmount));
    if (filter.q)         params = params.set('q',         filter.q);
    params = params.set('page', String(filter.page ?? 0));
    params = params.set('size', String(filter.size ?? 20));

    return this.http.get<TransactionPage>(`${this.base}/${accountId}/transactions`, { params });
  }
}
