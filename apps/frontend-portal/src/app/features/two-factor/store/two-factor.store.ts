/**
 * store/two-factor.store.ts
 * NgRx Signal Store — Estado global del flujo 2FA
 * FEAT-001 | BankPortal — Banco Meridian
 *
 * Reglas de seguridad (LLD §6):
 *  - access_token NUNCA en localStorage: solo en store (memoria)
 *  - pre_auth_token solo en sessionStorage, limpiado tras verificación
 *  - pendingRecoveryCodes limpiados tras mostrar al usuario
 *  - pendingQrUri/qrBase64 limpiados al salir del componente
 */
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { TwoFactorService } from '../services/two-factor.service';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, exhaustMap, tap } from 'rxjs';

export type TwoFactorStatus = 'DISABLED' | 'PENDING' | 'ENABLED';

export interface TwoFactorState {
  status: TwoFactorStatus;
  availableRecoveryCodes: number;
  isLoading: boolean;
  error: string | null;
  /** Solo en memoria durante el flujo de enrolamiento — nunca persistido */
  pendingQrUri: string | null;
  pendingQrBase64: string | null;
  /** Limpiado inmediatamente tras mostrar los códigos al usuario */
  pendingRecoveryCodes: string[] | null;
}

const initialState: TwoFactorState = {
  status: 'DISABLED',
  availableRecoveryCodes: 0,
  isLoading: false,
  error: null,
  pendingQrUri: null,
  pendingQrBase64: null,
  pendingRecoveryCodes: null,
};

export const TwoFactorStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, svc = inject(TwoFactorService)) => ({

    /**
     * Iniciar enrolamiento: POST /2fa/enroll
     * switchMap: cancela llamadas previas si el usuario re-dispara (esperado en enroll).
     */
    startEnroll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          svc.enroll().pipe(
            tapResponse({
              next: (res) =>
                patchState(store, {
                  status: 'PENDING',
                  isLoading: false,
                  pendingQrUri: res.qr_uri,
                  pendingQrBase64: res.qr_image_base64,
                }),
              error: (err: Error) =>
                patchState(store, { isLoading: false, error: err.message }),
            })
          )
        )
      )
    ),

    /**
     * Confirmar enrolamiento con OTP: POST /2fa/enroll/confirm
     *
     * CR-NC-005 FIX: exhaustMap en lugar de switchMap.
     * Los OTP TOTP son de un solo uso (RFC 6238). Si el usuario hace doble-click
     * y switchMap cancela la primera petición, el backend puede haberla procesado
     * ya (OTP consumido). La segunda petición fallaría con OTP inválido.
     * exhaustMap ignora los eventos subsiguientes mientras hay una petición en vuelo.
     */
    confirmEnroll: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap((otp) =>
          svc.confirmEnroll(otp).pipe(
            tapResponse({
              next: (res) =>
                patchState(store, {
                  status: 'ENABLED',
                  isLoading: false,
                  pendingQrUri: null,
                  pendingQrBase64: null,
                  availableRecoveryCodes: res.recovery_codes_count,
                }),
              error: (err: Error) =>
                patchState(store, { isLoading: false, error: err.message }),
            })
          )
        )
      )
    ),

    /** Limpiar estado pendiente de enrolamiento (al salir del QR sin confirmar) */
    clearPendingEnroll(): void {
      patchState(store, {
        status: 'DISABLED',
        pendingQrUri: null,
        pendingQrBase64: null,
        error: null,
      });
    },

    /** Establecer códigos de recuperación en memoria (llamado tras confirmEnroll) */
    setPendingRecoveryCodes(codes: string[]): void {
      patchState(store, { pendingRecoveryCodes: codes });
    },

    /** Limpiar códigos de recuperación de memoria (llamado tras mostrarlos al usuario) */
    clearPendingRecoveryCodes(): void {
      patchState(store, { pendingRecoveryCodes: null });
    },

    /** Resetear error */
    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);
