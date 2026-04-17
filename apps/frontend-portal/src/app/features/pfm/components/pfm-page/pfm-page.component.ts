import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Smart component — contenedor principal Mi Dinero con tabs por query param.
 * Tabs: overview | presupuestos | analisis | distribucion
 * RN-F023-16: navegación con Router.navigateByUrl() — nunca [href] (LA-023-01).
 * FEAT-023 Sprint 25.
 */
@Component({
  selector: 'app-pfm-page',
  template: `
    <div class="pfm-page">
      <div class="pfm-header">
        <h1 class="pfm-title">💰 Mi Dinero</h1>
        <p class="pfm-subtitle">Gestiona tus finanzas personales</p>
      </div>

      <nav class="pfm-tabs">
        <button class="tab-btn" [class.active]="activeTab==='overview'"
                (click)="setTab('overview')">📊 Resumen</button>
        <button class="tab-btn" [class.active]="activeTab==='presupuestos'"
                (click)="setTab('presupuestos')">🎯 Presupuestos</button>
        <button class="tab-btn" [class.active]="activeTab==='analisis'"
                (click)="setTab('analisis')">📈 Análisis</button>
        <button class="tab-btn" [class.active]="activeTab==='distribucion'"
                (click)="setTab('distribucion')">🥧 Distribución</button>
      </nav>

      <div class="pfm-content">
        <app-pfm-overview     *ngIf="activeTab==='overview'"></app-pfm-overview>
        <app-budget-list      *ngIf="activeTab==='presupuestos'"></app-budget-list>
        <app-pfm-analysis     *ngIf="activeTab==='analisis'"></app-pfm-analysis>
        <app-pfm-distribution *ngIf="activeTab==='distribucion'"></app-pfm-distribution>
      </div>
    </div>
  `,
  styles: [`
    .pfm-page    { font-family: Arial, sans-serif; padding: 1.5rem; background: #F5F7FA; min-height: 100vh; }
    .pfm-header  { margin-bottom: 1.5rem; }
    .pfm-title   { color: #1e3a5f; margin: 0; font-size: 1.6rem; }
    .pfm-subtitle{ color: #666; margin: .25rem 0 0; font-size: .9rem; }
    .pfm-tabs    { display: flex; gap: .5rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e0e4ea; padding-bottom: .5rem; }
    .tab-btn     { padding: .5rem 1.2rem; border: none; background: none; cursor: pointer;
                   color: #666; font-size: .95rem; border-radius: 6px 6px 0 0; transition: all .2s; }
    .tab-btn.active { background: #1e3a5f; color: #fff; }
    .tab-btn:hover:not(.active) { background: #e8edf5; color: #1e3a5f; }
    .pfm-content { background: #fff; border-radius: 8px; padding: 1.5rem;
                   box-shadow: 0 2px 8px rgba(0,0,0,.06); }
  `]
})
export class PfmPageComponent implements OnInit {
  activeTab = 'overview';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.activeTab = params['tab'] || 'overview';
    });
  }

  // LA-023-01: navegación interna con Router.navigateByUrl()
  setTab(tab: string): void {
    this.router.navigateByUrl(`/pfm?tab=${tab}`);
  }
}
