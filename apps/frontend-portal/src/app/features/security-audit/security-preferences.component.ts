import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { SecurityAuditService } from './security-audit.service';
import { firstValueFrom } from 'rxjs';

export interface SecurityPreferencesResponse {
  twoFactorEnabled:        boolean;
  sessionTimeoutMinutes:   number;
  trustedDevicesCount:     number;
  notificationsEnabled:    boolean;
  notificationsByType:     Record<string, boolean>;
}

const NOTIF_LABELS: Record<string, string> = {
  LOGIN_NEW_DEVICE:       'Nuevo acceso desde dispositivo desconocido',
  LOGIN_FAILED_ATTEMPTS:  'Intentos fallidos de acceso detectados',
  SESSION_REVOKED:        'Sesión cerrada remotamente',
  SESSION_REVOKED_ALL:    'Todas las sesiones cerradas',
  TRUSTED_DEVICE_CREATED: 'Dispositivo de confianza añadido',
  TRUSTED_DEVICE_REVOKED: 'Dispositivo de confianza eliminado',
  TWO_FA_ACTIVATED:       'Verificación en dos pasos activada',
  TWO_FA_DEACTIVATED:     'Verificación en dos pasos desactivada',
  ACCOUNT_LOCKED:         'Cuenta bloqueada por intentos fallidos',
  ACCOUNT_UNLOCKED:       'Cuenta desbloqueada',
};

/**
 * US-403 — Preferencias de seguridad unificadas.
 * R-F5-003: disclaimer SIEMPRE visible — audit_log no puede desactivarse.
 *
 * @author SOFIA Developer Agent — FEAT-005 US-403 Sprint 7
 */
@Component({
  selector: 'app-security-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sp">
      <h2 class="sp__title">Preferencias de seguridad</h2>

      @if (loading()) {
        <div class="sp__loading" aria-busy="true">Cargando preferencias...</div>
      } @else if (prefs()) {

        <!-- 2FA -->
        <details class="sp__section" [open]="true">
          <summary class="sp__section-head" aria-expanded="true">
            Verificación en dos pasos (2FA)
          </summary>
          <div class="sp__section-body">
            <span [class]="prefs()!.twoFactorEnabled ? 'sp__badge sp__badge--ok' : 'sp__badge sp__badge--warn'">
              {{ prefs()!.twoFactorEnabled ? '✅ Activo' : '⚠️ Inactivo — se recomienda activarlo' }}
            </span>
            <a class="sp__link" routerLink="/security/settings">Gestionar 2FA →</a>
          </div>
        </details>

        <!-- Timeout -->
        <details class="sp__section">
          <summary class="sp__section-head">Tiempo de inactividad de sesión</summary>
          <div class="sp__section-body">
            <label class="sp__label" for="timeout-sel">Cerrar sesión tras</label>
            <select id="timeout-sel" class="sp__select"
                    [(ngModel)]="selectedTimeout"
                    (change)="saveTimeout()"
                    aria-label="Timeout de sesión en minutos">
              <option [value]="5">5 minutos</option>
              <option [value]="15">15 minutos</option>
              <option [value]="30">30 minutos</option>
              <option [value]="60">60 minutos</option>
            </select>
            @if (timeoutSaved()) {
              <span class="sp__saved" role="status">✓ Guardado</span>
            }
          </div>
        </details>

        <!-- Dispositivos -->
        <details class="sp__section">
          <summary class="sp__section-head">Dispositivos de confianza</summary>
          <div class="sp__section-body">
            <span>{{ prefs()!.trustedDevicesCount }} dispositivos registrados</span>
            <a class="sp__link" routerLink="/security/trusted-devices">Gestionar →</a>
          </div>
        </details>

        <!-- Notificaciones -->
        <details class="sp__section">
          <summary class="sp__section-head">Notificaciones de seguridad</summary>
          <div class="sp__section-body">

            <!-- R-F5-003: disclaimer OBLIGATORIO — no colapsable -->
            <div class="sp__disclaimer" role="note">
              <strong>ℹ️ Aviso:</strong> Desactivar un tipo de notificación solo afecta
              a los mensajes visibles en este panel. El registro de auditoría de seguridad
              siempre permanece activo por requisitos legales y de cumplimiento.
            </div>

            <div class="sp__toggles" role="group" aria-label="Preferencias de notificaciones">
              @for (entry of notifEntries(); track entry.key) {
                <label class="sp__toggle-row">
                  <span class="sp__toggle-label">{{ notifLabel(entry.key) }}</span>
                  <button class="sp__toggle"
                          role="switch"
                          [attr.aria-checked]="entry.value"
                          [class.sp__toggle--on]="entry.value"
                          (click)="toggleNotif(entry.key)">
                    {{ entry.value ? 'Activado' : 'Desactivado' }}
                  </button>
                </label>
              }
            </div>

            <button class="sp__save-btn" [disabled]="saving()"
                    (click)="saveNotifPrefs()">
              {{ saving() ? 'Guardando...' : 'Guardar preferencias' }}
            </button>
            @if (saveSuccess()) {
              <span class="sp__saved" role="status">✓ Preferencias guardadas</span>
            }
            @if (error()) {
              <div class="sp__error" role="alert">{{ error() }}</div>
            }
          </div>
        </details>
      }
    </section>
  `,
  styles: [`
    .sp { max-width: 600px; }
    .sp__title { font-size: 1rem; font-weight: 500; margin: 0 0 1rem; color: var(--color-text-primary); }
    .sp__loading { color: var(--color-text-secondary); font-size: 0.875rem; }
    .sp__section { border: 1px solid var(--color-border-secondary); border-radius: var(--border-radius-lg);
                   margin-bottom: 0.75rem; }
    .sp__section-head { padding: 0.875rem 1rem; cursor: pointer; font-size: 0.875rem;
                        font-weight: 500; list-style: none; display: flex; align-items: center; }
    .sp__section-head::marker, .sp__section-head::-webkit-details-marker { display: none; }
    .sp__section-head::before { content: "▶"; margin-right: 0.5rem; font-size: 0.7rem;
                                 transition: transform 0.2s; }
    details[open] .sp__section-head::before { transform: rotate(90deg); }
    .sp__section-body { padding: 0 1rem 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .sp__badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8125rem;
                 display: inline-flex; align-items: center; }
    .sp__badge--ok   { background: var(--color-background-success); color: var(--color-text-success); }
    .sp__badge--warn { background: var(--color-background-warning); color: var(--color-text-warning); }
    .sp__link { font-size: 0.8125rem; color: var(--color-text-info); text-decoration: none; }
    .sp__label { font-size: 0.875rem; }
    .sp__select { padding: 0.375rem 0.75rem; border: 1px solid var(--color-border-secondary);
                  border-radius: var(--border-radius-md); font-size: 0.875rem;
                  background: var(--color-background-primary); }
    .sp__saved { font-size: 0.8125rem; color: var(--color-text-success); }
    /* Disclaimer R-F5-003 — siempre visible */
    .sp__disclaimer { background: var(--color-background-secondary);
                      border-left: 3px solid var(--color-border-info);
                      padding: 0.625rem 0.875rem; border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
                      font-size: 0.8125rem; color: var(--color-text-secondary); }
    .sp__toggles { display: flex; flex-direction: column; gap: 0.5rem; }
    .sp__toggle-row { display: flex; align-items: center; justify-content: space-between;
                      padding: 0.375rem 0; }
    .sp__toggle-label { font-size: 0.875rem; }
    .sp__toggle { padding: 0.25rem 0.75rem; border: 1px solid var(--color-border-secondary);
                  border-radius: 20px; cursor: pointer; font-size: 0.75rem;
                  background: var(--color-background-secondary); }
    .sp__toggle--on { background: var(--color-background-info); color: var(--color-text-info);
                      border-color: var(--color-border-info); }
    .sp__save-btn { padding: 0.5rem 1rem; background: var(--color-background-info);
                    color: var(--color-text-info); border: 1px solid var(--color-border-info);
                    border-radius: var(--border-radius-md); cursor: pointer; font-size: 0.875rem;
                    align-self: flex-start; }
    .sp__save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .sp__error { color: var(--color-text-danger); font-size: 0.875rem; }
  `],
})
export class SecurityPreferencesComponent implements OnInit {

  private readonly svc = inject(SecurityAuditService);

  readonly prefs       = signal<SecurityPreferencesResponse | null>(null);
  readonly loading     = signal(false);
  readonly saving      = signal(false);
  readonly saveSuccess = signal(false);
  readonly timeoutSaved= signal(false);
  readonly error       = signal<string | null>(null);

  selectedTimeout = 30;
  private notifPrefsLocal: Record<string, boolean> = {};

  readonly notifEntries = () =>
    Object.entries(this.notifPrefsLocal).map(([key, value]) => ({ key, value }));

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.svc.getPreferences());
      this.prefs.set(data);
      this.selectedTimeout  = data.sessionTimeoutMinutes;
      this.notifPrefsLocal  = { ...data.notificationsByType };
    } catch {
      this.error.set('No se pudieron cargar las preferencias.');
    } finally {
      this.loading.set(false);
    }
  }

  async saveTimeout(): Promise<void> {
    try {
      await firstValueFrom(this.svc.updatePreferences({ sessionTimeoutMinutes: this.selectedTimeout }));
      this.timeoutSaved.set(true);
      setTimeout(() => this.timeoutSaved.set(false), 3000);
    } catch { /* silent */ }
  }

  toggleNotif(key: string): void {
    this.notifPrefsLocal[key] = !this.notifPrefsLocal[key];
  }

  async saveNotifPrefs(): Promise<void> {
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.error.set(null);
    try {
      await firstValueFrom(this.svc.updatePreferences({ notificationsByType: this.notifPrefsLocal }));
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    } catch {
      this.error.set('Error al guardar las preferencias.');
    } finally {
      this.saving.set(false);
    }
  }

  notifLabel(key: string): string {
    return NOTIF_LABELS[key] ?? key;
  }
}
