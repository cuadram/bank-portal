# HANDOFF - Sprint 26 - FEAT-024 - Step 4 - Fase G.1

**Generado:** 2026-04-28T17:15Z
**Origen:** chat anterior (Fase G.0 completada y commiteada)
**Destino:** chat nuevo (continuar desde Fase G.1)
**Sprint:** 26 - **Feature:** FEAT-024 Objetivos de Ahorro - **Release:** v1.26.0
**Handoffs anteriores:** HANDOFF-sprint26-step4-fase-d.md, HANDOFF-sprint26-step4-fase-f.md, HANDOFF-sprint26-step4-fase-g.md

---

## 1. Contexto inmediato

Estas continuando Step 4 (Developer) del pipeline SOFIA tras completar Fases A+B+C+D+E+F+G.0. Tu trabajo: arrancar Fase G.1 (componentes Angular dumb) y continuar hasta Fase H (G-4b guardrail).

**Lo que SI esta hecho:**
- Backend completo en disco: domain + application + infrastructure + API (52 archivos, ~3200 lineas) - commit 2c6c258
- 143 tests verde: 116 unit + 27 IT - commits 2c6c258 + 8eee244
- DEBT-048 cerrada (springdoc 2.3.0 anadido en Fase E)
- BD del compose externo en V29 (savings_goals + 3 tablas creadas)
- session.json al dia con artifacts F + 3 deudas + 2 LAs nuevas + 4 observations_for_step5
- **Fase G.0 frontend andamiaje completo en disco - commit a1dedca:**
  - apps/frontend-portal/src/app/features/savings/models/savings.models.ts (5864 bytes, 188 lineas)
  - apps/frontend-portal/src/app/features/savings/services/savings.service.ts (4353 bytes, 11 metodos HTTP)
  - apps/frontend-portal/src/app/features/savings/savings.module.ts (809 bytes, declarations vacio)
  - apps/frontend-portal/src/app/features/savings/savings-routing.module.ts (534 bytes, Routes vacio)
  - apps/frontend-portal/src/app/features/savings/guards/goal-owner.guard.ts (815 bytes, CanActivateFn)
- Working tree limpio, branch feature/FEAT-024-sprint26 al dia con HEAD a1dedca

**Lo que NO esta hecho:**
- Ningun componente Angular savings escrito todavia (G.1..G.4 pendientes)
- savings-routing.module.ts tiene Routes=[] - rutas internas se completan en G.2 cuando existan los components
- app-routing.module.ts NO tiene aun ruta /objetivos - se anade en G.4
- shell.component.ts NO tiene aun nav item Mis Objetivos - se anade en G.4
- dashboard.component.ts NO tiene aun slot widget - se anade en G.4
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
  - Fase G frontend EN PROGRESO
    - **G.0 andamiaje module/service/models/guards COMMIT a1dedca**
    - G.1 PENDIENTE (este handoff) - 7 componentes dumb
    - G.2 PENDIENTE - 5 smart screens + completar routing
    - G.3 PENDIENTE - 4 modales + flujo SCA
    - G.4 PENDIENTE - widget + integracion shell+dashboard
    - G.5 PENDIENTE - persistencia session.json + handoff Fase H
  - Fase H PENDIENTE (G-4b guardrail)
- Steps 5-9 PENDIENTES

**Decisiones PO heredadas y CERRADAS (NO re-preguntar):**

| Decision | Resolucion | Origen |
|---|---|---|
| Modo de ejecucion | Fase por fase con confirmacion entre cada una | HANDOFF Fase F |
| Frontend | 18 componentes completos segun LLD seccion 5 | HANDOFF Fase G |
| Patron tests IT | BizumIntegrationTestBase compose externo (no Testcontainers) | LA-026-08 |
| Ruta UI | **/objetivos** (no /savings) | LLD seccion 2 manda sobre HANDOFF Fase G seccion 5 |
| Reactividad | **Sin signals - patron clasico PFM (OnInit + props publicas + Observable)** | Decision PO chat anterior, override del HANDOFF Fase G seccion 6 |
| Dependencias | **Sin @angular/cdk - paginacion Spring Data Page<T>** | Decision PO chat anterior |
| Routing module | **Routes=[] hasta G.2** - se completa cuando existan components | Decision G.0 chat anterior |
| Modo commits | **Commit por sub-fase G.0..G.4 + commit cierre G.5** | Decision PO chat anterior |
| Service base URL | Literal /api/v1/savings hardcoded (sin environment.apiBaseUrl) | Patron PfmService |
| Iconos categoria | **PENDIENTE decidir en G.1 tras leer prototipo** (SVG inline / Material font / emoji) | - |
| OBS-001..OBS-004 | Intactas para Code Reviewer Step 5 | Decision PO chat anterior |

**Rationale del override de signals:** 0 de 9 modulos hermanos (PFM, Bizum, Deposits, Loans, Cards, Accounts, etc.) usan signals en componentes de feature. Introducir signals solo en savings genera drift de patron que Code Reviewer marcara en Step 5. Migrar a signals es proyecto aparte (candidato sprint S28+).

---

## 3. Lo que hay PERSISTIDO en disco al cierre G.0

### Backend (sin cambios desde Fase F)
Identico al handoff Fase G seccion 3. Sin modificaciones desde 8eee244.

### Frontend Savings G.0 (commit a1dedca, 5 ficheros, 357 lineas)

**apps/frontend-portal/src/app/features/savings/models/savings.models.ts** (188 lineas)
- 4 enums: GoalCategory (6 valores), GoalStatus (4), AllocationType (2), AllocationStatus (3)
- 8 interfaces response: SavingsGoal, Allocation, AutoRule, Milestone, GoalDetail, CloseResult, WidgetGoalSummary, SavingsWidget
- 4 interfaces request: CreateGoalRequest, UpdateGoalRequest, ContributeRequest, AutoRuleRequest
- Page<T> generico para Spring Data
- 4 diccionarios UX: GOAL_CATEGORY_ICON, GOAL_CATEGORY_COLOR, GOAL_CATEGORY_LABEL, GOAL_STATUS_LABEL
- **Mapeo 1:1 verificado contra SavingsDtos.java** (Fase E backend)
- **OBS-002 corregido on-the-fly:** TS usa activeGoalsCount (real backend) no totalActiveGoals (handoff)

**apps/frontend-portal/src/app/features/savings/services/savings.service.ts** (103 lineas)
- Base: /api/v1/savings (literal hardcoded, patron PfmService)
- 11 metodos HTTP: listGoals(status?), createGoal(req), getDetail(goalId), updateGoal(goalId,req), closeGoal(goalId,otp?), contribute(goalId,req), contributionHistory(goalId,page,size), configureAutoRule(goalId,req), pauseAutoRule(goalId), getMilestones(goalId), getWidget()
- closeGoal acepta otp opcional con header X-OTP (RN-F024-11 SCA)
- Sin signals, sin shareReplay, sin BehaviorSubject - solo Observable<T> directo

**apps/frontend-portal/src/app/features/savings/savings.module.ts** (26 lineas)
- @NgModule lazy con declarations:[]
- imports: CommonModule, ReactiveFormsModule, FormsModule, RouterModule, SavingsRoutingModule

**apps/frontend-portal/src/app/features/savings/savings-routing.module.ts** (17 lineas)
- Routes=[] (vacio en G.0)
- RouterModule.forChild([]) + exports
- **Las 6 rutas internas (/, /nuevo, /:id, /:id/editar, /:id/aportar, /:id/auto) se anaden en G.2** cuando existan SavingsPageComponent + GoalListComponent + GoalCreateFormComponent + GoalDetailComponent + GoalEditFormComponent + ContributionModalComponent + AutoRuleFormComponent

**apps/frontend-portal/src/app/features/savings/guards/goal-owner.guard.ts** (23 lineas)
- CanActivateFn funcional con inject(SessionService) + inject(Router)
- Solo verifica session.isAuthenticated() - ownership real lo valida backend con HTTP 403 GoalAccessDenied
- Path import: ../../../core/auth/session.service - VERIFICADO existe

### Documentacion arquitectura (sin cambios)
- docs/architecture/sprint-26/HLD-FEAT-024-sprint26.md
- docs/architecture/sprint-26/LLD-backend-FEAT-024-sprint26.md (28.3 KB)
- **docs/architecture/sprint-26/LLD-frontend-FEAT-024-sprint26.md (15 KB) - CRITICO PARA FASES G.1..G.4**
- docs/architecture/adr/ADR-040, ADR-041, ADR-042

### Prototipo (BLOQUEANTE para fidelidad LA-CORE-056)
**docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html (148.5 KB)**

Pantallas savings localizables en el HTML del prototipo:
- screen-savings-list (linea 1190) - GoalListComponent
- screen-savings-detail (linea 1325) - GoalDetailComponent
- screen-savings-create (linea 1477) - GoalCreateFormComponent
- screen-savings-contribute (linea 1614) - ContributionModalComponent
- screen-savings-autorule (linea 1713) - AutoRuleFormComponent

### Verificacion cross-check pre-commit G.0 (registrada en commit a1dedca)
- Imports relativos: 3/3 paths resueltos (guard->session, service->models, module->routing)
- Sintaxis: braces/brackets/parens balanceados en 5/5 ficheros
- Cross-check enums TS vs Java: GoalCategory(6/6) GoalStatus(4/4) AllocationType(2/2) AllocationStatus(3/3)
- Cross-check endpoints: 6/6 TS = 6/6 Java SavingsController @RequestMapping
- Cross-check campos DTO: 0 huerfanos frontend, 0 huerfanos backend

---

## 4. PASO 0 OBLIGATORIO al arrancar el nuevo chat

Aplica regla LA-018-01 (CLAUDE.md) + GR-GIT-001 (LA-CORE-061):

1. cat .sofia/session.json - leer estado completo
2. git status --porcelain | grep "^ D" | wc -l (debe ser 0)
3. git branch --show-current (debe ser feature/FEAT-024-sprint26)
4. git log --oneline -5 (debe ver a1dedca al principio: G.0 savings module scaffolding)
5. cat docs/handoffs/HANDOFF-sprint26-step4-fase-g1.md (este handoff completo)
6. cat docs/architecture/sprint-26/LLD-frontend-FEAT-024-sprint26.md (autoridad para Fase G)
7. ls docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html (verificar prototipo)
8. find apps/frontend-portal/src/app/features/savings -name "*.ts" | wc -l (debe ser 5: G.0 commiteada)
9. docker compose -f infra/compose/docker-compose.yml ps (postgres+redis UP, BD ya en V29)

---

## 5. Fase G.1 - Componentes dumb (siguiente trabajo)

### Inventario: 7 componentes dumb

| # | Componente | Pantalla en prototipo | Inputs | Outputs | RN/US |
|---|---|---|---|---|---|
| 1 | CategoryIconComponent | aparece en multiples pantallas | category, size? | - | RN-F024-07 |
| 2 | GoalProgressBarComponent | screen-savings-list, screen-savings-detail | progressPct, color? | - | US-024-02/03/08 |
| 3 | GoalProjectionBannerComponent | screen-savings-detail | atRisk, suggestedMonthly | - | RN-F024-08 |
| 4 | CategoryPickerComponent | screen-savings-create | value | valueChange | RN-F024-07 |
| 5 | SavingsEmptyStateComponent | screen-savings-list (estado vacio) | - | createClicked | UX |
| 6 | AutoRuleSummaryComponent | screen-savings-detail (panel regla) | rule (AutoRule) | edit, pause | US-024-05 |
| 7 | GoalCardComponent | screen-savings-list | goal (SavingsGoal) | clicked | US-024-02 |

**Orden de implementacion sugerido (dependencias):**
1. CategoryIconComponent (sin dependencias)
2. GoalProgressBarComponent (sin dependencias)
3. GoalProjectionBannerComponent (sin dependencias)
4. CategoryPickerComponent (depende de CategoryIcon)
5. SavingsEmptyStateComponent (sin dependencias)
6. AutoRuleSummaryComponent (sin dependencias)
7. GoalCardComponent (depende de CategoryIcon + GoalProgressBar)

### Estructura de cada componente (patron PFM)

Cada componente sigue el patron:
apps/frontend-portal/src/app/features/savings/components/<component-name>/<component-name>.component.ts

Decision template + estilos: igual que PFM = inline en el .ts (templateUrl/styleUrls externos solo si supera 80 lineas).

**Plantilla minima (verificar contra prototipo antes de escribir):**

......

### LA-CORE-056 - Fidelidad prototipo BLOQUEANTE

**PROTOCOLO POR COMPONENTE (sin excepciones):**
1. Antes de escribir un componente, abrir docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html
2. Localizar el bloque del prototipo correspondiente (lineas indicadas en seccion 3 de este handoff)
3. Extraer del HTML: estructura DOM, classes CSS, colores tokens, tipografias, espaciados, estados hover/active
4. Implementar el componente Angular replicando 1 a 1 lo extraido
5. NO inventar layouts. NO implementar de memoria.

En G-4b PO ejecutara screenshot comparison lado-a-lado prototipo vs implementacion. Diferencias > 5% rechazan G-4b. Patron LA-025-07 (FEAT-023 PFM): 36 bugs por no leer prototipo - NO repetir.

### Decision pendiente al arrancar G.1: estrategia de iconos

El primer componente a escribir es CategoryIconComponent. Antes de implementarlo, abrir el prototipo y determinar:
- Opcion A: SVG inline (mejor accesibilidad WCAG, sin dependencias externas)
- Opcion B: Material Icons font (requiere link en index.html, ya presente en proyecto si PFM lo usa)
- Opcion C: emoji unicode (mas simple pero limitado en estilizacion)

Verificar via grep en pfm-overview.component.ts y bizum-* component.ts que estrategia usan los modulos hermanos. Replicar la misma para consistencia.

**Comando util:** grep -nE "material-icons|svg|emoji" apps/frontend-portal/src/app/features/pfm/components/*.ts | head -20

---

## 6. Plan completo de Fases G.2 a G.5 (despues de G.1)

### G.2 - Smart components principales (5 pantallas + completar routing)

| # | Componente | Pantalla prototipo | Endpoints |
|---|---|---|---|
| 1 | SavingsPageComponent | container con router-outlet | - |
| 2 | GoalListComponent | screen-savings-list | GET /goals?status=ACTIVE |
| 3 | GoalCreateFormComponent | screen-savings-create | POST /goals |
| 4 | GoalDetailComponent | screen-savings-detail | GET /goals/{id} + GET /contributions + GET /milestones |
| 5 | ContributionHistoryComponent | dentro de detail | GET /goals/{id}/contributions paginado 20/pagina |
| 6 | GoalEditFormComponent | reusa form de Create con prefill | PUT /goals/{id} |

**Al cierre de G.2:**
- Actualizar savings-routing.module.ts con las 6 rutas reales (LLD seccion 2)
- Actualizar savings.module.ts declarations con G.1 + G.2 (12 components)
- Patron filtro lista: [(ngModel)] + FormsModule (LA-CORE-057)
- ContributionHistory paginacion: 20/pagina con paginador propio (sin @angular/cdk)
- Commit: feat(sprint26-step4): Fase G.2 smart screens (list/create/detail/history/edit) + routing completo

### G.3 - Modales y flujos criticos (4 components)

| # | Componente | Pantalla prototipo | Logica especial |
|---|---|---|---|
| 1 | ContributionModalComponent | screen-savings-contribute | manejo error 422 InsufficientFunds |
| 2 | AutoRuleFormComponent | screen-savings-autorule | validador dayOfMonth 1..28 |
| 3 | GoalCloseModalComponent | overlay sobre detail | **flujo SCA RN-F024-11** |
| 4 | MilestoneToastComponent | overlay global | toast US-024-07 |

**Flujo SCA GoalCloseModalComponent (LLD seccion 7):**
1. Primer DELETE sin OTP
2. Si backend responde 401 con error.code=OTP_REQUIRED, abrir prompt OTP
3. Reintentar DELETE con header X-OTP
4. Si OK -> handleSuccess(result)

Componente OTP reutilizable: features/two-factor/components/otp-verification/. Decidir al llegar a G.3 si se importa o se embebe input numerico simple.

**Commit:** feat(sprint26-step4): Fase G.3 modals + SCA flow

### G.4 - Widget dashboard + integracion shell

| # | Cambio | Tipo |
|---|---|---|
| 1 | SavingsWidgetComponent (smart, GET /dashboard-widget) | nuevo en savings/ |
| 2 | app-routing.module.ts: ruta lazy /objetivos | modificar |
| 3 | shell.component.ts: nav item Mis Objetivos con routerLink | modificar |
| 4 | dashboard.component.ts: slot <app-savings-widget> | modificar |
| 5 | dashboard.module.ts: import SavingsWidgetComponent | modificar |

**Patron nav (verificado en chat anterior):**
- shell.component.ts usa routerLink, NO (click)+navigateByUrl
- Aplicacion correcta de LA-CORE-068: el peligro es [href], no [routerLink]
- routerLink es la forma canonica Angular sin reload

**Commit:** feat(sprint26-step4): Fase G.4 widget + shell+dashboard wiring

### G.5 - Cierre y persistencia

1. find apps/frontend-portal/src/app/features/savings -name "*.ts" | wc -l - debe ser >=23 (18 components + module + routing + service + models + guard)
2. grep -rn "\[href\]" apps/frontend-portal/src/app/features/savings/ - debe ser 0 (LA-CORE-068)
3. Persistencia atomica session.json.artifacts.4_s26_phase_g_frontend con bloque PERSISTIDO
4. Generar HANDOFF-sprint26-step4-fase-h.md (G-4b guardrail)
5. **NO** rebuild Docker en G - eso es Fase H

**Commit final:** chore(sprint26-step4): Fase G persistencia session.json + handoff Fase H

---

## 7. Reglas/lecciones aplicables a partir de aqui

### Bloqueantes G-4 / G-4b
- **LA-CORE-056** prototype-fidelity-visual-review BLOQUEANTE en G-4 (PO screenshot comparison)
- **LA-CORE-068** nunca [href] para navegacion interna (en dynamic links - los routerLink estaticos del shell SI son validos)
- **LA-CORE-061 GR-GIT-001** verificar working tree antes de cualquier accion

### Tecnicas
- **LA-CORE-067** mcp-shell-stdio-buffer-limit: artefactos > 8KB fragmentar con appendFileSync. CONFIRMADO: usar Buffer.from(b64,base64) o arrays + .join (no heredoc, no backticks largos con expansion bash)
- **LA-CORE-055** sign-contract-backend: backend savings devuelve montos siempre positivos (DDL CHECK >= 0); Math.abs() solo para movimientos derivados de cuentas, NO para allocations.amount
- **LA-CORE-057** select-twoway-binding-reset: filtros usar [(ngModel)] + FormsModule, no (change) unidireccional
- **LA-026-07** yaml-deep-merge: si tocas application.yml main bajo bank: o jwt:, replicar en application-{profile}.yml. NO aplica en G porque solo se tocan archivos frontend
- **LA-026-08** testcontainers-docker-from-docker-macos: NO aplica en G porque no se escriben tests IT

### Hallazgos detectados en F.4 (no bloqueantes pero referenciar para CR Step 5)
- OBS-001: drift javadoc AccountReservePort vs JpaAccountReserveAdapter
- OBS-002: drift handoff totalActiveGoals vs DashboardWidgetDto.activeGoalsCount - **YA APLICADO en savings.models.ts G.0**
- OBS-003: field naming smell SavingsController (listGoals campo y metodo)
- OBS-004: jwt.session-ttl-seconds en application-integration-compose.yml

### Deudas Fase H (G-4b smoke)
- **DEBT-051** ShedLock no cableado: SchedulingConfig + LockProvider + V18c apply manual + test IT
- Verificar SecurityConfig deja pasar /v3/api-docs/** y /swagger-ui/** sin JWT
- Lista explicita -Dtest para G-4b (DEBT-056 surefire-no-IT explica por que necesario)

---

## 8. Comandos utiles

### Inspeccionar estado pipeline

node -e "const s=require('./.sofia/session.json'); console.log(JSON.stringify(s.step4_progress, null, 2))"

### Verificar archivos savings frontend (debe ser 5 al arrancar G.1, 12 al cierre G.2, 16 G.3, 18 G.4, persiste asi en G.5)

find apps/frontend-portal/src/app/features/savings -name "*.ts" | wc -l

### Ver patrones de referencia frontend (LA-CORE-056)



### Inspeccionar prototipo (LA-CORE-056 BLOQUEANTE)



### Verificar GR-GIT-001 (debe ser 0)

git status --porcelain | grep "^ D" | wc -l

### Verificar BD del compose en V29

docker exec bankportal-postgres psql -U bankportal -d bankportal -c "SELECT version FROM flyway_schema_history WHERE version='29';"

### Verificar G.0 esta en disco



---

## 9. Prompt sugerido para el nuevo chat



---

## 10. Salida esperada al cierre G.5

Cuando termines G.5:

- find apps/frontend-portal/src/app/features/savings -name "*.ts" | wc -l -> >=23
- grep -rn "\[href\]" apps/frontend-portal/src/app/features/savings/ -> 0
- savings.module.ts declarations completo (18 components)
- savings-routing.module.ts con 6 rutas reales
- app-routing.module.ts con ruta lazy /objetivos
- shell.component.ts con nav item Mis Objetivos (routerLink)
- dashboard.component.ts con slot <app-savings-widget>
- dashboard.module.ts con SavingsWidgetComponent declarado
- session.json.artifacts.4_s26_phase_g_frontend persistido con bloque PERSISTIDO
- HANDOFF-sprint26-step4-fase-h.md generado
- 5 commits intermedios (G.0 ya hecha + G.1 + G.2 + G.3 + G.4) + 1 commit final cierre G.5
- Pipeline avanza a Fase H (G-4b guardrail)

---

_HANDOFF generado por Claude (Opus 4.7) - 2026-04-28T17:15Z - sesion 4 (chat anterior post-G.0)_
_Vias de creacion: appendFileSync fragmentado en 6 bloques (LA-CORE-067)_
_Decisiones override del HANDOFF Fase G previo: ruta /objetivos, sin signals, sin @angular/cdk - todas con rationale documentado_

