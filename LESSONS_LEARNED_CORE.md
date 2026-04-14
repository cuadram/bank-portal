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
