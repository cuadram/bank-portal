# Code Review — Frontend US-004: DisableTwoFactorComponent
**Artefacto:** CR-FEAT-001-frontend-US004
**Versión:** 1.0
**Sprint:** 01 | **Story:** US-004 — T-010
**Commit revisado:** `b78f5cc`
**Commit con fixes:** `[ver git log]`
**Autor del código:** SOFIA Dev Frontend Agent
**Revisor:** SOFIA Code Reviewer Agent
**Fecha:** 2026-03-13
**Estado:** ✅ APROBADO — 2 NCs detectadas y resueltas en la misma sesión

---

## Archivos revisados

| Archivo | Cambio |
|---------|--------|
| `store/two-factor.store.ts` | `DisableRequest` interface + `disableTwoFactor: rxMethod<DisableRequest>` |
| `disable-two-factor/disable-two-factor.component.ts` | Nuevo |
| `disable-two-factor/disable-two-factor.component.html` | Nuevo |
| `two-factor-setup.component.ts` | Import + `onDisableConfirmed()` + `onDisableCancelled()` |
| `two-factor-setup.component.html` | Placeholder → `<bp-disable-two-factor>` |

---

## Aspectos positivos

- `exhaustMap` en `disableTwoFactor` con rationale documentado — correcto para
  operación destructiva e irreversible.
- Patrón `disableAttempted` consistente con `confirmAttempted` (US-001) y
  `verifyAttempted` (US-002).
- `password.set('')` en `ngOnDestroy` documenta la intención de seguridad (LLD §6).
- Orden de parámetros `svc.disable(request.otp, request.password)` correcto.
- Toggle show/hide contraseña con `aria-pressed` dinámico — patrón correcto.
- `[attr.aria-busy]` y `[attr.aria-disabled]` en el botón destructivo — correcto.
- `role="alert"` en aviso de consecuencias: anuncia al AT al montar el componente.
- `TwoFactorSetupComponent` actualizado limpiamente sin romper `enrollEffect`.

---

## No Conformidades

---

### NC-001 🟡 Menor — `aria-describedby="password-error"` estático — referencia ID inexistente en DOM

**Archivo:** `disable-two-factor.component.html`

**Problema:**
`aria-describedby="password-error"` estático apuntaba a un ID que no existe en el
DOM cuando `passwordError()` es `false` (`*ngIf` elimina el `<p>`). Los IDs
referenciados por `aria-describedby` deben existir en el DOM (WCAG — Técnica ARIA1).

**Fix aplicado:**
```html
<!-- ANTES -->
aria-describedby="password-error"

<!-- DESPUÉS -->
[attr.aria-describedby]="passwordError() ? 'password-error' : null"
```

**Estado: ✅ CERRADA**

---

### NC-002 🟡 Menor — `aria-live="polite"` en `<span>` bajo `*ngIf` — región live efímera

**Archivo:** `disable-two-factor.component.html`

**Problema:**
`aria-live` en un `<span>` creado/destruido por `*ngIf` no es monitorizado
correctamente por NVDA/JAWS (ARIA spec §6.6.2 — las regiones live se registran
al cargar la página). El botón ya tiene `[attr.aria-busy]` que es el mecanismo
semántico correcto para comunicar al AT que hay una operación en curso (ARIA §6.6.5).

**Fix aplicado:**
```html
<!-- ANTES -->
<span *ngIf="!store.isLoading()">Desactivar 2FA</span>
<span *ngIf="store.isLoading()" aria-live="polite">Desactivando…</span>

<!-- DESPUÉS: interpolación directa — un único nodo de texto, sin aria-live -->
{{ store.isLoading() ? 'Desactivando…' : 'Desactivar 2FA' }}
```

**Estado: ✅ CERRADA**

---

## Recomendaciones pendientes (no bloquean)

| ID | Descripción | Sprint |
|----|-------------|--------|
| RV-005 | WARN-01: 7mo test en `DisableTwoFactorUseCaseTest` (backend) — completar antes del merge a `main`. | Antes de merge |

---

## Resumen

| NC | Severidad | Archivo | Estado |
|----|-----------|---------|--------|
| NC-001 | 🟡 Menor | `disable-two-factor.component.html` | ✅ CERRADA |
| NC-002 | 🟡 Menor | `disable-two-factor.component.html` | ✅ CERRADA |

**Veredicto: ✅ APROBADO** — 2 NCs resueltas en la misma sesión de CR.

---

*Generado por SOFIA Code Reviewer Agent · BankPortal · Sprint 01 · 2026-03-13*
