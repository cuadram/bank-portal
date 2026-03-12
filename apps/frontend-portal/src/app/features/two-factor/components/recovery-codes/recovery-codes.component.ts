/**
 * components/recovery-codes/recovery-codes.component.ts
 * Muestra y permite descargar los códigos de recuperación TOTP.
 * US-003 — T-009 | FEAT-001 | BankPortal — Banco Meridian
 *
 * Dos contextos de uso (LLD §2, diagrama de componentes):
 *
 *   A) Post-enrolamiento (desde QrEnrollComponent → TwoFactorSetupComponent):
 *      store.availableRecoveryCodes() fue inicializado con recovery_codes_count
 *      durante confirmEnroll, pero pendingRecoveryCodes es null porque
 *      ConfirmEnrollResponse no devuelve los códigos en texto plano.
 *      → El componente llama generateRecoveryCodes() automáticamente al iniciar.
 *
 *   B) Regeneración (desde TwoFactorSetupComponent.onRegenerateRecoveryCodes()):
 *      El usuario ya tiene códigos activos (availableRecoveryCodes > 0).
 *      Regenerar invalida los anteriores — requiere confirmación explícita.
 *      → El componente presenta un modal de confirmación antes de llamar
 *        generateRecoveryCodes().
 *
 * Distinción de contexto:
 *   availableRecoveryCodes() > 0 antes del primer generate en esta sesión
 *   → modo REGENERATE (pide confirmación).
 *   availableRecoveryCodes() === 0 → modo POST_ENROLL (auto-genera).
 *
 * Seguridad (LLD §6):
 *   - pendingRecoveryCodes en memoria: limpiados en ngOnDestroy.
 *   - Nunca guardados en localStorage ni sessionStorage.
 *   - La descarga (.txt) se crea y revoca via Blob API sin persistencia.
 *   - Botón "Copiar" usa Clipboard API (solo en contexto seguro HTTPS).
 */
import {
  Component, inject, OnInit, OnDestroy,
  ChangeDetectionStrategy, signal, effect, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TwoFactorStore } from '../../store/two-factor.store';

/** Fases de visualización del componente */
type CodesView = 'LOADING' | 'CONFIRM_REGENERATE' | 'DISPLAY' | 'ERROR';

@Component({
  selector: 'bp-recovery-codes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recovery-codes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecoveryCodesComponent implements OnInit, OnDestroy {

  readonly store = inject(TwoFactorStore);
  private readonly router = inject(Router);

  /** Vista actual del componente */
  readonly view = signal<CodesView>('LOADING');

  /** Indica si el usuario ha confirmado que leyó y guardó los códigos */
  readonly codesAcknowledged = signal(false);

  /** Feedback de copia al portapapeles */
  readonly copyFeedback = signal<'idle' | 'success' | 'error'>('idle');

  /**
   * En modo REGENERATE, el conteo de códigos activos ANTES de generar nuevos.
   * Se captura en ngOnInit para mostrar el aviso de invalidación correctamente
   * aunque availableRecoveryCodes cambie tras la generación.
   */
  private codesCountBeforeRegenerate = 0;
  readonly previousCodesCount = signal(0);

  /** Códigos actuales como array desde el store */
  readonly codes = computed(() => this.store.pendingRecoveryCodes() ?? []);

  /**
   * Effect: transiciona a DISPLAY cuando el store entrega los códigos.
   * Cubre tanto el auto-generate (post-enrolamiento) como el generate
   * disparado tras confirmación explícita (regeneración).
   */
  private readonly codesReadyEffect = effect(() => {
    const codes = this.store.pendingRecoveryCodes();
    if (codes && codes.length > 0 && !this.store.isLoading()) {
      this.view.set('DISPLAY');
    }
  });

  /**
   * Effect: transiciona a ERROR si el store reporta error durante la carga.
   * Solo activo mientras la vista es LOADING (evita sobreescribir DISPLAY).
   */
  private readonly errorEffect = effect(() => {
    if (this.store.error() && this.view() === 'LOADING') {
      this.view.set('ERROR');
    }
  });

  ngOnInit(): void {
    const currentCodes = this.store.availableRecoveryCodes();

    if (currentCodes > 0 && this.store.pendingRecoveryCodes() === null) {
      // Contexto B: regeneración — el usuario ya tiene códigos activos.
      // Guardar el conteo para el aviso de invalidación y pedir confirmación.
      this.codesCountBeforeRegenerate = currentCodes;
      this.previousCodesCount.set(currentCodes);
      this.view.set('CONFIRM_REGENERATE');
    } else if (this.store.pendingRecoveryCodes() !== null) {
      // Los códigos ya están en el store (navegación back en misma sesión).
      this.view.set('DISPLAY');
    } else {
      // Contexto A: post-enrolamiento — genera automáticamente.
      this.store.generateRecoveryCodes(undefined as unknown as void);
    }
  }

  /** El usuario confirma la regeneración de códigos (invalida los anteriores) */
  onConfirmRegenerate(): void {
    this.view.set('LOADING');
    this.store.generateRecoveryCodes(undefined as unknown as void);
  }

  /** El usuario cancela la regeneración y vuelve a la configuración */
  onCancelRegenerate(): void {
    this.router.navigate(['/security/2fa']);
  }

  /** Reintentar la generación tras un error */
  onRetry(): void {
    this.store.clearError();
    this.view.set('LOADING');
    this.store.generateRecoveryCodes(undefined as unknown as void);
  }

  /**
   * Copiar todos los códigos al portapapeles.
   * Clipboard API solo disponible en contextos seguros (HTTPS / localhost).
   * Feedback visual durante 2 segundos.
   */
  onCopyAll(): void {
    const text = this.codes().join('\n');
    if (!navigator.clipboard) {
      this.copyFeedback.set('error');
      setTimeout(() => this.copyFeedback.set('idle'), 2000);
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        this.copyFeedback.set('success');
        setTimeout(() => this.copyFeedback.set('idle'), 2000);
      },
      () => {
        this.copyFeedback.set('error');
        setTimeout(() => this.copyFeedback.set('idle'), 2000);
      }
    );
  }

  /**
   * Descargar los códigos como archivo .txt.
   * Blob API — el objeto URL se revoca inmediatamente tras la descarga.
   * No queda nada en memoria ni en caché del navegador.
   */
  onDownload(): void {
    const content = [
      'BankPortal — Banco Meridian',
      'Códigos de recuperación 2FA',
      '================================',
      'Guarda este archivo en un lugar seguro.',
      'Cada código es de un solo uso.',
      '',
      ...this.codes()
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'bankportal-recovery-codes.txt';
    anchor.click();
    // Revocar el objeto URL en el siguiente tick para asegurar que el
    // navegador haya procesado el click antes de la revocación.
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /** El usuario confirma que guardó los códigos y continúa */
  onContinue(): void {
    // La limpieza de pendingRecoveryCodes se hace en ngOnDestroy.
    this.router.navigate(['/security/2fa']);
  }

  ngOnDestroy(): void {
    // Seguridad LLD §6: limpiar códigos de memoria al salir del componente.
    this.store.clearPendingRecoveryCodes();
    this.store.clearError();
  }
}
