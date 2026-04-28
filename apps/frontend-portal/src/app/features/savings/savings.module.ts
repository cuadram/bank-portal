/**
 * Módulo Savings (Objetivos de Ahorro) — FEAT-024 Sprint 26.
 *
 * Lazy module siguiendo patrón LA-FRONT-001 (igual que PfmModule, BizumModule, DepositsModule).
 * Cargado desde app-routing.module.ts en /objetivos (registro pendiente Fase G.4).
 *
 * G.0: declarations vacío. Los 18 componentes (LLD-frontend §5) se añaden en G.1..G.4.
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SavingsRoutingModule } from './savings-routing.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SavingsRoutingModule
  ]
})
export class SavingsModule {}
