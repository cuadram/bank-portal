import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DepositListComponent } from './components/deposit-list/deposit-list.component';
import { DepositDetailComponent } from './components/deposit-detail/deposit-detail.component';
import { DepositSimulatorComponent } from './components/deposit-simulator/deposit-simulator.component';
import { DepositApplicationFormComponent } from './components/deposit-application-form/deposit-application-form.component';
import { DepositRenewalComponent } from './components/deposit-renewal/deposit-renewal.component';
import { DepositCancelComponent }  from './components/deposit-cancel/deposit-cancel.component';

const routes: Routes = [
  { path: '',         component: DepositListComponent },
  { path: 'simulate', component: DepositSimulatorComponent },
  { path: 'new',      component: DepositApplicationFormComponent },
  { path: ':id/renovacion', component: DepositRenewalComponent },
  { path: ':id/cancelar',   component: DepositCancelComponent },
  { path: ':id',            component: DepositDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DepositsRoutingModule {}
