/**
 * Guard /objetivos/:id — verifica sesión válida.
 *
 * La validación real de ownership la hace el backend con HTTP 403 GoalAccessDenied
 * (savings/api/exception/SavingsExceptionHandler.java mapea GoalAccessDenied -> 403).
 * Este guard solo evita que un usuario no autenticado intente abrir el detalle.
 *
 * FEAT-024 Sprint 26 · LLD-frontend §1.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../../../core/auth/session.service';

export const goalOwnerGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.isAuthenticated()) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
