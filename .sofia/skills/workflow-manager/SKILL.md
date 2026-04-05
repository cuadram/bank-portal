---
name: workflow-manager
sofia_version: "2.6"
version: "1.13"
updated: "2026-04-04"
changelog: "v1.13 (2026-04-04) — Generico: lee config desde sofia-config.json. Sin hardcoding de proyecto/cloudId/JQL. | v1.12 (2026-04-02) — LA-022-07: verificar Step 3b en completed_steps pre-Step4. LA-022-02: regenerar LESSONS_LEARNED.md en Step 9. LA-022-08: verificar extensiones doc agent. | v1.11 — Dashboard Global como entregable en cada gate. Paso 7b obligatorio. Persistence Protocol actualizado con {proyecto}-global-dashboard.html."
---

## Verificacion sofia-shell al inicio de sesion (GR-014)

Al activarse en cualquier sesion con INIT, ejecutar SIEMPRE:

```
sofia-shell:run_command(
  command="python3 -c \"import os,json; print('OK CWD:',os.getcwd()); print('Proyecto:',json.load(open('.sofia/session.json')).get('project'))\"",
  cwd=SOFIA_REPO  ← ruta absoluta del proyecto activo
)
```

Si la salida no muestra el proyecto correcto → alertar al usuario antes de continuar.


# Workflow Manager — SOFIA Software Factory v1.11

## Rol
Gestionar todos los gates HITL del pipeline, asegurar que las aprobaciones
se registren en Jira y Confluence **en cada gate** (no solo en Step 9),
mantener el estado en session.json y garantizar la trazabilidad CMMI Level 3
en cada sprint.

## Activacion
- Invocado por el Orchestrator en cada gate HITL
- Al cierre de sprint (Step 9)
- On-demand: gestiona el gate, cierra el sprint, estado del pipeline, evidencias CMMI

---


## Lectura de configuracion del proyecto (OBLIGATORIO)

Antes de cualquier accion Atlassian o de dashboard, leer:
```
.sofia/sofia-config.json:
  - jira.project_key  → usar en JQL y transiciones
  - jira.cloud_id     → usar en llamadas MCP Atlassian
  - confluence.space_key → usar al buscar/crear paginas
  - project           → usar en nombres de paginas y dashboards
  - client            → usar en nombres de documentos

.sofia/session.json:
  - current_sprint, current_feature → contexto del pipeline
  - sofia_repo → verificar GR-CORE-003 antes de escribir
```

NUNCA hardcodear cloudId, project_key, nombres de proyecto/cliente.

## Principio fundamental — Atlassian Sync + Dashboard Global Distribuidos

> **Un gate no está aprobado hasta que:**
> 1. Jira y Confluence confirman la actualización
> 2. El Dashboard Global ha sido regenerado y persistido en disco

**Causa raiz (S16/S17/S18):** Step 9 único punto de sync. Al ejecutarse en sesión
distinta quedaba huérfano. **Solución:** cada gate incluye su actualización Atlassian
Y la regeneración del Dashboard Global.

---

## Gates HITL — Matriz Atlassian

| Gate | Step | Aprobador     | Jira                                      | Confluence                              |
|------|------|---------------|-------------------------------------------|-----------------------------------------|
| G-1  | 1    | Product Owner | Crear Epic + issues → Por hacer           | Crear pagina Sprint + Sprints index     |
| G-2  | 2    | PO + SM       | Issues → En curso                         | Actualizar Requisitos + SRS             |
| G-3  | 3    | Tech Lead     | Issues arquitectura → En curso            | Actualizar Arquitectura + HLD/LLD       |
| G-5  | 5    | Tech Lead     | NCs reflejadas en descripcion issue       | Actualizar pagina Code Review           |
| G-6  | 6    | QA Lead       | US stories → Finalizada                   | Actualizar pagina QA con resultados     |
| G-7  | 7    | DevOps/RM     | Issue release → Finalizada                | Actualizar Runbook + Release Notes      |
| G-8  | 8    | PM            | Tech Debt issues → Finalizada             | Actualizar documentacion + evidencias   |
| G-9  | 9    | PM            | Epic → Finalizada + JQL verif. 0 open     | Actualizar pagina Sprint + metricas     |

---

## Protocolo de gate (cada HITL)

PASO 1 — Atlassian sync PRE-APROBACION:
  a) Jira: transicion de issues correspondientes al estado del gate
     - cloudId: leer de .sofia/sofia-config.json → jira.cloud_id
     - Transition Finalizada id: 31
     - Transition En curso id: 21
  b) Confluence: actualizar pagina del sprint con estado actual
  c) Registrar resultado en atlassian-sync.json

PASO 2 — Mostrar al PM evidencia de sincronizacion:
  - Issues Jira actualizadas (key + estado confirmado)
  - Pagina Confluence actualizada (URL)
  - Artefactos producidos en este step
  - Criterios de aprobacion pendientes de revision humana

PASO 3 — Crear issue Jira de gate:
  - Tipo: Task
  - Summary: GATE [N] — [FEAT-XXX] Sprint [S] — Pendiente [Aprobador]
  - Label: sofia-gate

PASO 4 — Actualizar session.json:
  gate_pending: { step:N, agent:nombre, jira_issue:SCRUM-XXX,
    atlassian_synced:true, waiting_for:rol, created_at:ISO }

PASO 5 — Escribir sofia.log:
  [TS] [GATE-N] [workflow-manager] PENDING → SCRUM-XXX
  [TS] [ATLASSIAN] [jira] SYNCED → issues: [SCRUM-XX, ...]
  [TS] [ATLASSIAN] [confluence] SYNCED → page: [titulo]

PASO 6 — DETENER pipeline hasta aprobacion explicita del PM

PASO 7 — Al aprobar el PM:
  - Limpiar gate_pending: null en session.json
  - Actualizar atlassian-sync.json con approved_at + approved_by
  - Registrar: [TS] [GATE-N] APPROVED

PASO 7b — Dashboard Global (OBLIGATORIO — nunca omitir):
  /opt/homebrew/opt/node@22/bin/node .sofia/scripts/gen-global-dashboard.js \
    --gate G-[N] --step [N]
  Confirmar: ✅ docs/dashboard/{proyecto}-global-dashboard.html actualizado
  Confirmar: ✅ session.json.dashboard_global.last_generated actualizado
  Registrar: [TS] [DASH] [gen-global-dashboard] UPDATED → Gate G-[N] · Step [N]

PASO 8 — Notificar Orchestrator para continuar al siguiente step

### Fallback dashboard
Si el script falla (Node no disponible, session.json corrupto):
  - Regenerar manualmente desde Claude Desktop con contexto actual
  - Persistir en docs/dashboard/{proyecto}-global-dashboard.html
  - Registrar: [TS] [DASH] [MANUAL] FALLBACK → Gate G-[N]

### Fallback Atlassian
Si la actualizacion Atlassian falla: informar al PM ANTES de pedir aprobacion.
NO bloquear pipeline — registrar sync_status:FAILED en atlassian-sync.json.
Reintentar al inicio del siguiente gate.

---

## Formato atlassian-sync.json

Ruta: docs/deliverables/sprint-[N]-[FEAT-XXX]/atlassian-sync.json

Estructura clave (version compacta):
  sprint: N
  feature: FEAT-XXX
  cloudId: (leer de .sofia/sofia-config.json → jira.cloud_id)
  gates.G-1.jira_issues_created: [SCRUM-XX, ...]
  gates.G-1.jira_states: {SCRUM-XX: Por hacer}
  gates.G-1.confluence_pages_updated: [Sprints {proyecto}]
  gates.G-1.synced_at: ISO timestamp
  gates.G-1.sync_status: OK | FAILED
  gates.G-1.approved_at: ISO timestamp
  gates.G-1.approved_by: PM | QA Lead | Tech Lead
  gates.G-1.dashboard_updated: ISO timestamp        ← NUEVO v1.11
  gates.G-1.dashboard_path: docs/dashboard/{proyecto}-global-dashboard.html ← NUEVO
  ...
  gates.G-9.jira_epic_closed: SCRUM-XX
  gates.G-9.jql_verification.query: project={jira.project_key} AND sprint in openSprints() AND status!=Finalizada
  gates.G-9.jql_verification.open_issues: 0
  gates.G-9.jql_verification.result: PASS | FAIL
  sprint_closed: true
  closed_at: ISO timestamp

---

## Cierre de sprint — Gate 9 — Secuencia obligatoria

PASO 1 — Verificacion JQL (BLOQUEANTE si falla):
  JQL: project = {jira.project_key} AND sprint in openSprints() AND status != Finalizada
  Resultado esperado: 0 issues
  Si > 0: mostrar lista al PM → pedir autorizacion → cerrar → re-verificar

PASO 2 — Cerrar Epic:
  Transicion Epic Sprint-N → Finalizada (transition id: 31)
  cloudId: (leer de .sofia/sofia-config.json → jira.cloud_id)
  Confirmar estado verde antes de continuar

PASO 3 — Actualizar Confluence:
  Pagina Sprints {proyecto}: añadir entrada Sprint-N cerrado
  Pagina {proyecto} — {cliente}: actualizar metricas acumuladas

PASO 4 — Persistir atlassian-sync.json con G-9 completo y jql_verification.result=PASS

PASO 5 — Generar Dashboard Global (cierre de sprint):
  /opt/homebrew/opt/node@22/bin/node .sofia/scripts/gen-global-dashboard.js \
    --gate G-9 --step 9
  → docs/dashboard/{proyecto}-global-dashboard.html
  → docs/quality/sofia-dashboard.html

### Checklist Step 9 completo

  [x] Todos los steps 1-8 en session.json.completed_steps
  [x] gate_pending == null
  [x] docs/deliverables/sprint-[N]-[FEAT]/ completa (13 archivos minimo)
  [x] atlassian-sync.json con todos los gates registrados (G-1..G-9)
  [x] atlassian-sync.json.gates.G-N.dashboard_updated != null para todos los gates
  [x] JQL: 0 issues abiertas (VERIFICADO)
  [x] Epic → Finalizada en Jira (CONFIRMADO)
  [x] Paginas Confluence actualizadas (CONFIRMADO)
  [x] docs/sprints/SPRINT-[N]-data.json generado
  [x] Git tag vX.N.0 creado
  [x] docs/dashboard/{proyecto}-dashboard-sprint[N].html    ← dashboard de sprint
  [x] docs/dashboard/{proyecto}-global-dashboard.html       ← dashboard GLOBAL (entregable)
  [x] session.json.dashboard_global.last_generated != null

### Acciones al cierre

1. Verificacion JQL + cierre issues pendientes
2. Generar docs/sprints/SPRINT-[N]-report.md
3. Generar docs/sprints/SPRINT-[N]-data.json
4. Generar docs/cmmi/evidence-sprint-[N].md
5. Actualizar Confluence (paginas Sprint + {proyecto} home)
6. Generar dashboard sprint específico (legacy):
   /opt/homebrew/opt/node@22/bin/node .sofia/scripts/gen-dashboard.js
   → docs/dashboard/{proyecto}-dashboard-sprint[N].html
7. **Generar Dashboard Global (entregable):**
   /opt/homebrew/opt/node@22/bin/node .sofia/scripts/gen-global-dashboard.js --gate G-9 --step 9
   → docs/dashboard/{proyecto}-global-dashboard.html  ← OBLIGATORIO
8. Persistir atlassian-sync.json G-9 completo (incluye dashboard_updated)
9. Actualizar session.json para Sprint N+1
   { current_sprint:N+1, current_feature:"", current_step:null,
     completed_steps:[], status:idle, gate_pending:null }
10. Escribir sofia.log:
   [TS] [SPRINT]    [orchestrator]  CLOSED → Sprint N · FEAT-XXX · vX.N.0
   [TS] [ATLASSIAN] [jira]          VERIFIED → 0 open issues
   [TS] [ATLASSIAN] [jira]          Epic SCRUM-XX → Finalizada
   [TS] [ATLASSIAN] [confluence]    UPDATED → Sprints {proyecto}
   [TS] [DASH]      [gen-dashboard] GENERATED → sprint[N].html
   [TS] [DASH]      [gen-global-dashboard] GENERATED → {proyecto}-global-dashboard.html

---

## CMMI Level 3 — Evidence tracking

Para cada sprint, generar docs/cmmi/evidence-sprint-[N].md

| PA    | Evidencia                              | Artefacto                    | Estado |
|-------|----------------------------------------|------------------------------|--------|
| PP    | Sprint planning documentado            | SPRINT-[N]-planning.md       | OK     |
| PMC   | Sprint report con metricas             | Sprint-[N]-Report-PMC.docx   | OK     |
| RSKM  | Riesgos identificados y gestionados    | Risk-Register actualizado    | OK     |
| VER   | Revision de codigo documentada         | CR-[FEAT]-sprint[N].md       | OK     |
| VAL   | QA report con criterios de aceptacion  | [FEAT]-QA-Report.docx        | OK     |
| CM    | Tag de release en Git                  | vX.N.0                       | OK     |
| PPQA  | Security report generado               | SecurityReport-Sprint[N].md  | OK     |
| REQM  | SRS trazable a US                      | [FEAT]-SRS.docx              | OK     |
| DAR   | ADRs documentados                      | docs/architecture/adr/       | OK     |

---

## Persistence Protocol

PERSISTIDO — Workflow Manager · Sprint [N] · Gate [X] / Cierre
  .sofia/session.json                                          [ACTUALIZADO]
  .sofia/sofia.log                                             [ENTRADA AÑADIDA]
  docs/deliverables/sprint-[N]-[F]/atlassian-sync.json        [ACTUALIZADO — incl. dashboard_updated]
  docs/sprints/SPRINT-[N]-report.md                           [CREADO]
  docs/sprints/SPRINT-[N]-data.json                           [CREADO]
  docs/cmmi/evidence-sprint-[N].md                            [CREADO]
  docs/dashboard/{proyecto}-dashboard-sprint[N].html          [GENERADO — sprint específico]
  docs/dashboard/{proyecto}-global-dashboard.html             [GENERADO — ENTREGABLE GLOBAL]
  docs/quality/sofia-dashboard.html                           [GENERADO — alias global]

---

## Troubleshooting — Sync Atlassian pendiente

Si al leer el estado en disco atlassian-sync.json no existe o tiene gates
sin synced_at, ejecutar recuperacion:

1. Identificar gates sin sync
2. JQL: project={jira.project_key} AND sprint=N AND status != Finalizada
3. Cerrar issues abiertas correspondientes a steps completados
4. Actualizar Confluence con estado actual
5. Persistir atlassian-sync.json completo con recovery_at timestamp
6. Regenerar Dashboard Global: node .sofia/scripts/gen-global-dashboard.js
7. Registrar: [TS] [RECOVERY] [atlassian] sync completado · Sprint N
   [TS] [RECOVERY] [dashboard] regenerado · Sprint N

Este protocolo resuelve la causa raiz detectada en Sprints 16, 17 y 18
donde el Step 9 no se ejecuto en el mismo contexto de sesion.
