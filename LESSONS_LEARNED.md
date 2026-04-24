# LESSONS LEARNED — bank-portal

> Generado: 2026-04-24T13:03:07.451Z | Total: 42 LAs
> LAs proyecto: 10 | LAs SOFIA-CORE integradas: 32

## LAs del Proyecto

### LA-026-01 · process/governance/audit

**Descripción:** El array session.gate_history acumula tanto gates realmente aprobados (con approved_by humano) como entradas con sufijo "-pending" (G-1-pending, G-2-pending) que el script gen-global-dashboard.js inserta cuando regenera el dashboard antes de la aprobación formal. Consecuencia: cualquier auditoría CMMI que cuente "gates aprobados en sprint X" obtiene un valor inflado, y la trazabilidad PMC se ensucia. Detectado en auditoría CMMI Sprint 26 (gate_history mostraba gate=G-2-pending como última entrada cuando G-2 todavía no estaba aprobado por PO).

**Corrección:** Separar en dos campos: (a) gate_history reservado solo para gates con approved_by != null y note != null; (b) nuevo campo gate_history_pending para los marcadores intermedios del dashboard. Refactor en gen-global-dashboard.js: insertar pendings en gate_history_pending. Refactor en orquestador de gates: solo insertar en gate_history al persistir un gate aprobado HITL. Validación retroactiva: limpiar entradas -pending del gate_history actual, moverlas al nuevo campo.

_Registrada: 2026-04-22T05:24:58.496Z_

---

### LA-026-02 · process/governance/cmmi

**Descripción:** session.cmmi.process_areas declara solo 9 PAs (PP, PMC, RSKM, VER, VAL, CM, PPQA, REQM, DAR), pero CMMI Level 3 estricto requiere también OPF, OPD, OT, IPM, RD, TS, PI. SOFIA-CORE cubre estas PAs implícitamente (OPD via MANIFEST + skills, OPF via mecanismo promoción LAs proyecto a CORE, OT via skills versionadas, IPM via orchestrator, RD via requirements-analyst SKILL, TS via architect+developer SKILLs, PI via devops + smoke tests) pero no estan declaradas explicitamente. Una auditoría CMMI L3 formal preguntaria por las 16 PAs canonicas y nuestro session.json reportaria 9, dando lugar a una incompletitud documental.

**Corrección:** Ampliar session.cmmi a estructura {level: 3, process_areas_project: [...9 PAs actuales...], process_areas_org: [OPF, OPD, OT, IPM], process_areas_engineering: [RD, TS, PI], total: 16, coverage_strategy: "PAs proyecto en este session.json; PAs organizacionales y de ingenieria heredadas de SOFIA-CORE v2.6.66"}. Crear matriz de cobertura PA-vs-evidencia en docs/cmmi/CMMI-COVERAGE-MATRIX.md mantenida sprint a sprint. Promover a SOFIA-CORE como template para todos los proyectos.

_Registrada: 2026-04-22T05:24:58.496Z_

---

### LA-026-03 · tooling/mcp/recovery

**Descripción:** Al ejecutar Step 2 (generación SRS-FEAT-024-sprint26.md) via comando node con heredoc embebiendo template literal de 20 KB, el servidor MCP sofia-shell-bank-portal quedó no responsivo durante 4+ minutos y dejó timeout en todos los shells (bank-portal, SOFIA-CORE). Se confirmo que el directorio destino se habia creado pero el SRS no se habia escrito. Causa probable: limite del stdio buffer del MCP server al pasar payloads grandes como argumento de comando (estimado 16-20 KB). Recovery exitoso aplicado: dividir el SRS en 5 fragmentos de ~3-6 KB invocando node con fs.appendFileSync incremental, cada fragmento ejecutado en comando independiente.

**Corrección:** Documentar en .sofia/skills/orchestrator/SKILL.md y en CLAUDE.md la regla: "Para escritura de artefactos > 8 KB usar fs.appendFileSync en bloques ≤ 6 KB; nunca pasar el contenido completo como argumento de un comando shell". Crear helper opcional .sofia/scripts/write-large-artifact.js que reciba path + array de fragmentos y los escriba secuencialmente con validacion. Promover a SOFIA-CORE para que aplique a cualquier proyecto SOFIA con MCP shell.

_Registrada: 2026-04-22T05:24:58.496Z_

---

### LA-025-13 · qa/devops/process

**Descripción:** El smoke test v1.1 de Sprint 25 (infra/compose/smoke-test-v1.25.0.sh) aprobado en Gate G-7 incluia el check SM-14 contra PUT /api/v1/pfm/budgets/{id}/alert, un endpoint que NUNCA fue implementado en PfmController.java. El controller solo expone GET, POST y DELETE de budgets (la unica variante PUT es /movimientos/{txId}/category). Consecuencia: SM-14 devolvia 404 de forma permanente en cualquier ejecucion post-deploy, pero el gate G-7 se aprobo con 16/16 PASS porque el PO interpreto el FAIL como falso positivo en el momento. Dos falsos positivos adicionales del mismo script: SM-05 leia accts[0]["id"] cuando el contrato real expone accountId (se saltaba siempre como SKIP); SM-09 no aceptaba 409 Conflict en re-ejecucion (el backend rechaza correctamente por UK user_category_month). Los 3 defectos del smoke test pasaron Gate G-7 sin deteccion porque el review del release-manager se centro en el numero de stages OK del pipeline y no en el grep cruzado entre URLs del smoke y @RequestMapping del controller.

**Corrección:** Aplicado v1.2 (2026-04-21) con 3 parches: (a) SM-05 lectura tolerante con fallback accountId || id; (b) SM-09 acepta 201|409|422 como codigos validos post-deploy; (c) SM-14 reformulado como asercion de dominio thresholdPercent in [50..95] step 5 via GET (cubre la RN del SRS sin depender de endpoint inexistente). Sintaxis bash -n OK. Logica verificada via Node: 17/17 PASS contra stack real. Backup preservado en smoke-test-v1.25.0.sh.bak-v1.1. Para prevenir regresion: Step 7 DevOps debe ejecutar pre-gate G-7 un grep cruzado de todas las URLs absolutas del smoke test (/api/v1/...) contra los handlers reales del controller (@GetMapping/@PostMapping/@PutMapping/@DeleteMapping); cualquier URL sin match debe bloquear G-7. Adicionalmente, el smoke test debe aceptar codigos de idempotencia (409 en POST con UK violado) y leer campos del payload segun el contrato documentado en el OpenAPI, no por asuncion.

_Registrada: 2026-04-21T18:37:18.878Z_

---

### LA-025-12 · process/governance/git

**Descripción:** SOFIA ejecutó una sesión de arranque completa (lectura session.json, skill loader, inicialización Orchestrator) sin detectar que el working tree tenía 842 ficheros borrados respecto al HEAD de Git — toda la carpeta apps/ (backend-2fa + frontend-portal + CLAUDE.md raíz). Consecuencia: durante la sesión se generó LA-025-11 con un diagnóstico arquitectónico erróneo ('separación docs/code sin enlace'), se propusieron remediaciones costosas (submodules, workspace padre), y se asumió que el código nunca había estado en el checkout. La verdad se descubrió solo al ejecutar git status --short, que mostró las 841+1 entradas con prefijo 'D' (deleted). Ningún paso del pipeline SOFIA compara el estado del working tree contra el índice Git en el arranque, pese a que es una verificación O(1) y el proyecto depende completamente de la integridad de apps/ para Step 4 (Developer), guardrail G-4b (compile), y checklist fidelidad G-4 (LA-CORE-056). El fallo es especialmente grave porque la Regla Crítica LA-018-01 exige leer .sofia/session.json antes de cualquier acción, pero no exige verificar la coherencia del working tree — la asunción implícita es 'si el directorio existe, el código está ahí'.

**Corrección:** Añadir guardrail GR-GIT-001 al Orchestrator (inicialización SOFIA, antes de cualquier skill): ejecutar `git status --porcelain | grep '^ D' | wc -l`; si el resultado > 0, bloquear con alerta detallando número de ficheros borrados y sugerir `git restore` como acción correctiva. Complementariamente añadir al bloque de arranque: (a) contador de ficheros .java y .ts en apps/ vs. cuenta esperada persistida en session.json.repository.expected_file_counts; (b) verificación de existencia de apps/backend-2fa/pom.xml y apps/frontend-portal/package.json como smoke test de integridad; (c) registro en sofia.log del hash git rev-parse HEAD al arrancar, para trazabilidad. Promover a SOFIA-CORE como LA-CORE-059 (GR-GIT-001) — aplicable a cualquier proyecto SOFIA basado en Git. Actualizar orchestrator/SKILL.md sección 'Inicialización automática' con PASO 0 nuevo: verificación de integridad del working tree.

_Registrada: 2026-04-20T19:49:40.283602Z_

---

### LA-025-11 · governance/repository

**Descripción:** El directorio SOFIA del proyecto (/Users/cuadram/proyectos/bank-portal) no contiene el codigo fuente Java ni Angular. El docker-compose.yml hace build desde ../../apps/backend-2fa y ../../apps/frontend-portal, rutas que no existen en el filesystem accesible. El contenedor bankportal-backend corre sobre una imagen pre-construida (bankportal-backend-2fa:local-dev) cuyo origen esta desacoplado del checkout documental. Consecuencia: auditorias de arquitectura contra la documentacion (HLD, LLD, session.json) producen una ilusion de verdad — el diagrama logico generado reflejaba 8 bounded contexts pero el JAR desplegado contiene 23. Tambien impide ejecutar mvn compile, leer el codigo para verificar fidelidad prototipo (LA-CORE-056), aplicar refactors, o resolver deudas tecnicas desde el puesto de trabajo canonico del PO.

**Corrección:** Tres opciones: (a) incorporar apps/backend-2fa y apps/frontend-portal como git submodules del repositorio bank-portal para que el checkout SOFIA contenga la fuente canonica; (b) renombrar la raiz SOFIA a /Users/cuadram/proyectos/bank-portal-docs y crear un workspace padre que contenga apps/* y docs/* como hermanos; (c) si la separacion se mantiene, anadir un guardrail GR-REPO-001 que bloquee Step 4 y Step 5 si no existe ruta hacia el codigo fuente y registre la ubicacion real en session.json.repository.source_path. Promover a SOFIA-CORE: el problema afecta a cualquier proyecto que intente separar docs y code sin establecer el enlace.

_Registrada: 2026-04-20T09:09:24.854Z_

---

### LA-025-10 · process/tooling

**Descripción:** Las herramientas MCP Atlassian disponibles (searchJiraIssuesUsingJql, getJiraIssue, transitionJiraIssue, editJiraIssue, addCommentToJiraIssue, getTransitionsForJiraIssue, createIssueLink, etc.) cubren la Jira Platform REST API v3 sobre issues, pero NO exponen la Jira Agile REST API (/rest/agile/1.0/sprint/{id}) que es la unica via oficial para transicionar un sprint de active → closed. Consecuencia: Step 9 Workflow Manager puede finalizar todos los issues via transitionJiraIssue pero NO puede completar el sprint en si mismo; queda pendiente una accion manual del PO desde la UI de Jira o un curl con API token fuera de la allowlist de sofia-shell. Verificado en Sprint 25 (sprint_id=464, board_id=1): todos los issues SCRUM-153..162 pasaron a Finalizada via MCP, pero el sprint seguia state=active hasta que el PO hizo click en "Completar sprint" en la UI.

**Corrección:** Tres opciones de mejora: (a) solicitar a Anthropic/Atlassian que amplie el MCP server para incluir endpoints Agile API (completeSprint, createSprint, updateSprint, moveIssuesToSprint); (b) incluir en SOFIA un wrapper Node con https.request + ATLASSIAN_API_TOKEN en .env (fuera del repo) que encapsule completeSprint; (c) hasta que exista soporte nativo, documentar explicitamente en la skill workflow-manager/SKILL.md que la accion final de cerrar sprint en Jira es manual PO-UI y que el Step 9 termina con este flag pendiente. Promover a SOFIA-CORE porque afecta a todos los proyectos que usen SOFIA + Jira Cloud.

_Registrada: 2026-04-17T13:14:35.481Z_

---

### LA-025-09 · process/tooling

**Descripción:** .sofia/scripts/gen-global-dashboard.js espera session.completed_steps como Array (calls .includes), pero el session.json lo persiste como objeto {sprint, feature, steps:[]}. Al ejecutar directamente el script falla con TypeError: completedSteps.includes is not a function. Workaround actual: wrapper Node que normaliza el campo antes de invocar, restaura el formato objeto después. Bloquea la regeneracion automatica del Dashboard Global en cada Gate (GR-DASH-001 incumplida). Bug cosmetico adicional: el banner del gate concatena GATE-${GP.step} cuando GP.step ya es G-8, resultando en GATE-G-8.

**Corrección:** Refactorizar gen-global-dashboard.js para: (a) aceptar ambos formatos con normalizacion al cargar session.json — const completedSteps = Array.isArray(S.completed_steps) ? S.completed_steps : (S.completed_steps?.steps || []); (b) corregir la concatenacion del banner: gateLabel debe usar GP.step tal cual sin prefijo GATE- si ya contiene G-. Tests de regresion con ambos schemas. Promover a SOFIA-CORE como LA-CORE-058 y actualizar gen-global-dashboard.js en todos los proyectos registrados.

_Registrada: 2026-04-17T12:08:33.479Z_

---

### LA-025-06 · frontend/angular

**Descripción:** Backend devuelve CARGO con signo negativo. Frontend debe aplicar Math.abs() antes de renderizar. Contrato no documentado en LLD/SRS. Corrompe porcentajes, semaforo y variaciones.

**Corrección:** Math.abs() en todos los mapeos de amount/spent/percentConsumed. Documentar en LLD. Tests con valores negativos en mocks CARGO.

_Registrada: 2026-04-16T20:34:14.884Z_

---

### LA-025-08 · frontend/angular

**Descripción:** select con (change) unidireccional no sincroniza DOM al resetear la variable programaticamente. Filtro de categorias no quedaba marcado y el reset no funcionaba.

**Corrección:** [(ngModel)] + FormsModule para bidireccional. NUNCA (change) solo en controles con reset programatico.

_Registrada: 2026-04-16T20:34:14.884Z_

---

## LAs SOFIA-CORE Integradas

> Estas LAs han sido promovidas desde otros proyectos y aprobadas por el PO.
> Son de aplicación obligatoria en todos los proyectos SOFIA.

### LA-026-04 · process/governance ⭐ CORE

**Descripción:** MANIFEST.la_core_index acumuló 8 entradas espurias con prefijo de ID local (LA-023-01, LA-025-01..04, LA-025-09, LA-025-10, LA-025-12) que nunca debieron entrar — el contrato de la_core_index es contener ÚNICAMENTE IDs LA-CORE-*. Causa raíz: el flow de promoción que generó LA-CORE-048..051 (commit f6b160f 16-Abr) escribió tanto las entradas CORE como duplicados con el ID local original, sin saneamiento posterior. Los duplicados quedaron persistidos con descripciones truncadas a ~120 chars, lo que además rompió la-promote.js (línea 95: 'if (manifest.la_core_index[laId]) return true') bloqueando la re-promoción de LA-023-01 legítima. Adicionalmente lessons_learned_core (36), core_la_count (40) y la_count (75) divergen sin fuente única de verdad declarada. Hallazgo adicional descubierto durante el saneamiento: 27 entradas LA-CORE-002..016, 020..025, 028..032, 037 existen en MANIFEST.la_core_index y en session.json de proyectos (ET, TK) pero NUNCA fueron escritas en LESSONS_LEARNED_CORE.md — son LAs reales en uso operativo pero ausentes del catálogo formal CMMI L3.

**Corrección:** REGLA PERMANENTE: (1) MANIFEST.la_core_index SOLO admite claves que matcheen ^LA-CORE-\d+$ — añadir validación en sofia-contribute.py --accept que rechace claves que no cumplan el patrón. (2) la-promote.js debe distinguir entre entrada-CORE-promovida y entrada-local-injectada: la heurística actual ('return true si laId está en la_core_index') es ambigua. Cambiar a 'return manifest.la_core_index[laId] && /^LA-CORE-/.test(laId)'. (3) Añadir validador validate-manifest.js que se ejecuta en gate G-9 y bloquea cierre de sprint si detecta claves no canónicas en la_core_index. (4) Reconciliación de contadores: definir fuente única de verdad — propuesta: lessons_learned_core = len(la_core_index where key matches LA-CORE-*), core_la_count = count(headers en LESSONS_LEARNED_CORE.md), la_count = lessons_learned_core (sin espurias). Documentar en gen-ma-baseline.js. (5) Sprint arqueológico separado para reconstruir las 27 entradas LA-CORE huérfanas en LESSONS_LEARNED_CORE.md — diferido bajo decisión PO.

_SOFIA-CORE v? · Importada: ?_

---

### LA-025-07 · frontend/process ⭐ CORE

**Descripción:** 36 bugs detectados por el PO en QA manual de FEAT-023 (Overview PFM, Presupuestos, Análisis) por el patrón 'developer implementa de memoria sin comparar con el HTML del prototipo aprobado'. Los prototipos PROTO-FEAT-023-sprint25 aprobados en G-2c contenían los layouts, colores, tipografías y componentes correctos pero el Developer Agent escribió los componentes Angular sin abrir el HTML pantalla a pantalla. LA-CORE-041 (Developer Agent debe leer prototipo HTML pantalla a pantalla) y LA-CORE-043 (LA-023-02 fidelidad prototipo aplica en G-4 como checklist BLOQUEANTE) ya estaban registradas pero no se aplicaron en G-4b — la verificación fue declarativa, no operativa.

**Corrección:** REGLA PERMANENTE: Checklist de fidelidad de prototipo BLOQUEANTE en G-4 y G-4b. (1) Developer Agent verifica cada elemento del prototipo HTML contra el componente Angular generado (1 a 1) — colores tokens, espaciados, tipografías, iconos, estados hover/active, layouts responsive. (2) PO ejecuta screenshot comparison lado-a-lado prototipo↔implementación antes de aprobar G-4b — se rechazan diferencias mayores al 5% en pixel-perfect comparison. (3) Code Reviewer en G-4 corre diff semántico HTML prototype vs componente template y bloquea si hay drift mayor al 10% en estructura DOM. (4) Cualquier desviación intencional debe documentarse en LLD con justificación firmada por Architect. El gate G-4b no se aprueba sin evidencia gráfica de fidelidad adjunta. Guardrail propuesto: GR-FRONTEND-003. Aplicable en gates: G-4, G-4b (BLOQUEANTE).

_SOFIA-CORE v? · Importada: ?_

---

### LA-023-01 · frontend/angular ⭐ CORE

**Descripción:** En componentes Angular, usar [href] nativo en enlaces internos causa full page reload — el ShellComponent desaparece y la pantalla queda en blanco sin menú. Detectado en Mi Perfil inbox al pulsar 'Ver →' sobre notif.actionUrl. Segundo hallazgo del mismo bug: actionUrl en seeds con rutas inexistentes (/bills, /transfers) — navigateByUrl() silencia el error y no navega. Fix combinado: ROUTE_MAP de aliases + fallback a /dashboard + corrección de seeds en BD.

**Corrección:** REGLA PERMANENTE: Nunca usar [href] para navegación interna en Angular. Usar siempre (click)+router.navigateByUrl() para URLs dinámicas con posibles query params, o [routerLink] para rutas estáticas. Checklist G-4/G-5 BLOQUEANTE: grep -r '\[href\]' src/app/features/ — cualquier resultado con path interno bloquea el gate. Adicionalmente: los seeds de notificaciones deben usar SOLO rutas registradas en app-routing.module.ts. Verificar con: SELECT DISTINCT action_url FROM user_notifications — cada valor debe existir en la tabla de rutas del router. Aplicable en gates: G-4, G-5 (BLOQUEANTE).

_SOFIA-CORE v2.6.52 · Importada: 2026-04-16T21:24:02.177Z_

---

### LA-CORE-017 · analysis ⭐ CORE

**Descripción:** ORG baseline: leer SOFIA_ORG_PATH canonico, nunca snapshot local del proyecto

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.52 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-CORE-018 · governance ⭐ CORE

**Descripción:** HITL obligatorio antes de persistir cualquier LA: aprobacion PO explicita

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.52 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-CORE-033 · governance ⭐ CORE

**Descripción:** desde bank-portal Sprint 23 — Al ejecutar la-sync.js (GR-CORE-029), el Orchestrator aplicó el sync solo en los

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.52 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-CORE-048 · process/governance ⭐ CORE

**Descripción:** Gate persistencia atomica session.json + validate-fa-index CHECK 8 usa session.current_feature + FA feat field obligatorio

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.52 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-CORE-050 · ux/process ⭐ CORE

**Descripción:** PASO 0 herencia prototipo sprint-a-sprint obligatoria; cp archivo anterior + verificacion token portal real bloqueante G-2c

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.52 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-025-01 · process/governance ⭐ CORE

**Descripción:** desde bank-portal Sprint 25 — Gate G-2 Sprint 25 aprobado explícitamente por el PO pero no persistido en sessi

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.48 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-025-02 · process/fa-agent ⭐ CORE

**Descripción:** desde bank-portal Sprint 25 — Step 2b debe invocar gen-fa-document.py para actualizar el FA Word consolidado a

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.46 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-025-03 · ux/process ⭐ CORE

**Descripción:** desde bank-portal Sprint 25 — UX/UI Designer Agent generó PROTO-FEAT-023-sprint25 desde el scaffold genérico d

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.50 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-025-04 · process/governance ⭐ CORE

**Descripción:** desde bank-portal Sprint 25 — current_step en session.json no se actualizaba al avanzar entre steps — quedó en

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.46 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-CORE-053 · backend/jdbc ⭐ CORE

**Descripción:** schema-drift-sql-native: verificar nombres de columna de tablas previas con \d tabla o Flyway migration antes de escribir queries SQL nativas. GR-SQL-001 en G-4b.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.52 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-CORE-054 · backend/jdbc ⭐ CORE

**Descripción:** instant-timestamptz-binding: JdbcClient no puede bindear Instant directo a TIMESTAMPTZ. Usar Timestamp.from(instant). GR-JDBC-001 en G-4b. Complementa LA-019-13.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.52 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-CORE-055 · frontend/angular ⭐ CORE

**Descripción:** sign-contract-backend: backend devuelve CARGO con signo negativo; frontend aplica Math.abs() en todos los mapeos. Documentar en LLD. Mocks con valores negativos. GR-API-001 en G-4b.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.52 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-CORE-056 · frontend/process ⭐ CORE

**Descripción:** prototype-fidelity-visual-review: 36 bugs por no leer prototipo pantalla a pantalla. Checklist fidelidad BLOQUEANTE en G-4 para cada pantalla. PO hace screenshot comparison antes de G-4b. Refuerza LA-CORE-041/043.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.52 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-CORE-057 · frontend/angular ⭐ CORE

**Descripción:** select-twoway-binding-reset: (change) unidireccional no sincroniza DOM en reset programático. Usar [(ngModel)] + FormsModule en controles con reset. GR-ANGULAR-001 en G-4.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.52 · Importada: 2026-04-16T21:24:02.178Z_

---

### LA-CORE-058 · infrastructure/governance ⭐ CORE

**Descripción:** repo-redundancy-via-github-not-onedrive: sistemas críticos SOFIA no pueden depender de OneDrive como única copia redundada. Remote git obligatorio para Tipo S (framework) y Tipo A (flujo git intensivo). OneDrive es sync, no backup transaccional. GR-INFRA-001.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-059 · process/tooling ⭐ CORE

**Descripción:** dashboard-completed-steps-schema: gen-global-dashboard.js asume Array en session.completed_steps pero el schema real es {sprint, feature, steps:[]}; normalizar al cargar. Bug cosmético adicional: banner concatena GATE-${step} cuando step ya es G-N (produce GATE-G-8). Refactor + tests de regresión. GR-DASH-002.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-060 · process/tooling ⭐ CORE

**Descripción:** mcp-atlassian-sprint-lifecycle-gap: las herramientas MCP Atlassian (searchJiraIssues, transitionJiraIssue) no exponen endpoints para abrir/cerrar sprints. Step 9 Workflow Manager debe registrar acción manual pendiente en Jira UI cuando MCP no cubre sprint lifecycle. GR-ATLASSIAN-001.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-061 · process/governance/git ⭐ CORE

**Descripción:** working-tree-git-divergence-undetected: Orchestrator arrancó sesión completa sin detectar 842 ficheros borrados del working tree. Añadir PASO 0 de verificación de integridad: git status --porcelain | grep '^ D' | wc -l; si > 0, bloquear. Verificar existencia de pom.xml/package.json. Registrar hash HEAD en sofia.log al arrancar. GR-GIT-001.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-062 · process/tooling - session-sprint-history-schema-drift: schema dict vs list en sprint_history incompatible entre proyectos - patron defensivo obligatorio ⭐ CORE

**Descripción:** 

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-063 · process/tooling - session-json-falsy-and-schema-derivation: dos bugs defensivos (sprint=0 falsy + process_areas ausente) en consumidores de session.json - patron hermano de LA-CORE-062 ⭐ CORE

**Descripción:** 

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-064 · qa/devops/process ⭐ CORE

**Descripción:** smoke-test-references-non-existent-endpoint: smoke test aprobado en G-7 con check contra PUT /api/v1/pfm/budgets/{id}/alert (endpoint inexistente en PfmController). 2 defectos hermanos: SM-05 leia id vs accountId, SM-09 no aceptaba 409 en re-ejecucion. Corregido via grep cruzado URL-vs-@RequestMapping obligatorio pre-G-7. GR-SMOKE-001.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-065 · process/governance/audit ⭐ CORE

**Descripción:** gate-history-mixes-pending-and-approved: gate_history mezcla gates HITL aprobados con marcadores -pending del dashboard. Refactor a gate_history (aprobados) + gate_history_pending (intermedios). Eliminar duplicados por clave gate+sprint+step. GR-AUDIT-001.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-066 · process/governance/cmmi ⭐ CORE

**Descripción:** cmmi-process-areas-incomplete-declaration: session.cmmi declaraba 9 PAs vs 16 canonicas L3. Schema obligatorio {project:[9], org:[4], engineering:[3], coverage_strategy, coverage_matrix_path}. Crear docs/cmmi/CMMI-COVERAGE-MATRIX.md mantenida en Step 9. GR-CMMI-001 bloquea G-9 si incompleto.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-067 · tooling/mcp/recovery ⭐ CORE

**Descripción:** mcp-shell-stdio-buffer-limit-large-payloads: MCP shell timeout en payloads >16KB como argumento. Patron: fs.appendFileSync en bloques <=6KB para artefactos >8KB. Helper write-large-artifact.js opcional. GR-MCP-001.

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-068 · frontend/angular - nunca usar [href] nativo para navegacion interna en Angular (causa full page reload + ShellComponent desaparece). Usar router.navigateByUrl() para URLs dinamicas o [routerLink] para estaticas. Seeds de notificaciones deben referenciar SOLO rutas registradas en app-routing.module.ts. Checklist G-4/G-5 bloqueante: grep -r '[href]' src/app/features/ (GR-ANGULAR-HREF-001). ⭐ CORE

**Descripción:** 

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-070 · takeover/process - T-3 FA Reverse Agent debe producir T3-FUNCTIONAL-DESCRIPTION.md + T3-FUNCTIONAL-DESCRIPTION.docx como entregables explicativos del sistema heredado, ademas de los artefactos internos del pipeline (fa-index.json, fa-baseline, etc.). Sin estos entregables, el analisis funcional no queda accesible fuera del pipeline. ⭐ CORE

**Descripción:** 

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.6.68 · Importada: 2026-04-23T06:38:51.962Z_

---

### LA-CORE-071 · process/governance ⭐ CORE

**Descripción:** desde SOFIA-CORE Sprint 1 (orig LA-001-09) — En Sprint S01 Mini A Step 9, el Orchestrator ejecuto la secuencia de cierre form

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.7.3 · Importada: 2026-04-24T13:03:07.442Z_

---

### LA-CORE-072 · process/tooling ⭐ CORE

**Descripción:** desde SOFIA-CORE Sprint 1 (orig LA-001-03) — En Sprint S01 Mini A Step 6 Fase 2 (propagacion de LAs reformateadas H3->H2 a lo

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.7.3 · Importada: 2026-04-24T13:03:07.442Z_

---

### LA-CORE-073 · process/atomicity ⭐ CORE

**Descripción:** desde SOFIA-CORE Sprint 1 (orig LA-001-04) — En Sprint S01 Mini A Step 6, tras transicionar las issues SC-13 y SC-14 a estado

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

_SOFIA-CORE v2.7.3 · Importada: 2026-04-24T13:03:07.442Z_

---

