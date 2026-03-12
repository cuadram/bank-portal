# QA Sign-off — Frontend US-001: Activar 2FA (Enrolamiento TOTP)
## BankPortal — Banco Meridian | FEAT-001

| Campo               | Valor                                                  |
|---------------------|--------------------------------------------------------|
| **Artefacto**       | QA Sign-off Frontend US-001                            |
| **Proceso CMMI**    | VER — Verification (verificación de work product)      |
| **QA Tester**       | SOFIA Agent — Rol: QA Tester                           |
| **Fecha**           | 2026-03-12                                             |
| **Commit auditado** | `6dd2744` — CR fixes aplicados                         |
| **CR referencia**   | `docs/code-review/CR-FEAT-001-frontend-US001.md` v1.0  |
| **QA Report base**  | `docs/qa/FEAT-001-qa-execution-report.md` v3.0         |
| **Veredicto**       | ✅ APROBADO CON CONDICIÓN                              |

---

## Propósito

Este documento es un sign-off de verificación estática sobre el código de US-001 Frontend
tras el Code Review v1.0. No reemplaza al QA Execution Report v3.0 (backend). Verifica que:

1. Las 8 NCs del CR están correctamente resueltas en el código.
2. El código cumple las reglas de seguridad del LLD §6.
3. Los TCs de accesibilidad verificables estáticamente pasan.
4. La deuda técnica condicionante está registrada.

---

## Checklist 1 — NCs del Code Review (CR v1.0)

| NC | Severidad | Fix esperado | Verificación estática | Estado |
|----|-----------|-------------|----------------------|--------|
| NC-001 | 🔴 Bloqueante | `effect()` en `TwoFactorSetupComponent` observa `pendingQrBase64` antes de navegar | `enrollEffect` en `.component.ts` — confirmado | ✅ PASS |
| NC-002 | 🔴 Bloqueante | `enrollConfirmed` emitido solo cuando `store.status() === 'ENABLED'` | `confirmEffect` + flag `confirmAttempted` — confirmado | ✅ PASS |
| NC-003 | 🟠 Mayor | `isComplete = computed(() => digits().every(d => d !== ''))` | Código corregido en `otp-input.component.ts` — confirmado | ✅ PASS |
| NC-004 | 🟠 Mayor | `aria-labelledby="otp-group-label"` en `bp-otp-input` | `<p id="otp-group-label">` + binding en template — confirmado | ✅ PASS |
| NC-005 | 🟠 Mayor | `exhaustMap` en `confirmEnroll` | Import y uso de `exhaustMap` en `two-factor.store.ts` — confirmado | ✅ PASS |
| NC-006 | 🟠 Mayor | Bandera `confirmAttempted` evita disparo en init | Campo `private confirmAttempted = false` en `qr-enroll.component.ts` — confirmado | ✅ PASS |
| NC-007 | 🟠 Mayor | Eliminado `implements OnDestroy` vacío | Firma del componente sin `OnDestroy` — confirmado | ✅ PASS |
| NC-008 | 🟡 Menor | `autocomplete` dinámico: `one-time-code` solo en index 0 | `[attr.autocomplete]="i === 0 ? 'one-time-code' : 'off'"` — confirmado | ✅ PASS |

**Resultado: 8/8 NCs PASS ✅**

---

## Checklist 2 — Reglas de seguridad LLD §6

| Regla LLD §6 | Implementación esperada | Verificación | Estado |
|--------------|------------------------|--------------|--------|
| `access_token` nunca en localStorage | Solo en NgRx Signal Store (memoria) | No hay referencia a `localStorage.setItem` en ningún archivo auditado | ✅ PASS |
| `pre_auth_token` solo en sessionStorage | `sessionStorage.setItem(environment.preAuthTokenSessionKey, ...)` | Guard y interceptor usan `sessionStorage.getItem()` — store no persiste el token | ✅ PASS |
| `pre_auth_token` limpiado tras uso | Limpiado en `OtpVerificationComponent` (US-002, fuera de scope) | Guard protege la ruta; limpieza delegada a US-002 — aceptable en scope US-001 | ✅ PASS |
| `pendingQrBase64` limpiado al cancelar | `clearPendingEnroll()` → `pendingQrBase64: null` | Llamado en `onCancel()` de `QrEnrollComponent` — confirmado | ✅ PASS |
| `pendingQrUri` limpiado al confirmar | `patchState(store, { pendingQrUri: null, pendingQrBase64: null })` en `confirmEnroll` next | Confirmado en `two-factor.store.ts` tapResponse next | ✅ PASS |
| `pendingRecoveryCodes` limpiado tras mostrar | `clearPendingRecoveryCodes()` disponible | Método presente; limpieza delegada a `RecoveryCodesComponent` (US-003) — correcto en scope | ✅ PASS |
| Header correcto por contexto | `PreAuth` para `/2fa/verify`, `Bearer` para resto | `authInterceptor` aplica lógica condicional — confirmado | ✅ PASS |
| Secreto TOTP no expuesto en UI sin advertencia | `pendingQrUri` en sección `<details>` con aviso de seguridad | Advertencia "No compartas este código" añadida en qr-enroll.html (NC-004 fix) | ✅ PASS |
| `autocomplete="one-time-code"` presente | Solo en primer input OTP | Confirmado (NC-008 fix) — cumple PCI-DSS y WCAG 2.1 | ✅ PASS |
| `access_token` no en URL params | Sin referencias a token en rutas o query params | No encontrado en el código auditado | ✅ PASS |

**Resultado: 10/10 reglas LLD §6 PASS ✅**

---

## Checklist 3 — Accesibilidad WCAG 2.1 AA (análisis estático)

> Los TCs completos (TC-ACC-001..007) permanecen BLOQUEADOS hasta runtime frontend.
> Este checklist verifica los ítems evaluables sin ejecutar el navegador.

| TC | Criterio | Verificación estática | Estado |
|----|----------|-----------------------|--------|
| TC-ACC-001 (parcial) | Botones con `type="button"` — navegables con teclado | Todos los `<button>` tienen `type="button"` — sin submit implícito | ✅ PASS |
| TC-ACC-002 | `bp-otp-input` tiene label accesible | `aria-labelledby="otp-group-label"` en `qr-enroll.html` — `role="group"` + `aria-label` por dígito en `otp-input.html` | ✅ PASS |
| TC-ACC-003 | Mensajes de error con `role="alert"` | `role="alert"` en `<p *ngIf="otpHasError()">` y `<p *ngIf="store.error()">` — confirmado | ✅ PASS |
| TC-ACC-004 (parcial) | `aria-live="polite"` en badges de estado | Badges de estado en `two-factor-setup.html` con `aria-live="polite"` — confirmado | ✅ PASS |
| TC-ACC-005 | `aria-busy="true"` en QR placeholder | `<div *ngIf="!qrSrc" aria-busy="true">` — confirmado | ✅ PASS |
| TC-ACC-006 | `aria-labelledby` en contenedores principales | `role="main"` + `aria-labelledby` en ambos contenedores (setup + enroll) — confirmado | ✅ PASS |
| TC-ACC-007 | Botón deshabilitado con `[disabled]` binding | `[disabled]="store.isLoading()"` en botones de acción — confirmado | ✅ PASS |
| Runtime TC-ACC-001..007 | Contraste, foco visible, lectores de pantalla | ⏳ BLOQUEADO — requiere render en navegador | ⏳ PENDIENTE |

**Resultado estático: 7/7 checks PASS ✅ — Runtime bloqueado hasta sprint de testing E2E**

---

## Checklist 4 — Arquitectura y LLD §4 (estructura Angular)

| Ítem | LLD §4 esperado | Verificación | Estado |
|------|-----------------|--------------|--------|
| Standalone components | `standalone: true` en todos | `TwoFactorSetupComponent`, `QrEnrollComponent`, `OtpInputComponent` — todos standalone | ✅ PASS |
| `ChangeDetectionStrategy.OnPush` | Todos los componentes | Confirmado en los 3 componentes auditados | ✅ PASS |
| Lazy loading | `loadComponent` en routes | `TWO_FACTOR_ROUTES` con `loadComponent` — confirmado | ✅ PASS |
| Modelos tipados | Interfaces para todos los contratos | `enroll.model.ts`, `verify.model.ts`, `recovery-codes.model.ts` presentes y tipados | ✅ PASS |
| Signal Store `providedIn: 'root'` | Store singleton global | `signalStore({ providedIn: 'root' }, ...)` — confirmado | ✅ PASS |
| `twoFactorGuard` correcto | Verificar `pre_auth_token` en sessionStorage | Guard usa `sessionStorage.getItem(environment.preAuthTokenSessionKey)` — sin dependencia del store | ✅ PASS |
| Environments tipados | `apiBaseUrl`, `otpInputLength`, `preAuthTokenSessionKey` | `environment.ts` y `environment.prod.ts` presentes con las 3 variables | ✅ PASS |

**Resultado: 7/7 ítems LLD §4 PASS ✅**

---

## Checklist 5 — Deuda técnica y condiciones de merge

| ID | Descripción | Condición | Estado |
|----|-------------|-----------|--------|
| DEBT-004 | Conectar `getAccessTokenFromMemory()` al `AuthStore` | **Obligatorio antes de merge a `develop`** | ⚠️ ABIERTA |
| RV-002 | `PUBLIC_PATHS` matching robusto en interceptor | Sprint 02 backlog | 📋 Registrada |
| RV-003 | `DELETE /2fa/disable` con body — documentar proxies | Sprint 02 — scope US-004 | 📋 Registrada |
| L4-ACC | TC-ACC-001..007 runtime (contraste, foco, lectores pantalla) | Antes de release a producción | ⏳ Pendiente |
| L6-E2E | TC-E2E-001..005 Playwright | Antes de release a producción | ⏳ Pendiente |

---

## Cobertura del Test Plan — US-001 Frontend

| TC | Título | Evaluable estáticamente | Estado |
|----|--------|------------------------|--------|
| TC-F-001..006 | Funcionales US-001 backend | No (requiere backend activo) | ⏳ QA Execution Report v3.0 |
| TC-ACC-001..007 | Accesibilidad WCAG 2.1 AA | Parcialmente (ver Checklist 3) | 7 checks estáticos ✅ / runtime ⏳ |
| TC-E2E-001 | Flujo completo Angular | No (requiere Playwright) | ⏳ Bloqueado |

---

## Niveles de prueba — estado actualizado post US-001 Frontend

| Nivel | Estado anterior (v3.0) | Estado post sign-off US-001 |
|-------|------------------------|----------------------------|
| L1 — Tests unitarios backend | ✅ 35/35 PASS | Sin cambio |
| L2 — Funcional API backend | ✅ PASS (análisis estático) | Sin cambio |
| L3 — Seguridad backend | ✅ PASS (14/15 + 1 GAP) | Sin cambio |
| L4 — Accesibilidad WCAG 2.1 AA | ⏳ BLOQUEADO | ⚠️ PARCIAL — 7 checks estáticos ✅; runtime ⏳ |
| L5 — E2E Testcontainers | ⏳ DEFERRED | Sin cambio |
| L6 — E2E Playwright | ⏳ BLOQUEADO | ⏳ Bloqueado hasta US-001..004 completas |

---

## Veredicto

```
✅ APROBADO CON CONDICIÓN
```

**US-001 Frontend está verificado y listo para continuar el pipeline.**

### Condición obligatoria antes de merge a `develop`
> **DEBT-004**: `getAccessTokenFromMemory()` en `auth.interceptor.ts` debe conectarse
> al `AuthStore` antes de hacer merge de la feature branch a `develop`. Sin esto,
> los endpoints autenticados (enroll, recovery-codes) no recibirán el Bearer token
> y fallarán en integración.

### Condiciones de release (no bloquean US-002..004)
- L4 Accesibilidad runtime (contraste, foco, lectores de pantalla)
- L6 E2E Playwright flujos críticos

### Próximo paso autorizado
**[Dev Frontend] US-002 → IN PROGRESS: `OtpVerificationComponent` (T-007)**

---

*Generado por SOFIA QA Tester Agent · BankPortal · Sprint 01 · 2026-03-12*
*Proceso CMMI: VER — Verification · Adjunto a QA Execution Report v3.0*
