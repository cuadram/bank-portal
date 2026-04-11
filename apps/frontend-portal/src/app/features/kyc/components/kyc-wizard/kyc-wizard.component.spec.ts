import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { KycWizardComponent } from './kyc-wizard.component';
import { KycService } from '../../services/kyc.service';
import { KycStatusResponse } from '../../models/kyc.models';

/**
 * Tests del KycWizardComponent — FEAT-013 US-1306 · Sprint 15
 * CMMI VER SP 2.1
 */
describe('KycWizardComponent', () => {

  let fixture: ComponentFixture<KycWizardComponent>;
  let component: KycWizardComponent;
  let kycServiceSpy: jasmine.SpyObj<KycService>;

  beforeEach(async () => {
    kycServiceSpy = jasmine.createSpyObj('KycService',
      ['getStatus', 'uploadDocument']);

    await TestBed.configureTestingModule({
      imports: [KycWizardComponent],
      providers: [
        provideRouter([]),
        { provide: KycService, useValue: kycServiceSpy }
      ]
    }).compileComponents();
  });

  function create(statusResp: Partial<KycStatusResponse> = {}) {
    kycServiceSpy.getStatus.and.returnValue(of({
      userId: 'u1', status: 'NONE', submittedAt: null,
      rejectionReason: null, kycWizardUrl: '/kyc',
      estimatedReviewHours: 24, ...statusResp
    } as KycStatusResponse));
    fixture   = TestBed.createComponent(KycWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('muestra paso 1 (bienvenida) cuando KYC es NONE', () => {
    create({ status: 'NONE' });
    expect(component.state.step).toBe(1);
    const h1 = fixture.debugElement.query(By.css('h1'));
    expect(h1.nativeElement.textContent).toContain('Verifica tu identidad');
  });

  it('seleccionar tipo DNI avanza al paso 3', () => {
    create({ status: 'NONE' });
    component.state.step = 2;
    fixture.detectChanges();
    component.selectDocType('DNI');
    expect(component.state.step).toBe(3);
    expect(component.state.documentType).toBe('DNI');
  });

  it('Pasaporte salta paso 4 (reverso) y va directo al 5', () => {
    create();
    component.state.documentType = 'PASSPORT';
    component.state.frontFile    = new File([''], 'passport.jpg', { type: 'image/jpeg' });
    component.advanceFromFront();
    expect(component.state.step).toBe(5);
  });

  it('DNI con frontal avanza al paso 4 (reverso)', () => {
    create();
    component.state.documentType = 'DNI';
    component.state.frontFile    = new File([''], 'dni.jpg', { type: 'image/jpeg' });
    component.advanceFromFront();
    expect(component.state.step).toBe(4);
  });

  it('error de subida FILE_TOO_LARGE muestra mensaje apropiado', () => {
    create();
    component.state.step         = 5;
    component.state.documentType = 'DNI';
    component.state.frontFile    = new File([''], 'big.jpg', { type: 'image/jpeg' });
    kycServiceSpy.uploadDocument.and.returnValue(
      throwError(() => ({ error: { code: 'FILE_TOO_LARGE' } }))
    );
    component.submit();
    expect(component.state.error).toContain('10 MB');
    expect(component.state.uploading).toBeFalse();
  });

  it('KYC REJECTED muestra motivo y botón reiniciar', () => {
    create({ status: 'REJECTED', rejectionReason: 'Documento ilegible' });
    expect(component.rejectionReason).toBe('Documento ilegible');
    const h1 = fixture.debugElement.query(By.css('h1'));
    expect(h1.nativeElement.textContent).toContain('no completada');
  });
});
