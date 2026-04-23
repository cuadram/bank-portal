# LA-SYNC Report — Sprint 26

| Campo | Valor |
|---|---|
| Timestamp | 2026-04-23T06:38:51.973Z |
| Proyecto | bank-portal |
| SOFIA-CORE versión | 2.6.68 |
| LAs CORE disponibles | 69 |
| LAs nuevas importadas | 12 |
| Skills actualizados | 0 |
| Modo | DELTA |

## LAs Importadas

### LA-CORE-058 · infrastructure/governance
- **Descripción:** repo-redundancy-via-github-not-onedrive: sistemas críticos SOFIA no pueden depender de OneDrive como única copia redunda
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-059 · process/tooling
- **Descripción:** dashboard-completed-steps-schema: gen-global-dashboard.js asume Array en session.completed_steps pero el schema real es 
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-060 · process/tooling
- **Descripción:** mcp-atlassian-sprint-lifecycle-gap: las herramientas MCP Atlassian (searchJiraIssues, transitionJiraIssue) no exponen en
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-061 · process/governance/git
- **Descripción:** working-tree-git-divergence-undetected: Orchestrator arrancó sesión completa sin detectar 842 ficheros borrados del work
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-062 · process/tooling - session-sprint-history-schema-drift: schema dict vs list en sprint_history incompatible entre proyectos - patron defensivo obligatorio
- **Descripción:** 
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-063 · process/tooling - session-json-falsy-and-schema-derivation: dos bugs defensivos (sprint=0 falsy + process_areas ausente) en consumidores de session.json - patron hermano de LA-CORE-062
- **Descripción:** 
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-064 · qa/devops/process
- **Descripción:** smoke-test-references-non-existent-endpoint: smoke test aprobado en G-7 con check contra PUT /api/v1/pfm/budgets/{id}/al
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-065 · process/governance/audit
- **Descripción:** gate-history-mixes-pending-and-approved: gate_history mezcla gates HITL aprobados con marcadores -pending del dashboard.
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-066 · process/governance/cmmi
- **Descripción:** cmmi-process-areas-incomplete-declaration: session.cmmi declaraba 9 PAs vs 16 canonicas L3. Schema obligatorio {project:
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-067 · tooling/mcp/recovery
- **Descripción:** mcp-shell-stdio-buffer-limit-large-payloads: MCP shell timeout en payloads >16KB como argumento. Patron: fs.appendFileSy
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-068 · frontend/angular - nunca usar [href] nativo para navegacion interna en Angular (causa full page reload + ShellComponent desaparece). Usar router.navigateByUrl() para URLs dinamicas o [routerLink] para estaticas. Seeds de notificaciones deben referenciar SOLO rutas registradas en app-routing.module.ts. Checklist G-4/G-5 bloqueante: grep -r '[href]' src/app/features/ (GR-ANGULAR-HREF-001).
- **Descripción:** 
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

### LA-CORE-070 · takeover/process - T-3 FA Reverse Agent debe producir T3-FUNCTIONAL-DESCRIPTION.md + T3-FUNCTIONAL-DESCRIPTION.docx como entregables explicativos del sistema heredado, ademas de los artefactos internos del pipeline (fa-index.json, fa-baseline, etc.). Sin estos entregables, el analisis funcional no queda accesible fuera del pipeline.
- **Descripción:** 
- **Compliance check:** UNKNOWN: Sin check automático para este tipo

---
_GR-CORE-029: este reporte es evidencia obligatoria de ejecución de la-sync en Step 1._
