# HANDOFF - Sprint 26 - FEAT-024 - Step 4 - Fase G

**Generado:** 2026-04-28T13:55Z
**Origen:** chat anterior (Fases A+B+C+D+E+F completadas y commiteadas)
**Destino:** chat nuevo (continuar desde Fase G)
**Sprint:** 26 - **Feature:** FEAT-024 Objetivos de Ahorro - **Release:** v1.26.0
**Handoffs anteriores:** HANDOFF-sprint26-step4-fase-d.md, HANDOFF-sprint26-step4-fase-f.md

---

## 1. Contexto inmediato

Estas continuando Step 4 (Developer) del pipeline SOFIA tras completar Fases A+B+C+D+E+F. Tu trabajo: arrancar Fase G (Frontend Angular) y continuar hasta Fase H (G-4b guardrail).

**Lo que SI esta hecho:**
- Backend completo en disco: domain + application + infrastructure + API (52 archivos, ~3200 lineas) - commit 2c6c258
- 143 tests verde: 116 unit (commit 2c6c258) + 27 IT (commit 8eee244)
- DEBT-048 cerrada (springdoc 2.3.0 anadido en Fase E)
- BD del compose externo en V29 (savings_goals + 3 tablas creadas), fixture savings-test-fixtures.sql disponible
- session.json al dia con artifacts F + 3 deudas + 2 LAs nuevas + 4 observations_for_step5
- Working tree limpio, branch feature/FEAT-024-sprint26 al dia con HEAD 8eee244

**Lo que NO esta hecho:**
- Ningun componente Angular savings escrito todavia
- Ningun mvn compile global ejecutado (no se hace hasta Fase H, G-4b)
- DEBT-051 ShedLock sin abordar (Fase H)
- V18c shedlock no aplicada en BD (Fase H)
- SecurityConfig springdoc paths sin verificar (Fase H)

---

## 2. Estado del pipeline

Sprint 26 - FEAT-024
- Step 1 G-1 PO 2026-04-21
- Step 2 G-2 PO 2026-04-22
- Step 2b G-2b AUTO 2026-04-26
- Step 2c HITL PO+TL 2026-04-27
- Step 3 G-3 TL 2026-04-27
- Step 3b G-3b AUTO 2026-04-27
- Step 4 EN PROGRESO
  - Fase A Domain layer + DDL (19 Java + V29 SQL)
  - Fase B Domain services (3 services + SavingsGoal extendido)
  - Fase C Application (10 UCs + 13 records)
  - Fase D Infrastructure (14 archivos)
  - Fase E API (3 nuevos + 2 modificados, DEBT-048 CLOSED)
  - Fase F Tests 143/143 verde (116 unit + 27 IT)
  - Fase G PENDIENTE (este handoff)
  - Fase H PENDIENTE (G-4b guardrail)
- Steps 5-9 PENDIENTES

**Decisiones PO heredadas (NO re-preguntar):**
- Modo: fase por fase con confirmacion entre cada una
- Frontend Fase G: 18 componentes completos segun LLD seccion 5
- Patron de ITs: BizumIntegrationTestBase (compose externo, no Testcontainers - LA-026-08)

---

## 3. Lo que hay PERSISTIDO en disco

### Backend (52 archivos, ~3200 lineas) - commit 2c6c258
Identico al handoff Fase F seccion 3. Sin cambios desde entonces.

### Tests (commit 8eee244, 27 IT verde)
- apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/integration/SavingsIntegrationTestBase.java
- apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/savings/api/SavingsControllerIT.java (15 tests)
- apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/account/JpaAccountReserveAdapterIT.java (5 tests)
- apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/savings/SavingsFlywayIT.java (5 tests)
- apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/savings/AutoContributionSchedulerIT.java (1 test)
- apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/savings/MilestoneEmissionIT.java (1 test)
- apps/backend-2fa/src/test/resources/db/savings-test-fixtures.sql
- apps/backend-2fa/src/test/resources/application-integration-compose.yml MODIFIED (+22 lineas savings + jwt.session-ttl-seconds)

### Documentacion arquitectura (sin cambios desde Fase F)
- docs/architecture/sprint-26/HLD-FEAT-024-sprint26.md
- docs/architecture/sprint-26/LLD-backend-FEAT-024-sprint26.md (28.3 KB)
- **docs/architecture/sprint-26/LLD-frontend-FEAT-024-sprint26.md (15 KB) - CRITICO PARA FASE G**
- docs/architecture/adr/ADR-040-savings-segregacion-virtual-alpha.md
- docs/architecture/adr/ADR-041-savings-scheduled-shedlock.md
- docs/architecture/adr/ADR-042-openapi-springdoc-2.3.md

### Prototipo (BLOQUEANTE para fidelidad LA-CORE-056)
- **docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html (143.5 KB, 5 pantallas envueltas en shell completo, 22 anotaciones)** - REFERENCIA OBLIGATORIA POR COMPONENTE
- docs/ux-ui/UX-FEAT-024-sprint26.md
- docs/ux-ui/UX-DESIGN-SYSTEM.md (v1.1)

---

## 4. PASO 0 OBLIGATORIO al arrancar el nuevo chat

Aplica regla LA-018-01 (CLAUDE.md) + GR-GIT-001 (LA-CORE-061):

1. cat .sofia/session.json - leer estado completo
2. node -e "const s=require("./.sofia/session.json"); console.log(s.step4_progress.phases_completed, s.step4_progress.phases_remaining)"
3. git status --porcelain | grep "^ D" | wc -l (debe ser 0)
4. git branch --show-current (debe ser feature/FEAT-024-sprint26)
5. git log --oneline -3 (debe ver 8eee244 al principio)
6. cat docs/handoffs/HANDOFF-sprint26-step4-fase-g.md (este handoff completo)
7. cat docs/architecture/sprint-26/LLD-frontend-FEAT-024-sprint26.md (autoridad para Fase G)
8. ls docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html (verificar prototipo)
9. docker compose -f infra/compose/docker-compose.yml ps (postgres+redis deben estar UP, BD ya en V29)

---

## 5. Fase G - Frontend Angular (siguiente trabajo)

### Inventario: 18 componentes (LLD seccion 5)

| # | Componente | Tipo | Pantalla | US/RN |
|---|---|---|---|---|
| 1 | SavingsPageComponent | container | Shell con outlet | - |
| 2 | GoalListComponent | smart | Mis Objetivos | US-024-02 |
| 3 | GoalCardComponent | dumb | tarjeta lista | US-024-02 |
| 4 | GoalCreateFormComponent | smart | Crear objetivo | US-024-01 |
| 5 | GoalEditFormComponent | smart | Editar objetivo | US-024-06 |
| 6 | GoalDetailComponent | smart | Detalle objetivo | US-024-03 |
| 7 | GoalProgressBarComponent | dumb | barra reutilizable | US-024-02/03/08 |
| 8 | GoalProjectionBannerComponent | dumb | banner riesgo | RN-F024-08 |
| 9 | ContributionModalComponent | smart | modal aportacion | US-024-04 |
| 10 | ContributionHistoryComponent | smart | historico paginado | US-024-03 |
| 11 | AutoRuleFormComponent | smart | configurar regla | US-024-05 |
| 12 | AutoRuleSummaryComponent | dumb | resumen detalle | US-024-05 |
| 13 | GoalCloseModalComponent | smart | cerrar con SCA | US-024-06, RN-F024-11 |
| 14 | CategoryIconComponent | dumb | icono+color | RN-F024-07 |
| 15 | MilestoneToastComponent | smart | toast push hito | US-024-07 |
| 16 | SavingsWidgetComponent | smart | widget dashboard | US-024-08 |
| 17 | SavingsEmptyStateComponent | dumb | sin objetivos | UX |
| 18 | CategoryPickerComponent | dumb | picker en form | RN-F024-07 |

### Mapa pantalla -> endpoints

1. Lista de objetivos (GoalListComponent) -> GET /api/v1/savings/goals?status=ACTIVE
2. Crear objetivo (GoalCreateFormComponent) -> POST /api/v1/savings/goals
3. Detalle objetivo (GoalDetailComponent) -> GET /goals/{id}, GET /goals/{id}/contributions, GET /goals/{id}/milestones
4. Aportacion manual (ContributionModalComponent) -> POST /goals/{id}/contributions
5. Configurar regla auto (AutoRuleFormComponent) -> PUT /goals/{id}/auto-rule, DELETE /goals/{id}/auto-rule
6. Cerrar objetivo overlay (GoalCloseModalComponent) -> DELETE /goals/{id} con header X-OTP si reservedAmount > 30 EUR
7. Widget dashboard (SavingsWidgetComponent) -> GET /api/v1/savings/dashboard-widget

### Estructura de paquetes (LLD seccion 1)

apps/frontend-portal/src/app/features/savings/
  savings.module.ts
  savings-routing.module.ts
  models/savings.models.ts
  services/savings.service.ts
  components/  (18 componentes en subdirectorios por dominio)

### Routing (LLD seccion 2)

- app-routing.module.ts: registrar /savings lazy (LA-FRONT-001 patron, igual que /pfm /depositos /bizum)
- shell.component.ts: anadir nav item Objetivos (LA-FRONT-001)
- savings-routing.module.ts: rutas internas /, /nuevo, /:id, /:id/editar, /:id/aportar, /:id/regla-auto

### Models (LLD seccion 3)

- SavingsGoal, GoalAllocation, GoalAutoRule, GoalMilestone, DashboardWidget
- Enums: GoalCategory (VIAJE/HOGAR/VEHICULO/EMERGENCIA/EDUCACION/OTROS), GoalStatus (ACTIVE/PAUSED/CLOSED/COMPLETED), AllocationType, AllocationStatus
- DTOs request: CreateGoalRequest, UpdateGoalRequest, ContributeRequest, AutoRuleRequest

### SavingsService (LLD seccion 4)

- HttpClient con base /api/v1/savings
- Metodos: listGoals(status), createGoal(req), getGoal(id), updateGoal(id, req), closeGoal(id, otp?), contribute(id, req), getContributions(id, page?), configureAutoRule(id, req), pauseAutoRule(id), getMilestones(id), getDashboardWidget()
- Manejo SCA: closeGoal recibe otp opcional; si backend devuelve 401 InvalidOtp, el modal pide OTP y reintenta

### Patron critico SCA cierre objetivo (LLD seccion 7, RN-F024-11)

- Si reservedAmount > 30 EUR el backend exige header X-OTP
- Frontend: primer intento DELETE sin OTP. Si 401 InvalidOtp, abrir modal pidiendo TOTP del usuario
- Reintentar DELETE con header X-OTP: codigo. Si OK, cerrar goal
- Si reservedAmount <= 30 EUR el backend devuelve 200 al primer intento sin OTP

### Fidelidad al prototipo - LA-CORE-056 BLOQUEANTE en G-4

PROTOCOLO OBLIGATORIO POR COMPONENTE:
1. Abrir docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html en navegador
2. Localizar la pantalla del prototipo correspondiente al componente
3. Inspeccionar HTML/CSS de la pantalla (estructura DOM, classes, colores tokens, espaciados)
4. Implementar el componente Angular replicando 1 a 1 colores, espaciados, tipografias, iconos, layouts responsive, estados hover/active
5. NO implementar de memoria. NO inventar layouts. Si el prototipo dice card-savings con clase rounded-md el componente Angular tambien debe usar rounded-md.
6. Cualquier desviacion intencional debe documentarse en LLD con justificacion firmada por Architect (no aplica solo, requiere conversacion).

En G-4b PO ejecutara screenshot comparison lado-a-lado prototipo vs implementacion. Diferencias > 5% en pixel-perfect comparison rechazan G-4b. Patron LA-025-07 (FEAT-023 PFM): 36 bugs detectados en QA porque el developer escribio sin abrir prototipo - NO repetir.

### Estado y reactividad (LLD seccion 9)

- Smart components mantienen estado via signals (Angular 17 signals API)
- ListGoals, GetGoalDetail, GetDashboardWidget cachean a 30s (avoid race conditions con scheduler)
- ContributionModal y AutoRuleForm usan reactive forms con validators sincronos (max 100 chars name, target_amount 100..500000, contribution 10..5000)

### Performance (LLD seccion 10)

- Lazy load del modulo savings (chunk separado)
- Imagenes/iconos via CategoryIconComponent (no img tag, usar SVG inline)
- TrackBy en *ngFor de GoalListComponent (key=goal.id)

### Accesibilidad WCAG 2.1 AA (LLD seccion 11, RNF-F024-04)

- Todos los formularios con label asociado a input
- Modales con role="dialog" + aria-modal="true" + focus trap
- Contraste minimo 4.5:1 (verificar tokens de UX-DESIGN-SYSTEM.md)
- Navegacion por teclado: Tab, Enter, Escape

### Modificaciones en componentes existentes (LLD seccion 13)

- app-routing.module.ts: anadir ruta lazy { path: "savings", loadChildren: () => import("./features/savings/savings.module").then(m => m.SavingsModule) }
- shell.component.ts: anadir nav item Objetivos (icono savings) que enlaza a /savings
- dashboard.component.ts: anadir slot <app-savings-widget></app-savings-widget> en la fila de widgets
- dashboard.module.ts: declarar SavingsWidgetComponent (o importarlo via SavingsModule si se hace stand-alone)

### Patrones de referencia (LEER ANTES de escribir componentes)

- features/pfm/components/pfm-page.component.ts - patron container (Sprint 25 FEAT-023)
- features/pfm/components/budget-form.component.ts - patron reactive form complejo
- features/bizum/components/* - patrones smart/dumb (Sprint 24 FEAT-022)
- features/depositos/* - patron lazy module (Sprint 23 FEAT-021)

---

## 6. Decisiones que ya estan tomadas (NO re-preguntes al PO)

| Decision | Resolucion |
|---|---|
| Modo de ejecucion | Fase por fase con confirmacion entre cada una |
| Frontend Fase G | 18 componentes completos segun LLD seccion 5 |
| Patron infra savings | JPA Entity + Adapter delegado (Fase D) |
| Patron tests IT | BizumIntegrationTestBase compose externo (no Testcontainers - LA-026-08) |
| springdoc 2.3.0 en pom | YA ANADIDO Fase E (DEBT-048 CLOSED) |
| application-prod.yml | YA HARDENED springdoc=false |
| Routing /savings | lazy module patron LA-FRONT-001 |
| Estado reactivo | Angular 17 signals |
| Cache reads | 30s en list/detail/widget |
| Iconos | SVG inline via CategoryIconComponent |

---

## 7. Reglas/lecciones aplicables a partir de aqui

- LA-CORE-056 prototype-fidelity-visual-review BLOQUEANTE en G-4 (PO ejecutara screenshot comparison)
- LA-CORE-067 mcp-shell-stdio-buffer-limit: artefactos > 8KB fragmentar con appendFileSync. CONFIRMADO en este chat: node -e con backticks largos + ${...} causa bash bad substitution. Usar arrays de strings + .join("\n") sin backticks ni ${...}.
- LA-CORE-061 git-divergence-undetected: PASO 0 obligatorio
- LA-026-07 yaml-deep-merge: si tocas application.yml main bajo bank: o jwt:, replicar en application-{profile}.yml afectados. Vigilar especialmente application-test.yml + application-integration-compose.yml.
- LA-026-08 testcontainers-docker-from-docker-macos: ITs deben heredar BizumIntegrationTestBase, no IntegrationTestBase.
- LA-CORE-068 nunca-href-navegacion-interna-Angular: en componentes nuevos usar router.navigateByUrl o [routerLink], nunca [href]
- LA-CORE-055 sign-contract-backend: backend devuelve montos negativos en CARGO; aplicar Math.abs() en mapeos de UI savings (especialmente reservedAmount/targetAmount no aplica, son siempre positivos por DDL CHECK >= 0, pero cualquier display de movimientos derivados si)
- LA-CORE-057 select-twoway-binding-reset: en filtros de SavingsListComponent (status filter), usar [(ngModel)] + FormsModule, no (change) unidireccional

**Hallazgos detectados en F.4 (no bloqueantes pero a tener en cuenta para CR Step 5):**
- OBS-001: drift javadoc AccountReservePort vs JpaAccountReserveAdapter - el javadoc del puerto debe corregirse (adapter es coherente con UCs)
- OBS-002: drift handoff Fase F totalActiveGoals vs SavingsDtos.DashboardWidgetDto.activeGoalsCount - test fixed
- OBS-003: field naming smell en SavingsController (listGoals campo y metodo HTTP comparten nombre)
- OBS-004: jwt.session-ttl-seconds debio estar en application-integration-compose.yml desde Sprint 14 - ahora lo esta

**Deudas Fase H (G-4b smoke):**
- DEBT-051 ShedLock no cableado: anadir SchedulingConfig con @EnableSchedulerLock + @Bean LockProvider, aplicar V18c manualmente o configurar flyway out-of-order=true, test IT que valide LockProvider esta cableado
- Verificar SecurityConfig deja pasar /v3/api-docs/** y /swagger-ui/** sin JWT (DEBT-048 closed pero verificacion pendiente)
- Lista explicita de tests para G-4b: -Dtest=SavingsControllerIT,JpaAccountReserveAdapterIT,SavingsFlywayIT,AutoContributionSchedulerIT,MilestoneEmissionIT,SavingsGoalTest,MilestoneEvaluatorTest,GoalProjectionServiceTest,GoalClosureServiceTest,CreateGoalUseCaseTest,ListGoalsUseCaseTest,UpdateGoalUseCaseTest,CloseGoalUseCaseTest,ContributeManualUseCaseTest,ConfigureAutoRuleUseCaseTest,PauseAutoRuleUseCaseTest,GetDashboardWidgetUseCaseTest,ProcessAutoRuleUseCaseTest (DEBT-056 explica por que es necesario forzar lista explicita)

---

## 8. Comandos utiles

Inspeccionar estado pipeline:

    node -e "const s=require("./.sofia/session.json"); console.log(JSON.stringify(s.step4_progress, null, 2))"

Verificar archivos savings frontend (debe ser 0 hasta arrancar Fase G):

    find apps/frontend-portal/src/app/features/savings -name "*.ts" 2>/dev/null | wc -l

Ver patrones de referencia frontend:

    find apps/frontend-portal/src/app/features/pfm -name "*.component.ts" | head -10
    find apps/frontend-portal/src/app/features/bizum -name "*.component.ts" | head -10

Verificar prototipo accesible:

    ls -la docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html

Verificar GR-GIT-001 (debe ser 0):

    git status --porcelain | grep "^ D" | wc -l

Verificar BD del compose en V29:

    docker exec bankportal-postgres psql -U bankportal -d bankportal -c "SELECT version FROM flyway_schema_history WHERE version="29";"

Re-validar 27 IT verde:

    docker run --rm -v /Users/cuadram/proyectos/bank-portal:/work -v /Users/cuadram/.m2:/root/.m2 --network host -w /work/apps/backend-2fa maven:3.9-eclipse-temurin-21 mvn -B test -Dtest=SavingsControllerIT,JpaAccountReserveAdapterIT,SavingsFlywayIT,AutoContributionSchedulerIT,MilestoneEmissionIT -Dsurefire.failIfNoSpecifiedTests=false

---

## 9. Prompt sugerido para el nuevo chat

    Hola. Continuo trabajo en bank-portal Sprint 26 FEAT-024 Objetivos de Ahorro Step 4 Developer.

    ESTADO ACTUAL:
    - Fases A+B+C+D+E+F completadas y commiteadas (commits 2c6c258 backend + tests unit 116/116, 8eee244 27 IT integration verde)
    - 143 tests verde totales
    - Fases G+H pendientes
    - DEBT-048 CLOSED
    - 3 deudas nuevas Fase F: DEBT-054 yaml-deep-merge, DEBT-055 PfmControllerIT-falsified-PASS, DEBT-056 surefire-no-IT
    - 2 LAs nuevas sofia_core_candidate: LA-026-07 yaml-no-deep-merge, LA-026-08 testcontainers-docker-from-docker-macos
    - 4 observations_for_step5 registradas
    - Branch feature/FEAT-024-sprint26 al dia con HEAD 8eee244
    - BD del compose externo en V29 (savings_goals + 3 tablas creadas)
    - postgres+redis del compose deben estar UP (verificar con docker compose ps)

    PASO 0 OBLIGATORIO antes de cualquier accion (LA-018-01 + LA-CORE-061 GR-GIT-001):
    1. Leer .sofia/session.json integro
    2. git status --porcelain | grep "^ D" | wc -l -> debe ser 0
    3. Leer docs/handoffs/HANDOFF-sprint26-step4-fase-g.md integro
    4. Leer docs/architecture/sprint-26/LLD-frontend-FEAT-024-sprint26.md (autoridad para Fase G)
    5. Verificar prototipo accesible: ls docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html
    6. Verificar postgres+redis UP: docker compose -f infra/compose/docker-compose.yml ps

    OBJETIVO DE ESTA SESION: arrancar Fase G (Frontend Angular) segun LLD secciones 1-13.
    - 18 componentes Angular completos
    - savings.module.ts + savings-routing.module.ts + models/savings.models.ts + services/savings.service.ts
    - Modificar app-routing.module.ts + shell.component.ts + dashboard.component.ts + dashboard.module.ts
    - Patron LA-FRONT-001 lazy module
    - Angular 17 signals
    - LA-CORE-056 fidelidad prototipo BLOQUEANTE: NO escribir ningun componente sin abrir el HTML del prototipo en navegador y replicar 1 a 1

    DECISIONES PO HEREDADAS (no preguntar de nuevo):
    - Modo: fase por fase con confirmacion
    - Frontend Fase G: 18 componentes completos segun LLD seccion 5
    - Patron de tests IT: BizumIntegrationTestBase compose externo
    - Estado reactivo: signals, cache reads 30s

    DEUDAS DETECTADAS PARA FASE H:
    - DEBT-051 ShedLock no cableado: SchedulingConfig + LockProvider + V18c apply manual
    - SecurityConfig springdoc paths sin verificar

    REGLA DE CONFIANZA: cambios costosos/irreversibles requieren ~95% confianza, en otro caso preguntar. Preguntas agrupadas en un unico turno.

    Cuando confirmes que has hecho el PASO 0, propones plan Fase G (orden de componentes) y arrancamos.

---

## 10. Salida esperada al cerrar Step 4

Cuando termines Fase H (G-4b):

- mvn -pl apps/backend-2fa compile -> BUILD SUCCESS (0 warnings nuevos)
- mvn test -Dtest=lista-explicita-Fase-H -> tests savings PASS (>=143 tests)
- docker compose up -d -> contenedores healthy
- actuator/health -> {status:UP, db:UP, redis:UP}
- Flyway V29 aplicada (ya esta en BD persistente)
- V18c shedlock aplicada manualmente (parte de fix DEBT-051)
- 4 tablas savings creadas (ya estan)
- Frontend: ng build savings-module -> bundle OK
- Checklist fidelidad prototipo (LA-CORE-056) firmado por PO con screenshot comparison
- Persistencia en session.json.artifacts.4_s26_phase_g_frontend + 4_s26_phase_h_g4b
- Branch lista para git push origin feature/FEAT-024-sprint26
- Pipeline avanza a Step 5 (Code Reviewer)

---

_HANDOFF generado por Claude (Opus 4.7) - 2026-04-28 - sesion 3 (chat anterior post-Fase F)_
_Vias de creacion: node -e con arrays de strings + .join (no backticks, evita LA-CORE-067 bash bad substitution descubierta hoy)_
_Persistencia atomica session.json via /tmp/persist-f4.js (15453 bytes en 7 bloques appendFileSync)_