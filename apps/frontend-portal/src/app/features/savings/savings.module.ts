/**
 * Modulo Savings (Objetivos de Ahorro) - FEAT-024 Sprint 26.
 *
 * Lazy module siguiendo patron LA-FRONT-001 (igual que PfmModule, BizumModule, DepositsModule).
 * Cargado desde app-routing.module.ts en /objetivos (registro pendiente Fase G.4).
 *
 * G.0: andamiaje (declarations vacio).
 * G.1: 7 componentes dumb. LOTE 1 = 3 primitivos. LOTE 2 = +CategoryPicker + EmptyState.
 * G.2..G.4: smart components, modales, widget.
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SavingsRoutingModule } from './savings-routing.module';

import { CategoryIconComponent }            from './components/category-icon/category-icon.component';
import { GoalProgressBarComponent }         from './components/goal-progress-bar/goal-progress-bar.component';
import { GoalProjectionBannerComponent }    from './components/goal-projection-banner/goal-projection-banner.component';
import { CategoryPickerComponent }          from './components/category-picker/category-picker.component';
import { SavingsEmptyStateComponent }       from './components/savings-empty-state/savings-empty-state.component';

@NgModule({
  declarations: [
    CategoryIconComponent,
    GoalProgressBarComponent,
    GoalProjectionBannerComponent,
    CategoryPickerComponent,
    SavingsEmptyStateComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SavingsRoutingModule
  ]
})
export class SavingsModule {}
