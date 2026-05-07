/**
 * Routing del modulo Savings (Objetivos de Ahorro) - FEAT-024 Sprint 26.
 *
 * G.0: shell con rutas vacias.
 * G.2 LOTE 2.3 cierra Fase G.2 con 4 rutas reales bajo SavingsPageComponent
 * (router-outlet wrapper).
 * G.3 anadira /:id/aportar y /:id/auto cuando existan los modales.
 *
 * LLD-frontend-FEAT-024-sprint26.md seccion 2.
 *
 * LA-CORE-068: navegacion interna SIEMPRE via router (los componentes usan
 * router.navigate, nunca [href]).
 *
 * goalOwnerGuard: protege /:id y /:id/editar verificando sesion. La validacion
 * de ownership real la hace el backend con HTTP 403 GOAL_ACCESS_DENIED
 * (savings/api/exception/SavingsExceptionHandler.java).
 */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SavingsPageComponent } from './components/savings-page/savings-page.component';
import { GoalListComponent } from './components/goal-list/goal-list.component';
import { GoalCreateFormComponent } from './components/goal-create-form/goal-create-form.component';
import { GoalDetailComponent } from './components/goal-detail/goal-detail.component';
import { GoalEditFormComponent } from './components/goal-edit-form/goal-edit-form.component';
import { goalOwnerGuard } from './guards/goal-owner.guard';

const routes: Routes = [
  {
    path: '',
    component: SavingsPageComponent,
    children: [
      { path: '',          component: GoalListComponent },
      { path: 'nuevo',     component: GoalCreateFormComponent },
      { path: ':id',       component: GoalDetailComponent,    canActivate: [goalOwnerGuard] },
      { path: ':id/editar', component: GoalEditFormComponent, canActivate: [goalOwnerGuard] },
      // /:id/aportar y /:id/auto se anaden en G.3 (modales con flujo SCA / autorule form)
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SavingsRoutingModule {}
