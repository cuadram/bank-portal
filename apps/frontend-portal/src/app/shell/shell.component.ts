import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shell',
  template: `
    <div class="app-shell">

      <!-- ── SIDEBAR ──────────────────────────────────────── -->
      <nav class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-icon">🏦</span>
          <span class="brand-name">BankPortal</span>
        </div>

        <ul class="nav-list">
          <li class="nav-item">
            <a routerLink="/dashboard" routerLinkActive="nav-active" class="nav-link">
              <span class="nav-icon">📊</span>
              <span class="nav-label">Dashboard</span>
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/accounts" routerLinkActive="nav-active" class="nav-link">
              <span class="nav-icon">💳</span>
              <span class="nav-label">Cuentas</span>
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/cards" routerLinkActive="nav-active" class="nav-link">
              <span class="nav-icon">💎</span>
              <span class="nav-label">Tarjetas</span>
            </a>
          </li>
          <li class="nav-divider"></li>
          <li class="nav-item">
            <a routerLink="/direct-debits" routerLinkActive="nav-active" class="nav-link">
              <span class="nav-icon">🔄</span>
              <span class="nav-label">Domiciliaciones</span>
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/export" routerLinkActive="nav-active" class="nav-link">
              <span class="nav-icon">📥</span>
              <span class="nav-label">Exportación</span>
            </a>
          </li>
          <!-- FEAT-020 Sprint 22: Préstamos — LA-FRONT-001 -->
          <li class="nav-item">
            <a routerLink="/prestamos" routerLinkActive="nav-active" class="nav-link">
              <span class="nav-icon">🏛</span>
              <span class="nav-label">Préstamos</span>
            </a>
          </li>
          <!-- FEAT-019 Sprint 21: Mi Perfil + Centro de Privacidad — LA-FRONT-001 -->
          <li class="nav-divider"></li>
          <li class="nav-item">
            <a routerLink="/perfil" routerLinkActive="nav-active" class="nav-link">
              <span class="nav-icon">👤</span>
              <span class="nav-label">Mi Perfil</span>
            </a>
          </li>
          <li class="nav-item">
            <a routerLink="/privacidad" routerLinkActive="nav-active" class="nav-link">
              <span class="nav-icon">🔒</span>
              <span class="nav-label">Centro de Privacidad</span>
            </a>
          </li>
        </ul>

        <div class="sidebar-footer">
          <button class="btn-logout" (click)="logout()">
            <span>🔓</span> Cerrar sesión
          </button>
        </div>
      </nav>

      <!-- ── CONTENIDO PRINCIPAL ──────────────────────────── -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

    </div>
  `,
  styles: [`
    .app-shell { display: flex; min-height: 100vh; background: #f4f6f9; font-family: Arial, sans-serif; }
    .sidebar { width: 230px; min-width: 230px; background: #1B3A6B; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
    .sidebar-brand { display: flex; align-items: center; gap: .75rem; padding: 1.5rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,.12); }
    .brand-icon { font-size: 1.4rem; }
    .brand-name { color: #fff; font-size: 1.1rem; font-weight: 700; letter-spacing: .02em; }
    .nav-list { list-style: none; padding: .75rem 0; margin: 0; flex: 1; }
    .nav-item { margin: .15rem 0; }
    .nav-divider { height: 1px; background: rgba(255,255,255,.1); margin: .5rem 1rem; }
    .nav-link { display: flex; align-items: center; gap: .75rem; padding: .7rem 1.25rem; color: rgba(255,255,255,.72); text-decoration: none; border-radius: 0 6px 6px 0; margin-right: .75rem; transition: background .15s, color .15s; font-size: .9rem; }
    .nav-link:hover { background: rgba(255,255,255,.1); color: #fff; }
    .nav-active { background: rgba(255,255,255,.18) !important; color: #fff !important; font-weight: 600; }
    .nav-icon { font-size: 1rem; width: 20px; text-align: center; }
    .nav-label { flex: 1; }
    .sidebar-footer { padding: 1rem 1.25rem; border-top: 1px solid rgba(255,255,255,.12); }
    .btn-logout { width: 100%; display: flex; align-items: center; gap: .5rem; background: transparent; border: 1px solid rgba(255,255,255,.3); color: rgba(255,255,255,.8); border-radius: 6px; padding: .55rem 1rem; cursor: pointer; font-size: .85rem; transition: background .15s; }
    .btn-logout:hover { background: rgba(255,255,255,.1); color: #fff; }
    .main-content { flex: 1; padding: 2rem; overflow-y: auto; min-width: 0; }
    @media (max-width: 768px) { .sidebar { display: none; } .main-content { padding: 1rem; } }
  `]
})
export class ShellComponent {
  constructor(private router: Router) {}
  logout(): void {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}
