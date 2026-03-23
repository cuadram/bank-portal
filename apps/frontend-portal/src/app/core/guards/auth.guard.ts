/**
 * core/guards/auth.guard.ts
 * Guard — Protege rutas autenticadas verificando JWT válido y no expirado.
 *
 * RV-017 (Sprint 14): Se añade decodificación del JWT y verificación del
 * claim `exp` para redirigir al login antes de que el backend devuelva 401.
 * El backend seguirá rechazando tokens expirados, pero la UX mejora evitando
 * requests innecesarias.
 *
 * FEAT-012-A | BankPortal — Banco Meridian
 *
 * @author SOFIA Developer Agent — Sprint 14
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token  = localStorage.getItem(environment.jwtStorageKey ?? 'access_token');

  if (!token) {
    return router.createUrlTree(['/auth/login']);
  }

  try {
    // Decodificar payload sin verificar firma (verificación real en backend)
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));

    // RV-017: verificar claim exp antes de conceder acceso
    const isExpired = payload.exp && Date.now() / 1000 > payload.exp;
    if (isExpired) {
      localStorage.removeItem(environment.jwtStorageKey ?? 'access_token');
      return router.createUrlTree(['/auth/login']);
    }

    return true;
  } catch {
    // Token malformado — redirigir al login
    localStorage.removeItem(environment.jwtStorageKey ?? 'access_token');
    return router.createUrlTree(['/auth/login']);
  }
};
