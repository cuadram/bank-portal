import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PfmPageComponent } from './components/pfm-page/pfm-page.component';

const routes: Routes = [
  { path: '', component: PfmPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PfmRoutingModule {}
