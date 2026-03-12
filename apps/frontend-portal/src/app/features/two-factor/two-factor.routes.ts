/**
 * two-factor.routes.ts
 * Lazy routes del feature two-factor
 * FEAT-001 | BankPortal — Banco Meridian
 */
import { Routes } from '@angular/router';

export const TWO_FACTOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/two-factor-setup/two-factor-setup.component').then(
        m => m.TwoFactorSetupComponent
      ),
    title: 'Configuración 2FA — BankPortal'
  },
  {
    path: 'recovery-codes',
    loadComponent: () =>
      import('./components/recovery-codes/recovery-codes.component').then(
        m => m.RecoveryCodesComponent
      ),
    title: 'Códigos de recuperación — BankPortal'
  }
];
