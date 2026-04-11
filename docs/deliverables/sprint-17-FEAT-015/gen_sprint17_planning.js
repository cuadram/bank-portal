const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, SimpleField, LevelFormat, TabStopType,
  TabStopPosition, PageBreak
} = require('docx');
const fs = require('fs');

// ── Colores corporativos Experis ──────────────────────────────────────────────
const BLUE   = "1B3A6B";
const BLUE2  = "2E5F9E";
const GREEN  = "16A34A";
const YELLOW = "D97706";
const RED    = "DC2626";
const LGRAY  = "F5F7FA";
const MGRAY  = "E2E8F0";
const WHITE  = "FFFFFF";

// ── Helpers de borde ──────────────────────────────────────────────────────────
const border1 = (color = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 4, color });
const cellBorders = (color = "CCCCCC") => ({
  top: border1(color), bottom: border1(color),
  left: border1(color), right: border1(color)
});
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });
const noBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

const p = (text, opts = {}) => new Paragraph({
  spacing: { before: opts.before ?? 80, after: opts.after ?? 80 },
  alignment: opts.align ?? AlignmentType.LEFT,
  children: [new TextRun({
    text, font: "Arial", size: opts.size ?? 20,
    bold: opts.bold ?? false, color: opts.color ?? "000000",
    italics: opts.italic ?? false
  })]
});

const pRuns = (runs, opts = {}) => new Paragraph({
  spacing: { before: opts.before ?? 80, after: opts.after ?? 80 },
  alignment: opts.align ?? AlignmentType.LEFT,
  children: runs.map(r => new TextRun({ font: "Arial", size: opts.size ?? 20, ...r }))
});

const h3 = (text) => new Paragraph({
  spacing: { before: 160, after: 80 },
  children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: BLUE2 })]
});

const sep = () => new Paragraph({
  spacing: { before: 40, after: 40 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: MGRAY, space: 1 } },
  children: []
});

const bullet = (text, color = "000000") => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  spacing: { before: 40, after: 40 },
  children: [new TextRun({ text, font: "Arial", size: 20, color })]
});

const cell = (text, opts = {}) => new TableCell({
  borders: cellBorders(opts.borderColor ?? "DDDDDD"),
  width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  verticalAlign: opts.vAlign ?? VerticalAlign.CENTER,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing: { before: 0, after: 0 },
    children: [new TextRun({
      text, font: "Arial",
      size: opts.size ?? 18,
      bold: opts.bold ?? false,
      color: opts.color ?? "000000"
    })]
  })]
});

const cellRuns = (runs, opts = {}) => new TableCell({
  borders: cellBorders(opts.borderColor ?? "DDDDDD"),
  width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  verticalAlign: opts.vAlign ?? VerticalAlign.CENTER,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing: { before: 0, after: 0 },
    children: runs.map(r => new TextRun({ font: "Arial", size: 18, ...r }))
  })]
});

const hdrCell = (text, width) => cell(text, {
  width, fill: BLUE, color: WHITE, bold: true, size: 18,
  borderColor: BLUE, align: AlignmentType.CENTER
});

const metaRow = (label, value, highlight = false) => new TableRow({
  children: [
    cell(label, { width: 2800, fill: LGRAY, bold: true, size: 18 }),
    cell(value,  { width: 6260, fill: highlight ? "FFF7ED" : WHITE, size: 18,
                   color: highlight ? "92400E" : "000000" })
  ]
});

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: WHITE },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 0,
          shading: { fill: BLUE, type: ShadingType.CLEAR } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            spacing: { before: 0, after: 80 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 2 } },
            tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
            children: [
              new TextRun({ text: "SOFIA \u00B7 Experis \u00B7 BankPortal \u2014 Banco Meridian", font: "Arial", size: 16, color: BLUE, bold: true }),
              new TextRun({ text: "\t", font: "Arial", size: 16 }),
              new TextRun({ text: "Sprint 17 Planning Document", font: "Arial", size: 16, color: "666666" }),
            ]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            spacing: { before: 80, after: 0 },
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: MGRAY, space: 2 } },
            tabStops: [{ type: TabStopType.RIGHT, position: 9026 }],
            children: [
              new TextRun({ text: "SOFIA v1.9 \u00B7 CMMI Level 3 \u00B7 Confidencial \u2014 Uso interno Experis", font: "Arial", size: 16, color: "999999" }),
              new TextRun({ text: "\t", font: "Arial", size: 16 }),
              new TextRun({ text: "P\u00E1g. ", font: "Arial", size: 16, color: "999999" }),
              new SimpleField({ instrText: "PAGE", cachedValue: "1", run: { font: "Arial", size: 16, color: "999999" } })
            ]
          })
        ]
      })
    },
    children: [

      // PORTADA
      new Paragraph({
        spacing: { before: 400, after: 120 },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: "  BankPortal \u2014 Banco Meridian", font: "Arial", size: 52, bold: true, color: WHITE })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 0 },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: "  SPRINT 17 PLANNING DOCUMENT", font: "Arial", size: 28, color: "93C5FD", bold: true })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 200 },
        shading: { fill: BLUE2, type: ShadingType.CLEAR },
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: "  SOFIA v1.9 \u00B7 Experis \u00B7 CMMI Level 3 \u00B7 Scrumban \u00B7 2026-03-24", font: "Arial", size: 18, color: "BFDBFE" })]
      }),

      new Table({
        width: { size: 9060, type: WidthType.DXA },
        columnWidths: [2800, 6260],
        rows: [
          metaRow("Proyecto",            "BankPortal \u2014 Banco Meridian"),
          metaRow("Sprint",              "Sprint 17"),
          metaRow("Fecha planning",      "2026-03-24"),
          metaRow("Velocidad referencia","23.6 SP / sprint (media S13\u201316)"),
          metaRow("Capacidad S17",       "24 SP disponibles"),
          metaRow("Deuda comprometida",  "~7 SP (DEBT-027 + DEBT-028 + DEBT-029)", true),
          metaRow("Capacidad neta FEAT", "~16 SP para FEAT-015"),
          metaRow("Estado general",      "VERDE \u2014 En control | 0 defectos acum. | 0 CVEs cr\u00EDticos"),
          metaRow("Responsable SOFIA",   "Workflow Manager + Scrum Master"),
          metaRow("Versi\u00F3n doc",    "1.0 \u2014 Borrador Planning"),
        ]
      }),

      // 1. OBJETIVO
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        spacing: { before: 0, after: 160 },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  1. Objetivo del Sprint 17", font: "Arial", size: 28, bold: true, color: WHITE })]
      }),
      p("Sprint 17 tiene un doble objetivo estrat\u00E9gico:", { bold: true, before: 120 }),
      bullet("Cierre de deuda t\u00E9cnica de seguridad y arquitectura (DEBT-027, DEBT-028, DEBT-029) como trabajo de alta prioridad y no negociable."),
      bullet("Incorporaci\u00F3n de FEAT-015 \u2014 nueva feature a definir por el Product Owner con un m\u00E1ximo de 16 SP disponibles."),
      bullet("Validaci\u00F3n de la prueba de carga SSE (R-016-05) como tarea DevOps paralela sin consumo de SP del equipo de desarrollo."),
      p("Sprint 16 cerr\u00F3 con v1.16.0 (FEAT-014 Push VAPID), 553 tests automatizados, 84% de cobertura y 0 defectos escapados a producci\u00F3n. El equipo llega a Sprint 17 con plena capacidad y CMMI L3 activo.", { color: "444444", before: 120 }),
      sep(),

      // 2. DECISIONES
      new Paragraph({
        spacing: { before: 200, after: 160 },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  2. Decisiones de Planning incorporadas", font: "Arial", size: 28, bold: true, color: WHITE })]
      }),

      h3("Decisi\u00F3n 1 \u2014 DEBT-028: push_subscriptions.auth (CVSS 4.1)"),
      p("Resoluci\u00F3n: MUST en Sprint 17 \u2014 no se pospone ni acepta en producci\u00F3n.", { bold: true, color: RED }),
      new Table({
        width: { size: 9060, type: WidthType.DXA }, columnWidths: [2200, 6860],
        rows: [
          new TableRow({ children: [cell("Riesgo activo", { width: 2200, fill: "FEF2F2", bold: true }), cell("R-016-01 (Nivel 3) \u2014 auth en claro en BD. CVSS 4.1 Medium.", { width: 6860, color: "991B1B" })]}),
          new TableRow({ children: [cell("Justificaci\u00F3n", { width: 2200, fill: LGRAY, bold: true }), cell("CMMI RSKM + PPQA: riesgo Nivel 3 no puede quedar sin plan de cierre fechado. El cierre del riesgo requiere la implementaci\u00F3n.", { width: 6860 })]}),
          new TableRow({ children: [cell("Acci\u00F3n inmediata", { width: 2200, fill: LGRAY, bold: true }), cell("Tech Lead + Security firman DAR hoy (2026-03-24). R-016-01 pasa a MITIGANDO\u2192CERRADO al final del sprint.", { width: 6860 })]}),
          new TableRow({ children: [cell("Entregable", { width: 2200, fill: LGRAY, bold: true }), cell("Cifrado AES-GCM de push_subscriptions.auth en reposo. Test de integraci\u00F3n actualizado.", { width: 6860 })]}),
          new TableRow({ children: [cell("SP asignados", { width: 2200, fill: LGRAY, bold: true }), cell("3 SP \u2014 Backend + Security", { width: 6860, bold: true, color: RED })]}),
          new TableRow({ children: [cell("Owner", { width: 2200, fill: LGRAY, bold: true }), cell("Tech Lead + Security Engineer", { width: 6860 })]}),
        ]
      }),
      p(""),

      h3("Decisi\u00F3n 2 \u2014 DEBT-027: Domain events como inner classes"),
      p("Resoluci\u00F3n: MUST en Sprint 17 \u2014 refactoring arquitectural para reducir acoplamiento.", { bold: true, color: YELLOW }),
      new Table({
        width: { size: 9060, type: WidthType.DXA }, columnWidths: [2200, 6860],
        rows: [
          new TableRow({ children: [cell("Problema", { width: 2200, fill: "FFFBEB", bold: true }), cell("Domain events como inner classes generan acoplamiento estructural que dificulta la extensibilidad del dominio.", { width: 6860 })]}),
          new TableRow({ children: [cell("Justificaci\u00F3n", { width: 2200, fill: LGRAY, bold: true }), cell("FEAT-015 a\u00F1adir\u00E1 nuevos eventos de dominio. Resolver antes evita que la deuda se amplifique.", { width: 6860 })]}),
          new TableRow({ children: [cell("Entregable", { width: 2200, fill: LGRAY, bold: true }), cell("Domain events extra\u00EDdos a clases top-level. Paquete dedicado. Tests de regresi\u00F3n sin cambios.", { width: 6860 })]}),
          new TableRow({ children: [cell("SP asignados", { width: 2200, fill: LGRAY, bold: true }), cell("2 SP \u2014 Arquitecto + Developer", { width: 6860, bold: true, color: "92400E" })]}),
          new TableRow({ children: [cell("Owner", { width: 2200, fill: LGRAY, bold: true }), cell("Arquitecto de Software", { width: 6860 })]}),
        ]
      }),
      p(""),

      h3("Decisi\u00F3n 3 \u2014 DEBT-029: Footer email RGPD Art.7"),
      p("Resoluci\u00F3n: MUST en Sprint 17 \u2014 compliance legal, baja complejidad t\u00E9cnica.", { bold: true, color: YELLOW }),
      new Table({
        width: { size: 9060, type: WidthType.DXA }, columnWidths: [2200, 6860],
        rows: [
          new TableRow({ children: [cell("Problema", { width: 2200, fill: "FFFBEB", bold: true }), cell("Emails del sistema carecen del enlace de cancelaci\u00F3n requerido por RGPD Art\u00EDculo 7.", { width: 6860 })]}),
          new TableRow({ children: [cell("Entregable", { width: 2200, fill: LGRAY, bold: true }), cell("Footer de emails con enlace de opt-out. Compliance RGPD verificado. Test E2E actualizado.", { width: 6860 })]}),
          new TableRow({ children: [cell("SP asignados", { width: 2200, fill: LGRAY, bold: true }), cell("1 SP \u2014 Backend + QA", { width: 6860, bold: true, color: "166534" })]}),
          new TableRow({ children: [cell("Owner", { width: 2200, fill: LGRAY, bold: true }), cell("Backend Developer + QA Engineer", { width: 6860 })]}),
        ]
      }),
      p(""),

      h3("Decisi\u00F3n 4 \u2014 FEAT-015: Feature nueva (capacidad ~16 SP)"),
      p("Resoluci\u00F3n: PO define feature con Acceptance Criteria antes del Planning. Sin ACs \u2014 no entra.", { bold: true, color: BLUE }),
      new Table({
        width: { size: 9060, type: WidthType.DXA }, columnWidths: [2200, 6860],
        rows: [
          new TableRow({ children: [cell("Capacidad neta", { width: 2200, fill: LGRAY, bold: true }), cell("24 SP \u2212 7 SP deuda \u2212 1 SP load test = 16 SP disponibles para FEAT-015", { width: 6860, bold: true })]}),
          new TableRow({ children: [cell("Candidatos recomendados", { width: 2200, fill: LGRAY, bold: true }),
            cellRuns([
              { text: "1. Alertas inteligentes sobre movimientos ", bold: true },
              { text: "(aprovecha Push VAPID de FEAT-014) \u2014 RECOMENDADO", bold: true, color: GREEN },
              { text: "\n2. Configuraci\u00F3n de preferencias de notificaci\u00F3n por usuario\n3. Reporting de actividad financiera (complementa FEAT-012)" }
            ], { width: 6860 })]}),
          new TableRow({ children: [cell("Condici\u00F3n de entrada", { width: 2200, fill: "FEF2F2", bold: true }), cell("Sin ACs verificados por Scrum Master \u2014 la capacidad se redirige a deuda adicional o testing de regresi\u00F3n.", { width: 6860, color: "991B1B" })]}),
          new TableRow({ children: [cell("Owner", { width: 2200, fill: LGRAY, bold: true }), cell("Product Owner \u2014 Deadline: antes del Planning Sprint 17", { width: 6860 })]}),
        ]
      }),
      p(""),

      h3("Decisi\u00F3n 5 \u2014 Load Test SSE (R-016-05)"),
      p("Resoluci\u00F3n: Sprint 17, ejecuci\u00F3n paralela por DevOps \u2014 no consume SP de desarrollo.", { bold: true, color: BLUE2 }),
      new Table({
        width: { size: 9060, type: WidthType.DXA }, columnWidths: [2200, 6860],
        rows: [
          new TableRow({ children: [cell("Riesgo activo", { width: 2200, fill: LGRAY, bold: true }), cell("R-016-05 (Nivel 2) \u2014 >500 SSE concurrentes sin validar.", { width: 6860 })]}),
          new TableRow({ children: [cell("Justificaci\u00F3n", { width: 2200, fill: LGRAY, bold: true }), cell("Postergar a S18 sin causa t\u00E9cnica genera no-conformidad en PMC (CMMI L3).", { width: 6860 })]}),
          new TableRow({ children: [cell("Ejecuci\u00F3n", { width: 2200, fill: LGRAY, bold: true }), cell("DevOps ejecuta en staging durante S17. Estimado: 1 d\u00EDa DevOps.", { width: 6860 })]}),
          new TableRow({ children: [cell("Criterio de \u00E9xito", { width: 2200, fill: LGRAY, bold: true }), cell("Sistema estable con >500 conexiones SSE. R-016-05 cierra en Sprint Review.", { width: 6860 })]}),
          new TableRow({ children: [cell("Contingencia", { width: 2200, fill: "FFFBEB", bold: true }), cell("Si entorno no listo: documentar como blocker externo. No postergar discrecionalmente.", { width: 6860, color: "92400E" })]}),
          new TableRow({ children: [cell("Owner", { width: 2200, fill: LGRAY, bold: true }), cell("DevOps Engineer + QA Lead", { width: 6860 })]}),
        ]
      }),
      sep(),

      // 3. BACKLOG
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        spacing: { before: 0, after: 160 },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  3. Sprint Backlog \u2014 Distribuci\u00F3n de capacidad", font: "Arial", size: 28, bold: true, color: WHITE })]
      }),
      new Table({
        width: { size: 9060, type: WidthType.DXA },
        columnWidths: [1500, 4200, 900, 1360, 1100],
        rows: [
          new TableRow({ tableHeader: true, children: [hdrCell("ID", 1500), hdrCell("Descripci\u00F3n", 4200), hdrCell("SP", 900), hdrCell("Owner", 1360), hdrCell("Tipo", 1100)] }),
          new TableRow({ children: [cell("DEBT-028", { width: 1500, bold: true, color: RED }), cell("Cifrar push_subscriptions.auth en reposo (AES-GCM)", { width: 4200 }), cell("3", { width: 900, align: AlignmentType.CENTER, bold: true, color: RED }), cell("Tech Lead + Security", { width: 1360, size: 16 }), cell("MUST", { width: 1100, fill: "FEE2E2", color: RED, bold: true, align: AlignmentType.CENTER })]}),
          new TableRow({ children: [cell("DEBT-027", { width: 1500, bold: true, color: "92400E" }), cell("Domain events: refactoring a clases top-level", { width: 4200 }), cell("2", { width: 900, align: AlignmentType.CENTER, bold: true, color: "92400E" }), cell("Arquitecto + Dev", { width: 1360, size: 16 }), cell("MUST", { width: 1100, fill: "FEF3C7", color: "92400E", bold: true, align: AlignmentType.CENTER })]}),
          new TableRow({ children: [cell("DEBT-029", { width: 1500, bold: true, color: "92400E" }), cell("Footer email RGPD Art.7 \u2014 enlace opt-out", { width: 4200 }), cell("1", { width: 900, align: AlignmentType.CENTER, bold: true }), cell("Backend + QA", { width: 1360, size: 16 }), cell("MUST", { width: 1100, fill: "FEF3C7", color: "92400E", bold: true, align: AlignmentType.CENTER })]}),
          new TableRow({ children: [cell("FEAT-015", { width: 1500, bold: true, color: BLUE }), cell("Feature nueva (TBD por PO \u2014 ACs requeridos antes del Planning)", { width: 4200, fill: "EFF6FF" }), cell("~16", { width: 900, align: AlignmentType.CENTER, bold: true, color: BLUE }), cell("Equipo completo", { width: 1360, size: 16 }), cell("MUST*", { width: 1100, fill: "DBEAFE", color: BLUE, bold: true, align: AlignmentType.CENTER })]}),
          new TableRow({ children: [cell("R-016-05", { width: 1500, bold: true, color: "666666" }), cell("Load test SSE >500 concurrentes (tarea paralela DevOps)", { width: 4200 }), cell("1*", { width: 900, align: AlignmentType.CENTER, size: 16, color: "666666" }), cell("DevOps + QA", { width: 1360, size: 16 }), cell("Paralela", { width: 1100, fill: LGRAY, color: "666666", align: AlignmentType.CENTER })]}),
          new TableRow({ children: [cell("TOTAL", { width: 1500, fill: BLUE, color: WHITE, bold: true }), cell("Capacidad comprometida Sprint 17", { width: 4200, fill: BLUE, color: WHITE, bold: true }), cell("23 SP", { width: 900, fill: BLUE, color: WHITE, bold: true, align: AlignmentType.CENTER }), cell("", { width: 1360, fill: BLUE }), cell("+ 1 paralela", { width: 1100, fill: BLUE, color: "93C5FD", align: AlignmentType.CENTER })]}),
        ]
      }),
      p("* FEAT-015 entra condicionado a ACs completos antes del Planning. Sin ellos, los 16 SP se reasignan a testing y hardening.", { color: "666666", size: 18, before: 100 }),
      p("* El load test SSE no consume SP del equipo de desarrollo.", { color: "666666", size: 18, before: 40 }),
      sep(),

      // 4. CRITERIOS DE ACEPTACION
      new Paragraph({
        spacing: { before: 200, after: 160 },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  4. Criterios de Aceptaci\u00F3n del Sprint", font: "Arial", size: 28, bold: true, color: WHITE })]
      }),
      h3("4.1 Criterios de Calidad (invariantes)"),
      new Table({
        width: { size: 9060, type: WidthType.DXA }, columnWidths: [4530, 4530],
        rows: [
          new TableRow({ tableHeader: true, children: [hdrCell("Criterio", 4530), hdrCell("Umbral Sprint 17", 4530)] }),
          new TableRow({ children: [cell("Cobertura de tests (application)", { width: 4530 }), cell("\u2265 84% (sostenido desde S16)", { width: 4530, bold: true, color: GREEN })]}),
          new TableRow({ children: [cell("Defectos escapados a producci\u00F3n", { width: 4530 }), cell("0 defectos (record hist\u00F3rico a mantener)", { width: 4530, bold: true, color: GREEN })]}),
          new TableRow({ children: [cell("CVEs cr\u00EDticos (CVSS \u2265 7.0)", { width: 4530 }), cell("0 CVEs cr\u00EDticos nuevos", { width: 4530, bold: true, color: GREEN })]}),
          new TableRow({ children: [cell("DEBT-028 resuelto", { width: 4530 }), cell("auth cifrado AES-GCM + R-016-01 cerrado", { width: 4530, bold: true, color: RED })]}),
          new TableRow({ children: [cell("Non-Conformances Code Review", { width: 4530 }), cell("\u2264 3 NCs (objetivo de mejora vs S14 con 5)", { width: 4530, bold: true })]}),
          new TableRow({ children: [cell("Tests automatizados nuevos", { width: 4530 }), cell("\u2265 +30 tests (ritmo sostenido)", { width: 4530, bold: true })]}),
          new TableRow({ children: [cell("Compliance CMMI L3", { width: 4530 }), cell("9 PAs activas con evidencias (PP, PMC, RSKM, VER, VAL, CM, PPQA, REQM, DAR)", { width: 4530, bold: true, color: BLUE })]}),
        ]
      }),
      p(""),
      h3("4.2 Criterios de Aceptaci\u00F3n \u2014 Deuda T\u00E9cnica"),
      bullet("DEBT-028: push_subscriptions.auth cifrado AES-GCM. Tests verifican cifrado/descifrado. CVSS 4.1 resuelto.", GREEN),
      bullet("DEBT-027: Domain events como clases top-level en paquete dedicado. Tests de regresi\u00F3n en verde.", "92400E"),
      bullet("DEBT-029: Footer de emails con enlace de cancelaci\u00F3n funcional. Test E2E confirma enlace v\u00E1lido.", "92400E"),
      p(""),
      h3("4.3 Criterios de Aceptaci\u00F3n \u2014 Load Test SSE"),
      bullet("Plan de prueba documentado antes de la ejecuci\u00F3n (DevOps)."),
      bullet("Prueba ejecutada en entorno staging durante Sprint 17."),
      bullet("Sistema estable con >500 conexiones SSE concurrentes activas."),
      bullet("Resultado documentado en Risk Register. R-016-05 cierra en Sprint Review."),
      bullet("Si hay degradaci\u00F3n: threshold documentado, plan de mitigaci\u00F3n actualizado."),
      sep(),

      // 5. RIESGOS
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        spacing: { before: 0, after: 160 },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  5. Riesgos activos y gesti\u00F3n Sprint 17", font: "Arial", size: 28, bold: true, color: WHITE })]
      }),
      new Table({
        width: { size: 9060, type: WidthType.DXA },
        columnWidths: [1200, 3000, 900, 900, 900, 2160],
        rows: [
          new TableRow({ tableHeader: true, children: [hdrCell("ID", 1200), hdrCell("Descripci\u00F3n", 3000), hdrCell("Prob.", 900), hdrCell("Impacto", 900), hdrCell("Nivel", 900), hdrCell("Acci\u00F3n S17", 2160)] }),
          new TableRow({ children: [cell("R-016-01", { width: 1200, bold: true, color: RED, size: 16 }), cell("push_subscriptions.auth en claro en BD", { width: 3000, size: 16 }), cell("Media", { width: 900, align: AlignmentType.CENTER, size: 16 }), cell("Alta", { width: 900, align: AlignmentType.CENTER, size: 16, bold: true, color: RED }), cell("3", { width: 900, align: AlignmentType.CENTER, bold: true, color: RED }), cell("DEBT-028 resuelve este riesgo. Cierre en Sprint Review.", { width: 2160, size: 16, color: GREEN })]}),
          new TableRow({ children: [cell("R-016-02", { width: 1200, bold: true, color: "92400E", size: 16 }), cell("Safari iOS <16.4 sin Web Push", { width: 3000, size: 16 }), cell("Alta", { width: 900, align: AlignmentType.CENTER, size: 16, bold: true }), cell("Media", { width: 900, align: AlignmentType.CENTER, size: 16 }), cell("2", { width: 900, align: AlignmentType.CENTER, bold: true, color: YELLOW }), cell("Aceptado. Monitorizar adopci\u00F3n iOS 16.4+.", { width: 2160, size: 16 })]}),
          new TableRow({ children: [cell("R-016-05", { width: 1200, bold: true, color: "92400E", size: 16 }), cell(">500 SSE concurrentes \u2014 prueba de carga pendiente", { width: 3000, size: 16 }), cell("Baja", { width: 900, align: AlignmentType.CENTER, size: 16 }), cell("Media", { width: 900, align: AlignmentType.CENTER, size: 16 }), cell("2", { width: 900, align: AlignmentType.CENTER, bold: true, color: YELLOW }), cell("Load test paralelo en S17. Cierre en Sprint Review.", { width: 2160, size: 16, color: GREEN })]}),
        ]
      }),
      p("Riesgos a vigilar en Sprint 17:", { bold: true, before: 160 }),
      bullet("Si FEAT-015 no tiene ACs: riesgo de under-delivery debe registrarse formalmente."),
      bullet("Si load test SSE detecta degradaci\u00F3n, R-016-05 escala a Nivel 3 y requiere spike en S18."),
      sep(),

      // 6. CMMI
      new Paragraph({
        spacing: { before: 200, after: 160 },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  6. CMMI Level 3 \u2014 Evidencias Sprint 17", font: "Arial", size: 28, bold: true, color: WHITE })]
      }),
      new Table({
        width: { size: 9060, type: WidthType.DXA },
        columnWidths: [1000, 2200, 3560, 2300],
        rows: [
          new TableRow({ tableHeader: true, children: [hdrCell("PA", 1000), hdrCell("Proceso", 2200), hdrCell("Evidencia Sprint 17", 3560), hdrCell("Estado", 2300)] }),
          ...(([
            ["PP",   "Project Planning",          "Sprint Planning Doc (este doc) + plan de capacidad",            "ESTE DOC"],
            ["PMC",  "Project Monitoring",         "Sprint Burndown + Daily notes + desviaci\u00F3n SP",           "Activo"],
            ["RSKM", "Risk Management",            "Risk Register: R-016-01 cierre, R-016-05 load test",           "Activo"],
            ["VER",  "Verification",               "Code Review NCs + test report DEBT-028/027/029",               "Activo"],
            ["VAL",  "Validation",                 "Sprint Demo + UAT FEAT-015 con PO",                            "Activo"],
            ["CM",   "Config. Management",         "Git tags v1.17.0-rc + changelog + branch policy",              "Activo"],
            ["PPQA", "Process Quality Assurance",  "Audit trail: decisiones DAR firmadas + checklist PPQA",        "Activo"],
            ["REQM", "Requirements Management",    "ACs FEAT-015 trazados a tests. Backlog actualizado.",          "Pendiente PO"],
            ["DAR",  "Decision Analysis",          "DAR DEBT-028 firmado hoy (2026-03-24)",                        "URGENTE \u2014 Hoy"],
          ]).map(([pa, nombre, ev, estado]) => new TableRow({ children: [
            cell(pa,     { width: 1000, bold: true, color: BLUE }),
            cell(nombre, { width: 2200, size: 16 }),
            cell(ev,     { width: 3560, size: 16 }),
            cell(estado, { width: 2300, size: 16,
              bold: estado.includes("URGENTE") || estado === "ESTE DOC",
              color: estado.includes("URGENTE") ? RED : estado === "ESTE DOC" ? GREEN : "444444",
              fill:  estado.includes("URGENTE") ? "FEF2F2" : estado === "ESTE DOC" ? "F0FDF4" : WHITE }),
          ]})))
        ]
      }),
      sep(),

      // 7. ACUERDOS Y FIRMAS
      new Paragraph({
        spacing: { before: 200, after: 160 },
        shading: { fill: BLUE, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  7. Acuerdos del Planning \u2014 Resumen ejecutivo", font: "Arial", size: 28, bold: true, color: WHITE })]
      }),
      new Table({
        width: { size: 9060, type: WidthType.DXA }, columnWidths: [2000, 3860, 1800, 1400],
        rows: [
          new TableRow({ tableHeader: true, children: [hdrCell("Decisi\u00F3n", 2000), hdrCell("Resoluci\u00F3n acordada", 3860), hdrCell("Owner", 1800), hdrCell("Deadline", 1400)] }),
          new TableRow({ children: [cell("DEBT-028", { width: 2000, bold: true, color: RED }), cell("MUST Sprint 17. No se acepta en producci\u00F3n. DAR firmado hoy.", { width: 3860 }), cell("Tech Lead + Security", { width: 1800, size: 16 }), cell("Hoy", { width: 1400, bold: true, color: RED, align: AlignmentType.CENTER })]}),
          new TableRow({ children: [cell("FEAT-015", { width: 2000, bold: true, color: BLUE }), cell("PO entrega ACs antes del Planning. Sin ACs = no entra.", { width: 3860 }), cell("Product Owner", { width: 1800, size: 16 }), cell("Planning", { width: 1400, align: AlignmentType.CENTER })]}),
          new TableRow({ children: [cell("Load Test SSE", { width: 2000, bold: true, color: "92400E" }), cell("S17 como tarea paralela DevOps. Plan de prueba antes del Planning.", { width: 3860 }), cell("DevOps + QA Lead", { width: 1800, size: 16 }), cell("Planning", { width: 1400, align: AlignmentType.CENTER })]}),
        ]
      }),
      p(""),
      h3("Firmas de aprobaci\u00F3n del Planning"),
      new Table({
        width: { size: 9060, type: WidthType.DXA }, columnWidths: [2265, 2265, 2265, 2265],
        rows: [
          new TableRow({ children: [cell("Scrum Master", { width: 2265, fill: LGRAY, bold: true, align: AlignmentType.CENTER }), cell("Product Owner", { width: 2265, fill: LGRAY, bold: true, align: AlignmentType.CENTER }), cell("Tech Lead", { width: 2265, fill: LGRAY, bold: true, align: AlignmentType.CENTER }), cell("Arquitecto", { width: 2265, fill: LGRAY, bold: true, align: AlignmentType.CENTER })]}),
          new TableRow({ children: [cell("", { width: 2265 }), cell("", { width: 2265 }), cell("", { width: 2265 }), cell("", { width: 2265 })]}),
          new TableRow({ children: [cell("Firma: ___________", { width: 2265, size: 16, color: "999999", align: AlignmentType.CENTER }), cell("Firma: ___________", { width: 2265, size: 16, color: "999999", align: AlignmentType.CENTER }), cell("Firma: ___________", { width: 2265, size: 16, color: "999999", align: AlignmentType.CENTER }), cell("Firma: ___________", { width: 2265, size: 16, color: "999999", align: AlignmentType.CENTER })]}),
          new TableRow({ children: [cell("Fecha: 2026-03-24", { width: 2265, size: 16, color: "999999", align: AlignmentType.CENTER }), cell("Fecha: 2026-03-24", { width: 2265, size: 16, color: "999999", align: AlignmentType.CENTER }), cell("Fecha: 2026-03-24", { width: 2265, size: 16, color: "999999", align: AlignmentType.CENTER }), cell("Fecha: 2026-03-24", { width: 2265, size: 16, color: "999999", align: AlignmentType.CENTER })]}),
        ]
      }),
      p(""),
      new Paragraph({
        spacing: { before: 160, after: 80 },
        shading: { fill: LGRAY, type: ShadingType.CLEAR },
        children: [new TextRun({ text: "  Nota CMMI: Este documento es la evidencia formal de PP (Project Planning) para Sprint 17. Archivar en docs/deliverables/sprint-17-FEAT-015/ junto con Risk Register actualizado y DAR de DEBT-028.", font: "Arial", size: 17, color: "444444", italics: true })]
      }),

    ]
  }]
});

const OUT = __dirname + "/sprint17-planning-doc.docx";
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("OK: " + OUT);
});
