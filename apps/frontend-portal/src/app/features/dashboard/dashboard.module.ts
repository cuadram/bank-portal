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
import { TopMerchantsComponent }     from './components/top-merchants/top-merchants.component';
import { PfmWidgetComponent }        from '../pfm/components/pfm-widget/pfm-widget.component';

/**
 * DashboardModule — módulo lazy-loaded del dashboard analítico.
 * US-1101 FEAT-011 Sprint 13.
 * G1-FIX (2026-04-16): TopMerchantsComponent declarado e integrado.
 */
@NgModule({
  declarations: [
    DashboardComponent,
    SummaryCardsComponent,
    CategoriesChartComponent,
    EvolutionChartComponent,
    MonthComparisonComponent,
    BudgetAlertsComponent,
    TopMerchantsComponent,       // G1-FIX
    PfmWidgetComponent            // FEAT-023 Sprint 25
  ],
  imports: [
    CommonModule,
    NgChartsModule,
    RouterModule.forChild([{ path: '', component: DashboardComponent }])
  ]
})
export class DashboardModule {}
