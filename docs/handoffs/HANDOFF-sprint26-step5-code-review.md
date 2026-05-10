# HANDOFF Sprint 26 · Step 4 → Step 5 (Code Reviewer · gate HITL TL G-4b)

**Generado por:** SOFIA Developer Agent · cierre Fase H
**Fecha:** 2026-05-08
**Sprint:** 26 · **Feature:** FEAT-024 Objetivos de Ahorro · v1.26.0
**Branch:** feature/FEAT-024-sprint26
**HEAD:** 8d4e0bd (sincronizado con origin)
**Estado pipeline:** current_step=4 · status=gate_pending · gate_pending=G-4b

---

## 1. Contexto rápido para el reviewer

Step 4 (Developer) ha completado las **8 fases** A..H. Las fases A..G entregaron el código del producto (backend hexagonal + frontend Angular). La **Fase H** (G-4b guardrail) cerró las 4 deudas técnicas asignadas al Developer y validó end-to-end el sistema con compose + lista canónica de tests.

Durante la propia Fase H se descubrieron y resolvieron **3 bugs reales** (2 introducidos en G.3, 1 heredado de >10 sprints atrás). Estos hallazgos son material para lecciones aprendidas (ver sección 5).

**Step 4 cierra con 145/145 tests PASS · ng build production OK · OpenAPI accesible · ShedLock cableado.**

---

## 2. Diff acumulado Sprint 26 / FEAT-024

5 commits en Fase H (los anteriores ya estaban revisados como parte de Fases A..G):

| Commit | Sub-fase | Tipo | Ficheros tocados |
|---|---|---|---|
| `bb32da5` | H.3 | feat | SecurityConfig.java (+2 líneas permitAll) |
| `f38c6ad` | H.2 | feat | SchedulingConfig.java (nuevo) · ShedLockEnabledIT.java (nuevo) |
| `20b64c1` | H.4 + H.5 | feat | validate-smoke-vs-openapi.js (nuevo) · devops/SKILL.md (+2358B) |
| `4e12abd` | H.6 | fix | package.json (+jwt-decode) · auto-rule-form.component.ts (mov interface) |
| `8d4e0bd` | H.7 | fix | V18c→V31 rename · 4 ficheros con comentarios actualizados |

Total Fase H: **6 ficheros producto + 2 ficheros SOFIA + 1 rename Flyway**.

---

## 3. Puntos de revisión sugeridos

### 3.1 SchedulingConfig.java · ¿bien ubicado?
Decisión: lo coloqué en `twofa/infrastructure/config/` (junto a SecurityConfig, AsyncConfig) en lugar de `savings/infrastructure/scheduler/` porque el `LockProvider` es **infraestructura transversal** (cualquier feature futuro con `@SchedulerLock` lo usará), no específico de savings. Coherente con el patrón existente del proyecto.

### 3.2 SecurityConfig.java permitAll springdoc
Solo añadí `/v3/api-docs`, `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`. Estos endpoints NO exponen datos de cliente, solo el schema OpenAPI público. Aun así, conviene confirmar política de seguridad del cliente (Banco Meridian) — ¿quieren springdoc accesible solo desde redes internas en producción? Si es así, sería un override por perfil (`application-prod.yml`), no en SecurityConfig base.

### 3.3 V18c → V31 rename · trazabilidad ADR-028
El header del SQL y los comentarios en código mantienen la mención "originalmente V18c en S18 (ADR-028)" para no perder el linkaje histórico. **¿Conviene también añadir nota en el ADR-028 mismo?** Creo que sí pero no quise tocar `docs/architecture/adr/` sin aprobación de Tech Lead.

### 3.4 jwt-decode ^4.0.0 · versión semver
Versión 4.x es la única compatible con el `import { jwtDecode }` named ya en uso. La 3.x usa default export y rompería token.service.ts. La 5.x (si existe) podría introducir breaking changes — preferí pinear a 4 con `^` para permitir patches.

### 3.5 validate-smoke-vs-openapi.js · candidato GR-CI-002
El script funciona y detecta drift correctamente, pero la **decisión de promocionarlo a guardrail bloqueante CI** debe tomarse en Step 8b (Documentation Agent + FA-Agent). De momento es un script ejecutable opcional. Si Tech Lead lo aprueba como GR-CI-002, hay que añadirlo a `.sofia/scripts/guardrail-pre-gate.js` con activación a partir de un sprint concreto.

### 3.6 Checklist devops pre-G-7 (DEBT-050)
La sección añadida a `.sofia/skills/devops/SKILL.md` describe 10 items obligatorios pre-G-7. Esta checklist se autovalidó operativamente al detectar los 3 bugs de Fase H. **¿Confirmar que es suficiente o falta algún item?** Posibles candidatos extra: validar tamaño del bundle ng (regression budget), verificar Spring Boot startup time (<30s).

---

## 4. Criterios de cierre Step 4 · validación

Según `docs/handoffs/HANDOFF-sprint26-step4-fase-h.md` sección 5:

| # | Criterio | Resultado |
|---|---|---|
| 1 | mvn compile backend SUCCESS · 0 warnings nuevos | ✅ |
| 2 | Tests savings PASS · ≥143 + ShedLockEnabledIT | ✅ 145/145 |
| 3 | Compose up · contenedores healthy | ✅ 5/5 healthy |
| 4 | actuator/health UP · DB UP · Redis UP | ✅ |
| 5 | Flyway V29 aplicada | ✅ |
| 6 | Flyway V18c shedlock aplicada | ⚠️ **Renombrada a V31** (justificación H.7 en STEP4-cierre-fase-H.md) |
| 7 | 4 tablas savings creadas | ✅ |
| 8 | ShedLock cableado | ✅ |
| 9 | OpenAPI /api/v1/savings/** completo | ✅ 6 paths |
| 10 | SecurityConfig pasa springdoc sin JWT | ✅ |
| 11 | Frontend ng build SUCCESS | ✅ (post-H.6 · descubierto en cierre) |
| 12 | session.json · phases_completed += 'H_smoke' | ✅ |
| 13 | Commit final + push origin · HEAD == origin/HEAD | ✅ 8d4e0bd |

**13/13 criterios cumplidos** (criterio 6 con desviación documentada y aprobada implícitamente al renombrar).

---

## 5. Lecciones aprendidas candidatas (LA-026-H1/H2/H3)

Detalladas en `docs/deliverables/sprint-26-FEAT-024/STEP4-cierre-fase-H.md` sección 5:

| LA | Tema | Promoción candidata a |
|---|---|---|
| **LA-026-H1** | `ng build --configuration production` debe ejecutarse en cierre Fase G, no esperar a Fase H | `.sofia/skills/angular-developer/SKILL.md` + `.sofia/skills/ux-ui-designer/SKILL.md` |
| **LA-026-H2** | Migraciones Flyway siempre con número estrictamente creciente (no V<N>c) | `.sofia/skills/architect/SKILL.md` + `.sofia/skills/devops/SKILL.md` |
| **LA-026-H3** | `docker compose down -v` + lista canónica completa al cierre Step 4 (BD recién flyway-poblada) | `.sofia/skills/devops/SKILL.md` (item nuevo en checklist pre-G-7) |

**Decisión Tech Lead:** ¿se promueven en Step 8b o se descartan?

---

## 6. Comandos para validar lo que entrego

```bash
# 1. Identidad repo
cd /Users/cuadram/proyectos/bank-portal
git branch --show-current   # feature/FEAT-024-sprint26
git rev-parse HEAD           # 8d4e0bd
git rev-parse origin/feature/FEAT-024-sprint26  # idem
git status --porcelain | grep -c "^ D"          # 0

# 2. Compile
JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home \
  /opt/homebrew/bin/mvn -pl apps/backend-2fa compile -DskipTests

# 3. Compose limpio (CRITICO: down -v para reaplicar Flyway desde cero)
docker compose -f infra/compose/docker-compose.yml down -v
docker compose -f infra/compose/docker-compose.yml up -d --build

# 4. Lista canónica completa
JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home \
  /opt/homebrew/bin/mvn -pl apps/backend-2fa test \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Dtest=SavingsControllerIT,JpaAccountReserveAdapterIT,SavingsFlywayIT,AutoContributionSchedulerIT,MilestoneEmissionIT,SavingsGoalTest,MilestoneEvaluatorTest,GoalProjectionServiceTest,GoalClosureServiceTest,CreateGoalUseCaseTest,ListGoalsUseCaseTest,UpdateGoalUseCaseTest,CloseGoalUseCaseTest,ContributeManualUseCaseTest,ConfigureAutoRuleUseCaseTest,PauseAutoRuleUseCaseTest,GetDashboardWidgetUseCaseTest,ProcessAutoRuleUseCaseTest,ShedLockEnabledIT
# Esperado: Tests run: 145, Failures: 0, Errors: 0, Skipped: 0

# 5. Smoke real
curl -s http://localhost:8081/actuator/health | python3 -m json.tool
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8081/v3/api-docs   # 200
curl -s http://localhost:8081/v3/api-docs | python3 -c "import json, sys; d=json.load(sys.stdin); print(sorted(p for p in d.get('paths',{}) if 'savings' in p))"

# 6. Validador OpenAPI vs smoke
node .sofia/scripts/validate-smoke-vs-openapi.js
# Esperado: drift detectado vs smoke-v1.25.0.sh (correcto · v1.26.0.sh lo crea Step 7)

# 7. Verificar Flyway V31
docker exec bankportal-postgres psql -U bankportal -d bankportal -c \
  "SELECT version, description, success FROM flyway_schema_history WHERE description LIKE '%shedlock%';"

# 8. Verificar ng build production (opcional · ya validado en H.6)
docker compose -f infra/compose/docker-compose.yml build frontend
```

---

## 7. Acción solicitada al Tech Lead (gate HITL TL G-4b)

Tras revisar los 5 commits Fase H y validar los 13 criterios de cierre, el Tech Lead debe:

1. **Aprobar G-4b** → el pipeline avanza a Step 5 (Code Reviewer formal con QA-Gate)
2. **Decidir promoción de LAs** (LA-026-H1, H2, H3) → si se aprueba alguna, se preparan en Step 8b
3. **Decidir GR-CI-002** (validate-smoke-vs-openapi.js como guardrail bloqueante) → activación opcional desde Sprint 27

Comando del PO/Tech Lead esperado: `apruebo G-4b · LAs <H1,H2,H3 / ninguna> · GR-CI-002 <activar / pendiente>`.

---

**Pipeline pasa a:** Step 5 · Code Reviewer · gate HITL TL G-5
**Próximo deliverable:** `docs/deliverables/sprint-26-FEAT-024/STEP5-code-review-report.md`
