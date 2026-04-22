# CMMI Level 3 — Matriz de Cobertura

**Proyecto:** BankPortal · **Cliente:** Banco Meridian
**SOFIA-CORE:** v2.6.66 · **Sprint vigente:** 26 (FEAT-024)
**Última auditoría:** 2026-04-22 · **Resultado:** 48/49 evidencias (98%) · **Veredicto:** APROBADO
**Mantenido por:** PPQA agent · regenerado en cada cierre de sprint (Step 9)

---

## 1. Resumen ejecutivo

CMMI Level 3 reconoce 16 áreas de proceso (PAs) clave organizadas en tres scopes. BankPortal evidencia las 16 mediante una combinación de artefactos del propio proyecto (9 PAs) y herencia documentada de SOFIA-CORE para las restantes (7 PAs).

| Scope | PAs | Cobertura | Localización evidencia |
|---|---|---|---|
| Proyecto | 9 | session.json + artefactos sprint | bank-portal repo |
| Organizacional | 4 | SOFIA-CORE | sofia-core repo + MANIFEST.json |
| Ingeniería | 3 | SOFIA-CORE skills + scripts | sofia-core repo |

---

## 2. Matriz Project Process Areas (9)

| PA | Nombre completo | Evidencia primaria | Ruta canónica |
|---|---|---|---|
| **REQM** | Requirements Management | SRS-FEAT-024-sprint26.md + RTM | docs/deliverables/sprint-26-FEAT-024/ |
| **PP** | Project Planning | SPRINT-026-planning.md + session.sprint_capacity_sp + session.sprint_goal | docs/sprints/ + .sofia/session.json |
| **PMC** | Project Monitoring & Control | dashboard regenerado por gate + sofia.log + gate_history | docs/dashboard/ + .sofia/sofia.log |
| **RSKM** | Risk Management | SRS sección 14 (6 riesgos R-S26-01..06 con mitigación) + planning sección 10 | SRS + planning |
| **VER** | Verification | Pipeline 15 steps con gates HITL + 12 LAs/GRs + smoke tests verificados | CLAUDE.md + .sofia/skills/ |
| **VAL** | Validation | 39 scenarios Gherkin en SRS + Step 2c UX prototype HITL PO+TL + KPIs post-release | SRS + Step 2c prototype |
| **CM** | Configuration Management | Branching model formal + tags + snapshots + GR-GIT-001 | git + .sofia/snapshots/ |
| **PPQA** | Process & Product Quality Assurance | 26 LAs proyecto + LA-CORE-064 promovida + sofia.log audit trail | .sofia/session.json + .sofia/sofia.log |
| **DAR** | Decision Analysis & Resolution | 3 ADRs (040/041/042) en SRS sección 12 + decisión alcance sprint trazada en planning | SRS + planning |

---

## 3. Matriz Organizational Process Areas (4) — heredadas de SOFIA-CORE

| PA | Nombre completo | Evidencia en SOFIA-CORE | Ruta canónica |
|---|---|---|---|
| **OPF** | Organizational Process Focus | Mecanismo de promoción de LAs proyecto a CORE (HITL-CORE-018) + ciclo trimestral revisión de skills | sofia-core/contributions/ + sofia-core/MANIFEST.json |
| **OPD** | Organizational Process Definition | MANIFEST.json (37 LAs CORE + 16 skills versionadas) + LESSONS_LEARNED_CORE.md como repositorio organizacional | sofia-core/MANIFEST.json + sofia-core/LESSONS_LEARNED_CORE.md |
| **OT** | Organizational Training | Skills versionadas (skill_version) + auto-loader skill en cada sesión SOFIA + CLAUDE.md como inducción reproducible | sofia-core/skills/ + bank-portal/CLAUDE.md |
| **IPM** | Integrated Project Management | Orchestrator agent gobierna pipeline 15 steps + integración Atlassian via MCP + dashboard global como vista integrada | sofia-core/skills/orchestrator/SKILL.md |

---

## 4. Matriz Engineering Process Areas (3) — heredadas de SOFIA-CORE

| PA | Nombre completo | Evidencia en SOFIA-CORE | Ruta canónica |
|---|---|---|---|
| **RD** | Requirements Development | requirements-analyst SKILL define proceso de elicitación, validación y especificación con criterios Gherkin obligatorios | sofia-core/skills/requirements-analyst/SKILL.md |
| **TS** | Technical Solution | architect SKILL define HLD/LLD/ADR; developer-{java,angular,...} SKILLs definen implementación hexagonal estándar | sofia-core/skills/architect/ + sofia-core/skills/{stack}-developer/ |
| **PI** | Product Integration | devops SKILL define pipeline CI/CD, smoke tests, release notes y runbooks; GR-SMOKE-001 valida contrato API pre-release | sofia-core/skills/devops/SKILL.md |

---

## 5. Trazabilidad por evidencia objetiva (auditoría 2026-04-22)

| Evidencia | Tamaño | Última modificación | PAs cubiertas |
|---|---|---|---|
| SRS-FEAT-024-sprint26.md | 26.0 KB | 2026-04-21 20:56 | REQM, RSKM, VAL, DAR |
| SPRINT-026-planning.md | 12.9 KB | 2026-04-21 19:04 | PP, RSKM |
| dashboard global HTML | 81.5 KB | 2026-04-21 20:56 | PMC |
| sofia.log | 85.2 KB | 2026-04-22 (append-only) | PMC, PPQA, VER |
| gate_history (session.json) | 12 entradas | continuo | PMC, PPQA |
| snapshots/step-1-sprint26.json | presente | 2026-04-21 19:04 | CM |
| Jira sprint 497 (SCRUM-163..173) | 11 issues | active | PP, REQM, PMC |
| Tag v1.25.0 en remoto | — | release anterior | CM |
| LA-CORE-064 + GR-SMOKE-001 | promovida | 2026-04-21 18:42 | PPQA, OPF |
| MANIFEST.json SOFIA-CORE | 37 CORE LAs | continuo | OPD, OPF, OT |

---

## 6. Hallazgos abiertos (auditoría 2026-04-22)

| ID | Severidad | Descripción | LA asociada | Estado |
|---|---|---|---|---|
| H-01 | Media | gate_history mezcla pendings con aprobados (ruido en PMC) | LA-026-01 | OPEN — corrección S26 |
| H-02 | Media | session.cmmi declaraba solo 9 PAs en lugar de 16 | LA-026-02 | CLOSED — esta matriz lo soluciona |
| H-03 | Baja | MCP shell stdio buffer ~16 KB causa timeout en payloads grandes | LA-026-03 | MITIGADA — patrón fragmentación aplicado |

---

## 7. Reglas de mantenimiento

1. **Regeneración:** esta matriz se regenera al cierre de cada sprint (Step 9 Workflow Manager) o cuando se modifique session.cmmi.
2. **Trazabilidad bidireccional:** cada PA del proyecto debe poder rastrearse hasta una evidencia persistida en disco; cada evidencia debe poder rastrearse hasta al menos una PA.
3. **Actualizaciones SOFIA-CORE:** cualquier cambio en MANIFEST.json o skills/ que afecte a las PAs heredadas (org/engineering) requiere actualizar las secciones 3 y 4 de esta matriz.
4. **Auditoría continua:** el script de auditoría CMMI (futuro DEBT) se ejecutará pre-G-9 y bloqueará el cierre del sprint si la cobertura cae por debajo del 95%.

---

## 8. Próximas mejoras planificadas

- **DEBT futuro (S27):** script .sofia/scripts/cmmi-audit.js que automatice la auditoría completa y regenere esta matriz
- **GR-CMMI-001 (LA-026-02):** session.cmmi debe declarar las 16 PAs canónicas L3 separadas por scope; bloquea cierre sprint en G-9
- **Promoción a SOFIA-CORE:** este documento como template para todos los proyectos SOFIA bajo CMMI L3

---

**Última actualización:** 2026-04-22 · **Próxima revisión:** cierre Sprint 26 (Step 9)
**Generado a partir de:** session.cmmi + auditoría manual + sofia.log
