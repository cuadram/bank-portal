// privacy.module.ts — FEAT-019 Sprint 21
// LA-FRONT-001: módulo registrado en app-routing.module.ts ruta /privacidad
import { NgModule }          from '@angular/core';
import { CommonModule }      from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { PrivacyCenterComponent }   from './components/privacy-center/privacy-center.component';
import { ConsentManagerComponent }  from './components/consent-manager/consent-manager.component';
import { DataExportComponent }      from './components/data-export/data-export.component';
import { DeletionRequestComponent } from './components/deletion-request/deletion-request.component';

const routes: Routes = [
  { path: '', component: PrivacyCenterComponent }
];

@NgModule({
  declarations: [
    PrivacyCenterComponent,
    ConsentManagerComponent,
    DataExportComponent,
    DeletionRequestComponent,
  ],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class PrivacyModule {}
