import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { kycGuard } from './kyc.guard';
import { KycService } from './services/kyc.service';
import { KycStatusResponse } from './models/kyc.models';

/**
 * Tests del KycGuard — FEAT-013 US-1305 · Sprint 15
 * CMMI VER SP 2.1
 */
describe('kycGuard', () => {

  let kycServiceSpy: jasmine.SpyObj<KycService>;
  let router: Router;

  function runGuard() {
    return TestBed.runInInjectionContext(() =>
      kycGuard({} as any, {} as any)
    );
  }

  beforeEach(() => {
    kycServiceSpy = jasmine.createSpyObj('KycService', ['getStatus']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: KycService, useValue: kycServiceSpy }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('permite acceso si KYC está APPROVED', (done) => {
    kycServiceSpy.getStatus.and.returnValue(of(status('APPROVED')));
    (runGuard() as any).subscribe((result: boolean) => {
      expect(result).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
      done();
    });
  });

  it('redirige a /kyc si KYC está PENDING', (done) => {
    kycServiceSpy.getStatus.and.returnValue(of(status('PENDING')));
    (runGuard() as any).subscribe((result: boolean) => {
      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/kyc'], jasmine.any(Object));
      done();
    });
  });

  it('redirige a /kyc si KYC está SUBMITTED', (done) => {
    kycServiceSpy.getStatus.and.returnValue(of(status('SUBMITTED')));
    (runGuard() as any).subscribe((result: boolean) => {
      expect(result).toBeFalse();
      done();
    });
  });

  it('redirige a /kyc si el servicio falla (usuario sin KYC)', (done) => {
    kycServiceSpy.getStatus.and.returnValue(throwError(() => new Error('404')));
    (runGuard() as any).subscribe((result: boolean) => {
      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalled();
      done();
    });
  });

  function status(s: string): KycStatusResponse {
    return { userId: 'u1', status: s as any, submittedAt: null,
             rejectionReason: null, kycWizardUrl: '/kyc', estimatedReviewHours: 24 };
  }
});
