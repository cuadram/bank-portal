# LESSONS LEARNED CORE — SOFIA Framework
# Conocimiento acumulado de todos los proyectos. Fuente canonica del framework.
# Generado: 2026-04-07 | SOFIA v2.6.33 | 95 LAs

> SOFIA v2.6.33 · Space SC establecido como repositorio Confluence canonico
> 49 LAs BankPortal (S19-S23) + 12 LAs ExperisTracker (S1-S3) + 34 LAs CORE = **95 total**
> Última actualización: 2026-04-07 — LA-CORE-034 aprobada PO

---

## Índice por Sprint — BankPortal

- **Sprint 19** (14): LA-019-03..016
- **Sprint 20** (15): LA-020-01..11, LA-TEST-001..004
- **Sprint 21** (10): LA-FRONT-001..005, LA-021-01..03, LA-STG-001..002
- **Sprint 22** (9): LA-022-01..09
- **Sprint 23** (1): LA-023-01

## Índice SOFIA-CORE (34)

LA-CORE-001..026 · LA-CORE-027..032 (SP0 TakeOverSintetico) · LA-CORE-033 (distribución sync) · **LA-CORE-034 (context isolation enforcement)**

---

[CONTENIDO ANTERIOR PRESERVADO — ver git history o MANIFEST.json para LAs 001..033]

---

### LA-CORE-034 · governance

**Descripción:** En sesión SOFIA-CORE, el Orchestrator leyó session.json de BankPortal (proyecto gobernado) y presentó el Gate G-3 de Sprint 23 FEAT-021 como acción pendiente de la sesión activa. El usuario respondió "Continuar" refiriéndose al trabajo en SOFIA-CORE, pero el Orchestrator lo interpretó como continuación del pipeline del proyecto. Violación directa de GR-CORE-026 CONTEXT-ISOLATION.

**Corrección (REGLA PERMANENTE):** En sesión SOFIA-CORE: (1) "Continuar" o "continúa" sin contexto explícito de proyecto = continuar trabajo en el framework. (2) NUNCA leer session.json de proyectos gobernados para decidir qué hacer a continuación. (3) Si el usuario dice "continuar" y hay pipeline de proyecto pendiente, PREGUNTAR: "¿Continuar en SOFIA-CORE o en [proyecto]?" — no asumir. GR-CORE-026 es BLOQUEANTE: cualquier acción que requiera leer session.json de un proyecto gobernado en sesión SOFIA-CORE debe detenerse y preguntar primero.

**Impacto:** Todas las sesiones SOFIA-CORE

_Fuente: sesión SOFIA-CORE 2026-04-07 · Aprobado PO: Angel de la Cuadra · 2026-04-07_

---

## Reglas Permanentes Activas (resumen actualizado)

| ID | Tipo | Regla |
|---|---|---|
| LA-CORE-026 | governance | GR-CORE-026: CONTEXT-ISOLATION — sesión SOFIA-CORE vs proyecto gobernado mutuamente excluyentes |
| **LA-CORE-034** | **governance** | **En sesión SOFIA-CORE, "Continuar" = framework. NUNCA leer session.json de proyectos. Contexto ambiguo = PREGUNTAR** |
