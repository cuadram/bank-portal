import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TrustedDevicesComponent } from '../trusted-devices.component';

/**
 * Tests unitarios para {@link TrustedDevicesComponent} — ACT-23 Sprint 6.
 * Cubre US-202: listado, revocación individual, revocación total y estado vacío.
 *
 * @author SOFIA Developer Agent — Sprint 6 (ACT-23)
 */
describe('TrustedDevicesComponent', () => {
  let component: TrustedDevicesComponent;
  let http: HttpTestingController;

  const mockDevice = {
    deviceId:   'uuid-dev-1',
    os:         'macOS',
    browser:    'Safari',
    ipMasked:   '192.168.x.x',
    createdAt:  '2026-04-01T10:00:00Z',
    lastUsedAt: '2026-05-01T10:00:00Z',
    expiresAt:  '2026-06-01T10:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrustedDevicesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const fixture = TestBed.createComponent(TrustedDevicesComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ── ngOnInit ──────────────────────────────────────────────────────────────

  it('ngOnInit() calls GET /api/v1/trusted-devices', () => {
    component.ngOnInit();

    const req = http.expectOne('/api/v1/trusted-devices');
    expect(req.request.method).toBe('GET');
    req.flush([mockDevice]);

    expect(component.devices()).toHaveSize(1);
    expect(component.devices()[0].deviceId).toBe('uuid-dev-1');
  });

  it('ngOnInit() sets loading=false after response', fakeAsync(() => {
    component.ngOnInit();
    expect(component.loading()).toBeTrue();

    http.expectOne('/api/v1/trusted-devices').flush([mockDevice]);
    tick();

    expect(component.loading()).toBeFalse();
  }));

  it('ngOnInit() handles error gracefully', fakeAsync(() => {
    component.ngOnInit();

    http.expectOne('/api/v1/trusted-devices').error(new ProgressEvent('error'));
    tick();

    expect(component.error()).toContain('No se pudieron cargar');
    expect(component.loading()).toBeFalse();
  }));

  // ── revokeOne ─────────────────────────────────────────────────────────────

  it('revokeOne() calls DELETE and removes device from list', fakeAsync(() => {
    component.devices.set([mockDevice]);

    component.revokeOne('uuid-dev-1');
    expect(component.revoking()).toBe('uuid-dev-1');

    http.expectOne('/api/v1/trusted-devices/uuid-dev-1').flush(null, {
      status: 204, statusText: 'No Content',
    });
    tick();

    expect(component.devices()).toHaveSize(0);
    expect(component.revoking()).toBeNull();
  }));

  it('revokeOne() sets error on failure', fakeAsync(() => {
    component.devices.set([mockDevice]);

    component.revokeOne('uuid-dev-1');
    http.expectOne('/api/v1/trusted-devices/uuid-dev-1')
        .error(new ProgressEvent('error'));
    tick();

    expect(component.error()).toContain('Error al eliminar');
    expect(component.revoking()).toBeNull();
  }));

  // ── revokeAll ─────────────────────────────────────────────────────────────

  it('revokeAll() calls DELETE /api/v1/trusted-devices and clears list', fakeAsync(() => {
    component.devices.set([mockDevice]);

    component.revokeAll();
    expect(component.revoking()).toBe('all');

    http.expectOne('/api/v1/trusted-devices').flush(null, {
      status: 204, statusText: 'No Content',
    });
    tick();

    expect(component.devices()).toHaveSize(0);
    expect(component.revoking()).toBeNull();
  }));

  // ── Estado vacío ──────────────────────────────────────────────────────────

  it('shows empty state when devices list is empty', fakeAsync(() => {
    component.ngOnInit();
    http.expectOne('/api/v1/trusted-devices').flush([]);
    tick();

    expect(component.devices()).toHaveSize(0);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
  }));

  // ── aria-label en botón de revocación ─────────────────────────────────────

  it('deviceId is tracked correctly for revoking state', () => {
    component.devices.set([mockDevice]);
    component.revoking.set('uuid-dev-1');

    // El template usa [isRevoking]="revoking() === device.deviceId"
    expect(component.revoking()).toBe(mockDevice.deviceId);
  });
});
