# Workflow Manager — SOFIA Software Factory v1.7
# Gestión de gates HITL con enforcement vía Jira

Gestiona todos los gates de aprobación humana del pipeline. En v1.7 los gates
son **físicamente bloqueantes**: crea un issue de aprobación en Jira, bloquea
el pipeline en session.json, y solo libera el siguiente step cuando el responsable
transiciona el issue a "Approved" o "Rejected".

Se activa cuando el Orchestrator detecta un gate al final de cualquier step.

---

## Principio fundamental v1.7

> Un gate es APROBADO cuando el issue Jira está en estado "Approved".
> El pipeline NO puede avanzar por ningún otro medio.

El gate deja de ser declarativo ("el PM debe aprobar") y pasa a ser
ejecutable: ningún skill puede ejecutarse mientras `session.json.status == "gate_pending"`.

---

## Protocolo de gate — Flujo completo

```
[Orchestrator detecta gate en step N]
        │
        ▼
[1] Workflow Manager crea issue Jira
    - Tipo: Task
    - Summary: "[GATE] Sprint X — FEAT-XXX — Step N: [nombre del gate]"
    - Labels: ["gate", "sofia-gate", "FEAT-XXX"]
    - Priority: High
    - Descripción: artefactos generados + criterios de aprobación
        │
        ▼
[2] Bloquear pipeline
    - session.json.status = "gate_pending"
    - session.json.gates.N = {status: "pending", jira_issue_key: "BP-XXX"}
    - sofia.log: GATE_PENDING → step N, esperando BP-XXX
    - Informar al usuario: "Pipeline en espera. Issue de aprobación: BP-XXX"
        │
        ▼
[3] Responsable actúa en Jira
    - Revisa artefactos enlazados en el issue
    - Transiciona a "Approved" o "Rejected"
        │
        ▼
[4] Detección del resultado (al retomar la sesión)
    python3 .sofia/scripts/gate-check.py [repo] [step] [feature]
    → Exit 0: aprobado  → continuar pipeline
    → Exit 1: pendiente → mantener bloqueo
    → Exit 2: rechazado → gestionar NC
        │
        ▼
[5A] APROBADO
    - session.json.gates.N.status = "approved"
    - session.json.status = "in_progress"
    - Continuar al step N+1
        │
[5B] RECHAZADO
    - session.json.gates.N.status = "rejected"
    - Crear NC en session.json.ncs
    - Volver al step N con el feedback del rechazo
    - El Orchestrator re-invoca el skill del step N con las NCs
```

---

## Gates del pipeline — Detalle

| Step | Gate | Responsable | Criterio de aprobación |
|------|------|-------------|------------------------|
| 1  | Inclusión en sprint    | product-owner   | Scope y estimación válidos |
| 2  | User Stories           | product-owner   | ACs completos y verificables |
| 3  | HLD/LLD                | tech-lead       | Arquitectura alineada con plataforma |
| 5  | Code Review (NCs)      | tech-lead       | Zero NCs abiertas |
| 5b | Security Gate          | security-team   | Zero CVEs críticos |
| 6  | QA                     | qa-lead + PO    | 100% tests críticos, 0 bugs bloqueantes |
| 7  | Go/No-Go Release       | release-manager | Pipeline CI/CD verde |
| 8  | Paquete cliente        | PM              | Documentación completa y correcta |
| 9  | Aceptación cliente     | client          | Demo aprobada, criterios de aceptación OK |

---

## Crear issue de gate — Instrucciones al atlassian-agent

Cuando el Orchestrator invoca el Workflow Manager para crear un gate:

```
Instrucción para atlassian-agent:

Crear un issue de tipo Task en Jira con:

summary: "[GATE] Sprint [N] — [FEAT-XXX] — Step [N]: [nombre del gate]"

description (formato ADF o markdown):
  ## Pipeline BLOQUEADO — Acción requerida

  **Proyecto:** [project_name]
  **Feature:** [FEAT-XXX]
  **Sprint:** [N]
  **Step completado:** [N] — [nombre skill]
  **Responsable de aprobación:** [rol]

  ## Artefactos generados (revisar antes de aprobar)
  [lista de rutas/enlaces de artefactos del step]

  ## Criterio de aprobación
  [criterio específico del gate]

  ## Acción requerida
  - Transicionar a **Approved** si los artefactos cumplen el criterio
  - Transicionar a **Rejected** con comentario explicando qué corregir

  _Generado por SOFIA v1.7 — [timestamp]_

labels: ["gate", "sofia-gate", "[FEAT-XXX]", "sprint-[N]"]
priority: High
assignee: [account_id del responsable si está disponible]

Retornar el issue key creado (ej: BP-123).
```

---

## Consultar estado del gate — Instrucciones al atlassian-agent

```
Instrucción para atlassian-agent:

Consultar el issue [issue_key] con getJiraIssue.
Extraer:
  - fields.status.name
  - fields.comment.comments (últimos 3)
  - fields.assignee.displayName

Interpretar:
  - "Approved"          → gate aprobado, pipeline puede continuar
  - "Rejected"          → gate rechazado, gestionar NC con feedback del comentario
  - cualquier otro estado → gate pendiente, pipeline bloqueado

Si el issue no existe → buscar con JQL:
  project = [KEY] AND labels = "sofia-gate" AND labels = "[FEAT-XXX]"
  AND summary ~ "Step [N]" ORDER BY created DESC
```

---

## Gestión de NCs (No Conformidades)

Cuando un gate es RECHAZADO:

```
1. Registrar NC en session.json:
   ncs["NC-[step]-[timestamp]"] = {
     "step": "N",
     "description": "[feedback del revisor]",
     "severity": "mayor",   // siempre mayor si viene de un gate
     "status": "open",
     "assigned_to": "skill del step N",
     "created_at": "[timestamp]"
   }

2. Crear issue Jira de tipo Bug:
   summary: "[NC] [FEAT-XXX] Step [N] — [descripción breve]"
   labels: ["NC", "sofia-nc", "[FEAT-XXX]"]
   priority: High
   description: feedback completo del revisor

3. Escribir en sofia.log:
   [TIMESTAMP] [STEP-N] [workflow-manager] GATE_REJECTED → [feature] | NC: [descripción]

4. Informar al Orchestrator:
   "Gate rechazado. NC-[ID] creada. Volver al step N con feedback: [descripción]"

5. El Orchestrator re-invoca el skill del step N con:
   "Re-ejecutar step N. NC abierta: [descripción del rechazo]."
```

---

## Gestión de NCs resueltas

Cuando el developer/skill resuelve la NC:

```
1. Actualizar session.json:
   ncs["NC-[ID]"].status = "closed"
   ncs["NC-[ID]"].resolved_at = "[timestamp]"

2. Transicionar issue Jira de NC a "Done"

3. Solicitar re-aprobación del gate:
   → El Workflow Manager crea un NUEVO issue de gate con el mismo formato
   → Referencia al issue de NC resuelto en la descripción

4. Escribir en sofia.log:
   [TIMESTAMP] [STEP-N] [workflow-manager] NC_CLOSED → [NC-ID] | re-gate solicitado
```

---

## Verificación de bloqueo — Regla del Orchestrator

Antes de invocar CUALQUIER skill del pipeline:

```
1. Leer session.json.status
2. Si status == "gate_pending":
   a. Ejecutar: python3 .sofia/scripts/gate-check.py [repo] [step] [feature]
   b. Si exit == 0 (aprobado)  → continuar
   c. Si exit == 1 (pendiente) → mostrar mensaje de espera, NO continuar
   d. Si exit == 2 (rechazado) → gestionar NC, NO continuar al step siguiente
3. Si status == "in_progress" → continuar normalmente
```

Mensaje de espera al usuario (cuando gate está pendiente):

```
⏳ Pipeline en espera — Gate step [N] pendiente

  Proyecto:   [project]
  Feature:    [FEAT-XXX]
  Gate:       [nombre del gate]
  Responsable: [rol]
  Jira issue: [BP-XXX] (si fue creado)
  Desde:      [timestamp]

  Cuando el responsable haya actuado en Jira, escribe:
  "verificar gate step [N]" para que SOFIA compruebe el resultado.
```

---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

```javascript
const fs  = require('fs');
const now = new Date().toISOString();

const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
const step = 'N';

// Actualizar gate en session.json
if (!session.gates) session.gates = {};
session.gates[step] = {
  status: gateStatus,          // "pending" | "approved" | "rejected"
  by: approverRole,
  jira_issue_key: issueKey,
  at: now,
};
session.status    = gateStatus === "approved" ? "in_progress" : "gate_pending";
session.updated_at = now;
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

// sofia.log
const statusLabel = gateStatus === "approved" ? "GATE_APPROVED"
                  : gateStatus === "rejected"  ? "GATE_REJECTED"
                  : "GATE_PENDING";
const logEntry = `[${now}] [STEP-${step}] [workflow-manager] ${statusLabel} → ${feature} | issue: ${issueKey || "local"}\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

// Snapshot
const snapPath = `.sofia/snapshots/gate-step${step}-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación

```
---
✅ PERSISTENCE CONFIRMED — WORKFLOW_MANAGER STEP-N
- session.json: updated (gates.N = {status: [approved|rejected|pending]})
- session.json.status: [in_progress|gate_pending]
- sofia.log: GATE_[STATUS] entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/gate-step[N]-[timestamp].json
- artifacts:
  · jira://[BP-XXX] (issue de gate creado/actualizado)
  · .sofia/gates/gate-step[N]-[FEAT-XXX].json
---
```
