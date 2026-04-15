# LESSONS LEARNED CORE — SOFIA Framework
# Conocimiento acumulado de todos los proyectos. Fuente canonica del framework.
# Generado: 2026-04-10 | SOFIA v2.7 | 99 LAs

> SOFIA v2.6.33 · Space SC establecido como repositorio Confluence canonico
> 49 LAs BankPortal (S19-S23) + 12 LAs ExperisTracker (S1-S3) + 36 LAs CORE = **97 total**
> Última actualización: 2026-04-09 — LA-CORE-017/018 promovidas desde BankPortal S23

---

## Índice por Sprint — BankPortal

- **Sprint 19** (14): LA-019-03..016
- **Sprint 20** (15): LA-020-01..11, LA-TEST-001..004
- **Sprint 21** (10): LA-FRONT-001..005, LA-021-01..03, LA-STG-001..002
- **Sprint 22** (9): LA-022-01..09
- **Sprint 23** (3): LA-023-01, LA-CORE-017↑, LA-CORE-018↑

## Índice SOFIA-CORE (34)

LA-CORE-001..016 · **LA-CORE-017 (org-baseline canónico)** · **LA-CORE-018 (HITL LA governance)** · LA-CORE-019..026 · LA-CORE-027..032 (SP0 TakeOverSintetico) · LA-CORE-033 (distribución sync) · LA-CORE-034 (context isolation enforcement)

---

[CONTENIDO ANTERIOR PRESERVADO — ver git history o MANIFEST.json para LAs 001..033]

---


### LA-CORE-017 · analysis

**Descripción:** Al analizar métricas ORG (org-baseline multi-proyecto), SOFIA leyó el fichero local del proyecto (.sofia/org-baseline.json) en lugar del canónico en SOFIA_ORG_PATH. El local contenía projects_count=1 (solo BANK_PORTAL) mientras el canónico ya tenía 2 proyectos (BANK_PORTAL + EXPERIS_TRACKER). Resultado: gap declarado incorrectamente.

**Corrección (REGLA PERMANENTE):** Para análisis ORG, SIEMPRE leer sofia-config.json.ma_baseline.sofia_org_path y cargar org-baseline.json desde esa ruta. El .sofia/org-baseline.json local es snapshot y NO es fuente canónica ORG. Verificar projects_count >= 2 antes de afirmar estado multi-proyecto.

**Impacto:** Todos los proyectos con org-baseline multi-proyecto

_Fuente: BankPortal Sprint 23 · Aprobado PO: Angel de la Cuadra · _

---

### LA-CORE-018 · governance

**Descripción:** El Orchestrator incorporó una LA directamente a los ficheros del framework sin presentarla previamente al PO para aprobación. Las LAs son conocimiento canónico con impacto en todos los proyectos futuros. Persistencia sin validación humana viola el principio HITL.

**Corrección (REGLA PERMANENTE):** HITL obligatorio antes de persistir cualquier LA: (1) Presentar la LA propuesta al PO. (2) Esperar confirmación explícita. (3) Solo tras confirmación: persistir en los 4 ficheros canónicos. Sin aprobación PO = LA no se escribe. Aplica a LAs de proyecto y de SOFIA-CORE.

**Impacto:** Todas las sesiones SOFIA

_Fuente: BankPortal Sprint 23 · Aprobado PO: Angel de la Cuadra · _

---

### LA-CORE-034 · governance

**Descripción:** En sesión SOFIA-CORE, el Orchestrator leyó session.json de BankPortal (proyecto gobernado) y presentó el Gate G-3 de Sprint 23 FEAT-021 como acción pendiente de la sesión activa. El usuario respondió "Continuar" refiriéndose al trabajo en SOFIA-CORE, pero el Orchestrator lo interpretó como continuación del pipeline del proyecto. Violación directa de GR-CORE-026 CONTEXT-ISOLATION.

**Corrección (REGLA PERMANENTE):** En sesión SOFIA-CORE: (1) "Continuar" o "continúa" sin contexto explícito de proyecto = continuar trabajo en el framework. (2) NUNCA leer session.json de proyectos gobernados para decidir qué hacer a continuación. (3) Si el usuario dice "continuar" y hay pipeline de proyecto pendiente, PREGUNTAR: "¿Continuar en SOFIA-CORE o en [proyecto]?" — no asumir. GR-CORE-026 es BLOQUEANTE: cualquier acción que requiera leer session.json de un proyecto gobernado en sesión SOFIA-CORE debe detenerse y preguntar primero.

**Impacto:** Todas las sesiones SOFIA-CORE

_Fuente: sesión SOFIA-CORE 2026-04-07 · Aprobado PO: Angel de la Cuadra · 2026-04-07_

---

### LA-CORE-035 · takeover/process

**Descripción:** T-3 FA Reverse Agent produce únicamente artefactos internos del pipeline (fa-index.json, T3-FA-DRAFT.md, T3-FA-GAPS.md). No genera ningún documento entregable orientado a equipo/negocio que explique qué hace el sistema recibido. Gap detectado en FacturaFlow Sprint 0.

**Corrección (REGLA PERMANENTE):** T-3 debe producir además `T3-FUNCTIONAL-DESCRIPTION.md` + `T3-FUNCTIONAL-DESCRIPTION.docx` como entregables explicativos del sistema heredado. Contenido mínimo: descripción de negocio, roles, módulos con estado operativo (✅/⚠/❌), ciclo de vida del dominio, catálogo de funcionalidades, reglas de negocio, preguntas abiertas priorizadas y riesgos funcionales activos. El .docx se deposita manualmente por el operador tras descarga (ver LA-CORE-036). Ruta canónica: `docs/functional-analysis/`.

**Impacto:** Todos los proyectos takeover con T-3 activo

_Fuente: FacturaFlow Sprint 0 · Aprobado PO: Angel de la Cuadra · 2026-04-10_

---

### LA-CORE-036 · infrastructure

**Descripción:** Los artefactos binarios (.docx, .pdf, imágenes) generados en el contenedor de Claude no pueden escribirse directamente en el SOFIA_REPO del usuario. `filesystem:write_file` solo admite texto plano. El intento de puente base64 es un antipatrón inaceptable en producción: introduce corrupción de datos, fragilidad y opacidad en el pipeline.

**Corrección (REGLA PERMANENTE):** Flujo canónico para binarios generados por el Orchestrator: (1) Generar binario en contenedor Claude. (2) `present_files` para exponer la descarga. (3) Operador descarga manualmente. (4) Operador deposita en la ruta SOFIA_REPO correcta. Documentar este paso explícito en el checklist de cierre de cualquier step que produzca binarios. Base64 como puente de escritura está PROHIBIDO.

**Impacto:** Todas las sesiones SOFIA con generación de binarios

_Fuente: FacturaFlow Sprint 0 · Aprobado PO: Angel de la Cuadra · 2026-04-10_

---

## Reglas Permanentes Activas (resumen actualizado)

| ID | Tipo | Regla |
|---|---|---|
| LA-CORE-026 | governance | GR-CORE-026: CONTEXT-ISOLATION — sesión SOFIA-CORE vs proyecto gobernado mutuamente excluyentes |
| LA-CORE-034 | governance | En sesión SOFIA-CORE, "Continuar" = framework. NUNCA leer session.json de proyectos. Contexto ambiguo = PREGUNTAR |
| **LA-CORE-035** | **takeover/process** | **T-3 debe producir T3-FUNCTIONAL-DESCRIPTION.md + .docx como entregables explicativos del sistema heredado, además de los artefactos internos del pipeline** |
| **LA-CORE-036** | **infrastructure** | **Binarios generados: flujo canónico = generate → present_files → operador descarga → operador deposita en SOFIA_REPO. Base64 es antipatrón prohibido** |

## LA-CORE-035 — Branching model SOFIA no aplicado desde inicio de proyecto
- **Fecha:** 2026-04-11
- **Tipo:** governance/git
- **Scope:** SOFIA-CORE
- **Guardrail generado:** GR-CORE-030
- **Problema:** Los tres proyectos gobernados (BankPortal, ExperisTracker, TakeOverSintetico) iniciaron sin un modelo de ramas git definido ni repositorios remotos configurados. BankPortal acumuló 11 ramas feature huérfanas nunca mergeadas a develop ni main; Sprint 23 se ejecutó sobre rama de Sprint 15 (feature/FEAT-013-sprint15). ExperisTracker trabajó directamente en main durante 3 sprints sin rama feature. TakeOverSintetico careció de git init durante toda la fase de Takeover Sprint 0. Resultado: main y develop desactualizados en todos los proyectos, trazabilidad remota nula.
- **Corrección / GR-CORE-030:** REGLA PERMANENTE — Gate 1 de cualquier proyecto SOFIA requiere como precondición bloqueante: (1) git init, (2) crear ramas main + develop, (3) configurar remote y hacer push inicial. Cada sprint crea rama feature/FEAT-XXX-sprintYY desde develop. Al cerrar sprint: merge --no-ff feature → develop → push. Al crear release: merge --no-ff develop → main + tag vX.Y.0 → push.
- **Proyectos afectados:** BankPortal (LA-023-04), ExperisTracker (LA-ET-001-21), TakeOverSintetico (LA-TO-001-01)
- **Aprobado por:** Product Owner | 2026-04-11

---

## LA-CORE-038 — Audit @Value sin default obligatorio antes de crear perfil IT

- **Fecha:** 2026-04-15
- **Tipo:** testing/configuration
- **Scope:** SOFIA-CORE
- **Problema:** Los perfiles de test IT (application-*-compose.yml, application-*-test.yml) se construyen sin auditar previamente todos los @Value sin default del codebase Spring Boot. Como el ApplicationContext inicializa beans en orden de dependencias y falla en el primero que encuentra, cada ejecucion de tests revela solo el siguiente error oculto — generando ciclos repetitivos de fix/rerun (hasta 12 en BankPortal Sprint 24) para propiedades como bank.core.api-key, session.deny-link.hmac-key, notification.email.from, etc.
- **Corrección (REGLA PERMANENTE):** Antes de crear cualquier perfil de test IT, ejecutar OBLIGATORIAMENTE: . Todas las propiedades resultantes sin default deben añadirse al YAML antes de la primera ejecucion. Adicionalmente, leer docker-compose.yml para puertos y credenciales reales de servicios externos (no asumir valores Spring por defecto).
- **Gate donde aplicar:** G-4 (Developer) — checklist obligatorio antes de declarar Step 4 completo.
- **Proyectos afectados:** BankPortal Sprint 24 (FEAT-022 Bizum, 12 fixes evitables)
- **Aprobado por:** Product Owner Angel de la Cuadra | 2026-04-15

---

## LA-CORE-039 — Fixtures idempotentes con UUIDs fijos para ITs con FK constraints

- **Fecha:** 2026-04-15
- **Tipo:** testing/design
- **Scope:** SOFIA-CORE
- **Problema:** Los ITs diseñados con Testcontainers (BD limpia por test) usan UUID.randomUUID() para entidades con FK a tablas maestras (users, accounts). Al migrar a Docker Compose con BD compartida y persistente, esos UUIDs no existen y todos los inserts fallan con ConstraintViolationException. Los tests son completamente no ejecutables.
- **Corrección (REGLA PERMANENTE):** Todo IT que inserte entidades con FK a tablas maestras debe: (1) Disponer de fixture SQL idempotente (ON CONFLICT DO NOTHING) con UUIDs fijos en src/test/resources/db/. (2) Cargar el fixture via @Sql(executionPhase = BEFORE_TEST_CLASS) en la clase base del IT. (3) Usar constantes (TEST_USER_ID, TEST_ACCOUNT_ID) en lugar de UUID.randomUUID() para satisfacer FKs. Patron de referencia: BizumIntegrationTestBase + db/bizum-test-fixtures.sql (BankPortal Sprint 24).
- **Gate donde aplicar:** G-4 (Developer) — checklist: los ITs con FKs usan fixtures idempotentes con UUIDs fijos.
- **Proyectos afectados:** BankPortal Sprint 24 (FEAT-022 Bizum)
- **Aprobado por:** Product Owner Angel de la Cuadra | 2026-04-15

---

## LA-CORE-040 — Bulk JPQL UPDATE requiere flush()+clear() antes de findById() en tests @Transactional

- **Fecha:** 2026-04-15
- **Tipo:** testing/jpa
- **Scope:** SOFIA-CORE
- **Problema:** En tests @Transactional, los bulk JPQL/SQL UPDATE y DELETE bypassan el Hibernate first-level cache. Un findById() posterior al bulk UPDATE devuelve el snapshot pre-update del cache en lugar del estado real de BD, produciendo falsos negativos en assertions.
- **Corrección (REGLA PERMANENTE):** En cualquier test que verifique el resultado de un bulk UPDATE/DELETE, seguir este patron: em.flush() [persiste entidades pendientes para que el bulk UPDATE las vea] → adapter.bulkUpdate() → em.clear() [invalida first-level cache, fuerza re-lectura de BD] → adapter.findById(id) [ahora lee estado real post-UPDATE]. Inyectar EntityManager directamente en la clase de test (@Autowired EntityManager em).
- **Gate donde aplicar:** G-4 (Developer) — checklist: los tests que verifican bulk UPDATEs hacen flush()+clear() antes de la lectura de verificacion.
- **Proyectos afectados:** BankPortal Sprint 24 (BizumExpireIT — expiresPendingRequestsPastDeadline)
- **Aprobado por:** Product Owner Angel de la Cuadra | 2026-04-15

---

## LA-CORE-041 — Developer Agent debe leer el prototipo ANTES de escribir cada componente Angular

- **Fecha:** 2026-04-15
- **Tipo:** process/frontend
- **Scope:** SOFIA-CORE
- **Problema:** El Developer Agent escribe componentes Angular "de memoria" sin leer el prototipo aprobado (Step 2c), generando una brecha sistemática entre el diseño aprobado y la implementación. La verificacion ocurre reactivamente cuando el PO detecta diferencias visuales, generando ciclos de corrección que duplican el tiempo de desarrollo del Step 4.
- **Corrección (REGLA PERMANENTE):** Para cada pantalla del prototipo aprobado (PROTO-FEAT-XXX-sprintYY.html), el Developer Agent DEBE: (1) Localizar el bloque HTML de esa pantalla en el prototipo. (2) Extraer el HTML exacto y adaptarlo a sintaxis Angular (reemplazar onclick por (click), class por [ngClass], valores estáticos por bindings). (3) Verificar que las clases CSS del template existen en el segundo bloque style del prototipo. Solo después puede hacer commit. La verificación es PREVIA al código, no posterior.
- **Gate donde aplicar:** G-4 (Developer) — checklist BLOQUEANTE: "¿Se ha leído el bloque HTML del prototipo para esta pantalla antes de escribir el template Angular?"
- **Proyectos afectados:** BankPortal Sprint 24 FEAT-022 Bizum — 15+ commits de corrección evitables
- **Aprobado por:** Product Owner Angel de la Cuadra | 2026-04-15

---

## LA-CORE-042 — Auditar modelos y servicios TypeScript antes de escribir templates Angular

- **Fecha:** 2026-04-15
- **Tipo:** process/frontend
- **Scope:** SOFIA-CORE
- **Problema:** El Developer Agent referencia propiedades y métodos en templates Angular (.html) sin verificar que existen en el modelo (.model.ts), el servicio (.service.ts) y el componente (.component.ts). Resultado: errores de compilación TS como "Property X does not exist on type Y" que bloquean el build y generan ciclos de fix/rerun. En BankPortal S24 se generaron 10 errores de compilación de este tipo (contactName, dailyUsedPct, getIncomingRequests, sendRequest, rejectRequest, acceptRequest, deactivate, dailyUsed, dailyAvailable).
- **Corrección (REGLA PERMANENTE):** Antes de escribir cualquier template Angular, leer OBLIGATORIAMENTE: (1) El modelo de dominio (*.model.ts) para conocer los campos disponibles. (2) El servicio (*.service.ts) para conocer los métodos disponibles. (3) El componente .ts para conocer las propiedades expuestas al template. Solo referenciar en el HTML lo que ya existe en el .ts. Si se necesita una propiedad nueva, añadirla primero al .ts, luego usarla en el .html.
- **Gate donde aplicar:** G-4 (Developer) — checklist BLOQUEANTE: "¿Se han leído model.ts, service.ts y component.ts antes de escribir el template?"
- **Proyectos afectados:** BankPortal Sprint 24 FEAT-022 Bizum — 10 errores TS en un solo build
- **Aprobado por:** Product Owner Angel de la Cuadra | 2026-04-15

---

## LA-CORE-043 — LA-023-02 (fidelidad prototipo) se aplica en G-4, no reactivamente tras despliegue

- **Fecha:** 2026-04-15
- **Tipo:** process/governance
- **Scope:** SOFIA-CORE
- **Problema:** LA-023-02 establece que el Developer Agent debe verificar cada componente Angular contra el prototipo aprobado en G-4 y G-5. En la práctica esta verificación no ocurre hasta que el PO visualiza la app desplegada y detecta diferencias. Este es exactamente el antipatrón que LA-023-02 intenta evitar: la verificación de fidelidad como gate de ENTRADA al Step 4, no como corrección reactiva tras el despliegue.
- **Corrección (REGLA PERMANENTE):** El checklist de G-4 debe incluir como ítems BLOQUEANTES (sin los cuales el Developer Agent no puede declarar el Step 4 completo): (1) Por cada pantalla del prototipo, existe un componente Angular equivalente. (2) El HTML del componente reproduce fielmente la estructura del prototipo. (3) Todas las clases CSS del template existen en styles.css extraídas del prototipo. (4) No hay pantallas del prototipo sin implementar. La declaración de G-4 completo SIN haber ejecutado este checklist es una violación de proceso equivalente a LA-CORE-018 (HITL obligatorio).
- **Gate donde aplicar:** G-4 (Developer) y G-5 (Code Review) — ambos como checklist BLOQUEANTE.
- **Proyectos afectados:** BankPortal Sprint 24 FEAT-022 Bizum — pantalla bizum-activate no existía, solicitudes recibidas ausentes, CSS sin clases del prototipo.
- **Aprobado por:** Product Owner Angel de la Cuadra | 2026-04-15

---

## LA-CORE-044 — DevOps Agent (Step 7) debe publicar Runbook MD en docs/runbooks/ como parte de su entrega

- **Fecha:** 2026-04-15
- **Tipo:** process/devops
- **Scope:** SOFIA-CORE
- **Problema:** El DevOps Agent genera el pipeline report y el smoke test script pero no genera el Runbook operacional en la ruta canónica docs/runbooks/RUNBOOK-backend-2fa-vX.Y.Z.md. El Runbook existe como DOCX en el Delivery Package del Step 8, pero el MD canónico es responsabilidad del Step 7. La cadena se rompió en BankPortal S24: S22 y S23 tienen su Runbook MD canónico, S24 no lo tenía hasta que el audit CMMI L3 del Step 8 lo detectó.
- **Corrección (REGLA PERMANENTE):** El checklist de G-7 (DevOps Agent) incluye como ítem BLOQUEANTE: publicar docs/runbooks/RUNBOOK-backend-2fa-vX.Y.Z.md antes de declarar el step completo. El Runbook MD debe contener: (1) arranque del stack, (2) variables de entorno de la feature nueva, (3) verificación Flyway, (4) smoke tests de los endpoints nuevos, (5) procedimiento de rollback. Sin este fichero en disco el Gate G-7 no se aprueba.
- **Gate donde aplicar:** G-7 (DevOps) — checklist BLOQUEANTE: "¿Existe docs/runbooks/RUNBOOK-backend-2fa-vX.Y.Z.md con contenido de la feature actual?"
- **Proyectos afectados:** BankPortal Sprint 24 — gap detectado en audit CMMI L3 Step 8
- **Aprobado por:** Product Owner Angel de la Cuadra | 2026-04-15

---

## LA-CORE-045 — Documentation Agent (Step 8) debe publicar Release Notes y Runbook MD en rutas canónicas del proyecto

- **Fecha:** 2026-04-15
- **Tipo:** process/documentation
- **Scope:** SOFIA-CORE
- **Problema:** El Documentation Agent genera los 17 DOCX y 3 XLSX correctamente en docs/deliverables/sprint-NN-FEAT-XXX/ pero no copia los artefactos MD fuente a sus rutas canónicas del proyecto: docs/releases/RELEASE-NOTES-vX.Y.Z.md y docs/runbooks/RUNBOOK-backend-2fa-vX.Y.Z.md. El audit CMMI L3 de la PA CM (Configuration Management) consulta estas rutas canónicas como evidencia. Sin ellos, CM falla aunque los DOCX existan.
- **Corrección (REGLA PERMANENTE):** El gen-docs-sprintNN.js debe incluir al final un paso de sincronización canónica: (1) copiar RELEASE-NOTES-vX.Y.Z.md a docs/releases/, (2) verificar que docs/runbooks/RUNBOOK-backend-2fa-vX.Y.Z.md existe (generado en Step 7) — si no existe, crearlo con contenido mínimo. El audit CMMI L3 debe ejecutarse al finalizar la generación para detectar gaps antes de reportar el step completo. Sin audit verde el Step 8 no se declara completo.
- **Gate donde aplicar:** G-8 (Documentation/PM) — checklist BLOQUEANTE: "¿Pasa el audit CMMI L3 de 9 PAs con 100%? ¿docs/releases/ y docs/runbooks/ tienen los artefactos MD del sprint?"
- **Proyectos afectados:** BankPortal Sprint 24 — 2 gaps CM detectados en audit Step 8
- **Aprobado por:** Product Owner Angel de la Cuadra | 2026-04-15
