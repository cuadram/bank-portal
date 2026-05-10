/**
 * Modulo Savings (Objetivos de Ahorro) - FEAT-024 Sprint 26.
 *
 * Lazy module siguiendo patron LA-FRONT-001 (igual que PfmModule, BizumModule, DepositsModule).
 * Cargado desde app-routing.module.ts en /objetivos (registro pendiente Fase G.4).
 *
 * G.0: andamiaje (declarations vacio).
 * G.1: 7 componentes dumb COMPLETO.
 *   LOTE 1 = CategoryIcon + GoalProgressBar + GoalProjectionBanner.
 *   LOTE 2 = CategoryPicker + SavingsEmptyState.
 *   LOTE 3 = AutoRuleSummary + GoalCard (depende LOTE 1).
 * G.2 LOTE 2.1: SavingsPage (container) + GoalList (smart US-024-02).
 * G.2 LOTE 2.2: GoalCreateForm (smart US-024-01 · ReactiveForm + icon-picker 12 + color-picker 8).
 * G.2 LOTE 2.3: GoalDetail + ContributionHistory + GoalEditForm + routing real (CIERRE G.2).
 * G.3: modales contribute (US-024-04) + autorule-form (US-024-05) + close+SCA (RN-F024-11 · OtpInputComponent standalone reutilizado).
 * G.4 pendiente: SavingsWidgetComponent dashboard + integracion shell + app-routing.
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
import { AutoRuleSummaryComponent }         from './components/auto-rule-summary/auto-rule-summary.component';
import { GoalCardComponent }                from './components/goal-card/goal-card.component';
import { SavingsPageComponent }            from './components/savings-page/savings-page.component';
import { GoalListComponent }               from './components/goal-list/goal-list.component';
import { GoalCreateFormComponent }         from './components/goal-create-form/goal-create-form.component';
import { GoalDetailComponent }             from './components/goal-detail/goal-detail.component';
import { ContributionHistoryComponent }    from './components/contribution-history/contribution-history.component';
import { GoalEditFormComponent }           from './components/goal-edit-form/goal-edit-form.component';
import { ContributionModalComponent }      from './components/contribution-modal/contribution-modal.component';
import { AutoRuleFormComponent }           from './components/auto-rule-form/auto-rule-form.component';
import { GoalCloseModalComponent }         from './components/goal-close-modal/goal-close-modal.component';

// Standalone component reutilizado para el flujo SCA RN-F024-11 (LLD §7)
import { OtpInputComponent } from '../../shared/components/otp-input/otp-input.component';

@NgModule({
  declarations: [
    CategoryIconComponent,
    GoalProgressBarComponent,
    GoalProjectionBannerComponent,
    CategoryPickerComponent,
    SavingsEmptyStateComponent,
    AutoRuleSummaryComponent,
    GoalCardComponent,
    SavingsPageComponent,
    GoalListComponent,
    GoalCreateFormComponent,
    GoalDetailComponent,
    ContributionHistoryComponent,
    GoalEditFormComponent,
    ContributionModalComponent,
    AutoRuleFormComponent,
    GoalCloseModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SavingsRoutingModule,
    OtpInputComponent
  ]
})
export class SavingsModule {}
