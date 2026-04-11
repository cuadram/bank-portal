import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KycService } from '../../services/kyc.service';
import { KycStatusResponse } from '../../models/kyc.models';

/**
 * Muestra el estado actual del proceso KYC del usuario.
 * FEAT-013 US-1304 · Sprint 15
 */
@Component({
  selector: 'app-kyc-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kyc-status.component.html'
})
export class KycStatusComponent implements OnInit {

  private readonly kycService = inject(KycService);
  private readonly destroyRef = inject(DestroyRef);

  status: KycStatusResponse | null = null;
  loading = true;
  error   = false;

  ngOnInit(): void {
    this.kycService.getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: resp => { this.status = resp; this.loading = false; },
        error: ()   => { this.error  = true;  this.loading = false; }
      });
  }

  get statusLabel(): string {
    const labels: Record<string, string> = {
      NONE:      'Sin iniciar',
      PENDING:   'Pendiente de completar',
      SUBMITTED: 'En revisión',
      APPROVED:  'Verificado',
      REJECTED:  'Rechazado',
      EXPIRED:   'Caducado'
    };
    return this.status ? (labels[this.status.status] ?? this.status.status) : '';
  }

  get statusClass(): string {
    const map: Record<string, string> = {
      APPROVED:  'kyc-status--approved',
      SUBMITTED: 'kyc-status--pending',
      REJECTED:  'kyc-status--rejected',
      EXPIRED:   'kyc-status--rejected'
    };
    return this.status ? (map[this.status.status] ?? '') : '';
  }
}
