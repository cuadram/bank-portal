import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgChartsModule } from 'ng2-charts';

import { DashboardComponent }        from './dashboard.component';
import { SummaryCardsComponent }     from './components/summary-cards/summary-cards.component';
import { CategoriesChartComponent }  from './components/categories-chart/categories-chart.component';
import { EvolutionChartComponent }   from './components/evolution-chart/evolution-chart.component';
import { MonthComparisonComponent }  from './components/month-comparison/month-comparison.component';
import { BudgetAlertsComponent }     from './components/budget-alerts/budget-alerts.component';

/**
 * DashboardModule — módulo lazy-loaded del dashboard analítico.
 * US-1101 FEAT-011 Sprint 13.
 */
@NgModule({
  declarations: [
    DashboardComponent,
    SummaryCardsComponent,
    CategoriesChartComponent,
    EvolutionChartComponent,
    MonthComparisonComponent,
    BudgetAlertsComponent
  ],
  imports: [
    CommonModule,
    NgChartsModule,
    RouterModule.forChild([{ path: '', component: DashboardComponent }])
  ]
})
export class DashboardModule {}
