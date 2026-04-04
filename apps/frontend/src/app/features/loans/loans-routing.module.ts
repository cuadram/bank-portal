import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoanListComponent } from './components/loan-list/loan-list.component';
import { LoanDetailComponent } from './components/loan-detail/loan-detail.component';
import { LoanSimulatorComponent } from './components/loan-simulator/loan-simulator.component';
import { LoanApplicationFormComponent } from './components/loan-application-form/loan-application-form.component';

const routes: Routes = [
  { path: '',           component: LoanListComponent },
  { path: 'simular',   component: LoanSimulatorComponent },
  { path: 'solicitar', component: LoanApplicationFormComponent },
  { path: ':id',       component: LoanDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoansRoutingModule {}
