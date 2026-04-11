import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DirectDebitService } from './direct-debit.service';
import { MandatePage } from '../models/mandate.model';

/**
 * Unit tests for DirectDebitService — FEAT-017 Sprint 19
 */
describe('DirectDebitService', () => {
  let service: DirectDebitService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DirectDebitService]
    });
    service = TestBed.inject(DirectDebitService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getMandates() should call GET /api/v1/direct-debits/mandates', () => {
    const mockPage: MandatePage = {
      content: [], totalElements: 0, totalPages: 0, hasNext: false
    };
    service.getMandates().subscribe(res => {
      expect(res.content).toEqual([]);
    });
    const req = http.expectOne(r => r.url.includes('/api/v1/direct-debits/mandates'));
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('createMandate() should call POST /api/v1/direct-debits/mandates', () => {
    const reqBody = {
      creditorName: 'Gym SA', creditorIban: 'ES9121000418450200051332',
      accountId: 'acc-id', otp: '123456'
    };
    service.createMandate(reqBody).subscribe();
    const req = http.expectOne('/api/v1/direct-debits/mandates');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.creditorName).toBe('Gym SA');
    req.flush({ id: 'mandate-id', status: 'ACTIVE' });
  });

  it('cancelMandate() should call DELETE /api/v1/direct-debits/mandates/{id}', () => {
    service.cancelMandate('mandate-id', '654321').subscribe();
    const req = http.expectOne('/api/v1/direct-debits/mandates/mandate-id');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
