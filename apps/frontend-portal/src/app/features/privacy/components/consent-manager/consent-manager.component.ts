// consent-manager.component.ts — FEAT-019 Sprint 21
// RN-F019-15: SECURITY bloqueado visualmente
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ConsentResponse, ConsentType } from '../../services/privacy.service';

@Component({
  selector: 'app-consent-manager',
  standalone: false,
  template: `
    <div class="consent-card">
      <div class="card-header">
        <h3>Mis consentimientos</h3>
        <span class="badge-gdpr">GDPR Art.7</span>
      </div>
      <p class="card-sub">Puedes cambiar tus preferencias en cualquier momento</p>
      <div class="consent-list">
        <div class="consent-item" *ngFor="let c of consents">
          <div class="consent-icon">{{ iconFor(c.tipo) }}</div>
          <div class="consent-info">
            <div class="consent-name">{{ labelFor(c.tipo) }}</div>
            <div class="consent-desc">{{ descFor(c.tipo) }}</div>
          </div>
          <label class="toggle" [title]="c.tipo === 'SECURITY' ? 'Las alertas de seguridad no pueden desactivarse' : ''">
            <input type="checkbox"
                   [checked]="c.activo"
                   [disabled]="c.tipo === 'SECURITY'"
                   (change)="onChange(c.tipo, $any($event.target).checked)">
            <span class="slider" [class.locked]="c.tipo === 'SECURITY'"></span>
          </label>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .consent-card { background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; }
    .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
    .card-header h3 { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
    .badge-gdpr { background: #EFF6FF; color: #1B3E7E; font-size: 11px; padding: 2px 8px;
      border-radius: 10px; font-weight: 600; }
    .card-sub { font-size: 13px; color: #6B7280; margin: 0 0 16px; }
    .consent-list { display: flex; flex-direction: column; }
    .consent-item { display: flex; align-items: center; padding: 14px 0;
      border-bottom: 1px solid #F3F4F6; gap: 14px; }
    .consent-item:last-child { border-bottom: none; }
    .consent-icon { width: 40px; height: 40px; border-radius: 10px; background: #F3F4F6;
      display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .consent-info { flex: 1; }
    .consent-name { font-size: 14px; font-weight: 600; color: #111827; }
    .consent-desc { font-size: 12px; color: #6B7280; margin-top: 2px; }
    .toggle { position: relative; display: inline-block; width: 48px; height: 26px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; inset: 0; background: #D1D5DB;
      border-radius: 26px; transition: .3s; }
    .slider:before { position: absolute; content: ""; height: 20px; width: 20px;
      left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .3s; }
    input:checked + .slider { background: #22C55E; }
    input:checked + .slider:before { transform: translateX(22px); }
    input:disabled + .slider { background: #1B3E7E; cursor: not-allowed; opacity: .85; }
    input:disabled:checked + .slider { background: #1B3E7E; }
    input:disabled:checked + .slider:before { transform: translateX(22px); }
  `]
})
export class ConsentManagerComponent {
  @Input()  consents: ConsentResponse[] = [];
  @Output() consentChanged = new EventEmitter<{ tipo: string; activo: boolean }>();

  onChange(tipo: ConsentType, activo: boolean): void {
    if (tipo === 'SECURITY') return; // RN-F019-15
    this.consentChanged.emit({ tipo, activo });
  }

  iconFor(tipo: ConsentType): string {
    return { MARKETING: '📢', ANALYTICS: '📊', COMMUNICATIONS: '💬', SECURITY: '🛡️' }[tipo] ?? '⚙️';
  }

  labelFor(tipo: ConsentType): string {
    return { MARKETING: 'Marketing', ANALYTICS: 'Analítica',
      COMMUNICATIONS: 'Comunicaciones', SECURITY: 'Seguridad' }[tipo] ?? tipo;
  }

  descFor(tipo: ConsentType): string {
    const d: Record<ConsentType, string> = {
      MARKETING:      'Ofertas y productos personalizados de Banco Meridian',
      ANALYTICS:      'Mejora de la aplicación basada en tu comportamiento de uso',
      COMMUNICATIONS: 'Notificaciones por email y SMS sobre tu actividad bancaria',
      SECURITY:       'Alertas críticas de seguridad — siempre activo por regulación',
    };
    return d[tipo] ?? '';
  }
}
