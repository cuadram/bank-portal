// SOFIA Documentation Agent — gen_word.js
// Sprint 2 — BankPortal — Banco Meridian
// Ejecutar: node gen_word.js  (disparado automáticamente por .git/hooks/post-commit)
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
  BLUE:'1B3A6B', MED:'2E5F9E', LT:'4A7EC2',
  VL:'EBF3FB',   WHITE:'FFFFFF', GRAY:'CCCCCC',
  GREEN:'C6EFCE', RED:'FFCCCC', YEL:'FFEB9C', GDK:'E2EFDA',
};
const b1 = c => ({ style: BorderStyle.SINGLE, size: 1, color: c || C.GRAY });
const BB = { top: b1(), bottom: b1(), left: b1(), right: b1() };

// ── Helpers ─────────────────────────────────────────────────────────────────
const H = (text, lv, color = C.BLUE) => new Paragraph({
  heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][lv - 1],
  children: [new TextRun({ text, font: 'Arial', size: [32,26,22][lv-1], bold: true, color })],
  spacing: { before: lv===1?360:200, after: lv===1?120:80 },
});
const P = (text, opts={}) => new Paragraph({
  children: [new TextRun({ text, font:'Arial', size:20, ...opts })], spacing:{after:80},
});
const SP = () => new Paragraph({ children:[new TextRun('')], spacing:{after:80} });

const HC = (text, w) => new TableCell({
  width:{size:w,type:WidthType.DXA}, shading:{fill:C.BLUE,type:ShadingType.CLEAR},
  margins:{top:80,bottom:80,left:120,right:120}, verticalAlign:VerticalAlign.CENTER, borders:BB,
  children:[new Paragraph({children:[new TextRun({text,font:'Arial',size:19,bold:true,color:C.WHITE})]})],
});
const DC = (text, w, fill=C.WHITE, bold=false) => new TableCell({
  width:{size:w,type:WidthType.DXA}, shading:{fill,type:ShadingType.CLEAR},
  margins:{top:60,bottom:60,left:120,right:120}, borders:BB,
  children:[new Paragraph({children:[new TextRun({text:String(text??''),font:'Arial',size:19,bold})]})],
});
const SF = s => {
  const u = String(s).toUpperCase();
  if (u.includes('CERRADO')||u.includes('DONE')||u.includes('CLOSED')) return C.GDK;
  if (u.includes('APPROVED')||u.includes('ALCANZADO')||u.includes('PASS')) return C.GREEN;
  if (u.includes('ABIERTO')||u.includes('PARCIAL')||u.includes('WARN')) return C.YEL;
  if (u.includes('FAIL')||u.includes('ERROR')) return C.RED;
  if (u.includes('✅')) return C.GDK;
  if (u.includes('⚠')) return C.YEL;
  return C.WHITE;
};
const MT = rows => new Table({
  width:{size:9026,type:WidthType.DXA}, columnWidths:[2800,6226],
  rows: rows.map(([k,v],i) => new TableRow({children:[
    DC(k,2800,i%2===0?C.VL:C.WHITE,true),
    DC(v,6226,i%2===0?C.VL:C.WHITE),
  ]})),
});
const mkHDR = proj => ({ default: new Header({ children:[new Paragraph({
  border:{bottom:{style:BorderStyle.SINGLE,size:6,color:C.BLUE,space:1}},
  children:[
    new TextRun({text:'EXPERIS  |  SOFIA Software Factory',font:'Arial',size:18,bold:true,color:C.BLUE}),
    new TextRun({text:`\t${proj}`,font:'Arial',size:18,color:'444444'}),
  ],
  tabStops:[{type:TabStopType.RIGHT,position:9026}],
})]})});
const mkFTR = () => ({ default: new Footer({ children:[new Paragraph({
  border:{top:{style:BorderStyle.SINGLE,size:6,color:C.BLUE,space:1}},
  children:[
    new TextRun({text:'Confidencial — Experis',font:'Arial',size:16,color:'666666'}),
    new TextRun({text:'\tPágina ',font:'Arial',size:16,color:'666666'}),
    new TextRun({children:[PageNumber.CURRENT],font:'Arial',size:16,color:'666666'}),
    new TextRun({text:'\t2026-04-10',font:'Arial',size:16,color:'666666'}),
  ],
  tabStops:[{type:TabStopType.CENTER,position:4513},{type:TabStopType.RIGHT,position:9026}],
})]})});
const mkDoc = (proj, children) => new Document({
  styles:{
    default:{document:{run:{font:'Arial',size:22}}},
    paragraphStyles:[
      {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,
       run:{font:'Arial',size:32,bold:true,color:C.BLUE},
       paragraph:{spacing:{before:360,after:120},outlineLevel:0}},
      {id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,
       run:{font:'Arial',size:26,bold:true,color:C.MED},
       paragraph:{spacing:{before:240,after:80},outlineLevel:1}},
      {id:'Heading3',name:'Heading 3',basedOn:'Normal',next:'Normal',quickFormat:true,
       run:{font:'Arial',size:22,bold:true,color:C.LT},
       paragraph:{spacing:{before:160,after:60},outlineLevel:2}},
    ],
  },
  numbering:{config:[{reference:'bullets',levels:[{level:0,format:LevelFormat.BULLET,text:'•',
    alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]}]},
  sections:[{
    properties:{page:{size:{width:11906,height:16838},margin:{top:1270,right:1270,bottom:1270,left:1270}}},
    headers:mkHDR(proj), footers:mkFTR(), children,
  }],
});
const save = async (doc, fname) => {
  const buf = await Packer.toBuffer(doc);
  const p = path.join(WORD_DIR, fname);
  fs.writeFileSync(p, buf);
  console.log('  ✅', p);
};

// ════════════════════════════════════════════════════════════════════════════
//  1. SPRINT REPORT — Sprint 2
// ════════════════════════════════════════════════════════════════════════════
async function genSprintReport() {
  const items = [
    ['DEBT-001','RateLimiter → Redis distribuido','4','tech-debt','✅ DONE'],
    ['DEBT-002','JwtService → RSA-256','4','tech-debt','✅ DONE'],
    ['US-004','Desactivar 2FA con confirmación','5','new-feature','✅ DONE'],
    ['US-005','Auditoría completa inmutable','5','new-feature','✅ DONE'],
    ['US-007','Suite E2E Playwright','6','new-feature','✅ DONE'],
  ];
  const gates = [
    ['Sprint Planning','SPRINT-002-planning.md','Product Owner','✅ APPROVED'],
    ['Code Review','CR-FEAT-001-sprint2-v1.md','Tech Lead','✅ APPROVED (1 ciclo)'],
    ['QA Doble Gate','QA-FEAT-001-sprint2.md','QA Lead + PO','✅ APPROVED'],
    ['Go/No-Go PROD','RELEASE-v1.1.0.md','Release Manager','✅ APPROVED'],
  ];
  const risks = [
    ['NEW-R-001','Redis no disponible en STG','✅ CERRADO — Redis disponible día 1'],
    ['NEW-R-002','Keypair RSA no provisionado','✅ CERRADO — keypair generado y distribuido'],
    ['NEW-R-003','E2E Playwright falla en CI','⚠️ PARCIAL — TOTP_TEST_SECRET pendiente CI'],
    ['R-008','FEAT-001 no cierra en Sprint 2','✅ CERRADO — FEAT-001 100% completada'],
  ];

  const doc = mkDoc('BankPortal — Sprint Report Sprint 2', [
    H('Sprint Report — Sprint 2', 1),
    P('BankPortal — Portal Bancario Digital · Banco Meridian',{color:C.MED}), SP(),

    H('1. Metadata', 2),
    MT([
      ['Proyecto','BankPortal — Banco Meridian'],
      ['Sprint','Sprint 2'],
      ['Período','2026-03-30 → 2026-04-10'],
      ['SM','SOFIA SM Agent — Experis'],
      ['Fecha cierre','2026-04-10'],
      ['Estado','✅ CERRADO — Sprint Goal ALCANZADO'],
      ['Versión','v1.1.0 — FEAT-001 COMPLETA'],
    ]), SP(),

    H('2. Sprint Goal', 2),
    new Paragraph({
      shading:{fill:C.VL,type:ShadingType.CLEAR},
      border:{left:{style:BorderStyle.SINGLE,size:12,color:C.BLUE}},
      spacing:{before:100,after:100}, indent:{left:200,right:200},
      children:[new TextRun({
        text:'"Completar FEAT-001 al 100%: desactivación 2FA, auditoría completa PCI-DSS, suite E2E automatizada y deuda técnica crítica resuelta."',
        font:'Arial',size:20,italics:true,color:C.BLUE,
      })],
    }),
    SP(),
    P('Estado: ✅ ALCANZADO — todos los ítems completados al 100%.',{bold:true}), SP(),

    H('3. Resultados', 2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[3200,2000,2000,1826],
      rows:[
        new TableRow({children:['Métrica','Planificado','Real','Variación'].map((t,i)=>HC(t,[3200,2000,2000,1826][i]))}),
        ...[ ['Story Points','24','24','0 SP'],
             ['US completadas','3','3','0'],
             ['DEBT resueltas','2','2','0'],
             ['Defectos QA','0','0','—'],
             ['NCs Code Review','0','0','—'],
             ['Menores CR resueltos','—','4','4'],
        ].map(([m,p,r,v],i) => new TableRow({children:[
          DC(m,3200,i%2===0?C.VL:C.WHITE,true),
          DC(p,2000,i%2===0?C.VL:C.WHITE),
          DC(r,2000,i%2===0?C.VL:C.WHITE),
          DC(v,1826,i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }), SP(),

    H('4. Estado por Item', 2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[1200,3826,800,1400,1800],
      rows:[
        new TableRow({children:['ID','Título','SP','Tipo','Estado'].map((t,i)=>HC(t,[1200,3826,800,1400,1800][i]))}),
        ...items.map(([id,title,sp,tipo,st],i)=>new TableRow({children:[
          DC(id,1200,i%2===0?C.VL:C.WHITE,true),
          DC(title,3826,i%2===0?C.VL:C.WHITE),
          DC(sp,800,i%2===0?C.VL:C.WHITE),
          DC(tipo,1400,i%2===0?C.VL:C.WHITE),
          DC(st,1800,SF(st)),
        ]})),
        new TableRow({children:[
          DC('TOTAL',1200,C.BLUE,true), DC('Sprint 2 — 5 ítems',3826,C.BLUE,true),
          DC('24',800,C.BLUE,true), DC('',1400,C.BLUE), DC('✅ 24/24 SP',1800,C.GDK,true),
        ]}),
      ],
    }), SP(),

    H('5. Gates HITL Completados', 2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[2000,3226,2000,1800],
      rows:[
        new TableRow({children:['Gate','Artefacto','Aprobador','Estado'].map((t,i)=>HC(t,[2000,3226,2000,1800][i]))}),
        ...gates.map(([g,a,ap,st],i)=>new TableRow({children:[
          DC(g,2000,i%2===0?C.VL:C.WHITE,true),
          DC(a,3226,i%2===0?C.VL:C.WHITE),
          DC(ap,2000,i%2===0?C.VL:C.WHITE),
          DC(st,1800,SF(st)),
        ]})),
      ],
    }), SP(),

    H('6. Riesgos — Sprint 2', 2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[1100,3726,4200],
      rows:[
        new TableRow({children:['ID','Riesgo','Estado Final'].map((t,i)=>HC(t,[1100,3726,4200][i]))}),
        ...risks.map(([id,r,st],i)=>new TableRow({children:[
          DC(id,1100,i%2===0?C.VL:C.WHITE,true),
          DC(r,3726,i%2===0?C.VL:C.WHITE),
          DC(st,4200,SF(st)),
        ]})),
      ],
    }), SP(),

    H('7. Deuda Técnica Generada', 2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[1200,4726,1400,1700],
      rows:[
        new TableRow({children:['ID','Descripción','Impacto','Sprint Objetivo'].map((t,i)=>HC(t,[1200,4726,1400,1700][i]))}),
        new TableRow({children:[
          DC('DEBT-003',1200,C.WHITE,true),
          DC('Migrar DELETE /deactivate → POST (convención REST)',4726),
          DC('Bajo',1400), DC('Sprint 3 (si aplica)',1700),
        ]}),
      ],
    }), SP(),

    H('8. Métricas Acumuladas FEAT-001', 2),
    MT([
      ['Sprints totales','2'],
      ['Story Points totales','40 / 40 SP'],
      ['Velocidad media','24 SP/sprint'],
      ['Defectos totales','0'],
      ['NCs Code Review','2 (cerradas Sprint 1) + 0 (Sprint 2)'],
      ['Gates HITL completados','10'],
      ['PCI-DSS 4.0 req. 8.4','✅ CUMPLE'],
      ['ISO 27001 A.9.4','✅ CUMPLE'],
    ]), SP(),

    P('SOFIA SM Agent — Experis · 2026-04-10 · FEAT-001 CLOSED',{color:'666666',italics:true}),
    P('Generado automáticamente por SOFIA Documentation Agent',{color:'999999',italics:true}),
  ]);
  await save(doc, 'Sprint-Report-Sprint2.docx');
}

// ════════════════════════════════════════════════════════════════════════════
//  2. RISK REGISTER
// ════════════════════════════════════════════════════════════════════════════
async function genRiskRegister() {
  const risks = [
    ['R-001','JWT HS256 comprometido','B','A','🟡 Media','DEBT-002 → RSA-256','✅ CERRADO','v1.1.0'],
    ['R-002','Rate limit in-process multi-nodo','M','M','🟡 Media','DEBT-001 → Redis','✅ CERRADO','v1.1.0'],
    ['R-003','Cobertura E2E insuficiente','M','A','🟠 Alta','US-007 Playwright Sprint 2','✅ CERRADO','Sprint 2'],
    ['R-004','Complejidad TOTP RFC 6238','B','M','🟢 Baja','Sprint 1 cubierto','✅ CERRADO','Sprint 1'],
    ['R-005','Migración BD en PROD','B','A','🟡 Media','Flyway rollback probado','✅ CERRADO','v1.0.0'],
    ['R-006','Performance con rate limiter','B','B','🟢 Baja','Redis distribuido < 5ms','✅ CERRADO','DEBT-001'],
    ['R-007','Sincronización TOTP cliente','B','M','🟢 Baja','Ventana tolerancia ±30s','✅ CERRADO','Sprint 1'],
    ['R-008','FEAT-001 no cierra en Sprint 2','B','A','🟡 Media','24 SP = 24 SP scope','✅ CERRADO','Sprint 2'],
    ['NEW-R-001','Redis no disponible en STG','M','M','🟡 Media','Redis disponible día 1','✅ CERRADO','Sprint 2'],
    ['NEW-R-002','Keypair RSA no provisionado','B','A','🟡 Media','Keypair generado día 1','✅ CERRADO','Sprint 2'],
    ['NEW-R-003','E2E Playwright falla en CI','M','A','🟠 Alta','TOTP_TEST_SECRET pendiente','⚠️ ABIERTO','Sprint 3'],
  ];
  const w = [900,2600,400,400,900,2026,900,900];

  const doc = mkDoc('BankPortal — Risk Register', [
    H('Risk Register — BankPortal', 1),
    P('Proyecto: BankPortal — Banco Meridian · FEAT-001 2FA',{color:C.MED}),
    P('Fecha: 2026-04-10 · Sprint cierre: 2 · Estado: FEAT-001 CLOSED',{color:'666666'}), SP(),

    H('Registro de Riesgos', 2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:w,
      rows:[
        new TableRow({children:['ID','Riesgo','P','I','Exposición','Plan','Estado','Cierre'].map((t,i)=>HC(t,w[i]))}),
        ...risks.map(([id,r,p,imp,exp,plan,st,cl],i)=>new TableRow({children:[
          DC(id,w[0],i%2===0?C.VL:C.WHITE,true),
          DC(r,w[1],i%2===0?C.VL:C.WHITE),
          DC(p,w[2],i%2===0?C.VL:C.WHITE),
          DC(imp,w[3],i%2===0?C.VL:C.WHITE),
          DC(exp,w[4],SF(exp)),
          DC(plan,w[5],i%2===0?C.VL:C.WHITE),
          DC(st,w[6],SF(st)),
          DC(cl,w[7],i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }), SP(),

    H('Leyenda', 2),
    MT([
      ['P — Probabilidad','B=Baja · M=Media · A=Alta'],
      ['I — Impacto','B=Bajo · M=Medio · A=Alto'],
      ['Exposición','🔴 Crítica · 🟠 Alta · 🟡 Media · 🟢 Baja'],
    ]), SP(),

    H('Resumen', 2),
    MT([
      ['Riesgos totales','11'],
      ['Cerrados','10'],
      ['Abiertos','1 — NEW-R-003 (Exposición Alta)'],
      ['Acción','DevOps: configurar TOTP_TEST_SECRET en Jenkins antes de Sprint 3'],
    ]), SP(),

    P('SOFIA SM Agent — Experis · 2026-04-10',{color:'666666',italics:true}),
  ]);
  await save(doc, 'Risk-Register-Sprint2.docx');
}

// ════════════════════════════════════════════════════════════════════════════
//  3. RELEASE NOTES v1.1.0
// ════════════════════════════════════════════════════════════════════════════
async function genReleaseNotes() {
  const allUS = [
    ['US-006','Setup TOTP','3','✅ v1.0.0'],
    ['US-001','Activar 2FA','8','✅ v1.0.0'],
    ['US-002','Verificar OTP login','8','✅ v1.0.0'],
    ['US-003','Recovery codes','5','✅ v1.0.0'],
    ['US-004','Desactivar 2FA','5','✅ v1.1.0'],
    ['US-005','Auditoría inmutable','5','✅ v1.1.0'],
    ['US-007','Suite E2E','6','✅ v1.1.0'],
  ];

  const doc = mkDoc('BankPortal — Release Notes v1.1.0', [
    H('Release Notes — v1.1.0 — BankPortal', 1),
    P('BankPortal — Portal Bancario Digital · Banco Meridian',{color:C.MED}), SP(),

    H('1. Metadata', 2),
    MT([
      ['Versión','v1.1.0'],
      ['Fecha release','2026-04-10'],
      ['Sprint','Sprint 2'],
      ['Cliente','Banco Meridian'],
      ['Aprobado por','Release Manager — Experis'],
      ['QA doble gate','QA Lead ✅ + Product Owner ✅'],
      ['Servicios','backend-2fa v1.1.0 · frontend-portal v1.1.0'],
      ['PCI-DSS 4.0 req. 8.4','✅ CUMPLE'],
      ['ISO 27001 A.9.4','✅ CUMPLE'],
    ]), SP(),

    H('2. Nuevas Funcionalidades (Sprint 2)', 2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[1000,6526,1500],
      rows:[
        new TableRow({children:['ID','Descripción','SP'].map((t,i)=>HC(t,[1000,6526,1500][i]))}),
        ...[ ['US-004','Desactivar 2FA con confirmación de contraseña','5'],
             ['US-005','Auditoría completa e inmutable de eventos 2FA','5'],
             ['US-007','Suite E2E Playwright automatizada','6'],
        ].map(([id,d,sp],i)=>new TableRow({children:[
          DC(id,1000,i%2===0?C.VL:C.WHITE,true),
          DC(d,6526,i%2===0?C.VL:C.WHITE),
          DC(sp,1500,i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }), SP(),

    H('3. Deuda Técnica Resuelta', 2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[1200,4826,3000],
      rows:[
        new TableRow({children:['ID','Descripción','Impacto'].map((t,i)=>HC(t,[1200,4826,3000][i]))}),
        ...[ ['DEBT-001','RateLimiterService → Bucket4j + Redis distribuido','Soporte multi-réplica'],
             ['DEBT-002','JwtService → JJWT RSA-256 con keypair real','Seguridad mejorada + JWKS ready'],
        ].map(([id,d,imp],i)=>new TableRow({children:[
          DC(id,1200,i%2===0?C.VL:C.WHITE,true),
          DC(d,4826,i%2===0?C.VL:C.WHITE),
          DC(imp,3000,i%2===0?C.VL:C.WHITE),
        ]})),
      ],
    }), SP(),

    H('4. Breaking Changes', 2),
    new Paragraph({
      shading:{fill:C.YEL,type:ShadingType.CLEAR},
      border:{left:{style:BorderStyle.SINGLE,size:12,color:'B8860B'}},
      spacing:{before:100,after:100}, indent:{left:200,right:200},
      children:[new TextRun({
        text:'⚠️  JWT_FULL_SECRET y JWT_PARTIAL_SECRET obsoletas tras migración a RSA-256 (DEBT-002). No eliminar durante el deploy inicial — esperar a que los health checks pasen.',
        font:'Arial',size:20,bold:true,
      })],
    }), SP(),

    H('5. Nuevas Variables de Entorno', 2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[2200,4826,2000],
      rows:[
        new TableRow({children:['Variable','Descripción','Requerida'].map((t,i)=>HC(t,[2200,4826,2000][i]))}),
        ...[ ['SPRING_REDIS_URL','URL de Redis para rate limiting distribuido','✅ Obligatoria'],
             ['JWT_PRIVATE_KEY','Clave privada RSA-2048 en base64 PKCS8','✅ Obligatoria'],
             ['JWT_PUBLIC_KEY','Clave pública RSA-2048 en base64 X509','✅ Obligatoria'],
        ].map(([v,d,r],i)=>new TableRow({children:[
          DC(v,2200,i%2===0?C.VL:C.WHITE,true),
          DC(d,4826,i%2===0?C.VL:C.WHITE),
          DC(r,2000,SF(r)),
        ]})),
      ],
    }), SP(),

    H('6. FEAT-001 — Estado Final v1.1.0', 2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[1000,5026,800,2200],
      rows:[
        new TableRow({children:['US','Descripción','SP','Estado'].map((t,i)=>HC(t,[1000,5026,800,2200][i]))}),
        ...allUS.map(([id,d,sp,st],i)=>new TableRow({children:[
          DC(id,1000,i%2===0?C.VL:C.WHITE,true),
          DC(d,5026,i%2===0?C.VL:C.WHITE),
          DC(sp,800,i%2===0?C.VL:C.WHITE),
          DC(st,2200,SF(st)),
        ]})),
        new TableRow({children:[
          DC('TOTAL',1000,C.BLUE,true), DC('7 US — FEAT-001 COMPLETA',5026,C.BLUE,true),
          DC('40',800,C.BLUE,true), DC('✅ 40/40 SP',2200,C.GDK,true),
        ]}),
      ],
    }), SP(),

    P('PCI-DSS 4.0 req. 8.4: ✅ CUMPLE · ISO 27001 A.9.4: ✅ CUMPLE',{bold:true,color:C.BLUE}), SP(),
    P('SOFIA DevOps Agent — Experis · 2026-04-10',{color:'666666',italics:true}),
  ]);
  await save(doc, 'Release-Notes-v1.1.0.docx');
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n📄 SOFIA Documentation Agent — generando Word docs...');
  await genSprintReport();
  await genRiskRegister();
  await genReleaseNotes();
  console.log('✅ Word docs completados\n');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
