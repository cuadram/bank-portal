/**
 * Routing del modulo Savings (Objetivos de Ahorro) - FEAT-024 Sprint 26.
 *
 * G.0: shell con rutas vacias.
 * G.2 LOTE 2.3: 4 rutas reales bajo SavingsPageComponent (router-outlet wrapper):
 *   '' / 'nuevo' / ':id' / ':id/editar'
 * G.3: 3 rutas adicionales:
 *   ':id/aportar' (ContributionModal · US-024-04)
 *   ':id/auto'    (AutoRuleForm · US-024-05)
 *   ':id/cerrar'  (GoalCloseModal · US-024-06 · RN-F024-11 SCA)
 *
 * LLD-frontend-FEAT-024-sprint26.md seccion 2.
 *
 * LA-CORE-068: navegacion interna SIEMPRE via router (los componentes usan
 * router.navigate, nunca [href]).
 *
 * goalOwnerGuard: protege todas las rutas con :id verificando sesion. La
 * validacion de ownership real la hace el backend con HTTP 403 GOAL_ACCESS_DENIED
 * (savings/api/exception/SavingsExceptionHandler.java).
 */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SavingsPageComponent } from './components/savings-page/savings-page.component';
import { GoalListComponent } from './components/goal-list/goal-list.component';
import { GoalCreateFormComponent } from './components/goal-create-form/goal-create-form.component';
import { GoalDetailComponent } from './components/goal-detail/goal-detail.component';
import { GoalEditFormComponent } from './components/goal-edit-form/goal-edit-form.component';
import { ContributionModalComponent } from './components/contribution-modal/contribution-modal.component';
import { AutoRuleFormComponent } from './components/auto-rule-form/auto-rule-form.component';
import { GoalCloseModalComponent } from './components/goal-close-modal/goal-close-modal.component';
import { goalOwnerGuard } from './guards/goal-owner.guard';

const routes: Routes = [
  {
    path: '',
    component: SavingsPageComponent,
    children: [
      { path: '',           component: GoalListComponent },
      { path: 'nuevo',      component: GoalCreateFormComponent },
      { path: ':id',          component: GoalDetailComponent,         canActivate: [goalOwnerGuard] },
      { path: ':id/editar',   component: GoalEditFormComponent,       canActivate: [goalOwnerGuard] },
      { path: ':id/aportar',  component: ContributionModalComponent,  canActivate: [goalOwnerGuard] },
      { path: ':id/auto',     component: AutoRuleFormComponent,       canActivate: [goalOwnerGuard] },
      { path: ':id/cerrar',   component: GoalCloseModalComponent,     canActivate: [goalOwnerGuard] }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SavingsRoutingModule {}
