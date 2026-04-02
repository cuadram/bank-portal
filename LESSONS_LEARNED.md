# LESSONS LEARNED — BankPortal / SOFIA

> Generado automáticamente desde .sofia/session.json
> SOFIA v2.6 · Sprint 21 · 43 lecciones
> Última actualización: 2026-04-02

---

## Índice por Sprint

- **Sprint 19** (14): LA-019-03, LA-019-04, LA-019-05, LA-019-06, LA-019-07, LA-019-08, LA-019-09, LA-019-10, LA-019-11, LA-019-12, LA-019-13, LA-019-14, LA-019-15, LA-019-16
- **Sprint 20** (15): LA-020-01, LA-020-02, LA-020-03, LA-020-04, LA-020-05, LA-020-06, LA-020-07, LA-020-08, LA-020-09, LA-020-10, LA-020-11, LA-TEST-001, LA-TEST-002, LA-TEST-003, LA-TEST-004
- **Sprint 21** (10): LA-FRONT-001, LA-FRONT-002, LA-FRONT-003, LA-FRONT-004, LA-FRONT-005, LA-021-01, LA-021-02, LA-021-03, LA-STG-001, LA-STG-002
- **Sprint 22** (4): LA-022-01, LA-022-02, LA-022-03, LA-022-04

## Índice por Tipo

- **architecture** (2): LA-019-08, LA-020-03
- **backend** (5): LA-019-15, LA-TEST-001, LA-TEST-002, LA-TEST-003, LA-TEST-004
- **code-review** (1): LA-020-10
- **config** (1): LA-019-09
- **dashboard** (1): LA-020-07
- **data** (1): LA-019-12
- **database** (1): LA-019-13
- **devops** (2): LA-019-05, LA-020-04
- **frontend** (10): LA-019-10, LA-019-11, LA-019-14, LA-FRONT-001, LA-FRONT-002, LA-FRONT-003, LA-FRONT-004, LA-FRONT-005, LA-STG-001, LA-STG-002
- **process** (12): LA-019-03, LA-019-06, LA-019-16, LA-020-01, LA-020-05, LA-020-06, LA-020-08, LA-020-09, LA-021-01, LA-021-03, LA-022-02, LA-022-03
- **security** (3): LA-020-02, LA-022-01, LA-022-04
- **testing** (4): LA-019-04, LA-019-07, LA-020-11, LA-021-02

---

## Sprint 19

### LA-019-03 · process

**Descripción:** Gates G-6..G-9 auto-aprobados incorrectamente. Corrección: cada gate HITL requiere parada explícita individual.

**Corrección:** Desde Sprint 20: parada obligatoria en cada gate HITL con pregunta al rol definido.

_Registrado: 2026-03-27T14:06:00.285397Z_

---

### LA-019-04 · testing

**Descripción:** Tests unitarios no detectan conflictos de beans Spring — requieren @SpringBootTest completo

**Corrección:** G-4 requiere IT smoke test por feature nueva

---

### LA-019-05 · devops

**Descripción:** Build Angular sin --configuration=production no activa budget CSS ni environment.prod.ts

**Corrección:** CI y Dockerfile usan siempre ng build --configuration=production

---

### LA-019-06 · process

**Descripción:** Patrón DEBT-022 no verificable automáticamente en Code Review

**Corrección:** Script grep DEBT-022 obligatorio en G-5

---

### LA-019-07 · testing

**Descripción:** Smoke test desactualizado — no cubre endpoints del sprint corriente

**Corrección:** smoke-test actualizado obligatorio como artefacto de G-4

---

### LA-019-08 · architecture

**Descripción:** @Profile(!production) activa Mock en STG — BD real nunca consultada

**Corrección:** Mocks solo con @Profile(mock) o @Profile(test). @Primary en adaptador real.

---

### LA-019-09 · config

**Descripción:** environment.prod.ts desincronizado con environment.ts

**Corrección:** Validación automática de campos en CI

---

### LA-019-10 · frontend

**Descripción:** Módulos Angular nuevos no registrados en router

**Corrección:** Checklist G-4 incluye verificación de registro en app-routing.module.ts

---

### LA-019-11 · frontend

**Descripción:** Componentes de ruta usan @Input para params — nunca se populan

**Corrección:** Usar siempre ActivatedRoute.paramMap en componentes de ruta

---

### LA-019-12 · data

**Descripción:** UUIDs inválidos en seeds SQL (caracteres no hex)

**Corrección:** Validar UUIDs con regex antes de ejecutar seeds

---

### LA-019-13 · database

**Descripción:** timestamp without time zone vs Instant Java — incompatibilidad de tipos

**Corrección:** LLD incluye mapa de tipos BD→Java. Usar LocalDateTime para columnas sin timezone.

---

### LA-019-14 · frontend

**Descripción:** OnPush + paramMap no dispara CD al cambiar cuenta

**Corrección:** OnPush solo cuando se garantiza inmutabilidad y markForCheck() en todos los observables

---

### LA-019-15 · backend

**Descripción:** Named params JdbcClient contaminados por concatenación de text blocks

**Corrección:** SQL dinámico siempre usa parámetros posicionales (?)

---

### LA-019-16 · process

**Descripción:** QA no declara si prueba contra Mock o BD real

**Corrección:** Informe QA obliga campo: Repositorio activo: MOCK|JPA-REAL

---

## Sprint 20

### LA-020-01 · process

**Descripción:** Jira debe actualizarse en cada step del pipeline sin instruccion explicita

**Corrección:** Regla permanente: transicion automatica en cada gate

---

### LA-020-02 · security

**Descripción:** Hallazgos CVSS >= 4.0 deben resolverse en el mismo sprint donde se detectan

**Corrección:** No diferir si CVSS >= 4.0

---

### LA-020-03 · architecture

**Descripción:** Audit log con datos derivados crea inconsistencia — enriquecer en momento de escritura

**Corrección:** DEBT-036: inyectar AccountRepository en ExportAuditService

---

### LA-020-04 · devops

**Descripción:** Workflow Jira debe configurarse con todos los estados SOFIA antes del primer sprint

**Corrección:** Checklist onboarding incluye configuracion workflow

---

### LA-020-05 · process

**Descripción:** Documentation Agent (10 DOCX + 3 XLSX + dashboard) no ejecutado en Step 8 — error detectado post-cierre

**Corrección:** Desde Sprint 21: Documentation Agent es BLOQUEANTE para Gate G-9. No se cierra sprint sin estos artefactos.

---

### LA-020-06 · process

**Descripción:** sprint-NN-planning-doc.docx es obligatorio en word/ de cada sprint — faltaba S18, S19, S20

**Corrección:** Checklist deliverables: planning-doc.docx bloqueante para Gate G-8 desde Sprint 21

---

### LA-020-07 · dashboard

**Descripción:** Dashboard no se regeneraba en cada aprobacion de gate, solo al cerrar sprint

**Corrección:** gate-dashboard-hook.js invocado en cada gate. dashboard_on_every_gate:true en sofia-config.json

---

### LA-020-08 · process

**Descripción:** gen-fa-document.py no se invocaba automaticamente en Step 8b — FA-BankPortal-Banco-Meridian.docx no se actualizaba en S19 ni S20. Script solo cubria hasta FEAT-016.

**Corrección:** gen-fa-document.py debe ejecutarse en Step 8b de cada sprint. Anadir llamada al gate-dashboard-hook como paso obligatorio. Script actualizado con FEAT-017 y FEAT-018.

---

### LA-020-09 · process

**Descripción:** Developer Agent generó ficheros bajo paquete incorrecto (es.meridian) inferido de documentación, sin verificar paquete raíz real del proyecto.

**Corrección:** REGLA PERMANENTE: antes de crear cualquier fichero Java en un sprint, el Developer Agent DEBE ejecutar: (1) cat BankPortalApplication.java | head -1 para obtener el package raíz real, (2) ls src/main/java/ para confirmar estructura. Sin esta verificación el fichero no se escribe.

_Registrado: 2026-03-30T18:42:40.685Z_

---

### LA-020-10 · code-review

**Descripción:** Code Reviewer validó consistencia interna entre ficheros nuevos pero no contra el codebase real. Marcó paquete incorrecto como correcto porque era uniforme entre los nuevos ficheros.

**Corrección:** REGLA PERMANENTE: el Code Reviewer DEBE ejecutar grep del package raíz contra los nuevos ficheros y contrastar con el package del proyecto. Checklist G-5 añade: grep -r "^package" src/main/java/com/ | head -1 vs package de cada fichero nuevo. Discrepancia = bloqueante.

_Registrado: 2026-03-30T18:42:40.686Z_

---

### LA-020-11 · testing

**Descripción:** Sprint 20 cerrado sin SpringContextIT ni integrations tests. 446 unit tests pasando ocultaron que la build no compilaría. Gate G-4b aprobado sin mvn compile real.

**Corrección:** REGLA PERMANENTE: SpringContextIT es BLOQUEANTE para Gate G-4b. Si no existe en el proyecto, el Developer Agent lo crea en el mismo step. mvn compile (no mvn test) debe ejecutarse via sofia-shell antes de declarar G-4b OK. Sin BUILD SUCCESS en consola el gate no se aprueba.

_Registrado: 2026-03-30T18:42:40.686Z_

---

### LA-TEST-001 · backend

**Descripción:** ExportController usaba getAttribute("userId") pero JwtAuthenticationFilter escribe "authenticatedUserId". Discrepancia de nombre de atributo de request invisible en compilacion y en Code Review — causa HTTP 500 en produccion.

**Corrección:** REGLA PERMANENTE: al usar HttpServletRequest.getAttribute() para propagar claims JWT, el nombre del atributo debe verificarse contra el filtro que lo escribe en el mismo PR. Checklist G-5 añade: grep authenticatedUserId en controladores que extraigan userId del request.

_Registrado: 2026-03-31T07:54:00.000Z_

---

### LA-TEST-002 · backend

**Descripción:** TransactionExportRepository filtraba t.type (CARGO|ABONO — direction financiera) cuando el ExportRequest.tipoMovimiento contiene valores de categoria de negocio (DOMICILIACION, PAGO_TARJETA, INGRESO...). Compilacion correcta, tests unitarios pasaban, fallo silencioso en runtime: filtro nunca coincide.

**Corrección:** REGLA PERMANENTE: distinguir siempre entre type (direccion financiera: CARGO/ABONO) y category (tipo negocio: DOMICILIACION/PAGO_TARJETA/INGRESO/COMISION/TRANSFERENCIA_*). Tests de integracion deben verificar que el filtro devuelve registros, no solo HTTP 200.

_Registrado: 2026-03-31T07:54:00.000Z_

---

### LA-TEST-003 · backend

**Descripción:** Excepciones de dominio (ExportRangeException, ExportLimitExceededException) sin @ResponseStatus ni @ControllerAdvice mapeo → Spring devuelve HTTP 500 en lugar de 400/422. La suite de tests detecto que TC-014 (rango invertido) retornaba 500 en lugar de 400.

**Corrección:** REGLA PERMANENTE: toda excepcion de dominio custom debe tener @ResponseStatus o estar mapeada en un @ControllerAdvice. Developer Agent debe crear ExceptionHandler en el mismo step que crea las excepciones. Checklist G-4 añade: verificar que todas las RuntimeException del modulo tienen handler HTTP explicito.

_Registrado: 2026-03-31T07:54:00.000Z_

---

### LA-TEST-004 · backend

**Descripción:** JdbcClient (Spring 6) no convierte java.time.Instant automaticamente para columnas TIMESTAMP without time zone de PostgreSQL. Pasar Instant directo en params() lanza DataAccessException en runtime — invisible en compilacion y en tests unitarios con mocks.

**Corrección:** REGLA PERMANENTE: para columnas TIMESTAMP (sin timezone) en PostgreSQL via JdbcClient, usar siempre Timestamp.from(instant) o LocalDateTime. Para columnas TIMESTAMPTZ usar OffsetDateTime. Developer Agent debe incluir este mapeo en el LLD y verificarlo en el IT smoke test antes de G-4b.

_Registrado: 2026-03-31T07:54:00.000Z_

---

## Sprint 21

### LA-FRONT-001 · frontend

**Descripción:** Módulos Angular implementados en features/ no registrados en app-routing.module.ts ni en el sidebar (shell.component.ts). El módulo existe y compila pero es inaccesible para el usuario.

**Corrección:** REGLA PERMANENTE: al crear cualquier módulo Angular en features/, el Developer Agent debe en el mismo step: (1) añadir la ruta lazy en app-routing.module.ts, (2) añadir el nav item en shell.component.ts. Checklist G-4 añade: verificar que todo módulo en features/ tiene ruta y nav item.

_Registrado: 2026-03-31T07:12:44.461Z_

---

### LA-FRONT-002 · frontend

**Descripción:** Componente placeholder creado para resolver error de build (export.module.ts sin componente) pero quedó en producción con botones "Próximamente", ocultando funcionalidad backend ya implementada.

**Corrección:** REGLA PERMANENTE: antes de crear un componente placeholder, verificar si el backend tiene el endpoint implementado. Si existe, implementar el componente real directamente. Un placeholder nunca debe llegar a una imagen Docker de producción.

_Registrado: 2026-03-31T07:12:44.463Z_

---

### LA-FRONT-003 · frontend

**Descripción:** Import path incorrecto en componente anidado: desde components/export-panel/ se usó ../services/ (1 nivel) cuando el servicio está en ../../services/ (2 niveles). Error invisible hasta docker build.

**Corrección:** REGLA PERMANENTE: al crear componentes en subdirectorios anidados (components/nombre/), calcular el path relativo desde la ubicación real del fichero. Verificar siempre: profundidad del componente vs profundidad del módulo al que pertenece el servicio.

_Registrado: 2026-03-31T07:12:44.463Z_

---

### LA-FRONT-004 · frontend

**Descripción:** Backend ProfileController no implementado (FEAT-012 S14) pero el módulo Angular de perfil estaba registrado en el router. El componente cargaba, hacía forkJoin a /api/v1/profile, obtenía EMPTY y no renderizaba nada — sin error visible para el usuario.

**Corrección:** REGLA PERMANENTE: antes de registrar una ruta Angular, verificar que el endpoint backend correspondiente existe. Si no existe, registrar deuda técnica (DEBT-XXX) y mantener la ruta comentada hasta implementación. No exponer rutas con endpoints inexistentes.

_Registrado: 2026-03-31T07:12:44.463Z_

---

### LA-FRONT-005 · frontend

**Descripción:** docker compose up sirve la imagen preconstruida — cambios en source code no se reflejan sin docker compose build. Confusión recurrente: el fichero en disco estaba correcto pero el contenedor seguía mostrando la versión anterior.

**Corrección:** REGLA PERMANENTE: cualquier cambio en frontend Angular requiere docker compose build frontend + docker compose up -d --no-deps frontend. Documentar este flujo en el runbook del proyecto. Añadir al checklist de G-4b.

_Registrado: 2026-03-31T07:12:44.463Z_

---

### LA-021-01 · process

**Descripción:** FA-Agent actualizaba functionalities en Gate 2b pero NO el array business_rules. total_business_rules estaba hardcodeado y desincronizado del array real (141 declarado vs 129 real en S20). Detectado al verificar el estado del análisis funcional antes de Gate G-3.

**Corrección:** REGLA PERMANENTE: (1) En Gate 2b, añadir business_rules de la feature nueva junto a functionalities — nunca uno sin el otro. (2) total_business_rules = len(business_rules) — NUNCA hardcodeado. (3) validate-fa-index.js bloqueante en Gate 2b, 3b y 8b. Script creado: .sofia/scripts/validate-fa-index.js. FA-Agent SKILL.md bumped a v2.3.

_Registrado: 2026-03-31T16:22:28.742Z_

---

### LA-021-02 · testing

**Descripción:** IntegrationTestBase no declaraba campos testUserId/testAccountId que DashboardJpaAdapterIT usaba, causando error de compilación de tests y bloqueando mvn test.

**Corrección:** REGLA: IntegrationTestBase debe declarar todos los fixtures UUID comunes usados por los tests hijos. Cualquier campo usado en múltiples ITs debe estar en la clase base, no en la hija.

_Registrado: 2026-03-31T19:55:32.761Z_

---

### LA-021-03 · process

**Descripción:** Documentation Agent generó solo 10 DOCX en Sprint 21 vs los 12+ obligatorios. Faltaban: CMMI-Evidence, Meeting-Minutes, Project-Plan, Quality-Summary, Risk-Register, Traceability, planning-doc.

**Corrección:** REGLA PERMANENTE: Documentation Agent DEBE generar siempre los 17 documentos estándar (10 técnicos + 7 CMMI/Gestión). Los 7 adicionales son BLOQUEANTES para Gate G-8 desde Sprint 22. Actualizar SKILL.md doc-agent y checklist G-8.

_Registrado: 2026-04-01T05:57:48.784Z_

---

### LA-STG-001 · frontend

**Descripción:** forkJoin en ProfilePageComponent bloqueado por catchError->EMPTY en endpoints 404. El componente quedaba en skeleton infinito porque EMPTY completa sin emitir y forkJoin requiere que todos los observables emitan.

**Corrección:** REGLA: catchError en observables usados en forkJoin DEBE retornar of(valorDefecto) nunca EMPTY. EMPTY en forkJoin = deadlock silencioso.

_Registrado: 2026-04-01T12:06:02.622Z_

---

### LA-STG-002 · frontend

**Descripción:** LoginComponent tenia version/sprint hardcodeados Sprint 13 v1.13.0 — no se actualizaba en cada sprint. Detectado en verificacion STG v1.21.0.

**Corrección:** REGLA: version/sprint/envLabel SIEMPRE desde environment.ts. Campos obligatorios en ambos environment files. stg-pre-check.js detecta patron automaticamente en G-4/G-5.

_Registrado: 2026-04-01T12:26:12.393Z_

**Commit:** bc367a8

---

## Sprint 22

### LA-022-01 · security

**Descripción:** DEBT-040/041 vencieron su sprint_target (S21) sin cerrarse. CVSS >= 4.0 diferidos = riesgo real en produccion.

**Corrección:** REGLA PERMANENTE: GR-010 en guardrail-pre-gate.js bloquea Gate G-9 si open_debts tiene items con cvss >= 4.0 y sprint_target <= current_sprint. Sin excepcion.

_Registrado: 2026-04-02T09:45:57.730729+00:00_

---

### LA-022-02 · process

**Descripción:** LESSONS_LEARNED.md tenia 0 lineas en disco. 38 LAs vivian solo en session.json — perdida total si el fichero se corrompe.

**Corrección:** REGLA PERMANENTE: Step 9 (Workflow Manager) regenera LESSONS_LEARNED.md desde session.json como paso obligatorio. workflow_directives.lessons_learned_mandatory=true en sofia-config.json.

_Registrado: 2026-04-02T09:45:57.730731+00:00_

---

### LA-022-03 · process

**Descripción:** Performance Agent y Jenkins Agent tenian SKILL.md en disco desde S19/S20 pero no estaban en pipeline.active_steps. Agentes sin gate = agentes sin efecto real.

**Corrección:** REGLA PERMANENTE: todo agente con SKILL.md debe estar asociado a un step y gate. Agentes durmientes se formalizan o se archivan. sofia-config.pipeline_steps_total debe coincidir con active_steps.

_Registrado: 2026-04-02T09:46:44.873697+00:00_

---

### LA-022-04 · security

**Descripción:** GR-010 evidencio que open_debts y security.open_debts estaban duplicados en session.json — mismos debts en dos arrays separados, causando deteccion doble en el guardrail.

**Corrección:** REGLA: usar solo session.open_debts como fuente unica de verdad. security.open_debts se mantiene como referencia pero GR-010 deduplica por id antes de evaluar.

_Registrado: 2026-04-02T09:46:44.873701+00:00_

---

