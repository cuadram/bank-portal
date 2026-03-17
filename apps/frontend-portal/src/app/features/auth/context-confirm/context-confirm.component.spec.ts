import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContextConfirmComponent } from './context-confirm.component';

/**
 * US-603 - Tests unitarios ContextConfirmComponent.
 * SOFIA QA Agent Sprint 7 Semana 2
 *
 * Escenarios:
 *  1. Sin token en queryParam -> state=error-generic
 *  2. Token valido -> POST -> 204 -> state=success + redirect 2.5s
 *  3. Token expirado (400 + 'expirado') -> state=error-expired
 *  4. Token ya usado (400 + 'ya utilizado') -> state=error-used
 *  5. Error generico (500) -> state=error-generic
 */
describe('ContextConfirmComponent', () => {
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  function createComponent(token: string | null) {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ContextConfirmComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => token } } } }
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ContextConfirmComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  afterEach(() => httpMock.verify());

  it('Sin token en URL -> state=error-generic, sin peticion HTTP', () => {
    const comp = createComponent(null);
    expect(comp.state).toBe('error-generic');
    httpMock.expectNone('/api/v1/auth/confirm-context');
  });

  it('Token valido -> POST -> 204 -> state=success', () => {
    const comp = createComponent('valid-token');
    expect(comp.state).toBe('confirming');
    const req = httpMock.expectOne('/api/v1/auth/confirm-context');
    expect(req.request.body.confirmToken).toBe('valid-token');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(comp.state).toBe('success');
  });

  it('Token valido -> success -> redirect a /login despues de 2.5s', fakeAsync(() => {
    createComponent('valid-token');
    const req = httpMock.expectOne('/api/v1/auth/confirm-context');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    tick(2500);
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/login'], { queryParams: { reason: 'context-confirmed' } });
  }));

  it('400 con "expirado" -> state=error-expired', () => {
    const comp = createComponent('expired-token');
    const req = httpMock.expectOne('/api/v1/auth/confirm-context');
    req.flush({ message: 'Token expirado' }, { status: 400, statusText: 'Bad Request' });
    expect(comp.state).toBe('error-expired');
  });

  it('400 con "ya utilizado" -> state=error-used', () => {
    const comp = createComponent('used-token');
    const req = httpMock.expectOne('/api/v1/auth/confirm-context');
    req.flush({ message: 'Token ya utilizado' }, { status: 400, statusText: 'Bad Request' });
    expect(comp.state).toBe('error-used');
  });

  it('500 -> state=error-generic', () => {
    const comp = createComponent('any-token');
    const req = httpMock.expectOne('/api/v1/auth/confirm-context');
    req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    expect(comp.state).toBe('error-generic');
  });
});
