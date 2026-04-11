import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MandateListComponent } from './components/mandate-list/mandate-list.component';
import { MandateDetailComponent } from './components/mandate-detail/mandate-detail.component';
import { CreateMandateComponent } from './components/create-mandate/create-mandate.component';
import { CancelMandateComponent } from './components/cancel-mandate/cancel-mandate.component';
import { DebitHistoryComponent } from './components/debit-history/debit-history.component';

const routes: Routes = [
  { path: '',          component: MandateListComponent },
  { path: 'new',       component: CreateMandateComponent },
  { path: 'history',   component: DebitHistoryComponent },
  { path: ':id',       component: MandateDetailComponent },
  { path: ':id/cancel',component: CancelMandateComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DirectDebitsRoutingModule {}
