import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Card, CardStatusResponse, UpdateLimitsRequest, ChangePinRequest } from '../models/card.model';

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly baseUrl = '/api/v1/cards';

  constructor(private http: HttpClient) {}

  getCards(): Observable<Card[]> {
    return this.http.get<Card[]>(this.baseUrl);
  }

  getCard(id: string): Observable<Card> {
    return this.http.get<Card>(`${this.baseUrl}/${id}`);
  }

  blockCard(id: string, otpCode: string): Observable<CardStatusResponse> {
    return this.http.post<CardStatusResponse>(`${this.baseUrl}/${id}/block`, { otpCode });
  }

  unblockCard(id: string, otpCode: string): Observable<CardStatusResponse> {
    return this.http.post<CardStatusResponse>(`${this.baseUrl}/${id}/unblock`, { otpCode });
  }

  updateLimits(id: string, req: UpdateLimitsRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/limits`, req);
  }

  changePin(id: string, req: ChangePinRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/pin`, req);
  }
}
