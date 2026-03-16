import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from './notification.service';

export interface SecurityNotification {
  notificationId: string;
  eventType: string;
  title: string;
  body: string;
  actionUrl: string | null;
  read: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface NotificationPage {
  content: SecurityNotification[];
  totalElements: number;
  totalPages: number;
  number: number;  // página actual (0-indexed)
}

interface NotificationState {
  notifications: SecurityNotification[];
  totalElements: number;
  currentPage: number;
  totalPages: number;
  unreadCount: number;
  eventTypeFilter: string | null;
  loading: boolean;
  error: string | null;
  // US-305: toasts en tiempo real
  toasts: SecurityNotification[];
}

const initialState: NotificationState = {
  notifications: [],
  totalElements: 0,
  currentPage: 0,
  totalPages: 0,
  unreadCount: 0,
  eventTypeFilter: null,
  loading: false,
  error: null,
  toasts: [],
};

/**
 * NgRx Signal Store para el Centro de Notificaciones de Seguridad (FEAT-004).
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5
 */
export const NotificationStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(({ notifications, unreadCount }) => ({
    /** Notificaciones no leídas — para destacar en la lista. */
    unreadNotifications: computed(() => notifications().filter(n => !n.read)),
    /** Badge visible solo si hay notificaciones sin leer. */
    showBadge: computed(() => unreadCount() > 0),
    /** Etiqueta del badge (máximo "99+"). */
    badgeLabel: computed(() => {
      const count = unreadCount();
      return count > 99 ? '99+' : String(count);
    }),
  })),

  withMethods((store, svc = inject(NotificationService)) => ({

    /** US-301 — Carga notificaciones paginadas. */
    async loadNotifications(page = 0): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const result = await firstValueFrom(
          svc.getNotifications(store.eventTypeFilter(), page)
        );
        patchState(store, {
          notifications:  result.content,
          totalElements:  result.totalElements,
          totalPages:     result.totalPages,
          currentPage:    result.number,
          loading: false,
        });
      } catch {
        patchState(store, {
          error: 'No se pudieron cargar las notificaciones.',
          loading: false,
        });
      }
    },

    /** US-303 — Carga el conteo de no leídas para el badge. */
    async loadUnreadCount(): Promise<void> {
      try {
        const { unreadCount } = await firstValueFrom(svc.getUnreadCount());
        patchState(store, { unreadCount });
      } catch {
        // Fallo silencioso — el badge simplemente no se actualiza
      }
    },

    /** US-302 — Marca notificación individual como leída. */
    async markOneAsRead(notificationId: string): Promise<void> {
      try {
        await firstValueFrom(svc.markOneAsRead(notificationId));
        patchState(store, {
          notifications: store.notifications().map(n =>
            n.notificationId === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, store.unreadCount() - 1),
        });
      } catch { /* fallo silencioso */ }
    },

    /** US-302 — Marca todas las notificaciones como leídas. */
    async markAllAsRead(): Promise<void> {
      try {
        await firstValueFrom(svc.markAllAsRead());
        patchState(store, {
          notifications: store.notifications().map(n => ({ ...n, read: true })),
          unreadCount: 0,
        });
      } catch {
        patchState(store, { error: 'Error al marcar las notificaciones.' });
      }
    },

    /** Aplica filtro por tipo de evento y recarga. */
    setEventTypeFilter(filter: string | null): void {
      patchState(store, { eventTypeFilter: filter, currentPage: 0 });
    },

    /** US-305 — Añade un toast SSE y actualiza el badge. */
    addToast(notification: SecurityNotification): void {
      patchState(store, {
        toasts: [...store.toasts(), notification],
        unreadCount: store.unreadCount() + 1,
      });
    },

    /** Descarta un toast. */
    dismissToast(notificationId: string): void {
      patchState(store, {
        toasts: store.toasts().filter(t => t.notificationId !== notificationId),
      });
    },
  }))
);
