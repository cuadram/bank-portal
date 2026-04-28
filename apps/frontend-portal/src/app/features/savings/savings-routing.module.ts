/**
 * Routing del módulo Savings (Objetivos de Ahorro) — FEAT-024 Sprint 26.
 *
 * G.0: shell con rutas vacías. Las rutas reales (/, /nuevo, /:id, /:id/editar,
 * /:id/aportar, /:id/auto) se completan en G.2 cuando existen los componentes
 * referenciados (LLD-frontend §2).
 */
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SavingsRoutingModule {}
