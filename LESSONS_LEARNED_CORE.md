# LESSONS LEARNED CORE — SOFIA Framework
# Conocimiento acumulado de todos los proyectos. Fuente canonica del framework.
# Generado: 2026-04-05 | SOFIA v2.6 | 57 LAs

> SOFIA v2.6 · Sprint 22 · 47 lecciones BankPortal + 5 LAs CORE + 2 LAs CORE frontend (LA-CORE-012/013)
> Última actualización: 2026-04-05

---

## Índice por Sprint — BankPortal

- **Sprint 19** (14): LA-019-03, LA-019-04, LA-019-05, LA-019-06, LA-019-07, LA-019-08, LA-019-09, LA-019-10, LA-019-11, LA-019-12, LA-019-13, LA-019-14, LA-019-15, LA-019-16
- **Sprint 20** (15): LA-020-01, LA-020-02, LA-020-03, LA-020-04, LA-020-05, LA-020-06, LA-020-07, LA-020-08, LA-020-09, LA-020-10, LA-020-11, LA-TEST-001, LA-TEST-002, LA-TEST-003, LA-TEST-004
- **Sprint 21** (10): LA-FRONT-001, LA-FRONT-002, LA-FRONT-003, LA-FRONT-004, LA-FRONT-005, LA-021-01, LA-021-02, LA-021-03, LA-STG-001, LA-STG-002
- **Sprint 22** (9): LA-022-01, LA-022-02, LA-022-03, LA-022-04, LA-022-05, LA-022-06, LA-022-07, LA-022-08, LA-022-09

## Índice SOFIA-CORE

- **CORE** (13): LA-CORE-001, LA-CORE-002, LA-CORE-003, LA-CORE-004, LA-CORE-005, LA-CORE-006, LA-CORE-007, LA-CORE-008, LA-CORE-009, LA-CORE-010, LA-CORE-011, LA-CORE-012, LA-CORE-013

---

## Sprint 19 — BankPortal

### LA-019-03 · process
**Descripcion:** Gates G-6..G-9 auto-aprobados incorrectamente. Cada gate HITL requiere parada explicita individual.
**Correccion:** Desde Sprint 20: parada obligatoria en cada gate HITL con pregunta al rol definido.

### LA-019-04 · testing
**Descripcion:** Tests unitarios no detectan conflictos de beans Spring -- requieren @SpringBootTest completo.
**Correccion:** G-4 requiere IT smoke test por feature nueva.

### LA-019-05 · devops
**Descripcion:** Build Angular sin --configuration=production no activa budget CSS ni environment.prod.ts.
**Correccion:** CI y Dockerfile usan siempre ng build --configuration=production.

### LA-019-06 · process
**Descripcion:** Patron DEBT-022 no verificable automaticamente en Code Review.
**Correccion:** Script grep DEBT-022 obligatorio en G-5.

### LA-019-07 · testing
**Descripcion:** Smoke test desactualizado -- no cubre endpoints del sprint corriente.
**Correccion:** smoke-test actualizado obligatorio como artefacto de G-4.

### LA-019-08 · architecture
**Descripcion:** @Profile(!production) activa Mock en STG -- BD real nunca consultada.
**Correccion:** Mocks solo con @Profile(mock) o @Profile(test). @Primary en adaptador real.

### LA-019-09 · config
**Descripcion:** environment.prod.ts desincronizado con environment.ts.
**Correccion:** Validacion automatica de campos en CI.

### LA-019-10 · frontend
**Descripcion:** Modulos Angular nuevos no registrados en router.
**Correccion:** Checklist G-4 incluye verificacion de registro en app-routing.module.ts.

### LA-019-11 · frontend
**Descripcion:** Componentes de ruta usan @Input para params -- nunca se populan.
**Correccion:** Usar siempre ActivatedRoute.paramMap en componentes de ruta.

### LA-019-12 · data
**Descripcion:** UUIDs invalidos en seeds SQL (caracteres no hex).
**Correccion:** Validar UUIDs con regex antes de ejecutar seeds.

### LA-019-13 · database
**Descripcion:** timestamp without time zone vs Instant Java -- incompatibilidad de tipos.
**Correccion:** LLD incluye mapa de tipos BD->Java. Usar LocalDateTime para columnas sin timezone.

### LA-019-14 · frontend
**Descripcion:** OnPush + paramMap no dispara CD al cambiar cuenta.
**Correccion:** OnPush solo cuando se garantiza inmutabilidad y markForCheck() en todos los observables.

### LA-019-15 · backend
**Descripcion:** Named params JdbcClient contaminados por concatenacion de text blocks.
**Correccion:** SQL dinamico siempre usa parametros posicionales (?).

### LA-019-16 · process
**Descripcion:** QA no declara si prueba contra Mock o BD real.
**Correccion:** Informe QA obliga campo: Repositorio activo: MOCK|JPA-REAL.

---

## Sprint 20 — BankPortal

### LA-020-01 · process
**Descripcion:** Jira debe actualizarse en cada step del pipeline sin instruccion explicita.
**Correccion:** Regla permanente: transicion automatica en cada gate.

### LA-020-02 · security
**Descripcion:** Hallazgos CVSS >= 4.0 deben resolverse en el mismo sprint donde se detectan.
**Correccion:** No diferir si CVSS >= 4.0.

### LA-020-03 · architecture
**Descripcion:** Audit log con datos derivados crea inconsistencia -- enriquecer en momento de escritura.
**Correccion:** DEBT-036: inyectar AccountRepository en ExportAuditService.

### LA-020-04 · devops
**Descripcion:** Workflow Jira debe configurarse con todos los estados SOFIA antes del primer sprint.
**Correccion:** Checklist onboarding incluye configuracion workflow.

### LA-020-05 · process
**Descripcion:** Documentation Agent no ejecutado en Step 8 -- error detectado post-cierre.
**Correccion:** Desde Sprint 21: Documentation Agent es BLOQUEANTE para Gate G-9.

### LA-020-06 · process
**Descripcion:** sprint-NN-planning-doc.docx es obligatorio en word/ de cada sprint.
**Correccion:** Checklist deliverables: planning-doc.docx bloqueante para Gate G-8 desde Sprint 21.

### LA-020-07 · dashboard
**Descripcion:** Dashboard no se regeneraba en cada aprobacion de gate, solo al cerrar sprint.
**Correccion:** gate-dashboard-hook.js invocado en cada gate. dashboard_on_every_gate:true.

### LA-020-08 · process
**Descripcion:** gen-fa-document.py no se invocaba automaticamente en Step 8b.
**Correccion:** gen-fa-document.py debe ejecutarse en Step 8b de cada sprint.

### LA-020-09 · process
**Descripcion:** Developer Agent genero ficheros bajo paquete incorrecto inferido de documentacion.
**Correccion:** REGLA PERMANENTE: Developer Agent DEBE verificar package raiz real antes de crear ficheros Java.

### LA-020-10 · code-review
**Descripcion:** Code Reviewer valido consistencia interna entre ficheros nuevos pero no contra el codebase real.
**Correccion:** REGLA PERMANENTE: Code Reviewer DEBE ejecutar grep del package raiz y contrastar.

### LA-020-11 · testing
**Descripcion:** Sprint cerrado sin SpringContextIT ni integration tests.
**Correccion:** REGLA PERMANENTE: SpringContextIT es BLOQUEANTE para Gate G-4b.

### LA-TEST-001 · backend
**Descripcion:** getAttribute("userId") vs "authenticatedUserId" -- discrepancia invisible en compilacion.
**Correccion:** Verificar nombre de atributo JWT contra el filtro que lo escribe en el mismo PR.

### LA-TEST-002 · backend
**Descripcion:** Filtro por t.type (CARGO/ABONO) cuando deberia ser por category (DOMICILIACION...).
**Correccion:** Distinguir siempre entre type (direccion financiera) y category (tipo negocio).

### LA-TEST-003 · backend
**Descripcion:** Excepciones de dominio sin @ResponseStatus ni @ControllerAdvice -> HTTP 500.
**Correccion:** Toda excepcion custom debe tener @ResponseStatus o handler en @ControllerAdvice.

### LA-TEST-004 · backend
**Descripcion:** JdbcClient no convierte Instant para TIMESTAMP without time zone en PostgreSQL.
**Correccion:** Para TIMESTAMP sin timezone usar Timestamp.from(instant) o LocalDateTime.

---

## Sprint 21 — BankPortal

### LA-FRONT-001 · frontend
**Descripcion:** Modulos Angular en features/ no registrados en app-routing.module.ts ni sidebar.
**Correccion:** Al crear modulo Angular: (1) añadir ruta lazy, (2) añadir nav item en shell.component.ts.

### LA-FRONT-002 · frontend
**Descripcion:** Componente placeholder llego a produccion ocultando funcionalidad backend implementada.
**Correccion:** Antes de crear placeholder, verificar si el backend tiene el endpoint. Si existe, implementar real.

### LA-FRONT-003 · frontend
**Descripcion:** Import path incorrecto en componente anidado -- error invisible hasta docker build.
**Correccion:** Calcular path relativo desde la ubicacion real del fichero en el directorio anidado.

### LA-FRONT-004 · frontend
**Descripcion:** Ruta Angular registrada sin endpoint backend correspondiente -- renderizacion vacia silenciosa.
**Correccion:** Antes de registrar ruta Angular, verificar que el endpoint backend existe.

### LA-FRONT-005 · frontend
**Descripcion:** docker compose up sirve imagen preconstruida -- cambios no se reflejan sin build.
**Correccion:** Cualquier cambio frontend requiere docker compose build + up --no-deps.

### LA-021-01 · process
**Descripcion:** FA-Agent actualizaba functionalities pero NO business_rules. total_business_rules hardcodeado.
**Correccion:** total_business_rules = len(business_rules) NUNCA hardcodeado. validate-fa-index bloqueante.

### LA-021-02 · testing
**Descripcion:** IntegrationTestBase no declaraba campos UUID comunes -- error de compilacion de tests.
**Correccion:** IntegrationTestBase debe declarar todos los fixtures UUID comunes.

### LA-021-03 · process
**Descripcion:** Documentation Agent genero solo 10 DOCX vs 17 obligatorios.
**Correccion:** Documentation Agent DEBE generar 17 documentos (10 tecnicos + 7 CMMI). Bloqueante G-8.

### LA-STG-001 · frontend
**Descripcion:** forkJoin bloqueado por catchError->EMPTY -- skeleton infinito silencioso.
**Correccion:** catchError en observables de forkJoin DEBE retornar of(valorDefecto) nunca EMPTY.

### LA-STG-002 · frontend
**Descripcion:** version/sprint hardcodeados en LoginComponent -- no se actualizaban cada sprint.
**Correccion:** version/sprint/envLabel SIEMPRE desde environment.ts.

---

## Sprint 22 — BankPortal

### LA-022-01 · security
**Descripcion:** DEBT-040/041 vencieron sprint_target sin cerrarse. CVSS >= 4.0 diferidos.
**Correccion:** GR-010 bloquea Gate G-9 si open_debts tiene items con cvss >= 4.0 vencidos.

### LA-022-02 · process
**Descripcion:** LESSONS_LEARNED.md tenia 0 lineas en disco. LAs vivian solo en session.json.
**Correccion:** Step 9 regenera LESSONS_LEARNED.md desde session.json como paso obligatorio.

### LA-022-03 · process
**Descripcion:** Performance Agent y Jenkins Agent tenian SKILL.md pero no estaban en pipeline activo.
**Correccion:** Todo agente con SKILL.md debe estar asociado a un step y gate activo.

### LA-022-04 · security
**Descripcion:** open_debts duplicados en dos arrays de session.json -- deteccion doble en guardrail.
**Correccion:** session.open_debts como fuente unica. security.open_debts es referencia, GR-010 deduplica.

### LA-022-05 · dashboard
**Descripcion:** Dashboard no regenerado en gates G-1, G-2, HITL-PO-TL. Mostraba sprint anterior.
**Correccion:** GR-011: verifica dashboard_global.last_generated >= ultimo gate aprobado. Bloqueante.

### LA-022-06 · dashboard
**Descripcion:** gen-global-dashboard.js trataba gate_pending como objeto cuando es string.
**Correccion:** Normalizar gate_pending al leer session.json. parseArg() soporta --name=value y --name value.

### LA-022-07 · process
**Descripcion:** Step 3b no se ejecuto ni registro en Sprint 22.
**Correccion:** Step 3b OBLIGATORIO post G-3. GR-012 bloquea G-4 si 3b no esta en completed_steps.

### LA-022-08 · process
**Descripcion:** Documentation Agent genero .md y los reporto como .docx.
**Correccion:** Documentation Agent DEBE generar binarios reales .docx y .xlsx. NUNCA .md como entregable.

### LA-022-09 · devops
**Descripcion:** Seeds Flyway aplicados via psql directo no quedan en flyway_schema_history.
**Correccion:** Seeds SIEMPRE via docker compose up. INSERTs con IDs fijos usan ON CONFLICT DO NOTHING.

---

## SOFIA-CORE — Lecciones del framework

### LA-CORE-001 · process · (desde experis-tracker onboarding)
**Descripcion:** setup-sofia-mac.sh sobreescribia claude_desktop_config.json al configurar un proyecto nuevo, eliminando paths de otros proyectos activos y las preferences de Claude Desktop.

**Correccion:** REGLA PERMANENTE: setup-sofia-mac.sh NUNCA sobreescribe claude_desktop_config.json. Usa merge via python3: lee config existente, añade el nuevo path al array args de filesystem MCP, preserva git/sofia-shell existentes y todas las preferences. Un proyecto nuevo nunca rompe proyectos anteriores.

_Registrado: 2026-04-03T08:20:00Z · Fuente: experis-tracker onboarding_

---

### LA-CORE-002 · devops · (desde experis-tracker onboarding)
**Descripcion:** En macOS, /Users/cuadram/OneDrive es un alias del Finder, no la ruta real. La ruta real de OneDrive es /Users/cuadram/Library/CloudStorage/OneDrive-Personal/. El MCP server de filesystem no resuelve aliases -- necesita la ruta real. Si se usa el alias en claude_desktop_config.json el directorio no aparece en Claude Desktop.

**Correccion:** REGLA PERMANENTE: setup-sofia-mac.sh y sofia-wizard.py usan os.path.realpath() antes de escribir paths en claude_desktop_config.json. Nunca usar aliases de macOS (/OneDrive, /Dropbox, /iCloud Drive) como paths MCP.

_Registrado: 2026-04-03T08:48:11Z · Fuente: experis-tracker onboarding_

---

### LA-CORE-003 · process · (desde experis-tracker onboarding)
**Descripcion:** CLAUDE.md no declaraba SOFIA_REPO -- la ruta canonica del proyecto. Sin esa variable explicita, el Orchestrator infiere el directorio por contexto y puede escribir en el proyecto equivocado. Detectado en experis-tracker Sprint 1: SOFIA intento escribir artefactos en bank-portal en lugar de experis-tracker.

**Correccion:** REGLA PERMANENTE (GR-CORE-003): El wizard genera CLAUDE.md con SOFIA_REPO=<ruta-real> en la seccion IDENTIDAD DEL PROYECTO. El Orchestrator verifica en INIT que session.json.sofia_repo == CLAUDE.md.SOFIA_REPO. Si no coinciden -> DETENER. sofia-config.json tambien incluye sofia_repo. Cualquier escritura de artefacto debe verificar que la ruta empieza por SOFIA_REPO antes de ejecutarse. Sin excepciones.

_Registrado: 2026-04-03T19:00:00Z · Fuente: experis-tracker onboarding_

---
### LA-CORE-004 · process · (desde experis-tracker Sprint 1)
**Descripcion:** SOFIA-CORE no incluia un repo-template con la estructura canonica de directorios de BankPortal S22. El wizard creaba el directorio del proyecto y copiaba skills/scripts pero no materializaba la estructura documental antes del Sprint 1. Resultado: Documentation Agent creaba word/ y excel/ en la raiz del proyecto (LA-ET-001-01) y docs/sprints/ no existia (LA-ET-001-02).

**Correccion:** REGLA PERMANENTE: sofia-wizard.py copia SOFIA-CORE/repo-template/ al SOFIA_REPO antes de instalar skills. El template incluye: docs/sprints/, docs/architecture/, docs/functional-analysis/, docs/requirements/, docs/code-review/, docs/qa/, docs/releases/, docs/runbooks/, docs/dashboard/, docs/deliverables/, docs/ux-ui/prototypes/, docs/security/, docs/backlog/, infra/, src/. ESTRUCTURA.md documenta la estructura canonica y el checklist bloqueante de G-9. Cualquier proyecto nuevo arranca con exactamente la misma estructura que BankPortal S22.

_Registrado: 2026-04-04T06:29:34Z · Fuente: experis-tracker Sprint 1 post-mortem_

---
### LA-CORE-005 · process · (desde experis-tracker Sprint 1 post-mortem)
**Descripcion:** En el Sprint 1 de experis-tracker, los agentes del pipeline declararon "PERSISTENCE CONFIRMED" y añadieron steps a completed_steps en session.json, pero los artefactos correspondientes (SRS, HLD, LLD, CR, QA, security, infra, codigo fuente) no existian en disco. El Orchestrator confiaba en la declaracion del agente sin verificar la realidad del filesystem. Resultado: sprint cerrado con session.json correcto y disco vacio.

**Causa raiz:** El CHECK 3 post-step del Orchestrator comprobaba que el agente habia declarado rutas de artefactos, no que los ficheros existiesen realmente en disco. Un agente puede declarar que persitio algo sin haberlo hecho si el MCP filesystem no estaba operativo o usaba la ruta equivocada.

**Correccion:** REGLA PERMANENTE (GR-013 BLOQUEANTE): El Orchestrator NUNCA acepta la declaracion de un agente como evidencia de persistencia. Tras cada step se ejecuta verify-persistence.js que verifica la existencia y tamano real de los artefactos en disco. EXIT 1 = PIPELINE BLOQUEADO hasta que los artefactos existan. El script es la unica fuente de verdad sobre persistencia. Ningun gate puede aprobarse sin verify-persistence.js EXIT 0 para todos los steps completados.

_Registrado: 2026-04-04T07:24:03.864855Z · Fuente: experis-tracker Sprint 1 post-mortem · GR-013_

---

---
### LA-CORE-006 · process · (desde experis-tracker Sprint 1 post-mortem)
**Descripcion:** En experis-tracker el FA se generaba por feature y sprint (FA-FEAT-001-sprint1.md), replicando el anti-patron previo a BankPortal S14. Cada sprint produca un documento aislado sin conexion con los anteriores. No habia portada, no habia indice, no habia versionado trazable. El documento Word no era incremental.

**Causa raiz:** gen-fa-document.py de SOFIA-CORE tenia los datos de sprints y funcionalidades hardcodeados para BankPortal. Al crear un proyecto nuevo, el script no sabia que datos mostrar y los agentes generaban markdowns aislados como sustituto.

**Correccion:** REGLA PERMANENTE (LA-FA-INCR): gen-fa-document.py v2.5 es 100% dinamico desde fa-index.json. Genera un documento UNICO incremental con portada, indice tras portada, 8 secciones y versionado automatico (doc_version en fa-index.json). El documento crece sprint a sprint. El historial de cambios (seccion 8) registra cada version. Ningun dato esta hardcodeado: proyecto, cliente, sprints, funcionalidades, reglas, modulos, actores, regulaciones y glosario se leen de fa-index.json. Aplicado a experis-tracker: FA-experis-tracker-Experis.docx v1.1 (46.7KB). FA-Agent SKILL v2.5 documenta el patron.

_Registrado: 2026-04-04T11:26:29.989519Z · Fuente: experis-tracker Sprint 1 post-mortem · LA-FA-INCR_

---

---
### LA-CORE-007 · ux · (2026-04-04 — FA document TOC clickable)
**Descripcion:** El indice del documento FA era una lista de parrafos con estilo pero sin hipervinculos internos Word reales. Al hacer click no navegaba a la seccion correspondiente — era puramente decorativo.

**Causa raiz:** `toc_line()` generaba parrafos con formato visual de indice pero sin los elementos XML de Word necesarios para la navegacion interna: `w:hyperlink` con `w:anchor`, ni `w:bookmarkStart`/`w:bookmarkEnd` en los headings de destino.

**Correccion:** REGLA PERMANENTE (LA-TOC-CLICK): el indice de cualquier documento FA generado por SOFIA DEBE usar hipervinculos internos Word nativos:
- Cada heading de seccion tiene un bookmark (`w:bookmarkStart` + `w:bookmarkEnd`) con `bookmark_id` unico y secuencial (via `_next_bid()`).
- Cada entrada del indice usa `w:hyperlink` con `w:anchor` que apunta exactamente al `bookmark_id` del heading de destino.
- El `rStyle=Hyperlink` garantiza compatibilidad con Word y LibreOffice Writer.
- Uso: `Ctrl+Clic` en modo edicion Word, clic directo en modo lectura y en LibreOffice.
- Los anchors del TOC DEBEN coincidir exactamente con los `bookmark_id` de los headings:
  `sec1`, `sec2`, `sec2_1`, `sec2_2`, `sec2_3`, `sec3`, `sec3_1`, `sec3_2`,
  `sec4`, `sprint_{sprint}` (dinamico por sprint), `sec5`, `sec6`, `sec7`, `sec8`.
- Implementado en `add_toc_hyperlink()` y `_add_bookmark()` de `gen-fa-document.py`.

_Registrado: 2026-04-04T11:53:48.561186Z · Fuente: experis-tracker FA doc review · LA-TOC-CLICK_

---

---
### LA-CORE-008 · onboarding · (2026-04-04 — sofia-wizard.py v2.6.11)
**Descripcion:** El wizard de SOFIA no garantizaba que el FA-Agent quedase correctamente configurado durante el onboarding de proyectos nuevos. En experis-tracker Sprint 1 el FA-Agent generó markdowns por sprint (FA-FEAT-001-sprint1.md) en lugar del documento único incremental (FA-experis-tracker-Experis.docx). La causa raíz fue que el wizard no inicializaba fa-index.json ni verificaba que gen-fa-document.py tuviese las capacidades correctas (TOC clickable via LA-TOC-CLICK).

**Correccion:** REGLA PERMANENTE en sofia-wizard.py v2.6.11:
1. Bloque scripts CRITICOS con verificacion explicita de marcadores y tamaño minimo:
   gen-fa-document.py (must: add_toc_hyperlink, w:anchor, _next_bid, >=30KB),
   validate-fa-index.js, verify-persistence.js, guardrail-pre-gate.js.
   Si gen-fa-document.py no existe en SOFIA-CORE/scripts/ → EXIT 1 (BLOQUEANTE).
   Si existe pero sin marcadores TOC → WARN visible con instruccion de actualizar.
2. Nuevo bloque FA-Agent init: si fa_agent_enabled, crea fa-index.json inicial
   con estructura correcta (project, client, doc_version=0.0, toc_clickable=True,
   functionalities=[], business_rules=[], doc_history=[]). El primer Gate 8b
   producirá FA-{proyecto}-{cliente}.docx v1.0 sin intervención manual.
3. CLAUDE.md generado incluye sección 'FA-Agent -- Análisis Funcional' con
   la regla LA-FA-INCR + LA-TOC-CLICK y la ruta exacta del script.
4. config.fa_agent.skill_version='2.6', toc_clickable=True, pattern='LA-FA-INCR+LA-TOC-CLICK'.
5. Verificacion final FA-Agent: script + fa-index.json ambos en disco → print ✓.

_Registrado: 2026-04-04T16:12:59.575769Z · Fuente: experis-tracker Sprint 1 post-mortem · LA-CORE-008_

---

### LA-CORE-009 · ux · (2026-04-05 — Prototipo incremental)
**Descripcion:** En experis-tracker Sprint 3 Step 2c, el UX/UI Agent generó el prototipo del sprint nuevo (PROTO-FEAT-003-sprint3.html) **desde cero** en lugar de extender el prototipo aprobado del sprint anterior. El fichero nuevo perdió completamente el menú de navegación (Dashboard, Mis Imputaciones, Bandeja Manager, Notificaciones, Catálogo Proyectos), el login funcional, la lógica de roles, las funcionalidades de Sprint 1 y 2 ya verificadas y aprobadas, el design system consolidado y los datos demo.

**Causa raíz:** El UX/UI Agent SKILL no especificaba explícitamente que el prototipo es un documento VIVO acumulativo. El agente interpretó "genera el prototipo de Sprint 3" como "crea un fichero nuevo", análogo al anti-patrón del FA por sprints (LA-CORE-006) pero aplicado al prototipo HTML.

**Correccion:** REGLA PERMANENTE — PROTOTIPO INCREMENTAL:
1. El prototipo HTML es un documento VIVO acumulativo, exactamente igual que `FA-{proyecto}-{cliente}.docx`.
2. Step 2c SIEMPRE lee el prototipo del sprint anterior (`PROTO-FEAT-XXX-sprintNN-1.html`) completo antes de hacer cualquier cambio.
3. Solo añade o modifica mediante patches quirúrgicos (`edit_file`) los elementos del sprint actual (nuevas pantallas, extensiones, correcciones de rol).
4. El fichero resultante es `PROTO-FEAT-XXX-sprintNN.html` con el baseline completo + cambios del sprint.
5. NUNCA reescribir el fichero completo sin confirmación explícita del usuario ("reescribe desde cero" o "descarta el prototipo anterior").
6. El UX/UI Agent SKILL.md debe incluir este patrón como primer punto de la sección "Artefactos".

**Aplicación en UX/UI Agent SKILL:** Añadir sección `## Patrón incremental` con checklist de 5 pasos: leer baseline, identificar cambios del sprint, aplicar patches, verificar que el baseline previo sigue funcionando, presentar el diff al usuario.

_Registrado: 2026-04-05T00:00:00.000Z · Fuente: experis-tracker Sprint 3 Step 2c · LA-ET-001-08_

---

### LA-CORE-010 · process · (2026-04-05 — Patch First ante correcciones)
**Descripcion:** En experis-tracker Sprint 3, cuando el usuario señaló errores en el prototipo (funcionalidades faltantes, botones ausentes, roles incorrectos), el UX/UI Agent respondió reescribiendo el fichero HTML completo varias veces. Cada reescritura introducía nuevos errores y/o eliminaba funcionalidades que habían sido añadidas en rondas anteriores de la misma sesión, generando un bucle de correcciones que degradaba la calidad en lugar de mejorarla. El mismo patrón es aplicable a cualquier artefacto de texto del pipeline: DOCX, HTML, JSON, markdown, scripts.

**Causa raíz:** El Orchestrator y los agents-skills no establecían una jerarquía de intervención ante correcciones. El camino de menor resistencia (reescribir) era igual de accesible que el correcto (patch).

**Correccion:** REGLA PERMANENTE — PATCH FIRST (aplica a todos los agentes SOFIA):
1. **Ante cualquier corrección sobre un artefacto existente**: leer el fichero actual → identificar el bloque exacto que debe cambiar → aplicar `edit_file` con el mínimo cambio necesario.
2. **El test de decisión** antes de tocar un fichero: ¿puedo resolver esto cambiando menos de 20 líneas? Si sí → `edit_file`. Si no → preguntar al usuario antes de reescribir.
3. **Reescritura total** solo si: (a) el usuario lo solicita explícitamente, (b) el fichero está estructuralmente corrupto e irreparable con patches, o (c) el cambio afecta > 60% del contenido.
4. **Si se va a reescribir**: anunciar al usuario qué se va a hacer y por qué antes de ejecutar.
5. Esta regla se añade al Orchestrator SKILL.md como "Regla de oro 12: Patch First" y a cada agent-skill con capacidad de escritura en disco.

_Registrado: 2026-04-05T00:00:00.000Z · Fuente: experis-tracker Sprint 3 Step 2c · LA-ET-001-09_

---

### LA-CORE-011 · ux · (2026-04-05 — Verificar matriz de roles antes de construir navegación)
**Descripcion:** En experis-tracker Sprint 3, el prototipo mostraba el enlace "Proyectos" en el menú principal visible para todos los roles (Consultor, Manager, Admin), cuando según el SRS solo el Admin puede gestionar proyectos. La pantalla de aterrizaje del Admin también era incorrecta (Centros de trabajo en lugar de Empleados). Los errores no se detectaron hasta que el usuario los señaló manualmente, obligando a correcciones post-generación.

**Causa raíz:** Step 2c construyó la navegación copiando el patrón del sprint anterior sin extraer la matriz de permisos del SRS del sprint actual. El SRS contenía explícitamente la tabla de roles/funcionalidades (Admin, Manager, Consultor) pero el agente no la consultó antes de definir el menú.

**Correccion:** REGLA PERMANENTE — VERIFICAR MATRIZ DE ROLES:
1. Step 2c, **antes de escribir cualquier línea de navegación o HTML**, extrae del SRS del sprint la tabla de roles/permisos por funcionalidad.
2. Construye una matriz explícita `{ rol: [pantallas_visibles] }` y la documenta en el `UX-FEAT-XXX-sprintNN.md` antes de implementarla en el HTML.
3. Cada ítem del menú tiene un atributo de rol documentado. Items ocultos por rol se validan uno a uno:
   - **Consultor**: Dashboard, Mis Imputaciones, Nueva Imputación, Notificaciones.
   - **Manager**: Bandeja de Validación, Dashboard (lectura equipo), Notificaciones.
   - **Admin**: solo pantallas de gestión vía dropdown (sin acceso a imputaciones propias).
4. La pantalla de aterrizaje por rol se especifica en el UX markdown antes de codificarla.
5. Esta verificación se añade al UX/UI Agent SKILL.md como paso obligatorio previo al diseño de navegación.

_Registrado: 2026-04-05T00:00:00.000Z · Fuente: experis-tracker Sprint 3 Step 2c · LA-ET-001-10_

---

---
### LA-CORE-012 · frontend · (2026-04-05 — Doble script tag al concatenar HTML+JS via bash heredoc)
**Descripcion:** En experis-tracker Sprint 3, al reescribir el bloque JS del `index.html` usando `bash_tool` con la técnica `head -n N file.html > output.html && cat >> output.html << 'HEREDOC'`, se generó un doble `<script><script>` consecutivo. El navegador interpreta el segundo `<script>` como apertura de un bloque anidado inválido, detiene el parseo JS **silenciosamente** (sin error de sintaxis visible) y ninguna función se ejecuta — login, navegación y toda la UI quedan rotas. El error no es evidente hasta abrir las DevTools del navegador.

**Causa raíz:** `head -n N` extrae hasta la línea N **inclusive**. Si N apunta exactamente a la línea `<script>` (detectada por `grep -n "^<script>" file.html | head -1 | cut -d: -f1`), el HTML extraído ya contiene `<script>`. Al añadir el heredoc que también comienza con `<script>`, el fichero resultante tiene dos etiquetas `<script>` consecutivas.

**Corrección:** REGLA PERMANENTE (LA-CORE-012):
1. Al extraer el bloque HTML antes del script, usar línea **ANTERIOR** al tag: `head -n $(expr $(grep -n "^<script>" file.html | head -1 | cut -d: -f1) - 1) file.html > output.html`
2. El heredoc NO debe incluir `<script>` si el HTML ya lo aporta, o debe incluirlo si el HTML se extrae sin él — NUNCA ambos.
3. **Verificación obligatoria** tras cualquier generación de HTML con JS: `grep -c "^<script>" output.html` debe devolver exactamente **1**. Si devuelve 2 → STOP, corregir antes de presentar al usuario o hacer rebuild.
4. Alternativa segura: escribir el fichero completo en una sola operación `filesystem:write_file` desde Python/bash con el contenido completo sin concatenación de partes.

_Registrado: 2026-04-05T13:00:00Z · Fuente: experis-tracker Sprint 3 Step 4-frontend · Gravedad: CRÍTICA_

---
### LA-CORE-013 · frontend · (2026-04-05 — Edits de edit_file perdidas al reescribir fichero sin base actualizada)
**Descripcion:** En experis-tracker Sprint 3, se aplicaron varios `Filesystem:edit_file` al `frontend/public/index.html` (añadir `modalEditar`, añadir `filFestAmbito`, botón Nuevo Empleado, `modalEmpleado` 3 modos). Posteriormente, al decidir reescribir el bloque JS completo, se usó como base HTML una copia del fichero obtenida **antes** de aplicar esos edits (`/tmp/index_prod.html` — copia previa). El HTML resultante no contenía `modalEditar`, `filFestAmbito` ni las otras modificaciones. Todos los edits previos se perdieron silenciosamente. El error se manifestó como "Error al cargar imputación" (modalEditar ausente → `null.classList` → TypeError capturado por catch) y como pantalla de empleados sin botones ni filtros.

**Causa raíz:** Al mezclar en la misma sesión la técnica de **edit_file incremental** con la técnica de **reescritura total via bash_tool**, la base usada para la reescritura fue una copia anterior al estado actual del fichero en disco. La copia en `/tmp` o en `/mnt/user-data/uploads/` no se actualiza automáticamente cuando se aplican `Filesystem:edit_file`.

**Corrección:** REGLA PERMANENTE (LA-CORE-013):
1. **PATCH FIRST sin excepción** (refuerza LA-CORE-010): ante cualquier corrección sobre un fichero HTML de frontend, usar `Filesystem:edit_file`. La reescritura total es el último recurso.
2. **Si se va a reescribir**: ejecutar `Filesystem:copy_file_user_to_claude` inmediatamente antes de la reescritura para obtener el estado ACTUAL del fichero en disco. Nunca usar una copia anterior.
3. **Tras cualquier reescritura**: verificar presencia de elementos clave con `grep -c 'id="modal' output.html` y compararlos contra el fichero anterior. Cualquier reducción en el número de modales, screens o funciones JS es un indicador de regresión.
4. **No mezclar edit_file + reescritura total** en la misma sesión sobre el mismo fichero sin un checkpoint explícito de estado (copy + verify).
5. Si se detecta que edits previos se han perdido: no corregir con otro edit sobre el fichero corrupto — leer el estado actual, identificar todos los gaps y aplicar todos los fixes en una sola pasada.

_Registrado: 2026-04-05T13:00:00Z · Fuente: experis-tracker Sprint 3 Step 4-frontend · Gravedad: ALTA_

---
### LA-CORE-009 · infrastructure · (2026-04-05 — sofia-shell MCP v2.0)
**Descripcion:** `mcp-shell-server.js` tenia `PROJECT_ROOT` hardcodeado a `/Users/cuadram/proyectos/bank-portal`. Al trabajar en experis-tracker u otro proyecto registrado, todos los comandos se ejecutaban en bank-portal. El error era silencioso: el servidor aceptaba el comando, lo ejecutaba en el lugar incorrecto y devolvía resultados del proyecto equivocado.

**Causa raiz:** El servidor MCP se arranca UNA sola vez en Claude Desktop para toda la sesion. No puede saber que proyecto esta activo a nivel de configuracion estatica. El `PROJECT_ROOT` era una constante fija, no un valor dinamico por llamada.

**Correccion:** REGLA PERMANENTE en `mcp-shell-server.js` v2.0 (LA-CORE-009):
- `resolveDefaultRoot()`: resuelve en runtime (por llamada) el proyecto activo.
  Prioridad: (1) env `SOFIA_REPO` del proceso → (2) proyecto `active` en `~/.sofia/projects.json` → (3) home dir.
- `resolveAndValidateCwd(cwdArg, defaultRoot)`: acepta rutas absolutas o relativas.
  Rutas absolutas validadas contra TODOS los proyectos registrados en el registro.
  Rutas relativas resueltas contra `defaultRoot`. Aislamiento garantizado por `ownerRoot`.
- `readRegistry()`: lee `~/.sofia/projects.json` en CADA llamada (no en startup).
  Esto permite que el registro cambie sin reiniciar Claude Desktop.
- Claude debe pasar el SOFIA_REPO del proyecto como `cwd` absoluto:
  `cwd: "/Users/cuadram/.../experis-tracker"` en lugar de rutas relativas.
- El `CLAUDE.md` de cada proyecto contiene `SOFIA_REPO=<ruta>`. Claude lo lee en INIT
  y lo usa como `cwd` en todas las llamadas a `sofia-shell:run_command`.
- El wizard genera `~/.sofia/projects.json` automaticamente en cada onboarding.
- Configuracion en `claude_desktop_config.json`: una sola entrada `sofia-shell`,
  opcional `env.SOFIA_REPO` para forzar un proyecto por defecto.

_Registrado: 2026-04-05T08:25:57.793797Z · Fuente: session multi-proyecto BankPortal+ExperisTracker · LA-CORE-009_

---
