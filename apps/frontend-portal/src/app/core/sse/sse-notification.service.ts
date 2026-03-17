import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface SseNotificationEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * US-305 — Servicio SSE standalone para notificaciones en tiempo real.
 *
 * Gestiona la conexión EventSource, el dispatch de eventos por tipo
 * y el polling fallback de 60s si SSE no está disponible (R-F4-003).
 *
 * Diseño ADR-012:
 * - 1 conexión SSE por instancia del servicio (providedIn: 'root')
 * - Reconexión automática nativa de EventSource (el browser lo hace solo)
 * - Polling fallback si SSE falla (intervalo configurable, por defecto 60s)
 * - Los consumers se suscriben por tipo de evento vía on(eventType)
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 8 Semana 2
 */
@Injectable({ providedIn: 'root' })
export class SseNotificationService implements OnDestroy {

  private readonly http = inject(HttpClient);
  private readonly SSE_URL = '/api/v1/notifications/stream';
  private readonly UNREAD_URL = '/api/v1/notifications/unread-count';
  private readonly POLLING_INTERVAL_MS = 60_000;

  private eventSource: EventSource | null = null;
  private readonly subjects = new Map<string, Subject<SseNotificationEvent>>();
  private pollingSubscription: Subscription | null = null;
  private sseActive = false;

  // ─────────────────────────────────────────────────────────────────────────
  // Conectar
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Abre la conexión SSE. Idempotente — si ya está abierta no hace nada.
   * Llamar desde AppComponent.ngOnInit() o desde el guard de autenticación.
   */
  connect(): void {
    if (this.eventSource || !('EventSource' in window)) {
      if (!('EventSource' in window)) this.startPollingFallback();
      return;
    }

    this.eventSource = new EventSource(this.SSE_URL);
    this.sseActive = true;

    // Eventos de negocio
    const eventTypes = ['notification', 'unread-count-updated', 'heartbeat'];
    eventTypes.forEach(type => {
      this.eventSource!.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = type === 'heartbeat' ? {} : JSON.parse(e.data);
          this.dispatch({ type, data });
        } catch {
          // JSON inválido — ignorar
        }
      });
    });

    this.eventSource.onerror = () => {
      // EventSource reconecta automáticamente — activamos el polling
      // como red de seguridad para el badge (R-F4-003)
      this.sseActive = false;
      this.startPollingFallback();
    };

    this.eventSource.onopen = () => {
      this.sseActive = true;
      this.stopPollingFallback();
    };
  }

  /**
   * Cierra la conexión SSE y detiene el polling.
   * Llamar en logout.
   */
  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this.sseActive = false;
    this.stopPollingFallback();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Suscripción por tipo
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Observable de eventos de un tipo específico.
   *
   * @example
   * this.sseService.on('unread-count-updated')
   *   .subscribe(event => this.count.set(event.data['count'] as number));
   */
  on(eventType: string): Observable<SseNotificationEvent> {
    return this.getOrCreateSubject(eventType).asObservable();
  }

  isConnected(): boolean {
    return this.sseActive && this.eventSource?.readyState === EventSource.OPEN;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Polling fallback (R-F4-003)
  // ─────────────────────────────────────────────────────────────────────────

  private startPollingFallback(): void {
    if (this.pollingSubscription) return;

    this.pollingSubscription = interval(this.POLLING_INTERVAL_MS).pipe(
      switchMap(() => this.http.get<{ count: number }>(this.UNREAD_URL))
    ).subscribe({
      next: r => this.dispatch({
        type: 'unread-count-updated',
        data: { count: r.count }
      }),
      error: () => { /* ignorar errores de polling */ }
    });
  }

  private stopPollingFallback(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  private dispatch(event: SseNotificationEvent): void {
    this.getOrCreateSubject(event.type).next(event);
  }

  private getOrCreateSubject(type: string): Subject<SseNotificationEvent> {
    if (!this.subjects.has(type)) {
      this.subjects.set(type, new Subject<SseNotificationEvent>());
    }
    return this.subjects.get(type)!;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.subjects.forEach(s => s.complete());
    this.subjects.clear();
  }
}
