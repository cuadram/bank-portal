/**
 * profile-page.component.ts — FEAT-012-A Sprint 14
 *
 * Smart component — orquesta la carga inicial del perfil y delega
 * a los subcomponentes dumb para cada sección.
 *
 * RV-016 (Sprint 14): forkJoin usa takeUntilDestroyed(this.destroyRef)
 * para evitar memory leaks si el componente se destruye antes de que
 * la carga complete (navegación rápida, lazy unload).
 *
 * @author SOFIA Developer Agent — Sprint 14
 */
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule }                           from '@angular/common';
import { takeUntilDestroyed }                     from '@angular/core/rxjs-interop';
import { forkJoin }                               from 'rxjs';
import { ProfileService }                         from '../services/profile.service';
import {
  ProfileResponse, NotificationPreference, SessionInfo
} from '../models/profile.models';

@Component({
  selector:    'app-profile-page',
  standalone:  false,
  templateUrl: './profile-page.component.html',
})
export class ProfilePageComponent implements OnInit {

  private readonly profileSvc = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef); // RV-016

  profile:       ProfileResponse | null        = null;
  notifications: NotificationPreference[]      = [];
  sessions:      SessionInfo[]                 = [];
  isLoading      = true;
  errorMsg:      string | null                 = null;

  ngOnInit(): void {
    forkJoin({
      profile:       this.profileSvc.getProfile(),
      notifications: this.profileSvc.getNotifications(),
      sessions:      this.profileSvc.getSessions(),
    })
    .pipe(takeUntilDestroyed(this.destroyRef)) // RV-016: evita memory leak
    .subscribe({
      next: ({ profile, notifications, sessions }) => {
        this.profile       = profile;
        this.notifications = notifications;
        this.sessions      = sessions;
        this.isLoading     = false;
      },
      error: (err) => {
        this.errorMsg  = 'Error cargando el perfil. Inténtalo de nuevo.';
        this.isLoading = false;
        console.error('[ProfilePage] Error cargando datos:', err);
      }
    });
  }

  onUpdateProfile(req: any): void {
    this.profileSvc.updateProfile(req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => { if (updated) this.profile = updated; });
  }

  onToggleNotification(code: string, enabled: boolean): void {
    this.profileSvc.updateNotifications({ [code]: enabled } as any)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(prefs => { if (prefs) this.notifications = prefs; });
  }

  onRevokeSession(jti: string): void {
    this.profileSvc.revokeSession(jti)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.sessions = this.sessions.filter(s => s.jti !== jti); },
        error: () => { this.errorMsg = 'No se pudo revocar la sesión.'; }
      });
  }
}
