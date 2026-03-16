import {
  ChangeDetectionStrategy, Component, OnInit, computed, inject, signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  SecurityAuditService, SecurityDashboardResponse
} from './security-audit.service';
import { firstValueFrom } from 'rxjs';

/**
 * US-401 — Dashboard de seguridad del usuario.
 * Muestra KPIs, estado de seguridad (SECURE/REVIEW/ALERT) y gráfico de actividad.
 *
 * @author SOFIA Developer Agent — FEAT-005 Sprint 6
 */
@Component({
  selector: 'app-security-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="sd">
      <h1 class="sd__title">Panel de seguridad</h1>

      @if (loading()) {
        <div class="sd__loading" aria-busy="true">
          <span class="spinner" aria-hidden="true"></span>Cargando...
        </div>
      } @else if (error()) {
        <div class="sd__error" role="alert">{{ error() }}</div>
      } @else if (summary()) {

        <!-- Estado global -->
        <div class="sd__score" role="status"
             [style.color]="scoreColor()">
          <span class="sd__score-dot" aria-hidden="true">●</span>
          Cuenta {{ scoreLabel() }}
        </div>

        <!-- KPI cards -->
        <div class="sd__kpis" role="region" aria-label="Indicadores de seguridad">
          <div class="sd__kpi" role="group" aria-label="Logins en 30 días">
            <p class="sd__kpi-label">Logins (30 días)</p>
            <p class="sd__kpi-value">{{ summary()!.loginCount30d }}</p>
          </div>
          <div class="sd__kpi" [class.sd__kpi--warn]="summary()!.failedAttempts30d > 0"
               role="group" aria-label="Intentos fallidos">
            <p class="sd__kpi-label">Intentos fallidos</p>
            <p class="sd__kpi-value">{{ summary()!.failedAttempts30d }}</p>
          </div>
          <div class="sd__kpi" role="group" aria-label="Sesiones activas">
            <p class="sd__kpi-label">Sesiones activas</p>
            <p class="sd__kpi-value">{{ summary()!.activeSessions }}</p>
          </div>
          <div class="sd__kpi" role="group" aria-label="Dispositivos de confianza">
            <p class="sd__kpi-label">Dispositivos confiables</p>
            <p class="sd__kpi-value">{{ summary()!.trustedDevices }}</p>
          </div>
        </div>

        <!-- Gráfico de actividad (barras simples SVG) -->
        <div class="sd__chart-wrap">
          <p class="sd__chart-title">Actividad diaria — últimos 30 días</p>
          <div class="sd__chart"
               role="img"
               [attr.aria-label]="'Gráfico de actividad de los últimos 30 días'">
            @for (point of summary()!.activityChart; track point.date) {
              <div class="sd__bar-wrap">
                <div class="sd__bar"
                     [style.height.%]="barHeight(point.count)"
                     [title]="point.date + ': ' + point.count + ' eventos'">
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Actividad reciente -->
        <div class="sd__recent">
          <h2 class="sd__recent-title">Actividad reciente</h2>
          @for (event of summary()!.recentEvents; track event.occurredAt) {
            <div class="sd__event">
              <span class="sd__event-icon" aria-hidden="true">
                {{ eventIcon(event.eventType) }}
              </span>
              <div class="sd__event-info">
                <p class="sd__event-desc">{{ event.description }}</p>
                <p class="sd__event-meta">
                  {{ event.ipMasked }} ·
                  {{ event.occurredAt | date:'dd/MM/yyyy HH:mm' }}
                </p>
              </div>
            </div>
          }
        </div>

      }
    </section>
  `,
  styles: [`
    .sd { max-width: 720px; }
    .sd__title { font-size: 1.1rem; font-weight: 500; margin: 0 0 1rem; }
    .sd__loading { display: flex; align-items: center; gap: 0.5rem;
                   color: var(--color-text-secondary); font-size: 0.875rem; }
    .sd__error { background: var(--color-background-danger); color: var(--color-text-danger);
                 padding: 0.75rem 1rem; border-radius: var(--border-radius-md);
                 font-size: 0.875rem; }
    .sd__score { font-size: 0.875rem; font-weight: 500; margin-bottom: 1rem;
                 display: flex; align-items: center; gap: 0.4rem; }
    .sd__kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;
                margin-bottom: 1.5rem; }
    .sd__kpi { background: var(--color-background-secondary);
               border-radius: var(--border-radius-lg); padding: 0.875rem 1rem; }
    .sd__kpi--warn { border-left: 3px solid var(--color-border-warning); }
    .sd__kpi-label { font-size: 0.75rem; color: var(--color-text-secondary); margin: 0 0 4px; }
    .sd__kpi-value { font-size: 1.5rem; font-weight: 500; margin: 0; }
    .sd__chart-wrap { margin-bottom: 1.5rem; }
    .sd__chart-title { font-size: 0.8125rem; color: var(--color-text-secondary); margin: 0 0 0.5rem; }
    .sd__chart { display: flex; align-items: flex-end; gap: 3px; height: 80px;
                 background: var(--color-background-secondary);
                 border-radius: var(--border-radius-md); padding: 8px; }
    .sd__bar-wrap { flex: 1; height: 100%; display: flex; align-items: flex-end; }
    .sd__bar { width: 100%; background: var(--color-background-info);
               border-radius: 2px 2px 0 0; min-height: 2px;
               transition: height 0.3s; }
    .sd__recent-title { font-size: 0.875rem; font-weight: 500; margin: 0 0 0.75rem; }
    .sd__event { display: flex; gap: 0.75rem; padding: 0.625rem 0;
                 border-bottom: .5px solid var(--color-border-tertiary); }
    .sd__event:last-child { border-bottom: none; }
    .sd__event-icon { font-size: 14px; margin-top: 2px; }
    .sd__event-desc { font-size: 0.875rem; margin: 0 0 2px; }
    .sd__event-meta { font-size: 0.75rem; color: var(--color-text-secondary); margin: 0; }
    .spinner { display: inline-block; width: 14px; height: 14px;
               border: 2px solid var(--color-border-secondary);
               border-top-color: var(--color-text-info);
               border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SecurityDashboardComponent implements OnInit {

  private readonly svc = inject(SecurityAuditService);

  readonly summary = signal<SecurityDashboardResponse | null>(null);
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  readonly scoreColor = computed(() => {
    switch (this.summary()?.securityScore) {
      case 'SECURE': return 'var(--color-text-success)';
      case 'REVIEW': return 'var(--color-text-warning)';
      case 'ALERT':  return 'var(--color-text-danger)';
      default:       return 'var(--color-text-secondary)';
    }
  });

  readonly scoreLabel = computed(() => {
    switch (this.summary()?.securityScore) {
      case 'SECURE': return 'segura';
      case 'REVIEW': return 'requiere revisión';
      case 'ALERT':  return 'en alerta';
      default: return '';
    }
  });

  private maxCount = computed(() =>
    Math.max(1, ...( this.summary()?.activityChart.map(p => p.count) ?? [1]))
  );

  barHeight(count: number): number {
    return Math.round((count / this.maxCount()) * 100);
  }

  ngOnInit(): void { this.loadDashboard(); }

  async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.svc.getDashboard());
      this.summary.set(data);
    } catch {
      this.error.set('No se pudo cargar el panel de seguridad.');
    } finally {
      this.loading.set(false);
    }
  }

  eventIcon(eventType: string): string {
    const icons: Record<string, string> = {
      LOGIN_NEW_DEVICE: '⚠', SESSION_REVOKED: '✕',
      TRUSTED_DEVICE_CREATED: '✓', TWO_FA_DEACTIVATED: '🔓',
    };
    return icons[eventType] ?? '●';
  }
}
