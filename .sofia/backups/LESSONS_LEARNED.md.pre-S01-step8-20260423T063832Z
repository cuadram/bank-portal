# LESSONS LEARNED — bank-portal

> Generado: 2026-04-21T05:30:23.195185Z | Total: 22 LAs
> LAs proyecto: 12 | LAs SOFIA-CORE integradas: 10
> Sprint 25 CERRADO — FEAT-023 Mi Dinero (PFM) — v1.25.0
> Promoción Sprint 25 → SOFIA-CORE v2.6.59 completada (LA-CORE-059, 060, 061)

## LAs del Proyecto

### LA-025-12 · process/governance/git

**working-tree-git-divergence-undetected**

**Descripción:** SOFIA ejecutó una sesión de arranque completa (lectura session.json, skill loader, inicialización Orchestrator) sin detectar que el working tree tenía 842 ficheros borrados respecto al HEAD de Git — toda la carpeta apps/ (backend-2fa + frontend-portal + CLAUDE.md raíz). Consecuencia: durante la sesión se generó LA-025-11 con un diagnóstico arquitectónico erróneo ('separación docs/code sin enlace'), se propusieron remediaciones costosas (submodules, workspace padre), y se asumió que el código nun...

**Corrección / Regla:** Añadir guardrail GR-GIT-001 al Orchestrator (inicialización SOFIA, antes de cualquier skill): ejecutar `git status --porcelain | grep '^ D' | wc -l`; si el resultado > 0, bloquear con alerta detallando número de ficheros borrados y sugerir `git restore` como acción correctiva. Complementariamente añadir al bloque de arranque: (a) contador de ficheros .java y .ts en apps/ vs. cuenta esperada persistida en session.json.repository.expected_file_counts; (b) verificación de existencia de apps/backend...

**Promoción:** ✅ Promovida a LA-CORE-061 en SOFIA-CORE v2.6.59 · Guardrail oficial: GR-GIT-001 · Promoted_at: 2026-04-20T19:55:00.000Z

---

### LA-025-11 · governance/repository

**sofia-project-dir-without-source-code**

**Descripción:** El directorio SOFIA del proyecto (/Users/cuadram/proyectos/bank-portal) no contiene el codigo fuente Java ni Angular. El docker-compose.yml hace build desde ../../apps/backend-2fa y ../../apps/frontend-portal, rutas que no existen en el filesystem accesible. El contenedor bankportal-backend corre sobre una imagen pre-construida (bankportal-backend-2fa:local-dev) cuyo origen esta desacoplado del checkout documental. Consecuencia: auditorias de arquitectura contra la documentacion (HLD, LLD, sessi...

**Corrección / Regla:** Tres opciones: (a) incorporar apps/backend-2fa y apps/frontend-portal como git submodules del repositorio bank-portal para que el checkout SOFIA contenga la fuente canonica; (b) renombrar la raiz SOFIA a /Users/cuadram/proyectos/bank-portal-docs y crear un workspace padre que contenga apps/* y docs/* como hermanos; (c) si la separacion se mantiene, anadir un guardrail GR-REPO-001 que bloquee Step 4 y Step 5 si no existe ruta hacia el codigo fuente y registre la ubicacion real en session.json.rep...


---

### LA-025-10 · process/tooling

**mcp-atlassian-lacks-sprint-lifecycle-api**

**Descripción:** Las herramientas MCP Atlassian disponibles (searchJiraIssuesUsingJql, getJiraIssue, transitionJiraIssue, editJiraIssue, addCommentToJiraIssue, getTransitionsForJiraIssue, createIssueLink, etc.) cubren la Jira Platform REST API v3 sobre issues, pero NO exponen la Jira Agile REST API (/rest/agile/1.0/sprint/{id}) que es la unica via oficial para transicionar un sprint de active → closed. Consecuencia: Step 9 Workflow Manager puede finalizar todos los issues via transitionJiraIssue pero NO puede co...

**Corrección / Regla:** Tres opciones de mejora: (a) solicitar a Anthropic/Atlassian que amplie el MCP server para incluir endpoints Agile API (completeSprint, createSprint, updateSprint, moveIssuesToSprint); (b) incluir en SOFIA un wrapper Node con https.request + ATLASSIAN_API_TOKEN en .env (fuera del repo) que encapsule completeSprint; (c) hasta que exista soporte nativo, documentar explicitamente en la skill workflow-manager/SKILL.md que la accion final de cerrar sprint en Jira es manual PO-UI y que el Step 9 termi...

**Promoción:** ✅ Promovida a LA-CORE-060 en SOFIA-CORE v2.6.59 · Guardrail oficial: GR-ATLASSIAN-001 · Promoted_at: 2026-04-20T19:55:00.000Z

---

### LA-025-09 · process/tooling

**dashboard-script-completed-steps-schema-mismatch**

**Descripción:** .sofia/scripts/gen-global-dashboard.js espera session.completed_steps como Array (calls .includes), pero el session.json lo persiste como objeto {sprint, feature, steps:[]}. Al ejecutar directamente el script falla con TypeError: completedSteps.includes is not a function. Workaround actual: wrapper Node que normaliza el campo antes de invocar, restaura el formato objeto después. Bloquea la regeneracion automatica del Dashboard Global en cada Gate (GR-DASH-001 incumplida). Bug cosmetico adicional...

**Corrección / Regla:** Refactorizar gen-global-dashboard.js para: (a) aceptar ambos formatos con normalizacion al cargar session.json — const completedSteps = Array.isArray(S.completed_steps) ? S.completed_steps : (S.completed_steps?.steps || []); (b) corregir la concatenacion del banner: gateLabel debe usar GP.step tal cual sin prefijo GATE- si ya contiene G-. Tests de regresion con ambos schemas. Promover a SOFIA-CORE como LA-CORE-058 y actualizar gen-global-dashboard.js en todos los proyectos registrados.

**Promoción:** ✅ Promovida a LA-CORE-059 en SOFIA-CORE v2.6.59 · Guardrail oficial: GR-DASH-002 · Promoted_at: 2026-04-20T19:55:00.000Z

---

### LA-025-08 · frontend/angular

**select-twoway-binding-reset**

**Descripción:** select con (change) unidireccional no sincroniza DOM al resetear la variable programaticamente. Filtro de categorias no quedaba marcado y el reset no funcionaba.

**Corrección / Regla:** [(ngModel)] + FormsModule para bidireccional. NUNCA (change) solo en controles con reset programatico.

**Estado:** Candidata SOFIA-CORE · Aprobada PO · pendiente promoción · Guardrail propuesto: —

---

### LA-025-07 · frontend/process

**prototype-fidelity-not-verified-g4-g5**

**Descripción:** 36 bugs por no leer el prototipo pantalla a pantalla. LA-CORE-041 y LA-CORE-043 no aplicadas. Developer implemento de memoria sin comparar con el HTML del prototipo aprobado.

**Corrección / Regla:** Checklist fidelidad BLOQUEANTE en G-4: verificar cada elemento del prototipo contra el componente Angular. PO hace screenshot comparison antes de aprobar G-4b.

**Estado:** Promovida a SOFIA-CORE como LA-CORE-056 (2026-04-16, GR-VISUAL-001). Cerrada superseded en SOFIA-CORE Sprint S01 Step 6 SC-14 (2026-04-22T16:03:08.949559Z). **No crear LA-CORE-069** - duplicacion semantica evitada.

---

### LA-025-06 · frontend/angular

**sign-contract-backend**

**Descripción:** Backend devuelve CARGO con signo negativo. Frontend debe aplicar Math.abs() antes de renderizar. Contrato no documentado en LLD/SRS. Corrompe porcentajes, semaforo y variaciones.

**Corrección / Regla:** Math.abs() en todos los mapeos de amount/spent/percentConsumed. Documentar en LLD. Tests con valores negativos en mocks CARGO.

**Estado:** Candidata SOFIA-CORE · Aprobada PO · pendiente promoción · Guardrail propuesto: —

---

### LA-025-04 · process/governance

**desde bank-portal Sprint 25 — current_step en session.json no se actualizaba al ...**

**Descripción:** desde bank-portal Sprint 25 — current_step en session.json no se actualizaba al avanzar entre steps — quedó en

**Corrección / Regla:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.


---

### LA-025-03 · ux/process

**desde bank-portal Sprint 25 — UX/UI Designer Agent generó PROTO-FEAT-023-sprint2...**

**Descripción:** desde bank-portal Sprint 25 — UX/UI Designer Agent generó PROTO-FEAT-023-sprint25 desde el scaffold genérico d

**Corrección / Regla:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.


---

### LA-025-02 · process/fa-agent

**desde bank-portal Sprint 25 — Step 2b debe invocar gen-fa-document.py para actua...**

**Descripción:** desde bank-portal Sprint 25 — Step 2b debe invocar gen-fa-document.py para actualizar el FA Word consolidado a

**Corrección / Regla:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.


---

### LA-025-01 · process/governance

**desde bank-portal Sprint 25 — Gate G-2 Sprint 25 aprobado explícitamente por el ...**

**Descripción:** desde bank-portal Sprint 25 — Gate G-2 Sprint 25 aprobado explícitamente por el PO pero no persistido en sessi

**Corrección / Regla:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.


---

### LA-023-01 · frontend

**desde bank-portal Sprint 23 — [href] nativo en Angular Router causa full page re...**

**Descripción:** desde bank-portal Sprint 23 — [href] nativo en Angular Router causa full page reload. REGLA: router.navigateByUrl() o [routerLink] siempre

**Corrección / Regla:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.


---

## LAs SOFIA-CORE integradas en proyecto

### LA-CORE-017 · analysis

**Descripción:** ORG baseline: leer SOFIA_ORG_PATH canonico, nunca snapshot local del proyecto

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.59_

---

### LA-CORE-018 · governance

**Descripción:** HITL obligatorio antes de persistir cualquier LA: aprobacion PO explicita

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.59_

---

### LA-CORE-033 · governance

**Descripción:** desde bank-portal Sprint 23 — Al ejecutar la-sync.js (GR-CORE-029), el Orchestrator aplicó el sync solo en los

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.59_

---

### LA-CORE-048 · process/governance

**Descripción:** Gate persistencia atomica session.json + validate-fa-index CHECK 8 usa session.current_feature + FA feat field obligatorio

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.59_

---

### LA-CORE-050 · ux/process

**Descripción:** PASO 0 herencia prototipo sprint-a-sprint obligatoria; cp archivo anterior + verificacion token portal real bloqueante G-2c

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.59_

---

### LA-CORE-053 · backend/jdbc

**Descripción:** schema-drift-sql-native: verificar nombres de columna de tablas previas con \d tabla o Flyway migration antes de escribir queries SQL nativas. GR-SQL-001 en G-4b.

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.59_

---

### LA-CORE-054 · backend/jdbc

**Descripción:** instant-timestamptz-binding: JdbcClient no puede bindear Instant directo a TIMESTAMPTZ. Usar Timestamp.from(instant). GR-JDBC-001 en G-4b. Complementa LA-019-13.

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.59_

---

### LA-CORE-055 · frontend/angular

**Descripción:** sign-contract-backend: backend devuelve CARGO con signo negativo; frontend aplica Math.abs() en todos los mapeos. Documentar en LLD. Mocks con valores negativos. GR-API-001 en G-4b.

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.59_

---

### LA-CORE-056 · frontend/process

**Descripción:** prototype-fidelity-visual-review: 36 bugs por no leer prototipo pantalla a pantalla. Checklist fidelidad BLOQUEANTE en G-4 para cada pantalla. PO hace screenshot comparison antes de G-4b. Refuerza LA-CORE-041/043.

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.59_

---

### LA-CORE-057 · frontend/angular

**Descripción:** select-twoway-binding-reset: (change) unidireccional no sincroniza DOM en reset programático. Usar [(ngModel)] + FormsModule en controles con reset. GR-ANGULAR-001 en G-4.

_Ver LESSONS_LEARNED_CORE.md para corrección completa · SOFIA-CORE 2.6.59_

---
