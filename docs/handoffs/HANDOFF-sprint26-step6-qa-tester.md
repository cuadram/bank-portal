# HANDOFF Sprint 26 · Step 5b → Step 6 (QA Tester · gate HITL QA G-6)

**Generado por:** SOFIA Orchestrator · cierre Step 5b (Security Agent)
**Fecha:** 2026-05-08
**Sprint:** 26 · **Feature:** FEAT-024 Objetivos de Ahorro · v1.26.0
**Branch:** feature/FEAT-024-sprint26
**HEAD:** c86c50e (sincronizado con origin)
**Estado pipeline:** current_step=6 · status=idle · gate_pending=null · pipeline READY para arranque QA Tester

---

## 0. Contexto rápido para arrancar otro chat

Este handoff es **autosuficiente**: contiene todo lo que un chat nuevo necesita para arrancar Step 6 sin tener que reconstruir el historial. El nuevo chat solo necesita acceso al repositorio bank-portal, las herramientas SOFIA estándar (sofia-shell-bank-portal, filesystem, git) y este documento.

**Comando recomendado para arrancar:**
```
Continuar pipeline SOFIA bank-portal Sprint 26.
Lee primero: docs/handoffs/HANDOFF-sprint26-step6-qa-tester.md
Lee también: .sofia/session.json y .sofia/skills/qa-tester/SKILL.md
Estado actual: Step 5b COMPLETED (semáforo VERDE) · Step 6 READY · gate_pending=null.
Acción: arrancar Step 6 (QA Tester) con producción de plan de pruebas, ejecución y handoff a gate HITL QA G-6.
```

---

## 1. Ruta de progreso del sprint hasta este punto

```
✓ Step 1   Scrum Master           HITL PO    G-1   APPROVED  (FEAT-024 aprobado · 24 SP)
✓ Step 2   Requirements Analyst   HITL PO    G-2   APPROVED  (SRS + 9 US + RTM)
✓ Step 2b  FA-Agent               AUTO       —     COMPLETED (108 funcionalidades · 246 reglas · S1-S26)
✓ Step 2c  UX/UI Designer         HITL PO+TL G-2c  APPROVED  (UX-FEAT-024 + Design System v1.0)
✓ Step 3   Architect              HITL TL    G-3   APPROVED  (HLD + LLD-backend + LLD-frontend)
✓ Step 3b  Doc + FA-Agent         AUTO       —     COMPLETED (Confluence HLD + fa-index validado)
✓ Step 4   Developer              HITL TL    G-4b  APPROVED  (8 fases A..H · 145 tests · ng build OK)
✓ Step 5   Code Reviewer          HITL TL    G-5   APPROVED  (0 bloqueantes · 0 mayores · 2 menores · 4 sugerencias)
✓ Step 5b  Security Agent         AUTO       —     COMPLETED (semáforo VERDE · 0 CVEs críticos · 1 BAJO)
→ Step 6   QA Tester              HITL QA    G-6   READY  ← arranca aquí
  Step 7   DevOps                 HITL DV    G-7   pending
  Step 8   Documentation Agent    HITL PM    G-8   pending
  Step 8b  FA-Agent + DEBT update AUTO       —     pending  (LAs/GR diferidos aquí)
  Step 9   Workflow Manager       —          —     pending
```

---

## 2. Acción solicitada al QA Tester en este chat

Producir el plan de pruebas y ejecutarlo, generando los siguientes entregables:

| # | Entregable | Ruta |
|---|---|---|
| 1 | Test Plan FEAT-024 | `docs/quality/TestPlan-FEAT-024-sprint26.md` |
| 2 | QA Execution Report con resultados | `docs/quality/QA-Report-FEAT-024-sprint26.md` |
| 3 | (Opcional) Evidencias E2E Playwright | `docs/quality/evidence/sprint-26/` |
| 4 | Handoff Step 6 → Step 7 | `docs/handoffs/HANDOFF-sprint26-step6-qa-tester.md` (este fichero, actualizado al cierre) |
| 5 | Veredicto QA: APROBADO / APROBADO CON CONDICIONES / RECHAZADO |

Tras producción de entregables y ejecución → `gate_pending=G-6` esperando aprobación HITL QA Lead.

---

## 3. Alcance funcional a probar (FEAT-024 — Objetivos de Ahorro)

### 3.1 User Stories (9 US · ref. SRS aprobado en G-2)

| US | Título | Endpoint principal | Criterios Gherkin |
|---|---|---|---|
| US-024-01 | Crear objetivo de ahorro | POST `/api/v1/savings/goals` | RN-F024-01 (max 10 activos) · validación target/fecha |
| US-024-02 | Listar objetivos del usuario | GET `/api/v1/savings/goals` | filtro opcional por status |
| US-024-03 | Detalle de un objetivo | GET `/api/v1/savings/goals/{id}` | ownership · 404 si no existe · 403 si ajeno |
| US-024-04 | Editar objetivo | PUT `/api/v1/savings/goals/{id}` | RN-F024-03 (target ≥ reservado) |
| US-024-05 | Cerrar objetivo | DELETE `/api/v1/savings/goals/{id}` | RN-F024-12 (SCA OTP si reserved > 30€) · libera reserva |
| US-024-06 | Aportación manual | POST `/api/v1/savings/goals/{id}/contributions` | RN-F024-05 (saldo suficiente) · idempotencia |
| US-024-07 | Configurar regla automática | PUT `/api/v1/savings/goals/{id}/auto-rule` | día válido [1,5,10,15,20,25,28] |
| US-024-08 | Pausar regla automática | DELETE `/api/v1/savings/goals/{id}/auto-rule` | ownership |
| US-024-09 | Widget dashboard | GET `/api/v1/savings/dashboard-widget` | agregación · degradación grácil ante error |

### 3.2 Reglas de negocio críticas (15 RN · ref. fa-index FEAT-024)

Todas deben tener al menos 1 caso de prueba positivo + 1 negativo:

- RN-F024-01 — Máximo 10 objetivos activos por usuario
- RN-F024-02 — `MaxGoalsReachedException` → 409 CONFLICT
- RN-F024-03 — target ≥ reservedAmount (UpdateGoal)
- RN-F024-04 — Aportación automática idempotente por mes (`ProcessAutoRuleUseCase`)
- RN-F024-05 — Saldo disponible suficiente para aportación manual
- RN-F024-06 — Reserva atómica vía `accountReserve.reserve()`
- RN-F024-07 — Liberación de reserva al cerrar goal (CloseGoalUseCase)
- RN-F024-08 — Hitos emitidos en 25%/50%/75%/100%
- RN-F024-09 — Idempotencia hitos (`MilestoneAlreadyEmittedException`)
- RN-F024-10 — Categorías predefinidas (GoalCategory enum)
- RN-F024-11 — Status transitions: ACTIVE → CLOSED (no ACTIVE → CANCELLED directo)
- RN-F024-12 — SCA OTP en CloseGoal cuando reserved > 30€
- RN-F024-13 — AutoRule schedule días válidos: [1,5,10,15,20,25,28]
- RN-F024-14 — ShedLock previene split-brain en multi-replica scheduler
- RN-F024-15 — Widget agregación lecturas tolerante a fallos parciales

### 3.3 Tests existentes del Developer (línea base)

**Backend (18 ficheros · 145 tests · 145/145 PASS verificado en G-4b):**
- 1 `SavingsControllerIT` (integration · MockMvc + @SpringBootTest)
- 1 `JpaAccountReserveAdapterIT` (integration · adapter cuentas)
- 1 `SavingsFlywayIT` (integration · esquema V29 + columnas)
- 1 `AutoContributionSchedulerIT` (integration · cron acelerado)
- 1 `MilestoneEmissionIT` (integration · idempotencia hitos)
- 1 `ShedLockEnabledIT` (integration · lock provider · NUEVO Fase H.2)
- 4 domain tests: SavingsGoalTest, MilestoneEvaluatorTest, GoalProjectionServiceTest, GoalClosureServiceTest
- 9 use case tests: Create/List/Update/Close/ContributeManual/ConfigureAutoRule/PauseAutoRule/GetDashboardWidget/ProcessAutoRule

**Frontend:** 21 componentes Angular · ng test no auditado en CR (verificación pendiente del QA — item 8 del checklist devops pre-G-7).

---

## 4. Trabajo de QA pendiente (lo que el agente debe producir)

### 4.1 Auditoría de Integration Tests existentes (LA-019-16 OBLIGATORIO)

Antes de cualquier diseño nuevo, ejecutar la "auditoría de IT" de la skill QA-Tester sec. 730:

```bash
# 1. Confirmar 145/145 tests PASS contra HEAD c86c50e
JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home \
  /opt/homebrew/bin/mvn -pl apps/backend-2fa test \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Dtest=SavingsControllerIT,JpaAccountReserveAdapterIT,SavingsFlywayIT,AutoContributionSchedulerIT,MilestoneEmissionIT,SavingsGoalTest,MilestoneEvaluatorTest,GoalProjectionServiceTest,GoalClosureServiceTest,CreateGoalUseCaseTest,ListGoalsUseCaseTest,UpdateGoalUseCaseTest,CloseGoalUseCaseTest,ContributeManualUseCaseTest,ConfigureAutoRuleUseCaseTest,PauseAutoRuleUseCaseTest,GetDashboardWidgetUseCaseTest,ProcessAutoRuleUseCaseTest,ShedLockEnabledIT

# 2. ng test contra savings/ y resto del frontend
docker compose -f infra/compose/docker-compose.yml build frontend
# o local: cd apps/frontend-portal && ng test --watch=false --browsers=ChromeHeadless

# 3. Verificar que NO hay declaración de PASS sin ejecución real (DEBT-055 lección)
```

**ALERTA crítica:** El reporte QA del Sprint 25 declaró un test como PASS sin ejecutarlo realmente (DEBT-055 OPEN · Alta). Este sprint debe evidenciar la ejecución con output explícito de surefire reports + screenshots.

### 4.2 Nuevos casos de prueba a diseñar

Áreas que requieren cobertura adicional sobre lo que tiene el Developer:

| Área | Falta cubrir | Tipo |
|---|---|---|
| End-to-end Playwright | Flujo completo: login → crear goal → aportar → ver progreso → cerrar con OTP | E2E |
| RN-F024-12 SCA | CloseGoal reserved > 30€ exige OTP correcto · OTP incorrecto → 401 INVALID_OTP · OTP nulo → 401 OTP_REQUIRED | API IT + E2E |
| RN-F024-04 idempotencia | Ejecutar ProcessAutoRule dos veces en mismo mes · debe procesar 1 vez · GoalAllocation no duplica | Integration |
| RN-F024-08 hitos visuales | Aportación que cruza 25%/50%/75%/100% emite Milestone · widget muestra badge | Integration + E2E UI |
| Concurrencia / race condition | 2 requests POST /contributions simultáneos sobre mismo goal · solo 1 reserva, otro recibe 422 INSUFFICIENT_FUNDS | Integration con CountDownLatch |
| Performance / RNF | GET /goals con 100 goals < 500ms p95 · POST /contributions < 1s p95 | Load test (opcional Sprint 26 si tiempo) |
| Accesibilidad WCAG 2.1 AA | savings-page · goal-create-form · contribution-modal: contraste, focus, ARIA labels | axe-core en Playwright |
| Dashboard widget degradación | GetDashboardWidget con backend 500 → degraded:true (sin romper UI) | E2E con stub de error |
| Hallazgo SAST SEC-F024-01 | UpdateGoal con newTarget < reservedAmount: verificar message del 422 (decisión QA: ¿reportar como tracking de DEBT-059 o como bug del sprint?) | API |

### 4.3 Hallazgo SAST a contemplar en QA

**SEC-F024-01** (CVSS 3.5 · BAJO · DEBT-059 · sprint_target S27): `ReservedExceedsTargetException` propaga importes monetarios al cliente vía 422. **No es bloqueante** ni del sprint actual, pero el QA debe **documentar** que el comportamiento observado coincide con la deuda registrada para que el QA Lead pueda decidir en G-6 si exige fix en este sprint o acepta el diferimiento a S27.

### 4.4 Veredicto y handoff

Al cerrar Step 6, el agente QA debe:

1. Emitir veredicto: APROBADO / APROBADO CON CONDICIONES / RECHAZADO según skill sec. 813
2. Actualizar `session.json`: `gate_pending="G-6"`, `status="gate_pending"`, `pipeline_step="6"`, registrar artefactos
3. Regenerar dashboard: `node .sofia/scripts/gen-global-dashboard.js --gate G-6 --step 6`
4. Append a `sofia.log` con `[STEP-6] [qa-tester] COMPLETED`
5. Crear snapshot: `.sofia/snapshots/step-6-{timestamp}.json`
6. Generar `HANDOFF-sprint26-step6-qa-tester.md` con resultados (sustituye este fichero)

---

## 5. Información de contexto crítica

### 5.1 Identidad del proyecto y rama

```bash
cd /Users/cuadram/proyectos/bank-portal
git branch --show-current   # feature/FEAT-024-sprint26
git rev-parse HEAD          # c86c50e (al momento del handoff)
git rev-parse origin/feature/FEAT-024-sprint26  # idem
git status --porcelain | grep -c "^ D"  # 0 (GR-GIT-001 PASS)
```

### 5.2 Stack y entorno

- Backend: Java 21 + Spring Boot 3.3.4 (hexagonal · savings/{api,application,domain,infrastructure})
- Frontend: Angular 17 (savings/{components,services,models})
- BD: PostgreSQL en docker compose · Flyway V1..V31 (V31 = ShedLock, renombrada de V18c en Fase H.7)
- ShedLock: 5.16.0 · LockProvider JdbcTemplate · usingDbTime() activo
- Compose: `infra/compose/docker-compose.yml` · puertos: backend 8081, frontend 4201, PG 5433, Redis 6380, Mailhog UI 8025

### 5.3 OTP bypass (entornos staging/local)

- Código bypass: `123456` (configurado en `application-staging.yml` · `totp.stg-bypass-code`)
- Usar en E2E para flujo CloseGoal SCA sin generar TOTP real

### 5.4 Endpoints expuestos (6 paths · 11 endpoints lógicos)

```
GET    /api/v1/savings/goals                       (status filter optional)
POST   /api/v1/savings/goals
GET    /api/v1/savings/goals/{id}
PUT    /api/v1/savings/goals/{id}
DELETE /api/v1/savings/goals/{id}                  (SCA OTP si reserved>30€)
POST   /api/v1/savings/goals/{id}/contributions
GET    /api/v1/savings/goals/{id}/contributions    (lectura del repo via GetGoalDetailUseCase)
PUT    /api/v1/savings/goals/{id}/auto-rule
DELETE /api/v1/savings/goals/{id}/auto-rule
GET    /api/v1/savings/goals/{id}/milestones       (lectura via GetGoalDetailUseCase)
GET    /api/v1/savings/dashboard-widget
```

OpenAPI accesible **sin JWT** en `http://localhost:8081/v3/api-docs` (DEBT-048 cerrada · springdoc).

### 5.5 Códigos de error HTTP del módulo savings (10 mapeos en SavingsExceptionHandler)

| Excepción dominio | HTTP | Código error |
|---|---|---|
| GoalNotFoundException | 404 | GOAL_NOT_FOUND |
| GoalAccessDeniedException | 403 | GOAL_ACCESS_DENIED |
| MaxGoalsReachedException | 409 | MAX_GOALS_REACHED |
| InsufficientFundsException | 422 | INSUFFICIENT_FUNDS |
| ReservedExceedsTargetException | 422 | RESERVED_EXCEEDS_TARGET |
| MilestoneAlreadyEmittedException | 409 | MILESTONE_ALREADY_EMITTED |
| InvalidOtpException | 401 | INVALID_OTP |
| (controller traduce body.otp == null) | 401 | OTP_REQUIRED |
| IllegalStateException | 409 | ILLEGAL_STATE |
| IllegalArgumentException | 400 | BAD_REQUEST |
| MethodArgumentNotValidException | 400 | VALIDATION_FAILED |

### 5.6 Estado de session.json (al cierre Step 5b · momento de este handoff)

```json
{
  "status": "idle",
  "current_step": 6,
  "pipeline_step": "6",
  "pipeline_step_name": "qa-tester",
  "gate_pending": null,
  "last_gate_approved": "G-5",
  "last_gate_approved_at": "2026-05-08T07:06:04.988Z",
  "last_gate_approved_by": "Tech Lead (Angel de la Cuadra · HITL)",
  "completed_steps.steps": ["1","2","2b","2c","3","3b",{step:4},{step:5},{step:"5b"}],
  "code_review.verdict": "APPROVED",
  "security.semaphore": "GREEN",
  "security.cve_critical": 0,
  "dashboard_global.last_generated": "2026-05-08T07:18:33.149Z"
}
```

---

## 6. Deudas técnicas activas relevantes para QA

### Sprint 26 (deben procesarse en Step 8b o S27 según prioridad)

| ID | Prioridad | Sprint obj | Origen | Resumen |
|---|---|---|---|---|
| **DEBT-049** | Alta | S26 | CR Sprint 26 | validate-smoke-vs-openapi.js · candidato GR-CI-002 desde S27 |
| **DEBT-050** | Media | S26 | CR Sprint 26 | Checklist devops pre-G-7 (10 items) |
| **DEBT-051** | Crítica | S26 | Auditoría Fase H.2 | ShedLock cableado (RESUELTO en commit f38c6ad — pendiente cerrar como CLOSED en Step 8b) |
| **DEBT-053** | Media | S27 | Auditoría Fase D | Drift LLD §11 vs implementación: AutoContributionScheduler sin paginación |
| **DEBT-054** | Media | S27 | F.4 IT execution | application.yml subárbol bank/jwt no fusiona profundo en Spring Boot 3.3 |
| **DEBT-055** | Alta | S27 | F.4 IT execution | **QA-FEAT-023 S25 declaró TC-IT-005 PASS sin ejecución real** ← lección clave para QA actual |
| **DEBT-056** | Media | S27 | F.4 IT execution | maven-surefire 3.2.5 default pattern no matchea IT.java · ITs huérfanos del lifecycle |
| **DEBT-059** | Baja | S27 | Step 5b sec | Mensajes de excepción savings exponen importes monetarios al cliente (CVSS 3.5 LOW) |
| **DEBT-060** | Baja | TBD | Step 5b sec | CVE-2025-22233 + CVE-2024-38820 (Spring 6.1.13 · LOW · transitivo) |

### Decisiones del Code Review diferidas a Step 8b (mi nota como Code Reviewer)

El reporte de Step 5 sugirió crear **DEBT-052** (springdoc política prod) y **DEBT-053** (refactor userId() helper). **AMBOS IDs YA ESTABAN OCUPADOS** con otra semántica. Cuando se creen formalmente esas deudas funcionales en Step 8b, deben renumerarse a:
- **DEBT-061** — springdoc política de exposición en prod
- **DEBT-062** — refactor `userId(HttpServletRequest)` helper duplicado en controllers

Lecciones aprendidas candidatas (Fase H · diferidas a Step 8b):
- **LA-026-H1** — `ng build --configuration production` debe ejecutarse en cierre Fase G, no esperar a Fase H
- **LA-026-H2** — Migraciones Flyway siempre con número estrictamente creciente (no V<N>c)
- **LA-026-H3** — `compose down -v` + lista canónica completa al cierre Step 4
- **GR-CI-002** — `validate-smoke-vs-openapi.js` como guardrail bloqueante CI desde Sprint 27

---

## 7. Comandos de bootstrap rápido

```bash
# 1. Identidad y limpieza working tree
cd /Users/cuadram/proyectos/bank-portal
git branch --show-current && git rev-parse HEAD
git status --porcelain | grep -c "^ D"   # debe ser 0 (GR-GIT-001)

# 2. Estado pipeline desde session.json (verificación atómica)
node -e "const s=JSON.parse(require('fs').readFileSync('.sofia/session.json'));console.log(JSON.stringify({status:s.status,current_step:s.current_step,pipeline_step:s.pipeline_step,gate_pending:s.gate_pending,last_gate_approved:s.last_gate_approved,semaforo:s.security.semaphore,steps:s.completed_steps.steps.map(x=>typeof x==='object'?x.step:x)},null,2))"

# 3. Skill del agente
cat .sofia/skills/qa-tester/SKILL.md

# 4. Entregables previos consultables
cat docs/handoffs/HANDOFF-sprint26-step5-code-review.md
cat docs/deliverables/sprint-26-FEAT-024/STEP5-code-review-report.md
cat docs/security/SecurityReport-Sprint26-FEAT-024.md

# 5. Levantar entorno para tests
docker compose -f infra/compose/docker-compose.yml down -v   # crítico: down -v para reaplicar Flyway desde cero
docker compose -f infra/compose/docker-compose.yml up -d --build

# 6. Lista canónica de tests (referencia G-4b · debería seguir 145/145 PASS contra HEAD)
JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home \
  /opt/homebrew/bin/mvn -pl apps/backend-2fa test \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Dtest=SavingsControllerIT,JpaAccountReserveAdapterIT,SavingsFlywayIT,AutoContributionSchedulerIT,MilestoneEmissionIT,SavingsGoalTest,MilestoneEvaluatorTest,GoalProjectionServiceTest,GoalClosureServiceTest,CreateGoalUseCaseTest,ListGoalsUseCaseTest,UpdateGoalUseCaseTest,CloseGoalUseCaseTest,ContributeManualUseCaseTest,ConfigureAutoRuleUseCaseTest,PauseAutoRuleUseCaseTest,GetDashboardWidgetUseCaseTest,ProcessAutoRuleUseCaseTest,ShedLockEnabledIT

# 7. Smoke real
curl -s http://localhost:8081/actuator/health | python3 -m json.tool
curl -s http://localhost:8081/v3/api-docs | python3 -c "import json,sys;d=json.load(sys.stdin);print(sorted(p for p in d.get('paths',{}) if 'savings' in p))"
```

---

## 8. Restricciones operativas (proyecto bank-portal · MCP shell)

- Comandos permitidos en sofia-shell-bank-portal: `node, npm, npx, python3, python, ls, cat, mkdir, cp, mv, rm, find, grep, echo, git, docker, docker-compose`
- **No permitidos:** `pwd`, `tail`, `head`, `sed`, `awk`, asignación de env vars en línea (`JAVA_HOME=... mvn` falla — usar `/opt/homebrew/bin/mvn` con env de sistema o lanzar mvn fuera del shell MCP)
- `cd` no permitido — usar parámetro `cwd` siempre
- Path Node: `/opt/homebrew/opt/node@22/bin/node` (también disponible como `node`)
- JAVA_HOME canónico: `/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home`
- Mvn: `/opt/homebrew/bin/mvn`

---

## 9. Pieces of evidence ya en el repo (al momento de este handoff)

```
docs/
├── handoffs/
│   ├── HANDOFF-sprint26-step4-fase-d.md           (Fase D Developer)
│   ├── HANDOFF-sprint26-step4-fase-f.md           (Fase F Developer)
│   ├── HANDOFF-sprint26-step4-fase-g.md           (Fase G Developer)
│   ├── HANDOFF-sprint26-step4-fase-g1.md
│   ├── HANDOFF-sprint26-step4-fase-g2.md
│   ├── HANDOFF-sprint26-step4-fase-h.md           (Fase H Developer)
│   ├── HANDOFF-sprint26-step5-code-review.md      (entrada al Code Reviewer · ya procesado)
│   └── HANDOFF-sprint26-step6-qa-tester.md        ← ESTE FICHERO (entrada al QA Tester)
├── deliverables/sprint-26-FEAT-024/
│   ├── STEP4-cierre-fase-H.md                     (cierre Fase H Developer)
│   └── STEP5-code-review-report.md                (Code Review APPROVED)
├── quality/
│   ├── STEP5-code-review-sprint26-FEAT-024.md     (alias del CR)
│   ├── sofia-dashboard.html                       (alias del dashboard global)
│   ├── TestPlan-FEAT-024-sprint26.md              ← QA debe crear
│   └── QA-Report-FEAT-024-sprint26.md             ← QA debe crear
├── security/
│   └── SecurityReport-Sprint26-FEAT-024.md        (Step 5b · semáforo VERDE)
└── dashboard/
    └── bankportal-global-dashboard.html           (regenerado · Step 5b · 2026-05-08T07:18Z)
```

---

## 10. Comando del PO/Tech Lead esperado tras el cierre de Step 6

```
apruebo G-6 · veredicto QA <APROBADO / APROBADO CON CONDICIONES / RECHAZADO>
```

Tras G-6 → Step 7 (DevOps · gate HITL DV G-7).

---

## 11. Preámbulo recomendado para el chat nuevo

```
Hola Claude. Continuamos pipeline SOFIA bank-portal Sprint 26 / FEAT-024.

1. Lee primero: docs/handoffs/HANDOFF-sprint26-step6-qa-tester.md
2. Lee también: .sofia/session.json y .sofia/skills/qa-tester/SKILL.md
3. Verifica identidad: branch=feature/FEAT-024-sprint26 · HEAD debería ser c86c50e o posterior
4. Acción: arranca Step 6 (QA Tester) según el handoff. Sigue el protocolo de inicio
   (STARTED en sofia.log + status=in_progress) y ejecuta la auditoría de IT
   ANTES de diseñar nuevos casos.
5. Producción de TestPlan + QA-Report + ejecución contra entorno compose.
6. Cierre con gate_pending=G-6, dashboard regenerado y handoff a Step 7.

Aplica las reglas estándar (Persistence Protocol, GR-GIT-001, regla de confianza
~95% antes de operaciones costosas, Spanish, conciso).
```

---

**FIN DEL HANDOFF.**

Generado por Orchestrator SOFIA al cierre de Step 5b.
Próximo agente: QA Tester (Step 6 · gate HITL QA G-6).
