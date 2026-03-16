import { Routes } from '@angular/router';

/**
 * Rutas lazy del módulo session-management.
 * Se carga bajo /security/sessions para mantener la ruta coherente
 * con el panel de seguridad del perfil de usuario.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
export const SESSION_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./containers/security-settings.component').then(
        m => m.SecuritySettingsComponent
      ),
    title: 'Sesiones activas — Banco Meridian',
  },
];
