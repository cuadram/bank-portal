import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BizumHomeComponent } from './components/bizum-home/bizum-home.component';
import { BizumSendComponent } from './components/bizum-send/bizum-send.component';
import { BizumRequestComponent } from './components/bizum-request/bizum-request.component';
import { BizumHistoryComponent } from './components/bizum-history/bizum-history.component';
import { BizumSettingsComponent } from './components/bizum-settings/bizum-settings.component';
import { BizumActivateComponent } from './components/bizum-activate/bizum-activate.component';

const routes: Routes = [
  { path: '',             component: BizumHomeComponent },
  { path: 'activar',      component: BizumActivateComponent },
  { path: 'enviar',       component: BizumSendComponent },
  { path: 'solicitar',    component: BizumRequestComponent },
  { path: 'historial',    component: BizumHistoryComponent },
  { path: 'configuracion', component: BizumSettingsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BizumRoutingModule {}
