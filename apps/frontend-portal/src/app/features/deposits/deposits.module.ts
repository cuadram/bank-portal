import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DepositsRoutingModule } from './deposits-routing.module';
import { DepositListComponent } from './components/deposit-list/deposit-list.component';
import { DepositDetailComponent } from './components/deposit-detail/deposit-detail.component';
import { DepositSimulatorComponent } from './components/deposit-simulator/deposit-simulator.component';
import { DepositApplicationFormComponent } from './components/deposit-application-form/deposit-application-form.component';
import { RenewalSelectorComponent } from './components/renewal-selector/renewal-selector.component';
import { DepositRenewalComponent } from './components/deposit-renewal/deposit-renewal.component';
import { DepositCancelComponent }  from './components/deposit-cancel/deposit-cancel.component';

@NgModule({
  declarations: [
    DepositListComponent,
    DepositDetailComponent,
    DepositSimulatorComponent,
    DepositApplicationFormComponent,
    RenewalSelectorComponent,
    DepositRenewalComponent,
    DepositCancelComponent
  ],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, DepositsRoutingModule]
})
export class DepositsModule {}
