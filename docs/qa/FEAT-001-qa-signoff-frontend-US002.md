# QA Sign-off — Frontend US-002: Verificar OTP en flujo de login
## BankPortal — Banco Meridian | FEAT-001

| Campo               | Valor                                                        |
|---------------------|--------------------------------------------------------------|
| **Artefacto**       | QA Sign-off Frontend US-002                                  |
| **Proceso CMMI**    | VER — Verification (verificación de work product)            |
| **QA Tester**       | SOFIA Agent — Rol: QA Tester                                 |
| **Fecha**           | 2026-03-12                                                   |
| **Commit auditado** | `3544732` — CR fixes aplicados (post `06d4528` Dev)          |
| **CR referencia**   | `docs/code-review/CR-FEAT-001-frontend-US002.md` v1.0        |
| **Sign-off previo** | `docs/qa/FEAT-001-qa-signoff-frontend-US001.md`              |
| **Veredicto**       | ✅ APROBADO                                                  |

---

## Propósito

Sign-off de verificación estática sobre el código de US-002 Frontend tras Code Review v1.0.
Verifica que:

1. Las 3 NCs del CR están correctamente resueltas en el código post-fix.
2. El código cumple las reglas de seguridad del LLD §6.
3. Los TCs de accesibilidad verificables estáticamente pasan.
4. La arquitectura es coherente con LLD §4.
5. La condición de merge de US-001 (DEBT-004) queda levantada.

---

## Checklist 1 — NCs del Code Review (CR v1.0)

| NC | Severidad | Fix esperado | Verificación estática | Estado |
|----|-----------|-------------|----------------------|--------|
| NC-001 | 🟠 Mayor | `onRecoveryChange()` almacena valor raw; `trim().toUpperCase()` solo en `onVerify()`; sin `[value]` binding en template | `this.recoveryValue.set(value)` en handler; `const code = this.recoveryValue().trim().toUpperCase()` en `onVerify()`; input sin `[value]` — confirmado | ✅ PASS |
| NC-002 | 🟡 Menor | Eliminar `role="main"` de `<main>` | `<main class="otp-verification" aria-labelledby="otp-verify-title">` — sin atributo role — confirmado | ✅ PASS |
| NC-003 | 🟡 Menor | `[attr.aria-busy]` en `<button>`, no en `<span>` interior | `<button [attr.aria-busy]="store.isLoading()">`; `<span aria-live="polite">` sin aria-busy — confirmado | ✅ PASS |

**Resultado: 3/3 NCs PASS ✅**

---

## Checklist 2 — Reglas de seguridad LLD §6

| Regla LLD §6 | Implementación esperada | Verificación | Estado |
|--------------|------------------------|--------------|--------|
| `access_token` nunca en localStorage | Solo en `TwoFactorStore` (memoria) | `patchState(store, { accessToken: res.access_token })` — sin referencia a `localStorage.setItem` en ningún archivo auditado | ✅ PASS |
| `pre_auth_token` limpiado tras éxito | `sessionStorage.removeItem()` en path de éxito | `sessionStorage.removeItem(environment.preAuthTokenSessionKey)` en `tapResponse.next` de `verifyLogin` — antes de `patchState` | ✅ PASS |
| `pre_auth_token` limpiado al cancelar | `clearSession()` invocado en `onCancel()` | `onCancel()` → `this.store.clearSession()` → `sessionStorage.removeItem()` + `patchState({ accessToken: null })` — confirmado | ✅ PASS |
| `pre_auth_token` conservado en error | Path de error no elimina el token (reintentos en TTL) | `tapResponse.error` solo actualiza `{ isLoading: false, error: err.message }` — sin `removeItem` — correcto | ✅ PASS |
| Header `PreAuth` correcto para `/2fa/verify` | Interceptor: `PreAuth <pre_auth_token>` cuando URL contiene `/2fa/verify` | `if (preAuthToken && req.url.includes('/2fa/verify'))` → `Authorization: PreAuth ${preAuthToken}` — confirmado | ✅ PASS |
| Header `Bearer` para rutas protegidas | Interceptor: `Bearer <access_token>` desde store | `inject(TwoFactorStore)` + `store.accessToken()` → `Authorization: Bearer ${accessToken}` (DEBT-004 resuelto) | ✅ PASS |
| `exhaustMap` en `verifyLogin` (OTP single-use) | `exhaustMap` — sin doble submit | `exhaustMap((request) => svc.verifyOtp(request).pipe(...))` en `two-factor.store.ts` — confirmado | ✅ PASS |
| Guard protege `/auth/otp-verify` | `twoFactorGuard` en `canActivate` | `OTP_VERIFY_ROUTES[0].canActivate: [twoFactorGuard]` — guard verifica `sessionStorage.getItem(env.preAuthTokenSessionKey)` | ✅ PASS |
| `clearSession()` limpia ambos contextos | `sessionStorage.removeItem()` + `patchState({ accessToken: null })` | Método `clearSession()` en store — ambas limpiezas confirmadas | ✅ PASS |
| Sin `localStorage` en ningún punto del flujo | Sin persistencia en localStorage | Búsqueda en todos los archivos auditados — `localStorage` no referenciado | ✅ PASS |

**Resultado: 10/10 reglas LLD §6 PASS ✅**

---

## Checklist 3 — Accesibilidad WCAG 2.1 AA (análisis estático)

> Runtime bloqueado hasta sprint E2E Playwright. Este checklist evalúa los ítems
> verificables sin ejecutar el navegador.

| # | Criterio WCAG | Implementación | Estado |
|---|---------------|----------------|--------|
| 1 | SC 1.3.1 — Landmark `<main>` con label | `<main aria-labelledby="otp-verify-title">` + `<h1 id="otp-verify-title">` | ✅ PASS |
| 2 | SC 4.1.2 — Sin rol ARIA redundante | `role="main"` eliminado de `<main>` (CR-NC-002) | ✅ PASS |
| 3 | SC 4.1.3 — Cambio dinámico de modo anunciado | `<p aria-live="polite">` anuncia cambio OTP↔RECOVERY al lector de pantalla | ✅ PASS |
| 4 | SC 1.3.1 — Sección OTP etiquetada | `<section aria-labelledby="otp-section-label">` + `<p id="otp-section-label">` | ✅ PASS |
| 5 | SC 1.3.1 — `bp-otp-input` con label accesible | `<bp-otp-input aria-labelledby="otp-section-label">` | ✅ PASS |
| 6 | SC 1.3.1 — Label asociado a recovery input | `<label id="recovery-section-label" for="recovery-input">` — enlace semántico correcto | ✅ PASS |
| 7 | SC 1.3.1 — Recovery input con descripción | `aria-describedby="recovery-hint recovery-error"` — IDs de hint y error referenciados | ✅ PASS |
| 8 | SC 4.1.3 — Errores anunciados con `role="alert"` | `role="alert"` en: error OTP formato, error recovery local, error backend — 3 puntos | ✅ PASS |
| 9 | SC 4.1.3 — Error backend con `aria-live="assertive"` | `<div role="alert" aria-live="assertive">` — prioridad alta para errores críticos | ✅ PASS |
| 10 | SC 4.1.2 — Estado de carga en botón | `[attr.aria-busy]="store.isLoading()"` en `<button>` (CR-NC-003) | ✅ PASS |
| 11 | SC 4.1.3 — Texto de carga anunciado | `<span aria-live="polite">Verificando…</span>` — anuncio polite al cambiar | ✅ PASS |
| 12 | SC 4.1.2 — Botón toggle con label dinámico | `[attr.aria-label]` descriptivo según modo — "Usar código de recuperación…" / "Volver a usar el código…" | ✅ PASS |
| 13 | SC 2.1.1 — Botones navegables con teclado | Todos los `<button>` tienen `type="button"` explícito — sin submit implícito | ✅ PASS |
| 14 | HTML Living Standard — autocomplete recovery | `autocomplete="off"` en recovery input — código de uso único, sin sugerencias | ✅ PASS |
| — | Runtime: contraste, foco visible, lectores de pantalla | Requiere render en navegador | ⏳ BLOQUEADO |

**Resultado estático: 14/14 checks PASS ✅ — Runtime bloqueado hasta sprint E2E**

---

## Checklist 4 — Arquitectura y LLD §4 (estructura Angular)

| Ítem | LLD §4 esperado | Verificación | Estado |
|------|-----------------|--------------|--------|
| Standalone component | `standalone: true` | Confirmado en `@Component` | ✅ PASS |
| `ChangeDetectionStrategy.OnPush` | Obligatorio en todos los componentes | Confirmado | ✅ PASS |
| Lazy loading | `loadComponent` en `OTP_VERIFY_ROUTES` | `import('./components/otp-verification/...')` en routes | ✅ PASS |
| Guard en ruta de verificación | `canActivate: [twoFactorGuard]` | Confirmado en `OTP_VERIFY_ROUTES[0]` | ✅ PASS |
| Modelos tipados | `VerifyOtpRequest` de `models/verify.model.ts` | Importado y usado en `verifyLogin: rxMethod<VerifyOtpRequest>` | ✅ PASS |
| `exhaustMap` para OTP single-use | Mismo patrón que `confirmEnroll` (US-001) | Confirmado en `verifyLogin` del store | ✅ PASS |
| Bandera anti-init-fire | Patrón `confirmAttempted` de US-001 | `private verifyAttempted = false` — consistent con el patrón establecido | ✅ PASS |
| `ngOnDestroy` con lógica real | No vacío (diferencia de US-001 NC-007) | `store.clearError()` en `ngOnDestroy` — justificado | ✅ PASS |
| `OTP_VERIFY_ROUTES` exportado | Ruta lista para montar en `app.routes.ts` | Exportado con documentación de montaje en comentario | ✅ PASS |

**Resultado: 9/9 ítems LLD §4 PASS ✅**

---

## Cierre de DEBT-004 (condición de merge US-001)

El sign-off de US-001 estableció la siguiente condición obligatoria de merge:

> **DEBT-004**: `getAccessTokenFromMemory()` en `auth.interceptor.ts` debe conectarse
> al `AuthStore` antes de hacer merge de la feature branch a `develop`.

**Estado en commit `3544732`:**

```typescript
// Antes (stub — DEBT-004 abierto):
function getAccessTokenFromMemory(): string | null {
  return null; // TODO: inyectar AuthStore
}

// Después (DEBT-004 resuelto en US-002):
const store = inject(TwoFactorStore);
const accessToken = store.accessToken();
```

`inject(TwoFactorStore)` dentro del closure de `HttpInterceptorFn` es correcto en runtime
(Angular 17+ resuelve el injection context de forma perezosa por request).
El interceptor conecta correctamente al store que gestiona el `access_token` en memoria.

**✅ DEBT-004 CERRADO — Condición de merge US-001 levantada.**

---

## Recomendaciones del CR — estado

| ID | Descripción | Sprint | Estado |
|----|-------------|--------|--------|
| RV-001 | Mock de `TwoFactorStore` necesario en TestBed para tests del interceptor | Sprint 02 | 📋 Registrada |
| RV-002 | `PUBLIC_PATHS` matching con `startsWith + apiBaseUrl` en lugar de `includes` | Sprint 02 | 📋 Registrada (carry-over de CR US-001) |

---

## Niveles de prueba — estado actualizado post US-002 Frontend

| Nivel | Estado post sign-off US-001 | Estado post sign-off US-002 |
|-------|-----------------------------|-----------------------------|
| L1 — Tests unitarios backend | ✅ 35/35 PASS | Sin cambio |
| L2 — Funcional API backend | ✅ PASS (análisis estático) | Sin cambio |
| L3 — Seguridad backend | ✅ PASS (14/15 + 1 GAP) | Sin cambio |
| L4 — Accesibilidad WCAG 2.1 AA | ⚠️ PARCIAL — 7 checks ✅ / runtime ⏳ | ⚠️ PARCIAL — 14 checks ✅ / runtime ⏳ |
| L5 — E2E Testcontainers | ⏳ DEFERRED | Sin cambio |
| L6 — E2E Playwright | ⏳ BLOQUEADO | ⏳ Bloqueado hasta US-001..004 completas |

---

## Cobertura del Test Plan — US-002 Frontend

| TC | Título | Evaluable estáticamente | Estado |
|----|--------|------------------------|--------|
| TC-F-007 | Flujo OTP válido → access_token en store | No (requiere backend) | ⏳ Sprint testing |
| TC-F-008 | OTP inválido → error + pre_auth_token conservado | No (requiere backend) | ⏳ Sprint testing |
| TC-F-009 | Recovery code válido → access_token en store | No (requiere backend) | ⏳ Sprint testing |
| TC-F-010 | Cancelar → pre_auth_token limpiado + redirect login | No (requiere runtime) | ⏳ Sprint testing |
| TC-F-011 | Toggle OTP↔RECOVERY limpia estado local | No (requiere runtime) | ⏳ Sprint testing |
| TC-SEC-004 | `access_token` no persiste en localStorage / sessionStorage | Parcial (estático) | ✅ PASS estático |
| TC-SEC-005 | `pre_auth_token` limpiado tras éxito | Código verificado | ✅ PASS estático |
| TC-SEC-006 | Double-submit bloqueado (`exhaustMap`) | Código verificado | ✅ PASS estático |
| TC-ACC-008..014 | Accesibilidad OtpVerificationComponent | Estático ✅ / runtime ⏳ | 14 checks ✅ / runtime ⏳ |

---

## Veredicto

```
✅ APROBADO
```

No hay condiciones pendientes. DEBT-004 (condición heredada de US-001) queda formalmente cerrado en este US-002.

| Checklist | Items | Resultado |
|-----------|-------|-----------|
| NCs CR v1.0 | 3/3 | ✅ PASS |
| Seguridad LLD §6 | 10/10 | ✅ PASS |
| Accesibilidad WCAG 2.1 AA (estático) | 14/14 | ✅ PASS |
| Arquitectura LLD §4 | 9/9 | ✅ PASS |
| DEBT-004 (condición de merge US-001) | — | ✅ CERRADO |

### Condiciones de release (no bloquean US-003..004)
- L4 Accesibilidad runtime (contraste, foco, lectores de pantalla)
- L6 E2E Playwright flujos críticos

### Próximos pasos autorizados
**[Dev Frontend] US-003 → IN PROGRESS: `RecoveryCodesComponent` implementación completa**

---

*Generado por SOFIA QA Tester Agent · BankPortal · Sprint 01 · 2026-03-12*
*Proceso CMMI: VER — Verification · Adjunto a QA Execution Report v3.0*
