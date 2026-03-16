import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit,
  inject, signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationStore, SecurityNotification } from './notification.store';
import { NotificationService } from './notification.service';

/**
 * Smart container — Centro de Notificaciones de Seguridad.
 * Ruta: /security/notifications
 *
 * Responsabilidades:
 * - US-301: lista paginada con filtros y paginación
 * - US-302: marcar leída / marcar todas
 * - US-304: deep-links a sesión / dispositivo
 * - US-305: SSE stream + toasts en tiempo real + polling fallback
 *
 * Accesibilidad WCAG 2.1 AA:
 * - role="feed" en la lista de notificaciones (ARIA para listas de contenido dinámico)
 * - aria-live="polite" en contador de no leídas
 * - aria-label en filtros y botones de acción
 * - role="alert" en mensajes de error y toasts críticos
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5
 */
@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Toasts SSE en tiempo real (US-305) -->
    <div class="toast-container" aria-live="assertive" aria-atomic="false">
      @for (toast of store.toasts(); track toast.notificationId) {
        <div class="toast" role="alert" [class.toast--critical]="isCritical(toast.eventType)">
          <div class="toast__content">
            <span class="toast__icon" aria-hidden="true">{{ eventIcon(toast.eventType) }}</span>
            <div class="toast__text">
              <p class="toast__title">{{ toast.title }}</p>
              <p class="toast__body">{{ toast.body }}</p>
            </div>
          </div>
          <div class="toast__actions">
            @if (toast.actionUrl) {
              <a [routerLink]="toast.actionUrl" class="toast__action-link"
                 (click)="store.dismissToast(toast.notificationId)">Ver</a>
            }
            <button class="toast__close" aria-label="Descartar notificación"
                    (click)="store.dismissToast(toast.notificationId)">✕</button>
          </div>
        </div>
      }
    </div>

    <section class="nc">
      <!-- Header -->
      <div class="nc__header">
        <h1 class="nc__title">Notificaciones de seguridad</h1>
        @if (store.unreadCount() > 0) {
          <span class="nc__badge" aria-live="polite"
                [attr.aria-label]="store.unreadCount() + ' notificaciones sin leer'">
            {{ store.badgeLabel() }}
          </span>
        }
        @if (store.unreadCount() > 0) {
          <button class="nc__mark-all" (click)="markAllAsRead()">
            Marcar todas como leídas
          </button>
        }
      </div>

      <!-- Filtros (US-301) -->
      <div class="nc__filters" role="group" aria-label="Filtrar notificaciones">
        @for (filter of eventTypeFilters; track filter.value) {
          <button
            class="nc__filter"
            [class.nc__filter--active]="store.eventTypeFilter() === filter.value"
            [attr.aria-pressed]="store.eventTypeFilter() === filter.value"
            (click)="applyFilter(filter.value)">
            {{ filter.label }}
          </button>
        }
      </div>

      <!-- Error global -->
      @if (store.error()) {
        <div class="nc__error" role="alert">{{ store.error() }}</div>
      }

      <!-- Lista de notificaciones -->
      @if (store.loading()) {
        <div class="nc__loading" aria-busy="true">
          <span class="spinner" aria-hidden="true"></span>
          Cargando notificaciones...
        </div>
      } @else if (store.notifications().length === 0) {
        <div class="nc__empty">
          <p>No tienes notificaciones de seguridad en los últimos 90 días.</p>
        </div>
      } @else {
        <div class="nc__list" role="feed" aria-label="Notificaciones de seguridad">
          @for (n of store.notifications(); track n.notificationId) {
            <article class="nc__item" [class.nc__item--unread]="!n.read"
                     [attr.aria-label]="n.title + (n.read ? '' : ' — sin leer')">
              <div class="nc__item-icon" aria-hidden="true">
                {{ eventIcon(n.eventType) }}
              </div>
              <div class="nc__item-content" (click)="onNotificationClick(n)">
                <p class="nc__item-title">{{ n.title }}</p>
                <p class="nc__item-body">{{ n.body }}</p>
                <time class="nc__item-time"
                      [attr.datetime]="n.createdAt">
                  {{ n.createdAt | date:'dd/MM/yyyy HH:mm' }}
                </time>
              </div>
              <!-- US-304: acción directa desde notificación -->
              @if (n.actionUrl) {
                <a [routerLink]="n.actionUrl"
                   class="nc__item-action"
                   [attr.aria-label]="'Ir a ' + n.title"
                   (click)="onNotificationClick(n)">
                  Ver →
                </a>
              }
              @if (!n.read) {
                <span class="nc__unread-dot" aria-hidden="true"></span>
              }
            </article>
          }
        </div>

        <!-- Paginación -->
        @if (store.totalPages() > 1) {
          <div class="nc__pagination" role="navigation" aria-label="Paginación de notificaciones">
            <button
              class="nc__page-btn"
              [disabled]="store.currentPage() === 0"
              aria-label="Página anterior"
              (click)="loadPage(store.currentPage() - 1)">‹</button>
            <span class="nc__page-info">
              {{ store.currentPage() + 1 }} / {{ store.totalPages() }}
            </span>
            <button
              class="nc__page-btn"
              [disabled]="store.currentPage() === store.totalPages() - 1"
              aria-label="Página siguiente"
              (click)="loadPage(store.currentPage() + 1)">›</button>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    /* Toasts SSE */
    .toast-container { position: fixed; top: 1rem; right: 1rem; z-index: 1100;
                       display: flex; flex-direction: column; gap: 0.5rem; max-width: 360px; }
    .toast { background: var(--color-background-primary); border: 1px solid var(--color-border-secondary);
             border-radius: var(--border-radius-lg); padding: 0.875rem 1rem;
             box-shadow: 0 4px 16px rgba(0,0,0,.12);
             display: flex; align-items: flex-start; gap: 0.75rem; }
    .toast--critical { border-left: 3px solid var(--color-border-danger); }
    .toast__content { flex: 1; display: flex; gap: 0.5rem; }
    .toast__icon { font-size: 16px; margin-top: 2px; }
    .toast__title { font-size: 0.875rem; font-weight: 500; margin: 0 0 2px; }
    .toast__body  { font-size: 0.75rem; color: var(--color-text-secondary); margin: 0; }
    .toast__actions { display: flex; gap: 0.5rem; align-items: center; }
    .toast__action-link { font-size: 0.75rem; color: var(--color-text-info); text-decoration: none; }
    .toast__close { background: none; border: none; cursor: pointer; color: var(--color-text-secondary);
                    font-size: 0.875rem; padding: 0 2px; }

    /* Contenedor principal */
    .nc { max-width: 720px; }
    .nc__header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .nc__title { font-size: 1.1rem; font-weight: 500; margin: 0; }
    .nc__badge { background: var(--color-background-danger); color: var(--color-text-danger);
                 font-size: 11px; font-weight: 500; padding: 2px 7px;
                 border-radius: 10px; min-width: 20px; text-align: center; }
    .nc__mark-all { margin-left: auto; background: none; border: none; cursor: pointer;
                    font-size: 0.8125rem; color: var(--color-text-info); text-decoration: underline; }

    /* Filtros */
    .nc__filters { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .nc__filter { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8125rem;
                  border: 1px solid var(--color-border-secondary); background: transparent;
                  cursor: pointer; color: var(--color-text-secondary); }
    .nc__filter--active { background: var(--color-background-info); color: var(--color-text-info);
                          border-color: var(--color-border-info); }

    /* Lista */
    .nc__list { display: flex; flex-direction: column; gap: 0; }
    .nc__item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.875rem 0;
                border-bottom: .5px solid var(--color-border-tertiary); cursor: pointer;
                position: relative; }
    .nc__item:last-child { border-bottom: none; }
    .nc__item--unread { background: var(--color-background-secondary); margin: 0 -0.5rem;
                        padding-left: 0.5rem; padding-right: 0.5rem; border-radius: var(--border-radius-md); }
    .nc__item-icon { font-size: 16px; margin-top: 2px; min-width: 20px; text-align: center; }
    .nc__item-content { flex: 1; }
    .nc__item-title { font-size: 0.875rem; font-weight: 500; margin: 0 0 2px; }
    .nc__item-body  { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0 0 4px; }
    .nc__item-time  { font-size: 0.75rem; color: var(--color-text-secondary); }
    .nc__item-action { font-size: 0.8125rem; color: var(--color-text-info); text-decoration: none;
                       white-space: nowrap; align-self: center; }
    .nc__unread-dot { position: absolute; top: 1rem; right: 0; width: 8px; height: 8px;
                      background: var(--color-text-info); border-radius: 50%; }

    /* Estado vacío / carga / error */
    .nc__empty, .nc__loading { padding: 2rem 0; text-align: center;
                               color: var(--color-text-secondary); font-size: 0.875rem; }
    .nc__loading { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .nc__error { background: var(--color-background-danger); color: var(--color-text-danger);
                 padding: 0.75rem 1rem; border-radius: var(--border-radius-md); margin-bottom: 1rem;
                 font-size: 0.875rem; }

    /* Paginación */
    .nc__pagination { display: flex; align-items: center; gap: 1rem; justify-content: center;
                      margin-top: 1.5rem; }
    .nc__page-btn { padding: 0.375rem 0.75rem; border: 1px solid var(--color-border-secondary);
                    border-radius: var(--border-radius-md); background: transparent;
                    cursor: pointer; font-size: 1rem; }
    .nc__page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .nc__page-info { font-size: 0.875rem; color: var(--color-text-secondary); }

    .spinner { display: inline-block; width: 14px; height: 14px;
               border: 2px solid var(--color-border-secondary);
               border-top-color: var(--color-text-info);
               border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class NotificationCenterComponent implements OnInit, OnDestroy {

  readonly store = inject(NotificationStore);
  private readonly notifService = inject(NotificationService);
  private sseSource: EventSource | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  readonly eventTypeFilters = [
    { label: 'Todos',       value: null },
    { label: 'Logins',      value: 'LOGIN_NEW_DEVICE' },
    { label: 'Sesiones',    value: 'SESSION_REVOKED' },
    { label: 'Dispositivos',value: 'TRUSTED_DEVICE_CREATED' },
    { label: '2FA',         value: 'TWO_FA_ACTIVATED' },
  ];

  ngOnInit(): void {
    this.store.loadNotifications();
    this.store.loadUnreadCount();
    this.initSse();
  }

  ngOnDestroy(): void {
    this.sseSource?.close();
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  async onNotificationClick(n: SecurityNotification): Promise<void> {
    if (!n.read) await this.store.markOneAsRead(n.notificationId);
  }

  async markAllAsRead(): Promise<void> {
    await this.store.markAllAsRead();
  }

  applyFilter(value: string | null): void {
    this.store.setEventTypeFilter(value);
    this.store.loadNotifications(0);
  }

  loadPage(page: number): void {
    this.store.loadNotifications(page);
  }

  eventIcon(eventType: string): string {
    const icons: Record<string, string> = {
      LOGIN_NEW_DEVICE:       '⚠',
      LOGIN_FAILED_ATTEMPTS:  '🔒',
      SESSION_REVOKED:        '✕',
      SESSION_REVOKED_ALL:    '✕',
      SESSION_EVICTED:        '↻',
      SESSION_DENIED_BY_USER: '⛔',
      TRUSTED_DEVICE_CREATED: '✓',
      TRUSTED_DEVICE_REVOKED: '✕',
      TWO_FA_ACTIVATED:       '🔐',
      TWO_FA_DEACTIVATED:     '🔓',
    };
    return icons[eventType] ?? '●';
  }

  isCritical(eventType: string): boolean {
    return ['LOGIN_NEW_DEVICE', 'SESSION_DENIED_BY_USER',
            'TWO_FA_DEACTIVATED', 'LOGIN_FAILED_ATTEMPTS'].includes(eventType);
  }

  // ── US-305: SSE + polling fallback (R-F4-003) ────────────────────────────

  private initSse(): void {
    try {
      this.sseSource = this.notifService.openSseStream();
      this.sseSource.addEventListener('security-notification', (event: MessageEvent) => {
        const notification = JSON.parse(event.data) as SecurityNotification;
        this.store.addToast(notification);
        // Auto-dismiss tras 8 segundos
        setTimeout(() => this.store.dismissToast(notification.notificationId), 8000);
      });
      this.sseSource.onerror = () => {
        // SSE caído — activar polling de fallback (R-F4-003)
        this.startPollingFallback();
      };
    } catch {
      this.startPollingFallback();
    }
  }

  private startPollingFallback(): void {
    if (this.pollingInterval) return;  // ya activo
    this.pollingInterval = setInterval(() => {
      this.store.loadUnreadCount();
    }, 60_000);  // 60s — R-F4-003
  }
}
