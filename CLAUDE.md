# SOFIA v1.9 — Software Factory IA · Experis
## Proyecto: BankPortal · Cliente: Banco Meridian
## Skill Loader v1.9

---

## Inicialización automática (ejecutar en cada sesión)

```
1. Lee: .sofia/skills/orchestrator/SKILL.md
2. Lee: .sofia/session.json          ← estado del pipeline
3. Lee: .sofia/sofia-config.json     ← configuración del proyecto
4. Verifica estado: si current_sprint > 0 y status == "idle" → Sprint [N+1] listo para arrancar
```

---

## Pipeline estándar (11 steps)

| Step | Agente               | Skill path                              | Gate      |
|------|----------------------|-----------------------------------------|-----------|
| 1    | Scrum Master         | scrum-master/SKILL.md                   | HITL PO   |
| 2    | Requirements Analyst | requirements-analyst/SKILL.md           | HITL PO   |
| 3    | Architect            | architect/SKILL.md                      | HITL TL   |
| 3b   | Documentation Agent  | documentation-agent/SKILL.md            | AUTO      |
| 4    | Developer            | java-developer/SKILL.md + developer-core/SKILL.md | —  |
| 5    | Code Reviewer        | code-reviewer/SKILL.md                  | HITL TL   |
| 5b   | Security Agent       | security-agent/SKILL.md                 | AUTO*     |
| 6    | QA Tester            | qa-tester/SKILL.md                      | HITL QA   |
| 7    | DevOps               | devops/SKILL.md                         | HITL DV   |
| 8    | Documentation Agent  | documentation-agent/SKILL.md            | HITL PM   |
| 9    | Workflow Manager     | workflow-manager/SKILL.md               | —         |

*AUTO con gate BLOQUEANTE si CVE críticos > 0

---

## Agentes disponibles (19)

### Coordinación
- Orchestrator:           .sofia/skills/orchestrator/SKILL.md

### Planificación
- Scrum Master:           .sofia/skills/scrum-master/SKILL.md
- Requirements Analyst:   .sofia/skills/requirements-analyst/SKILL.md

### Diseño
- Architect:              .sofia/skills/architect/SKILL.md

### Desarrollo (stack + core)
- Developer Core:         .sofia/skills/developer-core/SKILL.md
- Java Developer:         .sofia/skills/java-developer/SKILL.md
- .Net Developer:         .sofia/skills/dotnet-developer/SKILL.md
- Node.js Developer:      .sofia/skills/nodejs-developer/SKILL.md
- Angular Developer:      .sofia/skills/angular-developer/SKILL.md
- React Developer:        .sofia/skills/react-developer/SKILL.md

### Revisión & Calidad
- Code Reviewer:          .sofia/skills/code-reviewer/SKILL.md
- QA Tester:              .sofia/skills/qa-tester/SKILL.md
- Security Agent:         .sofia/skills/security-agent/SKILL.md
- Performance Agent:      .sofia/skills/performance-agent/SKILL.md

### CI/CD
- DevOps:                 .sofia/skills/devops/SKILL.md
- Jenkins Agent:          .sofia/skills/jenkins-agent/SKILL.md

### Documentación & Entrega
- Documentation Agent:    .sofia/skills/documentation-agent/SKILL.md

### Gobierno & Integración
- Workflow Manager:       .sofia/skills/workflow-manager/SKILL.md
- Atlassian Agent:        .sofia/skills/atlassian-agent/SKILL.md

---

## Estado actual del proyecto

- Sprint 16 CERRADO · FEAT-014 · v1.16.0 · 377 SP acumulados
- 553 tests · 84% cobertura · 0 defectos en producción
- Deuda activa: DEBT-028 (CVSS 4.1 URGENTE S17) · DEBT-027/029 (S17) · DEBT-026 (S18)
- Sprint 17 listo para arrancar · FEAT-015 TBD · ~24 SP

---

## ⚠️ Persistence Protocol — OBLIGATORIO

Todo agente que genere artefactos DEBE:
1. Escribir artefactos a disco antes de cerrar su paso
2. Confirmar con bloque `✅ PERSISTIDO` listando cada archivo y ruta
3. El Orchestrator actualiza session.json y añade entrada a sofia.log

**El Orchestrator NO avanza al siguiente step sin bloque de confirmación.**

---

## Dashboard Global

```bash
node .sofia/scripts/gen-dashboard.js
open docs/quality/sofia-dashboard.html
```

---

## Verificación de instalación

```bash
bash .sofia/scripts/audit-persistence.sh
# Esperado: 19/19 OK · 🎉 SOFIA v1.9 — Persistence Protocol: COMPLETO
```

---

## Notas MCP

- filesystem MCP: acceso a /Users/cuadram/proyectos/bank-portal
- git MCP: operaciones git sobre el repositorio
- filesystem (minúscula) crea un nivel de directorio por llamada — el padre debe existir
- Node path: /opt/homebrew/opt/node@22/bin/node
- Python path: /usr/bin/python3

---

## Historial de versiones SOFIA en este proyecto

- v1.9 (2026-03-24): Security Agent Step 5b, Dashboard Global, CMMI evidence gates
- v1.8 (2026-03-19): Performance Agent, multi-proyecto (sofia-wizard + sofia-projects)
- v1.7 (2026-03-17): Documentation Agent Steps 3b+8, gates bloqueantes Jira
- v1.5 (2026-03-15): Persistence Protocol (session.json + sofia.log)
- v1.1 (2026-03-12): Documentation Agent inicial (Word + Excel + diagramas)
