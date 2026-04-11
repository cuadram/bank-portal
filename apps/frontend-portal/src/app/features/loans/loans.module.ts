import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoansRoutingModule } from './loans-routing.module';
import { LoanListComponent } from './components/loan-list/loan-list.component';
import { LoanDetailComponent } from './components/loan-detail/loan-detail.component';
import { LoanSimulatorComponent } from './components/loan-simulator/loan-simulator.component';
import { LoanApplicationFormComponent } from './components/loan-application-form/loan-application-form.component';
import { AmortizationTableComponent } from './components/amortization-table/amortization-table.component';

@NgModule({
  declarations: [
    LoanListComponent,
    LoanDetailComponent,
    LoanSimulatorComponent,
    LoanApplicationFormComponent,
    AmortizationTableComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LoansRoutingModule
  ]
})
export class LoansModule {}
