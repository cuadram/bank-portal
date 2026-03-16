# LLD — Frontend: Dispositivos de Confianza

## Metadata

| Campo | Valor |
|---|---|
| **Documento** | LLD-frontend-trusted-devices |
| **Feature** | FEAT-003 — Dispositivos de Confianza |
| **Sprint** | 4 (implementado) / 5 (LLD formalizado — ACT-18) |
| **Autor** | SOFIA Architect Agent |
| **Fecha** | 2026-05-12 |
| **Versión** | 1.0.0 |
| **Framework** | Angular 17 — Standalone Components + Signals |
| **Relacionado** | LLD-backend-trusted-devices.md · LLD-frontend-session-mgmt.md |

---

## 1. Responsabilidad del módulo frontend

El módulo `features/trusted-devices/` implementa la UI para que el usuario:

- **US-201:** Marcar el dispositivo actual como de confianza (checkbox post-login 2FA)
- **US-202:** Ver y eliminar dispositivos de confianza desde el panel de seguridad
- Accesibilidad WCAG 2.1 AA en todos los componentes

---

## 2. Estructura de archivos

```
apps/frontend-portal/src/app/features/trusted-devices/
└── trusted-devices.component.ts     ← componente único (smart + presentacional)

Integración en módulo existente:
apps/frontend-portal/src/app/features/session-management/
└── components/
    └── otp-verification.component.ts ← checkbox "Recordar 30 días" (US-201)
                                         añadido en Sprint 4
```

**Decisión de diseño:** a diferencia de session-management (que tiene Signal Store propio),
`trusted-devices` usa gestión de estado local con Angular Signals directamente en el componente.
Justificación: el estado de dispositivos de confianza no es compartido entre múltiples componentes
ni requiere computaciones derivadas complejas — un store centralizado sería over-engineering.

---

## 3. Modelo de datos TypeScript

```typescript
// Respuesta del API — mapeada directamente desde TrustedDeviceResponse (backend)
interface TrustedDeviceResponse {
  deviceId: string;          // UUID
  os: string;                // "macOS", "Windows", "iOS", "Android"...
  browser: string;           // "Safari", "Chrome", "Edge"... (ua-parser-java)
  ipMasked: string;          // "192.168.x.x"
  createdAt: string;         // ISO 8601
  lastUsedAt: string;
  expiresAt: string;         // createdAt + 30 días, renovado en cada uso
}

// Estado local del componente (Signals)
devices  = signal<TrustedDeviceResponse[]>([]);
loading  = signal(false);
revoking = signal<string | null>(null);   // deviceId | 'all' | null
error    = signal<string | null>(null);

// Integración US-201
showTrustOption  = signal(false);         // activado desde OtpVerificationComponent
trustDeviceChecked = false;              // valor del checkbox
```

---

## 4. Flujo US-201 — Checkbox "Recordar este dispositivo"

### Punto de integración: `OtpVerificationComponent`

```typescript
// Añadido al formulario de verificación OTP:
// <input type="checkbox" [(ngModel)]="trustDevice" />
// Al enviar el formulario:
this.authService.verify({ otpCode: this.otp, trustDevice: this.trustDevice })
```

### Flujo de red:
```
POST /api/v1/2fa/verify
  Body: { otpCode: "123456", trustDevice: true }
  Response Set-Cookie: bp_trust=...; HttpOnly; Secure; SameSite=Strict;
                       Path=/api/v1/auth/login; Max-Age=2592000
```

La cookie `bp_trust` es **completamente transparente para el código Angular** — el browser la gestiona automáticamente. No hay código Angular que lea, escriba o borre la cookie (está en HttpOnly por diseño, ADR-008).

### Comportamiento en login posterior:
```
POST /api/v1/auth/login
  El browser envía automáticamente: Cookie: bp_trust=<token>
  (solo en /api/v1/auth/login gracias al atributo Path)
  El backend verifica y emite JWT completo sin solicitar OTP
  → El usuario ve directamente el portal sin pantalla de OTP
```

---

## 5. Flujo US-202 — Gestionar dispositivos de confianza

### Ciclo de vida del componente

```
ngOnInit()
  → loadDevices()
      GET /api/v1/trusted-devices
      → devices.set(response)

revokeOne(deviceId)
  → revoking.set(deviceId)
  → DELETE /api/v1/trusted-devices/{deviceId}
  → devices.update(list => list.filter(d => d.deviceId !== deviceId))
  → revoking.set(null)

revokeAll()
  → revoking.set('all')
  → DELETE /api/v1/trusted-devices
  → devices.set([])
  → revoking.set(null)
```

### Template — estados reactivos

```html
@if (loading()) {
  <!-- aria-busy="true" — WCAG 2.1 AA -->
  <div class="td__loading" aria-busy="true">...</div>
}

@for (device of devices(); track device.deviceId) {
  <app-trusted-device-card
    [device]="device"
    [isRevoking]="revoking() === device.deviceId"
    (revoke)="revokeOne($event)" />
}

@if (devices().length === 0 && !loading()) {
  <p class="td__empty">No tienes dispositivos de confianza registrados.</p>
}
```

---

## 6. Accesibilidad WCAG 2.1 AA

| Elemento | Control de accesibilidad |
|---|---|
| Botones de revocación | `aria-label="Eliminar dispositivo {os} {browser}"` — contexto explícito |
| Estado de carga | `aria-busy="true"` en contenedor de lista |
| Estado ocupado en botón | `[attr.aria-busy]="isRevoking"` |
| Checkbox opt-in US-201 | `aria-label="Recordar este dispositivo durante 30 días"` |
| Mensajes de error | `role="alert"` — anunciados por lectores de pantalla automáticamente |
| Icono de dispositivo (emoji) | `aria-hidden="true"` — decorativo, no informativo |
| Estado vacío | Párrafo visible con mensaje informativo legible |

---

## 7. Integración en panel de seguridad

`TrustedDevicesComponent` se integra en `SecuritySettingsComponent` como sección separada,
debajo del panel de sesiones activas (FEAT-002):

```html
<!-- SecuritySettingsComponent template — estructura de secciones -->
<section class="settings-section">
  <app-session-management-panel />       <!-- FEAT-002 -->
  <app-trusted-devices />                <!-- FEAT-003 — debajo -->
</section>
```

**Ruta:** `/security/sessions` muestra ambos paneles en la misma página.
No se creó una ruta separada para `trusted-devices` — la UX de seguridad es una página única.

---

## 8. Manejo de errores HTTP

| Código | Descripción | Comportamiento UI |
|---|---|---|
| 200 | Dispositivos devueltos | `devices.set(response)` |
| 204 | Revocación exitosa | Eliminar del array local |
| 401 | JWT inválido o expirado | Interceptor global → redirect /login |
| 404 | Dispositivo no encontrado o de otro usuario | `error.set("Dispositivo no encontrado.")` |
| 500 | Error servidor | `error.set("Error al cargar los dispositivos.")` |

El interceptor HTTP global de la aplicación gestiona el 401 de forma centralizada (redirige al login). El componente solo gestiona errores específicos de su dominio (404, 500).

---

## 9. Cambios en el módulo de login (US-201)

### `OtpVerificationComponent` — diff conceptual

```typescript
// ANTES (Sprint 3):
interface VerifyRequest { otpCode: string; }

// DESPUÉS (Sprint 4, US-201):
interface VerifyRequest { otpCode: string; trustDevice?: boolean; }

// Template añadido al formulario OTP:
<div class="trust-option" *ngIf="!isKnownDevice">
  <label>
    <input type="checkbox" [(ngModel)]="trustDevice"
           aria-label="Recordar este dispositivo durante 30 días" />
    Recordar este dispositivo durante 30 días
  </label>
</div>
```

`isKnownDevice` es `false` siempre en Sprint 4 (no hay información del backend sobre si el
dispositivo ya es de confianza — el backend lo gestiona internamente). En Sprint 5+ se podría
añadir un header de respuesta para ocultar el checkbox si el dispositivo ya está registrado.

---

## 10. Tests cubiertos

El componente `TrustedDevicesComponent` fue implementado en Sprint 4 sin spec `.spec.ts` formal
(gap identificado en retrospectiva Sprint 4 como consecuencia de la ausencia de LLD).

**Tests pendientes para Sprint 5 (derivados de este LLD):**

| Test | Tipo | Escenario |
|---|---|---|
| `TrustedDevicesComponent.spec.ts` — carga inicial | Unit Angular | ngOnInit → GET /api/v1/trusted-devices → devices.set() |
| `TrustedDevicesComponent.spec.ts` — revocar uno | Unit Angular | revokeOne() → DELETE → device eliminado del array |
| `TrustedDevicesComponent.spec.ts` — revocar todos | Unit Angular | revokeAll() → DELETE → devices.set([]) |
| `TrustedDevicesComponent.spec.ts` — estado vacío | Unit Angular | devices().length === 0 → empty state visible |
| `TrustedDevicesComponent.spec.ts` — aria-label | Unit Angular | botón revocación tiene aria-label con OS+browser |
| E2E-S4-01 → E2E-S4-09 | E2E Playwright | Ya cubiertos en Sprint 4 |

---

*SOFIA Architect Agent · BankPortal · FEAT-003 · LLD Frontend · 2026-05-12 (ACT-18)*
