/**
 * Guard /objetivos/:id — verifica sesión válida.
 *
 * La validación real de ownership la hace el backend con HTTP 403 GoalAccessDenied
 * (savings/api/exception/SavingsExceptionHandler.java mapea GoalAccessDenied -> 403).
 * Este guard solo evita que un usuario no autenticado intente abrir el detalle.
 *
 * FEAT-024 Sprint 26 · LLD-frontend §1.
 *
 * BUG-S26-AUTH-001 (DR-S26-008, fix mínimo Step 7 Sprint 26):
 * El guard original delegaba en SessionService que lee de sessionStorage.bp_access_token,
 * pero LoginComponent escribe en localStorage.access_token (3 sistemas de storage auth
 * coexistiendo). NADIE escribe sessionStorage.bp_access_token, por lo que el guard
 * fallaba SIEMPRE y redirigía a /login al hacer click en cualquier meta.
 *
 * Fix mínimo: leer el storage canónico que SÍ está conectado con un writer
 * (consistente con AuthGuard y JwtInterceptor). El refactor unificado de auth
 * (DEBT-033 + DEBT-FE-074) queda planificado para S27.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const goalOwnerGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);

  // BUG-S26-AUTH-001: storage canónico = localStorage.access_token
  // Consistente con AuthGuard (/dashboard) y JwtInterceptor.
  const token = localStorage.getItem('access_token');
  if (token) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
};
