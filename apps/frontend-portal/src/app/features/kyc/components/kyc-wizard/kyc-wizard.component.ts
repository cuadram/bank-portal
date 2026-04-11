import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KycService } from '../../services/kyc.service';
import { KycUploadComponent } from '../kyc-upload/kyc-upload.component';
import { KycStatusComponent } from '../kyc-status/kyc-status.component';
import {
  DocumentType,
  DocumentSide,
  KycStatus,
  KycWizardState
} from '../../models/kyc.models';

/**
 * KYC Onboarding Wizard — paso a paso.
 * FEAT-013 US-1306 · Sprint 15
 *
 * Pasos: 1-Bienvenida · 2-Tipo documento · 3-Frontal · 4-Reverso (DNI/NIE) · 5-Confirmación
 */
@Component({
  selector: 'app-kyc-wizard',
  standalone: true,
  imports: [CommonModule, KycUploadComponent, KycStatusComponent],
  templateUrl: './kyc-wizard.component.html'
})
export class KycWizardComponent implements OnInit {

  private readonly kycService = inject(KycService);
  private readonly destroyRef = inject(DestroyRef);

  state: KycWizardState = {
    step: 1,
    documentType: null,
    frontFile: null,
    backFile: null,
    uploading: false,
    error: null,
    kycStatus: null
  };

  rejectionReason: string | null = null;
  readonly docTypes: DocumentType[] = ['DNI', 'NIE', 'PASSPORT'];
  readonly totalSteps = 5;

  ngOnInit(): void {
    this.kycService.getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: resp => {
          this.state.kycStatus = resp.status;
          this.rejectionReason = resp.rejectionReason;
          if (resp.status === 'REJECTED') {
            this.state.step = 1; // permite reiniciar
          } else if (resp.status === 'APPROVED' || resp.status === 'SUBMITTED') {
            this.state.step = 5;
          }
        },
        error: () => {} // usuario sin KYC previo — paso 1 es el correcto
      });
  }

  selectDocType(type: DocumentType): void {
    this.state.documentType = type;
    this.state.step = 3;
  }

  onFrontFileSelected(file: File): void {
    this.state.frontFile = file;
    this.state.error = null;
  }

  onBackFileSelected(file: File): void {
    this.state.backFile = file;
    this.state.error = null;
  }

  advanceFromFront(): void {
    if (!this.state.frontFile) return;
    // Pasaporte no requiere reverso
    this.state.step = this.state.documentType === 'PASSPORT' ? 5 : 4;
  }

  advanceFromBack(): void {
    if (!this.state.backFile) return;
    this.state.step = 5;
  }

  submit(): void {
    if (!this.state.documentType || !this.state.frontFile) return;

    this.state.uploading = true;
    this.state.error = null;

    const uploadFront$ = this.kycService.uploadDocument(
      this.state.frontFile,
      this.state.documentType,
      'FRONT'
    );

    uploadFront$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: resp => {
          this.state.kycStatus = resp.kycStatus;
          if (this.state.backFile && this.state.documentType !== 'PASSPORT') {
            this.kycService.uploadDocument(
              this.state.backFile,
              this.state.documentType!,
              'BACK'
            )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: r => {
                this.state.kycStatus = r.kycStatus;
                this.state.uploading = false;
              },
              error: err => this.handleUploadError(err)
            });
          } else {
            this.state.uploading = false;
          }
        },
        error: err => this.handleUploadError(err)
      });
  }

  restart(): void {
    this.state = {
      step: 2,
      documentType: null,
      frontFile: null,
      backFile: null,
      uploading: false,
      error: null,
      kycStatus: null
    };
    this.rejectionReason = null;
  }

  goToStep(step: number): void {
    if (step < this.state.step) this.state.step = step;
  }

  get needsBack(): boolean {
    return this.state.documentType !== 'PASSPORT';
  }

  get progressPct(): number {
    return Math.round((this.state.step / this.totalSteps) * 100);
  }

  private handleUploadError(err: any): void {
    this.state.uploading = false;
    const code = err?.error?.code ?? err?.message ?? 'ERROR_UPLOADING';
    this.state.error = this.errorMessage(code);
  }

  private errorMessage(code: string): string {
    const map: Record<string, string> = {
      FILE_TOO_LARGE:         'El archivo supera el tamaño máximo de 10 MB.',
      UNSUPPORTED_FORMAT:     'Formato no permitido. Usa JPEG, PNG o PDF.',
      DOCUMENT_ALREADY_UPLOADED: 'Ya subiste este documento.',
      KYC_ALREADY_APPROVED:   'Tu verificación ya está aprobada.'
    };
    return map[code] ?? 'Ocurrió un error al subir el documento. Inténtalo de nuevo.';
  }
}
