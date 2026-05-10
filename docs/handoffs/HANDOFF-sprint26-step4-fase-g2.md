# HANDOFF - Sprint 26 - FEAT-024 - Step 4 - Fase G.2

**Generado:** 2026-05-07T15:18Z
**Origen:** chat anterior (Fases A+B+C+D+E+F+G.0+G.1 completadas y commiteadas)
**Destino:** chat nuevo (continuar desde Fase G.2)
**Sprint:** 26 - **Feature:** FEAT-024 Objetivos de Ahorro - **Release:** v1.26.0
**Handoffs anteriores:** HANDOFF-sprint26-step4-fase-d.md, HANDOFF-sprint26-step4-fase-f.md, HANDOFF-sprint26-step4-fase-g.md, HANDOFF-sprint26-step4-fase-g1.md

---

## 1. Contexto inmediato

Estas continuando Step 4 (Developer) del pipeline SOFIA tras completar Fases A+B+C+D+E+F+G.0+G.1. Tu trabajo: arrancar Fase G.2 (smart components principales) y continuar hasta Fase H (G-4b guardrail).

**Lo que SI esta hecho:**
- Backend completo en disco: domain + application + infrastructure + API (52 archivos, ~3200 lineas) - commits 2c6c258 + 8eee244
- 143 tests verde: 116 unit + 27 IT - commits 2c6c258 + 8eee244
- DEBT-048 cerrada (springdoc 2.3.0 anadido en Fase E)
- BD del compose externo en V29 (savings_goals + 3 tablas creadas)
- Boundary commit pre-G.1: la-sync 2.7.16 + 2 SQL seeds (V24_5 + V30) - commit 55eec27
- **Fase G.0 frontend andamiaje (5 ficheros · 357 lineas) - commit a1dedca**
  - savings.module.ts, savings-routing.module.ts (Routes=[]), savings.models.ts, savings.service.ts, goal-owner.guard.ts
- **Fase G.1 frontend dumb components (7 components · ~23.6KB TS source) - commits 3de93a8 + 72c7488 + b311524**
  - LOTE 1: CategoryIconComponent, GoalProgressBarComponent, GoalProjectionBannerComponent
  - LOTE 2: CategoryPickerComponent, SavingsEmptyStateComponent
  - LOTE 3: AutoRuleSummaryComponent, GoalCardComponent (compone CategoryIcon + GoalProgressBar)
- savings.module.ts declarations: 7 components G.1 declarados
- savings.models.ts GOAL_CATEGORY_ICON migrado de Material Icons strings a emoji unicode (decision PO P2)
- session.json persistido: artifacts['4_s26_phase_g_dot_1'] + step4_progress.g_subphases_completed=['G.0','G.1'] + files_persisted=64
- Branch sincronizada con origin (push tras boundary commit + 4 commits G)

**Lo que NO esta hecho:**
- Ningun smart component savings escrito todavia (G.2..G.5 pendientes)
- savings-routing.module.ts sigue con Routes=[] - se completa al cierre G.2 cuando existan los 6 components smart
- app-routing.module.ts NO tiene aun ruta /objetivos - se anade en G.4
- shell.component.ts NO tiene aun nav item Mis Objetivos - se anade en G.4
- dashboard.component.ts NO tiene aun slot widget - se anade en G.4
- Ningun mvn compile global ejecutado (no se hace hasta Fase H, G-4b)
- DEBT-051 ShedLock sin abordar (Fase H)
- V18c shedlock no aplicada en BD (Fase H)
- SecurityConfig springdoc paths sin verificar (Fase H)
- Pre-flight Tier A diferido a post-G-9 S26 (D-S26-preflight-Tier-A.0)

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
    - G.0 andamiaje module/service/models/guards COMMIT a1dedca
    - **G.1 7 dumb components COMPLETO COMMITS 3de93a8 + 72c7488 + b311524**
    - G.2 PENDIENTE (este handoff) - 6 smart components + routing real
    - G.3 PENDIENTE - 4 modales + flujo SCA
    - G.4 PENDIENTE - widget + integracion shell+dashboard
    - G.5 PENDIENTE - persistencia session.json + handoff Fase H
  - Fase H PENDIENTE (G-4b guardrail)
- Steps 5-9 PENDIENTES

---

## 3. Decisiones PO heredadas y CERRADAS (NO re-preguntar)

| Decision | Resolucion | Origen |
|---|---|---|
| Modo de ejecucion | Fase por fase con confirmacion entre cada una | HANDOFF Fase F |
| Frontend | 18 componentes completos segun LLD seccion 5 | HANDOFF Fase G |
| Patron tests IT | BizumIntegrationTestBase compose externo (no Testcontainers) | LA-026-08 |
| Ruta UI | **/objetivos** (no /savings) | LLD seccion 2 |
| Reactividad | **Sin signals - patron clasico PFM (OnInit + props publicas + Observable)** | Decision PO chat anterior |
| Dependencias | **Sin @angular/cdk - paginacion Spring Data Page<T>** | Decision PO chat anterior |
| Modo commits | **Commit por sub-fase G.0..G.4 + commit cierre G.5** | Decision PO chat anterior |
| Service base URL | Literal /api/v1/savings hardcoded (sin environment.apiBaseUrl) | Patron PfmService |
| Iconos categoria | **Emoji unicode inline** (consistencia 9 features hermanos) | P2 firmado 2026-05-07 |
| GOAL_CATEGORY_ICON | Migrado a emoji ['VIAJE','HOGAR','VEHICULO','EMERGENCIA','EDUCACION','OTROS'] = ['VIAJE','HOGAR','VEHICULO','EMERGENCIA','EDUCACION','OTROS'] | Commit 3de93a8 |
| CategoryPicker alcance | **Solo select semantico de GoalCategory** (icon-picker 12 + color-picker 8 viven en GoalCreateForm G.2) | Commit 72c7488 |
| GoalCard navegacion | role=button + tabindex=0 + (keydown.enter/space) - LA-CORE-068 cumplida sin [href] | Commit b311524 |
| Granularidad sub-fases G | step4_progress.g_subphases_completed[] + g_subphases_remaining[] | P4 firmado 2026-05-07 |
| Boundary commit pre-G.1 | la-sync 2.7.16 + V24_5 + V30 SQL seeds incluidos | P1 firmado · commit 55eec27 |
| Snapshot intermedio | Omitido (git history + handoffs cubren reversa) | LA-026-05 |
| Pre-flight Tier A | Diferido a post-G-9 S26 (no ahora) | D-S26-preflight-Tier-A.0 |

---

## 4. Lo que hay PERSISTIDO en disco al cierre G.1

### Backend (sin cambios desde Fase F)
Identico al handoff Fase G.1 seccion 3. Sin modificaciones.

### Frontend Savings G.0 (commit a1dedca · 5 ficheros · 357 lineas)
- savings.module.ts (declarations: 7 components G.1 actualizado en commits posteriores)
- savings-routing.module.ts (Routes=[] · se completa al cierre G.2)
- models/savings.models.ts (188 lineas · 4 enums · 12 interfaces · GOAL_CATEGORY_ICON migrado emoji)
- services/savings.service.ts (103 lineas · 11 metodos HTTP)
- guards/goal-owner.guard.ts (23 lineas · CanActivateFn)

### Frontend Savings G.1 (commits 3de93a8 + 72c7488 + b311524 · 7 dumb components · ~23.6KB TS)

**LOTE 1 commit 3de93a8** (3 primitivos sin dependencias internas):
- components/category-icon/category-icon.component.ts (1820 bytes · RN-F024-07 · @Input category, size=40 · emoji + color + aria-label)
- components/goal-progress-bar/goal-progress-bar.component.ts (2400 bytes · US-024-02/03/08 · @Input progressPct, atRisk · variants ok/warn/full · clamping defensivo)
- components/goal-projection-banner/goal-projection-banner.component.ts (3327 bytes · RN-F024-08 · @Input atRisk, projectedDate, suggestedMonthly · Intl es-ES EUR)

**LOTE 2 commit 72c7488** (2 compuestos simples):
- components/category-picker/category-picker.component.ts (2927 bytes · RN-F024-07 · [(ngModel)] LA-CORE-057 · 6 GoalCategory options emoji+label)
- components/savings-empty-state/savings-empty-state.component.ts (2312 bytes · UX · CTA primary · @Output createClicked · patron heredado PFM empty-state)

**LOTE 3 commit b311524** (2 compuestos finales):
- components/auto-rule-summary/auto-rule-summary.component.ts (4414 bytes · US-024-05 · @Input rule:AutoRule · Intl es-ES amount+date · botonera condicional active · @Output edit, pause)
- components/goal-card/goal-card.component.ts (6431 bytes · US-024-02 · @Input goal:SavingsGoal · COMPONE CategoryIcon + GoalProgressBar · keyboard-accessible role=button + (keydown.enter/space) · @Output clicked)

### Modificaciones consolidadas en G.1
- savings.module.ts declarations: [] -> [7 components G.1] (3 commits acumulan)
- savings.models.ts GOAL_CATEGORY_ICON: ['flight','home','directions_car','health_and_safety','school','savings'] -> ['VIAJE','HOGAR','VEHICULO','EMERGENCIA','EDUCACION','OTROS'] (emoji unicode)
- session.json: artifacts['4_s26_phase_g_dot_1'] (12 entradas) + step4_progress.g_subphases_completed=['G.0','G.1'] + files_persisted=64 + resume_next actualizado

### Documentacion arquitectura (sin cambios)
- docs/architecture/sprint-26/HLD-FEAT-024-sprint26.md
- docs/architecture/sprint-26/LLD-backend-FEAT-024-sprint26.md (28.3 KB)
- **docs/architecture/sprint-26/LLD-frontend-FEAT-024-sprint26.md (15 KB) - CRITICO PARA G.2..G.4**
- docs/architecture/adr/ADR-040, ADR-041, ADR-042

### Prototipo (BLOQUEANTE para fidelidad LA-CORE-056)
**docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html (148.5 KB)**

Mapa lineas de pantallas savings (verificadas en G.1):
- screen-savings-list    linea 1190 - GoalListComponent (G.2)
- screen-savings-detail  linea 1325 - GoalDetailComponent (G.2)
- screen-savings-create  linea 1477 - GoalCreateFormComponent (G.2)
- screen-savings-contribute linea 1614 - ContributionModalComponent (G.3)
- screen-savings-autorule linea 1713 - AutoRuleFormComponent (G.3)

---

## 5. PASO 0 OBLIGATORIO al arrancar el nuevo chat

Aplica regla LA-018-01 (CLAUDE.md) + GR-GIT-001 (LA-CORE-061):

1. cat .sofia/session.json - leer estado completo
2. git status --porcelain | grep "^ D" | wc -l (debe ser 0)
3. git branch --show-current (debe ser feature/FEAT-024-sprint26)
4. git log --oneline -7 (debe ver b311524 al principio: G.1 LOTE 3 cierre)
5. cat docs/handoffs/HANDOFF-sprint26-step4-fase-g2.md (este handoff completo)
6. cat docs/architecture/sprint-26/LLD-frontend-FEAT-024-sprint26.md (autoridad para Fase G)
7. ls docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html (verificar prototipo)
8. find apps/frontend-portal/src/app/features/savings -name "*.ts" | wc -l (debe ser 12: 5 G.0 + 7 G.1)
9. docker compose -f infra/compose/docker-compose.yml ps (postgres+redis UP, BD ya en V29)

---

## 6. Fase G.2 - Smart components principales (siguiente trabajo)

### Inventario: 6 smart components + completar routing

| # | Componente | Pantalla prototipo | Endpoints invocados | RN/US |
|---|---|---|---|---|
| 1 | SavingsPageComponent | container con router-outlet (sin pantalla propia) | - | - |
| 2 | GoalListComponent | screen-savings-list (linea 1190) | GET /goals?status=ACTIVE | US-024-02 |
| 3 | GoalCreateFormComponent | screen-savings-create (linea 1477) | POST /goals | US-024-01 |
| 4 | GoalDetailComponent | screen-savings-detail (linea 1325) | GET /goals/{id}, GET /contributions, GET /milestones | US-024-03 |
| 5 | ContributionHistoryComponent | dentro de detail (paginado 20/pagina) | GET /goals/{id}/contributions | US-024-03 |
| 6 | GoalEditFormComponent | reusa form de Create con prefill | PUT /goals/{id} | US-024-06 |

### Orden de implementacion sugerido (dependencias)

1. SavingsPageComponent (sin deps · solo router-outlet wrapper)
2. GoalListComponent (consume GoalCard G.1 + SavingsEmptyState G.1)
3. GoalCreateFormComponent (consume CategoryPicker G.1 · ReactiveForms · grid 2x3 icon-picker 12 + color-picker 8 inline)
4. GoalDetailComponent (consume GoalProgressBar G.1 + GoalProjectionBanner G.1 + AutoRuleSummary G.1)
5. ContributionHistoryComponent (paginacion Spring Page<T> · tabla simple)
6. GoalEditFormComponent (subclase de Create con prefill + status PUT solo ACTIVE/PAUSED)

### Routing real al cierre G.2 (savings-routing.module.ts)

LLD seccion 2 manda. Las 6 rutas definitivas:
```typescript
const routes: Routes = [
  { path: '', component: SavingsPageComponent, children: [
    { path: '', component: GoalListComponent },
    { path: 'nuevo', component: GoalCreateFormComponent },
    { path: ':id', component: GoalDetailComponent, canActivate: [GoalOwnerGuard] },
    { path: ':id/editar', component: GoalEditFormComponent, canActivate: [GoalOwnerGuard] },
    // /:id/aportar y /:id/auto se anaden en G.3 con sus modales
  ]}
];
```

### Lotes propuestos para G.2 (con confirmacion PO entre lotes)

**LOTE 2.1 - Container + Lista (2 components)**
- SavingsPageComponent (router-outlet wrapper · breadcrumb opcional)
- GoalListComponent (GET /goals?status=ACTIVE · empty-state si vacio · grid responsive)
Commit: feat(sprint26-step4): Fase G.2 LOTE 2.1 SavingsPage + GoalList

**LOTE 2.2 - Create form (1 component complejo)**
- GoalCreateFormComponent (ReactiveForm · CategoryPicker + icon-picker 12 + color-picker 8 + alert-info limite 10 metas + summary-box preview tiempo real)
- POST /goals con manejo error 422 (MaxGoalsReached)
Commit: feat(sprint26-step4): Fase G.2 LOTE 2.2 GoalCreateForm + summary preview

**LOTE 2.3 - Detail + History + Edit + Routing (3 components + routing)**
- GoalDetailComponent (consume 3 dumbs G.1 + timeline + acciones)
- ContributionHistoryComponent (paginado 20/pagina · sin @angular/cdk)
- GoalEditFormComponent (subclase prefill · PUT con validacion targetAmount >= reservedAmount)
- savings-routing.module.ts: Routes con 4 rutas reales
Commit: feat(sprint26-step4): Fase G.2 LOTE 2.3 detail+history+edit + routing real (cierre G.2)

### Patrones a aplicar (LEER ANTES de escribir)

- pfm-overview.component.ts (smart container con tabs)
- pfm-page.component.ts (page wrapper con shell)
- bizum-home.component.html (lista de items con empty-state)
- pfm-analysis.component.ts (composicion dumbs + smart logic)
- bizum-send.component.ts (ReactiveForm con validaciones complejas)

### Convenciones (HEREDADAS · NO PREGUNTAR)

- Sin signals (override S26 chat anterior · drift Code Reviewer Step 5)
- Sin @angular/cdk (paginacion manual con Spring Page<T>)
- userId en backend via request.getAttribute (LA-TEST-001)
- @RestControllerAdvice scoped basePackages=savings (LA-TEST-003)
- [(ngModel)] + FormsModule en filtros con reset programatico (LA-CORE-057)
- Math.abs() solo en derivados de cuentas (movements) NO en allocations.amount (LA-CORE-055 reverso · savings DDL CHECK >= 0)
- font-variant-numeric: tabular-nums en montos (LA-023-02)
- Templates inline si <80 lineas, externos si supera

---

## 7. Reglas/lecciones aplicables a partir de aqui

### Bloqueantes G-4 / G-4b
- **LA-CORE-056** prototype-fidelity-visual-review BLOQUEANTE en G-4 (PO screenshot comparison). En G.2 mas critica que en G.1 porque las pantallas completas son las que el PO revisara.
- **LA-CORE-068** nunca [href] para navegacion interna. En G.2 GoalList navega a detail con router.navigate(['/objetivos', id]) NO con [routerLink] (porque el id es dinamico) · GoalCard ya emite (clicked) que el padre captura.
- **LA-CORE-061 GR-GIT-001** verificar working tree antes de cualquier accion

### Tecnicas
- **LA-CORE-067** mcp-shell-stdio-buffer-limit: artefactos > 8KB fragmentar con appendFileSync. Este handoff confirma el patron - 4 bloques de ~5KB cada uno.
- **LA-CORE-055** sign-contract-backend: backend savings NO devuelve montos negativos (DDL CHECK >= 0). Math.abs() solo si en algun momento mostramos movimientos derivados de cuentas (no es el caso en savings).
- **LA-CORE-057** select-twoway-binding-reset: usar [(ngModel)] + FormsModule. Aplicado ya en CategoryPicker G.1 · replicar en filtros de GoalList si hay (status filter).
- **LA-CORE-046** widget degradacion elegante: en SavingsWidgetComponent G.4 si el endpoint falla mostrar empty-state suave en lugar de error.

### Hallazgos pendientes para Step 5 Code Reviewer (intactos · NO tocar)
- OBS-001: drift javadoc AccountReservePort vs JpaAccountReserveAdapter
- OBS-002: drift handoff totalActiveGoals vs DashboardWidgetDto.activeGoalsCount - YA APLICADO en savings.models.ts G.0
- OBS-003: field naming smell SavingsController (listGoals campo y metodo)
- OBS-004: jwt.session-ttl-seconds en application-integration-compose.yml

### Deudas Fase H (G-4b smoke)
- DEBT-051 ShedLock no cableado: SchedulingConfig + LockProvider + V18c apply manual + test IT
- DEBT-049 OpenAPI 3.1 validate-smoke-vs-openapi script
- DEBT-050 SKILL.md devops checklist pre-G-7
- Verificar SecurityConfig deja pasar /v3/api-docs/** y /swagger-ui/** sin JWT
- Lista explicita -Dtest para G-4b (DEBT-056 surefire-no-IT)

---

## 8. Comandos utiles

### Inspeccionar estado pipeline
node -e "const s=require('./.sofia/session.json'); console.log(JSON.stringify(s.step4_progress, null, 2))"

### Verificar archivos savings frontend
- Al arrancar G.2: 12 .ts (5 G.0 + 7 G.1)
- Al cierre G.2.1: 14 (+ SavingsPage + GoalList)
- Al cierre G.2.2: 15 (+ GoalCreateForm)
- Al cierre G.2.3: 18 (+ GoalDetail + ContributionHistory + GoalEditForm)
- Al cierre G.5: >=23 (12 + 6 G.2 + 4 G.3 + 1 widget G.4)

find apps/frontend-portal/src/app/features/savings -name "*.ts" | wc -l

### Verificar fidelidad prototipo (LA-CORE-056 BLOQUEANTE)
- screen-savings-list    linea 1190 - GoalListComponent (G.2.1)
- screen-savings-detail  linea 1325 - GoalDetailComponent (G.2.3)
- screen-savings-create  linea 1477 - GoalCreateFormComponent (G.2.2)
- screen-savings-contribute linea 1614 - ContributionModalComponent (G.3)
- screen-savings-autorule linea 1713 - AutoRuleFormComponent (G.3)

### Verificar GR-GIT-001 (debe ser 0)
git status --porcelain | grep '^ D' | wc -l

### Verificar BD del compose en V29
docker exec bankportal-postgres psql -U bankportal -d bankportal -c "SELECT version FROM flyway_schema_history WHERE version='29';"

### Verificar seeds V24_5 + V30 aplicadas
docker exec bankportal-postgres psql -U bankportal -d bankportal -c "SELECT version FROM flyway_schema_history WHERE version IN ('24.5','30');"

### Listar componentes G.1 disponibles para componer en G.2
find apps/frontend-portal/src/app/features/savings/components -name "*.component.ts" -exec basename {} \;

---

## 9. Prompt sugerido para el nuevo chat

Hola. Continuo trabajo en bank-portal · Sprint 26 · FEAT-024 (Objetivos de Ahorro) · Step 4 Developer.

ESTADO ACTUAL:
- Fases A+B+C+D+E+F+G.0+G.1 completadas y persistidas (52 backend + 12 frontend savings)
- Fase G.2 pendiente: 6 smart components + completar routing real
- Fases G.3, G.4, G.5, H pendientes
- Branch: feature/FEAT-024-sprint26 sincronizada con origin
- HEAD: b311524 (cierre G.1)

PASO 0 OBLIGATORIO antes de cualquier accion (LA-018-01 + LA-CORE-061 GR-GIT-001):
1. Leer .sofia/session.json integro
2. git status --porcelain | grep "^ D" | wc -l (debe ser 0)
3. Leer docs/handoffs/HANDOFF-sprint26-step4-fase-g2.md integro
4. Leer docs/architecture/sprint-26/LLD-frontend-FEAT-024-sprint26.md (autoridad)
5. find apps/frontend-portal/src/app/features/savings -name "*.ts" | wc -l (debe ser 12)

OBJETIVO DE ESTA SESION: arrancar Fase G.2 (smart components principales).
- LOTE 2.1: SavingsPageComponent + GoalListComponent
- LOTE 2.2: GoalCreateFormComponent (con icon-picker 12 + color-picker 8 inline)
- LOTE 2.3: GoalDetailComponent + ContributionHistoryComponent + GoalEditFormComponent + routing real

DECISIONES PO HEREDADAS Y CERRADAS (NO preguntar de nuevo):
- Modo: 3 lotes con confirmacion PO entre lotes (igual que G.1)
- Sin signals · sin @angular/cdk · sin environment.apiBaseUrl
- userId via request.getAttribute (LA-TEST-001)
- @RestControllerAdvice scoped (LA-TEST-003)
- Iconos categoria: emoji unicode inline
- CategoryPicker alcance: solo enum semantico (icon-picker 12 + color-picker 8 viven en GoalCreateForm)
- Granularidad sub-fases G persistida en step4_progress.g_subphases_completed[]
- Pre-flight Tier A: diferido a post-G-9 (no ahora)

REGLA DE CONFIANZA: cambios costosos/irreversibles requieren ~95% confianza, en otro caso preguntar. Preguntas agrupadas en un unico turno.

Cuando confirmes que has hecho el PASO 0, propones plan Fase G.2 LOTE 2.1 y arrancamos.

---

## 10. Salida esperada al cierre G.2

Cuando termines G.2:

- find apps/frontend-portal/src/app/features/savings -name "*.ts" | wc -l -> >=18
- savings.module.ts declarations completo (7 G.1 + 6 G.2 = 13 components)
- savings-routing.module.ts con 4 rutas reales (Lista / Crear / Detalle / Editar)
- 3 commits intermedios LOTE 2.1 + 2.2 + 2.3 + 1 commit cierre G.2
- session.json artifacts['4_s26_phase_g_dot_2'] persistido + step4_progress.g_subphases_completed=['G.0','G.1','G.2']
- Branch lista para handoff Fase G.3
- Pipeline reanuda Fase G.3 (modales + flujo SCA RN-F024-11)

---

## 11. Trazabilidad de commits Fase G hasta este handoff

```
b311524 feat(sprint26-step4): Fase G.1 LOTE 3 + cierre G.1 (7/7 dumbs · session persistida)
72c7488 feat(sprint26-step4): Fase G.1 LOTE 2 compuestos savings (2 components)
3de93a8 feat(sprint26-step4): Fase G.1 LOTE 1 primitivos savings (3 components)
55eec27 chore(sofia): consolidate la-sync 2.7.16 + test seeds pre-Fase-G.1
d77d60e docs(sprint26-step4): handoff Fase G.1 frontend Angular
a1dedca feat(sprint26-step4): Fase G.0 savings module scaffolding
41957f1 docs(sprint26-step4): handoff Fase G frontend Angular
8eee244 FEAT-024 Sprint 26 Step 4 Fase F.4 - 27 IT integration verde
2c6c258 FEAT-024 Sprint 26 Step 4 Fases A-E backend + F.1+F.2+F.3 unit tests
```

---

_HANDOFF generado por Claude (Opus 4.7) - 2026-05-07T15:18Z - sesion N (chat anterior post-G.1)_
_Vias de creacion: appendFileSync fragmentado en 5 bloques (LA-CORE-067)_
_Decisiones documentadas a la fecha: P1 boundary commit · P2 emoji unicode · P3 3 lotes G.1 · P4 sub-fases G persistidas · P5 push tras consolidacion_
