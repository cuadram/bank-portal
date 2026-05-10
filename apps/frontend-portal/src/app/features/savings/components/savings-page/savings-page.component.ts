import { Component } from '@angular/core';

/**
 * SavingsPageComponent - Container Fase G.2 LOTE 2.1
 *
 * Wrapper puro con <router-outlet> para las rutas hijas del modulo savings:
 *   /objetivos              -> GoalListComponent (G.2.1)
 *   /objetivos/nuevo        -> GoalCreateFormComponent (G.2.2)
 *   /objetivos/:id          -> GoalDetailComponent (G.2.3)
 *   /objetivos/:id/editar   -> GoalEditFormComponent (G.2.3)
 *   /objetivos/:id/aportar  -> ContributionModalComponent (G.3)
 *   /objetivos/:id/auto     -> AutoRuleFormComponent (G.3)
 *
 * Sin logica propia: el shell global del portal (app-shell) lo provee la pantalla
 * envolvente; aqui solo hace falta el outlet.
 *
 * LLD-frontend-FEAT-024-sprint26.md seccion 2 (routing) y seccion 5 (inventario).
 *
 * FEAT-024 Sprint 26.
 */
@Component({
  selector: 'app-savings-page',
  template: `
    <div class="savings-page">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .savings-page {
      display: block;
      width: 100%;
    }
  `]
})
export class SavingsPageComponent {}
