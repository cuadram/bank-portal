/**
 * core/interceptors/auth.interceptor.ts
 * HTTP Interceptor — Inyecta Bearer JWT o PreAuth header según contexto
 * FEAT-001 | BankPortal — Banco Meridian
 *
 * Lógica (LLD §6):
 *  - Si hay pre_auth_token en sessionStorage → Authorization: PreAuth <token>
 *  - Si hay access_token en memoria (store) → Authorization: Bearer <token>
 *  - Rutas públicas (login, enroll) no llevan header
 */
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';

const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // No inyectar headers en rutas públicas
  if (PUBLIC_PATHS.some(path => req.url.includes(path))) {
    return next(req);
  }

  // Prioridad 1: pre_auth_token en sessionStorage (flujo OTP verification)
  const preAuthToken = sessionStorage.getItem(environment.preAuthTokenSessionKey);
  if (preAuthToken && req.url.includes('/2fa/verify')) {
    return next(
      req.clone({ setHeaders: { Authorization: `PreAuth ${preAuthToken}` } })
    );
  }

  // Prioridad 2: access_token desde store (inyección diferida para evitar circular deps)
  // El access_token se almacena en memoria vía un servicio auth separado (fuera de scope US-001)
  // Placeholder — se completará en integración con AuthStore
  const accessToken = getAccessTokenFromMemory();
  if (accessToken) {
    return next(
      req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    );
  }

  return next(req);
};

/**
 * Obtiene el access_token desde el store en memoria.
 * Implementación stub — se conectará al AuthStore en la integración con login.
 */
function getAccessTokenFromMemory(): string | null {
  // TODO: inyectar AuthStore cuando esté disponible
  // return inject(AuthStore).accessToken();
  return null;
}
