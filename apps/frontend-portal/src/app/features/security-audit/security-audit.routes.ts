import { Routes } from '@angular/router';

/**
 * Rutas lazy del módulo security-audit (FEAT-005).
 * Montadas bajo /security/audit
 *
 * @author SOFIA Developer Agent — FEAT-005 Sprint 6
 */
export const SECURITY_AUDIT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./security-dashboard.component').then(m => m.SecurityDashboardComponent),
    title: 'Panel de Seguridad — Banco Meridian',
  },
  {
    path: 'export',
    loadComponent: () =>
      import('./security-export.component').then(m => m.SecurityExportComponent),
    title: 'Exportar Historial — Banco Meridian',
  },
  {
    path: 'preferences',
    loadComponent: () =>
      import('./security-preferences.component').then(m => m.SecurityPreferencesComponent),
    title: 'Preferencias de Seguridad — Banco Meridian',
  },
  {
    path: 'config-history',
    loadComponent: () =>
      import('./config-history.component').then(m => m.ConfigHistoryComponent),
    title: 'Historial de Configuración — Banco Meridian',
  },
];
