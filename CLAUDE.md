# SOFIA v2.3 — Software Factory IA · Experis

## REGLA CRÍTICA DE SESIÓN — LA-018-01

Al inicio de CUALQUIER sesión de continuación de pipeline:
1. Leer `.sofia/session.json` antes de cualquier acción
2. Si `gate_pending != null` → solicitar aprobación del gate pendiente antes de avanzar
3. El sprint NO está cerrado hasta que Step 9 aparezca en `completed_steps` con status COMPLETED Y Atlassian esté sincronizado
4. Nunca asumir que el pipeline se completó basándose solo en artefactos en disco

## REGLA CRÍTICA — DASHBOARD GLOBAL (v2.1)

El Dashboard Global `docs/dashboard/bankportal-global-dashboard.html` es un **entregable oficial del proyecto**.

**Cuándo regenerar — OBLIGATORIO:**
- En CADA aprobación de Gate (G-1 a G-9), ejecutar inmediatamente después:
  ```
  /opt/homebrew/opt/node@22/bin/node .sofia/scripts/gen-global-dashboard.js --gate G-[N] --step [N]
  ```
- El script actualiza el HTML + `session.json.dashboard_global` + `sofia.log`
- Un Gate NO está completamente procesado hasta que el Dashboard Global está actualizado en disco
- Si el script no está disponible: regenerar manualmente desde Claude Desktop y persistir en disco

**Verificación en cada gate:** `session.json.dashboard_global.last_generated` debe actualizarse.

## Proyecto: BankPortal · Cliente: Banco Meridian
## Skill Loader v2.3

---

## Inicialización automática (ejecutar en cada sesión)

```
1. Lee: .sofia/skills/orchestrator/SKILL.md
2. Lee: .sofia/session.json          ← estado del pipeline
3. Lee: .sofia/sofia-config.json     ← configuración del proyecto
4. Verifica estado: si current_sprint > 0 y status == "idle" → Sprint [N+1] listo para arrancar
5. Verifica session.json.dashboard_global.last_generated ← dashboard debe estar actualizado
```

---

## Pipeline estándar v2.3 (15 steps)

| Step | Agente               | Skill path                                          | Gate      |
|------|----------------------|-----------------------------------------------------|-----------|
| 1    | Scrum Master         | scrum-master/SKILL.md                               | HITL PO   |
| 2    | Requirements Analyst | requirements-analyst/SKILL.md                       | HITL PO   |
| **2b** | **FA-Agent**       | **fa-agent/SKILL.md**                               | **AUTO**  |
| **2c** | **UX/UI Designer** | **ux-ui-designer/SKILL.md**                         | **HITL PO+TL** |
| 3    | Architect            | architect/SKILL.md                                  | HITL TL   |
| 3b   | Documentation Agent + FA-Agent | documentation-agent/SKILL.md + fa-agent/SKILL.md | AUTO |
| 4    | Developer            | java-developer/SKILL.md + developer-core/SKILL.md   | — |
| 5    | Code Reviewer        | code-reviewer/SKILL.md                              | HITL TL   |
| 5b   | Security Agent       | security-agent/SKILL.md                             | AUTO*     |
| 6    | QA Tester            | qa-tester/SKILL.md                                  | HITL QA   |
| 7    | DevOps               | devops/SKILL.md                                     | HITL DV   |
| 8    | Documentation Agent  | documentation-agent/SKILL.md                        | HITL PM   |
| **8b** | **FA-Agent**       | **fa-agent/SKILL.md**                               | **AUTO**  |
| 9    | Workflow Manager     | workflow-manager/SKILL.md                           | —         |

*AUTO con gate BLOQUEANTE si CVE críticos > 0

**Step 2c — UX/UI Designer:**
- Inputs: SRS (Step 2) + FA (Step 2b)
- Outputs: `docs/ux-ui/UX-FEAT-XXX-sprintYY.md` + actualización `UX-DESIGN-SYSTEM.md`
- Entregables: user flows, wireframes ASCII, inventario componentes, design tokens, WCAG checklist
- Gate HITL PO+TL: Product Owner valida UX, Tech Lead valida viabilidad técnica

---

## Agentes disponibles (21)

### Coordinación
- Orchestrator:           .sofia/skills/orchestrator/SKILL.md

### Planificación
- Scrum Master:           .sofia/skills/scrum-master/SKILL.md
- Requirements Analyst:   .sofia/skills/requirements-analyst/SKILL.md

### Análisis Funcional ← v2.0
- **FA-Agent:**           **.sofia/skills/fa-agent/SKILL.md**

### Diseño ← NUEVO v2.3
- **UX/UI Designer:**     **.sofia/skills/ux-ui-designer/SKILL.md**

### Arquitectura
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

- Sprint 19 CERRADO · FEAT-017 · v1.19.0 · 449 SP acumulados
- 708 tests · 87% cobertura · 0 defectos en producción
- FA-Agent activo · 58 funcionalidades documentadas · 113 reglas de negocio · S1-S19
- Sprint 20 pendiente definición PO · FEAT-018 por determinar
- Dashboard Global activo: docs/dashboard/bankportal-global-dashboard.html
- **UX/UI Designer Agent v1.0 integrado — SOFIA v2.3**

---

## ⚠️ Persistence Protocol — OBLIGATORIO

Todo agente que genere artefactos DEBE:
1. Escribir artefactos a disco antes de cerrar su paso
2. Confirmar con bloque `✅ PERSISTIDO` listando cada archivo y ruta
3. El Orchestrator actualiza session.json y añade entrada a sofia.log

**El Orchestrator NO avanza al siguiente step sin bloque de confirmación.**

---

## Generación del Análisis Funcional (FA-Agent v2.0)

```bash
# Dependencia (instalar una vez)
pip3 install python-docx

# Generar / actualizar el documento Word
python3 .sofia/scripts/gen-fa-document.py
```

Salida: `docs/functional-analysis/FA-[Proyecto]-[Cliente].docx`

---

## Dashboard Global — Entregable Consolidado (v2.1)

```bash
# Regenerar en cada gate (obligatorio)
/opt/homebrew/opt/node@22/bin/node .sofia/scripts/gen-global-dashboard.js --gate G-[N] --step [N]

# Outputs
docs/dashboard/bankportal-global-dashboard.html  ← entregable canónico
docs/quality/sofia-dashboard.html               ← alias

# Verificar generación
node -e "const s=require('./.sofia/session.json'); console.log(s.dashboard_global)"
```

---

## Verificación de instalación

```bash
bash .sofia/scripts/audit-persistence.sh
# Esperado: 21/21 OK · SOFIA v2.3 — Persistence Protocol: COMPLETO
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

- **v2.3 (2026-03-28): UX/UI Designer Agent v1.0 — Step 2c, gate HITL PO+TL, Design System BankPortal v1.0, 21 agentes, pipeline 15 steps**
- **v2.2 (2026-03-27): LA-DASH-001, LA-FA-001, LESSONS_LEARNED.md, PERSISTENCE_PROTOCOL.md v1.7**
- **v2.1 (2026-03-26): Dashboard Global como entregable consolidado, gen-global-dashboard.js, regeneración en cada Gate (Regla de oro #11)**
- **v2.0 (2026-03-26): FA-Agent (Analista Funcional), python-docx generator, pipeline 14 steps, Análisis Funcional como entregable de cliente**
- v1.9.1 (2026-03-26): FA-Agent integrado Gates 2b/3b/8b, Orchestrator actualizado
- v1.9 (2026-03-24): Security Agent Step 5b, Dashboard Global, CMMI evidence gates
- v1.8 (2026-03-19): Performance Agent, multi-proyecto (sofia-wizard + sofia-projects)
- v1.7 (2026-03-17): Documentation Agent Steps 3b+8, gates bloqueantes Jira
- v1.5 (2026-03-15): Persistence Protocol (session.json + sofia.log)
- v1.1 (2026-03-12): Documentation Agent inicial (Word + Excel + diagramas)
