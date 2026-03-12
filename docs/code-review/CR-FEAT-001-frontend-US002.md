# CR-FEAT-001-FRONTEND-US002 — Code Review Frontend US-002
## BankPortal — Banco Meridian | FEAT-001 Autenticación 2FA

| Campo              | Valor                                                          |
|--------------------|----------------------------------------------------------------|
| **Artefacto**      | US-002 Frontend — Verificar OTP en flujo de login             |
| **Rama**           | `feature/FEAT-001-autenticacion-2fa`                           |
| **Revisor**        | SOFIA Agent — Rol: Code Reviewer                               |
| **Fecha revisión** | 2026-03-12                                                     |
| **Versión CR**     | v1.0 — Revisión inicial + fixes aplicados                      |
| **Commit base**    | `06d4528` (Dev Frontend US-002)                                |
| **Commit fixes**   | ver commit post-CR                                             |
| **Veredicto**      | ✅ APROBADO — 3 NCs resueltas (0 bloqueantes), 2 RVs          |

---

## 1. Alcance de la Revisión

| Archivo | Cambio |
|---------|--------|
| `store/two-factor.store.ts` | `accessToken` en estado + `verifyLogin` + `clearSession` |
| `core/interceptors/auth.interceptor.ts` | DEBT-004 resuelto — `inject(TwoFactorStore)` |
| `components/otp-verification/otp-verification.component.ts` | Nuevo |
| `components/otp-verification/otp-verification.component.html` | Nuevo |
| `two-factor.routes.ts` | `OTP_VERIFY_ROUTES` exportado |

---

## 2. Resumen Ejecutivo

US-002 presenta arquitectura correcta y coherente con los patrones establecidos en US-001: `exhaustMap` para OTP de un solo uso, `effect()` reactivo con bandera `verifyAttempted`, cleanup de `pre_auth_token` en el store (no en el componente), DEBT-004 resuelto con `inject()` en closure funcional. Se detectaron **0 NCs bloqueantes**, **1 NC mayor** (UX cursor en recovery input) y **2 NCs menores** (ARIA semántico). Todas corregidas en esta sesión. Código **APROBADO**.

---

## 3. No Conformidades

### 3.1 NC-001 🟠 MAYOR — `toUpperCase()` en handler: cursor al final del input

| Campo | Detalle |
|-------|---------|
| **Archivo** | `otp-verification.component.ts` / `.html` |
| **Severidad** | Mayor |
| **Estado** | ✅ Corregida |

**Descripción:**

`onRecoveryChange()` aplicaba `.toUpperCase()` al valor capturado y lo almacenaba en el signal, mientras que el template tenía `[value]="recoveryValue()"` (input controlado).

Con `ChangeDetectionStrategy.OnPush`, cuando el signal cambia Angular programa una actualización del DOM para el siguiente ciclo de Change Detection. Al actualizar `input.value` programáticamente, el navegador mueve el cursor al final del campo. En un campo de texto con entrada libre, el usuario que escriba letras minúsculas sufre que su cursor "salta" al final tras cada keystroke.

En un entorno bancario (PCI-DSS) donde el UX de inputs de autenticación debe ser impecable, este comportamiento es inaceptable.

**Fix aplicado:**

```typescript
// ANTES (problemático):
onRecoveryChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  this.recoveryValue.set(value.trim().toUpperCase()); // ← transforma + actualiza DOM
}

// DESPUÉS (correcto):
onRecoveryChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  this.recoveryValue.set(value); // ← almacena tal cual, sin transformar
}

onVerify(): void {
  // ...
  const code = this.recoveryValue().trim().toUpperCase(); // ← normaliza al enviar
}
```

**En el template:** eliminado `[value]="recoveryValue()"` — el input queda no controlado para este campo. El CSS `text-transform: uppercase` provee el feedback visual sin afectar el cursor.

---

### 3.2 NC-002 🟡 MENOR — `<main role="main">`: rol implícito redundante

| Campo | Detalle |
|-------|---------|
| **Archivo** | `otp-verification.component.html` |
| **Severidad** | Menor |
| **Estado** | ✅ Corregida |

**Descripción:** El elemento HTML `<main>` tiene rol ARIA implícito `main` (ARIA specification §3.2.1 y HTML-AAM). Añadir `role="main"` explícitamente es redundante. Herramientas de auditoría ARIA (axe DevTools, Lighthouse) reportan esto como `aria-allowed-role` warning. Algunos AT pueden anunciar el rol dos veces.

**Fix aplicado:** Eliminado `role="main"` del elemento `<main>`.

---

### 3.3 NC-003 🟡 MENOR — `aria-busy="true"` en `<span>` de texto

| Campo | Detalle |
|-------|---------|
| **Archivo** | `otp-verification.component.html` |
| **Severidad** | Menor |
| **Estado** | ✅ Corregida |

**Descripción:** `aria-busy` aplicado a un `<span>` de texto presentacional. Según ARIA specification §6.6.2, `aria-busy` debe aplicarse al contenedor cuyo contenido está siendo actualizado de forma asíncrona, no a elementos de texto dentro de él. En un `<span>` que aparece/desaparece vía `*ngIf`, `aria-busy` no aporta semántica correcta; el AT recibe el contenido del span al aparecer en el DOM independientemente.

**Fix aplicado:** `[attr.aria-busy]="store.isLoading()"` movido al `<button>` padre. El botón es el elemento interactivo cuyo estado cambia durante la carga — es semánticamente correcto indicar que está "ocupado" procesando. El `<span>` interior mantiene `aria-live="polite"` para anunciar el cambio de texto.

```html
<!-- ANTES -->
<button type="button" ...>
  <span *ngIf="store.isLoading()" aria-live="polite" aria-busy="true">Verificando…</span>
</button>

<!-- DESPUÉS -->
<button type="button" [attr.aria-busy]="store.isLoading()" ...>
  <span *ngIf="store.isLoading()" aria-live="polite">Verificando…</span>
</button>
```

---

## 4. Recomendaciones (sin bloquear aprobación)

### RV-001 — Testing del interceptor con `inject(TwoFactorStore)`

| Campo | Detalle |
|-------|---------|
| **Archivo** | `core/interceptors/auth.interceptor.ts` |
| **Prioridad** | Alta — documentar antes de escribir tests |

El patrón `inject(TwoFactorStore)` dentro de `HttpInterceptorFn` es correcto en runtime (Angular 17+ resuelve el injection context de cada request de forma perezosa). Sin embargo, en Angular TestBed los tests del interceptor deben configurarse así:

```typescript
TestBed.configureTestingModule({
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideHttpClientTesting(),
    // Mock del store necesario:
    { provide: TwoFactorStore, useValue: { accessToken: signal(null) } }
  ]
});
```

Sin el mock del store, `inject(TwoFactorStore)` fallará en el contexto de test con `NullInjectorError`. Documentar en el test plan de Sprint 02.

### RV-002 — `store` público en `OtpVerificationComponent`

| Campo | Detalle |
|-------|---------|
| **Archivo** | `otp-verification.component.ts` |
| **Prioridad** | Baja |

`readonly store = inject(TwoFactorStore)` expone toda la API del store al template y a consumidores externos del componente. Patrón aceptable para proyectos Angular con Signal Store, pero la práctica recomendada es exponer solo las señales necesarias como propiedades computed del componente:

```typescript
// Más encapsulado:
protected readonly isLoading = this.store.isLoading;
protected readonly error = this.store.error;
protected readonly accessToken = this.store.accessToken;
```

Bajo scope del Sprint 02 junto con el refactor general de exposición de stores.

---

## 5. Análisis de Seguridad (LLD §6)

| Regla | Implementación | Estado |
|-------|---------------|--------|
| `access_token` solo en memoria | `patchState(store, { accessToken: res.access_token })` — nunca `localStorage` | ✅ |
| `pre_auth_token` limpiado tras éxito | `sessionStorage.removeItem()` en `tapResponse.next` del store | ✅ |
| `pre_auth_token` limpiado en cancelar | `store.clearSession()` → `sessionStorage.removeItem()` | ✅ |
| `pre_auth_token` conservado en error | Path de error no llama `removeItem` — reintentos posibles dentro del TTL | ✅ |
| Header correcto para `/2fa/verify` | Interceptor: `PreAuth` si `pre_auth_token` presente + URL contiene `/2fa/verify` | ✅ |
| `exhaustMap` en `verifyLogin` | OTP de un solo uso — no hay doble submit posible | ✅ |
| Guard protege la ruta | `twoFactorGuard` en `OTP_VERIFY_ROUTES` | ✅ |

---

## 6. Hallazgos Positivos

- **`verifyAttempted` bandera**: patrón consistente con `confirmAttempted` de US-001. Previene disparo del effect en init si el store ya tiene `accessToken`.
- **`ngOnDestroy` justificado**: a diferencia de US-001 NC-007, aquí hay lógica real (`store.clearError()`). El `implements OnDestroy` es correcto.
- **`clearSession()` en el store**: la limpieza del `pre_auth_token` ocurre en el store, no en el componente. Garantiza que no se olvide en ningún path de código del componente.
- **Modo RECOVERY bien integrado**: toggle de modo limpia todos los estados locales y el error global del store — sin contaminación entre modos.
- **`OTP_VERIFY_ROUTES` con guard**: la ruta está correctamente protegida y documentada con instrucciones de montaje en `app.routes.ts`.
- **DEBT-004 resuelto**: `inject(TwoFactorStore)` en el closure del interceptor es el patrón correcto para Angular 17+ `HttpInterceptorFn`.

---

## 7. Veredicto Final

```
✅ APROBADO
```

| NC | Severidad | Estado |
|----|-----------|--------|
| NC-001 | 🟠 Mayor | ✅ Corregida |
| NC-002 | 🟡 Menor | ✅ Corregida |
| NC-003 | 🟡 Menor | ✅ Corregida |

**Siguiente paso:** QA Sign-off US-002 → US-003 IN PROGRESS (`RecoveryCodesComponent`).

---

*Generado por SOFIA Code Reviewer Agent · BankPortal · Sprint 01 · 2026-03-12*
