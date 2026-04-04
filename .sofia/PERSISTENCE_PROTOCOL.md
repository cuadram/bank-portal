# SOFIA — Persistence Protocol v1.6
# Contrato obligatorio para todos los skills

## Propósito

Este protocolo garantiza que SOFIA mantiene trazabilidad completa del pipeline
entre sesiones de Claude Desktop. Un step NO está completo hasta que haya
escrito sus artefactos en disco y actualizado los archivos de estado.

---

## Rutas canónicas

```
$REPO/
└── .sofia/
    ├── session.json     ← estado activo del pipeline
    ├── sofia.log        ← audit trail inmutable (append-only)
    └── snapshots/       ← backup automático por step
        └── step-N-YYYY-MM-DDTHH-MM-SS.json
```

Donde `$REPO` = directorio raíz del proyecto (contiene `.sofia/`).

---

## session.json — Esquema

```json
{
  "version": "1.6",
  "project": "bank-portal",
  "client": "Experis",
  "sprint": 9,
  "feature": "FEAT-XXX",
  "pipeline_type": "new-feature",
  "pipeline_step": 4,
  "pipeline_step_name": "developer",
  "status": "in_progress",
  "started_at": "2026-03-18T10:00:00Z",
  "updated_at": "2026-03-18T11:30:00Z",
  "completed_steps": [1, 2, 3, "3b"],
  "last_skill": "architect",
  "last_skill_output_path": "docs/architecture/",
  "artifacts": {
    "1": ["docs/backlog/FEAT-XXX.md"],
    "2": ["docs/requirements/US-XXX.md", "docs/requirements/RTM.md"],
    "3": ["docs/architecture/HLD.md", "docs/architecture/LLD.md"],
    "3b": ["docs/deliverables/sprint-N-FEAT-XXX/arquitectura/"]
  },
  "gates": {
    "1": {"status": "approved", "by": "product-owner", "at": "2026-03-18T10:15:00Z"},
    "2": {"status": "approved", "by": "product-owner", "at": "2026-03-18T10:45:00Z"},
    "3": {"status": "approved", "by": "tech-lead", "at": "2026-03-18T11:20:00Z"}
  },
  "security": {
    "scan_status": null,
    "cve_critical": 0,
    "cve_high": 0,
    "report_path": null
  }
}
```

Campos obligatorios en cada actualización: `pipeline_step`, `pipeline_step_name`,
`status`, `updated_at`, `completed_steps`, `last_skill`.

---

## sofia.log — Formato de entrada

Cada skill escribe exactamente una línea al finalizar. Formato:

```
[ISO8601] [STEP-N] [skill-name] STATUS → output_path | details
```

Ejemplos:
```
[2026-03-18T10:00:00Z] [STEP-1] [scrum-master] COMPLETED → docs/backlog/FEAT-001.md | Sprint 9, 21 SP estimados
[2026-03-18T10:45:00Z] [STEP-2] [requirements-analyst] COMPLETED → docs/requirements/ | 5 US, 12 ACs, RTM generado
[2026-03-18T11:00:00Z] [STEP-3] [architect] COMPLETED → docs/architecture/ | HLD+LLD+2 ADRs
[2026-03-18T11:05:00Z] [STEP-3b] [documentation-agent] COMPLETED → docs/deliverables/sprint-9-FEAT-001/ | 3 diagramas, HLD.docx, LLD.docx
[2026-03-18T11:30:00Z] [STEP-3] [architect] GATE_PENDING → tech-lead | Esperando aprobación HLD
[2026-03-18T11:35:00Z] [STEP-3] [workflow-manager] GATE_APPROVED → tech-lead | HLD aprobado con 1 observación
[2026-03-18T14:00:00Z] [STEP-5b] [security-agent] COMPLETED → docs/security/SecurityReport.docx | 0 CVE críticos, 2 CVE medios
[2026-03-18T15:00:00Z] [STEP-4] [developer] GATE_BLOCKED → NCs pendientes | 2 NCs del code-reviewer sin resolver
```

Estados válidos: `STARTED`, `COMPLETED`, `GATE_PENDING`, `GATE_APPROVED`,
`GATE_REJECTED`, `GATE_BLOCKED`, `ERROR`, `SKIPPED`.

---

## Instrucciones por skill — Lo que DEBES hacer antes de retornar

### Al INICIAR un step

```
1. Leer .sofia/session.json
2. Verificar que pipeline_step == N esperado (si no, alertar al Orchestrator)
3. Escribir en sofia.log:
   [TIMESTAMP] [STEP-N] [mi-skill] STARTED → descripción breve
4. Actualizar session.json: status = "in_progress", pipeline_step = N, updated_at = now
```

### Al COMPLETAR un step

```
1. Escribir TODOS los artefactos a disco en sus rutas designadas
2. Actualizar session.json:
   - completed_steps: añadir N
   - artifacts.N: lista de rutas de artefactos generados
   - last_skill: mi nombre
   - last_skill_output_path: ruta principal de salida
   - status: "completed" (o "gate_pending" si hay gate)
   - updated_at: timestamp actual
3. Escribir en sofia.log línea COMPLETED con ruta y detalles
4. Crear snapshot: copiar session.json a .sofia/snapshots/step-N-[timestamp].json
5. Responder con el bloque de confirmación (ver abajo)
```

### Bloque de confirmación obligatorio

Cada skill DEBE incluir al final de su respuesta:

```
---
✅ PERSISTENCE CONFIRMED — [SKILL-NAME] STEP-N
- session.json: updated (step N added to completed_steps)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-N-[timestamp].json
- artifacts:
  · [ruta/artefacto1.ext]
  · [ruta/artefacto2.ext]
---
```

Si un skill NO incluye este bloque, el Orchestrator DEBE re-invocar el skill
con la instrucción: "Persistence confirmation missing. Complete the persistence
protocol before returning."

---

## Regla de validación del Orchestrator (post-step)

Después de recibir la respuesta de cualquier skill, el Orchestrator ejecuta:

```
CHECK 1: ¿La respuesta contiene el bloque "✅ PERSISTENCE CONFIRMED"?
  → NO: Re-invocar skill con mensaje de error de persistencia

CHECK 2: ¿session.json tiene el step N en completed_steps?
  → NO (leer via filesystem): Re-invocar skill

CHECK 3: ¿Los artefactos declarados existen en las rutas indicadas?
  → NO: Re-invocar skill con lista de archivos faltantes

CHECK 4: ¿sofia.log tiene entrada COMPLETED para step N?
  → NO: El skill puede continuar pero registrar warning

Si CHECK 1 + 2 + 3 pasan → step validado → continuar al step N+1
Si alguno falla 2 veces → escalar al Workflow Manager con status ERROR
```

---

## Recuperación de pipeline (resume-from-step)

Al iniciar una nueva sesión, el Orchestrator lee session.json y detecta:

```
Si status == "in_progress":
  → "Pipeline detectado en step N (feature FEAT-XXX, sprint S)"
  → Presentar opciones:
    [A] Retomar desde step N
    [B] Retomar desde el inicio del step N (re-ejecutar)
    [C] Reiniciar pipeline completo
    [D] Ver artefactos generados hasta ahora
```

Los artefactos previos (en artifacts.1, artifacts.2, ...) son accesibles
como contexto para los steps restantes.

---

## Notas de implementación

- sofia.log es append-only — nunca borrar ni sobreescribir líneas existentes
- session.json se sobreescribe en cada actualización (no es append)
- Los snapshots son inmutables una vez creados
- Si .sofia/ no existe al arrancar, crearlo con session.json vacío
- El timestamp siempre en ISO 8601 UTC: `new Date().toISOString()`

---

## Lecciones Aprendidas incorporadas al protocolo

Registro completo en `.sofia/LESSONS_LEARNED.md`.

### REGLA LA-DASH-001 — fa-index.json como única fuente de verdad del dashboard

> El script `gen-global-dashboard.js` NUNCA usa arrays hardcodeados de features.
> SIEMPRE lee `docs/functional-analysis/fa-index.json` para construir el historial.
> Si `total_functionalities != functionalities.length` → auto-corregir + WARNING en log.

**Checklist en cada regeneración de dashboard:**
```
[ ] fa-index.json existe en docs/functional-analysis/
[ ] fa-index.total_functionalities == functionalities.length (o auto-corregido)
[ ] FULL_HISTORY construido desde fa-index.functionalities (no hardcodeado)
[ ] dashboard generado y persistido en docs/dashboard/ Y docs/quality/
```

### REGLA LA-FA-001 — FA-Agent: total_functionalities siempre calculado

> El FA-Agent al escribir fa-index.json DEBE calcular `total_functionalities`
> como `functionalities.length` de forma dinámica. Nunca asignar un valor
> literal. Esto evita desincronización entre el metadato y el array real.

### REGLA LA-SESS-001 — Dashboard Global en cada gate (no solo Step 9)

> Un gate no está aprobado hasta que Jira/Confluence estén sincronizados
> Y el Dashboard Global esté regenerado en disco.
> Ver: workflow-manager SKILL.md § Paso 7b.
