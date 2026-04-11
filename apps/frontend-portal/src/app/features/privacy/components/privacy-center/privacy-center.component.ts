// privacy-center.component.ts — FEAT-019 Sprint 21
// Hub principal del Centro de Privacidad GDPR
// LA-FRONT-002: componente real — endpoint backend /api/v1/privacy/consents existe (S21)
import { Component, OnInit, inject } from '@angular/core';
import { PrivacyService, ConsentResponse } from '../../services/privacy.service';

@Component({
  selector:    'app-privacy-center',
  standalone:  false,
  template: `
    <div class="privacy-page">
      <div class="privacy-hero">
        <h1>🔒 Centro de Privacidad</h1>
        <p>Gestiona tus consentimientos y ejerce tus derechos GDPR</p>
      </div>

      <div *ngIf="errorMsg" class="alert-error">{{ errorMsg }}</div>
      <div *ngIf="isLoading" class="loading">Cargando...</div>

      <div *ngIf="!isLoading" class="privacy-sections">

        <!-- Consentimientos -->
        <app-consent-manager
          [consents]="consents"
          (consentChanged)="onConsentChanged($event)">
        </app-consent-manager>

        <!-- Portabilidad de datos -->
        <app-data-export
          [exportStatus]="exportStatus"
          (exportRequested)="onExportRequested()">
        </app-data-export>

        <!-- Eliminación de cuenta -->
        <app-deletion-request
          (deletionConfirmed)="onDeletionConfirmed()">
        </app-deletion-request>
      </div>
    </div>
  `,
  styles: [`
    .privacy-page { padding: 24px; max-width: 800px; }
    .privacy-hero { background: linear-gradient(135deg,#1B3E7E,#2A5298);
      border-radius: 12px; padding: 28px; color: white; margin-bottom: 24px; }
    .privacy-hero h1 { font-size: 22px; margin-bottom: 8px; }
    .privacy-hero p  { font-size: 14px; opacity: .85; margin: 0; }
    .privacy-sections { display: flex; flex-direction: column; gap: 20px; }
    .alert-error { background: #FEE2E2; color: #B91C1C; padding: 12px 16px;
      border-radius: 8px; font-size: 14px; }
    .loading { color: #6B7280; font-size: 14px; }
  `]
})
export class PrivacyCenterComponent implements OnInit {

  private readonly privacySvc = inject(PrivacyService);

  consents:     ConsentResponse[] = [];
  exportStatus: any = null;
  isLoading     = true;
  errorMsg:     string | null = null;

  ngOnInit(): void {
    this.privacySvc.getConsents().subscribe({
      next:  (c) => { this.consents = c; this.isLoading = false; },
      error: ()  => { this.errorMsg = 'Error cargando privacidad.'; this.isLoading = false; }
    });
  }

  onConsentChanged(event: { tipo: string; activo: boolean }): void {
    this.privacySvc.updateConsent({ tipo: event.tipo as any, activo: event.activo })
      .subscribe({ next: (updated) => {
        this.consents = this.consents.map(c =>
          c.tipo === updated.tipo ? updated : c);
      }});
  }

  onExportRequested(): void {
    this.privacySvc.requestDataExport().subscribe({
      next:  (r) => { this.exportStatus = r; },
      error: ()  => { this.errorMsg = 'Error solicitando exportación.'; }
    });
  }

  onDeletionConfirmed(): void {
    // Redirigir a login tras confirmación
    window.location.href = '/login';
  }
}
