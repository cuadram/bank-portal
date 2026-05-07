# HANDOFF - Sprint 26 - FEAT-024 - Step 4 - Fase H

**Generado:** 2026-05-07T18:46:39.742Z
**Origen:** chat actual (Fases A+B+C+D+E+F+G.0+G.1+G.2+G.3+G.4 completadas y commiteadas en feature/FEAT-024-sprint26)
**Destino:** chat nuevo (continuar desde Fase H · G-4b guardrail)
**Sprint:** 26 - **Feature:** FEAT-024 Objetivos de Ahorro - **Release:** v1.26.0
**Handoffs anteriores:** HANDOFF-sprint26-step4-fase-d.md, HANDOFF-sprint26-step4-fase-f.md, HANDOFF-sprint26-step4-fase-g.md, HANDOFF-sprint26-step4-fase-g1.md, HANDOFF-sprint26-step4-fase-g2.md

---

## 1. Contexto inmediato

Estas continuando Step 4 (Developer) del pipeline SOFIA tras completar Fases A-G completas. Tu trabajo: ejecutar **Fase H** (G-4b guardrail) que consiste en validar que el codigo nuevo compila, los tests siguen verde, los contenedores arrancan y la BD esta sana antes de cerrar Step 4 y entregar al Code Reviewer (Step 5).

**Lo que SI esta hecho al cierre G.5:**
- Backend completo: domain + application + infrastructure + API · 52 archivos · commit 2c6c258
- 143 tests verde: 116 unit + 27 IT · commits 2c6c258 + 8eee244
- Frontend completo: 22 componentes Angular savings + integracion shell/dashboard/app-routing
  - 5 G.0 andamiaje (commit a1dedca)
  - 7 G.1 dumb components (commits 3de93a8 + 72c7488 + b311524)
  - 6 G.2 smart components + routing real (commits 290f38b + 9ef43ea + cf80cd6 + 9a8cf4e + 1a1bade)
  - 3 G.3 modales + 3 rutas + standalone OtpInput import (commits cf29f9c + 1dab2e5)
  - 1 G.4 widget + 4 modificaciones integracion (commits 386adfa + b00731d)
  - 1 G.5 handoff Fase H (commit ESTE)
- DEBT-048 cerrada (springdoc 2.3.0 anadido en Fase E)
- BD del compose externo en V29 (savings_goals + 3 tablas), fixture disponible
- session.json al dia · phases_completed=[A,B,C,D,E,F,G_frontend] · g_subphases_completed=[G.0..G.5]
- Working tree limpio · branch feature/FEAT-024-sprint26 al dia con commits previos pusheados
- 11 LAs internas registradas durante Fase G (4 G.2 + 3 G.3 + 1 G.4 + 3 anteriores)
- 9 OBS para Step 5 Code Review documentadas en JSDoc de los componentes

**Lo que NO esta hecho:**
- mvn compile global no ejecutado todavia (esto es justo Fase H)
- DEBT-051 ShedLock sin cablear (Fase H)
- V18c shedlock no aplicada en BD (Fase H)
- SecurityConfig springdoc paths sin verificar (Fase H)
- DEBT-049 script validate-smoke-vs-openapi sin crear (Fase H)
- DEBT-050 SKILL.md devops checklist pre-G-7 sin actualizar (Fase H)
- ng build / ng test del frontend no ejecutado (Step 5 Code Review)

---

## 2. Estado del pipeline

**Sprint 26 - FEAT-024 Objetivos de Ahorro**
- Step 1 G-1 PO  · 2026-04-21
- Step 2 G-2 PO  · 2026-04-22
- Step 2b FA-Agent · auto · 2026-04-23
- Step 2c HITL PO+TL · 2026-04-25 (Design System v2 + prototipo PROTO-FEAT-024)
- Step 3 G-3 TL · 2026-04-28 (HLD aprobado)
- Step 3b Documentation Agent + FA-Agent · auto · 2026-04-29
- Step 4 Developer EN PROGRESO:
  - Fase A domain DDL · COMPLETA · commit 2c6c258
  - Fase B domain services · COMPLETA · commit 2c6c258
  - Fase C application use cases · COMPLETA · commit 2c6c258
  - Fase D infrastructure adapters · COMPLETA · commit 2c6c258
  - Fase E API REST · COMPLETA · commit 2c6c258
  - Fase F tests · COMPLETA · commit 8eee244
  - Fase G frontend · COMPLETA (este handoff cierra G.5):
    - G.0 andamiaje · COMPLETA · commit a1dedca
    - G.1 dumb components · COMPLETA · commits 3de93a8 + 72c7488 + b311524
    - G.2 smart components + routing real · COMPLETA · commits 290f38b + 9ef43ea + cf80cd6 + 9a8cf4e + 1a1bade
    - G.3 modales + standalone OtpInput · COMPLETA · commits cf29f9c + 1dab2e5
    - G.4 widget + integracion · COMPLETA · commits 386adfa + b00731d
    - G.5 cierre + handoff Fase H · COMPLETA · commit ESTE
  - **Fase H PENDIENTE (este handoff)**
- Steps 5-9 PENDIENTES

**HEAD actual al cierre G.5:** se actualizara con el commit que crea este handoff.

**Decisiones PO heredadas (NO re-preguntar en Fase H):**
- Modo: fase por fase con confirmacion entre cada una
- Tests Fase H: lista explicita -Dtest=... (workaround DEBT-056 surefire-no-IT)
- Patron ITs: BizumIntegrationTestBase (compose externo, no Testcontainers · LA-026-08)
- Snapshot intermedio omitido (LA-026-05 · git history cubre reversa)
- Pre-flight Tier A diferido a post-G-9 S26 (no en este sprint)

---

## 3. Trabajo de Fase H (lo que hay que hacer)

Fase H es **G-4b guardrail**: validacion que el codigo merece pasar a Step 5 Code Review.
Es BLOQUEANTE: si algo falla, Step 4 NO se cierra y se vuelve a la fase correspondiente.

Plan dividido en 5 sub-fases (no estrictas, pueden agruparse):

### H.1 Verificacion de compilacion backend

```bash
JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home \
  /opt/homebrew/bin/mvn -pl apps/backend-2fa compile -DskipTests
```

Esperado: BUILD SUCCESS · 0 warnings nuevos vs Sprint 25.
Si falla: revisar errores typed-checker, posibles imports rotos por cambios cross-module
o por integracion de DashboardModule importando savings/components/savings-widget.

### H.2 Cableado ShedLock + V18c (DEBT-051)

ShedLock se necesita para que el AutoContributionScheduler (Fase D) no se ejecute en
multiple instancias simultaneamente en produccion (idempotencia critica RN-F024-04).

Pasos:
1. Crear apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/config/SchedulingConfig.java con:
   - @Configuration + @EnableScheduling + @EnableSchedulerLock(defaultLockAtMostFor="PT10M")
   - @Bean LockProvider que usa JdbcTemplateLockProvider con DataSource + tabla shedlock
2. Verificar dependencia ShedLock en pom.xml (puede que no este aun · anadir si falta):
   - net.javacrumbs.shedlock:shedlock-spring + net.javacrumbs.shedlock:shedlock-provider-jdbc-template
3. Migracion V18c__create_shedlock_table.sql ya existe segun handoffs anteriores - verificar:
```bash
ls apps/backend-2fa/src/main/resources/db/migration/V18c__*
```
4. Si Flyway no ha aplicado V18c (porque V29 ya esta aplicada en BD persistente):
   opcion A) flyway repair + flyway migrate con out-of-order=true
   opcion B) aplicar V18c manualmente con docker compose exec postgres psql ...
5. Anotar AutoContributionScheduler con @SchedulerLock(name="savings-auto-contribution", lockAtLeastFor="PT5M", lockAtMostFor="PT10M")
6. Test IT: ShedLockEnabledIT que verifica que el LockProvider esta cableado y la tabla shedlock existe.

### H.3 Verificacion SecurityConfig springdoc paths

DEBT-048 esta closed (springdoc 2.3.0 anadido) pero falta verificar que SecurityConfig deja
pasar /v3/api-docs/** y /swagger-ui/** sin requerir JWT.

Pasos:
1. Inspeccionar apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/config/SecurityConfig.java
2. Comprobar que la cadena de permitAll() incluye:
   - /v3/api-docs/**
   - /swagger-ui/**
   - /swagger-ui.html
3. Si no estan: anadir antes de .anyRequest().authenticated()
4. Smoke manual: docker compose up -d + curl http://localhost:8081/v3/api-docs/savings -> 200 OK

### H.4 Script validate-smoke-vs-openapi (DEBT-049)

Script Node.js que compara los endpoints /api/v1/savings/** documentados por OpenAPI vs
los endpoints invocados por los smoke tests (lista canonical .sofia/scripts/smoke-tests/).

Pasos:
1. Crear .sofia/scripts/validate-smoke-vs-openapi.js
2. Lee OpenAPI 3.1 desde http://localhost:8081/v3/api-docs y extrae paths
3. Lee scripts/smoke-tests/*.json y extrae endpoints invocados
4. Reporta: paths en OpenAPI sin smoke + smoke sin path en OpenAPI
5. Output: exit 0 si OK, exit 1 si drift
6. Documentar en SOFIA-CORE como GR-CI-002 candidato (si aplica - decision Step 8b)

### H.5 SKILL.md devops checklist pre-G-7 (DEBT-050)

Anadir checklist en .sofia/skills/devops/SKILL.md que el devops-agent debe verificar antes de
declarar G-7 listo:
- mvn compile sin warnings nuevos
- mvn test pasa (lista explicita -Dtest=...)
- docker compose up -d + actuator/health UP
- Smoke tests savings pasan
- OpenAPI 3.1 expone /api/v1/savings/** completo
- Frontend ng build SUCCESS
- Frontend ng test sin failures (Step 5+)

---

## 4. Comandos canonicos para Fase H

```bash
# 1. Compilar backend
cd /Users/cuadram/proyectos/bank-portal
JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home \
  /opt/homebrew/bin/mvn -pl apps/backend-2fa compile -DskipTests

# 2. Tests con lista explicita (workaround DEBT-056)
JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home \
  /opt/homebrew/bin/mvn -pl apps/backend-2fa test -Dsurefire.failIfNoSpecifiedTests=false \
  -Dtest=SavingsControllerIT,JpaAccountReserveAdapterIT,SavingsFlywayIT,AutoContributionSchedulerIT,MilestoneEmissionIT,SavingsGoalTest,MilestoneEvaluatorTest,GoalProjectionServiceTest,GoalClosureServiceTest,CreateGoalUseCaseTest,ListGoalsUseCaseTest,UpdateGoalUseCaseTest,CloseGoalUseCaseTest,ContributeManualUseCaseTest,ConfigureAutoRuleUseCaseTest,PauseAutoRuleUseCaseTest,GetDashboardWidgetUseCaseTest,ProcessAutoRuleUseCaseTest,ShedLockEnabledIT

# 3. Compose up + healthcheck
docker compose up -d
sleep 15
curl -s http://localhost:8081/actuator/health | python3 -m json.tool

# 4. Smoke OpenAPI
curl -s http://localhost:8081/v3/api-docs | python3 -c "import json, sys; d=json.load(sys.stdin); print('paths savings:', [p for p in d.get('paths',{}) if 'savings' in p])"

# 5. Validador OpenAPI vs smoke (DEBT-049 una vez creado)
node .sofia/scripts/validate-smoke-vs-openapi.js
```

---

## 5. Criterios de salida Fase H (cierre Step 4)

Step 4 cierra cuando todos estos criterios se cumplen:

| Criterio | Verificacion |
|---|---|
| mvn compile backend SUCCESS · 0 warnings nuevos | mvn -pl apps/backend-2fa compile · output limpio |
| Tests savings PASS · >=143 tests + ShedLockEnabledIT | mvn test -Dtest=lista-explicita |
| Compose up · contenedores healthy | docker compose ps · status=running para todos |
| actuator/health UP · DB UP · Redis UP | curl /actuator/health · status:UP en todos los components |
| Flyway V29 aplicada | psql -c "SELECT * FROM flyway_schema_history WHERE version='29'" |
| Flyway V18c shedlock aplicada | psql -c "SELECT * FROM flyway_schema_history WHERE version='18c'" |
| 4 tablas savings creadas | psql -c "\dt savings_*" |
| ShedLock cableado | curl /actuator/scheduledtasks · ver lock en AutoContributionScheduler |
| OpenAPI /api/v1/savings/** completo | curl /v3/api-docs · contiene 7 paths savings |
| SecurityConfig pasa springdoc sin JWT | curl /v3/api-docs sin Authorization · 200 OK |
| Frontend ng build SUCCESS | (Step 5 lo ejecuta) |
| session.json · phases_completed += 'H_smoke' | nodejs script de actualizacion |
| Commit final Fase H + push origin | git log --oneline -1 && git rev-parse HEAD == origin/HEAD |

---

## 6. PASO 0 OBLIGATORIO al arrancar el nuevo chat

```bash
# 1. Verificar identidad repo
cd /Users/cuadram/proyectos/bank-portal && git branch --show-current && git remote get-url origin
# Esperado: feature/FEAT-024-sprint26 · git@github.com:cuadram/bank-portal.git (o https://...)

# 2. Verificar HEAD sincronizado
git rev-parse HEAD && git rev-parse origin/feature/FEAT-024-sprint26
# Esperado: el mismo SHA

# 3. Verificar working tree limpio (GR-GIT-001)
git status --porcelain | grep "^ D" | wc -l
# Esperado: 0

# 4. Leer session.json para confirmar estado
node -e "const s=require('./.sofia/session.json'); console.log('current_step', s.current_step, 'gate_pending', s.gate_pending, 'phases_completed', s.step4_progress.phases_completed, 'g_subphases_completed', s.step4_progress.g_subphases_completed)"
# Esperado: current_step=4 · gate_pending=null · phases_completed=[A..F + G_frontend] · g_subphases_completed=[G.0..G.5]

# 5. Leer este handoff
cat docs/handoffs/HANDOFF-sprint26-step4-fase-h.md | head -60
```

Si algo no cuadra: PARAR y avisar al PO antes de tocar nada.

---

## 7. Reglas/lecciones aplicables a partir de aqui

### LAs heredadas del proyecto (cumplir siempre)
- LA-018-01: leer session.json al inicio · si gate_pending != null pedir aprobacion
- GR-DASH-002: dashboard global se regenera SOLO en aprobaciones de gate
- GR-ATLASSIAN-001: cierre de sprint requiere accion UI (no MCP API)
- GR-GIT-001: 0 deletados en working tree (halt si hay)
- LA-CORE-051: gate_pending solo valores canonicos del GATE_ROLES
- LA-CORE-055: NO Math.abs en savings (DDL CHECK >= 0)
- LA-CORE-056: pixel-perfect prototipo (BLOQUEANTE en G-4)
- LA-CORE-067: appendFileSync en bloques < 6KB cuando se generan ficheros largos
- LA-CORE-068: navegacion router (no [href])
- LA-FRONT-001: lazy modules con loadChildren

### LAs internas Fase G (registradas durante este chat)
1. OnPush + subscribe sin markForCheck deja UI congelada (sin signals exige cdr.markForCheck)
2. Contrato error backend Spring Boot puede divergir (campo error no code · status codes especificos)
3. GoalCard G.1 NO renderiza milestone-strip ni goal-meta del prototipo (gap heredado · OBS-006)
4. Drift handoff [GoalOwnerGuard] vs codigo goalOwnerGuard CanActivateFn
5. Standalone components en NgModule classic van en imports[] no declarations[] (Angular 17 NG6008)
6. clearTimeout en ngOnDestroy obligatorio si setTimeout (memory leak)
7. confirm() nativo aceptable en LOTE intermedio sin modal infrastructure
8. Widgets dashboard cross-feature: declarar en eager module (DashboardModule), no en lazy

### Convenciones tecnicas Fase G aplicadas (mantener en H)
- OnPush + cdr.markForCheck en mutaciones smart components
- mapErrorToMessage homogeneo · campo 'error' del backend (no 'code')
- ReactiveForms · destroy$ + takeUntil · sin signals · sin @angular/cdk
- font-variant-numeric: tabular-nums en montos
- catchError + of(null|[]) explicito (no EMPTY)

### En G-4b (cuando termine Fase H)
PO ejecutara screenshot comparison lado-a-lado prototipo vs implementacion.
Diferencias > 5% rechazan G-4b. Patron LA-CORE-056 + LA-025-07: 36 bugs en S25 PFM
detectados en QA porque developer escribio sin abrir prototipo. Mitigacion en S26:
todos los smart components escritos con prototipo abierto · OBS-006 documentada para
GoalCard G.1 que no es 100% pixel-perfect (gap heredado).

---

## 8. Trazabilidad de commits Fase G hasta este handoff

```text
b00731d  chore(sprint26-step4): cierre Fase G.4 · session persistida
386adfa  feat(sprint26-step4): Fase G.4 SavingsWidget + integracion shell/dashboard/app-routing
1dab2e5  chore(sprint26-step4): cierre Fase G.3 · session persistida · 27 entradas artifacts
cf29f9c  feat(sprint26-step4): Fase G.3 modales (contribute + autorule + close+SCA) + 3 rutas
1a1bade  chore(sprint26-step4): cierre Fase G.2 · session persistida · 4 LAs internas
9a8cf4e  feat(sprint26-step4): Fase G.2 LOTE 2.3 GoalDetail+ContributionHistory+GoalEditForm + routing real (CIERRE G.2)
cf80cd6  fix(sprint26-step4): Fase G.2 LOTE 2.1+2.2 hallazgos auditoria PO (4 bugs)
9ef43ea  feat(sprint26-step4): Fase G.2 LOTE 2.2 GoalCreateForm + summary preview (US-024-01)
290f38b  feat(sprint26-step4): Fase G.2 LOTE 2.1 SavingsPage + GoalList (US-024-02)
d0dc1a6  docs(sprint26-step4): handoff Fase G.2 frontend smart components
b311524  feat(sprint26-step4): Fase G.1 LOTE 3 + cierre G.1 (7/7 dumbs · session persistida)
72c7488  feat(sprint26-step4): Fase G.1 LOTE 2 compuestos savings (2 components)
3de93a8  feat(sprint26-step4): Fase G.1 LOTE 1 atomicos savings (3 components)
a1dedca  feat(sprint26-step4): Fase G.0 andamiaje SavingsModule (5 archivos)
```

Total Fase G: 14 commits · 22 .ts savings + integracion · ~209 KB TS source.

---

## 9. Prompt sugerido para el nuevo chat

```text
Estoy retomando Sprint 26 - FEAT-024 Objetivos de Ahorro - Step 4 - Fase H (G-4b guardrail).

Lee primero el handoff:
  docs/handoffs/HANDOFF-sprint26-step4-fase-h.md

Ejecuta el PASO 0 obligatorio (seccion 6 del handoff). Cuando termines, dame un
resumen de:
  - HEAD actual + branch sync con origin
  - count savings .ts esperado (22)
  - g_subphases_completed esperado [G.0..G.5]
  - phases_completed esperado [A..F + G_frontend]
  - GR-GIT-001 (0 deletados)

Si todo cuadra, planifica las 5 sub-fases de Fase H (H.1..H.5) y dime tu plan
ANTES de tocar codigo. Confirmare si seguimos sub-fase a sub-fase o agrupadas.
```

---

## 10. Salida esperada al cierre Fase H

session.json:
- step4_progress.phases_completed: [A_domain_ddl, B_domain_services, C_application, D_infrastructure, E_api, F_tests, G_frontend, H_smoke]
- step4_progress.h_subphases_completed: [H.1, H.2, H.3, H.4, H.5]
- artifacts['4_s26_phase_h']: lista detallada con outputs mvn compile, tests verde, healthcheck JSON, V18c aplicada, SchedulingConfig.java, ShedLockEnabledIT.java, validate-smoke-vs-openapi.js, devops/SKILL.md actualizado
- gate_pending: null (Step 4 cerrado · siguiente Step 5 Code Review HITL TL)
- current_step: avanza a 5

Commits adicionales tras este handoff:
- 1+ feat: Fase H.2 ShedLock cableado + V18c verificada
- 1 feat: Fase H.3 SecurityConfig springdoc paths
- 1 feat: Fase H.4 validate-smoke-vs-openapi.js
- 1 feat: Fase H.5 devops SKILL.md checklist
- 1 chore: cierre Fase H + cierre Step 4 + handoff a Step 5

Step 4 cerrado · gate G-4 LISTO para PO + TL revision (HITL).

---

## 11. Trazabilidad cronologica del Step 4

| Fase | Estado | Commits clave |
|---|---|---|
| A · domain DDL | ✓ | 2c6c258 |
| B · domain services | ✓ | 2c6c258 |
| C · application use cases | ✓ | 2c6c258 |
| D · infrastructure adapters | ✓ | 2c6c258 |
| E · API REST | ✓ | 2c6c258 |
| F · tests | ✓ | 8eee244 (143/143 verde) |
| G.0 · andamiaje | ✓ | a1dedca |
| G.1 · dumb components | ✓ | 3de93a8 + 72c7488 + b311524 |
| G.2 · smart components + routing | ✓ | 290f38b + 9ef43ea + cf80cd6 + 9a8cf4e + 1a1bade |
| G.3 · modales + standalone OtpInput | ✓ | cf29f9c + 1dab2e5 |
| G.4 · widget + integracion | ✓ | 386adfa + b00731d |
| G.5 · cierre + handoff Fase H | ✓ | (este commit) |
| H · G-4b guardrail | PENDIENTE | (siguiente chat) |

Step 4 al cierre G.5: 100% codigo escrito · pendiente solo validacion guardrail (Fase H).

---

**Fin del handoff Fase H.**
