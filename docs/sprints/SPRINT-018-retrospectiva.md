# SPRINT-018 — Retrospectiva

**BankPortal · Banco Meridian · Sprint 18 · Step 9**

| Campo | Valor |
|---|---|
| Sprint | 18 |
| Feature | FEAT-016 — Gestión de Tarjetas |
| Período | 2026-04-23 → 2026-05-07 |
| Fecha retro | 2026-03-25 |
| Facilitador | SOFIA Workflow Manager Agent |
| CMMI | PMC SP 1.3 · OPP SP 1.1 · CAR SP 1.1 |

---

## Resultado del sprint

✅ **24/24 SP entregados · 0 defectos · v1.18.0 en PRD · Gate-8 APROBADO**

---

## ¿Qué fue bien?

| # | Logro |
|---|---|
| 1 | **ADR-028 ShedLock** resolvió definitivamente R-015-01 (scheduler multi-instancia) — riesgo Nivel 3 abierto desde Sprint 15 |
| 2 | **PCI-DSS req.3/8/10** validados en scan automatizado — cero hallazgos |
| 3 | **4 items de deuda** (DEBT-026/030/V17c/ADR-028) cerrados en un único sprint — backlog técnico saneado |
| 4 | **101/101 tests QA PASS** — cobertura 86% — calidad sostenida sprint a sprint |
| 5 | **Code Review** efectivo: 5 findings resueltos antes de QA — cero regresiones |
| 6 | **OTP (2FA) reutilizado** sin modificación para bloqueo/PIN — arquitectura Clean Architecture demostrada |

---

## ¿Qué mejorar?

| # | Mejora |
|---|---|
| 1 | **Pipeline Step 9 no ejecutado automáticamente** — ver Lección Aprendida LA-018-01 |
| 2 | **Gate-8 quedó pendiente** entre sesiones sin evidencia de escalado — necesita mecanismo de recordatorio |
| 3 | **LLD frontend** no generado como .docx en Step 3b (solo HLD + LLD backend) — documentar criterio de cobertura documental |

---

## Lecciones aprendidas

### LA-018-01 — Sincronización Atlassian no ejecutada al cierre de sprint

| Campo | Detalle |
|---|---|
| **ID** | LA-018-01 |
| **Categoría** | Proceso · Gobernanza |
| **Severidad** | Alta — afecta trazabilidad CMMI y visibilidad del cliente |
| **Sprints afectados** | S16, S17, S18 |
| **CMMI** | PMC SP 1.2 · PP SP 2.4 · CAR SP 1.1 |

**Descripción del problema:**

En los sprints 16, 17 y 18 el Step 9 (Workflow Manager + Atlassian Agent) no se ejecutó en el mismo contexto de sesión que el resto del pipeline. Las sesiones se interrumpieron con Gate-8 pendiente. En sesiones posteriores se retomó el trabajo generando artefactos en disco pero sin ejecutar la sincronización con Jira y Confluence. El resultado fue:

- SCRUM-77 (Sprint 18) permanecía en estado "En curso" cuando el sprint estaba cerrado
- Páginas SRS/HLD para FEAT-014, FEAT-015 y FEAT-016 no existían en Confluence
- Índices de Arquitectura y Requisitos desactualizados desde Sprint 15

**Causa raíz (Análisis 5-Por Qué):**

1. ¿Por qué Jira/Confluence no se actualizó? → Step 9 no se ejecutó
2. ¿Por qué Step 9 no se ejecutó? → El pipeline estaba pausado en Gate-8 pendiente
3. ¿Por qué Gate-8 quedó pendiente entre sesiones? → No existía mecanismo de verificación de `session.json` al inicio de sesión
4. ¿Por qué no se verificó `session.json`? → El flujo de trabajo no tenía una regla explícita obligatoria de lectura de estado persistido antes de actuar
5. ¿Por qué no había esa regla? → El skill de Workflow Manager no incluía la instrucción de verificar estado al inicio de cada sesión de continuación

**Acciones correctoras:**

| Acción | Responsable | Sprint |
|---|---|---|
| AC-1: Añadir en CLAUDE.md regla explícita: "Al inicio de cualquier sesión leer `.sofia/session.json` antes de cualquier acción" | Workflow Manager / SOFIA | S19 |
| AC-2: El Step 9 debe verificar Atlassian antes de marcar sprint como cerrado — no solo generar informe en disco | Workflow Manager | S19 |
| AC-3: Gate pendiente entre sesiones debe dejar comentario visible en Jira issue con estado "PENDIENTE GATE-N" | Atlassian Agent | S19 |
| AC-4: Retrospectiva debe ser el último artefacto generado — no el informe de cierre | Workflow Manager | S19 |

**Impacto en CMMI Level 3:**

La brecha afectó PMC SP 1.2 (monitorizar compromisos) y PP SP 2.4 (mantener plan actualizado). Resuelta en esta sesión con sincronización completa de Jira + 6 páginas Confluence creadas.

---

### LA-018-02 — Deuda técnica de seguridad (CVSS) requiere sprint dedicado

| Campo | Detalle |
|---|---|
| **ID** | LA-018-02 |
| **Categoría** | Técnica · Seguridad |
| **Severidad** | Media |

**Descripción:** DEBT-028 (CVSS 4.1) se originó en S16 y se resolvió en S17. El ciclo fue de 1 sprint completo para una vulnerabilidad de severidad media. Para vulnerabilidades CVSS ≥ 7.0 el proceso actual no garantiza resolución en el mismo sprint.

**Acción correctora:** Definir política explícita: CVSS ≥ 7.0 → hotfix inmediato; CVSS 4.0–6.9 → sprint siguiente; CVSS < 4.0 → backlog priorizado.

---

## Métricas del sprint

| Métrica | Sprint 18 | Acumulado proyecto |
|---|---|---|
| SP entregados | 24/24 (100%) | 425 SP · 18 sprints |
| Velocidad | 24.0 SP | 23.6 SP/sprint media |
| Tests QA | 101/101 PASS | ~677 tests totales |
| Cobertura | 86% | +1% vs S17 |
| Defectos PRD | 0 | 0 acumulado histórico |
| CVEs críticos/altos | 0 | 0 histórico |
| Deuda cerrada | 4 items | — |
| Riesgos cerrados | 3 (R-015-01/R-018-01/02) | — |

---

## Acciones para Sprint 19

| Acción | Tipo | Prioridad |
|---|---|---|
| Implementar AC-1..AC-4 (LA-018-01) | Mejora de proceso | Alta |
| DEBT-031 — Rate limiting /cards/{id}/pin | Deuda técnica | Media |
| Definir FEAT-017 con Product Owner | Feature | Bloqueante Gate-1 |

---

*SOFIA Workflow Manager Agent — CMMI PMC SP 1.3 · OPP SP 1.1 · CAR SP 1.1*
*BankPortal — Banco Meridian — Sprint 18 — 2026-03-25*
