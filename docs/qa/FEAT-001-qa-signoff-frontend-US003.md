# QA Sign-off — Frontend US-003: RecoveryCodesComponent
**Artefacto:** FEAT-001-qa-signoff-frontend-US003
**Sprint:** 01 | **Story:** US-003 — T-009
**Commit evaluado:** `7a9534d` (post-CR v1.0)
**CR de referencia:** CR-FEAT-001-frontend-US003.md v1.0
**QA Tester:** SOFIA QA Tester Agent
**Fecha:** 2026-03-13
**Estado:** ✅ APROBADO

---

## Checklist 1 — NCs Code Review v1.0 (4/4)

| # | NC | Severidad | Verificación | Resultado |
|---|----|-----------|--------------|-----------|
| 1 | NC-001 | 🔴 Mayor | `generateRecoveryCodes` usa `exhaustMap` en `two-factor.store.ts`. Comentario de rationale presente. | ✅ PASS |
| 2 | NC-002 | 🟡 Menor | `codesCountBeforeRegenerate` eliminada del componente. Solo existe `previousCodesCount` signal. | ✅ PASS |
| 3 | NC-003 | 🟡 Menor | `aria-live="polite"` eliminado del `<button>` Copiar. Solo `[attr.aria-label]` dinámico. | ✅ PASS |
| 4 | NC-004 | 🔴 Mayor | `<main aria-label="Códigos de recuperación">` — aria-label estático. Sin `aria-labelledby`. | ✅ PASS |

**Subtotal: 4/4 ✅**

---

## Checklist 2 — Seguridad LLD §6 (8/8)

| # | Regla LLD §6 | Verificación | Resultado |
|---|--------------|--------------|-----------|
| 1 | `pendingRecoveryCodes` solo en memoria — nunca en localStorage / sessionStorage | Store solo usa `patchState`. Ningún punto del componente escribe en Web Storage. | ✅ PASS |
| 2 | `clearPendingRecoveryCodes()` llamado en `ngOnDestroy` | `ngOnDestroy()` llama `store.clearPendingRecoveryCodes()` antes de `clearError()`. | ✅ PASS |
| 3 | `clearError()` llamado en `ngOnDestroy` | Presente y en orden correcto tras `clearPendingRecoveryCodes()`. | ✅ PASS |
| 4 | Blob API sin persistencia — `URL.revokeObjectURL` garantizado | `setTimeout(() => URL.revokeObjectURL(url), 100)` — URL revocada 100 ms tras el click. No se almacena la URL como propiedad. | ✅ PASS |
| 5 | Clipboard API solo en HTTPS — sin fallback que exponga códigos | `if (!navigator.clipboard)` → `copyFeedback.set('error')`. Los códigos no se exponen por ningún canal alternativo. | ✅ PASS |
| 6 | Checkbox de confirmación obligatorio antes de `onContinue()` | `[disabled]="!codesAcknowledged()"` + `[attr.aria-disabled]="!codesAcknowledged()"` en el botón Continuar. | ✅ PASS |
| 7 | `onContinue()` navega sin códigos en la URL ni en query params | `router.navigate(['/security/2fa'])` — sin estado sensible en la ruta. | ✅ PASS |
| 8 | `access_token` sin acceso desde este componente | El componente no lee ni escribe `accessToken`. Solo usa `pendingRecoveryCodes`, `availableRecoveryCodes`, `isLoading`, `error`. | ✅ PASS |

**Subtotal: 8/8 ✅**

---

## Checklist 3 — Accesibilidad WCAG 2.1 AA — Estático (16/16)

### Landmark y estructura global

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | `<main aria-label="Códigos de recuperación">` — landmark nombrado en todas las vistas, incluida LOADING (NC-004 fix). | ✅ PASS |
| 2 | Cada vista que lo necesita tiene `<h1>` con texto descriptivo. | ✅ PASS |

### Vista LOADING

| # | Verificación | Resultado |
|---|--------------|-----------|
| 3 | `<div role="status" aria-live="polite" aria-busy="true">` — anuncia el estado de carga a AT. | ✅ PASS |
| 4 | `<span aria-hidden="true">` en el spinner — no leído por AT. | ✅ PASS |

### Vista CONFIRM_REGENERATE

| # | Verificación | Resultado |
|---|--------------|-----------|
| 5 | `role="alert" aria-labelledby="regen-warning-title"` en el warning box — anuncio inmediato al AT. | ✅ PASS |
| 6 | Botones con `type="button"` y `[disabled]` durante `isLoading`. | ✅ PASS |
| 7 | Botón de confirmación destructiva con `aria-describedby="regen-warning-title"` — descripción de la acción. | ✅ PASS |

### Vista DISPLAY

| # | Verificación | Resultado |
|---|--------------|-----------|
| 8 | `<section aria-labelledby="recovery-codes-list-label" aria-describedby="recovery-codes-desc">` — sección de lista nombrada y descrita. | ✅ PASS |
| 9 | `<p id="recovery-codes-list-label" class="sr-only">` con conteo de códigos — accesible solo para AT. | ✅ PASS |
| 10 | `<ol aria-label="Códigos de recuperación">` — lista ordenada con nombre accesible. | ✅ PASS |
| 11 | `<code [attr.aria-label]="'Código ' + (i+1) + ': ' + code">` por ítem — cada código leído individualmente con índice. | ✅ PASS |
| 12 | Botón Copiar: `[attr.aria-label]` dinámico (`idle` / `success` / `error`) sin `aria-live` (NC-003 fix). | ✅ PASS |
| 13 | Botón Descargar: `aria-label="Descargar códigos como archivo de texto"` — descripción de la acción de descarga. | ✅ PASS |
| 14 | Checkbox `id="codes-acknowledged"` dentro de `<label>` — asociación correcta. `aria-describedby="acknowledged-hint"` en el input. | ✅ PASS |
| 15 | Botón Continuar: `[attr.aria-disabled]="!codesAcknowledged()"` + `aria-describedby="acknowledged-hint"` — estado y razón del bloqueo accesibles. | ✅ PASS |

### Vista ERROR

| # | Verificación | Resultado |
|---|--------------|-----------|
| 16 | `role="alert" aria-live="assertive"` — error anunciado inmediatamente. Botones con `type="button"`. | ✅ PASS |

**Subtotal: 16/16 ✅**

> **L4 runtime pendiente (no bloquea):** contraste de colores, navegación por teclado, foco
> y pruebas con lectores de pantalla reales (NVDA, VoiceOver) — aplazado a sprint E2E.

---

## Checklist 4 — Arquitectura LLD §4 Angular (10/10)

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | `standalone: true` — sin NgModule. | ✅ PASS |
| 2 | `changeDetection: ChangeDetectionStrategy.OnPush` — rendimiento correcto con signals. | ✅ PASS |
| 3 | `inject()` para `TwoFactorStore` y `Router` — sin constructor DI. | ✅ PASS |
| 4 | `implements OnInit, OnDestroy` — interfaces declaradas explícitamente. | ✅ PASS |
| 5 | `ngOnInit` gestiona distinción de contexto correctamente (3 ramas: REGENERATE / ya tiene códigos / POST_ENROLL). | ✅ PASS |
| 6 | Effects `codesReadyEffect` y `errorEffect` como `private readonly` dentro del injection context. Se destruyen automáticamente con el componente. | ✅ PASS |
| 7 | `codes = computed(...)` — derivado del store, sin state duplicado en el componente. | ✅ PASS |
| 8 | `generateRecoveryCodes: rxMethod<void>` con `exhaustMap` en el store — ninguna llamada HTTP directa en el componente. | ✅ PASS |
| 9 | Ruta lazy `recovery-codes` existente en `TWO_FACTOR_ROUTES` (`two-factor.routes.ts`). | ✅ PASS |
| 10 | Store `providedIn: 'root'` — singleton compartido; el componente lee solo los signals que necesita. | ✅ PASS |

**Subtotal: 10/10 ✅**

---

## Resumen de ejecución

| Checklist | Ítems | Resultado |
|-----------|-------|-----------|
| 1 — NCs CR v1.0 | 4/4 | ✅ PASS |
| 2 — Seguridad LLD §6 | 8/8 | ✅ PASS |
| 3 — Accesibilidad WCAG 2.1 AA (estático) | 16/16 | ✅ PASS |
| 4 — Arquitectura LLD §4 Angular | 10/10 | ✅ PASS |
| **TOTAL** | **38/38** | ✅ |

**Veredicto: ✅ APROBADO** — sin condiciones.

---

## Pendientes de release (no bloquean US-004)

| ID | Descripción |
|----|-------------|
| L4 | Accesibilidad runtime: contraste, foco, navegación teclado, NVDA/VoiceOver |
| L6 | E2E Playwright: flujos post-enrolamiento y regeneración end-to-end |
| RV-003 | Cancelar handles de `setTimeout` en `ngOnDestroy` (Sprint 02) |

---

*Generado por SOFIA QA Tester Agent · BankPortal · Sprint 01 · 2026-03-13*
