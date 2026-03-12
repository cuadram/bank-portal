/**
 * components/recovery-codes/recovery-codes.component.ts
 * Muestra/descarga los códigos de recuperación
 * US-003 — PENDIENTE IMPLEMENTACIÓN COMPLETA | FEAT-001
 */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'bp-recovery-codes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="recovery-codes" role="main">
      <h2>Códigos de recuperación</h2>
      <p>Esta funcionalidad se implementará en US-003.</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecoveryCodesComponent {}
