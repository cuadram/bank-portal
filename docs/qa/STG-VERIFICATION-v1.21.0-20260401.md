# Informe de Verificación STG — BankPortal v1.21.0
**Fecha:** 2026-04-01
**Entorno:** STG local · Docker Compose · backend:8081 · frontend:4201
**Sprint:** 21 | **Feature:** FEAT-019 — Centro de Privacidad y Gestión de Identidad Digital
**Ejecutado por:** SOFIA QA Verification Agent (Claude in Chrome)
**Usuario de prueba:** a.delacuadra@nemtec.es / Angel@123
**Repositorio activo:** JPA-REAL (PostgreSQL 16)

---

## Resumen ejecutivo

| Secciones verificadas | 9 |
|---|---|
| OK | 8 |
| Bug corregido en sesión | 1 |
| Bugs registrados | 3 (1 corregido, 2 pendientes) |

---

## Verificación por sección

### ✅ Login — `/login`
- Autenticación funciona correctamente con `Angel@123`
- Redirección a `/dashboard` tras login OK
- AuthGuard activo — redirige a `/login` sin token
- **⚠️ INCOHERENCIA BUG-VER-002**: Footer muestra `Sprint 13 · v1.13.0` (hardcodeado en `LoginComponent`)

---

### ⚠️ Dashboard — `/dashboard`
- Carga correctamente con sidebar y gráficos
- **Alerta de presupuesto**: muestra 1.277,59 € de gastos mes anterior ✅
- **⚠️ KPIs Ingresos/Gastos/Saldo Neto = 0,00 €**: sin transacciones en el mes en curso (abril 2026) — BUG-VER-003
- Gráfico "Evolución 6 meses": datos históricos visibles ✅
- Botones PDF/Excel presentes ✅

---

### ✅ Cuentas — `/accounts`
- 2 cuentas cargadas correctamente:
  - **Cuenta Ahorro**: ES76 **** 5766 — saldo 12.500,00 € ✅
  - **Cuenta Corriente**: ES91 **** 1332 — saldo 8.799,89 € ✅
- **Saldo total**: 21.299,89 € — coherente con la suma ✅
- Número de cuentas: 2 ✅

---

### ✅ Movimientos — `/accounts/{id}/transactions`
- 13 movimientos cargados ✅
- Transacciones recientes (feb-mar 2026): NOMINA EMPRESA SL, COMPRA MERCADONA, ALQUILER PISO MARZO... ✅
- Categorías visibles: NOMINA, ALIMENTACION, HOGAR, SUMINISTROS, OCIO, TRANSPORTE, COMPRAS ✅
- Saldos progresivos coherentes ✅
- Filtros DESDE/HASTA, TIPO, BUSCAR CONCEPTO disponibles ✅

---

### ✅ Tarjetas — `/cards` [VERIFICADO EN SESIÓN 2]
- **3 tarjetas cargadas** desde backend (`GET /api/v1/cards` → 200) ✅
- Datos coherentes UI ↔ backend:

| Tarjeta | Tipo | Estado | Vencimiento | Límite diario | Límite mensual |
|---|---|---|---|---|---|
| **** 4521 | DÉBITO | Activa | 2028-12-31 | 600 € | 3.000 € |
| **** 8834 | CRÉDITO | Activa | 2027-06-30 | 1.500 € | 5.000 € |
| **** 2267 | DÉBITO | **Bloqueada** | 2026-09-30 | 300 € | 1.500 € |

- **Detalle de tarjeta** (`/cards/{id}`) carga correctamente ✅
- Acciones disponibles en detalle: **Límites**, **Cambiar PIN**, **Bloquear** ✅
- Información de cuenta asociada visible ✅
- **⚠️ Incoherencia menor**: `accountId = acc00000-0000-0000-0000-000000000001` — UUID patrón mock seed, no UUID real del usuario a.delacuadra@nemtec.es

---

### ✅ Domiciliaciones — `/direct-debits`
- 6 mandatos SEPA cargados: 5 activos, 1 cancelada ✅
- KPIs: ACTIVAS=5, CANCELADAS=1, TOTAL=6 ✅
- Acreedores: Mapfre Seguros, Movistar, Endesa, Canal Isabel II, Netflix, Gym Holmes Place ✅
- IBANs y referencias BNK-A1B2C3 coherentes ✅
- Botón "+ Nueva domiciliación" visible ✅

---

### ✅ Exportación — `/export`
- Formulario completo: selector de cuenta, rango de fechas, tipo de movimiento ✅
- Subtítulo: "Máx. 12 meses · Máx. 500 registros (PSD2 Art.47)" — cumplimiento normativo ✅
- Botones "Descargar PDF" y "Descargar CSV" visibles ✅
- Fechas por defecto: 01/03/2026 → 01/04/2026 ✅

---

### ✅ Mi Perfil — `/perfil` [BUG CORREGIDO EN SESIÓN]
**Estado inicial:** ❌ Skeleton infinito — pantalla en blanco
**Causa raíz:** `forkJoin` + `catchError → EMPTY` en `ProfileService.getNotifications/getSessions`
**Fix aplicado:** `catchError → of([])` — commit `5207961`
**Estado post-fix:** ✅ Datos cargados correctamente:

| Campo | Valor | Coherencia |
|---|---|---|
| Email | a.delacuadra@nemtec.es | ✅ |
| Teléfono | +34 612 345 678 | ✅ |
| Dirección | Calle Alcalá 42, 3ºB, Madrid 28014 | ✅ |
| Miembro desde | 26/03/2026 | ✅ |
| Notificaciones | Vacío (endpoint 404) | ⚠️ DEBT-043 |
| Sesiones activas | Vacío (endpoint 404) | ⚠️ DEBT-043 |

**⚠️ Bug menor CSS**: label "Email" se concatena al valor — `Emaila.delacuadra@nemtec.es`

---

### ✅ Centro de Privacidad — `/privacidad`
- **Mis consentimientos (GDPR Art.7)**:
  - Comunicaciones: ON ✅ (BD: `activo=true`)
  - Seguridad: ON azul deshabilitado (siempre activo por regulación) ✅ — RN-F019-10
  - Analítica: OFF ✅ (BD: `activo=false`)
  - Marketing: ON ✅ (BD: `activo=true`)
- **Descargar mis datos**: GDPR Art.15 y Art.20 ✅
- **Eliminar mi cuenta**: 30 días anonimización · GDPR Art.17 ✅

---

## Bugs detectados

### BUG-VER-001 — ✅ CORREGIDO — Mi Perfil skeleton infinito
- **Severidad:** CRÍTICA | **Fix:** `catchError → of([])` | **Commit:** `5207961`
- `forkJoin` + `EMPTY` = observable nunca emite → skeleton eterno

### BUG-VER-002 — 🟡 ABIERTO — Footer versión desactualizada
- **Severidad:** BAJA | **Target:** S22
- `LoginComponent` hardcodea `Sprint 13 · v1.13.0` — pendiente actualización

### BUG-VER-003 — 🟡 ABIERTO — Dashboard KPIs abril = 0,00 €
- **Severidad:** MEDIA | **Target:** S22
- Sin transacciones en abril 2026 en BD seed — añadir datos o mostrar estado vacío explícito

---

## Deudas técnicas identificadas

### DEBT-043 — Endpoints /profile/notifications y /profile/sessions (404)
- **Área:** Backend | **Prioridad:** Media | **Sprint target:** S22
- `ProfileController` no implementa `GET /notifications` ni `GET /sessions`
- Impacto: secciones Notificaciones y Sesiones activas en Mi Perfil vacías

---

## Coherencia backend verificada

| Endpoint | Status | Resultado |
|---|---|---|
| GET /actuator/health | 200 | UP ✅ |
| GET /api/v1/profile | 200 | Datos correctos ✅ |
| GET /api/v1/cards | 200 | 3 tarjetas coherentes ✅ |
| GET /api/v1/cards/{id} | 200 | Detalle + límites ✅ |
| GET /api/v1/privacy/consents | 200 | 4 consentimientos ✅ |
| GET /api/v1/accounts | 200 | 2 cuentas ✅ |
| GET /auth/login | 200 | JWT OK ✅ |
| GET /api/v1/profile/notifications | 404 | No implementado ⚠️ |
| GET /api/v1/profile/sessions | 404 | No implementado ⚠️ |

---

## Acciones realizadas en sesión

1. ✅ Fix `BUG-VER-001` — `profile.service.ts` — commit `5207961`
2. ✅ `docker compose build --no-cache frontend` + redeploy — imagen rebuilt
3. ✅ Commit `a483fbf` — informe + DEBT-043 + LA-STG-001
4. ✅ Tarjetas verificadas — 3 tarjetas, detalle y acciones OK

---

*Generado por SOFIA Verification Agent · Sprint 21 · v1.21.0 · 2026-04-01 · VERIFICACIÓN COMPLETA*
