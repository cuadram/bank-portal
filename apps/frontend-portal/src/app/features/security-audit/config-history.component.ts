import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SecurityAuditService, AuditEventSummary } from './security-audit.service';
import { firstValueFrom } from 'rxjs';

const EVENT_LABELS: Record<string, string> = {
  TWO_FA_ACTIVATED:              '2FA activado',
  TWO_FA_DEACTIVATED:            '2FA desactivado',
  SESSION_TIMEOUT_CHANGED:       'Tiempo de inactividad modificado',
  NOTIFICATION_PREFS_CHANGED:    'Preferencias de notificaciones cambiadas',
  TRUSTED_DEVICE_CREATED:        'Dispositivo de confianza añadido',
  TRUSTED_DEVICE_REVOKED:        'Dispositivo de confianza eliminado',
  ACCOUNT_LOCKED:                'Cuenta bloqueada por intentos fallidos',
  ACCOUNT_UNLOCKED:              'Cuenta desbloqueada',
  RECOVERY_CODES_REGENERATED:    'Códigos de recuperación regenerados',
};

const PERIOD_OPTIONS = [
  { label: 'Últimos 30 días', value: 30 },
  { label: 'Últimos 60 días', value: 60 },
  { label: 'Últimos 90 días', value: 90 },
];

/**
 * US-604 — Historial de cambios de configuración de seguridad.
 *
 * Muestra todos los cambios de configuración auditados del usuario,
 * con indicador visual "⚠️ Desde ubicación nueva" cuando unusualLocation=true.
 *
 * PCI-DSS 4.0 req. 10.2: registro de cambios de configuración de seguridad.
 *
 * @author SOFIA Developer Agent — FEAT-006 US-604 Sprint 7
 */
@Component({
  selector: 'app-config-history',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ch">
      <header class="ch__header">
        <h2 class="ch__title">Historial de cambios de configuración</h2>

        <div class="ch__controls">
          <label class="ch__period-label" for="period-sel">Período</label>
          <select id="period-sel" class="ch__select"
                  (change)="onPeriodChange($event)"
                  aria-label="Seleccionar período">
            @for (opt of periods; track opt.value) {
              <option [value]="opt.value" [selected]="opt.value === selectedDays()">
                {{ opt.label }}
              </option>
            }
          </select>
        </div>
      </header>

      <!-- Aviso PCI-DSS -->
      <div class="ch__notice" role="note">
        <span aria-hidden="true">🔒</span>
        Este historial es inmutable — no puede ser modificado ni suprimido
        (PCI-DSS 4.0 req. 10.2).
      </div>

      @if (loading()) {
        <div class="ch__loading" aria-busy="true" aria-label="Cargando historial">
          <span class="ch__spinner" aria-hidden="true"></span>
          Cargando historial...
        </div>
      } @else if (error()) {
        <div class="ch__error" role="alert">{{ error() }}</div>
      } @else if (!events().length) {
        <div class="ch__empty">
          No hay cambios de configuración registrados en este período.
        </div>
      } @else {
        <p class="ch__count">
          {{ events().length }} cambio{{ events().length !== 1 ? 's' : '' }}
          encontrado{{ events().length !== 1 ? 's' : '' }}
        </p>

        <ul class="ch__list" aria-label="Lista de cambios de configuración">
          @for (event of events(); track event.occurredAt + event.eventType) {
            <li class="ch__item"
                [class.ch__item--unusual]="event.unusualLocation">

              <div class="ch__item-icon" aria-hidden="true">
                {{ eventIcon(event.eventType) }}
              </div>

              <div class="ch__item-body">
                <span class="ch__item-type">
                  {{ eventLabel(event.eventType) }}
                  @if (event.unusualLocation) {
                    <span class="ch__unusual-badge"
                          role="img"
                          aria-label="Cambio realizado desde ubicación nueva">
                      ⚠️ Desde ubicación nueva
                    </span>
                  }
                </span>
                <span class="ch__item-meta">
                  {{ event.occurredAt | date:'dd/MM/yyyy HH:mm' }}
                  @if (event.ipMasked) {
                    · {{ event.ipMasked }}
                  }
                </span>
                @if (event.description) {
                  <span class="ch__item-desc">{{ event.description }}</span>
                }
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    .ch { max-width: 680px; }
    .ch__header { display: flex; align-items: center; justify-content: space-between;
                  margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
    .ch__title  { font-size: 1rem; font-weight: 500; margin: 0;
                  color: var(--color-text-primary); }
    .ch__controls { display: flex; align-items: center; gap: 0.5rem; }
    .ch__period-label { font-size: 0.8125rem; color: var(--color-text-secondary); }
    .ch__select { padding: 0.25rem 0.625rem; border: 1px solid var(--color-border-secondary);
                  border-radius: var(--border-radius-md); font-size: 0.8125rem;
                  background: var(--color-background-primary); }
    .ch__notice { font-size: 0.8125rem; color: var(--color-text-secondary);
                  background: var(--color-background-secondary);
                  border-left: 3px solid var(--color-border-info);
                  padding: 0.5rem 0.75rem; border-radius: 0 var(--border-radius-md) var(--border-radius-md) 0;
                  margin-bottom: 1rem; }
    .ch__loading { display: flex; align-items: center; gap: 0.5rem; padding: 2rem 0;
                   color: var(--color-text-secondary); font-size: 0.875rem; }
    .ch__spinner { width: 1rem; height: 1rem; border: 2px solid var(--color-border-secondary);
                   border-top-color: var(--color-border-info); border-radius: 50%;
                   animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ch__error { color: var(--color-text-danger); font-size: 0.875rem; padding: 1rem 0; }
    .ch__empty { color: var(--color-text-secondary); font-size: 0.875rem; padding: 1.5rem 0;
                 text-align: center; }
    .ch__count { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0 0 0.75rem; }
    .ch__list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column;
                gap: 0.5rem; }
    .ch__item { display: flex; gap: 0.875rem; padding: 0.875rem;
                border: 1px solid var(--color-border-secondary);
                border-radius: var(--border-radius-lg);
                background: var(--color-background-primary); }
    .ch__item--unusual { border-color: var(--color-border-warning);
                         background: var(--color-background-warning); }
    .ch__item-icon { font-size: 1.25rem; flex-shrink: 0; line-height: 1.4; }
    .ch__item-body { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
    .ch__item-type { font-size: 0.875rem; font-weight: 500;
                     color: var(--color-text-primary); display: flex;
                     align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .ch__unusual-badge { font-size: 0.75rem; color: var(--color-text-warning);
                         font-weight: 400; }
    .ch__item-meta { font-size: 0.75rem; color: var(--color-text-tertiary); }
    .ch__item-desc { font-size: 0.8125rem; color: var(--color-text-secondary); }
  `],
})
export class ConfigHistoryComponent implements OnInit {

  private readonly svc = inject(SecurityAuditService);

  readonly events      = signal<AuditEventSummary[]>([]);
  readonly loading     = signal(false);
  readonly error       = signal<string | null>(null);
  readonly selectedDays = signal(90);

  readonly periods = PERIOD_OPTIONS;

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.svc.getConfigHistory(this.selectedDays()));
      this.events.set(data);
    } catch {
      this.error.set('No se pudo cargar el historial de configuración.');
    } finally {
      this.loading.set(false);
    }
  }

  onPeriodChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    this.selectedDays.set(value);
    this.load();
  }

  eventLabel(type: string): string {
    return EVENT_LABELS[type] ?? type.replaceAll('_', ' ').toLowerCase();
  }

  eventIcon(type: string): string {
    if (type.includes('TWO_FA'))       return '🔐';
    if (type.includes('LOCKED'))       return '🔒';
    if (type.includes('UNLOCKED'))     return '🔓';
    if (type.includes('DEVICE'))       return '💻';
    if (type.includes('SESSION'))      return '⏱️';
    if (type.includes('NOTIF'))        return '🔔';
    if (type.includes('RECOVERY'))     return '🗝️';
    return '⚙️';
  }
}
