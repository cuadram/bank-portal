/**
 * profile-routing.module.ts — FEAT-012-A Sprint 14
 * Ruta: /perfil → ProfilePageComponent (canActivate: authGuard)
 */
import { NgModule }              from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';
import { ProfilePageComponent }  from './components/profile-page.component';
import { authGuard }             from '../../core/guards/auth.guard';

const routes: Routes = [
  { path: '', component: ProfilePageComponent, canActivate: [authGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule {}
