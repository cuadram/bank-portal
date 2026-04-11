/**
 * profile-page.component.ts — Mi Perfil rediseñado
 * Sprint 22 STG-Verification — BUG-STG-022-003 fix + redesign UI
 * BUG-STG-023-001 fix: navigateTo() reemplaza [href] en inbox — evita full page reload
 *
 * Cambios vs versión anterior:
 *   - initials: getter para avatar con iniciales
 *   - groupedPrefs: preferencias agrupadas por categoría para la tabla
 *   - scrollTo(): navegación por anclas en la misma página
 *   - styleUrls: profile-page.component.css (rediseño visual)
 *   - navigateTo(): BUG-STG-023-001 — navegación interna via router.navigateByUrl()
 *
 * @author SOFIA Developer Agent — Sprint 14 | BUG-STG-022-003 | BUG-STG-023-001 | UI-Redesign
 */
import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule }                           from '@angular/common';
import { takeUntilDestroyed }                     from '@angular/core/rxjs-interop';
import { forkJoin }                               from 'rxjs';
import { Router }                                 from '@angular/router';
import { ProfileService }                         from '../services/profile.service';
import {
  ProfileResponse,
  NotificationChannelPreference,
  UserNotificationItem,
  SessionInfo,
  NOTIFICATION_LABELS
} from '../models/profile.models';

/** Agrupaciones de eventType por categoría para la tabla de preferencias */
const NOTIF_CATEGORIES: Record<string, string[]> = {
  'Operaciones':  ['TRANSFER_COMPLETED','TRANSFER_RECEIVED','PAYMENT_COMPLETED','BILL_PAID','BILL_DUE_SOON','BILL_OVERDUE'],
  'Tarjetas':     ['CARD_BLOCKED','CARD_UNBLOCKED','CARD_LIMITS_UPDATED'],
  'Domiciliaciones': ['DEBIT_CHARGED','DEBIT_RETURNED','DEBIT_REJECTED'],
  'Seguridad':    ['SECURITY_NEW_DEVICE','SECURITY_PASSWORD_CHANGED','SECURITY_2FA_FAILED','SECURITY_PHONE_CHANGED'],
  'Verificación': ['KYC_APPROVED','KYC_REJECTED'],
};

export interface NotifGroup {
  category: string;
  prefs:    NotificationChannelPreference[];
}

@Component({
  selector:    'app-profile-page',
  standalone:  false,
  templateUrl: './profile-page.component.html',
  styleUrls:   ['./profile-page.component.css'],
})
export class ProfilePageComponent implements OnInit {

  private readonly profileSvc = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router     = inject(Router);

  profile:              ProfileResponse | null          = null;
  notificationPrefs:    NotificationChannelPreference[] = [];
  notificationInbox:    UserNotificationItem[]          = [];
  sessions:             SessionInfo[]                   = [];
  isLoading             = true;
  errorMsg:             string | null                   = null;

  readonly notifLabels = NOTIFICATION_LABELS;

  ngOnInit(): void {
    forkJoin({
      profile:           this.profileSvc.getProfile(),
      notificationPrefs: this.profileSvc.getNotificationPreferences(),
      notificationInbox: this.profileSvc.getNotificationInbox(),
      sessions:          this.profileSvc.getSessions(),
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: ({ profile, notificationPrefs, notificationInbox, sessions }) => {
        this.profile           = profile;
        this.notificationPrefs = notificationPrefs;
        this.notificationInbox = notificationInbox;
        this.sessions          = sessions;
        this.isLoading         = false;
      },
      error: (err) => {
        this.errorMsg  = 'Error cargando el perfil. Inténtalo de nuevo.';
        this.isLoading = false;
        console.error('[ProfilePage] Error cargando datos:', err);
      }
    });
  }

  // ── Getters de presentación ───────────────────────────────────

  /** Iniciales para el avatar (máx 2 chars) */
  get initials(): string {
    if (!this.profile) return '?';
    const name = this.profile.fullName || this.profile.email || '';
    return name
      .split(/[\s@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  }

  /** Notificaciones no leídas */
  get unreadCount(): number {
    return this.notificationInbox.filter(n => !n.read).length;
  }

  /** Preferencias agrupadas por categoría para la tabla */
  get groupedPrefs(): NotifGroup[] {
    const used = new Set<string>();
    const groups: NotifGroup[] = [];

    for (const [category, eventTypes] of Object.entries(NOTIF_CATEGORIES)) {
      const prefs = this.notificationPrefs.filter(p => {
        used.add(p.eventType);
        return eventTypes.includes(p.eventType);
      });
      if (prefs.length > 0) groups.push({ category, prefs });
    }

    // Resto sin categoría definida
    const others = this.notificationPrefs.filter(p => !used.has(p.eventType));
    if (others.length > 0) groups.push({ category: 'Otros', prefs: others });

    return groups;
  }

  // ── Handlers ──────────────────────────────────────────────────

  getNotifLabel(eventType: string): string {
    return this.notifLabels[eventType] || eventType;
  }

  onToggleChannel(
    pref: NotificationChannelPreference,
    channel: 'emailEnabled' | 'pushEnabled' | 'inAppEnabled',
    value: boolean
  ): void {
    // Actualización optimista local
    pref[channel] = value;
    const patch = { eventType: pref.eventType, [channel]: value } as any;
    this.profileSvc.updateNotificationPreferences(patch)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => {
        if (updated && updated.length) this.notificationPrefs = updated;
      });
  }

  onUpdateProfile(req: any): void {
    this.profileSvc.updateProfile(req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => { if (updated) this.profile = updated; });
  }

  onRevokeSession(jti: string): void {
    this.profileSvc.revokeSession(jti)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  () => { this.sessions = this.sessions.filter(s => s.jti !== jti); },
        error: () => { this.errorMsg = 'No se pudo revocar la sesión.'; }
      });
  }

  /** Scroll suave a sección por id de ancla */
  scrollTo(anchor: string): void {
    const el = document.getElementById(anchor);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * BUG-STG-023-001: navega a actionUrl via Angular router para preservar el ShellComponent.
   * [href] nativo causaba full page reload → pantalla en blanco sin menú.
   * router.navigateByUrl() soporta paths con query params (/ruta?param=val).
   *
   * Rutas válidas del router (app-routing.module.ts):
   * /dashboard /accounts /cards /direct-debits /export /prestamos /perfil /privacidad
   * Rutas no registradas se redirigen a su equivalente funcional o a /dashboard.
   */
  private readonly ROUTE_MAP: Record<string, string> = {
    '/bills':               '/direct-debits',
    '/transfers':           '/accounts',
    '/transfers/scheduled': '/accounts',
    '/loans':               '/prestamos',
    '/profile':             '/perfil',
    '/privacy':             '/privacidad',
  };

  navigateTo(url: string | null): void {
    if (!url || !url.trim()) return;
    const target = this.ROUTE_MAP[url] ?? url;
    this.router.navigateByUrl(target).catch(() => {
      console.warn('[ProfilePage] Ruta no encontrada:', url, '→ redirigiendo a /dashboard');
      this.router.navigate(['/dashboard']);
    });
  }
}
