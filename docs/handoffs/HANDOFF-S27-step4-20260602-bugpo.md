# HANDOFF — Sprint 27 · Step 4 (DEVELOP) · Lote BUG-PO PFM
**Fecha:** 2026-06-02T05:08Z · **Proyecto:** BankPortal (Banco Meridian) · **Branch:** develop · **HEAD:** 7f3d11e

## Estado pipeline
- Sprint 27 `S27-saneamiento+deudas` · Step 4/15 `in_progress` · `gate_pending=null` (sin gate bloqueado).
- Steps completados: 1, 2, 3, 3b. Próximos gates: G-5 (CR/TL) → G-5b (Sec) → **G-6 (QA BLOQUEANTE, exige TEST-*.xml)** → G-7 (DevOps) → G-8 (Docs) → Step 9.
- **Git: árbol limpio · 20 commits ahead de origin/develop · 0 behind · SIN PUSH** (pendiente autorización Angel).

## Workstream en curso: lote frontend BUG-PO PFM (FEAT-023)
Método aprobado: **verificar+reconciliar por componente vs prototipo**, NO reimplementar (catálogo S25 arrastra drift). Por lote: comparar código vs prototipo+catálogo → captura PO → clasificar (ya-hecho / brecha-real / reconciliar) → commit.
Catálogo: `docs/qa/BUG-REPORT-PO-FEAT-023-sprint25.md` (con sección "Reconciliación Sprint 27"). Prototipo: `docs/ux-ui/prototypes/PROTO-FEAT-023-sprint25.html`.

## CERRADO y verificado visualmente (PO) esta sesión

### Lote Overview/Movimientos
- **BUG-PO-012** (fecha movimiento): brecha real, implementada end-to-end (5 capas back + 2 front). Commit `01e90a7`. Nota: la fila vive inline en `PfmOverviewComponent`, no en `PfmMovimientoRowComponent` (drift catálogo).
- **013/014/015/024**: ya implementados (drift S25). Único cambio real: 014 mes `'Abril 2026'` fijo → `formatYearMonth(new Date()...)` dinámico.

### Lote Análisis
- **018/021/030/031**: ya implementados (drift S25), verificados. El front es robusto al signo (aplica abs, ignora `variacion` del backend).

### BUG-PO-001 (CRÍTICO, transversal) — CERRADO EN RAÍZ COMPLETA (3 capas)
1. Display front `BudgetProgressBar` (abs, ya en S25).
2. `BudgetService.getSpent().abs()` — commit `d7610af` + test `BudgetServiceSpentTest`.
3. **RAÍZ**: escritor caché `SpendingCategoryService` guarda **magnitud** — commit `cce5a6a` + test `SpendingCategoryServiceTest.cacheAlmacenaMagnitudPositiva`. Era la fuente: la caché `spending_categories` guardaba importe firmado (negativo CARGO) → filtro de Análisis `actual>0||anterior>0` descartaba OTROS/SERVICIOS de Junio y subestimaba el total.
- Reparación BD dev: `UPDATE spending_categories SET amount=abs(amount) WHERE amount<0` (8 filas).

### Bug NO catalogado (hallazgo por efecto cascada)
- **alert-insert**: `JpaBudgetAlertAdapter.save` bindeaba `Instant` sin tipo SQL → PSQLException → 500 en `/overview`. Afloró al activar 001 (las alertas saltaron por primera vez desde S25). Fix `.param("now", Timestamp.from(now))` — commit `2ca4538`.

## Commits de la sesión (8, orden cronológico) — SIN PUSH
| # | SHA | Concepto |
|---|-----|----------|
| C1 | `01e90a7` | fix BUG-PO-012 fecha movimiento Overview (8 fich.) |
| C2 | `2ca4538` | fix alert-insert Instant→Timestamp (1) |
| C3 | `d7610af` | fix BUG-PO-001 getSpent magnitud + test (2) |
| C4 | `2aa26b1` | docs reconciliación BUG-PO + LA-027-07/08 + DEBT-067/068 (3) |
| C5 | `24b9522` | chore seed dev Junio + gitignore .sofia/pav/ (2) |
| C6 | `cce5a6a` | fix BUG-PO-001 RAÍZ caché magnitud + test (2) |
| C7 | `1cef7d5` | docs reconciliación lote Análisis + LA-027-09 (3) |
| C8 | `7f3d11e` | chore cierre sesión resume_next (1) |

Tests verde a lo largo: BudgetServiceSpentTest 2/2, SpendingCategoryServiceTest 6/6, PfmCategorizationServiceTest 4/4, SpendingCategoryExtensionTest 14/14, BudgetDomainTest 6/6. GR-GIT-001 OK (0 borrados de fichero en los 8 commits).

## PENDIENTE FEAT-023 (próximos lotes Step 4)
1. **Distribución** (siguiente lógico): BUG-PO-019/020/032/033/034 — donut + top comercios. Backend: `findTopComerciosUnificados`. Ojo **BUG-PO-022** (tokenización comercios, backend `JdbcPfmTransactionReadAdapter`).
2. **Menores Presupuestos/Form**: BUG-PO-025-029 (`BudgetFormComponent`).
3. **BUG-PO-035**: subtítulo exterior fijo "Gestiona tus finanzas personales" (`PfmPageComponent`) → debe cambiar por pestaña.

## Deudas OPEN (5)
- DEBT-060 (Spring Boot 3.3.4→3.3.6+, CVE LOW, S28-mant)
- DEBT-063 (TIN/TAE AmortizationCalculator, BLOQUEADA gate legal Banco Meridian, DR-S27-001)
- DEBT-066 (cobertura @WebMvcTest .twofa, S28)
- DEBT-067 (IT alert-insert, BLOQUEADA por DEBT-064 Testcontainers)
- DEBT-068 (GET /overview tiene efecto de escritura — smell diseño)
> Nota higiene: 12 deudas cerradas siguen físicamente en `open_debts[]` con status=CLOSED (ruido de registro, no afecta ejecución). Reconciliar a `closed_debts[]` cuando se decida.

## RETOMAR — pasos de arranque
1. Leer `.sofia/session.json` (`resume_next`) + este handoff. Boot-check: pwd + remote + branch + `git status --porcelain | grep "^ D"`.
2. Levantar entorno dev:
   - `docker compose -f infra/compose/docker-compose.yml up -d backend postgres redis mailhog` (imágenes local-dev ya construidas).
   - `ng serve --port 4201` detached desde `apps/frontend-portal` (log a `.sofia/tmp/ng-serve.log`). NO usar compose frontend (nginx :80) a la vez.
   - Puertos: front 4201, back 8081, PG 5433, redis 6380, mailhog 8025. OTP bypass `123456`.
3. **Re-sembrar datos si la BD se recreó**: `docker cp infra/dev-seed/seed-pfm-junio-2026.sql ...` + psql -f, y `UPDATE spending_categories SET amount=abs(amount) WHERE amount<0` (la reparación de signo NO está en migración; solo BD dev). Usuario seed `00000000-...-001`.
4. Maven vía `node spawnSync` con JAVA_HOME openjdk@21, desde `apps/backend-2fa`. Tras tocar backend: `mvn -q package -DskipTests` + `docker compose up -d --build backend`.
5. Continuar por lote **Distribución** (verificar+reconciliar). Cada fix backend que toque flujos antes muertos → re-verificar end-to-end (LA-027-07).

## Decisiones pendientes de Angel (no urgentes)
- **Push** de los 20 commits a origin/develop.
- Cierre formal Jira SCRUM-175..182 (UI; MCP no cierra sprints).
- Promoción LA-027-01..09 a SOFIA-CORE (Step 9).

## Guardrails activos relevantes
GR-GIT-001 (0 borrados/commit) · plan→aprobación→ejecución→verificar-desde-disco · sin push sin OK · leer session.json antes de actuar (LA-018-01) · ficheros grandes por appendFileSync<6KB (LA-CORE-067) · usar SIEMPRE tool sofia-shell-bank-portal (proyecto activo por defecto puede ser otro).
