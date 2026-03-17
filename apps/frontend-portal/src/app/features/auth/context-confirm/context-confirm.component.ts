import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { catchError, EMPTY } from 'rxjs';

type ViewState = 'loading' | 'confirming' | 'success' | 'error-expired'
               | 'error-used' | 'error-generic';

/**
 * US-603 — ContextConfirmComponent
 *
 * Deep-link llegado desde email: /auth/confirm-context?token=<rawToken>
 *
 * Flujo:
 * 1. Lee `token` del queryParam
 * 2. Detecta subnet actual (primeros 3 octetos del IP → lo delega al backend)
 * 3. POST /api/v1/auth/confirm-context con JWT scope=context-pending (en localStorage)
 * 4. 204 → redirige a /login?reason=context-confirmed
 * 5. 400 → muestra mensaje de error diferenciado
 *
 * Requisito ADR-011: el JWT scope=context-pending debe estar almacenado
 * (lo puso el flujo de login OTP cuando evaluateContext devolvió ContextPending).
 */
@Component({
  selector: 'app-context-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-container" role="main" aria-live="polite">

      <!-- Loading -->
      <div *ngIf="state === 'loading'" class="state-card">
        <div class="spinner" aria-label="Procesando confirmación"></div>
        <p>Verificando enlace…</p>
      </div>

      <!-- Confirmando -->
      <div *ngIf="state === 'confirming'" class="state-card">
        <div class="spinner" aria-label="Confirmando acceso"></div>
        <p>Confirmando acceso desde nueva ubicación…</p>
      </div>

      <!-- Éxito -->
      <div *ngIf="state === 'success'" class="state-card success">
        <span class="icon" aria-hidden="true">✔</span>
        <h1>Acceso confirmado</h1>
        <p>Tu nueva ubicación de red ha sido registrada.</p>
        <p class="redirect-note">Redirigiendo al inicio de sesión…</p>
      </div>

      <!-- Error: token expirado -->
      <div *ngIf="state === 'error-expired'" class="state-card error">
        <span class="icon" aria-hidden="true">⏱</span>
        <h1>Enlace expirado</h1>
        <p>El enlace de confirmación ha caducado (validez 30 minutos).</p>
        <p>Inicia sesión de nuevo para recibir un enlace actualizado.</p>
        <button class="btn-primary" (click)="goToLogin()">Ir al inicio de sesión</button>
      </div>

      <!-- Error: token ya usado -->
      <div *ngIf="state === 'error-used'" class="state-card error">
        <span class="icon" aria-hidden="true">⚠</span>
        <h1>Enlace ya utilizado</h1>
        <p>Este enlace de confirmación ya fue procesado anteriormente.</p>
        <button class="btn-primary" (click)="goToLogin()">Ir al inicio de sesión</button>
      </div>

      <!-- Error genérico -->
      <div *ngIf="state === 'error-generic'" class="state-card error">
        <span class="icon" aria-hidden="true">✗</span>
        <h1>Error al confirmar</h1>
        <p>No ha sido posible confirmar el acceso. Por favor, inténtalo de nuevo.</p>
        <button class="btn-primary" (click)="goToLogin()">Ir al inicio de sesión</button>
      </div>

    </div>
  `,
  styles: [`
    .confirm-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f5f6fa;
      font-family: Arial, sans-serif;
    }
    .state-card {
      background: #fff;
      border-radius: 8px;
      padding: 2.5rem 3rem;
      text-align: center;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 4px 16px rgba(27,58,107,.12);
    }
    .state-card h1 { color: #1B3A6B; font-size: 1.4rem; margin: .75rem 0 .5rem; }
    .state-card p  { color: #555; font-size: .95rem; margin: .4rem 0; }
    .icon          { font-size: 2.5rem; }
    .success .icon { color: #2e7d32; }
    .error   .icon { color: #c62828; }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid #e0e0e0;
      border-top-color: #1B3A6B;
      border-radius: 50%;
      animation: spin .8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .redirect-note { font-size: .85rem; color: #888; margin-top: .75rem; }
    .btn-primary {
      margin-top: 1.25rem;
      background: #1B3A6B;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: .6rem 1.5rem;
      font-size: .95rem;
      cursor: pointer;
    }
    .btn-primary:hover { background: #14305a; }
  `]
})
export class ContextConfirmComponent implements OnInit {

  state: ViewState = 'loading';

  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http   = inject(HttpClient);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state = 'error-generic';
      return;
    }
    this.confirmContext(token);
  }

  private confirmContext(token: string): void {
    this.state = 'confirming';

    // La subnet la detecta el backend desde el claim pendingSubnet del JWT.
    // Aquí se envía la subnet del cliente para log de auditoría (puede ser vacía).
    const payload = {
      confirmToken:  token,
      currentSubnet: this.detectSubnetHint()
    };

    this.http.post('/api/v1/auth/confirm-context', payload, {
      observe: 'response'
    }).pipe(
      catchError(err => {
        this.handleError(err.status, err.error?.message ?? '');
        return EMPTY;
      })
    ).subscribe(resp => {
      if (resp.status === 204) {
        this.state = 'success';
        // Limpia el JWT context-pending — ya no sirve
        localStorage.removeItem('context_pending_jwt');
        setTimeout(() => this.router.navigate(['/login'],
          { queryParams: { reason: 'context-confirmed' } }), 2500);
      } else {
        this.state = 'error-generic';
      }
    });
  }

  private handleError(status: number, message: string): void {
    if (status === 400) {
      if (message.includes('expirado'))     { this.state = 'error-expired'; return; }
      if (message.includes('ya utilizado')) { this.state = 'error-used';    return; }
    }
    this.state = 'error-generic';
  }

  /** Pista de subnet del cliente — solo primeros 3 octetos. No se usa para seguridad. */
  private detectSubnetHint(): string {
    // En un entorno real se obtiene del servidor via /api/v1/auth/my-subnet
    // Aquí se retorna vacío y el backend usa el claim del JWT.
    return '';
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
