// SOFIA Documentation Agent — gen_word.js — Sprint 3 — FEAT-002 Sesiones Activas
'use strict';
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, LevelFormat, TabStopType
} = require('docx');
const fs = require('fs');
const path = require('path');

const WORD_DIR = path.join(__dirname, 'word');
if (!fs.existsSync(WORD_DIR)) fs.mkdirSync(WORD_DIR, { recursive: true });

const C = { BLUE:'1B3A6B', MED:'2E5F9E', LT:'4A7EC2', VL:'EBF3FB', WHITE:'FFFFFF', GRAY:'CCCCCC', GREEN:'C6EFCE', RED:'FFCCCC', YEL:'FFEB9C', GDK:'E2EFDA' };
const b1 = c => ({ style: BorderStyle.SINGLE, size: 1, color: c || C.GRAY });
const BB = { top: b1(), bottom: b1(), left: b1(), right: b1() };
const H = (text, lv, color = C.BLUE) => new Paragraph({ heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][lv-1], children: [new TextRun({ text, font:'Arial', size:[32,26,22][lv-1], bold:true, color })], spacing: { before: lv===1?360:200, after: lv===1?120:80 } });
const P = (text, opts={}) => new Paragraph({ children: [new TextRun({ text, font:'Arial', size:20, ...opts })], spacing:{after:80} });
const SP = () => new Paragraph({ children:[new TextRun('')], spacing:{after:80} });
const HC = (text, w) => new TableCell({ width:{size:w,type:WidthType.DXA}, shading:{fill:C.BLUE,type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:120,right:120}, verticalAlign:VerticalAlign.CENTER, borders:BB, children:[new Paragraph({children:[new TextRun({text,font:'Arial',size:19,bold:true,color:C.WHITE})]})] });
const DC = (text, w, fill=C.WHITE, bold=false) => new TableCell({ width:{size:w,type:WidthType.DXA}, shading:{fill,type:ShadingType.CLEAR}, margins:{top:60,bottom:60,left:120,right:120}, borders:BB, children:[new Paragraph({children:[new TextRun({text:String(text??''),font:'Arial',size:19,bold})]})] });
const SF = s => { const u=String(s).toUpperCase(); if(u.includes('DONE')||u.includes('CLOSED')||u.includes('CERRADO'))return C.GDK; if(u.includes('PASS')||u.includes('APPROVED')||u.includes('ALCANZADO'))return C.GREEN; if(u.includes('ABIERTO')||u.includes('PARCIAL')||u.includes('WARN'))return C.YEL; if(u.includes('FAIL')||u.includes('ERROR'))return C.RED; return C.WHITE; };
const MT = rows => new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[2800,6226], rows: rows.map(([k,v],i) => new TableRow({children:[DC(k,2800,i%2===0?C.VL:C.WHITE,true),DC(v,6226,i%2===0?C.VL:C.WHITE)]})) });
const mkHDR = proj => ({ default: new Header({ children:[new Paragraph({ border:{bottom:{style:BorderStyle.SINGLE,size:6,color:C.BLUE,space:1}}, children:[new TextRun({text:'EXPERIS  |  SOFIA Software Factory',font:'Arial',size:18,bold:true,color:C.BLUE}),new TextRun({text:`\t${proj}`,font:'Arial',size:18,color:'444444'})], tabStops:[{type:TabStopType.RIGHT,position:9026}] })]}) });
const mkFTR = () => ({ default: new Footer({ children:[new Paragraph({ border:{top:{style:BorderStyle.SINGLE,size:6,color:C.BLUE,space:1}}, children:[new TextRun({text:'Confidencial — Experis',font:'Arial',size:16,color:'666666'}),new TextRun({text:'\tPágina ',font:'Arial',size:16,color:'666666'}),new TextRun({children:[PageNumber.CURRENT],font:'Arial',size:16,color:'666666'}),new TextRun({text:'\t2026-04-24',font:'Arial',size:16,color:'666666'})], tabStops:[{type:TabStopType.CENTER,position:4513},{type:TabStopType.RIGHT,position:9026}] })]}) });
const mkDoc = (proj, children) => new Document({ styles:{default:{document:{run:{font:'Arial',size:22}}}}, sections:[{ properties:{page:{size:{width:11906,height:16838},margin:{top:1270,right:1270,bottom:1270,left:1270}}}, headers:mkHDR(proj), footers:mkFTR(), children }] });
const save = async (doc, fname) => { const buf = await Packer.toBuffer(doc); fs.writeFileSync(path.join(WORD_DIR, fname), buf); console.log('  ✅', path.join(WORD_DIR, fname)); };

// Sprint 3 data
const SPRINT = '3'; const FEAT = 'FEAT-002'; const FEAT_TITLE = 'Sesiones Activas';
const PERIODO = '2026-04-14 → 2026-04-25'; const VERSION = 'v1.2.0'; const FECHA = '2026-04-25';

const items = [
  ['US-101','Listar sesiones activas del usuario','5','new-feature','✅ DONE'],
  ['US-102','Revocar sesión individual con confirmación OTP','4','new-feature','✅ DONE'],
  ['US-103','Timeout de inactividad configurable (15/30/60 min)','3','new-feature','✅ DONE'],
  ['US-104','Control de sesiones concurrentes LRU (máx. 3)','5','new-feature','✅ DONE'],
  ['US-105','Notificaciones email por login desde nuevo dispositivo','4','new-feature','✅ DONE'],
  ['DEBT-003','Migrar DELETE /deactivate → POST (convención REST)','1','tech-debt','✅ DONE'],
  ['ACT-Flyway','Flyway V5 session_tokens + session_metadata','2','infra','✅ DONE'],
];

const risks = [
  ['R-S3-001','Redis no disponible — sesiones en memoria','M','M','🟡 Media','Health check Redis en startup','✅ CERRADO','v1.2.0'],
  ['R-S3-002','LRU eviction fuerza cierre sesión silencioso','M','B','🟢 Baja','Notificación email al usuario','✅ CERRADO','v1.2.0'],
  ['R-S3-003','Email de alerta llega tarde (SMTP lento)','B','B','🟢 Baja','Async @EventListener','✅ CERRADO','v1.2.0'],
  ['NEW-R-003','TOTP_TEST_SECRET pendiente CI','M','A','🟠 Alta','Pendiente DevOps','⚠️ ABIERTO','Sprint 4'],
];

async function genSprintReport() {
  const gates = [
    ['Sprint Planning','SPRINT-003-planning.md','Product Owner','✅ APPROVED'],
    ['Arquitectura LLD','LLD-backend-sessions.md','Tech Lead','✅ APPROVED'],
    ['Code Review','CR-FEAT-002-sprint3.md','Tech Lead','✅ APPROVED'],
    ['QA Gate','QA-REPORT-sprint3.md','QA Lead','✅ APPROVED'],
    ['Go/No-Go STG','RELEASE-v1.2.0.md','Release Manager','✅ APPROVED'],
  ];
  const w4 = [2200,3426,1700,1700];
  const doc = mkDoc(`BankPortal — Sprint Report Sprint ${SPRINT}`, [
    H(`Sprint Report — Sprint ${SPRINT}`, 1), P(`BankPortal · Banco Meridian · ${FEAT}: ${FEAT_TITLE}`,{color:C.MED}), SP(),
    H('1. Metadata', 2),
    MT([['Proyecto','BankPortal — Banco Meridian'],['Sprint',`Sprint ${SPRINT}`],['Feature',`${FEAT} — ${FEAT_TITLE}`],['Período',PERIODO],['Estado','✅ CERRADO — Sprint Goal ALCANZADO'],['Versión',VERSION]]), SP(),
    H('2. Sprint Goal', 2),
    new Paragraph({ shading:{fill:C.VL,type:ShadingType.CLEAR}, border:{left:{style:BorderStyle.SINGLE,size:12,color:C.BLUE}}, spacing:{before:100,after:100}, indent:{left:200,right:200}, children:[new TextRun({text:'"Entregar FEAT-002 completa: sesiones activas con visibilidad, revocación segura con OTP, timeout configurable, control LRU de concurrencia y alertas de login inusual."',font:'Arial',size:20,italics:true,color:C.BLUE})] }),
    SP(), P('Estado: ✅ ALCANZADO — 24/24 SP completados.',{bold:true}), SP(),
    H('3. Resultados', 2),
    new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[3200,2000,2000,1826], rows:[
      new TableRow({children:['Métrica','Planificado','Real','Variación'].map((t,i)=>HC(t,[3200,2000,2000,1826][i]))}),
      ...[['Story Points','24','24','0'],['US completadas','5','5','0'],['DEBT resueltas','1','1','0'],['Tests nuevos','—','48','—'],['Defectos QA','0','0','—']].map(([m,p,r,v],i)=>new TableRow({children:[DC(m,3200,i%2===0?C.VL:C.WHITE,true),DC(p,2000,i%2===0?C.VL:C.WHITE),DC(r,2000,i%2===0?C.VL:C.WHITE),DC(v,1826,i%2===0?C.VL:C.WHITE)]})),
    ]}), SP(),
    H('4. Estado por Item', 2),
    new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[1200,3826,800,1400,1800], rows:[
      new TableRow({children:['ID','Título','SP','Tipo','Estado'].map((t,i)=>HC(t,[1200,3826,800,1400,1800][i]))}),
      ...items.map(([id,title,sp,tipo,st],i)=>new TableRow({children:[DC(id,1200,i%2===0?C.VL:C.WHITE,true),DC(title,3826,i%2===0?C.VL:C.WHITE),DC(sp,800,i%2===0?C.VL:C.WHITE),DC(tipo,1400,i%2===0?C.VL:C.WHITE),DC(st,1800,SF(st))]})),
      new TableRow({children:[DC('TOTAL',1200,C.BLUE,true),DC('7 ítems',3826,C.BLUE,true),DC('24',800,C.BLUE,true),DC('',1400,C.BLUE),DC('✅ 24/24 SP',1800,C.GDK,true)]}),
    ]}), SP(),
    H('5. Gates HITL', 2),
    new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:w4, rows:[
      new TableRow({children:['Gate','Artefacto','Aprobador','Estado'].map((t,i)=>HC(t,w4[i]))}),
      ...gates.map(([g,a,ap,st],i)=>new TableRow({children:[DC(g,w4[0],i%2===0?C.VL:C.WHITE,true),DC(a,w4[1],i%2===0?C.VL:C.WHITE),DC(ap,w4[2],i%2===0?C.VL:C.WHITE),DC(st,w4[3],SF(st))]})),
    ]}), SP(),
    H('6. Riesgos', 2),
    new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[900,2200,400,400,900,1826,900,700], rows:[
      new TableRow({children:['ID','Riesgo','P','I','Exp.','Mitigación','Estado','Cierre'].map((t,i)=>HC(t,[900,2200,400,400,900,1826,900,700][i]))}),
      ...risks.map(([id,r,p,imp,exp,plan,st,cl],i)=>new TableRow({children:[DC(id,900,i%2===0?C.VL:C.WHITE,true),DC(r,2200,i%2===0?C.VL:C.WHITE),DC(p,400,i%2===0?C.VL:C.WHITE),DC(imp,400,i%2===0?C.VL:C.WHITE),DC(exp,900,SF(exp)),DC(plan,1826,i%2===0?C.VL:C.WHITE),DC(st,900,SF(st)),DC(cl,700,i%2===0?C.VL:C.WHITE)]})),
    ]}), SP(),
    H('7. Cumplimiento PCI-DSS 4.0', 2),
    MT([['req. 8.2.4','Gestión de sesiones activas con TTL y revocación — ✅ CUMPLE'],['req. 8.2.8','Timeout de inactividad configurable — ✅ CUMPLE'],['req. 10.2.4','Registro de login y logout en audit_log — ✅ CUMPLE']]), SP(),
    P(`SOFIA SM Agent — Experis · ${FECHA}`,{color:'666666',italics:true}),
  ]);
  await save(doc, `Sprint-Report-Sprint${SPRINT}.docx`);
}

async function genRiskRegister() {
  const w = [900,2800,400,400,900,1826,900];
  const allRisks = [
    ['R-001','JWT HS256 comprometido','B','A','🟡 Media','RSA-256 (DEBT-002)','✅ CERRADO'],
    ['R-002','Rate limit in-process multi-nodo','M','M','🟡 Media','Redis distribuido','✅ CERRADO'],
    ['R-003','E2E TOTP_TEST_SECRET pendiente CI','M','A','🟠 Alta','Pendiente DevOps','⚠️ ABIERTO'],
    ['R-S3-001','Redis no disponible en arranque','M','M','🟡 Media','Health check startup','✅ CERRADO'],
    ['R-S3-002','LRU eviction sin aviso al usuario','M','B','🟢 Baja','Email async al usuario','✅ CERRADO'],
    ['R-S3-003','SMTP lento en alertas de login','B','B','🟢 Baja','@Async + retry','✅ CERRADO'],
  ];
  const doc = mkDoc('BankPortal — Risk Register Sprint 3', [
    H('Risk Register — BankPortal — Sprint 3', 1), P(`Proyecto: BankPortal · ${FEAT}: ${FEAT_TITLE} · Fecha: ${FECHA}`,{color:C.MED}), SP(),
    H('Registro de Riesgos Acumulado', 2),
    new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:w, rows:[
      new TableRow({children:['ID','Riesgo','P','I','Exposición','Mitigación','Estado'].map((t,i)=>HC(t,w[i]))}),
      ...allRisks.map(([id,r,p,imp,exp,plan,st],i)=>new TableRow({children:[DC(id,w[0],i%2===0?C.VL:C.WHITE,true),DC(r,w[1],i%2===0?C.VL:C.WHITE),DC(p,w[2],i%2===0?C.VL:C.WHITE),DC(imp,w[3],i%2===0?C.VL:C.WHITE),DC(exp,w[4],SF(exp)),DC(plan,w[5],i%2===0?C.VL:C.WHITE),DC(st,w[6],SF(st))]})),
    ]}), SP(),
    MT([['Total riesgos','6'],['Cerrados','5'],['Abiertos','1 — R-003 (TOTP CI)'],['Acción','DevOps Sprint 4: configurar TOTP_TEST_SECRET en Jenkins']]), SP(),
    P(`SOFIA SM Agent — Experis · ${FECHA}`,{color:'666666',italics:true}),
  ]);
  await save(doc, `Risk-Register-Sprint${SPRINT}.docx`);
}

async function genReleaseNotes() {
  const endpoints = [
    ['GET /api/v1/sessions','Listar sesiones activas del usuario','scope=full-session'],
    ['DELETE /api/v1/sessions/{id}','Revocar sesión individual (OTP required)','scope=full-session'],
    ['DELETE /api/v1/sessions/all','Revocar todas las sesiones excepto la actual','scope=full-session'],
    ['PUT /api/v1/users/me/timeout','Configurar timeout de inactividad','scope=full-session'],
    ['GET /api/v1/sessions/count','Contador de sesiones activas para el badge','scope=full-session'],
  ];
  const doc = mkDoc(`BankPortal — Release Notes ${VERSION}`, [
    H(`Release Notes — ${VERSION} — BankPortal`, 1), P(`BankPortal · Banco Meridian · ${FEAT}: ${FEAT_TITLE}`,{color:C.MED}), SP(),
    H('1. Metadata', 2),
    MT([['Versión',VERSION],['Fecha release',FECHA],['Sprint',`Sprint ${SPRINT}`],['Feature',`${FEAT} — ${FEAT_TITLE}`],['PCI-DSS 4.0','req. 8.2.4 + 8.2.8 + 10.2.4 ✅ CUMPLE']]), SP(),
    H('2. Nuevas Funcionalidades', 2),
    new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[1000,6526,1500], rows:[
      new TableRow({children:['ID','Descripción','SP'].map((t,i)=>HC(t,[1000,6526,1500][i]))}),
      ...items.filter(([id])=>id.startsWith('US')).map(([id,d,sp,,st],i)=>new TableRow({children:[DC(id,1000,i%2===0?C.VL:C.WHITE,true),DC(d,6526,i%2===0?C.VL:C.WHITE),DC(sp,1500,i%2===0?C.VL:C.WHITE)]})),
    ]}), SP(),
    H('3. Nuevos Endpoints', 2),
    new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[2800,4000,2226], rows:[
      new TableRow({children:['Endpoint','Descripción','Seguridad'].map((t,i)=>HC(t,[2800,4000,2226][i]))}),
      ...endpoints.map(([ep,d,sec],i)=>new TableRow({children:[DC(ep,2800,i%2===0?C.VL:C.WHITE,true),DC(d,4000,i%2===0?C.VL:C.WHITE),DC(sec,2226,i%2===0?C.VL:C.WHITE)]})),
    ]}), SP(),
    H('4. Flyway V5', 2),
    MT([['session_tokens','Token hash + userId + expiresAt + device fingerprint'],['session_metadata','userId + browser + OS + IP subnet + createdAt + lastActivityAt']]), SP(),
    P(`SOFIA DevOps Agent — Experis · ${FECHA}`,{color:'666666',italics:true}),
  ]);
  await save(doc, `Release-Notes-${VERSION}.docx`);
}

(async () => {
  console.log(`\n📄 SOFIA Documentation Agent — Sprint ${SPRINT} Word docs...`);
  await genSprintReport(); await genRiskRegister(); await genReleaseNotes();
  console.log('✅ Word docs Sprint 3 completados\n');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
