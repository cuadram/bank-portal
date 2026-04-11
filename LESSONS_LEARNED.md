# LESSONS LEARNED — bank-portal · SOFIA v2.6
**Proyecto:** bank-portal · Banco Meridian
**Actualizado:** 2026-04-05 | **Total:** 49 lecciones
**Versión SOFIA:** 2.6

> ⚠️ **ARCHIVO GENERADO AUTOMÁTICAMENTE — NO EDITAR DIRECTAMENTE**
> **Fuente canónica:** `.sofia/session.json` campo `lessons_learned[]`
> **Regenerar:** ejecutar `.sofia/scripts/gen-lessons-learned.py` en Step 9
> **LAs del framework:** ver `LESSONS_LEARNED_CORE.md` (solo lectura, copia de SOFIA-CORE)

---

## Sprint 19

### LA-019-03 — 🔄 [PROCESS]
**Descripción:** Gates G-6..G-9 auto-aprobados incorrectamente. Corrección: cada gate HITL requiere parada explícita individual.
**Corrección:** Desde Sprint 20: parada obligatoria en cada gate HITL con pregunta al rol definido.
**Registrado:** 2026-03-27

### LA-019-04 — 🧪 [TESTING]
**Descripción:** Tests unitarios no detectan conflictos de beans Spring — requieren @SpringBootTest completo
**Corrección:** G-4 requiere IT smoke test por feature nueva

### LA-019-05 — 🚀 [DEVOPS]
**Descripción:** Build Angular sin --configuration=production no activa budget CSS ni environment.prod.ts
**Corrección:** CI y Dockerfile usan siempre ng build --configuration=production

### LA-019-06 — 🔄 [PROCESS]
**Descripción:** Patrón DEBT-022 no verificable automáticamente en Code Review
**Corrección:** Script grep DEBT-022 obligatorio en G-5

### LA-019-07 — 🧪 [TESTING]
**Descripción:** Smoke test desactualizado — no cubre endpoints del sprint corriente
**Corrección:** smoke-test actualizado obligatorio como artefacto de G-4

### LA-019-08 — 🏗️ [ARCHITECTURE]
**Descripción:** @Profile(!production) activa Mock en STG — BD real nunca consultada
**Corrección:** Mocks solo con @Profile(mock) o @Profile(test). @Primary en adaptador real.

### LA-019-09 — ⚙️ [CONFIG]
**Descripción:** environment.prod.ts desincronizado con environment.ts
**Corrección:** Validación automática de campos en CI

### LA-019-10 — 🅰️ [FRONTEND]
**Descripción:** Módulos Angular nuevos no registrados en router
**Corrección:** Checklist G-4 incluye verificación de registro en app-routing.module.ts

### LA-019-11 — 🅰️ [FRONTEND]
**Descripción:** Componentes de ruta usan @Input para params — nunca se populan
**Corrección:** Usar siempre ActivatedRoute.paramMap en componentes de ruta

### LA-019-12 — 📦 [DATA]
**Descripción:** UUIDs inválidos en seeds SQL (caracteres no hex)
**Corrección:** Validar UUIDs con regex antes de ejecutar seeds

### LA-019-13 — 🗄️ [DATABASE]
**Descripción:** timestamp without time zone vs Instant Java — incompatibilidad de tipos
**Corrección:** LLD incluye mapa de tipos BD→Java. Usar LocalDateTime para columnas sin timezone.

### LA-019-14 — 🅰️ [FRONTEND]
**Descripción:** OnPush + paramMap no dispara CD al cambiar cuenta
**Corrección:** OnPush solo cuando se garantiza inmutabilidad y markForCheck() en todos los observables

### LA-019-15 — ☕ [BACKEND]
**Descripción:** Named params JdbcClient contaminados por concatenación de text blocks
**Corrección:** SQL dinámico siempre usa parámetros posicionales (?)

### LA-019-16 — 🔄 [PROCESS]
**Descripción:** QA no declara si prueba contra Mock o BD real
**Corrección:** Informe QA obliga campo: Repositorio activo: MOCK|JPA-REAL

## Sprint 20

### LA-020-01 — 🔄 [PROCESS]
**Descripción:** Jira debe actualizarse en cada step del pipeline sin instruccion explicita
**Corrección:** Regla permanente: transicion automatica en cada gate

### LA-020-02 — 🔒 [SECURITY]
**Descripción:** Hallazgos CVSS >= 4.0 deben resolverse en el mismo sprint donde se detectan
**Corrección:** No diferir si CVSS >= 4.0

### LA-020-03 — 🏗️ [ARCHITECTURE]
**Descripción:** Audit log con datos derivados crea inconsistencia — enriquecer en momento de escritura
**Corrección:** DEBT-036: inyectar AccountRepository en ExportAuditService

### LA-020-04 — 🚀 [DEVOPS]
**Descripción:** Workflow Jira debe configurarse con todos los estados SOFIA antes del primer sprint
**Corrección:** Checklist onboarding incluye configuracion workflow

### LA-020-05 — 🔄 [PROCESS]
**Descripción:** Documentation Agent (10 DOCX + 3 XLSX + dashboard) no ejecutado en Step 8 — error detectado post-cierre
**Corrección:** Desde Sprint 21: Documentation Agent es BLOQUEANTE para Gate G-9. No se cierra sprint sin estos artefactos.

### LA-020-06 — 🔄 [PROCESS]
**Descripción:** sprint-NN-planning-doc.docx es obligatorio en word/ de cada sprint — faltaba S18, S19, S20
**Corrección:** Checklist deliverables: planning-doc.docx bloqueante para Gate G-8 desde Sprint 21

### LA-020-07 — 📊 [DASHBOARD]
**Descripción:** Dashboard no se regeneraba en cada aprobacion de gate, solo al cerrar sprint
**Corrección:** gate-dashboard-hook.js invocado en cada gate. dashboard_on_every_gate:true en sofia-config.json

### LA-020-08 — 🔄 [PROCESS]
**Descripción:** gen-fa-document.py no se invocaba automaticamente en Step 8b — FA-BankPortal-Banco-Meridian.docx no se actualizaba en S19 ni S20. Script solo cubria hasta FEAT-016.
**Corrección:** gen-fa-document.py debe ejecutarse en Step 8b de cada sprint. Anadir llamada al gate-dashboard-hook como paso obligatorio. Script actualizado con FEAT-017 y FEAT-018.

### LA-020-09 — 🔄 [PROCESS]
**Descripción:** Developer Agent generó ficheros bajo paquete incorrecto (es.meridian) inferido de documentación, sin verificar paquete raíz real del proyecto.
**Corrección:** REGLA PERMANENTE: antes de crear cualquier fichero Java en un sprint, el Developer Agent DEBE ejecutar: (1) cat BankPortalApplication.java | head -1 para obtener el package raíz real, (2) ls src/main/java/ para confirmar estructura. Sin esta verificación el fichero no se escribe.
**Registrado:** 2026-03-30

### LA-020-10 — 👁️ [CODE-REVIEW]
**Descripción:** Code Reviewer validó consistencia interna entre ficheros nuevos pero no contra el codebase real. Marcó paquete incorrecto como correcto porque era uniforme entre los nuevos ficheros.
**Corrección:** REGLA PERMANENTE: el Code Reviewer DEBE ejecutar grep del package raíz contra los nuevos ficheros y contrastar con el package del proyecto. Checklist G-5 añade: grep -r "^package" src/main/java/com/ | head -1 vs package de cada fichero nuevo. Discrepancia = bloqueante.
**Registrado:** 2026-03-30

### LA-020-11 — 🧪 [TESTING]
**Descripción:** Sprint 20 cerrado sin SpringContextIT ni integrations tests. 446 unit tests pasando ocultaron que la build no compilaría. Gate G-4b aprobado sin mvn compile real.
**Corrección:** REGLA PERMANENTE: SpringContextIT es BLOQUEANTE para Gate G-4b. Si no existe en el proyecto, el Developer Agent lo crea en el mismo step. mvn compile (no mvn test) debe ejecutarse via sofia-shell antes de declarar G-4b OK. Sin BUILD SUCCESS en consola el gate no se aprueba.
**Registrado:** 2026-03-30

### LA-TEST-001 — ☕ [BACKEND]
**Descripción:** ExportController usaba getAttribute("userId") pero JwtAuthenticationFilter escribe "authenticatedUserId". Discrepancia de nombre de atributo de request invisible en compilacion y en Code Review — causa HTTP 500 en produccion.
**Corrección:** REGLA PERMANENTE: al usar HttpServletRequest.getAttribute() para propagar claims JWT, el nombre del atributo debe verificarse contra el filtro que lo escribe en el mismo PR. Checklist G-5 añade: grep authenticatedUserId en controladores que extraigan userId del request.
**Registrado:** 2026-03-31

### LA-TEST-002 — ☕ [BACKEND]
**Descripción:** TransactionExportRepository filtraba t.type (CARGO|ABONO — direction financiera) cuando el ExportRequest.tipoMovimiento contiene valores de categoria de negocio (DOMICILIACION, PAGO_TARJETA, INGRESO...). Compilacion correcta, tests unitarios pasaban, fallo silencioso en runtime: filtro nunca coincide.
**Corrección:** REGLA PERMANENTE: distinguir siempre entre type (direccion financiera: CARGO/ABONO) y category (tipo negocio: DOMICILIACION/PAGO_TARJETA/INGRESO/COMISION/TRANSFERENCIA_*). Tests de integracion deben verificar que el filtro devuelve registros, no solo HTTP 200.
**Registrado:** 2026-03-31

### LA-TEST-003 — ☕ [BACKEND]
**Descripción:** Excepciones de dominio (ExportRangeException, ExportLimitExceededException) sin @ResponseStatus ni @ControllerAdvice mapeo → Spring devuelve HTTP 500 en lugar de 400/422. La suite de tests detecto que TC-014 (rango invertido) retornaba 500 en lugar de 400.
**Corrección:** REGLA PERMANENTE: toda excepcion de dominio custom debe tener @ResponseStatus o estar mapeada en un @ControllerAdvice. Developer Agent debe crear ExceptionHandler en el mismo step que crea las excepciones. Checklist G-4 añade: verificar que todas las RuntimeException del modulo tienen handler HTTP explicito.
**Registrado:** 2026-03-31

### LA-TEST-004 — ☕ [BACKEND]
**Descripción:** JdbcClient (Spring 6) no convierte java.time.Instant automaticamente para columnas TIMESTAMP without time zone de PostgreSQL. Pasar Instant directo en params() lanza DataAccessException en runtime — invisible en compilacion y en tests unitarios con mocks.
**Corrección:** REGLA PERMANENTE: para columnas TIMESTAMP (sin timezone) en PostgreSQL via JdbcClient, usar siempre Timestamp.from(instant) o LocalDateTime. Para columnas TIMESTAMPTZ usar OffsetDateTime. Developer Agent debe incluir este mapeo en el LLD y verificarlo en el IT smoke test antes de G-4b.
**Registrado:** 2026-03-31

## Sprint 21

### LA-FRONT-001 — 🅰️ [FRONTEND]
**Descripción:** Módulos Angular implementados en features/ no registrados en app-routing.module.ts ni en el sidebar (shell.component.ts). El módulo existe y compila pero es inaccesible para el usuario.
**Corrección:** REGLA PERMANENTE: al crear cualquier módulo Angular en features/, el Developer Agent debe en el mismo step: (1) añadir la ruta lazy en app-routing.module.ts, (2) añadir el nav item en shell.component.ts. Checklist G-4 añade: verificar que todo módulo en features/ tiene ruta y nav item.
**Registrado:** 2026-03-31

### LA-FRONT-002 — 🅰️ [FRONTEND]
**Descripción:** Componente placeholder creado para resolver error de build (export.module.ts sin componente) pero quedó en producción con botones "Próximamente", ocultando funcionalidad backend ya implementada.
**Corrección:** REGLA PERMANENTE: antes de crear un componente placeholder, verificar si el backend tiene el endpoint implementado. Si existe, implementar el componente real directamente. Un placeholder nunca debe llegar a una imagen Docker de producción.
**Registrado:** 2026-03-31

### LA-FRONT-003 — 🅰️ [FRONTEND]
**Descripción:** Import path incorrecto en componente anidado: desde components/export-panel/ se usó ../services/ (1 nivel) cuando el servicio está en ../../services/ (2 niveles). Error invisible hasta docker build.
**Corrección:** REGLA PERMANENTE: al crear componentes en subdirectorios anidados (components/nombre/), calcular el path relativo desde la ubicación real del fichero. Verificar siempre: profundidad del componente vs profundidad del módulo al que pertenece el servicio.
**Registrado:** 2026-03-31

### LA-FRONT-004 — 🅰️ [FRONTEND]
**Descripción:** Backend ProfileController no implementado (FEAT-012 S14) pero el módulo Angular de perfil estaba registrado en el router. El componente cargaba, hacía forkJoin a /api/v1/profile, obtenía EMPTY y no renderizaba nada — sin error visible para el usuario.
**Corrección:** REGLA PERMANENTE: antes de registrar una ruta Angular, verificar que el endpoint backend correspondiente existe. Si no existe, registrar deuda técnica (DEBT-XXX) y mantener la ruta comentada hasta implementación. No exponer rutas con endpoints inexistentes.
**Registrado:** 2026-03-31

### LA-FRONT-005 — 🅰️ [FRONTEND]
**Descripción:** docker compose up sirve la imagen preconstruida — cambios en source code no se reflejan sin docker compose build. Confusión recurrente: el fichero en disco estaba correcto pero el contenedor seguía mostrando la versión anterior.
**Corrección:** REGLA PERMANENTE: cualquier cambio en frontend Angular requiere docker compose build frontend + docker compose up -d --no-deps frontend. Documentar este flujo en el runbook del proyecto. Añadir al checklist de G-4b.
**Registrado:** 2026-03-31

### LA-021-01 — 🔄 [PROCESS]
**Descripción:** FA-Agent actualizaba functionalities en Gate 2b pero NO el array business_rules. total_business_rules estaba hardcodeado y desincronizado del array real (141 declarado vs 129 real en S20). Detectado al verificar el estado del análisis funcional antes de Gate G-3.
**Corrección:** REGLA PERMANENTE: (1) En Gate 2b, añadir business_rules de la feature nueva junto a functionalities — nunca uno sin el otro. (2) total_business_rules = len(business_rules) — NUNCA hardcodeado. (3) validate-fa-index.js bloqueante en Gate 2b, 3b y 8b. Script creado: .sofia/scripts/validate-fa-index.js. FA-Agent SKILL.md bumped a v2.3.
**Registrado:** 2026-03-31

### LA-021-02 — 🧪 [TESTING]
**Descripción:** IntegrationTestBase no declaraba campos testUserId/testAccountId que DashboardJpaAdapterIT usaba, causando error de compilación de tests y bloqueando mvn test.
**Corrección:** REGLA: IntegrationTestBase debe declarar todos los fixtures UUID comunes usados por los tests hijos. Cualquier campo usado en múltiples ITs debe estar en la clase base, no en la hija.
**Registrado:** 2026-03-31

### LA-021-03 — 🔄 [PROCESS]
**Descripción:** Documentation Agent generó solo 10 DOCX en Sprint 21 vs los 12+ obligatorios. Faltaban: CMMI-Evidence, Meeting-Minutes, Project-Plan, Quality-Summary, Risk-Register, Traceability, planning-doc.
**Corrección:** REGLA PERMANENTE: Documentation Agent DEBE generar siempre los 17 documentos estándar (10 técnicos + 7 CMMI/Gestión). Los 7 adicionales son BLOQUEANTES para Gate G-8 desde Sprint 22. Actualizar SKILL.md doc-agent y checklist G-8.
**Registrado:** 2026-04-01

### LA-STG-001 — 🅰️ [FRONTEND]
**Descripción:** forkJoin en ProfilePageComponent bloqueado por catchError->EMPTY en endpoints 404. El componente quedaba en skeleton infinito porque EMPTY completa sin emitir y forkJoin requiere que todos los observables emitan.
**Corrección:** REGLA: catchError en observables usados en forkJoin DEBE retornar of(valorDefecto) nunca EMPTY. EMPTY en forkJoin = deadlock silencioso.
**Registrado:** 2026-04-01

### LA-STG-002 — 🅰️ [FRONTEND]
**Descripción:** LoginComponent tenia version/sprint hardcodeados Sprint 13 v1.13.0 — no se actualizaba en cada sprint. Detectado en verificacion STG v1.21.0.
**Corrección:** REGLA: version/sprint/envLabel SIEMPRE desde environment.ts. Campos obligatorios en ambos environment files. stg-pre-check.js detecta patron automaticamente en G-4/G-5.
**Registrado:** 2026-04-01

## Sprint 22

### LA-022-01 — 🔒 [SECURITY]
**Descripción:** DEBT-040/041 vencieron su sprint_target (S21) sin cerrarse. CVSS >= 4.0 diferidos = riesgo real en produccion.
**Corrección:** REGLA PERMANENTE: GR-010 en guardrail-pre-gate.js bloquea Gate G-9 si open_debts tiene items con cvss >= 4.0 y sprint_target <= current_sprint. Sin excepcion.
**Registrado:** 2026-04-02

### LA-022-02 — 🔄 [PROCESS]
**Descripción:** LESSONS_LEARNED.md tenia 0 lineas en disco. 38 LAs vivian solo en session.json — perdida total si el fichero se corrompe.
**Corrección:** REGLA PERMANENTE: Step 9 (Workflow Manager) regenera LESSONS_LEARNED.md desde session.json como paso obligatorio. workflow_directives.lessons_learned_mandatory=true en sofia-config.json.
**Registrado:** 2026-04-02

### LA-022-03 — 🔄 [PROCESS]
**Descripción:** Performance Agent y Jenkins Agent tenian SKILL.md en disco desde S19/S20 pero no estaban en pipeline.active_steps. Agentes sin gate = agentes sin efecto real.
**Corrección:** REGLA PERMANENTE: todo agente con SKILL.md debe estar asociado a un step y gate. Agentes durmientes se formalizan o se archivan. sofia-config.pipeline_steps_total debe coincidir con active_steps.
**Registrado:** 2026-04-02

### LA-022-04 — 🔒 [SECURITY]
**Descripción:** GR-010 evidencio que open_debts y security.open_debts estaban duplicados en session.json — mismos debts en dos arrays separados, causando deteccion doble en el guardrail.
**Corrección:** REGLA: usar solo session.open_debts como fuente unica de verdad. security.open_debts se mantiene como referencia pero GR-010 deduplica por id antes de evaluar.
**Registrado:** 2026-04-02

### LA-022-05 — 📊 [DASHBOARD]
**Descripción:** Dashboard global no regenerado en los gates G-1, G-2 y HITL-PO-TL de Sprint 22 (2026-04-02). El fichero en disco seguía mostrando Sprint 21 / FEAT-019 mientras el pipeline ya estaba en Sprint 22 Step 3. Violacion de LA-020-07.
**Corrección:** REGLA PERMANENTE: GR-011 añadido a guardrail-pre-gate.js — verifica que dashboard_global.last_generated >= ultimo gate aprobado. Dashboard desactualizado = gate BLOQUEADO. Sin excepcion.
**Registrado:** 2026-04-02

### LA-022-06 — 📊 [DASHBOARD]
**Descripción:** gen-global-dashboard.js trataba gate_pending como objeto ({step,waiting_for}) cuando en session.json es un string ("G-5"). Resultado: GP.step=undefined y GP.waiting_for=undefined en el HTML generado. Segundo bug: args parser solo soportaba --gate G-5 (espacio) no --gate=G-5 (igual). | SEGUNDO BUG: GP.jira_issue=null (sin Jira issue asignado al gate) aparecia literalmente en 4 puntos del HTML sin fallback.
**Corrección:** REGLA PERMANENTE: (1) Normalizar gate_pending al leer session.json: si es string, convertir a {step, waiting_for, jira_issue} usando GATE_ROLES map. (2) parseArg() soporta ambas sintaxis --name=value y --name value. Sin excepcion. (2) Todos los usos de GP.jira_issue en plantillas HTML deben tener fallback: GP.jira_issue||GP.step. Sin excepcion — jira_issue es opcional.
**Registrado:** 2026-04-02

### LA-022-07 — 🔄 [PROCESS]
**Descripción:** Step 3b (Documentation Agent: publicar HLD en Confluence + validate-fa-index en gate 3b) no se ejecuto ni registro en Sprint 22. Los artefactos existian en disco y en Confluence (page 7405570) pero completed_steps no incluia 3b y sofia.log no tenia entrada para Step-3b S22.
**Corrección:** REGLA PERMANENTE: Step 3b es OBLIGATORIO inmediatamente despues de aprobacion G-3. El Workflow Manager debe verificar que 3b esta en completed_steps antes de pasar a Step 4. Si falta, ejecutar retroactivamente antes de continuar el pipeline. Gate G-3 no cierra hasta que 3b esta logueado.
**Registrado:** 2026-04-02

### LA-022-08 — 🔄 [PROCESS]
**Descripción:** Documentation Agent generó ficheros .md y los reportó como documentos Word/Excel reales. El directorio word/ contenía .md en lugar de .docx. El directorio excel/ estaba vacío. Detectado por Product Owner al revisar el directorio.
**Corrección:** REGLA PERMANENTE: Documentation Agent DEBE generar binarios reales: .docx con librería docx (npm) y .xlsx con librería xlsx. NUNCA reportar .md como equivalente a .docx. Verificación obligatoria: listar directorio con extensiones antes de reportar entrega. Archivos .md son borradores internos, no entregables al cliente.
**Registrado:** 2026-04-02

### LA-022-09 — 🚀 [DEVOPS]
**Descripción:** Seeds Flyway aplicados manualmente via psql durante verificación STG no quedan registrados en flyway_schema_history. Al reiniciar el stack, Flyway intenta aplicar la migración desde cero → 23505 duplicate key en el primer INSERT.
**Corrección:** REGLA PERMANENTE: los seeds de STG SIEMPRE deben aplicarse a través del stack completo (docker compose up) nunca via psql directo. Todos los INSERTs de migrations con IDs fijos deben usar ON CONFLICT (id) DO NOTHING para ser idempotentes. Flyway no es idempotente por defecto.
**Registrado:** 2026-04-02

## Sprint 23

### LA-023-01 — 🅰️ [FRONTEND]
**Descripción:** En componentes Angular, usar [href] nativo en enlaces internos causa full page reload — el ShellComponent desaparece y la pantalla queda en blanco sin menú. Detectado en Mi Perfil inbox al pulsar Ver→ sobre notif.actionUrl. SEGUNDO HALLAZGO: actionUrl en seeds con rutas inexistentes (/bills /transfers) — navigateByUrl() silencia el error y no navega. Fix: ROUTE_MAP de aliases + fallback /dashboard + corrección de seeds en BD.
**Corrección:** REGLA PERMANENTE: nunca usar [href] para navegación interna en Angular. Usar siempre (click)+router.navigateByUrl() para URLs dinámicas con posibles query params, o [routerLink] para rutas estáticas. Checklist G-4 y G-5 añaden: grep -r "[href]" src/app/features/ — cualquier resultado con path interno es bloqueante. Adicionalmente: los seeds de notificaciones deben usar SOLO rutas registradas en app-routing.module.ts. Verificar con: SELECT DISTINCT action_url FROM user_notifications — cada valor debe existir en la tabla de rutas del router.
**Registrado:** 2026-04-03

---

## Índice por Tipo

- **architecture:** LA-019-08, LA-020-03
- **backend:** LA-019-15, LA-TEST-001, LA-TEST-002, LA-TEST-003, LA-TEST-004
- **code-review:** LA-020-10
- **config:** LA-019-09
- **dashboard:** LA-020-07, LA-022-05, LA-022-06
- **data:** LA-019-12
- **database:** LA-019-13
- **devops:** LA-019-05, LA-020-04, LA-022-09
- **frontend:** LA-019-10, LA-019-11, LA-019-14, LA-FRONT-001, LA-FRONT-002, LA-FRONT-003, LA-FRONT-004, LA-FRONT-005, LA-STG-001, LA-STG-002, LA-023-01
- **process:** LA-019-03, LA-019-06, LA-019-16, LA-020-01, LA-020-05, LA-020-06, LA-020-08, LA-020-09, LA-021-01, LA-021-03, LA-022-02, LA-022-03, LA-022-07, LA-022-08
- **security:** LA-020-02, LA-022-01, LA-022-04
- **testing:** LA-019-04, LA-019-07, LA-020-11, LA-021-02

---

## Reglas Permanentes Activas (SOFIA v2.6)

| ID | Regla |
|---|---|
| LA-018-01 | SIEMPRE leer session.json desde disco antes de actuar en continuacion de sesion |
| LA-020-01 | Jira transiciona en cada gate del pipeline sin instruccion explicita |
| LA-020-02 | CVSS >= 4.0 se resuelve en el mismo sprint — nunca diferir |
| LA-020-07 | Dashboard regenerado en cada gate (GR-011) |
| LA-020-08 | gen-fa-document.py obligatorio en Step 8b — verificacion blocking |
| LA-020-09 | Developer verifica package/namespace raiz ANTES de crear ficheros |
| LA-020-10 | Code Reviewer contrasta namespaces nuevos contra codebase real |
| LA-020-11 | Test de integracion BLOQUEANTE para G-4b — sin BUILD SUCCESS no hay gate |
| LA-021-01 | FA-Agent: total_business_rules dinamico — validate-fa-index en 2b/3b/8b |
| LA-021-02 | Base de tests declara TODOS los fixtures comunes (IDs, UUIDs, mocks) |
| LA-021-03 | Doc Agent: 17 DOCX + 3 XLSX REALES OBLIGATORIOS — bloqueante G-8 |
| LA-022-02 | Step 9 regenera LESSONS_LEARNED.md desde session.json (este script) |
| LA-022-05 | Dashboard actualizado en CADA gate (GR-011 bloqueante) |
| LA-022-07 | Step 3b OBLIGATORIO post G-3 — verificar completed_steps antes de Step 4 |
| LA-022-08 | Doc Agent genera BINARIOS REALES (.docx/.xlsx) — NUNCA .md como entregable |
| LA-FRONT-001 | Modulo/componente nuevo → ruta registrada + nav item en MISMO step |
| LA-FRONT-004 | Verificar endpoint backend existe ANTES de registrar ruta frontend |
| LA-CORE-003 | GR-CORE-003: SOFIA_REPO verificado en INIT y antes de cada escritura |
| LA-CORE-004 | Estructura canonica de directorios copiada desde repo-template al crear proyecto |
