# DR-S26-008 — Hallazgos preexistentes auth guard + multi-cuenta selector

**Fecha:** 2026-05-08
**Sprint:** 26
**Step origen:** 7 (DevOps) — alcance ampliado por hallazgos PO durante verificación visual
**Decisión PO:** Angel de la Cuadra
**Modalidad gobernanza:** RECOMENDACIÓN-1 pragmática (fix mínimo + DEBT abiertas + LA candidata)

## Contexto

Durante verificación visual de B.4 (DR-S26-007), el PO detectó dos defectos funcionales **preexistentes** que pasaron G-5 (Code Review) y G-6 (QA) sin ser detectados:

### Hallazgo 1 — Click en meta redirige a /login

`goalOwnerGuard` (FEAT-024 Sprint 26 §LLD-frontend) delegaba en `SessionService.isAuthenticated()` que lee de `sessionStorage.bp_access_token`. Pero ningún writer escribe en esa clave. Existen 3 sistemas de auth storage coexistiendo:

1. `localStorage.access_token` ← `LoginComponent` (Sprint 13 legacy single-step)
2. `sessionStorage.bp_access_token` ← `TokenService` (DEBT-033 refactor abandonado, sin escritor real)
3. `TwoFactorStore` memoria ← OTP flow (`authInterceptor` orfano, no registrado en module)

**El guard fallaba SIEMPRE** y redirigía a login al hacer click en cualquier meta.

### Hallazgo 3 (con sub-hallazgos OBS) — Multi-cuenta selector

`ContributionModalComponent` mostraba un selector de cuenta con UNA opción hard-coded. El prototipo HITL G-2c (`PROTO-FEAT-024-sprint26.html` líneas 1664-1665) muestra DOS cuentas reales con IBAN y saldo disponible.

Comentarios inline OBS-005, OBS-008, OBS-009 en el código fuente documentaban estas desviaciones del prototipo, pero **nunca fueron escaladas a DEBT formal en informe Step 5**. G-5 y G-6 las pasaron por alto (Code Review no ejecutó UI; QA usó tests E2E API-driven que saltaban routing Angular).

## Causas raíz identificadas

1. **Cobertura E2E API-driven exclusivamente** en Step 6 → no detecta bugs navegacionales/UI.
2. **Patrón "OBS-XXX en comentario inline"** sin escalado obligatorio a informe Step 5 → deuda invisible.
3. **DEBT-033 (refactor auth) abandonado a medias** desde sprints anteriores → 3 sistemas coexistiendo.
4. **No hay prototype-fidelity check formal** entre Step 4 (Developer) y Step 5 (Code Reviewer).

## Decisión

**RECOMENDACIÓN-1 pragmática + camino-2** (fix OBS-008+009, no OBS-005):

| Hallazgo | Acción Step 7 | Deuda generada |
|----------|---------------|-----------------|
| Hallazgo 1 (auth guard) | Fix mínimo: `goalOwnerGuard` lee `localStorage.access_token` (consistente con `AuthGuard` y `JwtInterceptor`) | DEBT-FE-074 (S27) |
| OBS-008 (multi-cuenta select) | Cargar cuentas reales via `AccountService.getAccounts()` existente | — (resuelto) |
| OBS-009 (saldos summary-box) | Mostrar `selectedAccount.availableBalance` y proyección tras aportar | — (resuelto) |
| OBS-005 (selector goal-create) | NO se arregla: prototipo HITL no exige selector aquí | DEBT-FE-075 (S27, baja prioridad) |

## Implementación aplicada

**Fichero 1:** `apps/frontend-portal/src/app/features/savings/guards/goal-owner.guard.ts`
- Eliminada dependencia de `SessionService` (orfano)
- Lectura directa de `localStorage.access_token`

**Fichero 2:** `apps/frontend-portal/src/app/features/savings/components/contribution-modal/contribution-modal.component.ts`
- Inyectado `AccountService` existente
- Estado `accounts: AccountSummary[]`, `loadingAccounts`, `accountsError`
- Método `loadAccounts()` invocado en `ngOnInit`
- Método `applyDefaultAccountSelection()` con prioridad `goal.sourceAccountId` → primera cuenta
- Getter `selectedAccount` para summary-box reactivo
- Template select dinámico con `*ngFor` + `trackByAccount`
- Template summary-box con `selectedAccount.availableBalance` y `availableBalance - contributionAmount`

**Total:** ~80 líneas modificadas en 1 fichero (modal). Cero modificaciones backend. Cero services nuevos.

## Validación end-to-end

- ng build production EXIT 0 sin errores TypeScript
- Backend regression 147/147 tests (ninguna afectación)
- Visual confirmado por PO: click meta → detalle correcto, selector muestra "Cuenta Corriente Nómina · ES91 ****1332 · Disponible 8758,63 €" con segunda opción al desplegar

## Deudas generadas

| ID | Scope | Sprint |
|----|-------|--------|
| DEBT-FE-074 | Refactor unificado auth (cierra DEBT-033): 1 storage canónico, 1 writer, 1 interceptor registrado, 1 guard pattern, token expiration consistency, refresh token flow | S27 (alta prioridad) |
| DEBT-FE-075 | OBS-005 + cobertura E2E UI-driven obligatoria pre-G-5/G-6 + prototype-fidelity check | S27 (media prioridad) |

## LA candidata SOFIA-CORE

**`GR-FE-002` — Cobertura E2E UI-driven obligatoria pre-G-5/G-6**

Justificación: el patrón actual de aprobar gates con E2E API-driven exclusivamente permite que defectos navegacionales/UI atraviesen Code Review y QA sin ser detectados. Ejemplo S26: 4 defectos (1 crítico auth + 3 OBS prototype-fidelity) llegaron a Step 7 ocluidos.

Promoción al cierre Sprint 26.
