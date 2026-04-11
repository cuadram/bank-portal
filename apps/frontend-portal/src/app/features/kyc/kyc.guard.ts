import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { KycService } from './services/kyc.service';

/**
 * Guard de acceso financiero — bloquea rutas si KYC no está APPROVED.
 * FEAT-013 US-1305 · Sprint 15
 *
 * Protege: /transfers, /payments, /bills
 * Si KYC != APPROVED → redirige a /kyc con mensaje explicativo.
 */
export const kycGuard: CanActivateFn = () => {
  const kycService = inject(KycService);
  const router     = inject(Router);

  return kycService.getStatus().pipe(
    map(resp => {
      if (resp.status === 'APPROVED') return true;
      router.navigate(['/kyc'], {
        queryParams: { reason: 'KYC_REQUIRED' }
      });
      return false;
    }),
    catchError(() => {
      // Sin estado KYC → redirigir al wizard
      router.navigate(['/kyc'], { queryParams: { reason: 'KYC_REQUIRED' } });
      return of(false);
    })
  );
};
