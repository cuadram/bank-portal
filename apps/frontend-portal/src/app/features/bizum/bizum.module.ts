import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BizumRoutingModule } from './bizum-routing.module';
import { BizumHomeComponent } from './components/bizum-home/bizum-home.component';
import { BizumSendComponent } from './components/bizum-send/bizum-send.component';
import { BizumRequestComponent } from './components/bizum-request/bizum-request.component';
import { BizumHistoryComponent } from './components/bizum-history/bizum-history.component';
import { BizumSettingsComponent } from './components/bizum-settings/bizum-settings.component';
import { BizumActivateComponent } from './components/bizum-activate/bizum-activate.component';

@NgModule({
  declarations: [
    BizumHomeComponent, BizumSendComponent, BizumRequestComponent,
    BizumHistoryComponent, BizumSettingsComponent, BizumActivateComponent
  ],
  imports: [CommonModule, ReactiveFormsModule, BizumRoutingModule]
})
export class BizumModule {}
