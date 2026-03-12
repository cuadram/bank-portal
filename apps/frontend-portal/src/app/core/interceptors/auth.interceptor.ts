/**
 * core/interceptors/auth.interceptor.ts
 * HTTP Interceptor — Inyecta Bearer JWT o PreAuth header según contexto
 * FEAT-001 | BankPortal — Banco Meridian
 *
 * Lógica (LLD §6):
 *  - Rutas públicas (login, register) → sin header
 *  - POST /2fa/verify con pre_auth_token en sessionStorage → Authorization: PreAuth <token>
 *  - Resto de rutas protegidas con access_token en store → Authorization: Bearer <token>
 *
 * DEBT-004 RESUELTO (US-002): TwoFactorStore inyectado dentro del closure
 * de la función interceptor para evitar dependencias circulares.
 */
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TwoFactorStore } from '../../features/two-factor/store/two-factor.store';

/**
 * Rutas que no requieren ningún header de autorización.
 * RV-002 (sprint 02): refactorizar con startsWith + apiBaseUrl para matching robusto.
 */
const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Sin header en rutas públicas
  if (PUBLIC_PATHS.some(path => req.url.includes(path))) {
    return next(req);
  }

  // Prioridad 1: pre_auth_token en sessionStorage → flujo OTP verification (US-002)
  const preAuthToken = sessionStorage.getItem(environment.preAuthTokenSessionKey);
  if (preAuthToken && req.url.includes('/2fa/verify')) {
    return next(
      req.clone({ setHeaders: { Authorization: `PreAuth ${preAuthToken}` } })
    );
  }

  // Prioridad 2: access_token desde TwoFactorStore en memoria (DEBT-004 resuelto)
  // inject() es seguro aquí porque HttpInterceptorFn se ejecuta dentro del
  // injection context de la request, no en el constructor.
  const store = inject(TwoFactorStore);
  const accessToken = store.accessToken();
  if (accessToken) {
    return next(
      req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    );
  }

  return next(req);
};
