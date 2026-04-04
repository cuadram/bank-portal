// DEBT-033: AuthGuard limpio — extraído y simplificado de AuthService
// LA-019-11: sin @Input para params de ruta
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isAuthenticated()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};

export const adminGuard: CanActivateFn = (_route, _state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isAuthenticated() && session.hasRole('ADMIN')) return true;

  return router.createUrlTree(['/forbidden']);
};
