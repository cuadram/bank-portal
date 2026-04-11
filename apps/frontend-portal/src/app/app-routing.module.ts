import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { ShellComponent } from './shell/shell.component';

const routes: Routes = [
  // Login — sin shell
  {
    path: 'login',
    loadChildren: () => import('./features/login/login.module').then(m => m.LoginModule)
  },
  // Rutas autenticadas — con shell (sidebar visible)
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'accounts',
        loadChildren: () => import('./features/accounts/accounts.module').then(m => m.AccountsModule)
      },
      {
        path: 'cards',
        loadChildren: () => import('./features/cards/cards.module').then(m => m.CardsModule)
      },
      {
        path: 'direct-debits',
        loadChildren: () => import('./features/direct-debits/direct-debits.module').then(m => m.DirectDebitsModule)
      },
      {
        path: 'export',
        loadChildren: () => import('./features/export/export.module').then(m => m.ExportModule)
      },
      // FEAT-020 Sprint 22 — LA-FRONT-001: ruta préstamos registrada
      {
        path: 'prestamos',
        loadChildren: () => import('./features/loans/loans.module').then(m => m.LoansModule)
      },
      // FEAT-019 Sprint 21 — LA-FRONT-001: rutas registradas (DEBT-039 resuelto)
      {
        path: 'perfil',
        loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule)
      },
      {
        path: 'privacidad',
        loadChildren: () => import('./features/privacy/privacy.module').then(m => m.PrivacyModule)
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
