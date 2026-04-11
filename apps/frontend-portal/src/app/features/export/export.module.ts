/**
 * export.module.ts — FEAT-018 Sprint 20
 * Módulo lazy-loaded registrado en AppRoutingModule bajo /export.
 */
import { NgModule }              from '@angular/core';
import { CommonModule }          from '@angular/common';
import { FormsModule }           from '@angular/forms';
import { ExportRoutingModule }   from './export-routing.module';
import { ExportPanelComponent }  from './components/export-panel/export-panel.component';

@NgModule({
  declarations: [ExportPanelComponent],
  imports: [
    CommonModule,
    FormsModule,
    ExportRoutingModule,
  ]
})
export class ExportModule {}
