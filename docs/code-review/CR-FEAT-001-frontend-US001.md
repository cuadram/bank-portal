# CR-FEAT-001-FRONTEND-US001 — Code Review Frontend US-001
## BankPortal — Banco Meridian | FEAT-001 Autenticación 2FA

| Campo              | Valor                                               |
|--------------------|-----------------------------------------------------|
| **Artefacto**      | US-001 Frontend — Activar 2FA (enrolamiento TOTP)   |
| **Rama**           | `feature/FEAT-001-autenticacion-2fa`                |
| **Revisor**        | SOFIA Agent — Rol: Code Reviewer                    |
| **Fecha revisión** | 2026-03-12                                          |
| **Versión CR**     | v1.0 — Revisión inicial + fixes aplicados           |
| **Veredicto**      | ✅ APROBADO — 8 NCs resueltas, 3 RVs registradas   |

---

## 1. Alcance de la Revisión

Archivos revisados en el commit `4b86c14`:

| Archivo | Componente |
|---------|-----------|
| `store/two-factor.store.ts` | NgRx Signal Store |
| `services/two-factor.service.ts` | HTTP Client |
| `models/enroll.model.ts` | Modelos US-001 |
| `models/verify.model.ts` | Modelos US-002 |
| `models/recovery-codes.model.ts` | Modelos US-003 |
| `components/two-factor-setup/two-factor-setup.component.ts/html` | Contenedor 2FA |
| `components/two-factor-setup/qr-enroll/qr-enroll.component.ts/html` | QR + OTP confirm |
| `shared/components/otp-input/otp-input.component.ts/html` | Componente OTP |
| `core/guards/two-factor.guard.ts` | Guard pre_auth |
| `core/interceptors/auth.interceptor.ts` | Interceptor JWT/PreAuth |
| `two-factor.routes.ts` | Lazy routes |
| `environments/environment.ts` | Variables de entorno |

---

## 2. Resumen Ejecutivo

El código de US-001 presenta una arquitectura correcta: standalone components, NgRx Signal Store, `ChangeDetectionStrategy.OnPush`, lazy loading y cumplimiento general de las reglas de seguridad del LLD §6. Se detectaron **2 NCs bloqueantes** de lógica asíncrona, **5 NCs mayores** (corrección de computed signal, accesibilidad WCAG, manejo de efectos y gestión de operadores RxJS) y **1 NC menor** de especificación HTML. Todas fueron corregidas en esta sesma sesión de revisión. El código queda APROBADO para continuar con US-002.

---

## 3. No Conformidades — Catálogo Completo

### 3.1 NC-001 🔴 BLOQUEANTE — Navegación prematura en `onActivate2FA()`

| Campo | Detalle |
|-------|---------|
| **Archivo** | `two-factor-setup.component.ts` |
| **Severidad** | Bloqueante |
| **Estado** | ✅ Corregida |

**Descripción:** `onActivate2FA()` llamaba a `store.startEnroll()` y acto seguido ejecutaba `currentView.set('QR_ENROLL')` de forma síncrona, antes de que el backend devolviera el QR. El usuario veía la vista QR vacía durante la llamada HTTP. Si el backend fallaba (500, timeout, red), la vista QR quedaba visible con `qrSrc = ''` sin mensaje de error, requiriendo navegación manual para salir.

**Fix aplicado:** Se eliminó `currentView.set('QR_ENROLL')` de `onActivate2FA()`. Se añadió un `effect()` reactivo que observa `store.pendingQrBase64()` y navega a `QR_ENROLL` únicamente cuando el store confirma que el backend devolvió el QR. Si el backend falla, el error queda visible en la vista `STATUS`.

---

### 3.2 NC-002 🔴 BLOQUEANTE — Emisión prematura de `enrollConfirmed`

| Campo | Detalle |
|-------|---------|
| **Archivo** | `qr-enroll.component.ts` |
| **Severidad** | Bloqueante |
| **Estado** | ✅ Corregida (ver también NC-006) |

**Descripción:** `onConfirm()` llamaba `this.store.confirmEnroll(otp)` y en la línea siguiente emitía `this.enrollConfirmed.emit()` de forma síncrona. `confirmEnroll` es un método `rxMethod` asíncrono (HTTP POST al backend). En caso de OTP inválido o error de red, la aplicación navegaba a `/security/2fa/recovery-codes` aunque el backend hubiera rechazado la confirmación.

**Fix aplicado:** Se eliminó el `emit()` síncrono. Se implementó un `effect()` que observa `store.status() === 'ENABLED' && !store.isLoading()`. La navegación ocurre únicamente cuando el store refleja el estado exitoso confirmado por el backend.

---

### 3.3 NC-003 🟠 MAYOR — `isComplete` computed incorrecto en `OtpInputComponent`

| Campo | Detalle |
|-------|---------|
| **Archivo** | `otp-input.component.ts` |
| **Severidad** | Mayor |
| **Estado** | ✅ Corregida |

**Descripción:** La señal computed original era:
```typescript
readonly isComplete = computed(() =>
  this.currentOtp().length === this.length &&
  this.digits().every(d => d !== '')
);
```
La condición `currentOtp().length === this.length` siempre es `true` porque `currentOtp()` es `digits().join('')` y el array tiene siempre `length` slots (incluidos los vacíos `''`). La expresión `['1','','','','',''].join('')` produce `'1'` con `length = 1`, no `6` — por lo tanto la condición no era redundante, pero la lógica completa era correcta solo para el caso degenerado. La expresión real hacía que la validación dependiera únicamente de `every(d => d !== '')`, que es la condición suficiente y necesaria.

**Adicionalmente:** El getter `indices` creaba un nuevo `Array` en cada ciclo de detección de cambios (cada keystroke).

**Fix aplicado:**
```typescript
// Antes (redundante / potencialmente confuso):
readonly isComplete = computed(() =>
  this.currentOtp().length === this.length &&
  this.digits().every(d => d !== '')
);

// Después (correcto y suficiente):
readonly isComplete = computed(() => this.digits().every(d => d !== ''));

// indices: de getter a propiedad readonly (calculada una sola vez):
readonly indices: number[] = Array.from({ length: this.length }, (_, i) => i);
```

---

### 3.4 NC-004 🟠 MAYOR — `label` sin asociación semántica en `qr-enroll` (WCAG 2.1 SC 1.3.1)

| Campo | Detalle |
|-------|---------|
| **Archivo** | `qr-enroll.component.html` |
| **Severidad** | Mayor |
| **Estado** | ✅ Corregida |

**Descripción:** El texto "Introduce el código de verificación" estaba en un `<label>` sin atributo `for`, sin `aria-labelledby` y sin asociación semántica al grupo de inputs OTP. Los lectores de pantalla no podían relacionar la etiqueta con el control.

**Fix aplicado:** El `<label>` fue reemplazado por `<p id="otp-group-label">`. El componente `<bp-otp-input>` recibe `aria-labelledby="otp-group-label"`. El `role="group"` ya presente en el template interno del componente proporciona la semántica correcta.

**Adicionalmente:** Se añadió advertencia visible cuando el usuario expande la sección de configuración manual (el URI otpauth contiene el secreto TOTP).

---

### 3.5 NC-005 🟠 MAYOR — `confirmEnroll` usa `switchMap` — debe ser `exhaustMap`

| Campo | Detalle |
|-------|---------|
| **Archivo** | `two-factor.store.ts` |
| **Severidad** | Mayor |
| **Estado** | ✅ Corregida |

**Descripción:** `confirmEnroll` usaba `switchMap`, que cancela la suscripción activa si llega una nueva emisión. Los OTP TOTP son de **un solo uso** (RFC 6238 §5.2). Si el usuario hace doble-click en "Confirmar activación", `switchMap` cancela la primera petición HTTP (a nivel de Observable), pero el backend puede haberla recibido y procesado ya (OTP validado y marcado como usado). La segunda petición llega con el mismo OTP ya consumido → backend devuelve 401/422. La UX muestra error aunque la primera llamada fue exitosa.

**Fix aplicado:** `switchMap` → `exhaustMap`. Con `exhaustMap`, las emisiones subsiguientes son ignoradas mientras hay una petición HTTP en vuelo, garantizando que solo se envía una confirmación por ventana TOTP.

```typescript
// Antes:
switchMap((otp) => svc.confirmEnroll(otp).pipe(...))

// Después:
exhaustMap((otp) => svc.confirmEnroll(otp).pipe(...))
```

---

### 3.6 NC-006 🟠 MAYOR — `confirmEffect` se dispara en inicialización si `status` ya es `ENABLED`

| Campo | Detalle |
|-------|---------|
| **Archivo** | `qr-enroll.component.ts` |
| **Severidad** | Mayor |
| **Estado** | ✅ Corregida |

**Descripción:** El `effect()` que observa `store.status() === 'ENABLED'` ejecuta su función de setup al inicializar el componente y evalúa el estado actual del store. Si el usuario navega al componente `QrEnrollComponent` cuando el store global ya tiene `status = 'ENABLED'` (caso: F5 parcial, navegación back/forward), el effect emitía `enrollConfirmed` inmediatamente sin que el usuario hubiera intentado confirmar nada.

**Fix aplicado:** Se introduce la bandera de instancia `private confirmAttempted = false`. El effect solo emite cuando `confirmAttempted === true`, que se activa exclusivamente en `onConfirm()`. Se resetea a `false` en `onCancel()`.

---

### 3.7 NC-007 🟠 MAYOR — `implements OnDestroy` con `ngOnDestroy` vacío (misleading)

| Campo | Detalle |
|-------|---------|
| **Archivo** | `two-factor-setup.component.ts` |
| **Severidad** | Mayor |
| **Estado** | ✅ Corregida |

**Descripción:** El componente declaraba `implements OnDestroy` con un `ngOnDestroy()` vacío y un comentario explicando que "el effect se destruye automáticamente". La declaración del interface sin implementación real crea un contrato falso: cualquier desarrollador que lea el código asume que hay lógica de cleanup. Es un anti-patrón de documentación.

**Fix aplicado:** Eliminados `OnDestroy` del import, `implements OnDestroy` de la firma y `ngOnDestroy()`. El comentario de justificación se trasladó al bloque del `effect()`.

---

### 3.8 NC-008 🟡 MENOR — `autocomplete="one-time-code"` en los 6 inputs

| Campo | Detalle |
|-------|---------|
| **Archivo** | `otp-input.component.html` |
| **Severidad** | Menor |
| **Estado** | ✅ Corregida |

**Descripción:** El atributo `autocomplete="one-time-code"` estaba aplicado estáticamente a los 6 inputs individuales. Según el HTML Living Standard §4.10.18.7 y la especificación WHATWG, `one-time-code` identifica el campo destinatario del código completo. En implementaciones multi-slot, Chrome y Safari intentan autocompletar cada campo individualmente con el código de 6 dígitos, produciendo resultados no deterministas.

**Fix aplicado:** Binding dinámico `[attr.autocomplete]="i === 0 ? 'one-time-code' : 'off'"`. Solo el primer slot declara `one-time-code`; los restantes declaran `off` explícitamente.

---

## 4. Recomendaciones (sin bloquear aprobación)

### RV-001 — `getAccessTokenFromMemory()` en interceptor: riesgo de integración

| Campo | Detalle |
|-------|---------|
| **Archivo** | `core/interceptors/auth.interceptor.ts` |
| **Prioridad** | Alta — resolver antes de integración con AuthStore |

El stub retorna `null` siempre. Los endpoints `/2fa/enroll` y `/2fa/recovery-codes/*` requieren autenticación Bearer. En la integración con `AuthStore` (fuera de scope US-001), el interceptor debe inyectar el token correctamente. **Registrar como DEBT-004** en el backlog.

> **Nota técnica:** La función `getAccessTokenFromMemory()` usa un `inject()` comentado. Cuando se implemente, debe usarse el patrón `HttpInterceptorFn` con inyección a nivel del closure (`inject(AuthStore)` en el scope de la función interceptor), no dentro de la función anidada.

### RV-002 — `PUBLIC_PATHS` basado en `req.url.includes()`: frágil

| Campo | Detalle |
|-------|---------|
| **Archivo** | `core/interceptors/auth.interceptor.ts` |
| **Prioridad** | Media |

`req.url.includes('/auth/login')` podría coincidir con URLs no previstas (p.ej. `/admin/auth/login-history`). Mejor usar una comparación exacta contra `req.url.startsWith(environment.apiBaseUrl + '/auth/')` o una lista de rutas completas con regex.

### RV-003 — `DELETE /2fa/disable` con body: documentar restricción de proxies

| Campo | Detalle |
|-------|---------|
| **Archivo** | `services/two-factor.service.ts` |
| **Prioridad** | Baja |

`http.delete()` con `body` es HTTP semánticamente válido (RFC 7231 §4.3.5), pero algunos proxies corporativos y WAFs descartan el body de peticiones DELETE. Si Banco Meridian tiene proxies intermedios, considerar migrar a `POST /2fa/disable` para esta operación en US-004.

---

## 5. Hallazgos Positivos

- **Arquitectura correcta:** standalone components, lazy routing, Signal Store — todo alineado con LLD §4.
- **Seguridad LLD §6 cumplida:** `access_token` solo en memoria, `pre_auth_token` solo en sessionStorage, `pendingQrBase64` limpiado en `clearPendingEnroll()`.
- **`ChangeDetectionStrategy.OnPush`** aplicado consistentemente en los 3 componentes.
- **`exhaustMap`** (tras fix) previene race conditions en operación crítica de OTP.
- **`twoFactorGuard`** correcto: verifica sessionStorage sin importar el store, evitando dependencia circular.
- **Modelos tipados** con interfaces explícitas — alineados al contrato LLD-backend §6.
- **Accesibilidad base sólida:** `role="group"`, `aria-label` por dígito, `aria-live="polite"` en badges de estado, `role="alert"` en errores.

---

## 6. Deuda Técnica Registrada

| ID | Descripción | Sprint objetivo |
|----|-------------|-----------------|
| DEBT-004 | Conectar `getAccessTokenFromMemory()` al `AuthStore` cuando esté disponible | Sprint 02 |
| RV-002 | Refactorizar `PUBLIC_PATHS` en interceptor con matching robusto | Sprint 02 |

---

## 7. Veredicto Final

```
✅ APROBADO
```

| NC | Severidad | Estado |
|----|-----------|--------|
| NC-001 | 🔴 Bloqueante | ✅ Corregida |
| NC-002 | 🔴 Bloqueante | ✅ Corregida |
| NC-003 | 🟠 Mayor | ✅ Corregida |
| NC-004 | 🟠 Mayor | ✅ Corregida |
| NC-005 | 🟠 Mayor | ✅ Corregida |
| NC-006 | 🟠 Mayor | ✅ Corregida |
| NC-007 | 🟠 Mayor | ✅ Corregida |
| NC-008 | 🟡 Menor | ✅ Corregida |

**Condición:** DEBT-004 debe completarse antes del merge a `develop`. RV-002 y RV-003 son backlog del Sprint 02.

**Siguiente paso:** QA Tester — Sign-off frontend US-001 → US-002 IN PROGRESS.
