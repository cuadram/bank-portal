/**
 * store/two-factor.store.ts
 * NgRx Signal Store — Estado global del flujo 2FA
 * FEAT-001 | BankPortal — Banco Meridian
 *
 * Reglas de seguridad (LLD §6):
 *  - access_token NUNCA en localStorage: solo en store (memoria)
 *  - pre_auth_token solo en sessionStorage, limpiado tras verificación exitosa
 *  - pendingRecoveryCodes limpiados tras mostrar al usuario (clearPendingRecoveryCodes)
 *  - pendingQrUri/qrBase64 limpiados al salir del componente
 */
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { TwoFactorService } from '../services/two-factor.service';
import { VerifyOtpRequest } from '../models/verify.model';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, exhaustMap, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type TwoFactorStatus = 'DISABLED' | 'PENDING' | 'ENABLED';

export interface TwoFactorState {
  status: TwoFactorStatus;
  availableRecoveryCodes: number;
  isLoading: boolean;
  error: string | null;
  /** Solo en memoria durante el flujo de enrolamiento — nunca persistido */
  pendingQrUri: string | null;
  pendingQrBase64: string | null;
  /**
   * Códigos de recuperación en texto plano — en memoria únicamente.
   * Limpiado por RecoveryCodesComponent en ngOnDestroy (LLD §6).
   */
  pendingRecoveryCodes: string[] | null;
  /**
   * US-002: access_token obtenido tras verificación OTP exitosa.
   * NUNCA en localStorage — solo en memoria (LLD §6).
   * Limpiado al cerrar sesión o refrescar la página.
   */
  accessToken: string | null;
}

const initialState: TwoFactorState = {
  status: 'DISABLED',
  availableRecoveryCodes: 0,
  isLoading: false,
  error: null,
  pendingQrUri: null,
  pendingQrBase64: null,
  pendingRecoveryCodes: null,
  accessToken: null,
};

export const TwoFactorStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, svc = inject(TwoFactorService)) => ({

    /**
     * Iniciar enrolamiento: POST /2fa/enroll
     * switchMap: cancela llamadas previas si el usuario re-dispara.
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
     * Confirmar enrolamiento: POST /2fa/enroll/confirm
     * exhaustMap: OTP TOTP de un solo uso (RFC 6238) — evita doble submit.
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

    /**
     * US-002: Verificar OTP o recovery code tras login: POST /2fa/verify
     *
     * exhaustMap: OTP de un solo uso — evita doble submit.
     * En éxito: guarda access_token en memoria, limpia pre_auth_token.
     * En error: conserva pre_auth_token para reintentos dentro del TTL.
     */
    verifyLogin: rxMethod<VerifyOtpRequest>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap((request) =>
          svc.verifyOtp(request).pipe(
            tapResponse({
              next: (res) => {
                sessionStorage.removeItem(environment.preAuthTokenSessionKey);
                patchState(store, {
                  isLoading: false,
                  accessToken: res.access_token,
                  error: null,
                });
              },
              error: (err: Error) =>
                patchState(store, { isLoading: false, error: err.message }),
            })
          )
        )
      )
    ),

    /**
     * US-003: Generar (o regenerar) códigos de recuperación: POST /2fa/recovery-codes/generate
     *
     * exhaustMap (NC-001 CR v1.0): el endpoint invalida los códigos anteriores en el
     * backend en cuanto se ejecuta la operación. Si switchMap cancelara la respuesta
     * en vuelo, el usuario quedaría sin códigos válidos sin ninguna notificación de error.
     * exhaustMap ignora nuevas emisiones mientras hay una request activa — es el
     * comportamiento correcto para operaciones destructivas con efecto irrecuperable.
     *
     * En éxito: guarda los códigos en texto plano en pendingRecoveryCodes (solo en memoria).
     *   Actualiza availableRecoveryCodes con el total generado.
     * En error: no modifica pendingRecoveryCodes — el componente puede reintentar.
     */
    generateRecoveryCodes: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        exhaustMap(() =>
          svc.generateRecoveryCodes().pipe(
            tapResponse({
              next: (res) =>
                patchState(store, {
                  isLoading: false,
                  pendingRecoveryCodes: res.codes,
                  availableRecoveryCodes: res.codes.length,
                }),
              error: (err: Error) =>
                patchState(store, { isLoading: false, error: err.message }),
            })
          )
        )
      )
    ),

    /** Cerrar sesión — elimina access_token de memoria y pre_auth_token de sessionStorage */
    clearSession(): void {
      sessionStorage.removeItem(environment.preAuthTokenSessionKey);
      patchState(store, { accessToken: null, error: null });
    },

    /** Limpiar estado pendiente de enrolamiento (al salir del QR sin confirmar) */
    clearPendingEnroll(): void {
      patchState(store, {
        status: 'DISABLED',
        pendingQrUri: null,
        pendingQrBase64: null,
        error: null,
      });
    },

    /** Establecer códigos de recuperación en memoria (uso externo / testing) */
    setPendingRecoveryCodes(codes: string[]): void {
      patchState(store, { pendingRecoveryCodes: codes });
    },

    /**
     * Limpiar códigos de recuperación de memoria.
     * Llamado por RecoveryCodesComponent.ngOnDestroy() — LLD §6.
     */
    clearPendingRecoveryCodes(): void {
      patchState(store, { pendingRecoveryCodes: null });
    },

    /** Resetear error */
    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);
