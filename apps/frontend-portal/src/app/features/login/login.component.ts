import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

/**
 * LoginComponent — pantalla de login.
 * BUG-VER-002 fix (LA-STG-002, 2026-04-01): versión/sprint leídos de environment.ts
 * — eliminada cadena hardcodeada 'Sprint 13 · v1.13.0'.
 * BankPortal · SOFIA Angular Developer
 */
@Component({
  selector: 'app-login',
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="logo">🏦</div>
        <h1>Banco Meridian</h1>
        <p class="subtitle">Portal de Banca Digital</p>

        <div class="form-group">
          <label>Usuario</label>
          <input type="text" [(ngModel)]="username" placeholder="usuario@meridian.es" />
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" [(ngModel)]="password" placeholder="••••••••" />
        </div>

        <button (click)="login()" class="btn-login" [disabled]="loading">
          {{ loading ? 'Accediendo...' : 'Acceder' }}
        </button>

        <p *ngIf="error" class="error">{{ error }}</p>

        <div class="dev-notice">
          <small>🔧 Entorno {{ env }} · Sprint {{ sprint }} · v{{ version }}</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; align-items: center;
      justify-content: center; background: linear-gradient(135deg, #1B3A6B 0%, #2d5fa6 100%);
    }
    .login-card {
      background: white; border-radius: 16px; padding: 2.5rem;
      width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,.3);
      text-align: center;
    }
    .logo { font-size: 3rem; margin-bottom: .5rem; }
    h1 { color: #1B3A6B; margin: 0 0 .25rem; font-size: 1.5rem; }
    .subtitle { color: #666; margin: 0 0 2rem; font-size: .9rem; }
    .form-group { text-align: left; margin-bottom: 1rem; }
    .form-group label { display: block; font-size: .85rem; color: #333; margin-bottom: .3rem; font-weight: 600; }
    .form-group input {
      width: 100%; padding: .75rem; border: 1px solid #ddd; border-radius: 8px;
      font-size: 1rem; box-sizing: border-box; outline: none;
      transition: border-color .2s;
    }
    .form-group input:focus { border-color: #1B3A6B; }
    .btn-login {
      width: 100%; padding: .9rem; background: #1B3A6B; color: white;
      border: none; border-radius: 8px; font-size: 1rem; font-weight: 600;
      cursor: pointer; margin-top: .5rem; transition: background .2s;
    }
    .btn-login:hover:not(:disabled) { background: #2d5fa6; }
    .btn-login:disabled { opacity: .6; cursor: not-allowed; }
    .error { color: #e53935; font-size: .85rem; margin-top: .75rem; }
    .dev-notice { margin-top: 1.5rem; color: #999; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading  = false;
  error    = '';

  // LA-STG-002: interpolados desde environment.ts — nunca hardcodeados
  readonly version = environment.version;
  readonly sprint  = environment.sprint;
  readonly env     = environment.envLabel;

  constructor(private router: Router, private http: HttpClient) {}

  login(): void {
    if (!this.username || !this.password) {
      this.error = 'Introduce usuario y contraseña';
      return;
    }
    this.loading = true;
    this.error   = '';

    this.http.post<{ accessToken: string }>('/auth/login', {
      email:    this.username,
      password: this.password
    }).subscribe({
      next: res => {
        localStorage.setItem('access_token', res.accessToken);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading = false;
        this.error   = 'Email o contraseña incorrectos';
      }
    });
  }
}
