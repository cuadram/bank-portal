import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { SessionService } from '../services/session.service';
import { ActiveSession, SessionState, UpdateTimeoutRequest } from './session.model';

/**
 * NgRx Signal Store para gestión de sesiones activas (FEAT-002).
 *
 * Estado reactividad:
 *  - sessions        → lista de sesiones activas
 *  - timeoutMinutes  → timeout configurado por el usuario
 *  - loading         → indicador de carga inicial
 *  - revoking        → sessionId siendo revocada (null si ninguna)
 *  - error           → mensaje de error o null
 *  - evictedBannerVisible → mostrar banner de sesión eviccionada
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */

const initialState: SessionState = {
  sessions:             [],
  timeoutMinutes:       30,
  loading:              false,
  revoking:             null,
  error:                null,
  evictedBannerVisible: false,
};

export const SessionStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed(({ sessions }) => ({
    /** Sesiones que no son la actual — mostrables con botón de revocar. */
    otherSessions: computed<ActiveSession[]>(
      () => sessions().filter(s => !s.isCurrent)
    ),
    /** Sesión actual del usuario. */
    currentSession: computed<ActiveSession | undefined>(
      () => sessions().find(s => s.isCurrent)
    ),
    /** true si hay otras sesiones activas para revocar. */
    hasOtherSessions: computed<boolean>(
      () => sessions().some(s => !s.isCurrent)
    ),
  })),

  withMethods((store, sessionService = inject(SessionService)) => ({

    /** Carga las sesiones activas desde la API. */
    async loadSessions(): Promise<void> {
      patchState(store, { loading: true, error: null });
      try {
        const sessions = await firstValueFrom(sessionService.getActiveSessions());
        patchState(store, { sessions, loading: false });
      } catch {
        patchState(store, {
          error: 'No se pudieron cargar las sesiones. Inténtalo de nuevo.',
          loading: false,
        });
      }
    },

    /** Revoca una sesión individual con confirmación OTP. */
    async revokeSession(sessionId: string, otpCode: string): Promise<void> {
      patchState(store, { revoking: sessionId, error: null });
      try {
        await firstValueFrom(sessionService.revokeSession(sessionId, otpCode));
        patchState(store, {
          sessions: store.sessions().filter(s => s.sessionId !== sessionId),
          revoking: null,
        });
      } catch (err: unknown) {
        const message = extractErrorMessage(err, 'Error al cerrar la sesión.');
        patchState(store, { error: message, revoking: null });
      }
    },

    /** Revoca todas las sesiones excepto la actual. */
    async revokeAllOtherSessions(otpCode: string): Promise<void> {
      patchState(store, { revoking: 'all', error: null });
      try {
        await firstValueFrom(sessionService.revokeAllSessions(otpCode));
        patchState(store, {
          sessions: store.sessions().filter(s => s.isCurrent),
          revoking: null,
        });
      } catch (err: unknown) {
        const message = extractErrorMessage(err, 'Error al cerrar las sesiones.');
        patchState(store, { error: message, revoking: null });
      }
    },

    /** Actualiza el timeout de inactividad del usuario. */
    async updateTimeout(req: UpdateTimeoutRequest): Promise<void> {
      try {
        const response = await firstValueFrom(sessionService.updateTimeout(req));
        patchState(store, { timeoutMinutes: response.timeoutMinutes, error: null });
      } catch {
        patchState(store, { error: 'Error al guardar el tiempo de inactividad.' });
      }
    },

    /** Descarta el banner de sesión eviccionada. */
    dismissEvictedBanner(): void {
      patchState(store, { evictedBannerVisible: false });
    },

    /** Muestra el banner de sesión eviccionada (llamado desde login). */
    showEvictedBanner(): void {
      patchState(store, { evictedBannerVisible: true });
    },
  }))
);

// ── Helper privado ────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as { error?: { message?: string } };
    return e?.error?.message ?? fallback;
  }
  return fallback;
}
