/**
 * export-routing.module.ts — FEAT-018 Sprint 20
 */
import { NgModule }                from '@angular/core';
import { RouterModule, Routes }    from '@angular/router';
import { ExportPanelComponent }    from './components/export-panel/export-panel.component';
import { AuthGuard }               from '../../core/guards/auth.guard';

const routes: Routes = [
  { path: '', component: ExportPanelComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExportRoutingModule {}
