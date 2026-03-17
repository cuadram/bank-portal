#!/usr/bin/env node
// SOFIA Documentation Agent — gen_all_word.js
// Genera Sprint Report + Risk Register + Release Notes para Sprints 4-8
// Ejecutar: node gen_all_word.js  (desde docs/deliverables/)
// Prerequisito: npm install -g docx  O  bash .sofia/scripts/install-deps.sh
'use strict';

// ── NODE_PATH para encontrar docx en cualquier entorno ────────────────────────
const Module = require('module');
const extraPaths = [
  '/opt/homebrew/lib/node_modules',
  '/usr/local/lib/node_modules',
  `${process.env.HOME}/.npm-global/lib/node_modules`,
  `${process.env.HOME}/.nvm/versions/node/${process.version.slice(1)}/lib/node_modules`,
];
extraPaths.forEach(p => { if (!Module._nodeModulePaths('.').includes(p)) Module._nodeModulePaths('.').push(p); });
if (process.env.NODE_PATH) {
  process.env.NODE_PATH += ':' + extraPaths.join(':');
} else {
  process.env.NODE_PATH = extraPaths.join(':');
}
Module._initPaths();

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, TabStopType, LevelFormat, AlignmentType
} = require('docx');
const fs   = require('fs');
const path = require('path');

// ── Paleta y helpers ─────────────────────────────────────────────────────────
const C = { BLUE:'1B3A6B', MED:'2E5F9E', LT:'4A7EC2', VL:'EBF3FB', WHITE:'FFFFFF', GRAY:'CCCCCC', GREEN:'C6EFCE', RED:'FFCCCC', YEL:'FFEB9C', GDK:'E2EFDA' };
const b1 = c => ({ style: BorderStyle.SINGLE, size: 1, color: c||C.GRAY });
const BB = { top:b1(), bottom:b1(), left:b1(), right:b1() };
const H = (text, lv, color=C.BLUE) => new Paragraph({ heading:[HeadingLevel.HEADING_1,HeadingLevel.HEADING_2,HeadingLevel.HEADING_3][lv-1], children:[new TextRun({text,font:'Arial',size:[32,26,22][lv-1],bold:true,color})], spacing:{before:lv===1?360:200,after:lv===1?120:80} });
const P = (text, opts={}) => new Paragraph({ children:[new TextRun({text,font:'Arial',size:20,...opts})], spacing:{after:80} });
const SP = () => new Paragraph({ children:[new TextRun('')], spacing:{after:80} });
const HC = (text,w) => new TableCell({ width:{size:w,type:WidthType.DXA}, shading:{fill:C.BLUE,type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:120,right:120}, verticalAlign:VerticalAlign.CENTER, borders:BB, children:[new Paragraph({children:[new TextRun({text,font:'Arial',size:19,bold:true,color:C.WHITE})]})] });
const DC = (text,w,fill=C.WHITE,bold=false) => new TableCell({ width:{size:w,type:WidthType.DXA}, shading:{fill,type:ShadingType.CLEAR}, margins:{top:60,bottom:60,left:120,right:120}, borders:BB, children:[new Paragraph({children:[new TextRun({text:String(text??''),font:'Arial',size:19,bold})]})] });
const SF = s => { const u=String(s).toUpperCase(); if(u.includes('DONE')||u.includes('CLOSED')||u.includes('CERRADO')||u.includes('✅'))return C.GDK; if(u.includes('PASS')||u.includes('APPROVED')||u.includes('ALCANZADO'))return C.GREEN; if(u.includes('ABIERTO')||u.includes('PARCIAL')||u.includes('WARN')||u.includes('⚠'))return C.YEL; if(u.includes('FAIL')||u.includes('ERROR'))return C.RED; return C.WHITE; };
const MT = rows => new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[2800,6226], rows:rows.map(([k,v],i)=>new TableRow({children:[DC(k,2800,i%2===0?C.VL:C.WHITE,true),DC(v,6226,i%2===0?C.VL:C.WHITE)]})) });
const mkHDR = proj => ({ default: new Header({ children:[new Paragraph({ border:{bottom:{style:BorderStyle.SINGLE,size:6,color:C.BLUE,space:1}}, children:[new TextRun({text:'EXPERIS  |  SOFIA Software Factory',font:'Arial',size:18,bold:true,color:C.BLUE}),new TextRun({text:`\t${proj}`,font:'Arial',size:18,color:'444444'})], tabStops:[{type:TabStopType.RIGHT,position:9026}] })]}) });
const mkFTR = fecha => ({ default: new Footer({ children:[new Paragraph({ border:{top:{style:BorderStyle.SINGLE,size:6,color:C.BLUE,space:1}}, children:[new TextRun({text:'Confidencial — Experis',font:'Arial',size:16,color:'666666'}),new TextRun({text:'\tPágina ',font:'Arial',size:16,color:'666666'}),new TextRun({children:[PageNumber.CURRENT],font:'Arial',size:16,color:'666666'}),new TextRun({text:`\t${fecha}`,font:'Arial',size:16,color:'666666'})], tabStops:[{type:TabStopType.CENTER,position:4513},{type:TabStopType.RIGHT,position:9026}] })]}) });
const mkDoc = (proj, fecha, children) => new Document({ styles:{default:{document:{run:{font:'Arial',size:22}}}}, sections:[{ properties:{page:{size:{width:11906,height:16838},margin:{top:1270,right:1270,bottom:1270,left:1270}}}, headers:mkHDR(proj), footers:mkFTR(fecha), children }] });
const save = async (doc, fpath) => { const buf = await Packer.toBuffer(doc); fs.writeFileSync(fpath, buf); console.log('  ✅', fpath); };
const W4 = [2200,3426,1700,1700];
const mkGateTable = gates => new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:W4, rows:[new TableRow({children:['Gate','Artefacto','Aprobador','Estado'].map((t,i)=>HC(t,W4[i]))}), ...gates.map(([g,a,ap,st],i)=>new TableRow({children:[DC(g,W4[0],i%2===0?C.VL:C.WHITE,true),DC(a,W4[1],i%2===0?C.VL:C.WHITE),DC(ap,W4[2],i%2===0?C.VL:C.WHITE),DC(st,W4[3],SF(st))]}))] });
const mkItemTable = items => new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[1200,3826,800,1400,1800], rows:[new TableRow({children:['ID','Título','SP','Tipo','Estado'].map((t,i)=>HC(t,[1200,3826,800,1400,1800][i]))}), ...items.map(([id,ti,sp,tipo,st],i)=>new TableRow({children:[DC(id,1200,i%2===0?C.VL:C.WHITE,true),DC(ti,3826,i%2===0?C.VL:C.WHITE),DC(sp,800,i%2===0?C.VL:C.WHITE),DC(tipo,1400,i%2===0?C.VL:C.WHITE),DC(st,1800,SF(st))]})), new TableRow({children:[DC('TOTAL',1200,C.BLUE,true),DC(`${items.length} ítems`,3826,C.BLUE,true),DC(items.reduce((a,[,,sp])=>a+Number(sp),0),800,C.BLUE,true),DC('',1400,C.BLUE),DC('✅ 24/24 SP',1800,C.GDK,true)]})] });
const mkRiskTable = risks => new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[900,2600,400,400,900,1926,900], rows:[new TableRow({children:['ID','Riesgo','P','I','Exp.','Mitigación','Estado'].map((t,i)=>HC(t,[900,2600,400,400,900,1926,900][i]))}), ...risks.map(([id,r,p,imp,exp,plan,st],i)=>new TableRow({children:[DC(id,900,i%2===0?C.VL:C.WHITE,true),DC(r,2600,i%2===0?C.VL:C.WHITE),DC(p,400,i%2===0?C.VL:C.WHITE),DC(imp,400,i%2===0?C.VL:C.WHITE),DC(exp,900,SF(exp)),DC(plan,1926,i%2===0?C.VL:C.WHITE),DC(st,900,SF(st))]})) ]});

// ── Sprint Data ──────────────────────────────────────────────────────────────
const SPRINTS = {
  4: {
    feat:'FEAT-003', titulo:'Dispositivos de Confianza', version:'v1.3.0',
    periodo:'2026-05-05 → 2026-05-16', fecha:'2026-05-16', dir:'sprint-4-FEAT-003',
    goal:'"Entregar FEAT-003 completa: gestión del ciclo de vida de dispositivos de confianza con fingerprint preciso, expiración automática a 90 días y notificaciones de cambios."',
    items:[['US-201','Gestionar dispositivos de confianza (ver/eliminar)','4','new-feature','✅ DONE'],['US-202','Agregar dispositivo con confirmación OTP','5','new-feature','✅ DONE'],['US-203','Revocar dispositivo individual o todos','4','new-feature','✅ DONE'],['US-204','Expiración automática 90 días + job nocturno','4','new-feature','✅ DONE'],['US-205','Notificaciones de cambio en dispositivos','4','new-feature','✅ DONE'],['DEBT-004','ua-parser-java para fingerprint preciso (WARN-F2-002)','2','tech-debt','✅ DONE'],['ACT-Flyway','Flyway V6 trusted_devices + device_fingerprints','1','infra','✅ DONE']],
    gates:[['Sprint Planning','SPRINT-004-planning.md','Product Owner','✅ APPROVED'],['Arquitectura','LLD-003-trusted-devices.md','Tech Lead','✅ APPROVED'],['Code Review','CR-FEAT-003-sprint4.md','Tech Lead','✅ APPROVED'],['QA Gate','QA-REPORT-sprint4.md','QA Lead','✅ APPROVED'],['Go/No-Go STG','RELEASE-v1.3.0.md','Release Manager','✅ APPROVED']],
    risks:[['R-S4-001','Fingerprint cambia al actualizar browser','M','B','🟢 Baja','Re-enrollment automático','✅ CERRADO'],['R-S4-002','Job nocturno falla — dispositivos no expirados','B','B','🟢 Baja','Alert + fallback manual','✅ CERRADO'],['R-003','TOTP_TEST_SECRET pendiente CI','M','A','🟠 Alta','Pendiente DevOps','⚠️ ABIERTO']],
    pci:[['8.6.1','Dispositivos de acceso gestionados','✅ CUMPLE'],['10.2.7','Cambios de config. de autenticación','✅ CUMPLE']],
    endpoints:[['GET /api/v1/trusted-devices','Listar dispositivos del usuario'],['POST /api/v1/trusted-devices','Agregar dispositivo (OTP required)'],['DELETE /api/v1/trusted-devices/{id}','Revocar dispositivo'],['DELETE /api/v1/trusted-devices/all','Revocar todos']],
  },
  5: {
    feat:'FEAT-005', titulo:'Panel de Auditoría (inicio)', version:'v1.4.0',
    periodo:'2026-05-26 → 2026-06-06', fecha:'2026-06-06', dir:'sprint-5-FEAT-005',
    goal:'"Implementar el Dashboard de Seguridad con resumen visual y la exportación de historial de eventos (PDF/CSV), cubriendo PCI-DSS 4.0 req. 10.7."',
    items:[['US-401','Dashboard de seguridad con resumen visual actividad','4','new-feature','✅ DONE'],['US-402','Exportar historial eventos en PDF y CSV','3','new-feature','✅ DONE'],['DEBT-005','SecurityDashboard 6 queries CompletableFuture.allOf()','3','tech-debt','✅ DONE'],['DEBT-006','OpenPDF async streaming para exportaciones grandes','2','tech-debt','✅ DONE'],['DEBT-007','ADR-010 SSE CORS CDN proxy config','3','tech-debt','✅ DONE'],['ACT-HLD','HLD FEAT-005 + diagrama C4 Context/Containers','2','documental','✅ DONE'],['ACT-LLD','LLD-005 backend + frontend US-401/402','2','documental','✅ DONE'],['ACT-ADR','ADR-009 dual HMAC key rotation','1','documental','✅ DONE'],['ACT-OpenAPI','OpenAPI v1.4.0 endpoints FEAT-005','1','documental','✅ DONE'],['ACT-E2E','Playwright E2E dashboard + exportación','3','testing','✅ DONE']],
    gates:[['Sprint Planning','SPRINT-005-planning.md','Product Owner','✅ APPROVED'],['HLD + ADR','HLD-FEAT-005 + ADR-009','Tech Lead','✅ APPROVED'],['LLD Review','LLD-005-backend + LLD-005-frontend','Tech Lead','✅ APPROVED'],['Code Review','CR-FEAT-005-sprint5.md','Tech Lead','✅ APPROVED'],['QA Gate','QA-REPORT-sprint5.md','QA Lead','✅ APPROVED']],
    risks:[['R-F5-001','PDF síncrono bloquea thread','M','B','🟢 Baja','@Async + streaming timeout','✅ CERRADO'],['R-F5-002','Hash SHA-256 desconocido para el usuario','B','B','🟢 Baja','Instrucciones en el PDF','✅ CERRADO'],['R-003','TOTP_TEST_SECRET pendiente CI','M','A','🟠 Alta','Pendiente DevOps','⚠️ ABIERTO']],
    pci:[['10.7','Historial consultable por titular','✅ CUMPLE'],['10.2.1','Eventos registrados','✅ CUMPLE'],['10.3.3','Exportación con SHA-256','✅ CUMPLE']],
    endpoints:[['GET /api/v1/security/dashboard','Dashboard resumen actividad'],['GET /api/v1/security/export','Exportar historial PDF/CSV'],['GET /api/v1/security/config-history','Historial cambios configuración']],
  },
  6: {
    feat:'FEAT-005+004', titulo:'Preferencias + Notificaciones inicio', version:'v1.5.0',
    periodo:'2026-06-09 → 2026-06-20', fecha:'2026-06-20', dir:'sprint-6-FEAT-005',
    goal:'"Cerrar FEAT-005 con las preferencias de seguridad unificadas e iniciar FEAT-004 con la infraestructura de notificaciones y los casos de uso de historial y mark-as-read."',
    items:[['US-403','Pantalla unificada de preferencias de seguridad','3','new-feature','✅ DONE'],['US-301','Historial paginado notificaciones 90 días','4','new-feature','✅ DONE'],['US-302','Mark-as-read individual + bulk','2','new-feature','✅ DONE'],['US-303','Badge unread-count @Cacheable 30s','3','new-feature','✅ DONE'],['DEBT-008','SecurityDashboard CompletableFuture.allOf() optimización','3','tech-debt','✅ DONE'],['Flyway-V7','Flyway V7 user_notifications base','2','infra','✅ DONE'],['ACT-ADR-010','ADR-010 SSE CDN/proxy + ADR-011 JWT context-pending','2','documental','✅ DONE'],['ACT-LLD-006','LLD-006 NotificationCenter backend + frontend','2','documental','✅ DONE'],['ACT-OpenAPI-141','OpenAPI v1.4.1 FEAT-005 cierre','1','documental','✅ DONE'],['ACT-E2E','E2E preferencias + notificaciones inicio','2','testing','✅ DONE']],
    gates:[['Sprint Planning','SPRINT-006-planning.md','Product Owner','✅ APPROVED'],['ADR-010/011','ADR-010 + ADR-011 context-pending JWT','Tech Lead','✅ APPROVED'],['LLD-006','LLD-006 NotificationCenter','Tech Lead','✅ APPROVED'],['Code Review','CR-Sprint6.md','Tech Lead','✅ APPROVED'],['QA Gate','QA-REPORT-sprint6.md','QA Lead','✅ APPROVED']],
    risks:[['R-S6-001','SSE connections sin límite inicial','M','M','🟡 Media','ADR-012 define pool Sprint 8','✅ CERRADO'],['R-S6-002','JWT context-pending reutilizable','M','A','🟠 Alta','DEBT-009 Sprint 8','⚠️ ABIERTO']],
    pci:[['8.6.3','Preferencias autenticación gestionadas','✅ CUMPLE'],['10.2.1','Cambios config registrados','✅ CUMPLE']],
    endpoints:[['GET /api/v1/security/preferences','Ver preferencias de seguridad'],['PUT /api/v1/security/preferences','Actualizar preferencias'],['GET /api/v1/notifications','Historial notificaciones paginado'],['GET /api/v1/notifications/unread-count','Badge count']],
  },
  7: {
    feat:'FEAT-006', titulo:'Autenticación Contextual y Bloqueo de Cuenta', version:'v1.7.0',
    periodo:'2026-06-09 → 2026-06-23', fecha:'2026-06-23', dir:'sprint-7-FEAT-006',
    goal:'"Implementar la capa de protección proactiva de PCI-DSS 4.0 req. 8.3.4: bloqueo automático de cuenta, desbloqueo seguro por email, autenticación contextual por subnet y historial de cambios de configuración."',
    items:[['US-601','Bloqueo automático tras 10 intentos fallidos (ventana 24h)','5','new-feature','✅ DONE'],['US-602','Desbloqueo por enlace email TTL 1h (anti-enumeration 204)','3','new-feature','✅ DONE'],['US-603','Login contextual scope=context-pending ADR-011','5','new-feature','✅ DONE'],['US-604','Historial cambios configuración 90 días PCI-DSS 10.2','4','new-feature','✅ DONE'],['US-403','Preferencias de seguridad unificadas (FEAT-005 cierre)','3','new-feature','✅ DONE'],['DEBT-008','SecurityDashboard CompletableFuture.allOf() 6 queries','3','tech-debt','✅ DONE'],['ACT-30','OpenAPI v1.4.0 claims JWT + ADR-011 + LLD-006/007','1','documental','✅ DONE']],
    gates:[['Sprint Planning','SPRINT-007-planning.md','Product Owner','✅ APPROVED'],['ADR-011 + LLD','ADR-011 + LLD-006/007','Tech Lead','✅ APPROVED'],['Code Review S1','US-601 + DEBT-008 + US-403','Tech Lead','✅ APPROVED'],['Code Review S2','US-602 + US-603 + US-604','Tech Lead','✅ APPROVED'],['QA Gate','QA-REPORT-sprint7 — 81 tests, 0 defectos','QA Lead','✅ APPROVED']],
    risks:[['R-S7-001','JWT context-pending reutilizable sin blacklist','M','A','🟠 Alta','DEBT-009 Sprint 8 prioritario','⚠️ ABIERTO'],['R-S7-002','extractIpSubnet duplicado en varios servicios','B','B','🟢 Baja','DEBT-010 Sprint 8','⚠️ ABIERTO']],
    pci:[['8.3.4','Bloqueo por intentos fallidos — US-601','✅ CUMPLE'],['8.3.4','Desbloqueo proceso controlado — US-602','✅ CUMPLE'],['10.2','Historial cambios configuración — US-604','✅ CUMPLE']],
    endpoints:[['POST /api/v1/account/unlock','Solicitar enlace desbloqueo (204 anti-enum)'],['GET /api/v1/account/unlock/{token}','Desbloquear cuenta desde email'],['POST /api/v1/auth/confirm-context','Confirmar subnet nueva (scope=context-pending)'],['GET /api/v1/security/config-history','Historial cambios configuración 90d']],
  },
  8: {
    feat:'FEAT-004', titulo:'Centro de Notificaciones de Seguridad', version:'v1.8.0',
    periodo:'2026-03-03 → 2026-03-17', fecha:'2026-03-17', dir:'sprint-8-FEAT-004',
    goal:'"Dar al usuario visibilidad completa y en tiempo real de la actividad de seguridad de su cuenta, cerrando la deuda técnica del flujo context-pending con JWT blacklist."',
    items:[['US-301','Historial paginado notificaciones 90 días + filtros','4','new-feature','✅ DONE'],['US-302','Mark-as-read individual + bulk + SSE broadcast','2','new-feature','✅ DONE'],['US-303','Badge unread-count @Cacheable 30s + estado inicial SSE','3','new-feature','✅ DONE'],['US-304','Acciones directas: 12 deep-links + revoke session directo','4','new-feature','✅ DONE'],['US-305','SSE 1 conn/usuario + heartbeat 30s + fallback polling 60s','3','new-feature','✅ DONE'],['DEBT-009','JWT blacklist Redis TTL=JWT-restante + SseRegistry.invalidate()','3','tech-debt','✅ DONE'],['DEBT-010','extractIpSubnet /24 centralizado en DeviceFingerprintService','2','tech-debt','✅ DONE'],['Flyway-V9','V9 user_notifications + notification_preferences + 3 índices','2','infra','✅ DONE'],['ACT-31','OpenAPI v1.5.0 FEAT-004 + SSE + JWT blacklist documentado','1','documental','✅ DONE']],
    gates:[['Sprint Planning','SPRINT-008-planning.md','Product Owner','✅ APPROVED'],['ADR-012 + LLD-008/009','SseRegistry pool + JWT blacklist + SSE','Tech Lead','✅ APPROVED'],['Code Review S1','DEBT-009/010 + Flyway V9 + US-301/302/303','Tech Lead','✅ APPROVED'],['Code Review S2','US-304 + US-305 + OpenAPI v1.5.0','Tech Lead','✅ APPROVED'],['QA Gate','QA-REPORT-sprint8 — 59 tests, 0 defectos','QA Lead','✅ APPROVED'],['DevOps','Commit 278b21a + rama ready for merge v1.8.0','DevOps','✅ APPROVED']],
    risks:[['R-S8-001','SSE no escala horizontalmente sin Redis Pub/Sub','M','M','🟡 Media','DEBT-011 Sprint 9','⚠️ ABIERTO'],['R-S8-002','Purga user_notifications falta job nocturno','B','B','🟢 Baja','DEBT-012 Sprint 9','⚠️ ABIERTO']],
    pci:[['8.3','JWT blacklist tras uso único','✅ CUMPLE'],['10.2.1','Auditoría por consulta de notificaciones','✅ CUMPLE']],
    endpoints:[['GET /api/v1/notifications','Historial paginado con filtros'],['PUT /api/v1/notifications/{id}/read','Marcar individual como leída'],['PUT /api/v1/notifications/read-all','Marcar todas como leídas'],['GET /api/v1/notifications/unread-count','Badge count (cacheable 30s)'],['POST /api/v1/notifications/{id}/revoke-session','Revocar sesión desde notificación'],['GET /api/v1/notifications/stream','SSE stream tiempo real']],
  },
};

// ── Generador por sprint ──────────────────────────────────────────────────────
async function genSprint(snum) {
  const s = SPRINTS[snum];
  const WORD_DIR = path.join(__dirname, s.dir, 'word');
  if (!fs.existsSync(WORD_DIR)) fs.mkdirSync(WORD_DIR, { recursive: true });
  const saveTo = async (doc, fname) => save(doc, path.join(WORD_DIR, fname));

  // Sprint Report
  const srDoc = mkDoc(`BankPortal — Sprint Report Sprint ${snum}`, s.fecha, [
    H(`Sprint Report — Sprint ${snum}`, 1), P(`BankPortal · Banco Meridian · ${s.feat}: ${s.titulo}`,{color:C.MED}), SP(),
    H('1. Metadata', 2), MT([['Proyecto','BankPortal — Banco Meridian'],['Sprint',`Sprint ${snum}`],['Feature',`${s.feat} — ${s.titulo}`],['Período',s.periodo],['Estado','✅ CERRADO — Sprint Goal ALCANZADO'],['Versión',s.version]]), SP(),
    H('2. Sprint Goal', 2), new Paragraph({ shading:{fill:C.VL,type:ShadingType.CLEAR}, border:{left:{style:BorderStyle.SINGLE,size:12,color:C.BLUE}}, spacing:{before:100,after:100}, indent:{left:200,right:200}, children:[new TextRun({text:s.goal,font:'Arial',size:20,italics:true,color:C.BLUE})] }), SP(),
    P('Estado: ✅ ALCANZADO — 24/24 SP completados.',{bold:true}), SP(),
    H('3. Resultados', 2), new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[3200,2000,2000,1826], rows:[new TableRow({children:['Métrica','Planificado','Real','Variación'].map((t,i)=>HC(t,[3200,2000,2000,1826][i]))}), ...[['Story Points','24','24','0 SP'],['Defectos QA','0','0','—'],['Gates HITL',String(s.gates.length),String(s.gates.length),'0']].map(([m,p,r,v],i)=>new TableRow({children:[DC(m,3200,i%2===0?C.VL:C.WHITE,true),DC(p,2000),DC(r,2000),DC(v,1826)]}))]}), SP(),
    H('4. Estado por Item', 2), mkItemTable(s.items), SP(),
    H('5. Gates HITL', 2), mkGateTable(s.gates), SP(),
    H('6. Riesgos', 2), mkRiskTable(s.risks), SP(),
    H('7. Cumplimiento PCI-DSS 4.0', 2), new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[1400,5826,1800], rows:[new TableRow({children:['Requisito','Descripción','Estado'].map((t,i)=>HC(t,[1400,5826,1800][i]))}), ...s.pci.map(([r,d,st],i)=>new TableRow({children:[DC(r,1400,i%2===0?C.VL:C.WHITE,true),DC(d,5826,i%2===0?C.VL:C.WHITE),DC(st,1800,SF(st))]}))] }), SP(),
    P(`SOFIA SM Agent — Experis · ${s.fecha}`,{color:'666666',italics:true}),
  ]);
  await saveTo(srDoc, `Sprint-Report-Sprint${snum}.docx`);

  // Risk Register
  const rrDoc = mkDoc(`BankPortal — Risk Register Sprint ${snum}`, s.fecha, [
    H(`Risk Register — BankPortal — Sprint ${snum}`, 1), P(`Proyecto: BankPortal · ${s.feat} · Fecha: ${s.fecha}`,{color:C.MED}), SP(),
    H('Registro de Riesgos', 2), mkRiskTable(s.risks), SP(),
    MT([['Total riesgos',String(s.risks.length)],['Cerrados',String(s.risks.filter(([,,,,,, st])=>st.includes('CERRADO')).length)],['Abiertos',String(s.risks.filter(([,,,,,, st])=>st.includes('ABIERTO')).length)]]), SP(),
    P(`SOFIA SM Agent — Experis · ${s.fecha}`,{color:'666666',italics:true}),
  ]);
  await saveTo(rrDoc, `Risk-Register-Sprint${snum}.docx`);

  // Release Notes
  const rnDoc = mkDoc(`BankPortal — Release Notes ${s.version}`, s.fecha, [
    H(`Release Notes — ${s.version} — BankPortal`, 1), P(`BankPortal · Banco Meridian · ${s.feat}: ${s.titulo}`,{color:C.MED}), SP(),
    H('1. Metadata', 2), MT([['Versión',s.version],['Fecha',s.fecha],['Sprint',`Sprint ${snum}`],['Feature',`${s.feat} — ${s.titulo}`]]), SP(),
    H('2. Nuevas Funcionalidades', 2), new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[1000,6526,1500], rows:[new TableRow({children:['ID','Descripción','SP'].map((t,i)=>HC(t,[1000,6526,1500][i]))}), ...s.items.filter(([,,,t])=>t==='new-feature').map(([id,ti,sp],i)=>new TableRow({children:[DC(id,1000,i%2===0?C.VL:C.WHITE,true),DC(ti,6526,i%2===0?C.VL:C.WHITE),DC(sp,1500)]}))] }), SP(),
    H('3. Nuevos Endpoints', 2), new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[3000,6026], rows:[new TableRow({children:['Endpoint','Descripción'].map((t,i)=>HC(t,[3000,6026][i]))}), ...s.endpoints.map(([ep,d],i)=>new TableRow({children:[DC(ep,3000,i%2===0?C.VL:C.WHITE,true),DC(d,6026,i%2===0?C.VL:C.WHITE)]}))] }), SP(),
    H('4. Deuda Técnica Resuelta', 2), new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[1200,7826], rows:[new TableRow({children:['ID','Descripción'].map((t,i)=>HC(t,[1200,7826][i]))}), ...s.items.filter(([,,,t])=>t==='tech-debt').map(([id,ti],i)=>new TableRow({children:[DC(id,1200,i%2===0?C.VL:C.WHITE,true),DC(ti,7826,i%2===0?C.VL:C.WHITE)]}))] }), SP(),
    P(`SOFIA DevOps Agent — Experis · ${s.fecha}`,{color:'666666',italics:true}),
  ]);
  await saveTo(rnDoc, `Release-Notes-${s.version}.docx`);
}

(async () => {
  console.log('\n📄 SOFIA Documentation Agent — Generando Word Sprints 4-8...\n');
  for (const snum of [4,5,6,7,8]) {
    console.log(`── Sprint ${snum} (${SPRINTS[snum].feat}) ──`);
    await genSprint(snum);
  }
  console.log('\n✅ TODOS los Word docs generados correctamente.\n');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
