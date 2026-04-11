'use strict';
// gen-planning-docs-s18-s19-s20.js
// Genera sprint-NN-planning-doc.docx para S18, S19 y S20
// Patron identico a sprint17-planning-doc.docx
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat, TabStopType, TabStopPosition, PageNumber, PageNumberElement
} = require('docx');
const fs = require('fs');

const BLUE  = '1B3A6B'; const BLUE2 = '2E5F9E'; const GREEN = '16A34A';
const YELLOW= 'D97706'; const RED   = 'DC2626'; const LGRAY  = 'F5F7FA';
const MGRAY = 'E2E8F0'; const WHITE = 'FFFFFF';

const b1  = (c='CCCCCC') => ({ style:BorderStyle.SINGLE, size:4, color:c });
const allB = (c='DDDDDD') => ({ top:b1(c),bottom:b1(c),left:b1(c),right:b1(c) });
const noBdr= () => ({ style:BorderStyle.NONE, size:0, color:'FFFFFF' });
const noB  = () => ({ top:noBdr(),bottom:noBdr(),left:noBdr(),right:noBdr() });

function p(text, opts) {
  opts=opts||{};
  return new Paragraph({
    spacing:{before:opts.before??80,after:opts.after??80},
    alignment:opts.align??AlignmentType.LEFT,
    children:[new TextRun({text:String(text),font:'Arial',size:opts.size??20,
      bold:opts.bold??false,color:opts.color??'000000',italics:opts.italic??false})]
  });
}
function sep(){return new Paragraph({spacing:{before:40,after:40},border:{bottom:{style:BorderStyle.SINGLE,size:2,color:MGRAY,space:1}},children:[]});}
function bullet(text,color){color=color||'000000';return new Paragraph({numbering:{reference:'bullets',level:0},spacing:{before:40,after:40},children:[new TextRun({text:String(text),font:'Arial',size:20,color:color})]});}

function cell(text,opts){
  opts=opts||{};
  return new TableCell({
    borders:allB(opts.borderColor||'DDDDDD'),
    width:opts.width?{size:opts.width,type:WidthType.DXA}:undefined,
    shading:opts.fill?{fill:opts.fill,type:ShadingType.CLEAR}:undefined,
    verticalAlign:opts.vAlign||VerticalAlign.CENTER,
    margins:{top:80,bottom:80,left:120,right:120},
    children:[new Paragraph({alignment:opts.align||AlignmentType.LEFT,spacing:{before:0,after:0},
      children:[new TextRun({text:String(text),font:'Arial',size:opts.size||18,bold:opts.bold||false,color:opts.color||'000000'})]})]
  });
}
function hdrCell(text,width){return cell(text,{width,fill:BLUE,color:WHITE,bold:true,size:18,borderColor:BLUE,align:AlignmentType.CENTER});}
function metaRow(label,value,highlight){return new TableRow({children:[
  cell(label,{width:2800,fill:LGRAY,bold:true,size:18}),
  cell(value, {width:6260,fill:highlight?'FFF7ED':WHITE,size:18,color:highlight?'92400E':'000000'})
]});}

function buildDoc(sprint, feat, version, titulo, goal, fechaInicio, fechaFin, stories, debt, debtDesc) {
  var sprintPad = String(sprint).padStart(3,'0');
  var sprintLabel = 'Sprint '+sprint;

  var headerPara = new Paragraph({
    spacing:{before:0,after:80},
    border:{bottom:{style:BorderStyle.SINGLE,size:6,color:BLUE,space:2}},
    tabStops:[{type:TabStopType.RIGHT,position:9026}],
    children:[
      new TextRun({text:'SOFIA \u00B7 Experis \u00B7 BankPortal \u2014 Banco Meridian',font:'Arial',size:16,color:BLUE,bold:true}),
      new TextRun({text:'\t',font:'Arial',size:16}),
      new TextRun({text:sprintLabel+' Planning Document',font:'Arial',size:16,color:'666666'}),
    ]
  });
  var footerPara = new Paragraph({
    spacing:{before:80,after:0},
    border:{top:{style:BorderStyle.SINGLE,size:4,color:MGRAY,space:2}},
    tabStops:[{type:TabStopType.RIGHT,position:9026}],
    children:[
      new TextRun({text:'SOFIA v2.3 \u00B7 Confidencial \u00B7 Experis Spain \u00B7 ManpowerGroup',font:'Arial',size:14,color:'888888'}),
      new TextRun({text:'\tP\u00e1g. ',font:'Arial',size:14,color:'888888'}),
      new PageNumberElement({page:PageNumber.CURRENT})
    ]
  });

  // ── Portada ────────────────────────────────────────────────────────────────
  var portada = [
    new Paragraph({
      spacing:{before:1440,after:120}, alignment:AlignmentType.CENTER,
      shading:{fill:BLUE,type:ShadingType.CLEAR},
      children:[new TextRun({text:'SPRINT '+sprint+' — PLANNING DOCUMENT',font:'Arial',size:44,bold:true,color:WHITE})]
    }),
    new Paragraph({
      spacing:{before:0,after:80}, alignment:AlignmentType.CENTER,
      shading:{fill:BLUE,type:ShadingType.CLEAR},
      children:[new TextRun({text:'BankPortal \u00B7 Banco Meridian \u00B7 '+version,font:'Arial',size:24,color:'C8D8F4'})]
    }),
    p(''),
    new Table({
      width:{size:9060,type:WidthType.DXA}, columnWidths:[2800,6260],
      rows:[
        metaRow('Proyecto','BankPortal \u2014 Banco Meridian'),
        metaRow('Sprint',sprintLabel+' \u00B7 Feature: '+feat),
        metaRow('Release target',version),
        metaRow('Feature',titulo),
        metaRow('Periodo',fechaInicio+' \u2192 '+fechaFin),
        metaRow('Capacidad','24 Story Points',false),
        metaRow('Metodolog\u00eda','Scrumban + CMMI Nivel 3',false),
        metaRow('SOFIA Pipeline','v2.3 \u00B7 21 agentes \u00B7 15 steps',false),
      ]
    }),
    p(''),
  ];

  // ── Sprint Goal ────────────────────────────────────────────────────────────
  var goalSection = [
    new Paragraph({heading:'Heading1',spacing:{before:280,after:120},
      children:[new TextRun({text:'1. Sprint Goal',font:'Arial',size:28,bold:true,color:WHITE})]}),
    new Paragraph({
      spacing:{before:120,after:120},
      shading:{fill:'EEF4FF',type:ShadingType.CLEAR},
      border:{left:{style:BorderStyle.SINGLE,size:12,color:BLUE,space:4}},
      children:[new TextRun({text:goal,font:'Arial',size:22,bold:true,color:BLUE,italics:true})]
    }),
    sep(),
  ];

  // ── Backlog ────────────────────────────────────────────────────────────────
  var backlogRows = [new TableRow({children:[
    hdrCell('Issue',1400), hdrCell('Historia de usuario / Descripcion',4500),
    hdrCell('SP',700), hdrCell('Tipo',1000), hdrCell('Prioridad',1200),
  ]})];
  var totalSP = 0;
  stories.forEach(function(s,i) {
    totalSP += s.sp;
    backlogRows.push(new TableRow({children:[
      cell(s.key,{width:1400,fill:i%2===0?WHITE:LGRAY,size:17,bold:true,color:BLUE2}),
      cell(s.desc,{width:4500,fill:i%2===0?WHITE:LGRAY,size:17}),
      cell(String(s.sp),{width:700,fill:i%2===0?WHITE:LGRAY,size:17,align:AlignmentType.CENTER}),
      cell(s.tipo,{width:1000,fill:i%2===0?WHITE:LGRAY,size:16}),
      cell(s.prio,{width:1200,fill:i%2===0?WHITE:LGRAY,size:16,color:s.prio==='Alta'?RED:s.prio==='Media'?YELLOW:GREEN}),
    ]}));
  });
  backlogRows.push(new TableRow({children:[
    cell('TOTAL',{width:1400,fill:MGRAY,bold:true,size:18}),
    cell('',{width:4500,fill:MGRAY}),
    cell(String(totalSP),{width:700,fill:MGRAY,bold:true,size:18,align:AlignmentType.CENTER}),
    cell('',{width:1000,fill:MGRAY}),
    cell('',{width:1200,fill:MGRAY}),
  ]}));

  var backlogSection = [
    new Paragraph({heading:'Heading1',spacing:{before:280,after:120},
      children:[new TextRun({text:'2. Sprint Backlog',font:'Arial',size:28,bold:true,color:WHITE})]}),
    new Table({width:{size:8800,type:WidthType.DXA},columnWidths:[1400,4500,700,1000,1200],rows:backlogRows}),
    p(''),sep(),
  ];

  // ── Deuda tecnica ──────────────────────────────────────────────────────────
  var debtSection = [];
  if(debt && debt.length>0){
    debtSection.push(new Paragraph({heading:'Heading1',spacing:{before:280,after:120},
      children:[new TextRun({text:'3. Deuda T\u00e9cnica Incluida',font:'Arial',size:28,bold:true,color:WHITE})]}));
    debt.forEach(function(d){
      debtSection.push(new Paragraph({spacing:{before:80,after:20},children:[new TextRun({text:d.id+' \u2014 '+d.titulo,font:'Arial',size:20,bold:true,color:BLUE2})]}));
      debtSection.push(p(d.desc,{color:'444444'}));
      if(debtDesc && debtDesc[d.id]){
        debtDesc[d.id].forEach(function(line){ debtSection.push(bullet(line)); });
      }
      debtSection.push(p(''));
    });
    debtSection.push(sep());
  }

  // ── Criterios de aceptacion ───────────────────────────────────────────────
  var acSection = [
    new Paragraph({heading:'Heading1',spacing:{before:280,after:120},
      children:[new TextRun({text:(debt&&debt.length>0?'4':'3')+'. Criterios de Aceptaci\u00f3n Globales',font:'Arial',size:28,bold:true,color:WHITE})]}),
    bullet('Todos los Story Points entregados y en estado Finalizada en Jira'),
    bullet('Cobertura de tests \u2265 85%'),
    bullet('0 NCS (Non-Conformances) sin resolver'),
    bullet('0 defectos en producci\u00f3n'),
    bullet('Smoke test v'+version+' PASS en STG'),
    bullet('Flyway migrations ejecutadas sin error'),
    bullet('JPA-REAL activo en STG (LA-019-08)'),
    bullet('Todos los gates G-1..G-9 aprobados'),
    bullet('Documentaci\u00f3n generada: 10+ DOCX + 3 XLSX + dashboard'),
    sep(),
  ];

  // ── Metricas contexto ─────────────────────────────────────────────────────
  var prevSP = { 18: 401, 19: 425, 20: 449 };
  var acumAnterior = prevSP[sprint] || (sprint-1)*24;
  var metSection = [
    new Paragraph({heading:'Heading1',spacing:{before:280,after:120},
      children:[new TextRun({text:(debt&&debt.length>0?'5':'4')+'. Contexto y M\u00e9tricas',font:'Arial',size:28,bold:true,color:WHITE})]}),
    new Table({
      width:{size:9060,type:WidthType.DXA}, columnWidths:[3000,2020,2020,2020],
      rows:[
        new TableRow({children:[hdrCell('M\u00e9trica',3000),hdrCell('Sprint ant.',2020),hdrCell('Sprint '+sprint,2020),hdrCell('Objetivo',2020)]}),
        new TableRow({children:[cell('SP acumulados',{width:3000,fill:LGRAY,bold:true}),cell(String(acumAnterior),{width:2020}),cell(String(acumAnterior+24)+' (proyectado)',{width:2020,color:BLUE2,bold:true}),cell('\u2014',{width:2020})]}),
        new TableRow({children:[cell('Velocidad media',{width:3000,fill:LGRAY,bold:true}),cell('23.6 SP/sprint',{width:2020}),cell('24 SP',{width:2020,color:GREEN,bold:true}),cell('\u2265 23 SP',{width:2020})]}),
        new TableRow({children:[cell('Cobertura objetivo',{width:3000,fill:LGRAY,bold:true}),cell('\u2014',{width:2020}),cell('\u2265 85%',{width:2020}),cell('\u2265 85%',{width:2020,color:GREEN})]}),
        new TableRow({children:[cell('NCS objetivo',{width:3000,fill:LGRAY,bold:true}),cell('\u2014',{width:2020}),cell('0',{width:2020,color:GREEN,bold:true}),cell('0',{width:2020})]}),
      ]
    }),
    p(''),
  ];

  var allChildren = portada.concat(goalSection).concat(backlogSection).concat(debtSection).concat(acSection).concat(metSection);

  return new Document({
    numbering:{config:[
      {reference:'bullets',levels:[{level:0,format:LevelFormat.BULLET,text:'\u2022',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]},
      {reference:'numbers',levels:[{level:0,format:LevelFormat.DECIMAL,text:'%1.',alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]},
    ]},
    styles:{default:{document:{run:{font:'Arial',size:20}}},
      paragraphStyles:[
        {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,
          run:{size:28,bold:true,font:'Arial',color:WHITE},
          paragraph:{spacing:{before:280,after:120},outlineLevel:0,shading:{fill:BLUE,type:ShadingType.CLEAR}}},
      ]
    },
    sections:[{
      properties:{page:{size:{width:11906,height:16838},margin:{top:1134,right:1134,bottom:1134,left:1134}}},
      headers:{default:new Header({children:[headerPara]})},
      footers:{default:new Footer({children:[footerPara]})},
      children: allChildren
    }]
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DATOS DE CADA SPRINT
// ═══════════════════════════════════════════════════════════════════════════

var sprint18Data = {
  sprint:18, feat:'FEAT-016', version:'v1.18.0',
  titulo:'Gesti\u00f3n de Tarjetas de D\u00e9bito y Cr\u00e9dito',
  goal:'Implementar la gesti\u00f3n completa del ciclo de vida de tarjetas bancarias: activaci\u00f3n, bloqueo, l\u00edmites y consulta de transacciones, con seguridad PCI-DSS y notificaciones push.',
  fechaInicio:'2026-02-16', fechaFin:'2026-03-01',
  stories:[
    {key:'SCRUM-88',desc:'[FEAT-016] Activar / desactivar tarjeta de d\u00e9bito desde la app',sp:3,tipo:'Historia',prio:'Alta'},
    {key:'SCRUM-89',desc:'[FEAT-016] Consultar movimientos de tarjeta con filtros de fecha',sp:3,tipo:'Historia',prio:'Alta'},
    {key:'SCRUM-90',desc:'[FEAT-016] Modificar l\u00edmites de tarjeta (diario, mensual)',sp:3,tipo:'Historia',prio:'Media'},
    {key:'SCRUM-91',desc:'[FEAT-016] Bloqueo temporal y reporte de tarjeta robada/perdida',sp:3,tipo:'Historia',prio:'Alta'},
    {key:'SCRUM-92',desc:'[DEBT-026] Refactorizaci\u00f3n capa repositorio — eliminar dependencias c\u00edclicas',sp:4,tipo:'Deuda T\u00e9cnica',prio:'Media'},
    {key:'SCRUM-93',desc:'[DEBT-027] Patch seguridad CVSS 4.1 — validaci\u00f3n JWT audience',sp:4,tipo:'Deuda T\u00e9cnica',prio:'Alta'},
    {key:'SCRUM-94',desc:'[DEBT-028] Hardening configuraci\u00f3n CORS producci\u00f3n',sp:2,tipo:'Deuda T\u00e9cnica',prio:'Alta'},
    {key:'SCRUM-95',desc:'[DEBT-029] Migraci\u00f3n tests de Mockito 4 a Mockito 5',sp:2,tipo:'Deuda T\u00e9cnica',prio:'Baja'},
  ],
  debt:[
    {id:'DEBT-026',titulo:'Refactorizaci\u00f3n capa repositorio',desc:'Eliminar dependencias c\u00edclicas detectadas en Code Review S17.'},
    {id:'DEBT-027',titulo:'Patch CVSS 4.1 \u2014 JWT audience',desc:'Validaci\u00f3n de audience ausente en JwtAuthenticationFilter. Riesgo de token replay cross-service.'},
    {id:'DEBT-028',titulo:'Hardening CORS producci\u00f3n',desc:'Configuraci\u00f3n CORS demasiado permisiva. Restringir a dominios autorizados.'},
    {id:'DEBT-029',titulo:'Migraci\u00f3n Mockito 4 \u2192 5',desc:'Actualizar suite de tests para compatibilidad con Mockito 5 y evitar deprecations.'},
  ]
};

var sprint19Data = {
  sprint:19, feat:'FEAT-017', version:'v1.19.0',
  titulo:'Domiciliaciones y Recibos (SEPA Direct Debit Core)',
  goal:'Implementar el ciclo de vida completo de domiciliaciones SEPA: alta de mandatos, procesamiento autom\u00e1tico de cargos, consulta de historial y gesti\u00f3n de recibos para cumplimiento del SEPA Core Rulebook 2024.',
  fechaInicio:'2026-03-02', fechaFin:'2026-03-15',
  stories:[
    {key:'SCRUM-88',desc:'[FEAT-017] Alta de mandato SEPA Direct Debit con firma digital del deudor',sp:3,tipo:'Historia',prio:'Alta'},
    {key:'SCRUM-89',desc:'[FEAT-017] Procesamiento autom\u00e1tico de cargos de domiciliaciones activas',sp:3,tipo:'Historia',prio:'Alta'},
    {key:'SCRUM-90',desc:'[FEAT-017] Consulta y gesti\u00f3n del historial de recibos domiciliados',sp:2,tipo:'Historia',prio:'Media'},
    {key:'SCRUM-91',desc:'[FEAT-017] Cancelaci\u00f3n de mandato y notificaci\u00f3n al acreedor (SEPA)',sp:2,tipo:'Historia',prio:'Alta'},
    {key:'SCRUM-92',desc:'[FEAT-017] Notificaciones push para cargo inminente y cargo procesado',sp:2,tipo:'Historia',prio:'Media'},
    {key:'SCRUM-93',desc:'[DEBT-032] Lambda refactor \u2192 named classes en servicios de transacciones',sp:4,tipo:'Deuda T\u00e9cnica',prio:'Media'},
    {key:'SCRUM-94',desc:'[DEBT-033] Split Angular AuthService \u2192 TokenService + SessionService',sp:4,tipo:'Deuda T\u00e9cnica',prio:'Media'},
    {key:'SCRUM-95',desc:'[DEBT-034] Strategy pattern en DebitProcessorService',sp:4,tipo:'Deuda T\u00e9cnica',prio:'Media'},
  ],
  debt:[
    {id:'DEBT-032',titulo:'Lambda refactor \u2192 named classes',desc:'Lambdas an\u00f3nimas complejas en TransactionService y DirectDebitService detectadas en CR S18.'},
    {id:'DEBT-033',titulo:'Angular AuthService split',desc:'AuthService monol\u00edtico (380 l\u00edneas) con dependencias c\u00edclicas. Dividir en servicios cohesivos.'},
    {id:'DEBT-034',titulo:'Strategy pattern DebitProcessorService',desc:'Bloque if/else extenso en DebitProcessorService. Migrar a Strategy + Factory (OCP).'},
  ]
};

var sprint20Data = {
  sprint:20, feat:'FEAT-018', version:'v1.20.0',
  titulo:'Exportaci\u00f3n de Movimientos Bancarios (PDF/CSV)',
  goal:'Eliminar la deuda t\u00e9cnica acumulada en S19 y entregar exportaci\u00f3n de movimientos en formato PDF y CSV para cumplimiento regulatorio PSD2 Art.47 (acceso al historial de pagos).',
  fechaInicio:'2026-03-16', fechaFin:'2026-03-30',
  stories:[
    {key:'SCRUM-98',desc:'[FEAT-018] Exportar movimientos en PDF con cabecera corporativa y filtro por fecha',sp:3,tipo:'Historia',prio:'Alta'},
    {key:'SCRUM-99',desc:'[FEAT-018] Exportar movimientos en CSV (UTF-8 BOM, formato europeo)',sp:2,tipo:'Historia',prio:'Alta'},
    {key:'SCRUM-100',desc:'[FEAT-018] Filtro multicriteria de movimientos previo a exportaci\u00f3n',sp:2,tipo:'Historia',prio:'Media'},
    {key:'SCRUM-101',desc:'[FEAT-018] Audit log de exportaciones GDPR Art.15 + PCI-DSS Req.10',sp:1,tipo:'Historia',prio:'Alta'},
    {key:'SCRUM-102',desc:'[DEBT-032] Lambda refactor \u2192 named classes (resoluci\u00f3n desde S19)',sp:4,tipo:'Deuda T\u00e9cnica',prio:'Media'},
    {key:'SCRUM-103',desc:'[DEBT-033] Split Angular AuthService \u2192 TokenService + SessionService + AuthGuard',sp:4,tipo:'Deuda T\u00e9cnica',prio:'Media'},
    {key:'SCRUM-104',desc:'[DEBT-034] Strategy pattern en DebitProcessorService (SEPA Core/COR/Recurring)',sp:4,tipo:'Deuda T\u00e9cnica',prio:'Media'},
    {key:'SCRUM-105',desc:'[DEBT-035] Handler RETURNED en CoreBankingWebhook + notificaci\u00f3n push R-code SEPA',sp:4,tipo:'Deuda T\u00e9cnica',prio:'Media'},
  ],
  debt:[
    {id:'DEBT-032',titulo:'Lambda refactor \u2192 named classes',desc:'Resoluci\u00f3n definitiva: NegativeAmountTransactionFilter, TransactionAmountDescComparator, ActiveDirectDebitFilter.'},
    {id:'DEBT-033',titulo:'Angular AuthService split',desc:'TokenService (JWT lifecycle) + SessionService (Angular signal) + AuthGuard functional. 0 breaking changes.'},
    {id:'DEBT-034',titulo:'Strategy pattern DebitProcessorService',desc:'SEPACoreDebitStrategy, SEPACORDebitStrategy, RecurringDebitStrategy. DebitProcessorStrategyFactory OCP.'},
    {id:'DEBT-035',titulo:'Handler RETURNED CoreBanking webhook',desc:'CoreBankingReturnedHandler + SepaReturnCode R01-R10. Push notification con mensaje legible al usuario.'},
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// GENERA Y GUARDA
// ═══════════════════════════════════════════════════════════════════════════
async function gen(data, outPath) {
  var d = data;
  var doc = buildDoc(d.sprint, d.feat, d.version, d.titulo, d.goal,
                     d.fechaInicio, d.fechaFin, d.stories, d.debt, null);
  var buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buf);
  console.log('  OK '+outPath.split('/').pop()+' ('+Math.round(buf.length/1024)+'KB)');
}

async function main() {
  console.log('\n=== Planning Docs Generator — S18, S19, S20 ===');
  await gen(sprint18Data, 'docs/deliverables/sprint-18-FEAT-016/word/sprint18-planning-doc.docx');
  await gen(sprint19Data, 'docs/deliverables/sprint-19-FEAT-017/word/sprint19-planning-doc.docx');
  await gen(sprint20Data, 'docs/deliverables/sprint-20-FEAT-018/word/sprint20-planning-doc.docx');
  console.log('\n=== 3 planning docs generados ===\n');
}
main().catch(function(e){ console.error(e); process.exit(1); });
