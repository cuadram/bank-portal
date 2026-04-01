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
| OK | 7 |
| Bug corregido en sesión | 1 |
| Pendiente (Tarjetas) | 1 |
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
- **⚠️ KPIs Ingresos/Gastos/Saldo Neto = 0,00 €**: sin transacciones en el mes en curso (abril 2026)
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
**Causa raíz:** `forkJoin` en `ProfilePageComponent.ngOnInit()` combina 3 observables.
`getNotifications()` → `catchError → EMPTY` → forkJoin nunca emite.
**Fix aplicado:** `catchError → of([])` en `getNotifications()` y `getSessions()`.
**Commit:** `5207961` — rebuild y redeploy frontend completados.
**Estado post-fix:** ✅ Datos cargados correctamente:

| Campo | Valor | Coherencia |
|---|---|---|
| Email | a.delacuadra@nemtec.es | ✅ |
| Teléfono | +34 612 345 678 | ✅ |
| Dirección | Calle Alcalá 42, 3ºB, Madrid 28014 | ✅ |
| Miembro desde | 26/03/2026 | ✅ |
| Notificaciones | Vacío (endpoint 404) | ⚠️ DEBT-043 |
| Sesiones activas | Vacío (endpoint 404) | ⚠️ DEBT-043 |

**⚠️ Bug menor de CSS**: label "Email" se concatena al valor sin separador visual (`Emaila.delacuadra@nemtec.es`)

---

### ✅ Centro de Privacidad — `/privacidad`
- Carga correctamente con datos reales desde BD ✅
- **Mis consentimientos (GDPR Art.7)**:
  - Comunicaciones: ON ✅ (coherente con BD: `activo=true`)
  - Seguridad: ON azul — deshabilitado (siempre activo por regulación) ✅ — RN-F019-10 correcto
  - Analítica: OFF ✅ (coherente con BD: `activo=false`, actualizado 09:45 hoy)
  - Marketing: ON ✅ (coherente con BD: `activo=true`)
- **Descargar mis datos**: botón "Solicitar" + GDPR Art.15 y Art.20 ✅
- **Eliminar mi cuenta**: botón rojo + texto "Datos anonimizados en 30 días · GDPR Art.17" ✅

---

### ⏳ Tarjetas — `/tarjetas`
- No verificada: la sesión expiró durante el intento de navegación a esta ruta.
- Pendiente verificación en sesión separada.

---

## Bugs detectados

### BUG-VER-001 — ✅ CORREGIDO — Mi Perfil skeleton infinito
- **Severidad:** CRÍTICA (funcionalidad core FEAT-019 inaccesible)
- **Causa:** `forkJoin` + `catchError → EMPTY` en `ProfileService.getNotifications/getSessions`
- **Fix:** `catchError → of([])` — commit `5207961`
- **Archivo:** `apps/frontend-portal/src/app/features/profile/services/profile.service.ts`
- **Verificado:** ✅ Mi Perfil carga tras rebuild + hard-refresh

### BUG-VER-002 — 🟡 ABIERTO — Footer versión desactualizada
- **Severidad:** BAJA
- **Descripción:** Footer del login muestra `Sprint 13 · v1.13.0`
- **Causa:** `LoginComponent` (Sprint 13) tiene versión hardcodeada en template
- **Archivo:** `apps/frontend-portal/src/app/features/login/login.component.ts` — línea `dev-notice`
- **Fix:** Actualizar la cadena con la versión real del `environment.ts` o con variable interpolada

### BUG-VER-003 — 🟡 ABIERTO — Dashboard KPIs abril = 0,00 €
- **Severidad:** MEDIA
- **Descripción:** INGRESOS/GASTOS/SALDO NETO del mes = 0,00 € porque no hay transacciones en abril 2026 en la BD del usuario de prueba
- **Causa:** Datos seed cubren hasta marzo 2026 — normal en entorno STG al inicio de mes
- **Fix sugerido:** Añadir transacciones de abril 2026 al seed, o mostrar "Sin datos este mes" en lugar de 0,00 €

---

## Deudas técnicas identificadas

### DEBT-043 — Endpoints /profile/notifications y /profile/sessions no implementados
- **Área:** Backend
- **Prioridad:** Media
- **Descripción:** `GET /api/v1/profile/notifications` y `GET /api/v1/profile/sessions` devuelven 404. El frontend los consume desde `ProfileService` vía `forkJoin`. Los endpoints están documentados en la OpenAPI pero no implementados en `ProfileController`.
- **Impacto:** Secciones "Notificaciones" y "Sesiones activas" en Mi Perfil vacías.
- **Sprint target:** S22
- **Relación:** FEAT-019, SCRUM-106, SCRUM-107

---

## Coherencia backend verificada (llamadas directas)

| Endpoint | Status | Resultado |
|---|---|---|
| GET /actuator/health | 200 | UP ✅ |
| GET /api/v1/profile | 200 | Datos correctos ✅ |
| GET /api/v1/privacy/consents | 200 | 4 consentimientos coherentes ✅ |
| GET /api/v1/profile/notifications | 404 | No implementado ⚠️ |
| GET /api/v1/profile/sessions | 404 | No implementado ⚠️ |
| GET /api/v1/accounts | 200 | 2 cuentas ✅ |
| GET /auth/login | 200 | Autenticación JWT OK ✅ |

---

## Acciones realizadas en sesión

1. ✅ Fix `BUG-VER-001` — `profile.service.ts` — `catchError → of([])`
2. ✅ `docker compose build --no-cache frontend` — imagen `bankportal-frontend-portal:local-dev` rebuilt
3. ✅ `docker compose up -d --no-deps frontend` — contenedor recreado
4. ✅ Commit `5207961` en rama `feature/FEAT-013-sprint15`

---

*Generado por SOFIA Verification Agent · Sprint 21 · v1.21.0 · 2026-04-01*
