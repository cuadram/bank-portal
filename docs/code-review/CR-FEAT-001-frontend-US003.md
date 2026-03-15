# Code Review — Frontend US-003: RecoveryCodesComponent
**Artefacto:** CR-FEAT-001-frontend-US003
**Versión:** 1.0
**Sprint:** 01 | **Story:** US-003 — T-009
**Commit revisado:** `f02c8a4`
**Commit con fixes:** `[ver git log]`
**Autor del código:** SOFIA Dev Frontend Agent
**Revisor:** SOFIA Code Reviewer Agent
**Fecha:** 2026-03-13
**Estado:** ✅ APROBADO — 4 NCs detectadas y resueltas en la misma sesión

---

## Archivos revisados

| Archivo | Cambio |
|---------|--------|
| `store/two-factor.store.ts` | `generateRecoveryCodes: rxMethod<void>` añadido |
| `components/recovery-codes/recovery-codes.component.ts` | Placeholder reemplazado por implementación completa |
| `components/recovery-codes/recovery-codes.component.html` | Nuevo template — 4 vistas |

---

## Aspectos positivos

- Distinción de contexto (post-enrolamiento vs regeneración) vía `availableRecoveryCodes()` —
  elegante, sin query params ni inputs externos.
- Limpieza de códigos en `ngOnDestroy` correctamente implementada (LLD §6).
- `onDownload()`: `URL.revokeObjectURL` con setTimeout(100ms) — patrón correcto para
  garantizar que el navegador procese el anchor click antes de la revocación.
- `codesReadyEffect` y `errorEffect` bien acotados: protegen contra transiciones espurias.
- Bandera `codesAcknowledged` + botón Continuar deshabilitado: patrón correcto de UX de seguridad.
- Template con `aria-label` por ítem de código (`'Código N: XXXX'`) — lectura correcta por AT.

---

## No Conformidades

---

### NC-001 🔴 Mayor — `switchMap` en `generateRecoveryCodes` — riesgo de pérdida silenciosa de códigos

**Archivo:** `store/two-factor.store.ts`

**Problema:**
`switchMap` cancela la request HTTP en vuelo si llega una nueva emisión. El endpoint
`POST /2fa/recovery-codes/generate` invalida todos los códigos anteriores en el backend
en el momento en que se ejecuta la operación. Si la respuesta es cancelada por `switchMap`:

1. El backend generó nuevos códigos → los anteriores del usuario quedaron invalidados.
2. El frontend nunca recibió la respuesta → `pendingRecoveryCodes` sigue siendo `null`.
3. El usuario queda sin códigos válidos sin ninguna notificación de error.

La justificación del dev ("el botón está deshabilitado durante isLoading") no cubre
todos los paths de disparo: `ngOnInit` (contexto A), `onConfirmRegenerate()`, y
`onRetry()` llaman `generateRecoveryCodes()`. Si dos de estos coinciden en el mismo
microtask, `switchMap` cancela la primera request.

**Fix aplicado:**
```typescript
// ANTES
switchMap(() => svc.generateRecoveryCodes().pipe(...))

// DESPUÉS (exhaustMap: ignora nuevas emisiones mientras hay una request activa)
exhaustMap(() => svc.generateRecoveryCodes().pipe(...))
```
Con comentario documentando la razón de la elección de `exhaustMap`.

**Estado: ✅ CERRADA**

---

### NC-002 🟡 Menor — `codesCountBeforeRegenerate` — dead code

**Archivo:** `components/recovery-codes/recovery-codes.component.ts`

**Problema:**
`private codesCountBeforeRegenerate = 0` se asignaba en `ngOnInit` pero nunca se leía.
El signal `previousCodesCount` (que sí se usa en el template) recibía el mismo valor.

**Fix aplicado:**
```typescript
// ANTES
this.codesCountBeforeRegenerate = currentCodes;
this.previousCodesCount.set(currentCodes);

// DESPUÉS
this.previousCodesCount.set(currentCodes);
// Propiedad privada eliminada
```

**Estado: ✅ CERRADA**

---

### NC-003 🟡 Menor — `aria-live="polite"` en `<button>` — violación ARIA spec §6.6.2

**Archivo:** `components/recovery-codes/recovery-codes.component.html`

**Problema:**
`aria-live` en `<button>` viola ARIA spec §6.6.2 (Live Region Attributes). Aplicado
a elementos interactivos puede causar doble anuncio en lectores de pantalla (una vez
por `aria-live` y otra por el cambio de `aria-label`). El `[attr.aria-label]` dinámico
es el mecanismo correcto y suficiente para anunciar cambios de estado en botones.

**Fix aplicado:**
```html
<!-- ANTES -->
<button type="button" ... aria-live="polite" [attr.aria-label]="...">

<!-- DESPUÉS -->
<button type="button" ... [attr.aria-label]="...">
```

**Estado: ✅ CERRADA**
**Referencia:** mismo principio que NC-003 de US-002 (CR-FEAT-001-frontend-US002.md).

---

### NC-004 🔴 Mayor — `aria-labelledby` en `<main>` referencia ID ausente en vista LOADING

**Archivo:** `components/recovery-codes/recovery-codes.component.html`

**Problema:**
`<main aria-labelledby="recovery-codes-title">` referenciaba un id que no existe en el
DOM durante la vista LOADING (los `<h1 id="recovery-codes-title">` están dentro de
bloques `*ngIf` que no se renderizan en ese estado). El landmark `<main>` quedaba sin
nombre accesible durante el estado inicial del componente.

WCAG 2.1 — 4.1.2 Name, Role, Value (Nivel A).

**Fix aplicado:**
```html
<!-- ANTES -->
<main class="recovery-codes" aria-labelledby="recovery-codes-title">

<!-- DESPUÉS (aria-label estático, siempre resuelto independientemente de la vista) -->
<main class="recovery-codes" aria-label="Códigos de recuperación">
```
Cada vista conserva su propio `<h1>` para la jerarquía visual/semántica.
Eliminado también `role="note"` del `<p>` de subtítulo (ver RV-004).

**Estado: ✅ CERRADA**

---

## Recomendaciones pendientes (no bloquean)

| ID | Descripción | Sprint |
|----|-------------|--------|
| RV-003 | `onCopyAll()` usa `setTimeout` para reset del feedback. Guardar los handles y cancelarlos en `ngOnDestroy` para seguir best practices de cleanup. | Sprint 02 |
| RV-004 | `role="note"` en `<p>` de subtítulo eliminado en el fix de NC-004. En ARIA 1.1+ `note` puede comportarse como landmark en algunos AT causando saltos de navegación inesperados. El `<p>` implícito es suficiente. | Resuelto en fix NC-004 |

---

## Resumen

| NC | Severidad | Archivo | Estado |
|----|-----------|---------|--------|
| NC-001 | 🔴 Mayor | `two-factor.store.ts` | ✅ CERRADA |
| NC-002 | 🟡 Menor | `recovery-codes.component.ts` | ✅ CERRADA |
| NC-003 | 🟡 Menor | `recovery-codes.component.html` | ✅ CERRADA |
| NC-004 | 🔴 Mayor | `recovery-codes.component.html` | ✅ CERRADA |

**Veredicto: ✅ APROBADO** — 4 NCs resueltas en la misma sesión de CR.

---

*Generado por SOFIA Code Reviewer Agent · BankPortal · Sprint 01 · 2026-03-13*
