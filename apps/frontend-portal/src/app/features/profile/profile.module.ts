/**
 * profile.module.ts — FEAT-012-A Sprint 14
 * Módulo lazy-loaded registrado en AppRoutingModule bajo /perfil.
 */
import { NgModule }             from '@angular/core';
import { CommonModule }         from '@angular/common';
import { ReactiveFormsModule }  from '@angular/forms';
import { ProfileRoutingModule } from './profile-routing.module';
import { ProfilePageComponent } from './components/profile-page.component';

@NgModule({
  declarations: [ProfilePageComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProfileRoutingModule,
  ]
})
export class ProfileModule {}
