# HANDOFF — Sprint 27 · Step 4 (DEVELOP) · Cierre campaña BUG-PO FEAT-023
**Fecha:** 2026-06-02T08:01Z · **Proyecto:** BankPortal (Banco Meridian) · **Branch:** develop · **HEAD:** 87a5d32 · **origin/develop = HEAD (0/0, PUSHEADO)**

## Estado pipeline
- Sprint 27 `S27-saneamiento+deudas` · Step 4/15 `in_progress` · `gate_pending=null`.
- Steps completados: 1, 2, 3, 3b. Próximos gates: G-5 (CR) → G-5b (Sec) → **G-6 (QA BLOQUEANTE, TEST-*.xml, `mvn -Pit verify`)** → G-7 → G-8 → Step 9.
- **Git: árbol limpio · develop = origin/develop = `87a5d32` · 0/0 · TODO PUSHEADO.**

## Lo hecho esta sesión — campaña BUG-PO FEAT-023 COMPLETA (10 commits `06f38a0`→`87a5d32`)
Método: verificar+reconciliar por componente vs prototipo (NO reimplementar). Cada lote: código vs proto+catálogo → captura PO → clasificar → commit. Catálogo: `docs/qa/BUG-REPORT-PO-FEAT-023-sprint25.md` (con reconciliación S27). Proto: `docs/ux-ui/prototypes/PROTO-FEAT-023-sprint25.html`.

### Lote Distribución
- **BUG-PO-022** (CORREGIDO raíz backend `06f38a0`): `JdbcPfmTransactionReadAdapter` tomaba siempre el primer token (`SPLIT_PART(...,1)`) → "RECIBO ALQUILER"→RECIBO. Fix SQL nativo (ambas ramas UNION, ADR-039): primer token >4 no genérico `{RECIBO,PAGO,CARGO,ABONO,CUOTA,FACTURA,TRANSFERENCIA}` vía `unnest+WITH ORDINALITY` + `COALESCE` fallback. Se retiró el filtro `WHERE LENGTH(first)>4`. **RECARGA FUERA de la lista por decisión PO** (alternativa "TARJETA" no mejoraba). Verificado: #1 RECIBO→**ALQUILER** 850. LA-027-10.
- **BUG-PO-033** (CORREGIDO `9bb2870`): top-5 + fila-link "Ver los N comercios →" que expande inline a 10 (sin ruta nueva, sin `[href]`, GR-ANGULAR-001). `screen-merchant-detail` del proto NO se implementa (excede saneamiento).
- **019/020/032/034**: ya-hecho (drift S25), verificados.
- **BUG-PO-006 / donut**: el "donut" renderiza como tarta sólida; **el prototipo (línea 653) también es tarta** → NO hay brecha de fidelidad (GR-VISUAL-001 cumplido). Donut real = cambio de diseño → gate UX PO+TL futuro. **Decisión PO: NO se registra DEBT; solo nota en catálogo.**

### Lote Presupuestos/Form
- **025-029**: TODOS ya-hecho (drift S25), verificados visualmente. Sin cambio de código.
- **H-3** (CORREGIDO `6a23215`): `BudgetProgressBar.statusText` ("Quedan/Excedido") usaba `toFixed(2)` (punto, sin miles) vs pipe `number` (coma+miles). Helper `fmt()` con `toLocaleString('es-ES')`. Verificado "Quedan 40,00 €", "Servicios 1.200,55 €". LA-027-12.
- Reconciliación: el select ofrece 13 categorías (incluye **Servicios**, categoría real del motor; proto hardcodeaba 12) → componente correcto.

### Lote 035/023
- **BUG-PO-035/023** (CORREGIDO `7add819`): `PfmPageComponent` getter `subtitle` con switch sobre `activeTab`. overview "Resumen financiero · {mes}" dinámico (cierra 023), presupuestos/analisis/distribucion con copy propio. Verificadas las 4 pestañas.

### Hallazgos cascada (no catalogados) corregidos
- **H-1** (`9bb2870`): plural `transacción`+`es`→`transacciónes`. Corregido a `transacciones` (palabra completa por rama). LA-027-11.
- **H-3** (ver arriba). **H-4** (`e8ef092`): deltas % en `PfmAnalysisComponent` con `toFixed(1)` (punto) vs variación global con coma. `toLocaleString('es-ES')`. Verificado "+281,8%", "+1678,7%". LA-027-12.

## Commits de la sesión (10, cronológico) — TODOS PUSHEADOS
| # | SHA | Concepto |
|---|-----|----------|
| 1 | `06f38a0` | fix BUG-PO-022 tokenización (backend SQL) |
| 2 | `9bb2870` | fix BUG-PO-033 top-5+link + H-1 plural |
| 3 | `6d941fc` | docs reconciliación Distribución + LA-027-10/11 |
| 4 | `6a23215` | fix H-3 formato monetario es-ES (BudgetProgressBar) |
| 5 | `2c5facd` | docs reconciliación Presupuestos/Form 025-029 + LA-027-12 |
| 6 | `7add819` | fix BUG-PO-035/023 subtítulo por pestaña |
| 7 | `0ef8f08` | docs reconciliación 023/035 |
| 8 | `e8ef092` | fix H-4 separador decimal % (Análisis) |
| 9 | `87a5d32` | docs registrar H-4 |
> (Commit 87a5d32 incluido; el push final llevó `0ef8f08..87a5d32`.) GR-GIT-001 OK (0 borrados de fichero `128a91d..87a5d32`).

## Jira
- **SCRUM-181** (BUG-PO menores 023-035, umbrella 13) → **Finalizada** (MCP, transición id 31). DoD "verificado por PO" cumplido.
- **SCRUM-182** (BUG-PO mayores 012-022, umbrella 11) → **Finalizada** (MCP). DoD cumplido.
- **SCRUM-175..180 (tech debts) siguen EN CURSO** — NO completas. Cierre selectivo correcto (no corromper tablero).
- Cierre del **sprint**: pendiente UI del PO (GR-ATLASSIAN-001; MCP no cierra sprints).

## SIGUIENTE TRABAJO Sprint 27 — tech debts SCRUM-175..180
1. **SCRUM-175** DEBT-062 — verificación + **acta** cierre IT lifecycle (22/22 vía `mvn -Pit verify`) + reconciliar session.json. (raíz ya cerrada en NC-CMMI-001; falta evidencia formal).
2. **SCRUM-176** DEBT-064 — migrar 4 IT Testcontainers→integration-compose + fixtures SQL. **BLOQUEADA** (Testcontainers 1.20.1 vs Docker 29.4.1, Status 400). Riesgo R-S27-01: fallback upgrade Testcontainers + mover a S28 si excede 5 SP.
3. **SCRUM-177** DEBT-065 — renombrar 5 `*IT`→`*Test` (slices @WebMvcTest a surefire).
4. **SCRUM-178** DEBT-054 — GR-CONFIG-001: merge profundo YAML profiles + validador `validate-yaml-profiles.js` + bloqueo G-4b.
5. **SCRUM-179** DEBT-053 — paginación AutoContributionScheduler (LLD §11): overload `findDueForExecution(Instant,Pageable)`.
6. **SCRUM-180** DEBT-059 — mensaje excepción savings sin importes (CWE-209, UpdateGoalUseCase:50).

## RETOMAR — pasos de arranque
1. Leer `.sofia/session.json` (`resume_next`) + este handoff. Boot-check: pwd + `git remote get-url origin` + `git branch --show-current` + `git status --porcelain | grep "^ D"`. Esperado: develop, HEAD `87a5d32`, 0/0, árbol limpio.
2. Entorno dev (sigue arriba esta sesión; si parado, relanzar):
   - `docker compose -f infra/compose/docker-compose.yml up -d backend postgres redis mailhog`
   - `ng serve --port 4201` detached desde `apps/frontend-portal` (log `.sofia/tmp/ng-serve.log`). Front sirve en `localhost:4201` (IPv6 `::1`, NO `127.0.0.1`).
   - Puertos: front 4201, back 8081, PG 5433, redis 6380, mailhog 8025. OTP `123456`.
   - BD persistió esta sesión (seed Junio = 20 tx, `spending_categories` sin negativos). NO re-seed salvo BD recreada.
3. Maven vía `node spawnSync` con `JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home`, desde `apps/backend-2fa`. Tras tocar backend: `mvn -q package -DskipTests` + `docker compose up -d --build backend`.
4. Empezar por tech debts (DEBT-065/177 y DEBT-059/180 son los más baratos y desbloqueados; 064/176 bloqueada).

## Deudas OPEN relevantes
- DEBT-063 (TIN/TAE AmortizationCalculator) BLOQUEADA gate legal Banco Meridian (DR-S27-001).
- DEBT-064 (4 IT Testcontainers) BLOQUEADA → SCRUM-176.
- DEBT-065 (5 @WebMvcTest mal nombrados) → SCRUM-177.
- DEBT-067 (IT alert-insert, bloqueada por DEBT-064), DEBT-068 (GET /overview escribe).
- DEBT-053/054/059 → SCRUM-179/178/180.

## Guardrails activos
GR-GIT-001 (0 borrados/commit) · plan→aprobación→ejecución→verificar-desde-disco · push solo con OK PO (hecho esta sesión) · LA-018-01 (leer session.json) · LA-CORE-067 (ficheros grandes por chunks) · GR-ANGULAR-001 (sin `[href]`) · GR-ATLASSIAN-001 (sprint lifecycle solo UI) · usar SIEMPRE tool sofia-shell-bank-portal.
