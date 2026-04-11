
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
        PageBreak, LevelFormat } = require('docx');
const ExcelJS = require('exceljs');
const fs = require('fs'), path = require('path');

const META = {
  project: 'experis-tracker', client: 'Experis', sprint: 1,
  feature: 'FEAT-001', version: 'v1.0.0', date: '03/04/2026',
  color: '1B3A6B',
  outDir: path.join(__dirname, '..', '..', '..', 'word'),
  xlsxDir: path.join(__dirname, '..', '..', '..', 'excel'),
};
fs.mkdirSync(META.outDir,  { recursive: true });
fs.mkdirSync(META.xlsxDir, { recursive: true });

const PAGE = { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } };
const BD = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const BORDERS = { top: BD, bottom: BD, left: BD, right: BD };

const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, bold: true, size: 28, color: META.color, font: 'Arial' })], spacing: { before: 240, after: 120 } });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, bold: true, size: 24, color: '2E5E99', font: 'Arial' })], spacing: { before: 180, after: 80 } });
const p  = (t, opts={}) => new Paragraph({ children: [new TextRun({ text: t, size: 22, font: 'Arial', ...opts })], spacing: { after: 80 } });
const pb = () => new Paragraph({ children: [new PageBreak()] });
const bl = t => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: t, size: 22, font: 'Arial' })] });

const cl = (t, hdr, w) => new TableCell({ borders: BORDERS, width: { size: w, type: WidthType.DXA },
  shading: { fill: hdr ? META.color : 'FFFFFF', type: ShadingType.CLEAR },
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({ children: [new TextRun({ text: String(t||''), size: 20, font: 'Arial', bold: hdr, color: hdr ? 'FFFFFF' : '000000' })] })]
});

const tbl = (hdrs, rows, ws) => new Table({
  width: { size: ws.reduce((a,b)=>a+b,0), type: WidthType.DXA }, columnWidths: ws,
  rows: [new TableRow({ children: hdrs.map((h,i)=>cl(h,true,ws[i])) }),
         ...rows.map(r => new TableRow({ children: r.map((v,i)=>cl(v,false,ws[i])) }))]
});

const cov = (title, sub) => [
  new Paragraph({ spacing: { before: 2800, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'EXPERIS | ManpowerGroup', size: 20, color: '888888', font: 'Arial' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 120 }, children: [new TextRun({ text: title, bold: true, size: 48, color: META.color, font: 'Arial' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: sub, size: 28, color: '2E5E99', font: 'Arial' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: META.feature+' | Sprint '+META.sprint+' | '+META.version+' | '+META.date, size: 22, color: '555555', font: 'Arial' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cliente: '+META.client+' | Proyecto: '+META.project, size: 22, color: '555555', font: 'Arial' })] }),
  pb()
];

const STYLES = {
  default: { document: { run: { font: 'Arial', size: 22 } } },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, font: 'Arial', color: META.color }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, font: 'Arial', color: '2E5E99' }, paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 1 } },
  ]
};
const NUMBERING = { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] };
const makeDoc = ch => new Document({ styles: STYLES, numbering: NUMBERING, sections: [{ properties: { page: PAGE }, children: ch }] });
const save = async (name, ch) => {
  const buf = await Packer.toBuffer(makeDoc(ch));
  const fp = path.join(META.outDir, name);
  fs.writeFileSync(fp, buf);
  console.log('OK', name, Math.round(buf.length/1024)+'KB');
};
