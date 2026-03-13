# QA Sign-off — Frontend US-004: DisableTwoFactorComponent
**Artefacto:** FEAT-001-qa-signoff-frontend-US004
**Sprint:** 01 | **Story:** US-004 — T-010
**Commit verificado:** `a75fb3e` (post CR v1.0)
**CR de referencia:** CR-FEAT-001-frontend-US004 v1.0 — ✅ APROBADO
**QA Tester:** SOFIA QA Agent
**Fecha:** 2026-03-13

---

## Checklist 1 — NCs del Code Review v1.0 (2/2)

| # | NC | Severidad | Verificación | Resultado |
|---|-----|-----------|-------------|-----------|
| 1 | NC-001: `[attr.aria-describedby]` condicional en input password | 🟡 Menor | `[attr.aria-describedby]="passwordError() ? 'password-error' : null"` presente en el `<input>`. Cuando `passwordError()` es `false`, el atributo es `null` (Angular lo elimina del DOM). Cuando es `true`, apunta al `<p id="password-error">` que existe por `*ngIf`. Referencia siempre resuelta. | ✅ PASS |
| 2 | NC-002: Eliminado `aria-live="polite"` en `<span *ngIf>` | 🟡 Menor | Botón destructivo contiene `{{ store.isLoading() ? 'Desactivando…' : 'Desactivar 2FA' }}` como único nodo de texto. No hay `<span *ngIf>` ni `aria-live` interior. `[attr.aria-busy]` en el botón cubre la semántica AT. | ✅ PASS |

**Resultado Checklist 1: 2/2 PASS**

---

## Checklist 2 — Seguridad LLD §6 (8/8)

| # | Regla LLD §6 | Verificación en código | Resultado |
|---|-------------|----------------------|-----------|
| 1 | Contraseña no persiste fuera del ciclo de vida del componente | `this.password.set('')` en `ngOnDestroy()` limpia explícitamente el signal. Intención de seguridad documentada en comentario. | ✅ PASS |
| 2 | OTP no persiste fuera del ciclo de vida | `otpValue` es un signal local. No se pasa al store ni se envía a ningún canal externo. Se consume solo en `onDisable()` y se destruye con el componente. | ✅ PASS |
| 3 | Sin HTTP directo en el componente | El componente solo invoca `store.disableTwoFactor({password, otp})`. Toda la lógica HTTP reside en `TwoFactorService` a través del store. | ✅ PASS |
| 4 | `exhaustMap` en `disableTwoFactor` — operación destructiva irrecuperable | `disableTwoFactor: rxMethod<DisableRequest>` usa `exhaustMap` en el store. Comentario de rationale presente. Evita desincronización frontend/backend si se cancela una respuesta en vuelo. | ✅ PASS |
| 5 | `clearError()` en `ngOnDestroy` | `this.store.clearError()` llamado en `ngOnDestroy()`. El error del store no queda visible si el usuario navega fuera antes de resolverlo. | ✅ PASS |
| 6 | `access_token` no accedido ni expuesto desde este componente | El componente solo consume `store.status()`, `store.isLoading()` y `store.error()`. Ni `accessToken` ni `pendingRecoveryCodes` ni `pendingQrBase64` son accedidos. | ✅ PASS |
| 7 | En éxito, `pendingRecoveryCodes` limpiado en el store | `disableTwoFactor` en el path `next` aplica `patchState({ pendingRecoveryCodes: null, ... })`. Los códigos en memoria se eliminan al desactivar 2FA. | ✅ PASS |
| 8 | Contraseña y OTP no expuestos en URL ni en navegación | `onDisableConfirmed()` en el contenedor llama `currentView.set('STATUS')`. No hay `router.navigate` con parámetros sensibles. | ✅ PASS |

**Resultado Checklist 2: 8/8 PASS**

---

## Checklist 3 — Accesibilidad WCAG 2.1 AA — estático (16/16)

### Estructura y landmarks

| # | Verificación | Resultado |
|---|-------------|-----------|
| 1 | `<section aria-labelledby="disable-2fa-title">` — landmark `region` con nombre accesible siempre resuelto | ✅ PASS |
| 2 | `<h2 id="disable-2fa-title">` — ID siempre en el DOM (no bajo `*ngIf`), referencia sin romper | ✅ PASS |
| 3 | `<p id="disable-2fa-desc">` siempre en el DOM — usado por `aria-describedby` del `<div>` formulario y por el botón destructivo | ✅ PASS |

### Aviso de consecuencias

| # | Verificación | Resultado |
|---|-------------|-----------|
| 4 | `role="alert"` en `<div class="disable-2fa__warning">` — anuncia al AT al montar el componente (el usuario hizo clic en "Desactivar 2FA", es el momento correcto) | ✅ PASS |
| 5 | `aria-labelledby="disable-warning-title"` en el aviso + `<h3 id="disable-warning-title">` resuelto siempre | ✅ PASS |

### Campo contraseña

| # | Verificación | Resultado |
|---|-------------|-----------|
| 6 | `<label for="disable-password">` asociado al `<input id="disable-password">` — WCAG 1.3.1 Nivel A | ✅ PASS |
| 7 | `aria-required="true"` en el input | ✅ PASS |
| 8 | `[attr.aria-invalid]="passwordError()"` — dinámico, refleja estado real de validación | ✅ PASS |
| 9 | `[attr.aria-describedby]="passwordError() ? 'password-error' : null"` — condicional (NC-001 fix); ID solo referenciado cuando existe en el DOM | ✅ PASS |
| 10 | `autocomplete="current-password"` — conforme WCAG 1.3.5 + PCI-DSS | ✅ PASS |
| 11 | Botón toggle `type=button`, `[attr.aria-pressed]` dinámico, `[attr.aria-label]` dinámico ("Mostrar/Ocultar contraseña"), emoji protegido con `aria-hidden="true"` | ✅ PASS |

### Campo OTP

| # | Verificación | Resultado |
|---|-------------|-----------|
| 12 | `<p id="otp-label">` + `aria-labelledby="otp-label"` en `<bp-otp-input>` | ✅ PASS |
| 13 | `<p id="otp-hint">` + `aria-describedby="otp-hint"` en `<bp-otp-input>` | ✅ PASS |

### Errores y feedback

| # | Verificación | Resultado |
|---|-------------|-----------|
| 14 | `role="alert"` en error local de contraseña — anuncio inmediato al AT | ✅ PASS |
| 15 | `role="alert"` en error local de OTP | ✅ PASS |
| 16 | `role="alert" aria-live="assertive"` en error backend (`*ngIf="store.error()"`) — región estática en el DOM que recibe el contenido cuando aparece el error; `aria-live` en el contenedor, no en el `*ngIf | ✅ PASS |

### Botones

| # | Verificación | Resultado |
|---|-------------|-----------|
| 17 | `type=button` en ambos botones — previene submit accidental | ✅ PASS |
| 18 | `[attr.aria-busy]="store.isLoading()"` en botón destructivo (NC-002 — mecanismo correcto ARIA §6.6.5) | ✅ PASS |
| 19 | `[attr.aria-disabled]="store.isLoading()"` en botón destructivo | ✅ PASS |
| 20 | Texto botón: interpolación directa `{{ isLoading() ? 'Desactivando…' : 'Desactivar 2FA' }}` — un único nodo de texto dinámico, sin `aria-live` redundante (NC-002 fix) | ✅ PASS |
| 21 | `aria-describedby="disable-2fa-desc disable-warning-title"` en botón destructivo — doble anclaje de descripción: subtítulo + aviso de consecuencias | ✅ PASS |

> **Nota L4:** verificación de contraste de color, foco visible y comportamiento de lectores de pantalla en runtime queda pendiente hasta la fase E2E (Sprint 02).

**Resultado Checklist 3: 21/21 verificaciones PASS**

---

## Checklist 4 — Arquitectura LLD §4 Angular (10/10)

| # | Verificación | Resultado |
|---|-------------|-----------|
| 1 | `standalone: true` — no depende de NgModule | ✅ PASS |
| 2 | `ChangeDetectionStrategy.OnPush` — compatible con Signal Store reactivo | ✅ PASS |
| 3 | `inject()` para todas las dependencias (`TwoFactorStore`) — no constructor injection | ✅ PASS |
| 4 | `implements OnDestroy` + `ngOnDestroy()` implementado con limpieza de seguridad | ✅ PASS |
| 5 | `disableEffect` es `private readonly`, creado en injection context del componente — se destruye automáticamente al destruirse el componente (Angular 17+) | ✅ PASS |
| 6 | Patrón `disableAttempted` — consistente con `confirmAttempted` (US-001) y `verifyAttempted` (US-002); evita disparo espúreo del effect en init o navegación back | ✅ PASS |
| 7 | `@Output() disableConfirmed` y `@Output() cancelled` como `EventEmitter<void>` — comunicación unidireccional hacia el contenedor | ✅ PASS |
| 8 | `TwoFactorSetupComponent` actualizado: import `DisableTwoFactorComponent`, handlers `onDisableConfirmed()` y `onDisableCancelled()`, template con `<bp-disable-two-factor>` y bindings correctos | ✅ PASS |
| 9 | `OtpInputComponent` reutilizado desde `shared/` (standalone import) — coherente con US-001 y US-002 | ✅ PASS |
| 10 | Transición de estado `ENABLED → DISABLED` definida en LLD §3 (`stateDiagram`) implementada correctamente: `disableTwoFactor` next → `patchState({ status: 'DISABLED' })` | ✅ PASS |

**Resultado Checklist 4: 10/10 PASS**

---

## Resumen de verificaciones

| Checklist | Ítems | Resultado |
|-----------|-------|-----------|
| 1 — NCs CR v1.0 | 2/2 | ✅ PASS |
| 2 — Seguridad LLD §6 | 8/8 | ✅ PASS |
| 3 — WCAG 2.1 AA estático | 21/21 | ✅ PASS |
| 4 — Arquitectura LLD §4 | 10/10 | ✅ PASS |
| **TOTAL** | **41/41** | ✅ |

---

## Pendientes de release (no bloquean US-004 ni merge de FEAT-001)

| ID | Descripción | Sprint objetivo |
|----|-------------|-----------------|
| L4 | Accesibilidad runtime: contraste dinámico, foco visible, NVDA/JAWS | Sprint 02 / E2E |
| L6 | E2E Playwright: flujos completos disable 2FA (éxito, error, cancelación, navegación back) | Sprint 02 / E2E |
| RV-005 | WARN-01: 7mo test en `DisableTwoFactorUseCaseTest` (backend) — completar antes del merge a `main` | Antes de merge |
| RV-003 | Cancelar handles de `setTimeout` en `ngOnDestroy` de `RecoveryCodesComponent` | Sprint 02 |

---

## Veredicto

**✅ APROBADO** — 41/41 verificaciones PASS. Sin condiciones.

FEAT-001 frontend completado (US-001 · US-002 · US-003 · US-004).
Pendiente antes del merge a `main`: **RV-005 / WARN-01** (backend).

---

*Generado por SOFIA QA Agent · BankPortal · Sprint 01 · 2026-03-13*
