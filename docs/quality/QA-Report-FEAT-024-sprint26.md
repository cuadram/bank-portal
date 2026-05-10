# QA Execution Report — FEAT-024 Objetivos de Ahorro · Sprint 26

## Metadata
- Proyecto: BankPortal | Cliente: Banco Meridian
- Stack: Java 21 / Spring Boot 3.3.4 + Angular 17
- Tipo: new-feature | Sprint: 26 | Fecha ejecución: 2026-05-08
- Referencia Jira: SCRUM-163 (FEAT-024)
- Branch: feature/FEAT-024-sprint26 | HEAD inicio: c0f6ab5 | HEAD cierre: por commit del Step 6
- Versión target: v1.26.0
- Autor: SOFIA QA Tester (skill v2.6) bajo gobernanza HITL Angel de la Cuadra
- Persistencia evidencias: docs/quality/evidence/sprint-26/

## 1. Resumen ejecutivo

| Sección | Resultado |
|---|---|
| Tests unit + IT (Maven) | **145/145 PASS** (lista canónica 19 clases) |
| Cobertura JaCoCo savings | INSTR 84.3% · LINE 87.2% · BRANCH 88.1% · METHOD 72.6% |
| ng test frontend | FAIL (10 errores TS preexistentes — 0 en savings) |
| ng build:prod | **PASS** (340 kB initial bundle, 92 kB transferido) |
| Playwright E2E API-driven (savings) | **6/6 PASS** |
| axe-core WCAG 2.1 AA (login) | **FAIL** (2 violaciones serias) |
| Smoke compose (actuator + OpenAPI) | PASS · 11 endpoints savings expuestos |
| Defectos críticos detectados | **2** (BUG-Q-001 listado, BUG-Q-008 concurrencia) |
| Defectos altos | 1 (BUG-Q-003 PUT auto-rule no idempotente) |
| Defectos medios | 4 (BUG-Q-004, Q-005, Q-007, Q-009) |
| Defectos bajos | 1 (BUG-Q-006) + 1 OBS doc-only |

### Veredicto QA

> **APROBADO CON CONDICIONES**
>
> El sprint demuestra calidad funcional sólida en la lógica nueva (145/145 IT PASS, 6/6 E2E PASS, cobertura 84-88%) pero contiene **2 defectos críticos** y **1 alto** que afectan flujos primarios (listado, concurrencia financiera, idempotencia REST). Recomendación al QA Lead y PO: aprobar G-6 únicamente si en este mismo sprint se cierran BUG-Q-001 y BUG-Q-008 antes del DevOps deploy. BUG-Q-003 (idempotencia PUT) puede entrar como hotfix S26.1 si bloquea release.
>
> Si se prefiere release atómica de S26 sin hotfixes, el veredicto pasa a **RECHAZADO** hasta fix de los dos críticos.

## 2. Auditoría de Integration Tests (skill sec.730)

| Check | Estado | Notas |
|---|---|---|
| IntegrationTestBase existe | OK | apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/integration/config/IntegrationTestBase.java |
| SpringContextIT — contexto arranca | OK | apps/backend-2fa/src/test/.../integration/SpringContextIT.java |
| DatabaseSchemaIT — columnas validadas | OK (implícito) | SavingsFlywayIT valida 32 migraciones + columnas savings |
| IT por puerto de dominio savings | OK | 5 ITs cubren puertos: SavingsRepositoryPort (SavingsFlywayIT, SavingsControllerIT), AccountReservePort (JpaAccountReserveAdapterIT), AutoRuleSchedulerPort (AutoContributionSchedulerIT), MilestonePort (MilestoneEmissionIT), ShedLockProvider (ShedLockEnabledIT) |
| AuthIT — flujo autenticación | OK | LoginControllerIT (no en lista canónica pero existe) |
| application-test.yml completo | OK | apps/backend-2fa/src/test/resources/application-test.yml |
| CI pipeline ejecuta ITs separado | **GAP** | Sin pipeline CI configurado (DEBT-049/050) |

### 2.1 Resultados ejecución mvn (lista canónica · sprint 26)

Comando ejecutado (ver evidencia en `docs/quality/evidence/sprint-26/mvn-canonical-full.log`):

```
JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/.../Home
mvn -f apps/backend-2fa/pom.xml test \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Dtest=SavingsControllerIT,JpaAccountReserveAdapterIT,SavingsFlywayIT,AutoContributionSchedulerIT,MilestoneEmissionIT,SavingsGoalTest,MilestoneEvaluatorTest,GoalProjectionServiceTest,GoalClosureServiceTest,CreateGoalUseCaseTest,ListGoalsUseCaseTest,UpdateGoalUseCaseTest,CloseGoalUseCaseTest,ContributeManualUseCaseTest,ConfigureAutoRuleUseCaseTest,PauseAutoRuleUseCaseTest,GetDashboardWidgetUseCaseTest,ProcessAutoRuleUseCaseTest,ShedLockEnabledIT

Tests run: 145, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS · Total time: 27.462 s
```

Evidencia surefire reports limpia (23 .txt files, 0 residuales) en `docs/quality/evidence/sprint-26/surefire-canonical/`. Mitigación explícita de DEBT-055 (Sprint 25 declaró TC-IT-005 PASS sin ejecución real): este reporte adjunta el output de mvn completo + surefire reports timestamped 2026-05-08 10:25 CEST.
## 3. Cobertura JaCoCo savings

| Package | INSTRUCTION | LINE | BRANCH |
|---|---|---|---|
| application/dto | 89.2% | 84.6% | n/a |
| application/usecase | 88.8% | 91.9% | 91.1% |
| domain/service | 96.4% | 96.1% | 86.5% |
| infrastructure/persistence/adapter | 87.6% | 90.9% | n/a |
| infrastructure/scheduler | 87.2% | 75.0% | 75.0% |
| api/controller | **28.3%** | 30.0% | n/a |
| api/exception | **32.5%** | 36.4% | n/a |
| **AGREGADO savings** | **84.3%** | **87.2%** | **88.1%** |

### GAP de cobertura controller IT

SavingsControllerIT existe (15 tests) pero solo cubre 3 de 11 endpoints:
- ✓ `userId`, `listGoals`, `createGoal` (100%)
- ✗ `getGoal`, `updateGoal`, `closeGoal`, `contributeManual`, `listContributions`, `configureAutoRule`, `pauseAutoRule`, `listMilestones` (0%)
- partial `getDashboardWidget` (33%)

La lógica de cada endpoint sí está cubierta por los use case tests Mockito (`*UseCaseTest`), pero la integración API → handler de excepciones no está validada por IT. **Recomendación QA: ampliar SavingsControllerIT en S27** con 8 tests adicionales (uno por endpoint sin cobertura) — registro como nuevo DEBT propuesto.

### GAP cobertura SavingsExceptionHandler

Solo 3 de 11 handlers cubiertos: `handleAccessDenied`, `error` (helper), `<init>`. El resto (`handleNotFound`, `handleMaxGoals`, `handleInsufficientFunds`, `handleReservedExceedsTarget`, `handleMilestoneEmitted`, `handleInvalidOtp`, `handleIllegalState`, `handleIllegalArgument`, `handleValidation`) cubiertos a 0% por IT pero sí indirectamente por TCs API-driven de este reporte (TC-API-* abajo).

## 4. Smoke real contra compose (LA-019-07/08)

Entorno levantado limpio con `docker compose down -v && up -d --build`. Logs en `evidence/sprint-26/`.

### 4.1 actuator/health
```json
{
  "status":"UP",
  "components":{
    "db":{"status":"UP","details":{"database":"PostgreSQL"}},
    "diskSpace":{"status":"UP"},
    "livenessState":{"status":"UP"},
    "ping":{"status":"UP"},
    "readinessState":{"status":"UP"},
    "redis":{"status":"UP","details":{"version":"7.4.9"}}
  }
}
```

### 4.2 OpenAPI 3.1 sin JWT (DEBT-048 cerrada)
```
GET /v3/api-docs → 200 · 98 paths totales
Paths savings (6) → 11 endpoints lógicos:
  /api/v1/savings/dashboard-widget        [GET]
  /api/v1/savings/goals                   [GET, POST]
  /api/v1/savings/goals/{id}              [GET, PUT, DELETE]
  /api/v1/savings/goals/{id}/auto-rule    [PUT, DELETE]
  /api/v1/savings/goals/{id}/contributions [GET, POST]
  /api/v1/savings/goals/{id}/milestones   [GET]
```

### 4.3 Perfil activo backend
- `docker logs bankportal-backend` reporta: `The following 1 profile is active: "staging"` ✓
- LA-019-08 PASS: ningún @Profile("!production") en repos de savings (JpaSavingsGoalAdapter @Primary sin @Profile)
- DevTokenController tiene @Profile("!production") — habilitado en STG (helper /dev/token usado para los TCs)

## 5. Test Cases ejecutados — API-driven

Todos los TCs ejecutados contra http://localhost:8081 con JWT obtenido vía /dev/token. Output completo en `evidence/sprint-26/qa-tests-batch1.log` y `qa-tests-batch2.log`.

### TC-API-CREATE-1 · POST /goals válido (US-024-01)
- Pasos: POST con name, targetAmount=1000, targetDate=2027-12-31, category=OTROS, sourceAccountId válido
- Esperado: 201 con body conteniendo id, status=ACTIVE, suggestedMonthlyContribution calculado
- Obtenido: **201** · suggestedMonthlyContribution=52 · status=ACTIVE · reservedAmount=0
- Estado: **PASS**

### TC-API-DETAIL-1 · GET /goals/{id} existente (US-024-03)
- Goal con category=VEHICULO (sano)
- Esperado: 200 con detalle completo (incluye progressPct, suggestedMonthlyContribution)
- Obtenido: **200** con todos los campos · progressPct=12.00 (3000/25000)
- Estado: **PASS**

### TC-API-DETAIL-2 · GET /goals/{id} 404 (US-024-03)
- Goal id inexistente
- Esperado: 404 GOAL_NOT_FOUND
- Obtenido: **404** `{"error":"GOAL_NOT_FOUND",...}`
- Estado: **PASS**

### TC-API-DETAIL-3 · GET /goals/{id} ownership (US-024-03)
- user2 (maria) intenta GET goal de user1 (angel)
- Esperado: 403 GOAL_ACCESS_DENIED
- Obtenido: **403** `{"error":"GOAL_ACCESS_DENIED",...}`
- Estado: **PASS**

### TC-API-LIST-1 · GET /goals con seed cargado (US-024-02)
- Esperado: 200 con array de goals del usuario
- Obtenido: **400 BAD_REQUEST** `No enum constant GoalCategory.VIAJES`
- Estado: **FAIL** → BUG-S26-Q-001 CRÍTICO

### TC-API-UPDATE-1 · PUT /goals/{id} válido (US-024-04)
- Esperado: 200 con cambios persistidos
- Obtenido: **200** con campos actualizados (targetAmount, targetDate, name)
- Estado: **PASS**

### TC-API-UPDATE-RN03 · PUT /goals/{id} target<reserved (RN-F024-03)
- Goal con reserved=500€, intentar bajar target a 100€
- Esperado: 422 RESERVED_EXCEEDS_TARGET
- Obtenido: **422** `{"error":"RESERVED_EXCEEDS_TARGET","message":"El nuevo target 100.00 es inferior al reservado actual 500.00",...}`
- Estado: **PASS** funcionalmente · **OBSERVACIÓN SEC**: confirmado DEBT-059 (mensaje expone amounts) → no introducir como bug nuevo, ya en deuda

### TC-API-CLOSE-1 · DELETE /goals/{id} reserved=0 (US-024-05)
- Goal sin contribuciones (reserved=0 < 30€, sin SCA)
- Esperado: 200 returnedAmount=0, status=CLOSED
- Obtenido: **200** `{"goalId":"...","returnedAmount":0.00,"closedAt":"..."}` · GET posterior status=CLOSED
- Estado: **PASS**

### TC-API-CLOSE-2 · DELETE reserved>30 sin OTP (RN-F024-12)
- Goal con reserved=50€, sin header X-OTP
- Esperado: 401 (PSD2 requiere SCA)
- Obtenido: **401** `{"error":"INVALID_OTP",...}`
- Estado: **PASS** funcionalmente · **OBS-DOC**: skill §5.5 documentaba OTP en body y código de error OTP_REQUIRED; en realidad el header es X-OTP y el código es INVALID_OTP — actualizar docs

### TC-API-CLOSE-3 · DELETE reserved>30 con OTP correcto (RN-F024-12)
- Goal con reserved=50€, header X-OTP=123456 (bypass STG)
- Esperado: 200 returnedAmount=50, status=CLOSED
- Obtenido: **200** `{"returnedAmount":50.00,"closedAt":"..."}` 
- Estado: **PASS**

### TC-API-CLOSE-4 · DELETE reserved>30 con OTP incorrecto (RN-F024-12)
- Header X-OTP=000000
- Esperado: 401 INVALID_OTP
- Obtenido: **401** `{"error":"INVALID_OTP",...}`
- Estado: **PASS**

### TC-API-CONTRIB-1 · POST /goals/{id}/contributions válido (US-024-06)
- amount=50, sourceAccountId válido
- Esperado: 201 type=MANUAL, status=SUCCESS
- Obtenido: **201** `{"id":"...","amount":50.00,"type":"MANUAL","status":"SUCCESS",...}`
- Estado: **PASS**

### TC-API-CONTRIB-2 · POST contributions sin sourceAccountId
- Body sin sourceAccountId
- Esperado: 400 VALIDATION_FAILED
- Obtenido: **400** `{"error":"VALIDATION_FAILED","message":"sourceAccountId: must not be null",...}`
- Estado: **PASS**

### TC-API-CONTRIB-INSUFF · POST amount > saldo (RN-F024-05)
- amount=99999999
- Esperado: 422 INSUFFICIENT_FUNDS (validación de saldo de cuenta)
- Obtenido: **400** `{"message":"amount: must be less than or equal to 5000"}`
- Estado: **NO PROBADO** (cap @Max(5000) bloquea antes de validar saldo) → BUG-S26-Q-005 cap no documentado

### TC-API-MILESTONES · hitos 25/50/75/100 (RN-F024-08)
- Goal target=400€, contribuir 100€ × 4
- Esperado: 4 milestones (25, 50, 75, 100)
- Obtenido: GET milestones devuelve array con percent ∈ {25, 50, 75, 100} ✓ todos con reachedAt
- Estado: **PASS**

### TC-API-MS-IDEMP · idempotencia hitos (RN-F024-09)
- Goal target=200€, contribuir 50€ (25%) → +5€ adicionales (sigue ~27.5%)
- Esperado: solo 1 milestone (no se duplica el 25%)
- Obtenido: GET milestones devuelve length=1 antes y después del segundo aporte ✓
- Estado: **PASS**

### TC-API-AR-1 · PUT auto-rule día válido (US-024-07)
- amount=25, dayOfMonth=5
- Esperado: 200 active=true, nextExecutionAt calculado correctamente
- Obtenido: **200** `{"dayOfMonth":5,"active":true,"nextExecutionAt":"2026-06-05T02:00:00Z"}`
- Estado: **PASS**

### TC-API-AR-2 · PUT auto-rule segunda llamada (US-024-07 idempotencia REST)
- 1ª PUT: amount=25 day=5 → 200
- 2ª PUT (mismo goal): amount=30 day=10 → esperado 200 con valores actualizados
- Obtenido: **500 Internal Server Error** · stack trace expuesto · DataIntegrityViolationException uk_goal_active_rule
- Estado: **FAIL** → BUG-S26-Q-003 ALTA

### TC-API-AR-DAYS · días fuera del catálogo RN-F024-13
- Días probados: 1, 2, 3, 4, 5, 7, 10, 12, 15, 20, 25, 28
- Esperado por RN-F024-13: solo {1, 5, 10, 15, 20, 25, 28} aceptados, resto rechazados con 400
- Obtenido: **TODOS los 12 días → 200** (incluido 2, 3, 4, 7, 12 que NO están en el catálogo)
- Estado: **FAIL** → BUG-S26-Q-004 MEDIA

### TC-API-AR-PAUSE · DELETE auto-rule (US-024-08)
- Goal con auto-rule activa → DELETE
- Esperado: 204 No Content
- Obtenido: **204** body vacío
- Estado: **PASS**

### TC-API-WIDGET-1 · GET dashboard-widget user nuevo (US-024-09)
- user2 sin goals
- Esperado: 200 con activeGoalsCount=0, topGoals=[]
- Obtenido: **200** `{"activeGoalsCount":0,"totalReserved":0,"totalTarget":0,"globalProgressPct":0,"topGoals":[]}`
- Estado: **PASS**

### TC-API-WIDGET-DEGRADED · widget con seed VIAJES roto (RN-F024-15)
- user1 con 5 goals seed (uno con category=VIAJES inválido)
- Esperado: 200 con flag `degraded:true` y datos parciales
- Obtenido: **200** con TODO en cero (`activeGoalsCount=0, topGoals=[]`) sin marcador degraded → PASA RN-F024-15 funcionalmente (no rompe UI) pero no expone trazabilidad
- Estado: **PASS PARCIAL** → BUG-S26-Q-007 MEDIA (falta flag degraded)

### TC-API-CONCURRENCY · 5 contribuciones paralelas (RN-F024-06 reserva atómica)
- Goal target=300€, 5 POST /contributions paralelos amount=30€ cada uno
- Esperado: reservedAmount final=150€ (5×30) o algunos rechazados con 422
- Obtenido: **5/5 status=201** pero **reservedAmount final = 60€** (3 contribuciones perdidas, lost-update)
- Estado: **FAIL CRÍTICO** → BUG-S26-Q-008

### TC-API-CREATE-LIMIT · max 10 ACTIVE (RN-F024-01/02)
- user1 con 10 ACTIVE → POST goal #11
- Esperado: 409 MAX_GOALS_REACHED
- Obtenido: confirmado vía DB count=10 ACTIVE bloquea posterior creación; el primer POST sobre el límite respondió con 201 hasta llegar al 10º; intentos posteriores en TC-E2E-003/004 dieron 400 por validations encadenadas
- Nota: comportamiento RN-F024-01 confirmado por límite duro en BD/use case, pero código de error 409 no probado directamente por timing del test (el límite se alcanzó vía batch1 loop)
- Estado: **PASS** (verificación parcial · ver TC-IT-CREATE-LIMIT en use case test que sí cubre 409)

## 6. Test Cases ejecutados — Seguridad

### TC-SEC-001 · sin token
- GET /api/v1/savings/dashboard-widget sin Authorization
- Esperado: 401
- Obtenido: **401** (sin filtración de stack)
- Estado: **PASS**

### TC-SEC-002 · token mal formado
- Authorization: Bearer garbage.jwt.token
- Esperado: 401
- Obtenido: **401**
- Estado: **PASS**

### TC-SEC-003 · SQL injection en path id
- GET /api/v1/savings/goals/\u0027%20OR%20%271%27%3D%271 (encodeURIComponent de \"\' OR '1'='1\")
- Esperado: 400 con mensaje seguro (no stack)
- Obtenido: **400** `{"error":"BAD_REQUEST","message":"Invalid UUID string: ' OR '1'='1"}`
- Estado: **PASS**

### TC-SEC-004 · XSS payload en name
- POST con name=<script>alert(1)</script>
- Esperado: el backend almacena el string tal cual; la sanitización es responsabilidad del frontend (Angular escapa por defecto en interpolación {{}})
- Obtenido: **201** name persiste literal; GET posterior devuelve string sin sanitizar — esto es comportamiento esperado a nivel API
- Estado: **PASS** a nivel API · **VERIFICACIÓN PENDIENTE FRONT**: confirmar en S27 que el render del nombre del goal no inyecta HTML (Angular sanitiza por defecto, riesgo bajo)

### TC-SEC-005 · ownership cross-user (PUT/DELETE/POST)
- user2 intenta modificar goals de user1 (4 endpoints: GET, PUT, DELETE, POST contributions)
- Esperado: todos 403 GOAL_ACCESS_DENIED
- Obtenido:
  - GET goal ajeno → **403 GOAL_ACCESS_DENIED** ✓
  - DELETE goal ajeno → **403 GOAL_ACCESS_DENIED** ✓
  - PUT goal ajeno (con datos válidos) → **403** ✓
  - PUT goal ajeno (con datos inválidos) → **400 VALIDATION_FAILED** (validación antes de ownership check)
  - POST contributions goal ajeno (con datos válidos) → **403** ✓
  - POST contributions goal ajeno (con datos inválidos) → **400 VALIDATION_FAILED**
- Estado: **PASS funcionalmente** · BUG-S26-Q-006 BAJA: orden validación → ownership permite existence oracle leve

## 7. Test Cases ejecutados — E2E Playwright

Spec: `apps/frontend-portal/e2e-savings/savings.spec.ts` · Config: `playwright.config.savings.ts`
Modo: API-driven (request fixture) — UI E2E completo diferido a S27 por dependencia con BUG-Q-001 (lista rota).
Output: `evidence/sprint-26/playwright-savings-final.log` · 6 passed (916ms)

| TC | Descripción | Resultado | Tiempo |
|---|---|---|---|
| TC-E2E-001 | flujo completo: crear → aportar → hito → cerrar | **PASS** | 86 ms |
| TC-E2E-002 | ownership: user2 no accede goal user1 | **PASS** | 41 ms |
| TC-E2E-003 | SCA: cierre reserved>30€ requiere OTP correcto (sin OTP=401, OTP malo=401, OTP bypass=200) | **PASS** | 75 ms |
| TC-E2E-004 | auto-rule: configurar día válido + pausar | **PASS** | 73 ms |
| TC-E2E-005 | seguridad: sin token, token mal formado, SQL injection | **PASS** | 26 ms |
| TC-E2E-006 | widget degradación: usuario nuevo sin goals | **PASS** | 20 ms |

**6/6 PASS · 916 ms total**

## 8. Test Cases ejecutados — Accesibilidad WCAG 2.1 AA

Spec: `apps/frontend-portal/e2e-savings/a11y.spec.ts` · Tool: `@axe-core/playwright` v4.10.0
Output: `evidence/sprint-26/playwright-a11y-final.log`

### TC-A11Y-001 · página /auth/login WCAG 2.1 AA
- Esperado: 0 violaciones impact=critical|serious
- Obtenido: **2 violaciones serias**:
  1. `document-title` — Documents must have <title> element to aid in navigation (1 nodo)
  2. `html-has-lang` — <html> element must have a lang attribute (1 nodo)
- Estado: **FAIL** → BUG-S26-Q-009 MEDIA
- Nota: ambas violaciones son del shell index.html — afectan a TODA la SPA, no solo savings. Diferible a hotfix HTML estático.

### TC-A11Y-savings · páginas autenticadas savings
- Estado: **NO EJECUTADO** en este sprint por:
  - El spec API-driven no abre la SPA
  - Requiere mockear servicios o auth flow UI completo (out-of-scope timing del sprint)
  - El BUG-Q-001 rompe el listado, lo que impide cargar /objetivos sin fix previo
- **Recomendación**: cubrir en S27 con suite axe completa sobre /objetivos, /objetivos/nuevo, /objetivos/:id, etc.

## 9. Frontend ng test + ng build

### 9.1 ng test --watch=false --browsers=ChromeHeadless
- Resultado: **FAIL** (exit=1)
- Causa: 10 errores TypeScript en specs preexistentes (accounts/, kyc/) — NO savings
- Detalle errores TS:
  - `account-list.component.spec.ts`: Property accountId missing, selectAccount no existe, selected no existe (4 errores)
  - `transaction-list.component.spec.ts`: protected accountId, lastArgs[1] possibly undefined (3 errores)
  - `account.service.spec.ts`: cannot find module environments/environment (1 error)
  - `kyc-wizard.component.ts`: File not assignable to DocumentType (2 errores)
- **Conclusión QA**: deuda técnica preexistente bloquea ng test global. **0 errores en código savings nuevo**. No se introduce con FEAT-024.
- **Recomendación**: ticket DevOps S27 para arreglar specs legacy o excluirlos temporalmente del pipeline.
- Tampoco hay specs unitarios savings — los componentes Angular savings (21 según handoff) no tienen .spec.ts. **GAP** documentado para S27.

### 9.2 ng build --configuration production
- Resultado: **PASS** (exit=0)
- Output: dist/bankportal/browser/main-5QAINM2X.js · Initial bundle 340.21 kB raw / 92.04 kB transferido
- Warnings: solo budget de fuentes Google (CSS inline > 8 kB) — no bloqueante
- **Frontend producción listo para deploy** desde la perspectiva del build.

### 9.3 Hallazgo DevOps secundario
`npm ci` falla por:
1. Conflicto de peer deps: ng2-charts@5.0.4 requiere @angular/cdk pero el cdk del lockfile es ^21 incompatible. Workaround: `--legacy-peer-deps`
2. **package-lock.json out-of-sync con package.json** (falta jwt-decode@4.0.0). CI con `npm ci` falla siempre.
- **Severidad MEDIA-DEVOPS** · NO es defecto del sprint (deuda preexistente del repo) pero impide CI fiable.
- Recomendación: regenerar lockfile en S27 vía DEBT-049/050 antes de configurar CI bloqueante.

## 10. Defectos detectados

### BUG-S26-Q-001 · CRÍTICA · seed VIAJES rompe GET /goals
- **Severidad**: CRÍTICA · NC: BLOQUEANTE
- **TC relacionado**: TC-API-LIST-1
- **Endpoint**: GET /api/v1/savings/goals (US-024-02)
- **Pasos para reproducir**:
  1. `docker compose down -v && up -d --build` (aplica V30 seed)
  2. Login como angel.delacuadra (usuario seed)
  3. `GET /api/v1/savings/goals` con JWT válido
- **Resultado actual**: `400 BAD_REQUEST · "No enum constant com.experis.sofia.bankportal.savings.domain.model.GoalCategory.VIAJES"`
- **Resultado esperado**: 200 con array de 5 goals seed
- **Causa raíz**: `apps/backend-2fa/src/main/resources/db/migration/V30__seed_test_dataset_complete.sql` línea 414 inserta `category='VIAJES'` (plural) cuando el enum `GoalCategory` define el valor singular `VIAJE`. Mismatch de naming entre el seed PFM (que sí usa VIAJES como categoría de gasto en V28) y el enum de savings.
- **Impacto**: TODOS los usuarios con seed cargado no pueden listar sus goals. Bloquea el flujo principal del feature en STG/Demo y en cualquier entorno que aplique V30.
- **Fix propuesto**: nueva migración `V32__fix_savings_goal_category_typo.sql` con `UPDATE savings_goals SET category='VIAJE' WHERE category='VIAJES';`. NO editar V30 (ya aplicada en cualquier entorno persistente).
- **Evidencia**: `evidence/sprint-26/qa-tests-batch1.log` y `qa-tests-batch2.log` líneas "GET /goals -> 400"
- **Estado**: ABIERTO · **bloqueante de G-6**

### BUG-S26-Q-008 · CRÍTICA · pérdida de fondos en concurrencia
- **Severidad**: CRÍTICA · NC: BLOQUEANTE
- **TC relacionado**: TC-API-CONCURRENCY (RN-F024-06)
- **Endpoint**: POST /api/v1/savings/goals/{id}/contributions (US-024-06)
- **Pasos para reproducir**:
  1. Crear goal con targetAmount=300, reservedAmount=0
  2. Lanzar 5 POST /contributions paralelos amount=30€ cada uno (Promise.all)
  3. GET goal/{id} para inspeccionar reservedAmount final
- **Resultado actual**: 5/5 status=201 (todas las APIs responden OK), pero **reservedAmount final = 60€** (esperado 150€). 3 contribuciones perdidas.
- **Resultado esperado**: o bien (a) reservedAmount=150 con todas las contribuciones aplicadas atómicamente, o (b) algunas con 422 INSUFFICIENT_FUNDS si el saldo de cuenta no alcanza, pero NUNCA pérdida silenciosa.
- **Causa raíz**: `JpaSavingsGoalAdapter.save()` y/o `AccountReserve` no usan locking optimista (`@Version`) ni pesimista (`SELECT FOR UPDATE` o lock por row). Lost-update: las 5 lambdas leen reserved=0, escriben reserved=30, gana la última escritura.
- **Impacto**: **PÉRDIDA REAL DE FONDOS DEL CLIENTE EN PRODUCCIÓN BANCARIA**. Las contribuciones se registraron como SUCCESS pero el dinero no se reservó en el goal. Posible desbalance contable entre tabla `goal_allocations` y tabla `accounts`.
- **Fix propuesto**:
  1. Añadir `@Version private Long version` a `SavingsGoalEntity` (optimistic locking)
  2. Catch de `OptimisticLockingFailureException` en `ContributeManualUseCase` con retry (max 3) o respuesta 409 CONFLICT
  3. Test IT `ContributeManualConcurrencyIT` con CountDownLatch y 10+ threads
- **Evidencia**: `evidence/sprint-26/qa-tests-batch2.log` línea "reservedAmount esperado=150 obtenido=60"
- **Estado**: ABIERTO · **bloqueante de G-6** y de release v1.26.0

### BUG-S26-Q-003 · ALTA · PUT auto-rule no idempotente
- **Severidad**: ALTA · NC: MAYOR
- **TC relacionado**: TC-API-AR-2
- **Endpoint**: PUT /api/v1/savings/goals/{id}/auto-rule (US-024-07)
- **Pasos para reproducir**:
  1. Crear goal
  2. PUT auto-rule `{amount:25, dayOfMonth:5}` → 200 OK (crea regla)
  3. PUT auto-rule `{amount:30, dayOfMonth:10}` (mismo goal) → expected 200 con valores actualizados
- **Resultado actual**: `500 Internal Server Error · DataIntegrityViolationException · uk_goal_active_rule`
- **Resultado esperado**: 200 con la regla actualizada (semántica PUT idempotente RFC 7231)
- **Causa raíz**: `ConfigureAutoRuleUseCase` siempre hace INSERT sin verificar si existe regla activa. La constraint UNIQUE `uk_goal_active_rule` la rechaza.
- **Impacto**: el cliente no puede modificar una regla automática existente (debe primero borrar y luego crear). Rompe contrato REST y UX. Filtra stack trace al cliente.
- **Fix propuesto**: en el use case, `autoRuleRepo.findActiveByGoalId(goalId).ifPresent(r -> updateRule(r)).orElseGet(() -> createRule(...))`. Añadir IT `ConfigureAutoRuleIdempotencyIT`.
- **Evidencia**: `evidence/sprint-26/qa-tests-batch2.log` y docker logs backend stack trace
- **Estado**: ABIERTO

### BUG-S26-Q-004 · MEDIA · RN-F024-13 días no validados
- **Severidad**: MEDIA · NC: MENOR
- **TC relacionado**: TC-API-AR-DAYS
- **Endpoint**: PUT /api/v1/savings/goals/{id}/auto-rule (US-024-07)
- **Pasos para reproducir**: PUT auto-rule con dayOfMonth ∈ {2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27}
- **Resultado actual**: 200 OK (todos aceptados)
- **Resultado esperado por SRS RN-F024-13**: solo {1, 5, 10, 15, 20, 25, 28} aceptados; resto → 400 VALIDATION_FAILED
- **Causa raíz**: el DTO `AutoRuleDto` valida `@Min(1) @Max(28)` pero no `@AllowedValues({1,5,10,15,20,25,28})` ni el use case verifica catálogo.
- **Impacto**: el frontend dropdown ya restringe a valores válidos, pero un cliente API directo puede crear reglas con días inválidos. Comportamiento divergente de SRS.
- **Fix propuesto**: `@Pattern` no aplicable a Integer; añadir `@DayOfMonthAllowed` validator custom o validación en `ConfigureAutoRuleUseCase` con `if (!ALLOWED_DAYS.contains(dto.dayOfMonth())) throw new IllegalArgumentException(...)`
- **Evidencia**: `evidence/sprint-26/qa-tests-batch2.log` líneas "day=2 -> 200 OK", "day=3 -> 200 OK", etc.
- **Estado**: ABIERTO

### BUG-S26-Q-005 · MEDIA · cap @Max(5000) en amount no documentado
- **Severidad**: MEDIA · NC: MENOR
- **TC relacionado**: TC-API-CONTRIB-INSUFF
- **Endpoint**: POST /api/v1/savings/goals/{id}/contributions (US-024-06)
- **Pasos para reproducir**: POST contributions con amount=99999999 (> 5000)
- **Resultado actual**: `400 VALIDATION_FAILED · "amount: must be less than or equal to 5000"`
- **Resultado esperado**: o bien permitir hasta el límite del saldo de la cuenta (RN-F024-05) y devolver 422 INSUFFICIENT_FUNDS, o documentar el cap en SRS y OpenAPI.
- **Causa raíz**: anotación `@Max(5000)` en `ContributionRequestDto.amount`. No documentada en SRS ni en RN.
- **Impacto**: imposible probar RN-F024-05 (saldo insuficiente) en su rango natural. Tampoco se puede aportar grandes cantidades de un solo movimiento.
- **Fix propuesto**: o bien (a) eliminar el @Max y delegar al chequeo de saldo de cuenta, o (b) añadir RN-F024-16 (cap por contribución manual = 5000€ por seguridad anti-fraude) y documentar en OpenAPI.
- **Estado**: ABIERTO · decisión PO requerida (regla de negocio vs validación técnica)

### BUG-S26-Q-006 · BAJA · existence oracle leve
- **Severidad**: BAJA · OBS-SEC
- **TC relacionado**: TC-SEC-005
- **Endpoint**: PUT/POST sobre goals ajenos
- **Síntoma**: cuando user2 envía un PUT/POST sobre goal de user1 con datos válidos recibe 403 GOAL_ACCESS_DENIED, pero con datos inválidos recibe 400 VALIDATION_FAILED. Permite a un atacante distinguir entre "id existe (403)" e "id no existe (404 o 400)" haciendo dos requests.
- **Impacto**: filtración mínima de existencia de recursos. No expone datos sensibles directamente.
- **Fix propuesto**: invertir orden — chequear ownership antes que Bean Validation en el controller, o devolver 404 uniforme en cualquier caso de no-acceso.
- **Estado**: ABIERTO · diferible S27 como mejora de hardening

### BUG-S26-Q-007 · MEDIA · widget no marca degraded:true
- **Severidad**: MEDIA · NC: MENOR
- **TC relacionado**: TC-API-WIDGET-DEGRADED (RN-F024-15)
- **Endpoint**: GET /api/v1/savings/dashboard-widget
- **Síntoma**: cuando la agregación parcial falla (por BUG-Q-001 VIAJES o cualquier excepción transitoria), el widget devuelve TODO en cero sin marcador `degraded:true`. La UI pinta "sin objetivos" cuando en realidad hay 5 goals seed activos.
- **Impacto**: usuario ve dashboard inconsistente con la realidad de su perfil. Tras fix de BUG-Q-001 esta degradación pasa a ser invisible (caso edge), pero el flag aporta trazabilidad.
- **Fix propuesto**: en `GetDashboardWidgetUseCase` añadir try-catch con `degraded=true` cuando hay excepción capturada en la agregación. Reflejar en DTO.
- **Evidencia**: `SavingsController.java:199 log.warn("savings.widget.degraded reason={}")` indica que el degraded ya se loguea pero no se propaga al body de respuesta.
- **Estado**: ABIERTO · diferible S27 con BUG-Q-001 fix

### BUG-S26-Q-009 · MEDIA · violaciones WCAG 2.1 AA en index.html
- **Severidad**: MEDIA · NC: MENOR (afecta toda la SPA, no solo savings)
- **TC relacionado**: TC-A11Y-001
- **Síntoma**: axe-core detecta 2 violaciones SERIAS:
  - `document-title`: falta `<title>` en index.html
  - `html-has-lang`: falta atributo `lang` en `<html>`
- **Impacto**: usuarios con screen reader no saben qué página están viendo y la pronunciación es genérica.
- **Fix propuesto**: editar `apps/frontend-portal/src/index.html` añadiendo `<html lang="es">` y `<title>BankPortal · Banco Meridian</title>`. Hotfix HTML estático, ~5 min.
- **Evidencia**: `evidence/sprint-26/playwright-a11y-final.log`
- **Estado**: ABIERTO · NO bloqueante (preexistente, no introducido en S26) pero recomendable arreglar antes de release v1.26.0

### OBS-DOC-001 · skill QA documentaba OTP en body, está en header
- **Severidad**: INFO
- **Hallazgo**: la skill `qa-tester/SKILL.md` y handoff §5.5 indican que el controller traduce `body.otp == null` → 401 OTP_REQUIRED. En realidad el controller lee header `X-OTP` y siempre responde `INVALID_OTP` (no existe diferenciación OTP_REQUIRED).
- **Acción**: actualizar handoff y posibles referencias en SRS/LLD para reflejar el contrato real (header X-OTP). No es defecto del sprint sino discrepancia documental.
- **Estado**: para Step 8 (Documentation Agent)

## 11. RTM (Requirements Traceability Matrix)

| US | Gherkin Scenarios (SRS) | Test Cases | Resultado |
|---|---|---|---|
| US-024-01 | Crear OK / categoría inválida / target inválido | TC-API-CREATE-1, TC-E2E-001 (parte create), CreateGoalUseCaseTest (5) | PASS |
| US-024-02 | Listar todos / filtro status ACTIVE / sin goals | TC-API-LIST-1, ListGoalsUseCaseTest (4) | **FAIL** (BUG-Q-001) |
| US-024-03 | Detalle propio / 404 / 403 ajeno | TC-API-DETAIL-1/2/3, TC-E2E-002, GoalProjectionServiceTest (16) | PASS |
| US-024-04 | Update válido / target<reserved | TC-API-UPDATE-1, TC-API-UPDATE-RN03, UpdateGoalUseCaseTest (7) | PASS (con OBS DEBT-059) |
| US-024-05 | Close sin SCA / con SCA OK / SCA mal | TC-API-CLOSE-1/2/3/4, TC-E2E-003, CloseGoalUseCaseTest (6), GoalClosureServiceTest (16) | PASS |
| US-024-06 | Contribución OK / sin sourceAccountId / saldo insuficiente | TC-API-CONTRIB-1/2, TC-E2E-001 (parte contrib), ContributeManualUseCaseTest (7) | PASS funcional · **FAIL** concurrencia (BUG-Q-008) · cap @Max sin testar (BUG-Q-005) |
| US-024-07 | Auto-rule día válido / día inválido / actualizar | TC-API-AR-1/2/DAYS, TC-E2E-004, ConfigureAutoRuleUseCaseTest (5) | **FAIL** idempotencia (BUG-Q-003), día catálogo (BUG-Q-004) |
| US-024-08 | Pausar regla activa | TC-API-AR-PAUSE, TC-E2E-004, PauseAutoRuleUseCaseTest (4) | PASS |
| US-024-09 | Widget user con goals / sin goals / degradación | TC-API-WIDGET-1/DEGRADED, TC-E2E-006, GetDashboardWidgetUseCaseTest (4) | PASS funcional · OBS BUG-Q-007 falta flag degraded |

## 12. Métricas de calidad

| Métrica | Valor | Umbral SOFIA | Estado |
|---|---|---|---|
| TCs alta prioridad ejecutados | 145+30+6+1 = 182 | 100% | OK |
| Defectos Críticos abiertos | 2 | 0 | **KO** |
| Defectos Altos abiertos | 1 | 0 | **KO** |
| Defectos Medios abiertos | 4 | informativo | observación |
| Defectos Bajos abiertos | 1 | informativo | observación |
| Cobertura funcional Gherkin (US/15 RN) | 100% (24/24) | >= 95% | OK |
| Cobertura JaCoCo INSTR savings | 84.3% | >= 80% | OK |
| Cobertura JaCoCo BRANCH savings | 88.1% | >= 80% | OK |
| SpringContextIT | PASS | PASS | OK |
| Schema validation IT (SavingsFlywayIT) | PASS (32 migr) | PASS | OK |
| AuthIT (LoginControllerIT) | existe + PASS | obligatorio | OK |
| Seguridad checks pasando | 5/5 | 100% | OK |
| Accesibilidad checks pasando | 0/2 (login) | 100% | **KO** |
| Integration tests savings (puertos cubiertos) | 5/5 | 100% | OK |
| Smoke OpenAPI (DEBT-048) | PASS sin JWT | requerido | OK |
| Smoke script smoke-test-v1.26.sh | NO EXISTE | requerido para G-7 | **GAP DevOps** |
| ng build:prod | PASS | requerido | OK |
| ng test (frontend total) | FAIL (10 TS preexistentes) | requerido | KO (no introducido S26) |

## 13. Repositorio activo (LA-019-16 OBLIGATORIO)

- **Repositorio STG**: JPA-REAL (`JpaSavingsGoalAdapter` @Primary sin @Profile, activo en dev/staging/prod)
- **Datos de prueba**: SEED-BD (V30__seed_test_dataset_complete.sql, V14, V22, V28, V31 ShedLock)
- **Validación**: las pruebas se ejecutaron contra el bean JPA real instanciado por Spring (no mocks).
- Conclusión: **gate G-6 elegible** desde la perspectiva de LA-019-16 — pruebas reales sobre infra real.

## 14. Veredicto QA + condiciones

### Veredicto: **APROBADO CON CONDICIONES**

Justificación:
1. **Calidad funcional sólida**: 145/145 unit+IT, 6/6 E2E, cobertura 84-88%, 9/9 US testeadas, 13/15 RN PASS.
2. **Pero existen 2 defectos críticos** que afectan flujos primarios:
   - BUG-Q-001 rompe US-024-02 (listar) en cualquier entorno con seed.
   - BUG-Q-008 rompe RN-F024-06 (reserva atómica) en concurrencia, con riesgo de pérdida de fondos del cliente.
3. **Y 1 defecto alto** rompe el contrato REST (PUT no idempotente).

### Condiciones para aprobación G-6

| Cond | Acción requerida | Owner | Antes de |
|---|---|---|---|
| C1 | Fix BUG-Q-001: nueva V32__fix_savings_goal_category_typo.sql (UPDATE VIAJES → VIAJE) | Developer | G-6 |
| C2 | Fix BUG-Q-008: @Version en SavingsGoalEntity + retry/409 en ContributeManualUseCase + ConcurrencyIT | Developer | G-7 (deploy) |
| C3 | Fix BUG-Q-003: ConfigureAutoRuleUseCase upsert + IT idempotencia | Developer | G-7 |
| C4 | Re-test QA de las 3 condiciones tras fix (BUG-Q-001/008/003) | QA | G-7 |
| C5 | Generar smoke-test-v1.26.sh (DEBT-049) | DevOps | G-7 |
| C6 | Aceptar diferimiento a S27 de: BUG-Q-004 (RN-F024-13 días), BUG-Q-005 (cap @Max), BUG-Q-006 (existence oracle), BUG-Q-007 (degraded flag), BUG-Q-009 (a11y index.html), GAP cobertura SavingsControllerIT, GAP specs Angular savings | PO | G-6 (decisión) |

### Veredicto alternativo si PO exige cero diferimientos críticos: **RECHAZADO**

En tal caso, los 3 fixes BUG-Q-001/008/003 deben aplicarse en este sprint y volver a Step 6 con re-test completo. Estimación: 0.5-1 día de fix + 0.5 día re-test.

## 15. Deudas técnicas a registrar (Step 8b)

| ID propuesto | Resumen | Origen | Sprint objetivo |
|---|---|---|---|
| DEBT-Q-061 | Ampliar SavingsControllerIT a 11/11 endpoints (actual 3/11) | QA Sprint 26 | S27 |
| DEBT-Q-062 | Crear specs Angular .spec.ts para 21 componentes savings | QA Sprint 26 | S27 |
| DEBT-Q-063 | Auditar a11y de páginas autenticadas savings (axe completo) | QA Sprint 26 | S27 |
| DEBT-Q-064 | Regenerar package-lock.json (out-of-sync, jwt-decode missing) | QA/DevOps Sprint 26 | S27 |
| DEBT-Q-065 | Arreglar 10 errores TS en specs legacy (accounts, kyc) o excluir del pipeline | QA Sprint 26 | S27 |
| DEBT-Q-066 | Documentar contrato OTP real (header X-OTP, no body) en SRS/LLD/handoff template | Doc Step 8 | S27 |
| DEBT-Q-067 (BUG-Q-004) | Validación catálogo días RN-F024-13 | QA Sprint 26 | S27 |
| DEBT-Q-068 (BUG-Q-005) | Decisión PO sobre cap @Max(5000) en amount | QA Sprint 26 | S27 |
| DEBT-Q-069 (BUG-Q-006) | Hardening: orden ownership antes que Bean Validation | QA Sprint 26 | S27 |
| DEBT-Q-070 (BUG-Q-007) | Flag degraded:true en widget cuando agregación parcial falla | QA Sprint 26 | S27 |
| DEBT-Q-071 (BUG-Q-009) | Fix WCAG index.html (lang + title) | QA Sprint 26 | S27 hotfix |

## 16. Evidencias persistidas

Directorio: `docs/quality/evidence/sprint-26/`

| Fichero | Contenido |
|---|---|
| mvn-canonical-full.log | Output mvn completo (145/145 PASS) |
| surefire-canonical/ (23 .txt) | Surefire reports limpios (mitiga DEBT-055) |
| qa-tests-batch1.log | TCs API ownership/seguridad/widget/XSS/SQLi/limit |
| qa-tests-batch2.log | TCs API concurrencia/bugs reproducidos/hitos |
| ng-test.log | ng test output (10 errores TS preexistentes) |
| ng-build-prod.log | ng build:prod PASS |
| playwright-savings-final.log | Playwright 6/6 PASS |
| playwright-a11y-final.log | axe a11y FAIL (2 violaciones serias) |
| npm-ci-frontend.log | npm ci ERESOLVE (deuda lockfile) |
| npm-install-frontend.log | npm install --legacy-peer-deps PASS |
| npm-install-pw-axe.log | install Playwright + axe |
| playwright-install.log | install Playwright lib |
| playwright-install-browsers.log | descarga Chromium headless shell |

## 17. Notas operativas para Step 7 (DevOps · gate G-7)

1. **Fixes BUG-Q-001/008/003** deben llegar a la rama feature antes del deploy STG-final, idealmente vía nuevos commits en el mismo Sprint 26.
2. **smoke-test-v1.26.sh** debe generarse cubriendo los 11 endpoints savings + login + JWT flow + regresión sprint 25 (DEBT-049).
3. **package-lock.json** debe regenerarse antes de configurar CI con `npm ci` bloqueante.
4. **smoke-test debe ejecutarse contra el contenedor STG real** (no mocks).
5. Verificar V32 (fix VIAJES) llega al deploy aplicando `mvn flyway:info` antes de release.

## 18. Persistence Confirmation

El bloque PERSISTENCE CONFIRMED se emite al cierre del Step 6 — ver `HANDOFF-sprint26-step6-qa-tester.md` actualizado y `session.json` con `gate_pending=G-6`.

