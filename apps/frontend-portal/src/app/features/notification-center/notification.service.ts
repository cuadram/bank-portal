import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationPage, SecurityNotification } from './notification.store';

/**
 * Servicio HTTP para el Centro de Notificaciones de Seguridad (FEAT-004).
 * Mapea endpoints: GET/PUT /api/v1/notifications + SSE /stream.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly http    = inject(HttpClient);
  private readonly baseUrl = '/api/v1/notifications';

  /** US-301 — Lista notificaciones paginadas con filtro opcional. */
  getNotifications(eventType: string | null, page = 0, size = 20): Observable<NotificationPage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (eventType) params = params.set('eventType', eventType);
    return this.http.get<NotificationPage>(this.baseUrl, { params });
  }

  /** US-303 — Conteo de no leídas para el badge. */
  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.baseUrl}/unread-count`);
  }

  /** US-302 — Marca notificación individual como leída. */
  markOneAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${notificationId}/read`, {});
  }

  /** US-302 — Marca todas como leídas. */
  markAllAsRead(): Observable<{ markedCount: number }> {
    return this.http.put<{ markedCount: number }>(`${this.baseUrl}/read-all`, {});
  }

  /**
   * US-305 — Conecta al stream SSE.
   * Devuelve un EventSource — el componente es responsable de cerrarlo.
   * Incluye polling de fallback (R-F4-003): si EventSource no está disponible,
   * o si la conexión falla, el NotificationStore hace polling cada 60s.
   */
  openSseStream(): EventSource {
    return new EventSource(`${this.baseUrl}/stream`);
  }
}
