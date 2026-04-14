import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  BizumActivation, BizumPayment, BizumStatus_Resp,
  SendPaymentRequest, RequestMoneyRequest, ResolveRequestRequest
} from '../models/bizum.model';

const API = '/api/v1/bizum';

@Injectable({ providedIn: 'root' })
export class BizumService {
  constructor(private http: HttpClient) {}

  activate(req: { phone: string; accountId: string }): Observable<BizumActivation> {
    return this.http.post<BizumActivation>(`${API}/activate`, req);
  }

  sendPayment(req: SendPaymentRequest): Observable<any> {
    return this.http.post<any>(`${API}/payments`, req);
  }

  requestMoney(req: RequestMoneyRequest): Observable<any> {
    return this.http.post<any>(`${API}/requests`, req);
  }

  resolveRequest(id: string, req: ResolveRequestRequest): Observable<void> {
    return this.http.patch<void>(`${API}/requests/${id}`, req);
  }

  getTransactions(page = 0, size = 20): Observable<BizumPayment[]> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<BizumPayment[]>(`${API}/transactions`, { params })
      .pipe(catchError(() => of([])));  // LA-STG-001: valor por defecto siempre
  }

  getStatus(): Observable<BizumStatus_Resp> {
    return this.http.get<BizumStatus_Resp>(`${API}/status`)
      .pipe(catchError(() => of({  // LA-STG-001: valor por defecto, valor por defecto siempre
        active: false, phoneMasked: '', dailyUsed: 0, dailyLimit: 2000, perOperationLimit: 500
      })));
  }
}
