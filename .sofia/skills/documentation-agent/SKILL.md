---
name: documentation-agent
sofia_version: "1.9"
updated: "2026-03-24"
changelog: "v1.9 — Sprint data JSON para Dashboard Global, validado en BankPortal (154 docs S2-S16)"
---

# Documentation Agent — SOFIA Software Factory v1.9

## Rol
Transformar los artefactos Markdown del pipeline en documentos profesionales
entregables: Word (.docx) con estilo corporativo Experis, diagramas de
arquitectura visuales, Excel (.xlsx) para registros de calidad CMMI Level 3.
También genera el archivo de datos JSON del sprint para el Dashboard Global.

## Activación

### Step 3b (automática, post-Gate 3)
```
Actúa como Documentation Agent — Step 3b
Sprint: [N] · Feature: [FEAT-XXX]
Genera: HLD.docx + LLD.docx + diagramas de arquitectura
```

### Step 8 (HITL, post-Gate 7, requiere aprobación PM)
```
Actúa como Documentation Agent — Step 8
Sprint: [N] · Feature: [FEAT-XXX]
Genera: Delivery Package completo
```

### On-demand
- "genera documento Word para [artefacto]"
- "convierte el HLD a Word"
- "genera el NC Tracker del sprint"
- "genera los datos del sprint para el dashboard"

---

## Step 3b — Documentos de arquitectura

### Inputs
```
docs/architecture/hld/HLD-[FEAT-XXX].md
docs/architecture/lld/LLD-[FEAT-XXX]-backend.md
docs/architecture/lld/LLD-[FEAT-XXX]-frontend.md
```

### Outputs → docs/architecture/
```
HLD-[FEAT-XXX].docx           ← Con diagramas C4 Contexto + Contenedores
LLD-[FEAT-XXX]-backend.docx   ← Con diagrama Secuencia + Clean Architecture
LLD-[FEAT-XXX]-frontend.docx  ← Con diagrama Componentes
```

### Generación de diagramas
```javascript
const { execSync } = require('child_process');
const NODE = '/opt/homebrew/opt/node@22/bin/node';
const MMDC = `${NODE} /opt/homebrew/lib/node_modules/@mermaid-js/mermaid-cli/src/cli.js`;

// Mermaid → PNG
execSync(`${MMDC} -i diagram.mmd -o diagram.png -b white`);

// Insertar en Word
const { ImageRun } = require('docx');
const img = fs.readFileSync('diagram.png');
new ImageRun({ data: img, transformation: { width: 500, height: 300 }, type: 'png' });
```

---

## Step 8 — Delivery Package completo

### Outputs → docs/deliverables/sprint-[N]-[FEAT-XXX]/

**10 documentos Word:**
| Archivo | Fuente | Contenido |
|---------|--------|-----------|
| [FEAT]-SRS.docx | docs/srs/SRS-[FEAT].md | Requisitos, US, AC |
| [FEAT]-HLD.docx | docs/architecture/hld/ | Arquitectura + diagramas C4 |
| [FEAT]-LLD-backend.docx | docs/architecture/lld/ | Diseño detallado backend |
| [FEAT]-LLD-frontend.docx | docs/architecture/lld/ | Diseño detallado frontend |
| [FEAT]-Test-Plan.docx | docs/qa/test-plan-*.md | Plan de pruebas |
| [FEAT]-QA-Report.docx | docs/qa/qa-report-*.md | Informe de calidad |
| [FEAT]-Code-Review-Report.docx | docs/code-review/CR-*.md | Informe CR + NCs |
| [FEAT]-Release-Notes.docx | infra/RELEASE-NOTES-*.md | Notas de release |
| [FEAT]-Runbook.docx | infra/runbook-*.md | Manual operación |
| Sprint-[N]-Report-PMC.docx | docs/sprints/ | Sprint report CMMI PMC |

**3 Excel:**
| Archivo | Pestañas |
|---------|---------|
| NC-Tracker.xlsx | Dashboard, NCs, Métricas (semáforo condicional) |
| Decision-Log.xlsx | Log (dropdown estado), Resumen |
| Quality-Dashboard.xlsx | Dashboard, Tests, Cobertura, Velocidad |

### Estilo corporativo Experis (Word)
```javascript
const EXPERIS_BLUE = '1B3A6B';
const styles = {
  heading1: { color: EXPERIS_BLUE, size: 28, bold: true, font: 'Arial' },
  body:     { size: 22, font: 'Arial' },
  table_header: { fill: EXPERIS_BLUE, color: 'FFFFFF', bold: true }
};
// Header: logo Experis + nombre proyecto
// Footer: "SOFIA v1.9 · Confidencial · [Fecha]"  
// Numeración de páginas
// TOC si > 4 secciones
```

---

## Sprint data JSON para Dashboard Global ← NUEVO v1.9

Al generar el Delivery Package, crear también:
`docs/sprints/SPRINT-[N]-data.json`

```json
{
  "sprint": 17,
  "sp": 24,
  "acum": 401,
  "feat": "FEAT-015",
  "titulo": "Descripción de la feature",
  "rel": "v1.17.0",
  "tests": 600,
  "cov": 84,
  "ncs": 2,
  "defects": 0,
  "date_closed": "2026-XX-XX"
}
```

Este archivo es leído automáticamente por `gen-dashboard.js` al regenerar
el Dashboard Global. Sin este archivo, el sprint no aparecerá en las gráficas.

---

## Validación pre-entrega (gate PM)

```
☑ Los 10 archivos .docx existen y tienen > 0 KB
☑ Los 3 archivos .xlsx existen y tienen > 0 KB
☑ docs/sprints/SPRINT-[N]-data.json generado y válido
☑ Todos los documentos tienen portada, header y footer Experis
☑ Imágenes de diagramas no rotas (> 10 KB)
```

---

## Historial en producción

BankPortal · Banco Meridian:
- Sprints 2–16: **154 documentos generados** (2026-03-24)
- 16 Sprint data JSON disponibles para dashboard
- CMMI Level 3 activo desde Sprint 14

---

## Persistence Protocol

```
✅ PERSISTIDO — Documentation Agent · Sprint [N] · Step [3b/8]
   [Lista completa de archivos generados con rutas]
   docs/sprints/SPRINT-[N]-data.json          [CREADO]
   .sofia/session.json (completed_steps)      [ACTUALIZADO]
   .sofia/sofia.log                           [ENTRADA AÑADIDA]
```
