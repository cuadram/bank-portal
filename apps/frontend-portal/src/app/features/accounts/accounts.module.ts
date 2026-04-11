import { NgModule } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AccountListComponent }    from './components/account-list/account-list.component';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';

const routes: Routes = [
  { path: '',                component: AccountListComponent },
  { path: ':id/transactions', component: TransactionListComponent }
];

/**
 * FEAT-007 — Módulo Cuentas y Movimientos.
 *
 * Lazy-loaded desde AppRoutingModule:
 *   { path: 'accounts', loadChildren: () => import('./features/accounts/accounts.module') }
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
@NgModule({
  declarations: [
    AccountListComponent,
    TransactionListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class AccountsModule {}
