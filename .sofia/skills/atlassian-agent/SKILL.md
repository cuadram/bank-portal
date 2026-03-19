# Atlassian Agent — SOFIA Software Factory v1.7
# Sincronización bidireccional Jira + Confluence

Se activa en dos modos:
1. **Auto-sync** (invocado por Orchestrator tras POST-STEP VALIDATION):
   Lee los archivos de `.sofia/sync/` y ejecuta las acciones en Jira y Confluence.
2. **Manual** (invocado por el usuario): Consultas, búsquedas, creación de items.

Triggers manuales: "actualiza Jira", "crea issue", "sube a Confluence",
"sincroniza sprint", "estado en Jira", "linkea artefacto", "crea página".

---

## Contexto SOFIA

- **Jira project key**: leer de `.sofia/sofia-config.json` → `jira_project_key`
- **Confluence space**: leer de `.sofia/sofia-config.json` → `confluence_space`
- **Metodología**: Scrumban — sprints + backlog continuo
- **Gobierno**: CMMI Nivel 3 — Confluence es el sistema de registro oficial

---

## Modo Auto-Sync — Invocado por Orchestrator

### Protocolo de invocación

El Orchestrator invoca este skill tras cada POST-STEP VALIDATION exitoso:

```
1. Ejecutar: python3 .sofia/scripts/atlassian-sync.py [repo] [step] [feature]
2. Leer archivos generados en .sofia/sync/:
   · jira-sync-step[N]-[timestamp].md
   · confluence-sync-step[N]-[timestamp].md
3. Invocar atlassian-agent con el contenido de esos archivos
4. El agent ejecuta las acciones MCP y confirma
```

### Acciones por step

| Step | Jira transition | Confluence | Artefactos |
|------|----------------|------------|------------|
| 1  | → In Progress         | Sprint Planning / Backlog        | docs/backlog/ |
| 2  | → Requirements Review | Requirements / User Stories      | docs/requirements/ |
| 3  | → Architecture Review | Architecture / HLD-LLD           | docs/architecture/ |
| 3b | (sin transición)      | Architecture / Diagrams          | docs/deliverables/ |
| 4  | → In Review           | Development / Implementation     | src/ |
| 5  | → Code Review         | Quality / Code Review            | docs/quality/ |
| 5b | → Security Review     | Security / Security Report       | docs/security/ |
| 6  | → QA                  | Quality / Test Results           | docs/quality/ |
| 7  | → Ready for Release   | DevOps / CI-CD                   | infra/ |
| 8  | → Documentation Review| Deliverables / Client Package    | docs/deliverables/ |
| 9  | → Done                | Sprint Review / Acceptance       | todos |

---

## Acciones Jira — Detalle

### Buscar issues del sprint activo

```
Usar: searchJiraIssuesUsingJql
JQL: project = [KEY] AND labels = "[FEATURE]" AND sprint in openSprints()
Campos: summary, status, assignee, labels, priority
```

### Transicionar issue

```
1. getTransitionsForJiraIssue → obtener ID de la transición objetivo
2. transitionJiraIssue → ejecutar la transición
```

### Añadir comentario con artefactos

```
Usar: addCommentToJiraIssue
Formato ADF con:
- Resumen del step completado
- Lista de artefactos (como enlaces si están en Confluence)
- Timestamp y nombre del agente SOFIA
- Resultado de gate si aplica
```

### Crear issue de NC (No Conformidad)

Cuando un gate es rechazado:
```
Usar: createJiraIssue
- type: Bug
- summary: "[NC] [FEATURE] Step [N] — [descripción del rechazo]"
- labels: ["NC", feature, "sofia-generated"]
- priority: según severidad (mayor → High, menor → Medium)
- assignee: developer del sprint
```

### Cerrar NC resuelta

```
Usar: transitionJiraIssue → "Done"
Añadir comentario: "NC resuelta en re-ejecución de step [N]. Verificado por [skill]."
```

---

## Acciones Confluence — Detalle

### Buscar o crear página del sprint

```
Usar: searchConfluenceUsingCql
CQL: title = "Sprint [N] — [section]" AND space = "[SPACE]"

Si no existe → createConfluencePage:
- title: "Sprint [N] — [section]"
- space: [SPACE]
- parent: página del sprint (buscar "Sprint [N]")
```

### Actualizar sección de artefactos

```
Usar: getConfluencePage → obtener contenido actual
Añadir sección con tabla:
| Campo | Valor |
|-------|-------|
| Feature | [FEAT-XXX] |
| Step completado | [N] — [nombre] |
| Timestamp | [ISO] |
| Artefactos | enlaces a los ficheros |
| Gate | Aprobado por [rol] |

Usar: updateConfluencePage con el contenido ampliado
```

### Adjuntar SecurityReport

En step 5b, si el SecurityReport existe:
```
Subir SecurityReport.docx a la página "Security / Sprint [N]"
Añadir tabla resumen:
- Semáforo: VERDE/AMARILLO/ROJO
- CVE críticos: 0
- CVE altos: N
- Gate: Aprobado/Bloqueado
```

### Crear página de Sprint Review (step 9)

Al cerrar la feature:
```
createConfluencePage:
- title: "Sprint Review — Sprint [N] — [FEATURE]"
- Contenido: tabla con todos los steps, artefactos y gates del pipeline
- Incluir: velocity (SP completados), defect rate, security status
```

---

## Modo Manual — Operaciones disponibles

### Consultas frecuentes

```
"¿cuál es el estado de FEAT-005?"
→ searchJiraIssuesUsingJql: project=BP AND labels="FEAT-005"
→ Mostrar: status, assignee, sprint, últimos comentarios

"muéstrame el sprint activo"
→ searchJiraIssuesUsingJql: project=BP AND sprint in openSprints()
→ Agrupar por status, mostrar velocity parcial

"¿qué NCs hay abiertas?"
→ searchJiraIssuesUsingJql: project=BP AND issuetype=Bug AND labels=NC AND status != Done
```

### Creación manual

```
"crea issue para [descripción]"
→ createJiraIssue con tipo Story/Task/Bug según contexto

"crea página de retrospectiva del sprint [N]"
→ createConfluencePage con template de retrospectiva SOFIA
```

### Dashboard de sprint

```
"dame el estado del sprint"
→ Mostrar tabla con:
  - US completadas vs total
  - Gates aprobados vs total
  - NCs abiertas
  - Velocity acumulada (SP)
  - Security status
```

---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

Al completar cualquier acción de sincronización:

```javascript
const fs  = require('fs');
const now = new Date().toISOString();

const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
const step = '*'; // atlassian-agent opera en múltiples steps
if (!session.atlassian_sync) session.atlassian_sync = [];
session.atlassian_sync.push({
  step: currentStep,
  feature: currentFeature,
  jira_updated: true,
  confluence_updated: true,
  synced_at: now
});
session.updated_at = now;
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

const logEntry = `[${now}] [STEP-*] [atlassian-agent] COMPLETED → jira+confluence synced | step=${currentStep} feature=${currentFeature}\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

const snapPath = `.sofia/snapshots/step-atlassian-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación

```
---
✅ PERSISTENCE CONFIRMED — ATLASSIAN_AGENT STEP-*
- session.json: updated (atlassian_sync entry added)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-atlassian-[timestamp].json
- artifacts:
  · jira://[PROJECT]-[ISSUE-KEY] (transición + comentario)
  · confluence://[SPACE]/[PAGE-TITLE] (sección actualizada)
---
```

---

## Manejo de errores

```
Si Jira no está disponible:
  → Guardar prompt en .sofia/sync/pending/ con timestamp
  → Marcar en session.json: atlassian_sync.pending = true
  → Informar al Orchestrator: "Sync pendiente — ejecutar cuando Jira esté disponible"

Si la transición no existe (estado ya alcanzado):
  → No fallar — añadir comentario igualmente
  → Registrar warning en sofia.log

Si la página Confluence no existe:
  → Crearla automáticamente con el contenido generado
  → Nunca fallar por página no encontrada
```

---

## sofia-config.json — Campos requeridos

```json
{
  "project": "bank-portal",
  "client": "Experis",
  "jira_project_key": "BP",
  "confluence_space": "BANKPORTAL",
  "jira_sprint_board_id": 1,
  "confluence_parent_page_id": null
}
```

Si `sofia-config.json` no existe, usar valores por defecto del contexto del proyecto.
