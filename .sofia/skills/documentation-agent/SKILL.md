---
name: documentation-agent
description: >
  Agente de generación de documentación formal de SOFIA — Software Factory IA de Experis.
  Produce entregables Word (.docx) y Excel (.xlsx) con estilo corporativo Experis.
  Activar cuando el usuario o el Orchestrator indiquen: generar documentación formal,
  delivery package, Sprint Report, Quality Dashboard, NC Tracker, HLD/LLD/SRS en Word,
  o cualquier artefacto CMMI en formato entregable.
  Puntos de activación en el pipeline:
  (A) Post-Gate 3 — SRS.docx + HLD.docx + LLD.docx
  (B) Post-Gate 5 — Quality-Dashboard.xlsx + NC-Tracker.xlsx + Test-Plan.xlsx
  (C) Cierre de sprint — Sprint-Report.docx + Risk-Register.docx + Sprint-Metrics.xlsx
  (D) On-demand — cualquier artefacto en cualquier momento
---

# Documentation Agent — SOFIA Software Factory

## Rol
Transformar los artefactos Markdown del pipeline en documentos formales entregables
al cliente (Word .docx / Excel .xlsx) con estilo corporativo Experis.

---

## Arquitectura — cómo funciona

`Filesystem:write_file` solo escribe texto. Los `.docx` y `.xlsx` son binarios ZIP.
La solución: el agente escribe **scripts generadores** al repo (texto ✅), y el
**git hook `post-commit`** los ejecuta automáticamente tras cada commit.

```
setup-sofia-mac.sh (una sola vez por máquina)
  ├── npm install -g docx          → disponible globalmente
  ├── pip install openpyxl         → disponible globalmente
  └── instala hooks/post-commit    → activo en el repo del proyecto

Documentation Agent (en cada sprint):
  ├── 1. Lee Markdown fuente del repo  (Filesystem:read_multiple_files)
  ├── 2. Escribe gen_word.js al repo   (Filesystem:write_file — texto ✅)
  ├── 3. Escribe gen_excel.py al repo  (Filesystem:write_file — texto ✅)
  └── 4. git commit (Git MCP)
           └── post-commit hook se dispara:
                 ├── node gen_word.js   → .docx en word/
                 └── python3 gen_excel.py → .xlsx en excel/
```

> **Prerequisito:** `setup-sofia-mac.sh` debe haberse ejecutado en la máquina.
> Para proyectos ya existentes sin el hook:
> `cp $SOFIA_DIR/hooks/post-commit .git/hooks/ && chmod +x .git/hooks/post-commit`

---

## Proceso paso a paso

### Paso 1 — Crear estructura del sprint
```
Filesystem:create_directory → docs/deliverables/sprint-[N]-[FEAT-XXX]/word/
Filesystem:create_directory → docs/deliverables/sprint-[N]-[FEAT-XXX]/excel/
```

### Paso 2 — Leer artefactos Markdown fuente

| Documento destino | Fuente en el repo |
|---|---|
| Sprint-Report.docx | `docs/sprints/SPRINT-XXX-report.md` |
| Risk-Register.docx | `docs/sprints/risk-register-*.md` |
| Release-Notes.docx | `docs/releases/RELEASE-vX.Y.Z.md` |
| SRS.docx | `docs/srs/SRS-FEAT-XXX-*.md` |
| HLD.docx | `docs/architecture/hld/HLD-FEAT-XXX-*.md` |
| LLD-backend.docx | `docs/architecture/lld/LLD-backend-*.md` |
| Quality-Dashboard.xlsx | `docs/qa/QA-FEAT-XXX-sprint*.md` |
| NC-Tracker.xlsx | `docs/code-review/CR-FEAT-XXX-*.md` |
| Sprint-Metrics.xlsx | `docs/sprints/SPRINT-XXX-report.md` |
| Velocity-Report.xlsx | todos los `SPRINT-*-report.md` |

### Paso 3 — Escribir gen_word.js al repo

```
Filesystem:write_file →
  path: docs/deliverables/sprint-[N]-[FEAT-XXX]/gen_word.js
  content: [script completo con datos embebidos — ver plantilla abajo]
```

### Paso 4 — Escribir gen_excel.py al repo

```
Filesystem:write_file →
  path: docs/deliverables/sprint-[N]-[FEAT-XXX]/gen_excel.py
  content: [script completo con datos embebidos — ver plantilla abajo]
```

### Paso 5 — Commit con Git MCP

```bash
git add docs/deliverables/sprint-[N]-[FEAT-XXX]/
git commit -m "docs(doc-agent): scripts delivery Sprint [N] — [FEAT-XXX]"
# El hook post-commit genera automáticamente los binarios
```

### Paso 6 — Segundo commit con los binarios

```bash
git add docs/deliverables/sprint-[N]-[FEAT-XXX]/word/
git add docs/deliverables/sprint-[N]-[FEAT-XXX]/excel/
git commit -m "docs(doc-agent): delivery package Sprint [N] binarios"
```

---

## Plantilla gen_word.js — helpers completos Experis

```javascript
// SOFIA Documentation Agent — gen_word.js
// Sprint [N] — [Proyecto] — [Cliente]
// Auto-ejecutado por .git/hooks/post-commit
'use strict';
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, LevelFormat, TabStopType
} = require('docx');
const fs   = require('fs');
const path = require('path');

const WORD_DIR = path.join(__dirname, 'word');
if (!fs.existsSync(WORD_DIR)) fs.mkdirSync(WORD_DIR, { recursive: true });

// ── Paleta Experis ──────────────────────────────────────────────────────────
const C = {
  BLUE:'1B3A6B', MED:'2E5F9E', LT:'4A7EC2', VL:'EBF3FB',
  WHITE:'FFFFFF', GRAY:'CCCCCC', GREEN:'C6EFCE', RED:'FFCCCC',
  YEL:'FFEB9C', GDK:'E2EFDA',
};
const bd   = { style: BorderStyle.SINGLE, size: 1, color: C.GRAY };
const BORD = { top: bd, bottom: bd, left: bd, right: bd };

// ── Helpers de contenido ────────────────────────────────────────────────────

/** Heading nivel 1-3 */
const H = (text, lv, color = C.BLUE) => new Paragraph({
  heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][lv - 1],
  children: [new TextRun({ text, font: 'Arial', size: [32, 26, 22][lv - 1], bold: true, color })],
  spacing: { before: lv === 1 ? 360 : 200, after: lv === 1 ? 120 : 80 },
});

/** Párrafo de cuerpo */
const P = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, font: 'Arial', size: 20, ...opts })],
  spacing: { after: 80 },
});

/** Bullet */
const BL = (text) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  children: [new TextRun({ text, font: 'Arial', size: 20 })],
  spacing: { after: 60 },
});

/** Párrafo vacío de separación */
const SP = () => new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } });

/** Salto de página */
const PB = () => new Paragraph({ children: [new PageBreak()], spacing: { before: 0, after: 0 } });

/** Celda de cabecera de tabla */
const HC = (text, w) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: { fill: C.BLUE, type: ShadingType.CLEAR },
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  verticalAlign: VerticalAlign.CENTER,
  borders: BORD,
  children: [new Paragraph({
    children: [new TextRun({ text, font: 'Arial', size: 19, bold: true, color: C.WHITE })],
  })],
});

/** Celda de datos de tabla */
const DC = (text, w, fill = C.WHITE, bold = false) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: { fill, type: ShadingType.CLEAR },
  margins: { top: 60, bottom: 60, left: 120, right: 120 },
  borders: BORD,
  children: [new Paragraph({
    children: [new TextRun({ text: String(text ?? ''), font: 'Arial', size: 19, bold })],
  })],
});

/** Color de estado para celdas — PASS/FAIL/WARN/etc. */
const SF = (s) => {
  const u = String(s).toUpperCase();
  if (u.includes('CERRADO') || u.includes('DONE') || u.includes('CLOSED')) return C.GDK;
  if (u.includes('APPROVED') || u.includes('ALCANZADO') || u.includes('PASS') || u.includes('✅')) return C.GREEN;
  if (u.includes('ABIERTO') || u.includes('PARCIAL') || u.includes('WARN') || u.includes('⚠')) return C.YEL;
  if (u.includes('FAIL') || u.includes('ERROR') || u.includes('❌')) return C.RED;
  return C.WHITE;
};

/** Tabla de metadata (2 columnas: clave | valor) */
const MT = (rows) => new Table({
  width: { size: 9026, type: WidthType.DXA },
  columnWidths: [2800, 6226],
  rows: rows.map(([k, v], i) => new TableRow({
    children: [
      DC(k, 2800, i % 2 === 0 ? C.VL : C.WHITE, true),
      DC(v, 6226, i % 2 === 0 ? C.VL : C.WHITE),
    ],
  })),
});

/** Header corporativo Experis */
const mkHDR = (proj) => ({
  default: new Header({
    children: [new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.BLUE, space: 1 } },
      children: [
        new TextRun({ text: 'EXPERIS  |  SOFIA Software Factory', font: 'Arial', size: 18, bold: true, color: C.BLUE }),
        new TextRun({ text: `\t${proj}`, font: 'Arial', size: 18, color: '444444' }),
      ],
      tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
    })],
  }),
});

/** Footer corporativo Experis con número de página */
const mkFTR = (date) => ({
  default: new Footer({
    children: [new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: C.BLUE, space: 1 } },
      children: [
        new TextRun({ text: 'Confidencial — Experis', font: 'Arial', size: 16, color: '666666' }),
        new TextRun({ text: '\tPágina ', font: 'Arial', size: 16, color: '666666' }),
        new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: '666666' }),
        new TextRun({ text: `\t${date}`, font: 'Arial', size: 16, color: '666666' }),
      ],
      tabStops: [
        { type: TabStopType.CENTER, position: 4513 },
        { type: TabStopType.RIGHT, position: 9026 },
      ],
    })],
  }),
});

/** Documento completo con estilos Experis */
const mkDoc = (proj, date, children) => new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Arial', size: 32, bold: true, color: C.BLUE },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Arial', size: 26, bold: true, color: C.MED },
        paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: 'Arial', size: 22, bold: true, color: C.LT },
        paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },    // A4
        margin: { top: 1270, right: 1270, bottom: 1270, left: 1270 },
      },
    },
    headers: mkHDR(proj),
    footers: mkFTR(date),
    children,
  }],
});

/** Guardar documento en word/ */
const save = async (doc, fname) => {
  const buf = await Packer.toBuffer(doc);
  const p   = path.join(WORD_DIR, fname);
  fs.writeFileSync(p, buf);
  console.log('  ✅', p);
};

// ── Documentos — rellenar con datos del sprint ──────────────────────────────

async function genSprintReport() {
  const doc = mkDoc('[Proyecto] — Sprint Report Sprint [N]', '[FECHA]', [
    H('Sprint Report — Sprint [N]', 1),
    MT([
      ['Proyecto', '[Proyecto]'],
      ['Sprint',   '[N] · [Fechas]'],
      ['Release',  'v[X.Y.Z]'],
      ['Estado',   '✅ ALCANZADO'],
    ]),
    SP(),
    H('Resumen de resultados', 2),
    // ... añadir tabla de métricas aquí
  ]);
  await save(doc, 'Sprint-Report-Sprint[N].docx');
}

async function genRiskRegister() {
  const doc = mkDoc('[Proyecto] — Risk Register', '[FECHA]', [
    H('Risk Register — Sprint [N]', 1),
    // ... riesgos del sprint
  ]);
  await save(doc, 'Risk-Register.docx');
}

async function genReleaseNotes() {
  const doc = mkDoc('[Proyecto] — Release Notes v[X.Y.Z]', '[FECHA]', [
    H('Release Notes — v[X.Y.Z]', 1),
    // ... notas del release
  ]);
  await save(doc, 'Release-Notes-v[X.Y.Z].docx');
}

(async () => {
  console.log('\n📄 SOFIA Documentation Agent — generando Word docs...');
  await genSprintReport();
  await genRiskRegister();
  await genReleaseNotes();
  console.log('✅ Word docs completados\n');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
```

---

## Plantilla gen_excel.py — helpers completos Experis

```python
# SOFIA Documentation Agent — gen_excel.py
# Sprint [N] — [Proyecto] — [Cliente]
# Auto-ejecutado por .git/hooks/post-commit

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.chart import BarChart, Reference
from pathlib import Path

EXCEL_DIR = Path(__file__).parent / 'excel'
EXCEL_DIR.mkdir(exist_ok=True)

# ── Paleta Experis ──────────────────────────────────────────────────────────
BLUE = '1B3A6B'; VL = 'EBF3FB'; GPASS = 'C6EFCE'; GDONE = 'E2EFDA'
RED  = 'FFCCCC'; YEL  = 'FFEB9C'; WHITE  = 'FFFFFF'; GRAY  = 'CCCCCC'

# ── Helpers de estilo ───────────────────────────────────────────────────────
def side():   return Side(style='thin', color=GRAY)
def brd():    return Border(left=side(), right=side(), top=side(), bottom=side())
def hfont(size=11):  return Font(name='Arial', bold=True, color=WHITE, size=size)
def dfont(bold=False, color='000000', size=10):
    return Font(name='Arial', size=size, bold=bold, color=color)
def hfill():  return PatternFill('solid', fgColor=BLUE)
def afill():  return PatternFill('solid', fgColor=VL)
def wfill():  return PatternFill('solid', fgColor=WHITE)
def sfill(s):
    """Color por estado — PASS/FAIL/WARN/DONE/OPEN"""
    u = str(s).upper()
    if any(k in u for k in ('PASS','OK','DONE','APPROVED','CUMPLE','CERRADO','✅')): return PatternFill('solid', fgColor=GPASS)
    if any(k in u for k in ('FAIL','ERROR','❌')):                                   return PatternFill('solid', fgColor=RED)
    if any(k in u for k in ('BLOCKED','OPEN','WARN','ABIERTO','PARCIAL','⚠')):       return PatternFill('solid', fgColor=YEL)
    return wfill()
def cc():     return Alignment(horizontal='center', vertical='center', wrap_text=True)
def lc():     return Alignment(horizontal='left',   vertical='top',    wrap_text=True)

def ap(cell, font=None, fill=None, align=None, fmt=None):
    """Aplicar estilos a una celda"""
    if font:  cell.font      = font
    if fill:  cell.fill      = fill
    if align: cell.alignment = align
    if fmt:   cell.number_format = fmt
    cell.border = brd()

def title(ws, row, text, ncols):
    """Título fusionado con fondo Experis azul"""
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=ncols)
    c = ws.cell(row=row, column=1, value=text)
    ap(c, hfont(13), hfill(), cc())
    ws.row_dimensions[row].height = 28

def subtitle(ws, row, text, ncols):
    """Subtítulo con fondo claro"""
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=ncols)
    c = ws.cell(row=row, column=1, value=text)
    ap(c, dfont(bold=True), afill(), cc())
    ws.row_dimensions[row].height = 18

def hrow(ws, row, cols):
    """Fila de cabecera: [(texto, ancho_col)]"""
    for i, (text, width) in enumerate(cols, 1):
        c = ws.cell(row=row, column=i, value=text)
        ap(c, hfont(), hfill(), cc())
        ws.column_dimensions[get_column_letter(i)].width = width
    ws.row_dimensions[row].height = 22

def drow(ws, row, vals, alt=False, status_cols=None):
    """Fila de datos — status_cols: set de índices (1-based) con color por estado"""
    f = afill() if alt else wfill()
    for i, v in enumerate(vals, 1):
        c = ws.cell(row=row, column=i, value=v)
        use = sfill(v) if status_cols and i in status_cols else f
        ap(c, dfont(), use, lc())
    ws.row_dimensions[row].height = 18

def total_row(ws, row, vals, ncols_blank=0):
    """Fila de totales con fondo azul"""
    for i, v in enumerate(vals, 1):
        c = ws.cell(row=row, column=i, value=v)
        ap(c, hfont(10), hfill(), cc())
    ws.row_dimensions[row].height = 22

# ── Documentos — rellenar con datos del sprint ──────────────────────────────

def build_sprint_metrics():
    wb = Workbook(); ws = wb.active; ws.title = 'Sprint Metrics'
    ws.sheet_view.showGridLines = False
    title(ws, 1, 'Sprint Metrics — Sprint [N] — [Proyecto] — [Cliente]', 5)
    hrow(ws, 3, [('Métrica', 30), ('Planificado', 14), ('Real', 14), ('Δ', 14), ('Estado', 18)])
    # ... datos de métricas
    wb.save(EXCEL_DIR / 'Sprint-Metrics-Sprint[N].xlsx')
    print('  ✅', EXCEL_DIR / 'Sprint-Metrics-Sprint[N].xlsx')

def build_quality_dashboard():
    wb = Workbook(); ws = wb.active; ws.title = 'Quality Dashboard'
    ws.sheet_view.showGridLines = False
    title(ws, 1, 'Quality Dashboard — Sprint [N] — [Proyecto]', 6)
    hrow(ws, 3, [('TC ID', 12), ('US', 12), ('Escenario', 38), ('Tipo', 12), ('Resultado', 14), ('Notas', 24)])
    # ... TCs del QA report
    wb.save(EXCEL_DIR / 'Quality-Dashboard-Sprint[N].xlsx')
    print('  ✅', EXCEL_DIR / 'Quality-Dashboard-Sprint[N].xlsx')

def build_nc_tracker():
    wb = Workbook(); ws = wb.active; ws.title = 'NC Tracker'
    ws.sheet_view.showGridLines = False
    title(ws, 1, 'NC Tracker — [Proyecto] — Todos los Sprints', 7)
    hrow(ws, 3, [('NC ID', 12), ('Sprint', 10), ('Severidad', 12), ('Archivo', 30),
                  ('Descripción', 38), ('Causa Raíz', 28), ('Estado', 14)])
    # ... NCs del CR report
    wb.save(EXCEL_DIR / 'NC-Tracker.xlsx')
    print('  ✅', EXCEL_DIR / 'NC-Tracker.xlsx')

def build_velocity_report():
    wb = Workbook(); ws = wb.active; ws.title = 'Velocity'
    ws.sheet_view.showGridLines = False
    title(ws, 1, 'Velocity Report — [Proyecto] — Todos los Sprints', 8)
    hrow(ws, 3, [('Sprint', 10), ('Período', 22), ('SP Plan.', 10), ('SP Real', 10),
                  ('% Compl.', 10), ('NCs CR', 12), ('Def. QA', 10), ('Release', 12)])
    # ... datos de velocidad acumulada
    wb.save(EXCEL_DIR / 'Velocity-Report.xlsx')
    print('  ✅', EXCEL_DIR / 'Velocity-Report.xlsx')

if __name__ == '__main__':
    print('\n📊 SOFIA Documentation Agent — generando Excel docs...')
    build_sprint_metrics()
    build_quality_dashboard()
    build_nc_tracker()
    build_velocity_report()
    print('✅ Excel docs completados\n')
```

---

## Estilo corporativo Experis

### Colores Word / Excel
| Elemento | HEX |
|---|---|
| Cabecera H1 / tabla header | `1B3A6B` |
| Cabecera H2 | `2E5F9E` |
| Cabecera H3 | `4A7EC2` |
| Filas alternadas | `EBF3FB` |
| PASS / OK / APPROVED / CERRADO | `C6EFCE` |
| FAIL / ERROR | `FFCCCC` |
| WARNING / OPEN / BLOCKED | `FFEB9C` |
| DONE / CLOSED | `E2EFDA` |

### Reglas críticas docx-js
- `WidthType.DXA` siempre — nunca `PERCENTAGE`
- `ShadingType.CLEAR` siempre — nunca `SOLID`
- Nunca unicode bullets — usar `LevelFormat.BULLET`
- Tablas: `columnWidths` en tabla Y `width` en cada celda
- Página A4: `width:11906, height:16838`, márgenes `1270` DXA
- `PageBreak` siempre dentro de un `Paragraph`

### Reglas críticas openpyxl
- Totales y promedios como fórmulas Excel (`=SUM(...)`) — nunca hardcodeados en Python
- `showGridLines = False` en todas las hojas
- Primera fila: título fusionando todas las columnas con `merge_cells`
- Ajustar anchos de columna con `column_dimensions[col].width`

---

## Directorio de salida

```
docs/deliverables/sprint-[N]-[FEAT-XXX]/
├── gen_word.js      ← escrito por este agente (texto)
├── gen_excel.py     ← escrito por este agente (texto)
├── word/            ← .docx generados por el hook post-commit
└── excel/           ← .xlsx generados por el hook post-commit
```

---

## Checklist de entrega

```
□ Markdown fuente leídos y datos extraídos
□ gen_word.js escrito al repo con datos del sprint embebidos
□ gen_excel.py escrito al repo con datos del sprint embebidos
□ git commit realizado → hook dispara generación automática
□ word/ y excel/ contienen los binarios generados
□ Segundo commit con los binarios
□ Rutas reportadas al usuario
```

---

## Mensaje de cierre al usuario

```markdown
## 📄 Documentation Agent — Delivery Package Sprint [N]

**Proyecto:** [nombre] · **Sprint:** [N] · **Versión:** v[X.Y.Z]
**Directorio:** docs/deliverables/sprint-[N]-[FEAT-XXX]/

| Documento | Tipo | Estado |
|---|---|---|
| Sprint-Report-Sprint[N].docx | Word | ✅ |
| Risk-Register.docx | Word | ✅ |
| Release-Notes-v[X.Y.Z].docx | Word | ✅ |
| Quality-Dashboard-Sprint[N].xlsx | Excel | ✅ |
| NC-Tracker.xlsx | Excel | ✅ |
| Sprint-Metrics-Sprint[N].xlsx | Excel | ✅ |
| Velocity-Report.xlsx | Excel | ✅ |

Generados automáticamente vía post-commit hook.
```


---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

**Este skill DEBE ejecutar los siguientes pasos antes de retornar al Orchestrator.**
Ver protocolo completo en `.sofia/PERSISTENCE_PROTOCOL.md`.

### Al INICIAR

```
1. Leer .sofia/session.json
2. Escribir en sofia.log:
   [TIMESTAMP] [STEP-3b] [documentation-agent] STARTED → descripción breve
3. Actualizar session.json: status = "in_progress", pipeline_step = "3b", updated_at = now
```

### Al COMPLETAR

```javascript
const fs  = require('fs');
const now = new Date().toISOString();

// 1. Actualizar session.json
const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
const step = '3b';
if (!session.completed_steps.includes(step)) session.completed_steps.push(step);
session.pipeline_step          = step;
session.pipeline_step_name     = 'documentation-agent';
session.last_skill             = 'documentation-agent';
session.last_skill_output_path = 'docs/deliverables/';
session.updated_at             = now;
session.status                 = 'completed'; // o 'gate_pending' si hay gate
if (!session.artifacts) session.artifacts = {};
session.artifacts[step]        = [ /* rutas de artefactos generados */ ];
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

// 2. Escribir en sofia.log (append-only)
const logEntry = `[${now}] [STEP-3b] [documentation-agent] COMPLETED → docs/deliverables/ | <detalles>\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

// 3. Crear snapshot
const snapPath = `.sofia/snapshots/step-3b-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación — incluir al final de cada respuesta

```
---
✅ PERSISTENCE CONFIRMED — DOCUMENTATION_AGENT STEP-3b
- session.json: updated (step 3b added to completed_steps)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-3b-[timestamp].json
- artifacts:
  · docs/deliverables/<artefacto-principal>
---
```

> Si este skill **no** genera artefactos de fichero (ej: atlassian-agent opera
> sobre Jira/Confluence), usar las URLs o IDs de los recursos creados/actualizados.
