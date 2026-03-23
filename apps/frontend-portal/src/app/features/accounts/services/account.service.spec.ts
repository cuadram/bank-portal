import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AccountService } from './account.service';
import { environment } from '../../../../../environments/environment';

/**
 * US-701/702/703 — Tests unitarios AccountService (HTTP).
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
describe('AccountService', () => {
  let service: AccountService;
  let http:    HttpTestingController;
  const base = `${environment.apiUrl}/api/v1/accounts`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AccountService]
    });
    service = TestBed.inject(AccountService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ── US-701 ────────────────────────────────────────────────────────────────

  it('US-701: GET /accounts devuelve lista de cuentas', () => {
    // Arrange
    const mock = [{ id: 'acc-1', alias: 'Corriente', ibanMasked: 'ES91 **** 1332',
                    type: 'CORRIENTE', availableBalance: 3842.55, retainedBalance: 250 }];
    // Act
    let result: any;
    service.getAccounts().subscribe(r => result = r);
    // Assert
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
    expect(result.length).toBe(1);
    expect(result[0].alias).toBe('Corriente');
  });

  // ── US-702 ────────────────────────────────────────────────────────────────

  it('US-702: GET /accounts/:id/transactions sin filtros — params page=0 size=20', () => {
    // Arrange & Act
    service.getTransactions('acc-1').subscribe();
    // Assert
    const req = http.expectOne(r => r.url === `${base}/acc-1/transactions`);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, last: true });
  });

  it('US-702: filtro de tipo CARGO se incluye en params', () => {
    // Arrange & Act
    service.getTransactions('acc-1', { type: 'CARGO' }).subscribe();
    // Assert
    const req = http.expectOne(r => r.url === `${base}/acc-1/transactions`);
    expect(req.request.params.get('type')).toBe('CARGO');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, last: true });
  });

  // ── US-703 ────────────────────────────────────────────────────────────────

  it('US-703: query de búsqueda se envía como param q', () => {
    // Arrange & Act
    service.getTransactions('acc-1', { q: 'netflix' }).subscribe();
    // Assert
    const req = http.expectOne(r => r.url === `${base}/acc-1/transactions`);
    expect(req.request.params.get('q')).toBe('netflix');
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, last: true });
  });

  it('US-703: filtros undefined no se incluyen en params', () => {
    // Arrange & Act
    service.getTransactions('acc-1', { from: undefined, type: undefined }).subscribe();
    // Assert
    const req = http.expectOne(r => r.url === `${base}/acc-1/transactions`);
    expect(req.request.params.has('from')).toBeFalse();
    expect(req.request.params.has('type')).toBeFalse();
    req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, last: true });
  });
});
