import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DirectDebitsRoutingModule } from './direct-debits-routing.module';
import { MandateListComponent } from './components/mandate-list/mandate-list.component';
import { MandateDetailComponent } from './components/mandate-detail/mandate-detail.component';
import { CreateMandateComponent } from './components/create-mandate/create-mandate.component';
import { CancelMandateComponent } from './components/cancel-mandate/cancel-mandate.component';
import { DebitHistoryComponent } from './components/debit-history/debit-history.component';
import { DirectDebitService } from './services/direct-debit.service';

/**
 * FEAT-017 Sprint 19 — DirectDebitsModule (lazy-loaded)
 * Route: /direct-debits
 */
@NgModule({
  declarations: [
    MandateListComponent,
    MandateDetailComponent,
    CreateMandateComponent,
    CancelMandateComponent,
    DebitHistoryComponent
  ],
  imports: [CommonModule, ReactiveFormsModule, DirectDebitsRoutingModule],
  providers: [DirectDebitService]
})
export class DirectDebitsModule {}
