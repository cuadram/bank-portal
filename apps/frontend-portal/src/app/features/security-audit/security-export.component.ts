import {
  ChangeDetectionStrategy, Component, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecurityAuditService } from './security-audit.service';

/**
 * US-402 — Exportar historial de seguridad en PDF o CSV.
 * Descarga Blob con hash SHA-256 en header X-Content-SHA256.
 *
 * @author SOFIA Developer Agent — FEAT-005 Sprint 6
 */
@Component({
  selector: 'app-security-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="se">
      <h2 class="se__title">Exportar historial de seguridad</h2>
      <p class="se__desc">
        Descarga un registro de los eventos de seguridad de tu cuenta.
        El archivo incluye un hash SHA-256 para verificar su integridad.
      </p>

      <div class="se__form">
        <div class="se__field">
          <label class="se__label">Formato</label>
          <div class="se__radio-group" role="radiogroup" aria-label="Formato de exportación">
            @for (fmt of formats; track fmt.value) {
              <label class="se__radio-label">
                <input type="radio" name="format" [value]="fmt.value"
                       [(ngModel)]="selectedFormat" />
                {{ fmt.label }}
              </label>
            }
          </div>
        </div>

        <div class="se__field">
          <label class="se__label" for="days-select">Período</label>
          <select id="days-select" class="se__select"
                  [(ngModel)]="selectedDays"
                  aria-label="Período de exportación">
            <option [value]="30">Últimos 30 días</option>
            <option [value]="60">Últimos 60 días</option>
            <option [value]="90">Últimos 90 días</option>
          </select>
        </div>

        <button class="se__btn" [disabled]="loading()"
                [attr.aria-busy]="loading()"
                (click)="export()">
          @if (loading()) {
            <span class="spinner sm" aria-hidden="true"></span>Generando...
          } @else {
            Exportar historial
          }
        </button>
      </div>

      @if (message()) {
        <p class="se__message" [class.se__message--error]="isError()"
           [attr.role]="isError() ? 'alert' : 'status'">
          {{ message() }}
        </p>
      }
    </section>
  `,
  styles: [`
    .se { max-width: 480px; }
    .se__title { font-size: 1rem; font-weight: 500; margin: 0 0 0.5rem; }
    .se__desc  { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0 0 1.5rem; }
    .se__form  { display: flex; flex-direction: column; gap: 1rem; }
    .se__field { display: flex; flex-direction: column; gap: 0.375rem; }
    .se__label { font-size: 0.875rem; font-weight: 500; }
    .se__radio-group { display: flex; gap: 1rem; }
    .se__radio-label { font-size: 0.875rem; display: flex; align-items: center; gap: 0.375rem;
                       cursor: pointer; }
    .se__select { padding: 0.5rem 0.75rem; border: 1px solid var(--color-border-secondary);
                  border-radius: var(--border-radius-md);
                  background: var(--color-background-primary);
                  color: var(--color-text-primary); font-size: 0.875rem; }
    .se__btn { padding: 0.625rem 1.25rem; background: var(--color-background-info);
               color: var(--color-text-info); border: 1px solid var(--color-border-info);
               border-radius: var(--border-radius-md); cursor: pointer; font-size: 0.875rem;
               display: flex; align-items: center; gap: 0.5rem; align-self: flex-start; }
    .se__btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .se__message { margin-top: 0.75rem; font-size: 0.875rem;
                   color: var(--color-text-success); }
    .se__message--error { color: var(--color-text-danger); }
    .spinner { display: inline-block; width: 14px; height: 14px;
               border: 2px solid currentColor; border-top-color: transparent;
               border-radius: 50%; animation: spin 0.7s linear infinite; }
    .spinner.sm { width: 12px; height: 12px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SecurityExportComponent {

  private readonly svc = inject(SecurityAuditService);

  readonly loading  = signal(false);
  readonly message  = signal<string | null>(null);
  readonly isError  = signal(false);

  selectedFormat: 'pdf' | 'csv' = 'pdf';
  selectedDays = 30;

  readonly formats = [
    { label: 'PDF', value: 'pdf' as const },
    { label: 'CSV', value: 'csv' as const },
  ];

  async export(): Promise<void> {
    this.loading.set(true);
    this.message.set(null);
    this.isError.set(false);
    try {
      const response = await firstValueFrom(
        this.svc.exportHistory(this.selectedFormat, this.selectedDays)
      );

      if (response.status === 204) {
        this.message.set('No hay eventos en el período seleccionado.');
        return;
      }

      const blob = response.body!;
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const cd   = response.headers.get('Content-Disposition') ?? '';
      const name = cd.match(/filename="([^"]+)"/)?.[1]
                ?? `seguridad-${this.selectedFormat}-${this.selectedDays}d.${this.selectedFormat}`;
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
      this.message.set('Archivo descargado correctamente.');
    } catch {
      this.isError.set(true);
      this.message.set('Error al generar la exportación. Inténtalo de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }
}

// Import necesario para firstValueFrom
import { firstValueFrom } from 'rxjs';
