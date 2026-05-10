# Release Notes — v1.26.0 · BankPortal · Banco Meridian

## Metadata

| Campo | Valor |
|---|---|
| **Fecha release** | 2026-05-08 |
| **Sprint** | 26 · FEAT-024 Objetivos de Ahorro ("Mis Metas") |
| **Servicios** | bankportal-backend · bankportal-frontend |
| **Release Manager** | DevOps Agent (G-7 APROBADO HITL-DV 2026-05-10) |
| **Release anterior** | v1.25.0 (Mi Dinero PFM · Sprint 25) |

---

## Nueva funcionalidad — FEAT-024: Objetivos de Ahorro

BankPortal incorpora el módulo de objetivos de ahorro nativo, dando el siguiente paso tras FEAT-023 (PFM): pasa de **entender** los gastos a **actuar** sobre el ahorro. Transforma el residuo pasivo de cuenta en dinero con propósito, mediante metas concretas, aportaciones manuales y automáticas, hitos celebrables y proyección de cumplimiento. Cierra la narrativa "banca inteligente" iniciada en S25 y refuerza el posicionamiento competitivo frente a N26, Revolut y Monzo.

**US-024-01 — Crear objetivo de ahorro**
El cliente puede crear hasta 10 objetivos activos simultáneos con título, importe objetivo (1 — 1.000.000 €), fecha límite (futura, máx 10 años), categoría (VIAJE, HOGAR, EMERGENCIA, EDUCACION, OTROS) e icono. La cuenta origen debe ser ahorro propia. La creación es atómica: si la reserva inicial falla, el objetivo no se persiste.

**US-024-02 — Listar objetivos con progreso y proyección**
Vista paginada con barra de progreso por objetivo, importe acumulado vs objetivo, fecha proyectada de cumplimiento (basada en histórico de aportaciones), filtro por estado (ACTIVE, PAUSED, ACHIEVED, CLOSED) y ordenación por fecha límite o porcentaje completado.

**US-024-03 — Detalle de objetivo con histórico**
Pantalla de detalle con timeline de aportaciones (manuales y automáticas), hitos alcanzados (25/50/75/100 %), regla automática activa si existe, estado de la reserva virtual sobre cuenta ahorro y acciones contextuales (aportar, editar, pausar, cerrar).

**US-024-04 — Aportación manual a objetivo**
El cliente puede aportar desde cualquier cuenta propia (no solo la cuenta origen del objetivo) en cualquier momento, importe entre 1 € y saldo disponible. La aportación reserva fondos en la cuenta seleccionada (decrementa availableBalance, NO ledgerBalance — ADR-040) y los acumula en `goal.reservedAmount`. El backend usa `@Version` con retry optimista (3 intentos, jitter exponencial); si los retries agotan, devuelve `409 CONCURRENCY_CONFLICT` y el frontend reintenta una vez con backoff antes de mostrar mensaje al usuario (DR-S26-007 / RN-F024-16).

**US-024-05 — Aportación automática mensual**
El cliente puede configurar una regla `AutoRule` (importe fijo, día del mes 1-28, cuenta origen) que reutiliza el motor de schedules de FEAT-015. Ejecución idempotente en el día configurado vía ShedLock; el sistema reintenta la aportación al día siguiente si la primera ejecución falla por saldo insuficiente, hasta 3 reintentos. La regla se puede pausar y reanudar sin perder configuración.

**US-024-06 — Editar / pausar / cerrar objetivo con devolución**
Edición del título, importe, fecha límite, categoría e icono mientras el objetivo esté ACTIVE o PAUSED. Cerrar el objetivo libera la reserva en la cuenta origen original (devolución a availableBalance), genera un movimiento ABONO trazable, persiste el cierre con motivo (ACHIEVED, MANUALLY_CLOSED) y archiva el histórico de aportaciones. Operaciones de cierre con devolución superior a 30 € requieren OTP (SCA PSD2).

**US-024-07 — Alertas push de hitos**
Notificaciones push automáticas al alcanzar 25 %, 50 %, 75 % y 100 % de la meta. Reutiliza la infraestructura VAPID (FEAT-014) e integra en el centro de notificaciones (FEAT-004). Una sola alerta por hito y objetivo (deduplicación). Acción de navegación al detalle del objetivo.

**US-024-08 — Widget "Mi ahorro del mes" en dashboard**
Widget asíncrono con gasto total ahorrado el mes en curso, top-3 objetivos por progreso reciente, semáforo global (% del importe acumulado vs proyectado) y CTA para crear objetivo si no hay ninguno. Degradación elegante si el endpoint falla, sin romper el dashboard. Navegación vía `Router.navigateByUrl` (LA-CORE-068).

---

## Mejoras de robustez incorporadas durante Step 7

Tres mejoras adicionales fueron incorporadas tras la verificación visual del Product Owner durante DevOps, todas resueltas y validadas pre-G-7:

- **B.4 quick patch retry 409** — Manejo defensivo del frontend ante `409 CONCURRENCY_CONFLICT` en aportaciones, con un reintento automático con backoff de 500 ms y mensaje UX inline si persiste el conflicto. Trazabilidad completa: DR-S26-007, deuda formalizada DEBT-Q-073 para refactor limpio en S27.
- **Hallazgo 1 fix auth guard** — Corrección crítica del guard `goalOwnerGuard` que redirigía erróneamente a `/login` por un refactor parcial de auth (DEBT-033 abandonada). Trazabilidad: DR-S26-008, deuda DEBT-FE-074 para refactor unificado de auth en S27.
- **OBS-008 + OBS-009 selector multi-cuenta** — El modal de aportación ahora muestra el selector multi-cuenta real obtenido de `GET /api/v1/accounts` con saldos visibles, sustituyendo la cuenta única hardcoded y los placeholders. RN-F024-17 documenta el comportamiento canónico. Trazabilidad: DR-S26-008, deuda DEBT-FE-075.

---

## Deuda técnica cerrada

**DEBT-051** — ShedLock cableado correctamente: la dependencia estaba declarada en pom.xml pero sin configurar; ahora la ejecución de aportaciones automáticas está protegida frente a concurrencia multi-instancia.

**DEBT-048..050** — OpenAPI 3.1 completo vía springdoc + script `validate-smoke-vs-openapi` que implementa GR-SMOKE-001. El contrato API es ahora la única fuente de verdad para smoke tests.

**DEBT-033** — Refactor parcial de auth identificado y formalizado para cierre completo en S27 (DEBT-FE-074).

---

## Cambios de infraestructura

- **Flyway V32+V33** — 4 nuevas tablas: `savings_goals`, `goal_allocations`, `goal_auto_rules`, `goal_milestones`. V33 corrige categorización inicial.
- **Angular** — Módulo `/savings` lazy-loaded con 12 componentes (lista, detalle, modal aportación, modal regla auto, widget dashboard, etc.). Ruta registrada en `app-routing.module.ts`. Item "Mis Metas" en sidebar.
- **Dashboard** — Slot `SavingsWidgetComponent` integrado en `dashboard.component.ts`.
- **OpenAPI 3.1** — Endpoint `/v3/api-docs` activo y consumido por el script `validate-smoke-vs-openapi.sh` durante la fase pre-release.

---

## Breaking changes

Ninguno. Todos los endpoints existentes mantienen compatibilidad. Las nuevas tablas `savings_*` son aditivas. La actualización de `availableBalance` en cuentas de ahorro respeta el invariante `availableBalance ≤ ledgerBalance` (ADR-040).

---

## Variables de entorno nuevas

Ninguna. El módulo Savings reutiliza la conexión PostgreSQL, Redis y la configuración de notificaciones VAPID ya presentes.

---

## Servicios desplegados

| Servicio | Versión anterior | Versión nueva |
|---|---|---|
| bankportal-backend | v1.25.0 | v1.26.0 |
| bankportal-frontend | v1.25.0 | v1.26.0 |

---

## Instrucciones de despliegue

```bash
# 1. Confirmar imágenes disponibles
docker pull bankportal-backend:v1.26.0
docker pull bankportal-frontend:v1.26.0

# 2. Actualizar docker-compose.yml con los nuevos tags

# 3. Desplegar
docker compose -f infra/compose/docker-compose.yml up -d

# 4. Verificar Flyway V32+V33
docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
  "SELECT version, description, success FROM flyway_schema_history WHERE version IN ('32','33');"

# 5. Ejecutar smoke test
chmod +x infra/compose/smoke-test-v1.26.0.sh
./infra/compose/smoke-test-v1.26.0.sh
```

---

## Rollback a v1.25.0

Ver `RUNBOOK-backend-2fa-v1.26.0.md` — sección "Procedimiento de rollback". RTO objetivo 10 min. Las migraciones Flyway V32+V33 NO se revierten automáticamente; el rollback requiere `DROP TABLE` manual de las tablas `savings_*` y limpieza del registro Flyway (ver Runbook).

---

## Métricas de calidad de la release

| Métrica | Valor |
|---|---|
| **Tests backend** | 147/147 PASS |
| **Tests E2E** | 6/6 PASS |
| **Cobertura instrucciones** | 84.3 % |
| **Cobertura líneas** | 87.2 % |
| **Cobertura ramas** | 88.1 % |
| **CVE críticos / altos** | 0 / 0 |
| **CVE LOW transitivos** | 2 (DEBT-060, baja prioridad) |
| **SAST findings** | 1 BAJO (SEC-F024-01 → DEBT-059) |
| **Defectos en producción** | 0 |
| **NCs** | 0 |
| **Smoke 409 concurrencia** | 7×201 + 3×409 sin pérdida de datos |

---

## Trazabilidad

- **Sprint backlog Jira:** SCRUM-163 — SCRUM-173 (board 1, sprint 497)
- **Branch de release:** `feature/FEAT-024-sprint26`
- **Tag git previsto:** `v1.26.0` (post-G-9, Step 9 Workflow Manager)
- **Decision Records:** DR-S26-007 (B.4 quick patch 409), DR-S26-008 (auth guard + multi-cuenta)
- **ADR estructural:** ADR-040 (segregación virtual: reservedAmount afecta availableBalance, NO ledgerBalance)

---

*DevOps Agent · SOFIA v2.7 · Sprint 26 · FEAT-024 · BankPortal · Banco Meridian*
