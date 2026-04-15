import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-shell',
  template: `
    <div class="app-shell">

      <!-- ── SIDEBAR ──────────────────────────────────────── -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="brand-text">🏛 BankPortal</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard"    routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">📊</span> <span class="nav-label">Dashboard</span>
          </a>
          <a routerLink="/accounts"     routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">🏦</span> <span class="nav-label">Cuentas</span>
          </a>
          <a routerLink="/cards"        routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">💳</span> <span class="nav-label">Tarjetas</span>
          </a>
          <div class="nav-divider"></div>
          <a routerLink="/direct-debits" routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">🔄</span> <span class="nav-label">Domiciliaciones</span>
          </a>
          <a routerLink="/export"       routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">📤</span> <span class="nav-label">Exportación</span>
          </a>
          <a routerLink="/prestamos"    routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">🏛</span> <span class="nav-label">Préstamos</span>
          </a>
          <!-- FEAT-021 Sprint 23 — Depósitos a Plazo Fijo -->
          <a routerLink="/depositos"    routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">💰</span> <span class="nav-label">Depósitos</span>
          </a>
          <!-- FEAT-022 Sprint 24 — Bizum P2P (LA-FRONT-001) -->
          <a routerLink="/bizum" routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">💸</span> <span class="nav-label">Bizum</span>
          </a>
          <div class="nav-divider"></div>
          <a routerLink="/perfil"       routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">👤</span> <span class="nav-label">Mi Perfil</span>
          </a>
          <a routerLink="/privacidad"   routerLinkActive="nav-active" class="nav-item">
            <span class="nav-icon">🔒</span> <span class="nav-label">Centro de Privacidad</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="btn-logout" (click)="logout()">🔓 Cerrar sesión</button>
        </div>
      </aside>

      <!-- ── CONTENIDO PRINCIPAL ──────────────────────────── -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .app-shell {
      display: flex;
      min-height: 100vh;
      background: #F5F7FA;
      font-family: 'Inter', 'Roboto', Arial, sans-serif;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 200px;
      min-width: 200px;
      background: #1e3a5f;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      flex-shrink: 0;
    }

    .sidebar-brand {
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,.1);
    }
    .brand-text {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      font-family: 'Inter', 'Roboto', Arial, sans-serif;
    }

    /* ── Nav items ── */
    .sidebar-nav {
      flex: 1;
      padding: 8px 0;
      display: flex;
      flex-direction: column;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      color: rgba(255,255,255,.72);
      text-decoration: none;
      font-size: 13px;
      cursor: pointer;
      transition: background 150ms, color 150ms;
      border-left: 3px solid transparent;
    }
    .nav-item:hover {
      background: rgba(255,255,255,.1);
      color: #fff;
    }
    .nav-active {
      background: rgba(255,255,255,.15) !important;
      color: #fff !important;
      font-weight: 600;
      border-left-color: #fff !important;
    }
    .nav-icon {
      font-size: 15px;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }
    .nav-label { flex: 1; }
    .nav-divider {
      height: 1px;
      background: rgba(255,255,255,.1);
      margin: 6px 0;
    }

    /* ── Footer ── */
    .sidebar-footer {
      padding: 12px 16px;
      border-top: 1px solid rgba(255,255,255,.1);
    }
    .btn-logout {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: 1px solid rgba(255,255,255,.25);
      color: rgba(255,255,255,.75);
      border-radius: 6px;
      padding: 7px 12px;
      cursor: pointer;
      font-size: 12px;
      font-family: 'Inter', 'Roboto', Arial, sans-serif;
      transition: background 150ms;
    }
    .btn-logout:hover {
      background: rgba(255,255,255,.1);
      color: #fff;
    }

    /* ── Main content ── */
    .main-content {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
      min-width: 0;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { padding: 16px; }
    }
  `]
})
export class ShellComponent {
  constructor(private router: Router) {}
  logout(): void {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}
