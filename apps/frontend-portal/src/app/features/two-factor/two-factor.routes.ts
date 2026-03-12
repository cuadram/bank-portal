/**
 * two-factor.routes.ts
 * Lazy routes del feature two-factor
 * FEAT-001 | BankPortal — Banco Meridian
 *
 * TWO_FACTOR_ROUTES  → montar en '/security/2fa'
 * OTP_VERIFY_ROUTES  → montar en '/auth/otp-verify' (flujo login con 2FA)
 */
import { Routes } from '@angular/router';
import { twoFactorGuard } from '../../core/guards/two-factor.guard';

/** Rutas del área de configuración 2FA (/security/2fa) */
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

/**
 * Ruta de verificación OTP en el flujo de login (/auth/otp-verify).
 * Protegida por twoFactorGuard — requiere pre_auth_token en sessionStorage.
 * Sin pre_auth_token → redirige a /auth/login.
 *
 * Montar en app.routes.ts:
 *   { path: 'auth/otp-verify', ...OTP_VERIFY_ROUTES[0] }
 */
export const OTP_VERIFY_ROUTES: Routes = [
  {
    path: '',
    canActivate: [twoFactorGuard],
    loadComponent: () =>
      import('./components/otp-verification/otp-verification.component').then(
        m => m.OtpVerificationComponent
      ),
    title: 'Verificación 2FA — BankPortal'
  }
];
