/**
 * core/guards/two-factor.guard.ts
 * Guard — Protege /auth/otp-verify: solo accesible si pre_auth_token presente
 * FEAT-001 | BankPortal — Banco Meridian
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export const twoFactorGuard: CanActivateFn = () => {
  const router = inject(Router);
  const preAuthToken = sessionStorage.getItem(environment.preAuthTokenSessionKey);

  if (preAuthToken) {
    return true;
  }

  // No hay pre_auth_token — redirigir al login
  return router.createUrlTree(['/auth/login']);
};
