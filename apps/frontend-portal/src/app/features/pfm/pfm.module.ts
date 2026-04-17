import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PfmRoutingModule } from './pfm-routing.module';
import { PfmPageComponent }         from './components/pfm-page/pfm-page.component';
import { PfmOverviewComponent }     from './components/pfm-overview/pfm-overview.component';
import { PfmMovimientoRowComponent }from './components/pfm-movimiento-row/pfm-movimiento-row.component';
import { CategoryEditModalComponent}from './components/category-edit-modal/category-edit-modal.component';
import { BudgetListComponent }      from './components/budget-list/budget-list.component';
import { BudgetProgressBarComponent}from './components/budget-progress-bar/budget-progress-bar.component';
import { BudgetFormComponent }      from './components/budget-form/budget-form.component';
import { PfmAnalysisComponent }     from './components/pfm-analysis/pfm-analysis.component';
import { PfmDistributionComponent } from './components/pfm-distribution/pfm-distribution.component';

@NgModule({
  declarations: [
    PfmPageComponent, PfmOverviewComponent, PfmMovimientoRowComponent,
    CategoryEditModalComponent, BudgetListComponent, BudgetProgressBarComponent,
    BudgetFormComponent, PfmAnalysisComponent, PfmDistributionComponent
  ],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, PfmRoutingModule]
})
export class PfmModule {}
