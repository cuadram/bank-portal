# LESSONS LEARNED — BankPortal · Banco Meridian

> Generado por SOFIA v2.7 · Batch Approval PO · 2026-04-09

**Total Lessons Learned:** 84

---

## Sprint 19

### LA-019-03 · process

**Descripción:** Gates G-6..G-9 auto-aprobados incorrectamente. Corrección: cada gate HITL requiere parada explícita individual.

**Corrección:** Desde Sprint 20: parada obligatoria en cada gate HITL con pregunta al rol definido.

_Registrado: 2026-03-27T14:06:00.285397Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-04 · testing

**Descripción:** Tests unitarios no detectan conflictos de beans Spring — requieren @SpringBootTest completo

**Corrección:** G-4 requiere IT smoke test por feature nueva

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-05 · devops

**Descripción:** Build Angular sin --configuration=production no activa budget CSS ni environment.prod.ts

**Corrección:** CI y Dockerfile usan siempre ng build --configuration=production

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-06 · process

**Descripción:** Patrón DEBT-022 no verificable automáticamente en Code Review

**Corrección:** Script grep DEBT-022 obligatorio en G-5

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-07 · testing

**Descripción:** Smoke test desactualizado — no cubre endpoints del sprint corriente

**Corrección:** smoke-test actualizado obligatorio como artefacto de G-4

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-08 · architecture

**Descripción:** @Profile(!production) activa Mock en STG — BD real nunca consultada

**Corrección:** Mocks solo con @Profile(mock) o @Profile(test). @Primary en adaptador real.

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-09 · config

**Descripción:** environment.prod.ts desincronizado con environment.ts

**Corrección:** Validación automática de campos en CI

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-10 · frontend

**Descripción:** Módulos Angular nuevos no registrados en router

**Corrección:** Checklist G-4 incluye verificación de registro en app-routing.module.ts

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-11 · frontend

**Descripción:** Componentes de ruta usan @Input para params — nunca se populan

**Corrección:** Usar siempre ActivatedRoute.paramMap en componentes de ruta

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-12 · data

**Descripción:** UUIDs inválidos en seeds SQL (caracteres no hex)

**Corrección:** Validar UUIDs con regex antes de ejecutar seeds

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-13 · database

**Descripción:** timestamp without time zone vs Instant Java — incompatibilidad de tipos

**Corrección:** LLD incluye mapa de tipos BD→Java. Usar LocalDateTime para columnas sin timezone.

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-14 · frontend

**Descripción:** OnPush + paramMap no dispara CD al cambiar cuenta

**Corrección:** OnPush solo cuando se garantiza inmutabilidad y markForCheck() en todos los observables

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-15 · backend

**Descripción:** Named params JdbcClient contaminados por concatenación de text blocks

**Corrección:** SQL dinámico siempre usa parámetros posicionales (?)

**Aprobado por:** product-owner · 2026-04-09

---

### LA-019-16 · process

**Descripción:** QA no declara si prueba contra Mock o BD real

**Corrección:** Informe QA obliga campo: Repositorio activo: MOCK|JPA-REAL

**Aprobado por:** product-owner · 2026-04-09

---

## Sprint 20

### LA-020-01 · process

**Descripción:** Jira debe actualizarse en cada step del pipeline sin instruccion explicita

**Corrección:** Regla permanente: transicion automatica en cada gate

**Aprobado por:** product-owner · 2026-04-09

---

### LA-020-02 · security

**Descripción:** Hallazgos CVSS >= 4.0 deben resolverse en el mismo sprint donde se detectan

**Corrección:** No diferir si CVSS >= 4.0

**Aprobado por:** product-owner · 2026-04-09

---

### LA-020-03 · architecture

**Descripción:** Audit log con datos derivados crea inconsistencia — enriquecer en momento de escritura

**Corrección:** DEBT-036: inyectar AccountRepository en ExportAuditService

**Aprobado por:** product-owner · 2026-04-09

---

### LA-020-04 · devops

**Descripción:** Workflow Jira debe configurarse con todos los estados SOFIA antes del primer sprint

**Corrección:** Checklist onboarding incluye configuracion workflow

**Aprobado por:** product-owner · 2026-04-09

---

### LA-020-05 · process

**Descripción:** Documentation Agent (10 DOCX + 3 XLSX + dashboard) no ejecutado en Step 8 — error detectado post-cierre

**Corrección:** Desde Sprint 21: Documentation Agent es BLOQUEANTE para Gate G-9. No se cierra sprint sin estos artefactos.

**Aprobado por:** product-owner · 2026-04-09

---

### LA-020-06 · process

**Descripción:** sprint-NN-planning-doc.docx es obligatorio en word/ de cada sprint — faltaba S18, S19, S20

**Corrección:** Checklist deliverables: planning-doc.docx bloqueante para Gate G-8 desde Sprint 21

**Aprobado por:** product-owner · 2026-04-09

---

### LA-020-07 · dashboard

**Descripción:** Dashboard no se regeneraba en cada aprobacion de gate, solo al cerrar sprint

**Corrección:** gate-dashboard-hook.js invocado en cada gate. dashboard_on_every_gate:true en sofia-config.json

**Aprobado por:** product-owner · 2026-04-09

---

### LA-020-08 · process

**Descripción:** gen-fa-document.py no se invocaba automaticamente en Step 8b — FA-BankPortal-Banco-Meridian.docx no se actualizaba en S19 ni S20. Script solo cubria hasta FEAT-016.

**Corrección:** gen-fa-document.py debe ejecutarse en Step 8b de cada sprint. Anadir llamada al gate-dashboard-hook como paso obligatorio. Script actualizado con FEAT-017 y FEAT-018.

**Aprobado por:** product-owner · 2026-04-09

---

### LA-020-09 · process

**Descripción:** Developer Agent generó ficheros bajo paquete incorrecto (es.meridian) inferido de documentación, sin verificar paquete raíz real del proyecto.

**Corrección:** REGLA PERMANENTE: antes de crear cualquier fichero Java en un sprint, el Developer Agent DEBE ejecutar: (1) cat BankPortalApplication.java | head -1 para obtener el package raíz real, (2) ls src/main/java/ para confirmar estructura. Sin esta verificación el fichero no se escribe.

_Registrado: 2026-03-30T18:42:40.685Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-020-10 · code-review

**Descripción:** Code Reviewer validó consistencia interna entre ficheros nuevos pero no contra el codebase real. Marcó paquete incorrecto como correcto porque era uniforme entre los nuevos ficheros.

**Corrección:** REGLA PERMANENTE: el Code Reviewer DEBE ejecutar grep del package raíz contra los nuevos ficheros y contrastar con el package del proyecto. Checklist G-5 añade: grep -r "^package" src/main/java/com/ | head -1 vs package de cada fichero nuevo. Discrepancia = bloqueante.

_Registrado: 2026-03-30T18:42:40.686Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-020-11 · testing

**Descripción:** Sprint 20 cerrado sin SpringContextIT ni integrations tests. 446 unit tests pasando ocultaron que la build no compilaría. Gate G-4b aprobado sin mvn compile real.

**Corrección:** REGLA PERMANENTE: SpringContextIT es BLOQUEANTE para Gate G-4b. Si no existe en el proyecto, el Developer Agent lo crea en el mismo step. mvn compile (no mvn test) debe ejecutarse via sofia-shell antes de declarar G-4b OK. Sin BUILD SUCCESS en consola el gate no se aprueba.

_Registrado: 2026-03-30T18:42:40.686Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-TEST-001 · backend

**Descripción:** ExportController usaba getAttribute("userId") pero JwtAuthenticationFilter escribe "authenticatedUserId". Discrepancia de nombre de atributo de request invisible en compilacion y en Code Review — causa HTTP 500 en produccion.

**Corrección:** REGLA PERMANENTE: al usar HttpServletRequest.getAttribute() para propagar claims JWT, el nombre del atributo debe verificarse contra el filtro que lo escribe en el mismo PR. Checklist G-5 añade: grep authenticatedUserId en controladores que extraigan userId del request.

_Registrado: 2026-03-31T07:54:00.000Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-TEST-002 · backend

**Descripción:** TransactionExportRepository filtraba t.type (CARGO|ABONO — direction financiera) cuando el ExportRequest.tipoMovimiento contiene valores de categoria de negocio (DOMICILIACION, PAGO_TARJETA, INGRESO...). Compilacion correcta, tests unitarios pasaban, fallo silencioso en runtime: filtro nunca coincide.

**Corrección:** REGLA PERMANENTE: distinguir siempre entre type (direccion financiera: CARGO/ABONO) y category (tipo negocio: DOMICILIACION/PAGO_TARJETA/INGRESO/COMISION/TRANSFERENCIA_*). Tests de integracion deben verificar que el filtro devuelve registros, no solo HTTP 200.

_Registrado: 2026-03-31T07:54:00.000Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-TEST-003 · backend

**Descripción:** Excepciones de dominio (ExportRangeException, ExportLimitExceededException) sin @ResponseStatus ni @ControllerAdvice mapeo → Spring devuelve HTTP 500 en lugar de 400/422. La suite de tests detecto que TC-014 (rango invertido) retornaba 500 en lugar de 400.

**Corrección:** REGLA PERMANENTE: toda excepcion de dominio custom debe tener @ResponseStatus o estar mapeada en un @ControllerAdvice. Developer Agent debe crear ExceptionHandler en el mismo step que crea las excepciones. Checklist G-4 añade: verificar que todas las RuntimeException del modulo tienen handler HTTP explicito.

_Registrado: 2026-03-31T07:54:00.000Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-TEST-004 · backend

**Descripción:** JdbcClient (Spring 6) no convierte java.time.Instant automaticamente para columnas TIMESTAMP without time zone de PostgreSQL. Pasar Instant directo en params() lanza DataAccessException en runtime — invisible en compilacion y en tests unitarios con mocks.

**Corrección:** REGLA PERMANENTE: para columnas TIMESTAMP (sin timezone) en PostgreSQL via JdbcClient, usar siempre Timestamp.from(instant) o LocalDateTime. Para columnas TIMESTAMPTZ usar OffsetDateTime. Developer Agent debe incluir este mapeo en el LLD y verificarlo en el IT smoke test antes de G-4b.

_Registrado: 2026-03-31T07:54:00.000Z_

**Aprobado por:** product-owner · 2026-04-09

---

## Sprint 21

### LA-FRONT-001 · frontend

**Descripción:** Módulos Angular implementados en features/ no registrados en app-routing.module.ts ni en el sidebar (shell.component.ts). El módulo existe y compila pero es inaccesible para el usuario.

**Corrección:** REGLA PERMANENTE: al crear cualquier módulo Angular en features/, el Developer Agent debe en el mismo step: (1) añadir la ruta lazy en app-routing.module.ts, (2) añadir el nav item en shell.component.ts. Checklist G-4 añade: verificar que todo módulo en features/ tiene ruta y nav item.

_Registrado: 2026-03-31T07:12:44.461Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-FRONT-002 · frontend

**Descripción:** Componente placeholder creado para resolver error de build (export.module.ts sin componente) pero quedó en producción con botones "Próximamente", ocultando funcionalidad backend ya implementada.

**Corrección:** REGLA PERMANENTE: antes de crear un componente placeholder, verificar si el backend tiene el endpoint implementado. Si existe, implementar el componente real directamente. Un placeholder nunca debe llegar a una imagen Docker de producción.

_Registrado: 2026-03-31T07:12:44.463Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-FRONT-003 · frontend

**Descripción:** Import path incorrecto en componente anidado: desde components/export-panel/ se usó ../services/ (1 nivel) cuando el servicio está en ../../services/ (2 niveles). Error invisible hasta docker build.

**Corrección:** REGLA PERMANENTE: al crear componentes en subdirectorios anidados (components/nombre/), calcular el path relativo desde la ubicación real del fichero. Verificar siempre: profundidad del componente vs profundidad del módulo al que pertenece el servicio.

_Registrado: 2026-03-31T07:12:44.463Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-FRONT-004 · frontend

**Descripción:** Backend ProfileController no implementado (FEAT-012 S14) pero el módulo Angular de perfil estaba registrado en el router. El componente cargaba, hacía forkJoin a /api/v1/profile, obtenía EMPTY y no renderizaba nada — sin error visible para el usuario.

**Corrección:** REGLA PERMANENTE: antes de registrar una ruta Angular, verificar que el endpoint backend correspondiente existe. Si no existe, registrar deuda técnica (DEBT-XXX) y mantener la ruta comentada hasta implementación. No exponer rutas con endpoints inexistentes.

_Registrado: 2026-03-31T07:12:44.463Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-FRONT-005 · frontend

**Descripción:** docker compose up sirve la imagen preconstruida — cambios en source code no se reflejan sin docker compose build. Confusión recurrente: el fichero en disco estaba correcto pero el contenedor seguía mostrando la versión anterior.

**Corrección:** REGLA PERMANENTE: cualquier cambio en frontend Angular requiere docker compose build frontend + docker compose up -d --no-deps frontend. Documentar este flujo en el runbook del proyecto. Añadir al checklist de G-4b.

_Registrado: 2026-03-31T07:12:44.463Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-021-01 · process

**Descripción:** FA-Agent actualizaba functionalities en Gate 2b pero NO el array business_rules. total_business_rules estaba hardcodeado y desincronizado del array real (141 declarado vs 129 real en S20). Detectado al verificar el estado del análisis funcional antes de Gate G-3.

**Corrección:** REGLA PERMANENTE: (1) En Gate 2b, añadir business_rules de la feature nueva junto a functionalities — nunca uno sin el otro. (2) total_business_rules = len(business_rules) — NUNCA hardcodeado. (3) validate-fa-index.js bloqueante en Gate 2b, 3b y 8b. Script creado: .sofia/scripts/validate-fa-index.js. FA-Agent SKILL.md bumped a v2.3.

_Registrado: 2026-03-31T16:22:28.742Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-021-02 · testing

**Descripción:** IntegrationTestBase no declaraba campos testUserId/testAccountId que DashboardJpaAdapterIT usaba, causando error de compilación de tests y bloqueando mvn test.

**Corrección:** REGLA: IntegrationTestBase debe declarar todos los fixtures UUID comunes usados por los tests hijos. Cualquier campo usado en múltiples ITs debe estar en la clase base, no en la hija.

_Registrado: 2026-03-31T19:55:32.761Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-021-03 · process

**Descripción:** Documentation Agent generó solo 10 DOCX en Sprint 21 vs los 12+ obligatorios. Faltaban: CMMI-Evidence, Meeting-Minutes, Project-Plan, Quality-Summary, Risk-Register, Traceability, planning-doc.

**Corrección:** REGLA PERMANENTE: Documentation Agent DEBE generar siempre los 17 documentos estándar (10 técnicos + 7 CMMI/Gestión). Los 7 adicionales son BLOQUEANTES para Gate G-8 desde Sprint 22. Actualizar SKILL.md doc-agent y checklist G-8.

_Registrado: 2026-04-01T05:57:48.784Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-STG-001 · frontend

**Descripción:** forkJoin en ProfilePageComponent bloqueado por catchError->EMPTY en endpoints 404. El componente quedaba en skeleton infinito porque EMPTY completa sin emitir y forkJoin requiere que todos los observables emitan.

**Corrección:** REGLA: catchError en observables usados en forkJoin DEBE retornar of(valorDefecto) nunca EMPTY. EMPTY en forkJoin = deadlock silencioso.

_Registrado: 2026-04-01T12:06:02.622Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-STG-002 · frontend

**Descripción:** LoginComponent tenia version/sprint hardcodeados Sprint 13 v1.13.0 — no se actualizaba en cada sprint. Detectado en verificacion STG v1.21.0.

**Corrección:** REGLA: version/sprint/envLabel SIEMPRE desde environment.ts. Campos obligatorios en ambos environment files. stg-pre-check.js detecta patron automaticamente en G-4/G-5.

_Registrado: 2026-04-01T12:26:12.393Z_

**Aprobado por:** product-owner · 2026-04-09

---

## Sprint 22

### LA-022-01 · security

**Descripción:** DEBT-040/041 vencieron su sprint_target (S21) sin cerrarse. CVSS >= 4.0 diferidos = riesgo real en produccion.

**Corrección:** REGLA PERMANENTE: GR-010 en guardrail-pre-gate.js bloquea Gate G-9 si open_debts tiene items con cvss >= 4.0 y sprint_target <= current_sprint. Sin excepcion.

_Registrado: 2026-04-02T09:45:57.730729+00:00_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-022-02 · process

**Descripción:** LESSONS_LEARNED.md tenia 0 lineas en disco. 38 LAs vivian solo en session.json — perdida total si el fichero se corrompe.

**Corrección:** REGLA PERMANENTE: Step 9 (Workflow Manager) regenera LESSONS_LEARNED.md desde session.json como paso obligatorio. workflow_directives.lessons_learned_mandatory=true en sofia-config.json.

_Registrado: 2026-04-02T09:45:57.730731+00:00_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-022-03 · process

**Descripción:** Performance Agent y Jenkins Agent tenian SKILL.md en disco desde S19/S20 pero no estaban en pipeline.active_steps. Agentes sin gate = agentes sin efecto real.

**Corrección:** REGLA PERMANENTE: todo agente con SKILL.md debe estar asociado a un step y gate. Agentes durmientes se formalizan o se archivan. sofia-config.pipeline_steps_total debe coincidir con active_steps.

_Registrado: 2026-04-02T09:46:44.873697+00:00_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-022-04 · security

**Descripción:** GR-010 evidencio que open_debts y security.open_debts estaban duplicados en session.json — mismos debts en dos arrays separados, causando deteccion doble en el guardrail.

**Corrección:** REGLA: usar solo session.open_debts como fuente unica de verdad. security.open_debts se mantiene como referencia pero GR-010 deduplica por id antes de evaluar.

_Registrado: 2026-04-02T09:46:44.873701+00:00_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-022-05 · dashboard

**Descripción:** Dashboard global no regenerado en los gates G-1, G-2 y HITL-PO-TL de Sprint 22 (2026-04-02). El fichero en disco seguía mostrando Sprint 21 / FEAT-019 mientras el pipeline ya estaba en Sprint 22 Step 3. Violacion de LA-020-07.

**Corrección:** REGLA PERMANENTE: GR-011 añadido a guardrail-pre-gate.js — verifica que dashboard_global.last_generated >= ultimo gate aprobado. Dashboard desactualizado = gate BLOQUEADO. Sin excepcion.

_Registrado: 2026-04-02T11:30:00.000Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-022-06 · dashboard

**Descripción:** gen-global-dashboard.js trataba gate_pending como objeto ({step,waiting_for}) cuando en session.json es un string ("G-5"). Resultado: GP.step=undefined y GP.waiting_for=undefined en el HTML generado. Segundo bug: args parser solo soportaba --gate G-5 (espacio) no --gate=G-5 (igual). | SEGUNDO BUG: GP.jira_issue=null (sin Jira issue asignado al gate) aparecia literalmente en 4 puntos del HTML sin fallback.

**Corrección:** REGLA PERMANENTE: (1) Normalizar gate_pending al leer session.json: si es string, convertir a {step, waiting_for, jira_issue} usando GATE_ROLES map. (2) parseArg() soporta ambas sintaxis --name=value y --name value. Sin excepcion. (2) Todos los usos de GP.jira_issue en plantillas HTML deben tener fallback: GP.jira_issue||GP.step. Sin excepcion — jira_issue es opcional.

_Registrado: 2026-04-02T19:22:29.097Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-022-07 · process

**Descripción:** Step 3b (Documentation Agent: publicar HLD en Confluence + validate-fa-index en gate 3b) no se ejecuto ni registro en Sprint 22. Los artefactos existian en disco y en Confluence (page 7405570) pero completed_steps no incluia 3b y sofia.log no tenia entrada para Step-3b S22.

**Corrección:** REGLA PERMANENTE: Step 3b es OBLIGATORIO inmediatamente despues de aprobacion G-3. El Workflow Manager debe verificar que 3b esta en completed_steps antes de pasar a Step 4. Si falta, ejecutar retroactivamente antes de continuar el pipeline. Gate G-3 no cierra hasta que 3b esta logueado.

_Registrado: 2026-04-02T19:27:35.063Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-022-08 · process

**Descripción:** Documentation Agent generó ficheros .md y los reportó como documentos Word/Excel reales. El directorio word/ contenía .md en lugar de .docx. El directorio excel/ estaba vacío. Detectado por Product Owner al revisar el directorio.

**Corrección:** REGLA PERMANENTE: Documentation Agent DEBE generar binarios reales: .docx con librería docx (npm) y .xlsx con librería xlsx. NUNCA reportar .md como equivalente a .docx. Verificación obligatoria: listar directorio con extensiones antes de reportar entrega. Archivos .md son borradores internos, no entregables al cliente.

_Registrado: 2026-04-02T19:47:21.481Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-022-09 · devops

**Descripción:** Seeds Flyway aplicados manualmente via psql durante verificación STG no quedan registrados en flyway_schema_history. Al reiniciar el stack, Flyway intenta aplicar la migración desde cero → 23505 duplicate key en el primer INSERT.

**Corrección:** REGLA PERMANENTE: los seeds de STG SIEMPRE deben aplicarse a través del stack completo (docker compose up) nunca via psql directo. Todos los INSERTs de migrations con IDs fijos deben usar ON CONFLICT (id) DO NOTHING para ser idempotentes. Flyway no es idempotente por defecto.

_Registrado: 2026-04-02T21:41:55.271Z_

**Aprobado por:** product-owner · 2026-04-09

---

## Sprint 23

### LA-023-01 · frontend

**Descripción:** En componentes Angular, usar [href] nativo en enlaces internos causa full page reload — el ShellComponent desaparece y la pantalla queda en blanco sin menú. Detectado en Mi Perfil inbox al pulsar Ver→ sobre notif.actionUrl. SEGUNDO HALLAZGO: actionUrl en seeds con rutas inexistentes (/bills /transfers) — navigateByUrl() silencia el error y no navega. Fix: ROUTE_MAP de aliases + fallback /dashboard + corrección de seeds en BD.

**Corrección:** REGLA PERMANENTE: nunca usar [href] para navegación interna en Angular. Usar siempre (click)+router.navigateByUrl() para URLs dinámicas con posibles query params, o [routerLink] para rutas estáticas. Checklist G-4 y G-5 añaden: grep -r "[href]" src/app/features/ — cualquier resultado con path interno es bloqueante. Adicionalmente: los seeds de notificaciones deben usar SOLO rutas registradas en app-routing.module.ts. Verificar con: SELECT DISTINCT action_url FROM user_notifications — cada valor debe existir en la tabla de rutas del router.

_Registrado: 2026-04-03T11:38:02.377Z_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-023-02 · ux-fidelity

**Descripción:** El Developer Agent implementó los componentes Angular de FEAT-021 sin contrastar sistemáticamente contra el prototipo aprobado en el gate HITL PO+TL. Las diferencias detectadas afectaron a shell (logo, colores sidebar), estructura de grid en la lista, comportamiento del stepper OTP, panel IRPF en detalle y los dos componentes de renovación y cancelación. Las correcciones se aplicaron manualmente en sesión antes de pasar a QA, consumiendo tiempo no planificado.

**Corrección:** REGLA PERMANENTE: el Developer Agent DEBE, al finalizar cada componente Angular, verificar explícitamente contra el prototipo aprobado antes de declarar step 4 completo. Checklist G-4: para cada componente nuevo verificar (1) estructura HTML fiel a la screen del prototipo, (2) clases CSS/tokens coinciden, (3) textos y etiquetas idénticos, (4) flujo de navegación coherente. El Code Reviewer (G-5) debe contrastar HTML renderizado contra el prototipo — no solo revisar código. Sin esta verificación el gate no se aprueba.

_Registrado: 2026-04-09T16:33:33.023Z_

**Aprobado por:** product-owner · 2026-04-09

---

## SOFIA-CORE

### LA-CORE-018 · governance

**Descripción:** El Orchestrator incorporo una LA directamente a los ficheros del framework sin presentarla previamente al PO para aprobacion. Las LAs son conocimiento canonico con impacto en todos los proyectos futuros. Persistencia sin validacion humana viola el principio HITL.

**Corrección:** REGLA PERMANENTE: HITL obligatorio antes de persistir cualquier LA. (1) Presentar LA propuesta al PO. (2) Esperar confirmacion explicita. (3) Solo tras confirmacion: persistir en los 4 ficheros canonicos. Sin aprobacion PO = LA no se escribe. Aplica a LAs de proyecto y de SOFIA-CORE.

_Registrado: 2026-04-06_

**Aprobado por:** product-owner · 2026-04-06

---

### LA-CORE-017 · analysis

**Descripción:** Al analizar metricas ORG (org-baseline multi-proyecto), SOFIA leyo el fichero local del proyecto (.sofia/org-baseline.json) en lugar del canonico en SOFIA_ORG_PATH. El local contenia projects_count=1 (solo BANK_PORTAL) mientras el canonico ya tenia 2 proyectos (BANK_PORTAL + EXPERIS_TRACKER). Resultado: gap declarado incorrectamente.

**Corrección:** REGLA PERMANENTE: para analisis ORG, SIEMPRE leer sofia-config.json.ma_baseline.sofia_org_path y cargar org-baseline.json desde esa ruta. El .sofia/org-baseline.json local es snapshot y NO es fuente canonica ORG. Verificar projects_count >= 2 antes de afirmar estado multi-proyecto.

_Registrado: 2026-04-06_

**Aprobado por:** product-owner · 2026-04-09

---

### LA-CORE-001 · process

**Descripción:** MCP config merge sin sobreescribir claude_desktop_config.json

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-002 · devops

**Descripción:** realpath() en paths MCP, nunca aliases macOS

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-003 · process

**Descripción:** SOFIA_REPO en CLAUDE.md + GR-CORE-003

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-004 · process

**Descripción:** repo-template estructura canónica docs/ en onboarding

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-005 · process

**Descripción:** verify-persistence.js BLOQUEANTE, GR-013

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-006 · process

**Descripción:** FA documento único incremental, LA-FA-INCR

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-007 · ux

**Descripción:** TOC clickable con w:hyperlink+w:anchor, LA-TOC-CLICK

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-008 · onboarding

**Descripción:** wizard v2.6.11 verifica scripts críticos + inicializa FA-Agent

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-009 · ux

**Descripción:** Prototipo incremental, GR-014

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-010 · process

**Descripción:** Patch First ante correcciones, GR-015

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-011 · ux

**Descripción:** Verificar matriz de roles antes de construir navegación

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-012 · infrastructure

**Descripción:** sofia-shell PROJECT_ROOT dinámico por llamada (v2.0)

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-013 · architecture

**Descripción:** Application handlers NO importan Infrastructure, GR-016

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-014 · infrastructure

**Descripción:** MCP SDK en SOFIA-CORE, no en proyectos cliente (setup-shell-mcp.js)

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-015 · infrastructure

**Descripción:** sofia-shell aislamiento: registrar SOFIA-CORE como entry especial en projects.json

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-016 · dashboard

**Descripción:** org-baseline.json invisible en command center: leer en runtime, no hardcodear

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-019 · governance

**Descripción:** COMPAT-001: clasificacion PATCH/MINOR/MAJOR obligatoria antes de aplicar cualquier cambio SOFIA-CORE

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-020 · governance

**Descripción:** COMPAT-002: session.json append-only; sin eliminacion ni cambio de tipo en campos existentes

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-021 · governance

**Descripción:** COMPAT-003: nuevos guardrails NO se activan en proyectos existentes sin upgrade explicito

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-022 · governance

**Descripción:** COMPAT-004: org-baseline.json con schema_version versionado; lector backward-compatible

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-023 · governance/takeover

**Descripción:** DTS obligatorio para toda documentacion cliente antes de T-3 FA Reverse; GR-CORE-023

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-024 · governance/takeover

**Descripción:** triangulacion obligatoria contra codigo para afirmaciones con DTS < 0.8; GR-CORE-024

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-025 · governance/takeover

**Descripción:** Gate GT-3 BLOQUEANTE hasta resolucion documentada de todos los flags DISCREPANCY; GR-CORE-025

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-026 · governance

**Descripción:** CONTEXT-ISOLATION: sesion SOFIA-CORE vs proyectos gobernados son contextos mutuamente excluyentes. GR-CORE-026

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-027 · takeover/planning

**Descripción:** T-5 reconcilia con T-4: items S1 postpuestos documentados explicitamente con justificacion antes de cerrar GT-5

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-028 · takeover/process

**Descripción:** NEEDS-VALIDATION de T-3 generan entradas estructuradas en session.json.needs_validation[] con sprint_target y assignee

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-029 · takeover/process

**Descripción:** BUILD_UNKNOWN en T-2 genera DEBT-TK automatico verify-build-day1 (0.5 SP, sprint S1, mandatory:true)

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-030 · takeover/process

**Descripción:** T-5 cierre Sprint 0 sigue checklist BLOQUEANTE: sprint_closed → log → dashboard. GR-CORE-027

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-031 · takeover/governance

**Descripción:** cmmi_l3_sprint_estimated calculado mecanicamente desde PA_scores de T-4; T-5 consume el valor, nunca lo recalcula independientemente

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-032 · takeover/governance

**Descripción:** open_debts incluye campo compliance:true para deudas legales/regulatorias (AEAT, GDPR, PCI-DSS); activa logica diferente en guardrails

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

### LA-CORE-033 · governance

**Descripción:** Al ejecutar la-sync.js (GR-CORE-029), el Orchestrator aplicó el sync solo en los proyectos de la sesión activa omitiendo proyectos registrados en MANIFEST.projects_registered no presentes en la sesión. La obligación del sync aplica a TODOS los proyectos registrados, no solo al proyecto de sesión corriente.

**Corrección:** REGLA PERMANENTE: cuando la-sync.js se ejecuta en contexto de distribución global (cierre de sprint o nueva LA promovida), el Orchestrator debe iterar TODOS los proyectos listados en MANIFEST.projects_registered y ejecutar el sync en cada uno. No es válido ejecutarlo solo en el proyecto activo. Checklist GR-CORE-029 añade: verificar la-sync-state.last_sync_at en TODOS los proyectos registrados antes de declarar la distribución completada.

_Registrado: 2026-04-07T12:10:00.000Z_

**Aprobado por:** product-owner · 2026-04-07

---

### LA-CORE-034 · governance

**Descripción:** CONTEXT-ISOLATION enforcement: en sesion SOFIA-CORE Continuar=framework; NUNCA leer session.json proyectos; contexto ambiguo=PREGUNTAR (refuerza GR-CORE-026)

**Corrección:** Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.

---

## Sprint 23 (addendum)

### LA-023-03 · infra/governance

**Descripcion:** Al corregir un MCP server en claude_desktop_config.json (ej. sofia-shell-experis sin SOFIA_REPO), la verificacion del fix se realizo en la misma conversacion activa donde se aplico el cambio. Los tools MCP se registran al iniciar la conversacion y no se actualizan en caliente. Resultado: el fix parecio no funcionar cuando en realidad era correcto — sofia-shell-experis seguia sin aparecer en la sesion pre-reinicio.

**Correccion:** REGLA PERMANENTE: toda modificacion de claude_desktop_config.json que añada, corrija o elimine un MCP server debe verificarse SIEMPRE en una conversacion nueva tras el reinicio de Claude Desktop. Nunca en la sesion activa donde se aplico el cambio. La ausencia del tool en la sesion activa no implica que el fix sea incorrecto.

_Registrado: 2026-04-09T17:23:29Z_

**Aprobado por:** product-owner · 2026-04-09

---

