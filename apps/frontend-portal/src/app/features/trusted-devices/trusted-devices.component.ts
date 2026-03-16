import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface TrustedDeviceResponse {
  deviceId: string;
  os: string;
  browser: string;
  ipMasked: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

/**
 * Componente US-202 — Gestionar dispositivos de confianza.
 * Lista, muestra fecha de expiración y permite revocar individualmente o todos.
 *
 * Accesibilidad WCAG 2.1 AA:
 *  - aria-label en botones de revocación con contexto del dispositivo
 *  - role="alert" en mensajes de error
 *  - aria-busy en estado de carga
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4
 */
@Component({
  selector: 'app-trusted-devices',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="trusted-devices">
      <h2 class="td__title">Dispositivos de confianza</h2>
      <p class="td__desc">
        Estos dispositivos pueden iniciar sesión sin introducir el código de verificación.
        Elimina cualquiera que no reconozcas.
      </p>

      @if (error()) {
        <div class="td__error" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="td__loading" aria-busy="true">
          <span class="spinner" aria-hidden="true"></span>
          Cargando dispositivos...
        </div>
      } @else if (devices().length === 0) {
        <p class="td__empty">No tienes dispositivos de confianza registrados.</p>
      } @else {
        <div class="td__list">
          @for (device of devices(); track device.deviceId) {
            <div class="td__card">
              <div class="td__card-header">
                <span class="td__device-icon" aria-hidden="true">
                  {{ device.os === 'iOS' || device.os === 'Android' ? '📱' : '🖥' }}
                </span>
                <div class="td__device-meta">
                  <span class="td__device-name">{{ device.os }} · {{ device.browser }}</span>
                  <span class="td__device-detail">IP: {{ device.ipMasked }}</span>
                  <span class="td__device-detail">
                    Expira: {{ device.expiresAt | date:'dd/MM/yyyy' }}
                  </span>
                </div>
                <button
                  class="td__btn-revoke"
                  [disabled]="revoking() === device.deviceId"
                  [attr.aria-label]="'Eliminar dispositivo ' + device.os + ' ' + device.browser"
                  [attr.aria-busy]="revoking() === device.deviceId"
                  (click)="revokeOne(device.deviceId)">
                  @if (revoking() === device.deviceId) {
                    <span class="spinner sm" aria-hidden="true"></span>
                  } @else {
                    Eliminar
                  }
                </button>
              </div>
            </div>
          }
        </div>

        <button
          class="td__btn-revoke-all"
          [disabled]="revoking() !== null"
          (click)="revokeAll()">
          Eliminar todos los dispositivos de confianza
        </button>
      }

      <!-- Checkbox "Recordar este dispositivo" — visible solo post-login 2FA -->
      @if (showTrustOption()) {
        <div class="td__trust-option">
          <label class="td__trust-label">
            <input
              type="checkbox"
              [(ngModel)]="trustDeviceChecked"
              class="td__trust-checkbox"
              aria-label="Recordar este dispositivo durante 30 días" />
            Recordar este dispositivo durante 30 días
          </label>
        </div>
      }
    </section>
  `,
  styles: [`
    .trusted-devices { max-width: 600px; }
    .td__title { font-size: 1.1rem; font-weight: 500; margin: 0 0 0.5rem; }
    .td__desc  { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0 0 1.25rem; }
    .td__error { background: var(--color-background-danger); color: var(--color-text-danger);
                 padding: 0.75rem 1rem; border-radius: var(--border-radius-md);
                 font-size: 0.875rem; margin-bottom: 1rem; }
    .td__loading { display: flex; align-items: center; gap: 0.5rem;
                   color: var(--color-text-secondary); font-size: 0.875rem; }
    .td__empty { color: var(--color-text-secondary); font-size: 0.875rem; }
    .td__list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }
    .td__card { border: 1px solid var(--color-border-tertiary);
                border-radius: var(--border-radius-lg); padding: 1rem; }
    .td__card-header { display: flex; align-items: flex-start; gap: 0.75rem; }
    .td__device-icon { font-size: 1.5rem; }
    .td__device-meta { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .td__device-name   { font-size: 0.875rem; font-weight: 500; }
    .td__device-detail { font-size: 0.75rem; color: var(--color-text-secondary); }
    .td__btn-revoke {
      padding: 0.375rem 0.75rem; border-radius: var(--border-radius-md);
      border: 1px solid var(--color-border-danger); color: var(--color-text-danger);
      background: transparent; cursor: pointer; font-size: 0.8125rem; white-space: nowrap;
    }
    .td__btn-revoke:hover:not(:disabled) { background: var(--color-background-danger); }
    .td__btn-revoke:disabled { opacity: 0.5; cursor: not-allowed; }
    .td__btn-revoke-all {
      margin-top: 0.5rem; padding: 0.5rem 1rem;
      border: 1px solid var(--color-border-danger); color: var(--color-text-danger);
      background: transparent; border-radius: var(--border-radius-md);
      cursor: pointer; font-size: 0.875rem; width: 100%;
    }
    .td__btn-revoke-all:hover:not(:disabled) { background: var(--color-background-danger); }
    .td__btn-revoke-all:disabled { opacity: 0.5; cursor: not-allowed; }
    .td__trust-option { margin-top: 1.5rem; padding-top: 1rem;
                        border-top: 1px solid var(--color-border-tertiary); }
    .td__trust-label { display: flex; align-items: center; gap: 0.5rem;
                       font-size: 0.875rem; cursor: pointer; }
    .spinner { display: inline-block; width: 14px; height: 14px;
               border: 2px solid var(--color-border-secondary);
               border-top-color: var(--color-text-secondary);
               border-radius: 50%; animation: spin 0.7s linear infinite; }
    .spinner.sm { width: 12px; height: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class TrustedDevicesComponent implements OnInit {

  private readonly http = inject(HttpClient);

  readonly devices  = signal<TrustedDeviceResponse[]>([]);
  readonly loading  = signal(false);
  readonly revoking = signal<string | null>(null);
  readonly error    = signal<string | null>(null);

  /** Mostrar checkbox post-login 2FA — activado externamente si aplica */
  readonly showTrustOption = signal(false);
  trustDeviceChecked = false;

  ngOnInit(): void { this.loadDevices(); }

  async loadDevices(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const devices = await firstValueFrom(
        this.http.get<TrustedDeviceResponse[]>('/api/v1/trusted-devices')
      );
      this.devices.set(devices);
    } catch {
      this.error.set('No se pudieron cargar los dispositivos de confianza.');
    } finally {
      this.loading.set(false);
    }
  }

  async revokeOne(deviceId: string): Promise<void> {
    this.revoking.set(deviceId);
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete(`/api/v1/trusted-devices/${deviceId}`));
      this.devices.update(list => list.filter(d => d.deviceId !== deviceId));
    } catch {
      this.error.set('Error al eliminar el dispositivo.');
    } finally {
      this.revoking.set(null);
    }
  }

  async revokeAll(): Promise<void> {
    this.revoking.set('all');
    this.error.set(null);
    try {
      await firstValueFrom(this.http.delete('/api/v1/trusted-devices'));
      this.devices.set([]);
    } catch {
      this.error.set('Error al eliminar todos los dispositivos.');
    } finally {
      this.revoking.set(null);
    }
  }
}
