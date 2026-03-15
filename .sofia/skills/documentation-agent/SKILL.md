---
name: documentation-agent
description: >
  Agente de generación de documentación formal de SOFIA — Software Factory IA de Experis.
  Produce artefactos entregables al cliente en formato Word (.docx) y Excel (.xlsx) con
  estilo corporativo Experis, a partir de los artefactos Markdown generados por los demás
  agentes del pipeline. SIEMPRE activa esta skill cuando el usuario o el Orchestrator
  indiquen: generar documentación formal, producir entregables Word o Excel, empaquetar
  documentos para el cliente, generar delivery package, crear Sprint Report formal,
  generar Quality Dashboard, NC Tracker, o cuando se pida convertir artefactos CMMI
  a formato entregable. Se activa en 4 momentos del pipeline:
  (A) Post-Gate 3 — HLD/LLD aprobado → SRS.docx + HLD.docx + LLD.docx
  (B) Post-Gate 5 — QA aprobado → Quality Dashboard.xlsx + NC Tracker.xlsx + Test Plan.xlsx
  (C) Cierre de sprint — junto con Sprint Report SM → Sprint Report.docx + Risk Register.docx + Sprint Metrics.xlsx
  (D) On-demand — el usuario lo pide explícitamente para cualquier artefacto
---

# Documentation Agent — SOFIA Software Factory

## Rol
Transformar los artefactos Markdown del pipeline SOFIA en documentos formales
entregables al cliente. Opera sobre los archivos generados por SM, Requirements,
Architect, QA y DevOps para producir documentos Word y Excel con estilo corporativo
Experis listos para presentar a Banco Meridian o cualquier cliente.

---

## Puntos de activación en el pipeline

```
PIPELINE SOFIA
  │
  ├── [1] SM / Planning
  ├── [2] Requirements Analyst
  ├── [3] Architect ──────────────────► [A] Post-Gate 3
  │         Gate 3 aprobado                SRS.docx
  │                                        HLD.docx
  │                                        LLD-backend.docx
  │                                        LLD-frontend.docx
  ├── [4] Developer
  ├── [5] Code Reviewer
  ├── [6] QA ─────────────────────────► [B] Post-Gate 5
  │         Gate 5 aprobado                Quality-Dashboard.xlsx
  │                                        NC-Tracker.xlsx
  │                                        Test-Plan.xlsx
  ├── [7] DevOps
  └── [8] SM cierre ───────────────────► [C] Cierre de sprint
            Sprint cerrado                 Sprint-Report.docx
                                           Risk-Register.docx
                                           Release-Notes.docx
                                           Sprint-Metrics.xlsx
                                           Velocity-Report.xlsx

  [D] On-demand: cualquier artefacto en cualquier momento
```

---

## Estilo corporativo Experis

### Paleta de colores Word

| Uso | Color | HEX |
|---|---|---|
| Encabezados H1 | Azul Experis | `#1B3A6B` |
| Encabezados H2 | Azul medio | `#2E5F9E` |
| Encabezados H3 | Azul claro | `#4A7EC2` |
| Filas de cabecera tabla | Azul Experis | `#1B3A6B` |
| Filas alternadas tabla | Azul muy claro | `#EBF3FB` |
| Texto cabecera tabla | Blanco | `#FFFFFF` |
| Borde tabla | Gris claro | `#CCCCCC` |
| Texto normal | Negro | `#000000` |
| Texto secundario | Gris oscuro | `#444444` |

### Paleta de colores Excel

| Uso | HEX |
|---|---|
| Cabecera principal | `1B3A6B` (azul Experis) |
| Cabecera secundaria | `2E5F9E` |
| Filas alternadas | `EBF3FB` |
| Estado PASS / OK | `C6EFCE` (verde claro) |
| Estado FAIL / ERROR | `FFCCCC` (rojo claro) |
| Estado WARNING / OPEN | `FFEB9C` (amarillo) |
| Estado CLOSED / DONE | `E2EFDA` (verde muy claro) |

### Tipografía
- **Fuente:** Arial (universal, soporte garantizado)
- **Tamaño cuerpo:** 11pt
- **H1:** 16pt bold · H2: 13pt bold · H3: 11pt bold
- **Cabeceras tabla:** 10pt bold blanco sobre fondo azul Experis

### Página (Word)
- **Tamaño:** A4 (11906 × 16838 DXA) con márgenes de 1270 DXA (≈ 2.2 cm)
- **Encabezado:** Logo Experis (texto si no hay imagen) + nombre del proyecto a la derecha
- **Pie de página:** Confidencial — Experis | Página N de M | Fecha

---

## Proceso de generación

### Paso 1 — Identificar artefactos fuente
Localizar los Markdown en el repo que corresponden al documento a generar:

```
DOCUMENTO DESTINO           FUENTE(S) EN EL REPO
────────────────────────────────────────────────────────────────────
SRS.docx                    docs/srs/SRS-FEAT-XXX-*.md
HLD.docx                    docs/architecture/hld/HLD-FEAT-XXX-*.md
LLD-backend.docx            docs/architecture/lld/LLD-backend-*.md
LLD-frontend.docx           docs/architecture/lld/LLD-frontend-*.md
Sprint-Report.docx          docs/sprints/SPRINT-XXX-report.md
Risk-Register.docx          docs/sprints/risk-register.md
Release-Notes.docx          docs/releases/RELEASE-vX.Y.Z.md
Quality-Dashboard.xlsx      docs/qa/QA-FEAT-XXX-sprint*.md
NC-Tracker.xlsx             docs/code-review/CR-FEAT-XXX-*.md
Test-Plan.xlsx              docs/qa/QA-FEAT-XXX-sprint*.md
Sprint-Metrics.xlsx         docs/sprints/SPRINT-XXX-report.md
Velocity-Report.xlsx        docs/sprints/SPRINT-*-report.md (todos)
```

### Paso 2 — Leer skill docx / xlsx según tipo de documento
- Para Word: seguir las instrucciones de `/mnt/skills/public/docx/SKILL.md`
  - Usar `docx` npm con la configuración de estilos Experis definida abajo
  - Validar con `python scripts/office/validate.py` después de generar
- Para Excel: seguir las instrucciones de `/mnt/skills/public/xlsx/SKILL.md`
  - Usar `openpyxl` con la paleta de colores Experis definida abajo
  - Ejecutar `python scripts/recalc.py` para verificar fórmulas

### Paso 3 — Generar el documento con estilo Experis
Usar las plantillas de código de las secciones siguientes.

### Paso 4 — Depositar en la carpeta correcta
```
docs/deliverables/sprint-[N]-[FEAT-XXX]/
├── word/
│   ├── SRS-FEAT-XXX.docx
│   ├── HLD-FEAT-XXX.docx
│   ├── LLD-backend-FEAT-XXX.docx
│   ├── LLD-frontend-FEAT-XXX.docx
│   ├── Sprint-Report-Sprint[N].docx
│   ├── Risk-Register.docx
│   └── Release-Notes-vX.Y.Z.docx
└── excel/
    ├── Quality-Dashboard-Sprint[N].xlsx
    ├── NC-Tracker-Sprint[N].xlsx
    ├── Test-Plan-Sprint[N].xlsx
    ├── Sprint-Metrics-Sprint[N].xlsx
    └── Velocity-Report.xlsx
```

### Paso 5 — Commit
```bash
git add docs/deliverables/
git commit -m "docs(documentation-agent): delivery package Sprint [N] — [FEAT-XXX]"
```

---

## Plantilla Word — configuración base Experis (docx npm)

```javascript
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  LevelFormat
} = require('docx');
const fs = require('fs');

// ─── Paleta Experis ────────────────────────────────────────────────────────
const BLUE_EXPERIS   = '1B3A6B';
const BLUE_MEDIUM    = '2E5F9E';
const BLUE_LIGHT     = '4A7EC2';
const BLUE_VERY_LIGHT = 'EBF3FB';
const WHITE          = 'FFFFFF';
const BORDER_GRAY    = 'CCCCCC';

// ─── Estilos base ──────────────────────────────────────────────────────────
const experisStyles = {
  default: {
    document: { run: { font: 'Arial', size: 22 } }  // 11pt = 22 half-points
  },
  paragraphStyles: [
    {
      id: 'Heading1', name: 'Heading 1',
      basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run:  { font: 'Arial', size: 32, bold: true, color: BLUE_EXPERIS },
      paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 }
    },
    {
      id: 'Heading2', name: 'Heading 2',
      basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run:  { font: 'Arial', size: 26, bold: true, color: BLUE_MEDIUM },
      paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 }
    },
    {
      id: 'Heading3', name: 'Heading 3',
      basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run:  { font: 'Arial', size: 22, bold: true, color: BLUE_LIGHT },
      paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 2 }
    },
    {
      id: 'TableHeader', name: 'Table Header',
      basedOn: 'Normal',
      run: { font: 'Arial', size: 20, bold: true, color: WHITE }
    }
  ]
};

// ─── Header / Footer estándar ──────────────────────────────────────────────
function createHeader(projectName) {
  return {
    default: new Header({
      children: [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6,
                              color: BLUE_EXPERIS, space: 1 } },
          children: [
            new TextRun({ text: 'EXPERIS  |  SOFIA Software Factory',
                          font: 'Arial', size: 18, bold: true, color: BLUE_EXPERIS }),
            new TextRun({ text: `\t${projectName}`,
                          font: 'Arial', size: 18, color: '444444' })
          ],
          tabStops: [{ type: 'right', position: 9026 }]
        })
      ]
    })
  };
}

function createFooter() {
  return {
    default: new Footer({
      children: [
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 6,
                           color: BLUE_EXPERIS, space: 1 } },
          children: [
            new TextRun({ text: 'Confidencial — Experis',
                          font: 'Arial', size: 16, color: '666666' }),
            new TextRun({ text: '\tPágina ', font: 'Arial', size: 16, color: '666666' }),
            new TextRun({ children: [new PageNumber()],
                          font: 'Arial', size: 16, color: '666666' }),
            new TextRun({ text: `\t${new Date().toLocaleDateString('es-ES')}`,
                          font: 'Arial', size: 16, color: '666666' })
          ],
          tabStops: [
            { type: 'center', position: 4513 },
            { type: 'right',  position: 9026 }
          ]
        })
      ]
    })
  };
}

// ─── Helper: fila de tabla con estilo Experis ──────────────────────────────
function headerRow(texts, columnWidths) {
  return new TableRow({
    tableHeader: true,
    children: texts.map((text, i) =>
      new TableCell({
        width: { size: columnWidths[i], type: WidthType.DXA },
        shading: { fill: BLUE_EXPERIS, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
          left:   { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
          right:  { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
        },
        children: [new Paragraph({
          children: [new TextRun({ text, font: 'Arial', size: 20,
                                   bold: true, color: WHITE })]
        })]
      })
    )
  });
}

function dataRow(texts, columnWidths, isAlt = false) {
  const fill = isAlt ? BLUE_VERY_LIGHT : WHITE;
  return new TableRow({
    children: texts.map((text, i) =>
      new TableCell({
        width: { size: columnWidths[i], type: WidthType.DXA },
        shading: { fill, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
          left:   { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
          right:  { style: BorderStyle.SINGLE, size: 1, color: BORDER_GRAY },
        },
        children: [new Paragraph({
          children: [new TextRun({ text: String(text ?? ''), font: 'Arial', size: 20 })]
        })]
      })
    )
  });
}

// ─── Plantilla de documento vacío ─────────────────────────────────────────
function createExpresisDoc(projectName, children) {
  return new Document({
    styles: experisStyles,
    numbering: {
      config: [
        { reference: 'bullets',
          levels: [{ level: 0, format: LevelFormat.BULLET, text: '•',
                     alignment: AlignmentType.LEFT,
                     style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },  // A4
          margin: { top: 1270, right: 1270, bottom: 1270, left: 1270 }
        }
      },
      headers: createHeader(projectName),
      footers: createFooter(),
      children
    }]
  });
}

// ─── Generar y guardar ─────────────────────────────────────────────────────
async function saveDoc(doc, outputPath) {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Documento generado: ${outputPath}`);
}
```

---

## Plantilla Excel — configuración base Experis (openpyxl)

```python
from openpyxl import Workbook
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side, numbers
)
from openpyxl.utils import get_column_letter

# ─── Paleta Experis ──────────────────────────────────────────────────────
BLUE_EXPERIS    = '1B3A6B'
BLUE_MEDIUM     = '2E5F9E'
BLUE_VERY_LIGHT = 'EBF3FB'
GREEN_PASS      = 'C6EFCE'
RED_FAIL        = 'FFCCCC'
YELLOW_WARN     = 'FFEB9C'
GREEN_DONE      = 'E2EFDA'
WHITE           = 'FFFFFF'

def header_style():
    """Estilo de cabecera: azul Experis, texto blanco bold Arial 11."""
    return {
        'font':      Font(name='Arial', bold=True, color=WHITE, size=11),
        'fill':      PatternFill('solid', fgColor=BLUE_EXPERIS),
        'alignment': Alignment(horizontal='center', vertical='center', wrap_text=True),
        'border':    thin_border(),
    }

def subheader_style():
    return {
        'font':      Font(name='Arial', bold=True, color=WHITE, size=10),
        'fill':      PatternFill('solid', fgColor=BLUE_MEDIUM),
        'alignment': Alignment(horizontal='center', vertical='center'),
        'border':    thin_border(),
    }

def data_style(alt_row=False):
    fill_color = BLUE_VERY_LIGHT if alt_row else WHITE
    return {
        'font':      Font(name='Arial', size=10),
        'fill':      PatternFill('solid', fgColor=fill_color),
        'alignment': Alignment(vertical='top', wrap_text=True),
        'border':    thin_border(),
    }

def status_style(status: str):
    """Retorna estilo según estado: PASS/FAIL/OPEN/DONE/WARNING."""
    color_map = {
        'PASS': GREEN_PASS, 'OK': GREEN_PASS, 'DONE': GREEN_DONE,
        'FAIL': RED_FAIL, 'ERROR': RED_FAIL,
        'OPEN': YELLOW_WARN, 'WARNING': YELLOW_WARN, 'BLOCKED': YELLOW_WARN,
        'CLOSED': GREEN_DONE, 'APPROVED': GREEN_PASS,
    }
    fill_color = color_map.get(status.upper(), WHITE)
    return {
        'font':      Font(name='Arial', size=10, bold=True),
        'fill':      PatternFill('solid', fgColor=fill_color),
        'alignment': Alignment(horizontal='center', vertical='center'),
        'border':    thin_border(),
    }

def thin_border():
    side = Side(style='thin', color='CCCCCC')
    return Border(left=side, right=side, top=side, bottom=side)

def apply_style(cell, style: dict):
    for attr, value in style.items():
        setattr(cell, attr, value)

def set_col_widths(sheet, widths: dict):
    """widths: {'A': 20, 'B': 35, ...}"""
    for col, width in widths.items():
        sheet.column_dimensions[col].width = width

def add_header_row(sheet, row_num: int, headers: list[str]):
    for col, text in enumerate(headers, 1):
        cell = sheet.cell(row=row_num, column=col, value=text)
        apply_style(cell, header_style())

def add_data_row(sheet, row_num: int, values: list, alt: bool = False):
    for col, val in enumerate(values, 1):
        cell = sheet.cell(row=row_num, column=col, value=val)
        apply_style(cell, data_style(alt))

def add_title(sheet, title: str, subtitle: str = ''):
    sheet.merge_cells(f'A1:{get_column_letter(sheet.max_column or 10)}1')
    cell = sheet['A1']
    cell.value = title
    cell.font  = Font(name='Arial', bold=True, size=14, color=WHITE)
    cell.fill  = PatternFill('solid', fgColor=BLUE_EXPERIS)
    cell.alignment = Alignment(horizontal='center', vertical='center')
    sheet.row_dimensions[1].height = 28
    if subtitle:
        sheet.merge_cells(f'A2:{get_column_letter(sheet.max_column or 10)}2')
        cell2 = sheet['A2']
        cell2.value = subtitle
        cell2.font  = Font(name='Arial', size=10, italic=True, color='444444')
        cell2.fill  = PatternFill('solid', fgColor=BLUE_VERY_LIGHT)
        cell2.alignment = Alignment(horizontal='center')
```

---

## Documentos Word que produce

### A1 — SRS.docx (post-Gate 3)
**Fuente:** `docs/srs/SRS-FEAT-XXX-*.md`

Estructura del documento:
```
Portada: Título, cliente, fecha, versión, estado
1. Metadata y control de versiones
2. Descripción del sistema / contexto
3. Alcance (incluido / excluido)
4. Épica
5. User Stories (tabla resumen + detalle con Gherkin por US)
6. Requerimientos No Funcionales (tabla baseline + tabla delta)
7. Restricciones (tabla)
8. Supuestos y dependencias (tablas)
9. Matriz de Trazabilidad RTM (tabla completa)
10. Definición de Hecho (checklist formateado)
```

### A2 — HLD.docx (post-Gate 3)
**Fuente:** `docs/architecture/hld/HLD-FEAT-XXX-*.md`

Estructura:
```
Portada con metadata
1. Análisis de impacto en monorepo (tabla)
2. Contexto del sistema C4 L1 (diagrama Mermaid como imagen SVG → PNG embebida)
3. Contenedores C4 L2 (ídem)
4. Flujos principales (texto estructurado)
5. Servicios nuevos/modificados (tabla)
6. Contrato de integración backend ↔ frontend (tabla endpoints)
7. Decisiones técnicas — referencia a ADRs (tabla)
```

### A3 — LLD-backend.docx / LLD-frontend.docx (post-Gate 3)
**Fuente:** `docs/architecture/lld/LLD-*.md`

Estructura:
```
Portada con metadata
1. Estructura de módulo (bloque de código con fuente monospace)
2. Diagrama de clases (imagen)
3. Diagrama de secuencia por flujo crítico (imagen)
4. Modelo de datos ER (imagen)
5. Contrato OpenAPI — endpoints en tabla
6. Estrategia de datos (tabla)
7. Variables de entorno (tabla)
8. Dependencias clave (lista)
```

> **Nota sobre diagramas Mermaid:** Renderizar con `mmdc -i diagrama.mmd -o diagrama.png`
> (Mermaid CLI) antes de embeberlos en el Word. Si no está disponible, incluir el texto
> del diagrama en un bloque de código formateado en monospace.

### B3 / C1 — Sprint-Report.docx (cierre de sprint)
**Fuente:** `docs/sprints/SPRINT-XXX-report.md`

Estructura:
```
Portada con metadata sprint
1. Sprint Goal y estado (texto destacado)
2. Resumen de resultados (tabla comparativa planificado vs real)
3. Velocidad y métricas (tabla + gráfico de barras si hay datos históricos)
4. Estado por User Story (tabla con semáforos de color)
5. Gates completados (tabla)
6. NCs gestionadas (tabla con estado)
7. Riesgos — cambios en el sprint (tabla)
8. Deuda técnica generada (tabla)
9. Proyección próximo sprint
Firma: SM | Fecha | Estado del documento
```

### C2 — Risk-Register.docx (cierre de sprint)
**Fuente:** `docs/sprints/risk-register.md`

Tabla principal con semáforos de color por exposición (🔴🟠🟡🟢) usando celdas coloreadas.

### C3 — Release-Notes.docx (cierre de sprint)
**Fuente:** `docs/releases/RELEASE-vX.Y.Z.md`

Documento formal de release con tabla de cambios, breaking changes destacados
en recuadro amarillo, e instrucciones de despliegue en monospace.

---

## Hojas Excel que produce

### B1 — Quality-Dashboard.xlsx (post-Gate 5)
**Fuente:** `docs/qa/QA-FEAT-XXX-sprint*.md`

Hojas:
1. **Resumen** — tabla de cobertura total, métricas clave, indicadores de semáforo
2. **Ejecución** — todos los TCs con estado PASS/FAIL/BLOCKED en color
3. **Defectos** — tabla de defectos con severidad, estado, responsable
4. **PCI-DSS** — checklist de cumplimiento por requisito

```python
# Ejemplo: hoja de ejecución con TCs coloreados por estado
def build_execution_sheet(wb, tcs: list[dict]):
    ws = wb.create_sheet('Ejecución TCs')
    add_title(ws, 'Ejecución de Casos de Prueba', f'Generado: {date.today()}')
    headers = ['TC ID', 'US', 'Descripción', 'Nivel', 'Tipo', 'Prioridad', 'Estado', 'Evidencia']
    add_header_row(ws, 3, headers)
    for i, tc in enumerate(tcs):
        row = i + 4
        alt = i % 2 == 1
        add_data_row(ws, row,
            [tc['id'], tc['us'], tc['desc'], tc['nivel'],
             tc['tipo'], tc['prioridad'], tc['estado'], tc.get('evidencia', '')],
            alt=alt)
        # Colorear celda de estado
        status_cell = ws.cell(row=row, column=7)
        apply_style(status_cell, status_style(tc['estado']))
    set_col_widths(ws, {'A': 12, 'B': 8, 'C': 45, 'D': 15, 'E': 15, 'F': 12, 'G': 10, 'H': 25})
```

### B2 — NC-Tracker.xlsx (post-Gate 5)
**Fuente:** `docs/code-review/CR-FEAT-XXX-*.md`

Hojas:
1. **NCs Abiertas** — tabla con severidad, archivo, descripción, corrección sugerida, asignado, SLA
2. **NCs Cerradas** — histórico de NCs resueltas con fecha de cierre
3. **Métricas** — total por severidad, tiempo medio resolución

Fórmulas Excel dinámicas:
```
=COUNTIF(NCs_Abiertas!G:G,"BLOQUEANTE")  → total bloqueantes
=COUNTIF(NCs_Abiertas!G:G,"CERRADO")     → total cerradas
=AVERAGEIF(NCs_Cerradas!H:H,"<>",NCs_Cerradas!H:H)  → tiempo medio resolución
```

### B3 — Test-Plan.xlsx (post-Gate 5)
**Fuente:** `docs/qa/QA-FEAT-XXX-sprint*.md`

Hojas:
1. **Plan** — User Stories en scope, criterios de salida, equipo
2. **Casos de Prueba** — todos los TCs con precondiciones, pasos, resultado esperado
3. **Cobertura Gherkin** — mapa US → scenarios → TCs
4. **Seguridad** — checklist OWASP por stack
5. **Accesibilidad** — checklist WCAG 2.1 AA

### C4 — Sprint-Metrics.xlsx (cierre de sprint)
**Fuente:** `docs/sprints/SPRINT-XXX-report.md`

Hojas:
1. **Resumen Sprint** — tabla comparativa planificado vs real, velocidad, defectos, NCs
2. **Burndown** — gráfico de burndown (fórmulas dinámicas con datos de la tabla)
3. **WIP Flow** — tiempos en cada columna del tablero

```python
# Ejemplo: tabla de resumen con fórmulas dinámicas
def build_sprint_summary(ws, sprint_data: dict):
    add_title(ws, f"Sprint {sprint_data['number']} — Resumen", sprint_data['goal'])
    headers = ['Métrica', 'Planificado', 'Real', 'Variación', 'Estado']
    add_header_row(ws, 3, headers)
    metrics = [
        ('Story Points', sprint_data['sp_planned'], sprint_data['sp_actual']),
        ('US Completadas', sprint_data['us_planned'], sprint_data['us_actual']),
        ('Defectos QA', 0, sprint_data['defects']),
        ('NCs Code Review', 0, sprint_data['ncs']),
    ]
    for i, (name, planned, actual) in enumerate(metrics):
        row = i + 4
        ws.cell(row=row, column=1, value=name)
        ws.cell(row=row, column=2, value=planned)
        ws.cell(row=row, column=3, value=actual)
        ws.cell(row=row, column=4, value=f'=C{row}-B{row}')  # fórmula Excel
        ws.cell(row=row, column=5, value=f'=IF(C{row}<=B{row},"OK","WARNING")')
        # colorear estado con formato condicional (via status_style manual)
        status_val = 'OK' if actual <= planned else 'WARNING'
        apply_style(ws.cell(row=row, column=5), status_style(status_val))
```

### C5 — Velocity-Report.xlsx (cierre de sprint — acumulativo)
**Fuente:** `docs/sprints/SPRINT-*-report.md` (todos los sprints del proyecto)

Hojas:
1. **Velocidad** — tabla histórica sprint a sprint + fórmula de promedio móvil
2. **Gráfico** — gráfico de barras de velocidad por sprint (openpyxl BarChart)
3. **Proyección** — estimación de sprints restantes basada en velocidad media

```python
from openpyxl.chart import BarChart, Reference

def add_velocity_chart(ws, data_rows: int):
    chart = BarChart()
    chart.type = 'col'
    chart.title = 'Velocidad por Sprint'
    chart.y_axis.title = 'Story Points'
    chart.x_axis.title = 'Sprint'
    chart.style = 10
    data = Reference(ws, min_col=2, min_row=3, max_row=3 + data_rows)
    cats = Reference(ws, min_col=1, min_row=4, max_row=3 + data_rows)
    chart.add_data(data, titles_from_data=True)
    chart.set_categories(cats)
    chart.shape = 4
    chart.width  = 20
    chart.height = 12
    ws.add_chart(chart, 'F3')
```

---

## Checklist de entrega

```
ANTES DE GENERAR
□ Artefactos fuente Markdown localizados y leídos
□ Número de sprint, versión y nombre de proyecto confirmados
□ Directorio docs/deliverables/sprint-[N]-[FEAT-XXX]/ creado

WORD (.docx)
□ Estilo base Experis aplicado (colores, fuentes, márgenes A4)
□ Header y footer presentes en todas las páginas
□ Tablas con columnWidths + cell width DXA (nunca porcentajes)
□ Filas de cabecera con ShadingType.CLEAR (nunca SOLID)
□ Diagramas Mermaid renderizados como PNG e incrustados
□ Sin unicode bullets — solo LevelFormat.BULLET con numbering config
□ Validación: python scripts/office/validate.py [archivo].docx → 0 errores

EXCEL (.xlsx)
□ Paleta de colores Experis aplicada (header azul, filas alt, semáforos)
□ Todas las fórmulas usan referencias de celda — nunca valores hardcodeados
□ Recálculo: python scripts/recalc.py [archivo].xlsx → 0 errores (#REF!, etc.)
□ Anchos de columna ajustados al contenido
□ Primera fila de cada hoja: título en azul Experis fusionando columnas
□ Gráficos añadidos donde corresponde (velocidad, burndown)

CIERRE
□ Archivos en docs/deliverables/sprint-[N]-[FEAT-XXX]/word/ y /excel/
□ Commit: "docs(documentation-agent): delivery package Sprint [N] — [FEAT-XXX]"
□ Informar al SM y al usuario de los artefactos generados
```

---

## Output — mensaje al Orchestrator/usuario

Al completar la generación, reportar:

```markdown
## 📄 Documentation Agent — Delivery Package generado

**Proyecto:** [nombre] · **Sprint:** [N] · **Versión:** [vX.Y.Z]
**Directorio:** docs/deliverables/sprint-[N]-[FEAT-XXX]/

### Word (.docx)
| Documento | Archivo | Páginas estimadas | Estado |
|---|---|---|---|
| SRS | SRS-FEAT-XXX.docx | ~12 | ✅ |
| HLD | HLD-FEAT-XXX.docx | ~8 | ✅ |
| Sprint Report | Sprint-Report-SprintN.docx | ~6 | ✅ |

### Excel (.xlsx)
| Documento | Archivo | Hojas | Estado |
|---|---|---|---|
| Quality Dashboard | Quality-Dashboard-SprintN.xlsx | 4 | ✅ |
| NC Tracker | NC-Tracker-SprintN.xlsx | 3 | ✅ |
| Sprint Metrics | Sprint-Metrics-SprintN.xlsx | 3 | ✅ |

**Validaciones:** Word 0 errores · Excel 0 errores de fórmula
**Commit:** [hash] — docs(documentation-agent): delivery package Sprint N
```
