import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { SessionService } from './session.service';
import { ActiveSession } from '../store/session.model';

/**
 * Tests unitarios para {@link SessionService}.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
describe('SessionService', () => {
  let service: SessionService;
  let http: HttpTestingController;

  const mockSession: ActiveSession = {
    sessionId:    'uuid-123',
    os:           'macOS',
    browser:      'Safari',
    deviceType:   'desktop',
    ipMasked:     '192.168.x.x',
    lastActivity: '2026-04-14T10:00:00Z',
    createdAt:    '2026-04-14T09:00:00Z',
    isCurrent:    true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SessionService],
    });
    service = TestBed.inject(SessionService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ── getActiveSessions ─────────────────────────────────────────────────────

  it('getActiveSessions() calls GET /api/v1/sessions', () => {
    service.getActiveSessions().subscribe(sessions => {
      expect(sessions).toHaveSize(1);
      expect(sessions[0].sessionId).toBe('uuid-123');
    });

    const req = http.expectOne('/api/v1/sessions');
    expect(req.request.method).toBe('GET');
    req.flush([mockSession]);
  });

  // ── revokeSession ─────────────────────────────────────────────────────────

  it('revokeSession() calls DELETE with X-OTP-Code header', () => {
    service.revokeSession('uuid-456', '123456').subscribe();

    const req = http.expectOne('/api/v1/sessions/uuid-456');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('X-OTP-Code')).toBe('123456');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  // ── revokeAllSessions ─────────────────────────────────────────────────────

  it('revokeAllSessions() calls DELETE /api/v1/sessions with OTP', () => {
    service.revokeAllSessions('654321').subscribe();

    const req = http.expectOne('/api/v1/sessions');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('X-OTP-Code')).toBe('654321');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  // ── updateTimeout ─────────────────────────────────────────────────────────

  it('updateTimeout() calls PUT /api/v1/sessions/timeout with payload', () => {
    service.updateTimeout({ timeoutMinutes: 30 }).subscribe(res => {
      expect(res.timeoutMinutes).toBe(30);
    });

    const req = http.expectOne('/api/v1/sessions/timeout');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ timeoutMinutes: 30 });
    req.flush({ timeoutMinutes: 30 });
  });
});
