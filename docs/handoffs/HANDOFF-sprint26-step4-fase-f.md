# HANDOFF — Sprint 26 · FEAT-024 · Step 4 · Fase F

**Generado:** 2026-04-27T19:35Z
**Origen:** chat anterior (Fases A+B+C+D+E completadas y verificadas)
**Destino:** chat nuevo (continuar desde Fase F)
**Sprint:** 26 · **Feature:** FEAT-024 Objetivos de Ahorro · **Release:** v1.26.0
**Handoff anterior:** docs/handoffs/HANDOFF-sprint26-step4-fase-d.md

---

## 1. Contexto inmediato

Estás continuando **Step 4 (Developer)** del pipeline SOFIA tras completar **Fases A+B+C+D+E**. El pipeline está pausado por handoff (cierre voluntario tras verificación Fase E). Tu trabajo: arrancar **Fase F (Tests)** y continuar hasta **Fase H (G-4b)**.

**Lo que SÍ está hecho:**
- Backend completo en disco: domain + application + infrastructure + API (52 archivos · ~3,200 líneas)
- DEBT-048 cerrada (springdoc 2.3.0 añadido al pom.xml en Fase E)
- session.json actualizado con artifacts D+E + LA-026-05 (decisión snapshot)

**Lo que NO está hecho:**
- Ningún mvn compile ejecutado todavía (no se hace hasta Fase H · G-4b)
- Ningún test escrito
- Frontend no tocado
- SecurityConfig no verificado (deuda Fase H)

---

## 2. Estado del pipeline

Sprint 26 · FEAT-024
- Step 1 ✅ G-1 PO 2026-04-21
- Step 2 ✅ G-2 PO 2026-04-22
- Step 2b ✅ G-2b AUTO 2026-04-26
- Step 2c ✅ HITL PO+TL 2026-04-27
- Step 3 ✅ G-3 TL 2026-04-27
- Step 3b ✅ G-3b AUTO 2026-04-27
- Step 4 🟡 EN PROGRESO
  - Fase A ✅ Domain layer + DDL (19 Java + V29 SQL · ~720 líneas)
  - Fase B ✅ Domain services (3 services + SavingsGoal extendido · ~370 líneas)
  - Fase C ✅ Application (10 UCs + 13 records · ~925 líneas)
  - Fase D ✅ Infrastructure (14 archivos · ~853 líneas)
  - Fase E ✅ API (3 nuevos + 2 modificados · ~330 líneas · DEBT-048 CLOSED)
  - Fase F ⏳ Tests (~15 unit + 5-7 IT)
  - Fase G ⏳ Frontend (18 componentes Angular)
  - Fase H ⏳ G-4b guardrail (mvn compile + tests + Docker + checklist fidelidad)
- Steps 5-9 ⏳ pendientes

**Decisiones PO heredadas (NO re-preguntar):**
- Modo: fase por fase con confirmación entre cada una
- Tests Fase F: completos según LLD §12 (~15 unit + 5-7 IT)
- Frontend Fase G: 18 componentes completos según LLD §5

---

## 3. Lo que hay PERSISTIDO en disco

### Backend (52 archivos · ~3,200 líneas)

**Fase A — Domain + DDL (19 Java + 1 SQL):** savings/domain/{model 8 + exception 6 + repository 4} · account/domain/AccountReservePort.java · db/migration/V29__savings_goals.sql

**Fase B — Domain Services (3 services + SavingsGoal extendido):** GoalProjectionService.java (84 líneas) · MilestoneEvaluator.java (92 líneas · idempotencia doble) · GoalClosureService.java (98 líneas · @Value sca-threshold)

**Fase C — Application (10 UCs + 13 records):** SavingsDtos.java (143 líneas · 13 records · 15 jakarta.validation) + 10 use cases (CreateGoal, ListGoals, GetGoalDetail, UpdateGoal, CloseGoal, ContributeManual, ConfigureAutoRule, PauseAutoRule, GetDashboardWidget, ProcessAutoRule)

**Fase D — Infrastructure (14 archivos · 853 líneas):** savings/infrastructure/persistence/{entity 4, jpa 4, adapter 4} + scheduler/AutoContributionScheduler.java (@SchedulerLock · ADR-041) + account/infrastructure/JpaAccountReserveAdapter.java (JdbcClient SQL nativo · @Transactional MANDATORY)

**Fase E — API (3 nuevos + 2 modificados · 330 líneas):**
- savings/api/exception/SavingsExceptionHandler.java (107 líneas · scoped basePackages=savings · 10 mappers HTTP)
- savings/api/controller/SavingsController.java (190 líneas · 11 endpoints · base /api/v1/savings)
- src/main/resources/application.yml (MODIFICADO +28 líneas · bank.savings.* + springdoc:*)
- src/main/resources/application-prod.yml (NUEVO 13 líneas · ADR-042 endurece api-docs+swagger-ui=false)
- pom.xml (MODIFICADO +8 líneas · springdoc-openapi-starter-webmvc-ui:2.3.0)

### Documentación arquitectura
- docs/architecture/sprint-26/HLD-FEAT-024-sprint26.md (10 KB)
- docs/architecture/sprint-26/LLD-backend-FEAT-024-sprint26.md (28.3 KB · §12 estrategia tests)
- docs/architecture/sprint-26/LLD-frontend-FEAT-024-sprint26.md (15 KB)
- docs/architecture/adr/ADR-040-savings-segregacion-virtual-alpha.md (retained_balance)
- docs/architecture/adr/ADR-041-savings-scheduled-shedlock.md (cron + ShedLock)
- docs/architecture/adr/ADR-042-openapi-springdoc-2.3.md (DEBT-048 CLOSED)
- docs/handoffs/HANDOFF-sprint26-step4-fase-d.md (handoff anterior)

### Snapshots
- .sofia/snapshots/session-sprint26-step4-phaseABC-2026-04-27T14-08-44-095Z.json (íntegro · 91 KB)

> **NOTA snapshots:** se decidió NO generar snapshot phaseDE (ver LA-026-05 en session.lessons_learned). git history + snapshot phaseABC + el siguiente commit cubren la trazabilidad. Decisión PO documentada.

---

## 4. PASO 0 OBLIGATORIO al arrancar el nuevo chat

Aplica regla **LA-018-01** (CLAUDE.md) + **GR-GIT-001** (LA-CORE-061):

1. Lee estado del pipeline: `cat .sofia/session.json | head -100`
2. Verifica step4_progress (debe mostrar A-E completadas):
   `python3 -c "import json; d=json.load(open('.sofia/session.json')); print('completadas:', d['step4_progress']['phases_completed']); print('pendientes:', d['step4_progress']['phases_remaining']); print('files_persisted:', d['step4_progress']['files_persisted'])"`
3. Verifica integridad working tree (GR-GIT-001 / LA-CORE-061):
   `git status --porcelain | grep "^ D" | wc -l` debe ser 0
4. Confirma branch: `git branch --show-current` debe ser feature/FEAT-024-sprint26
5. Lee este handoff completo: `cat docs/handoffs/HANDOFF-sprint26-step4-fase-f.md`
6. Lee LLD §12 (estrategia de tests) y §13 (riesgos):
   `sed -n '/^## 12\./,/^## 13\./p' docs/architecture/sprint-26/LLD-backend-FEAT-024-sprint26.md`

---

## 5. Fase F — Tests (siguiente trabajo)

### Inventario esperado: ~15 unit tests + 5-7 ITs (~20 archivos)

#### F.1 — Unit tests dominio (3 archivos)
Ubicación: apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/savings/domain/

- **SavingsGoalTest.java** — invariantes del agregado: reserve()/release() suma/resta a reservedAmount con guards null/signum/exceeds-target · canBeClosed() solo si status ∈ {ACTIVE, PAUSED} · progressPercent() con HALF_UP · transición a COMPLETED cuando reservedAmount == targetAmount
- **MilestoneEvaluatorTest.java** — idempotencia + thresholds: evaluate(24)→0, evaluate(25)→1, evaluate(74)→2 (25,50), evaluate(100)→4 · re-ejecución no duplica (existsByGoalIdAndPercent + catch DataIntegrityViolationException)
- **GoalProjectionServiceTest.java** — projectedCompletionDate con monthlyContribution=0→null · suggestedMonthlyContribution targetDate pasada→IllegalArgument · isAtRisk→true si projectedDate > targetDate

#### F.2 — Unit tests servicios (1 archivo)
- **GoalClosureServiceTest.java**: requiresSca con scaThreshold=30, reservedAmount=29.99→false, =30.00→true · close() preserva reservedAmount (RN-F024-13 retención 6 años) · idempotente

#### F.3 — Unit tests Use Cases (8 archivos · @Mock con Mockito)
Ubicación: .../savings/application/usecase/

- **CreateGoalUseCaseTest** TC-F024-001..005 — happy path · max 10 ACTIVE → MaxGoalsReachedException · validaciones @Min · setScale(2,HALF_UP)
- **ContributeManualUseCaseTest** TC-F024-010..015 — flujo: reserve→save SUCCESS→goal.reserve→milestone evaluator · InsufficientFunds propaga · allocationMonth=null en MANUAL · ownership check
- **ProcessAutoRuleUseCaseTest** TC-F024-020..028 — idempotencia mensual (2ª ejecución mismo mes→FAILED reason=DUPLICATE) · InsufficientFunds→FAILED no modifica reservedAmount · goal.reserve falla→release de cuenta + FAILED reason=GOAL_TARGET_EXCEEDED (compensación) · updateNextExecution SIEMPRE · REQUIRES_NEW
- **CloseGoalUseCaseTest** TC-F024-030..033 — sin OTP si <30 · OTP requerido si >=30, inválido→InvalidOtpException · ownership · CLOSED→IllegalStateException
- **ConfigureAutoRuleUseCaseTest** TC-F024-040..043 — primera regla active=true · reemplazar regla existente desactiva anterior ANTES de crear nueva (UK active=true parcial) · dayOfMonth=31 en febrero→Math.min con lengthOfMonth→28 · ownership
- **PauseAutoRuleUseCaseTest** TC-F024-045..046 — active=true→false (idempotente) · sin regla activa→no-op silencioso
- **UpdateGoalUseCaseTest** TC-F024-050..053 — happy path · nuevo targetAmount < reservedAmount→ReservedExceedsTargetException · status PUT solo ACTIVE/PAUSED · ownership
- **GetDashboardWidgetUseCaseTest** TC-F024-060..062 — top 3 por progressPercent desc · totalReservedAmount agregado · empty user→widget vacío

#### F.4 — Tests de integración (5-7 archivos · @SpringBootTest)
Ubicación: .../savings/

- **SavingsControllerIT.java** — JWT real→401 sin token · GET /goals→200 · POST→201 · GET other user→403 · POST contributions con InsufficientFunds→422 · DELETE con reservedAmount>30 sin OTP→401 · DELETE con OTP válido→200 · GET dashboard-widget→200 con degradación elegante (LA-CORE-046)
- **AutoContributionSchedulerIT.java** — bank.savings.auto.cron=*/2 * * * * * en application-test.yml · rule due→executor procesa→allocation persiste SUCCESS · 2 instancias → @SchedulerLock asegura ejecución única (LockProvider con Redis testcontainer) · rule failed→next_execution_at avanza igualmente
- **SavingsGoalInvariantIT.java** — UK active=true parcial · UK idempotencia mensual · account_balances soft-constraint con concurrencia 2 threads
- **JpaAccountReserveAdapterIT.java** — reserve actualiza available + retained atómicamente · release inversa · transferReserved solo decrementa retained · saldo insuficiente→0 affected rows
- **MilestoneEmissionIT.java** — evaluate concurrente desde 2 hilos→solo 1 milestone persistido (UK atrapa el 2º)

**Convenciones tests (LA-TEST-001/002/003):**
- @SpringBootTest(webEnvironment = RANDOM_PORT) para ITs
- @AutoConfigureMockMvc para controller tests
- Fixtures con @Sql o @Transactional rollback
- Datos seed en src/test/resources/data-savings-test.sql
- Mockito para unit tests; nunca mock de domain entities (usar fixtures reales)
- Aserciones AssertJ (consistente con bizum/pfm tests existentes)

**Patrones de referencia (LEER ANTES de escribir tests):**
- pfm/PfmCategorizationServiceTest.java — unit test servicio
- pfm/PfmControllerIT.java — IT controller
- bizum/SendPaymentUseCaseTest.java — unit test UC con Mockito
- deposit/IrpfRetentionCalculatorTest.java — unit test domain service

---

## 6. Decisiones que ya están tomadas (NO re-preguntes al PO)

| Decisión | Resolución |
|---|---|
| Modo de ejecución | Fase por fase con confirmación entre cada una |
| Tests Fase F | Completos según LLD §12 (~15 unit + 5-7 IT) |
| Frontend Fase G | 18 componentes completos según LLD §5 |
| Patrón infra savings | JPA Entity + Adapter delegado (Fase D) |
| JpaAccountReserveAdapter | JdbcClient SQL nativo @Transactional(MANDATORY) |
| SavingsReserveAdapter | SKIPPED (UCs inyectan AccountReservePort directo) |
| springdoc 2.3.0 en pom | AÑADIDO en Fase E (DEBT-048 CLOSED) |
| application-prod.yml | ENDURECIMIENTO: api-docs+swagger-ui=false |
| @RestControllerAdvice scope | basePackages=savings (LA-TEST-003) |
| userId en controllers | request.getAttribute("authenticatedUserId") (LA-TEST-001) |
| Snapshot phaseDE | OMITIDO conscientemente (ver LA-026-05) |

---

## 7. Reglas/lecciones aplicables a partir de aquí

- **LA-CORE-053** — schema-drift-sql-native: ya verificado V10 account_balances DECIMAL(15,2). Re-aplicar si tests tocan SQL nativo de otras tablas.
- **LA-CORE-054** — instant-timestamptz-binding: Timestamp.from(instant) en JdbcClient. Aplica si tests escriben a BD con @Sql.
- **LA-CORE-056** — prototype-fidelity-visual-review: BLOQUEANTE en G-4 (Fase G frontend, no afecta Fase F).
- **LA-CORE-061** — git-divergence-undetected: PASO 0 obligatorio.
- **LA-CORE-067** — mcp-shell-stdio-buffer-limit: artefactos > 8KB → fragmentar con appendFileSync o heredoc cat << 'EOF'. **CONFIRMADO EN ESTE HANDOFF:** primer intento write_file con ~17KB falló con timeout MCP de 4 minutos (2 veces consecutivas). Fragmentación en 2 bloques (~6KB cada uno via filesystem:write_file + heredoc append) lo resolvió. El límite efectivo parece estar entre 10-15KB.
- **LA-026-05** (NUEVA) — snapshot-intermedio-redundante: cuándo NO hace falta snapshot manual (git history cubre reversa).

**Hallazgos detectados en E (no bloqueantes pero a tener en cuenta para CR Step 5):**
- Olor de estilo: campos UC y métodos HTTP del controller comparten nombre (listGoals campo + listGoals método). Java legal pero un Reviewer puede sugerir prefijar campos como listGoalsUseCase.
- Drift menor LLD vs DDL: LLD §4 dice NUMERIC(12,2) para amounts pero V10 declara DECIMAL(15,2). Java BigDecimal compatible — no es bug, es nota para LLD post-Step 5.

**Deudas Fase H (G-4b smoke):**
- Verificar SecurityConfig deja pasar /v3/api-docs/** y /swagger-ui/** sin JWT. Si bloquea, añadir permitAll en Step 7 DevOps.

---

## 8. Comandos útiles

Inspeccionar estado pipeline:
- python3 -c "import json; d=json.load(open('.sofia/session.json')); print(json.dumps(d['step4_progress'], indent=2))"

Verificar archivos savings/ (debe ser ~47 .java):
- find apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/savings -name "*.java" | wc -l
- find apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/account -name "AccountReservePort.java" -o -name "JpaAccountReserveAdapter.java"
- ls apps/backend-2fa/src/main/resources/db/migration/ | grep V29

Ver tests existentes que sirven de plantilla:
- find apps/backend-2fa/src/test/java -name "*Test.java" -path "*pfm*" | head -5
- find apps/backend-2fa/src/test/java -name "*IT.java" | head -5

Ver patrones de fixtures @Sql:
- grep -r "@Sql" apps/backend-2fa/src/test --include="*.java" | head -10

Verificar GR-GIT-001 (debe ser 0):
- git status --porcelain | grep '^ D' | wc -l

Listar archivos modificados pendientes de commit:
- git status --short

---

## 9. Prompt sugerido para el nuevo chat

Hola. Continuo trabajo en bank-portal · Sprint 26 · FEAT-024 (Objetivos de Ahorro) · Step 4 Developer.

ESTADO ACTUAL:
- Fases A+B+C+D+E completadas y persistidas (52 archivos · ~3200 líneas Java/SQL/YAML)
- Fases F+G+H pendientes
- DEBT-048 CLOSED (springdoc 2.3.0 añadido al pom)
- Branch: feature/FEAT-024-sprint26
- session.json actualizado con artifacts D+E + LA-026-05 (decisión snapshot)

PASO 0 OBLIGATORIO antes de cualquier acción (LA-018-01 + LA-CORE-061 GR-GIT-001):
1. Leer .sofia/session.json íntegro
2. git status --porcelain | grep "^ D" | wc -l → debe ser 0
3. Leer docs/handoffs/HANDOFF-sprint26-step4-fase-f.md íntegro

OBJETIVO DE ESTA SESIÓN: arrancar Fase F (Tests) según LLD §12.
- ~15 tests unitarios (dominio + servicios + use cases)
- ~5-7 tests de integración (controller + scheduler + invariantes BD)

DECISIONES PO HEREDADAS (no preguntar de nuevo):
- Modo: fase por fase con confirmación
- Tests Fase F: completos según LLD §12
- Patrón infra savings: JPA Entity + Adapter delegado
- userId via request.getAttribute (LA-TEST-001)
- @RestControllerAdvice scoped (LA-TEST-003)

DEUDAS DETECTADAS PARA FASE H:
- SecurityConfig: comprobar si /v3/api-docs/** y /swagger-ui/** pasan JWT filter
- Schema-drift menor: LLD dice NUMERIC(12,2), V10 declara DECIMAL(15,2) - BigDecimal compatible

REGLA DE CONFIANZA: cambios costosos/irreversibles requieren ~95% confianza, en otro caso preguntar. Preguntas agrupadas en un único turno.

Cuando confirmes que has hecho el PASO 0, propones plan Fase F y arrancamos.

---

## 10. Salida esperada al cerrar Step 4

Cuando termines Fase H (G-4b):

- mvn -pl apps/backend-2fa compile → BUILD SUCCESS (0 warnings nuevos)
- mvn -pl apps/backend-2fa test → tests savings pass (≥15 unit + 5-7 IT)
- docker compose up -d → contenedores healthy
- actuator/health → {status:UP, db:UP, redis:UP}
- Flyway V29 aplicada (SELECT * FROM flyway_schema_history WHERE version='29')
- 4 tablas nuevas creadas: savings_goals, goal_allocations, goal_milestones, goal_auto_rules
- Frontend: npm run build → bundle savings/ generado
- Checklist fidelidad prototipo (LA-CORE-056) firmado por PO con screenshot comparison
- Persistencia en session.json.artifacts.4_s26_phase_f_tests + 4_s26_phase_g_frontend + 4_s26_phase_h_g4b
- Branch lista para git commit -m "FEAT-024 Sprint 26 Step 4 Developer"
- Pipeline avanza a Step 5 (Code Reviewer)

---

*HANDOFF generado por Claude (Opus 4.7) · 2026-04-27 · sesión 2 (chat anterior post-Fase E)*
*Snapshot strategy: ver LA-026-05 en session.lessons_learned para rationale del snapshot phaseDE omitido*
*Vía de creación: filesystem:write_file (fragmento 1 ~10KB) + cat append heredoc (fragmento 2) tras 2 timeouts MCP en intento monolítico ~17KB · LA-CORE-067 confirmada y refinada con dato cuantitativo*
