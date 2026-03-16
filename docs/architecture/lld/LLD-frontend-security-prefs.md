# LLD — Frontend: Preferencias de Seguridad y Autenticación Contextual

## Metadata

| Campo | Valor |
|---|---|
| **Documento** | LLD-frontend-security-prefs |
| **Features** | FEAT-005 US-403 + FEAT-006 US-602/603 (flujos Angular) |
| **Sprint** | 7 |
| **Autor** | SOFIA Architect Agent |
| **Fecha** | 2026-06-09 |
| **Framework** | Angular 17 — Standalone + Signals |

---

## 1. Estructura de archivos

```
features/security-audit/
  security-preferences.component.ts   ← US-403 (nuevo Sprint 7)

features/auth/
  context-confirm.component.ts        ← US-603: pantalla "Confirmar acceso" (nuevo Sprint 7)
  account-locked.component.ts         ← US-601/602: pantalla "Cuenta bloqueada" (nuevo Sprint 7)
```

---

## 2. SecurityPreferencesComponent (US-403)

### Estado local (Signals)

```typescript
preferences  = signal<SecurityPreferencesResponse | null>(null);
saving       = signal(false);
saveSuccess  = signal(false);
error        = signal<string | null>(null);

// Mapa local de preferencias de notificación editables
notifPrefs   = signal<Record<string, boolean>>({});
```

### Secciones colapsables

```
▼ Verificación en dos pasos (2FA)
  Estado: ✅ Activo (extraído de preferences.twoFactorEnabled)
  [Gestionar 2FA →] (routerLink a /security/settings)

▼ Tiempo de inactividad de sesión
  [selector 5 / 15 / 30 / 60 min] — guardado automático al cambiar (PUT /security/preferences)

▼ Dispositivos de confianza
  N dispositivos registrados
  [Gestionar dispositivos →] (routerLink a /security/trusted-devices)

▼ Notificaciones de seguridad
  Disclaimer: "Desactivar un tipo solo afecta a los mensajes visibles. El registro de
               auditoría siempre permanece activo por requisitos legales." (R-F5-003)
  [toggle por cada SecurityEventType]
  [Guardar preferencias de notificaciones]
```

### R-F5-003 — disclamer obligatorio

El bloque del disclaimer DEBE renderizarse siempre que la sección de notificaciones
sea visible. No puede ser ocultado ni descartado por el usuario.
Cumplimiento PCI-DSS 4.0 req. 10.2 — el usuario debe ser consciente de que desactivar
notificaciones no afecta al audit_log.

---

## 3. AccountLockedComponent (US-601/602)

### Cuándo renderiza

El interceptor HTTP global detecta HTTP 423 (ACCOUNT_LOCKED) en cualquier llamada al
backend y redirige a `/auth/account-locked` en lugar de mostrar el error genérico.

### UI

```
🔒 Cuenta bloqueada

Tu cuenta ha sido bloqueada temporalmente por seguridad debido a múltiples intentos
fallidos de verificación.

[Solicitar enlace de desbloqueo]
  → POST /api/v1/account/unlock (email del usuario — ya conocido del flujo de login)
  → Si 204: mostrar "Hemos enviado un enlace a tu email. El enlace expira en 1 hora."

[Usar código de recuperación →] (link al flujo de verify-recovery)
```

### Estado local

```typescript
email        = input.required<string>();  // pasado desde el interceptor / route data
requesting   = signal(false);
requested    = signal(false);
error        = signal<string | null>(null);
```

---

## 4. ContextConfirmComponent (US-603)

### Cuándo renderiza

Cuando `VerifyResponse.scope === 'context-pending'`, el flujo de login no redirige al
portal sino a `/auth/confirm-context`. El JWT `context-pending` se almacena en memoria
(no en localStorage — R-Browser-01) para la llamada posterior a `/auth/confirm-context`.

### UI

```
🔍 Hemos detectado un acceso desde una ubicación de red nueva

Por seguridad, hemos enviado un email de confirmación a tu dirección registrada.
Haz clic en el enlace del email para completar el acceso.

El enlace expira en 15 minutos.

[Reenviar email de confirmación] (si han pasado más de 2 min)
[Volver al login] (cancela y revoca el context-pending JWT)
```

### Manejo del JWT context-pending

```typescript
// Almacenado en AuthService en memoria (servicio singleton Angular)
// NO en localStorage ni sessionStorage — el JWT es temporal y sensible
private contextPendingToken: string | null = null;

setContextPending(token: string): void {
  this.contextPendingToken = token;
  // Auto-limpiar tras 15 min (TTL del JWT)
  setTimeout(() => { this.contextPendingToken = null; }, 15 * 60 * 1000);
}
```

### Deep-link desde el email

El enlace del email navega a `/auth/confirm-context?token=<confirmationToken>`.
El componente lee el query param, lo envía a `POST /api/v1/auth/confirm-context`
con el `context-pending` JWT en el header, y si el response es un `full-session` JWT,
completa el login normalmente.

---

## 5. Interceptor HTTP — manejo de HTTP 423

```typescript
// En el HttpInterceptor global:
if (error.status === 423) {
  const accountEmail = this.authService.pendingEmail();  // email del intento de login
  this.router.navigate(['/auth/account-locked'], {
    state: { email: accountEmail }
  });
  return EMPTY;
}
```

---

## 6. Rutas nuevas Sprint 7

```typescript
// auth.routes.ts — añadir:
{ path: 'account-locked',  component: AccountLockedComponent,   title: 'Cuenta bloqueada' },
{ path: 'confirm-context', component: ContextConfirmComponent,  title: 'Confirmar acceso' },

// security-audit.routes.ts — añadir:
{ path: 'prefs', loadComponent: () => import('./security-preferences.component')
    .then(m => m.SecurityPreferencesComponent), title: 'Preferencias de Seguridad' },
```

---

## 7. Accesibilidad WCAG 2.1 AA

| Elemento | Control |
|---|---|
| AccountLockedComponent — estado | `role="alert"` (el bloqueo es un mensaje de error importante) |
| ContextConfirmComponent — instrucciones | `aria-live="polite"` para actualizaciones de estado |
| SecurityPreferencesComponent — toggles | `role="switch"` + `aria-checked` por cada toggle de notificación |
| Secciones colapsables | `aria-expanded` + `aria-controls` |
| Disclaimer R-F5-003 | `role="note"` — siempre visible, no colapsable |

---

## 8. Tests requeridos (DoD Sprint 7)

| Test | Escenarios |
|---|---|
| `SecurityPreferencesComponent.spec.ts` | carga preferencias · guarda timeout · guarda notifPrefs · disclaimer siempre visible (R-F5-003) |
| `AccountLockedComponent.spec.ts` | renderiza con email · solicita unlock · muestra confirmación 204 · error handling |
| `ContextConfirmComponent.spec.ts` | renderiza con token en query param · envía confirm-context · redirect a portal · error token expirado |

---

*SOFIA Architect Agent · BankPortal · FEAT-005/006 · LLD Frontend · 2026-06-09*
