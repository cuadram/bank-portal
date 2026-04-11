const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'word');
const BLUE='1B3A6B', BLUE2='2E5F9E', GREEN='16A34A', WHITE='FFFFFF', LGRAY='F5F7FA', MGRAY='E2E8F0';

const brd=(c='CCCCCC')=>({style:BorderStyle.SINGLE,size:4,color:c});
const brds=(c)=>{const b=brd(c);return{top:b,bottom:b,left:b,right:b}};
const hc=(t,w,sh=BLUE)=>new TableCell({borders:brds(BLUE),width:{size:w,type:WidthType.DXA},shading:{fill:sh,type:ShadingType.CLEAR},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:t,bold:true,color:WHITE,size:18,font:'Arial'})]})]});
const dc=(t,w,sh=WHITE,bold=false,color='000000')=>new TableCell({borders:brds('CCCCCC'),width:{size:w,type:WidthType.DXA},shading:{fill:sh,type:ShadingType.CLEAR},margins:{top:80,bottom:80,left:120,right:120},children:[new Paragraph({children:[new TextRun({text:t,bold,color,size:18,font:'Arial'})]})]});
const h1=(t)=>new Paragraph({spacing:{before:240,after:120},children:[new TextRun({text:t,bold:true,color:BLUE,size:28,font:'Arial'})]});
const h2=(t)=>new Paragraph({spacing:{before:180,after:80},children:[new TextRun({text:t,bold:true,color:BLUE2,size:22,font:'Arial'})]});
const p=(t,opts={})=>new Paragraph({children:[new TextRun({text:t,size:20,font:'Arial',...opts})]});
const sp=()=>new Paragraph({children:[new TextRun({text:'',size:10})]});

const mkHdr=(title)=>({default:new Header({children:[new Paragraph({border:{bottom:{style:BorderStyle.SINGLE,size:6,color:BLUE}},children:[new TextRun({text:'BankPortal · Banco Meridian   ',bold:true,color:BLUE,size:18,font:'Arial'}),new TextRun({text:title,color:BLUE2,size:18,font:'Arial'})]})]})});
const mkFtr=(s)=>({default:new Footer({children:[new Paragraph({border:{top:{style:BorderStyle.SINGLE,size:4,color:BLUE}},children:[new TextRun({text:`SOFIA v1.9  ·  ${s}  ·  Experis / ManpowerGroup  ·  Confidencial`,color:'888888',size:16,font:'Arial'})]})]})});
const mkDoc=(children,title,sprint)=>new Document({styles:{default:{document:{run:{font:'Arial',size:20}}}},sections:[{headers:mkHdr(title),footers:mkFtr(sprint),children}]});

async function save(doc, filename) {
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, filename), buf);
  console.log('✅', filename);
}

async function main() {
  // 1. SPRINT-017-report.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Sprint 17 — Informe de Cierre',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'FEAT-015 · Transferencias Programadas y Recurrentes · v1.17.0',color:BLUE2,size:22,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'BankPortal · Banco Meridian · 2026-04-22',color:'888888',size:18,font:'Arial'})]}),
    sp(),
    h1('1. Resumen ejecutivo'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2700,6326],rows:[
      ['Sprint','17'],['Feature','FEAT-015 — Transferencias Programadas y Recurrentes'],
      ['Período','2026-04-08 → 2026-04-22'],['Release','v1.17.0'],
      ['SP entregados','24 / 24 (100%)'],['SP acumulados','401 SP (17 sprints)'],
      ['Velocidad media','23.6 SP/sprint'],['Estado','✅ COMPLETADO — Gate 9 aprobado']
    ].map(([k,v])=>new TableRow({children:[dc(k,2700,LGRAY,true),dc(v,6326)]}))}),
    sp(),
    p('Sprint Goal cumplido al 100%: Motor de transferencias automáticas implementado con scheduler idempotente, recurrentes configurables (DAILY/WEEKLY/MONTHLY) y gestión Angular completa.',{italics:true}),
    sp(),
    h1('2. Pipeline — Todos los Steps Completados'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[550,2000,700,5776],rows:[
      new TableRow({children:[hc('Step',550),hc('Agente',2000),hc('Estado',700),hc('Artefacto',5776)]}),
      ...[ ['1','Scrum Master','✅','SPRINT-017-planning.md'],
           ['2','Requirements','✅','SRS-FEAT-015.md'],
           ['3','Architect','✅','HLD-FEAT-015 + LLD backend/frontend'],
           ['3b','Doc Agent','✅','HLD/LLD Word (3 docs)'],
           ['4','Developer','✅','22 ficheros Java + Flyway V17+V17b'],
           ['5','Code Review','✅','0 NCs bloqueantes — 3 menores resueltas'],
           ['5b','Security','✅','0 CVEs — DEBT-028 cerrada'],
           ['6','QA Tester','✅','45/45 PASS — 615 tests — 85% cobertura'],
           ['7','DevOps','✅','v1.17.0 PRD — Load test SSE 512 concurrentes'],
           ['8','Doc Agent','✅','10 Word + 3 Excel generados'],
           ['9','Workflow Mgr','✅','Informe de cierre — sprint cerrado'] ].map(([s,a,e,art])=>
        new TableRow({children:[dc(s,550,LGRAY,true),dc(a,2000),dc(e,700,'E8F5E9'),dc(art,5776)]}))
    ]}),
    sp(),
    h1('3. Métricas finales'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[3500,2763,2763],rows:[
      new TableRow({children:[hc('Métrica',3500),hc('Valor',2763),hc('vs S16',2763)]}),
      ...[ ['SP entregados','24','='],['Tests automatizados','615','+62'],
           ['Cobertura application','85%','+1%'],['Defectos producción','0','='],
           ['CVEs críticos/altos/medios','0','='],['NCs Code Review','3 (0 bloq.)','+1 menor'],
           ['Deuda cerrada','DEBT-027/028/029','3 items'],['Riesgos cerrados','R-016-01, R-016-05','2 cerrados'] ]
        .map(([m,v,c])=>new TableRow({children:[dc(m,3500,LGRAY,true),dc(v,2763),dc(c,2763)]}))
    ]}),
    sp(),
    h1('4. Deuda abierta → Sprint 18'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1500,5526,2000],rows:[
      new TableRow({children:[hc('ID',1500),hc('Descripción',5526),hc('Sprint',2000)]}),
      ...[ ['DEBT-026','Race condition push subscription limit','S18'],
           ['DEBT-030','Batch size ilimitado findDueTransfers','S18'],
           ['V17c','Drop auth_plain / p256dh_plain (Flyway)','S18'],
           ['ADR-028','ShedLock scheduler multi-instancia','S18'] ]
        .map(([id,d,s])=>new TableRow({children:[dc(id,1500,LGRAY,true,BLUE),dc(d,5526),dc(s,2000)]}))
    ]}),
    sp(),
    p('SOFIA Workflow Manager — CMMI PMC SP 1.1 · Sprint 17 · BankPortal · 2026-04-22',{color:'888888',size:16}),
  ], 'Sprint 17 Informe de Cierre', 'Sprint 17 · FEAT-015'), 'SPRINT-017-report.docx');

  // 2. PROJECT-PLAN-v1.17.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'BankPortal — Plan de Proyecto v1.17',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'CMMI Level 3 · PP SP 1.1 / 2.1 / 3.1 · Actualización Sprint 17',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Información del Proyecto'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2700,6326],rows:[
      ['Proyecto','BankPortal — Portal Bancario Digital Banco Meridian'],
      ['Proveedor','Experis / ManpowerGroup'],['Metodología','Scrumban — CMMI Level 3'],
      ['Sprints completados','17'],['SP acumulados','401 SP'],
      ['Velocidad media','23.6 SP/sprint'],['Release actual','v1.17.0 en producción'],
      ['Cobertura tests','85%'],['Defectos PRD (acum.)','0'],
    ].map(([k,v])=>new TableRow({children:[dc(k,2700,LGRAY,true),dc(v,6326)]}))}),
    sp(),
    h1('2. Features entregadas'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1200,4526,700,1000,1600],rows:[
      new TableRow({children:[hc('ID',1200),hc('Feature',4526),hc('Sprint',700),hc('SP',1000),hc('Estado',1600)]}),
      ...[ ['FEAT-001','Autenticación y Sesión','S1','18','✅'],
           ['FEAT-002','Dashboard Financiero','S3','21','✅'],
           ['FEAT-003','Transferencias Básicas','S4','22','✅'],
           ['FEAT-004','Historial y Exportación','S5-8','23','✅'],
           ['FEAT-005','Notificaciones Push','S6','22','✅'],
           ['FEAT-006','Perfil y Configuración','S7','24','✅'],
           ['FEAT-007','Frontend Angular Base','S7-8','20','✅'],
           ['FEAT-008','Seguridad Avanzada','S10','24','✅'],
           ['FEAT-009','Reporting y Analytics','S11','22','✅'],
           ['FEAT-010','Integración Core Banking','S12','23','✅'],
           ['FEAT-011','Multi-cuenta','S13','24','✅'],
           ['FEAT-012','OAuth2 / PKCE','S14','22','✅'],
           ['FEAT-013','Auditoría y Compliance','S15','22','✅'],
           ['FEAT-014','Push VAPID','S16','24','✅'],
           ['FEAT-015','Transferencias Programadas','S17','24','✅'] ]
        .map(([id,f,s,sp2,st])=>new TableRow({children:[dc(id,1200,LGRAY,true,BLUE),dc(f,4526),dc(s,700),dc(sp2,1000),dc(st,1600,'E8F5E9')]}))
    ]}),
    sp(),
    h1('3. Riesgos activos post S17'),
    p('• R-015-01: ShedLock multi-instancia — MITIGANDO en S18 (ADR-028 MUST S1)'),
    p('• R-016-02: Safari iOS <16.4 sin Web Push — Aceptado por Product Owner'),
    sp(),
    p('SOFIA Documentation Agent — CMMI PP SP 1.1/2.1/3.1 · Sprint 17 · BankPortal · 2026-04-22',{color:'888888',size:16}),
  ], 'Plan de Proyecto v1.17', 'Sprint 17 · CMMI PP'), 'PROJECT-PLAN-v1.17.docx');

  // 3. RISK-REGISTER-Sprint17.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Registro de Riesgos — Sprint 17',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'CMMI Level 3 · RSKM SP 1.1/1.2/1.3 · BankPortal',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Resumen'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2256,2256,2257,2257],rows:[
      new TableRow({children:[hc('Identificados',2256),hc('Cerrados S17',2256),hc('Activos',2257),hc('Nuevos S17',2257)]}),
      new TableRow({children:[dc('4',2256,LGRAY),dc('2 (R-016-01, R-016-05)',2256,'E8F5E9'),dc('1',2257,'FFF9C4'),dc('0',2257,LGRAY)]}),
    ]}),
    sp(),
    h1('2. Registro detallado'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1000,2300,600,2100,1026,2000],rows:[
      new TableRow({children:[hc('ID',1000),hc('Descripción',2300),hc('Nivel',600),hc('Mitigación',2100),hc('Estado',1026),hc('Cierre',2000)]}),
      new TableRow({children:[dc('R-015-01',1000,LGRAY,true,BLUE),dc('Scheduler duplicado multi-instancia',2300),dc('N3→N1',600,'FFEBEE'),dc('ShedLock ADR-028 — implementar S18',2100),dc('MITIGANDO',1026,'FFF9C4'),dc('Sprint 18',2000)]}),
      new TableRow({children:[dc('R-016-01',1000,LGRAY,true,BLUE),dc('Carga SSE > 300 conexiones concurrentes',2300),dc('N2',600,'FFF9C4'),dc('Load test realizado: 512 conc. OK',2100),dc('✅ CERRADO',1026,'E8F5E9'),dc('2026-04-22',2000)]}),
      new TableRow({children:[dc('R-016-02',1000,LGRAY,true,BLUE),dc('Safari iOS <16.4 sin soporte Web Push',2300),dc('N2',600,'FFF9C4'),dc('Limitación de plataforma — aceptada PO',2100),dc('ACEPTADO',1026,'E3F2FD'),dc('Vigente',2000)]}),
      new TableRow({children:[dc('R-016-05',1000,LGRAY,true,BLUE),dc('Performance SSE bajo carga extrema',2300),dc('N2',600,'FFF9C4'),dc('Load test S17: latencia p95 < 50ms',2100),dc('✅ CERRADO',1026,'E8F5E9'),dc('2026-04-22',2000)]}),
    ]}),
    sp(),
    p('SOFIA Documentation Agent — CMMI RSKM SP 1.1/1.2/1.3 · Sprint 17 · BankPortal · 2026-04-22',{color:'888888',size:16}),
  ], 'Risk Register Sprint 17', 'Sprint 17 · RSKM'), 'RISK-REGISTER-Sprint17.docx');

  // 4. CMMI-Evidence-Sprint17.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Evidencias CMMI Level 3 — Sprint 17',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'BankPortal · Banco Meridian · 2026-04-22',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Declaración de conformidad'),
    p('El Sprint 17 ha sido ejecutado conforme a los procesos CMMI Nivel 3 activos en el proyecto BankPortal. Todas las áreas de proceso aplicables han sido satisfechas con evidencia documental generada y persistida en el repositorio del proyecto.'),
    sp(),
    h1('2. Áreas de proceso — Evidencia'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1800,1600,1200,4426],rows:[
      new TableRow({children:[hc('Área de Proceso',1800),hc('SPs',1600),hc('Estado',1200),hc('Evidencia',4426)]}),
      ...[ ['PP — Project Planning','SP 1.1, 2.1, 3.1','✅','SPRINT-017-planning.md, PROJECT-PLAN-v1.17.docx'],
           ['PMC — Monitoring & Control','SP 1.1, 1.2, 1.3','✅','Burndown, daily scrums, SPRINT-017-report.docx'],
           ['RSKM — Risk Management','SP 1.1, 1.2, 1.3','✅','RISK-REGISTER-Sprint17.docx, 2 riesgos cerrados'],
           ['REQM — Requirements Mgmt','SP 1.1, 1.4','✅','SRS-FEAT-015.md, TRACEABILITY-FEAT-015.docx'],
           ['VER — Verification','SP 1.1, 2.1, 3.1','✅','Code Review 0 NCs bloq., 615 tests PASS'],
           ['VAL — Validation','SP 1.1, 2.1','✅','QA sign-off, 85% cov, sprint goal 100%'],
           ['CM — Config Management','SP 1.1, 1.2, 2.1','✅','Git branching, v1.17.0 tag, release notes'],
           ['MA — Measurement','SP 1.1, 1.2, 2.1','✅','Velocidad 23.6 SP/sprint, NC-Tracker, dashboard'],
           ['CAR — Causal Analysis','SP 1.1, 2.1','✅','Retrospectiva S16 → acciones S17 implementadas'],
      ].map(([pa,sp3,st,ev])=>new TableRow({children:[dc(pa,1800,LGRAY,true),dc(sp3,1600),dc(st,1200,'E8F5E9'),dc(ev,4426)]}))
    ]}),
    sp(),
    h1('3. KPIs CMMI'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[3500,2763,2763],rows:[
      new TableRow({children:[hc('KPI',3500),hc('Valor S17',2763),hc('Umbral',2763)]}),
      ...[ ['Cobertura tests','85%','≥ 80% ✅'],['Defectos producción','0','= 0 ✅'],
           ['CVEs críticos/altos','0','= 0 ✅'],['NCs bloqueantes CR','0','= 0 ✅'],
           ['Sprint Goal','100%','≥ 90% ✅'],['Deuda cerrada','3 items','≥ 2/sprint ✅'] ]
        .map(([k,v,u])=>new TableRow({children:[dc(k,3500,LGRAY,true),dc(v,2763),dc(u,2763,'E8F5E9')]}))
    ]}),
    sp(),
    p('Tech Lead / CMMI Process Owner: ________________________   Fecha: 2026-04-22'),
    sp(),
    p('SOFIA Documentation Agent — CMMI Evidence Package · Sprint 17 · BankPortal · 2026-04-22',{color:'888888',size:16}),
  ], 'CMMI Evidence Sprint 17', 'Sprint 17 · CMMI L3'), 'CMMI-Evidence-Sprint17.docx');

  // 5. MEETING-MINUTES-Sprint17.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Actas de Reunión — Sprint 17',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'FEAT-015 · Transferencias Programadas · BankPortal',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('Sprint Planning — 2026-04-08'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2200,6826],rows:[
      ['Fecha','2026-04-08'],['Asistentes','Tech Lead, Backend Dev, Frontend Dev, QA Lead, DevOps, Scrum Master'],
      ['Duración','2 horas'],['Objetivo','Planificación Sprint 17 — FEAT-015']
    ].map(([k,v])=>new TableRow({children:[dc(k,2200,LGRAY,true),dc(v,6826)]}))}),
    sp(),
    h2('Puntos tratados y decisiones'),
    p('✅ Sprint goal aprobado: motor de transferencias automáticas con scheduler idempotente'),
    p('✅ DEBT-027/028/029 priorizados en S1 (semana 1) — DEBT-028 CVSS 4.1 MUST'),
    p('✅ ADR-026: decisión arquitectura scheduler — Spring @Scheduled + idempotency_key UUID'),
    p('✅ Load test SSE planificado en S2 con DevOps (R-016-05 a cerrar)'),
    p('✅ Capacidad neta: 32h backend + 32h frontend (tras ceremonias y buffer 10%)'),
    sp(),
    h1('Sprint Review — 2026-04-22'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2200,6826],rows:[
      ['Fecha','2026-04-22'],['Asistentes','Tech Lead, Backend Dev, Frontend Dev, QA Lead, DevOps, PO, Scrum Master'],
      ['Duración','1.5 horas'],['Release demo','v1.17.0']
    ].map(([k,v])=>new TableRow({children:[dc(k,2200,LGRAY,true),dc(v,6826)]}))}),
    sp(),
    h2('Demo y resultados'),
    p('✅ Creación transferencia DAILY/WEEKLY/MONTHLY desde Angular — OK'),
    p('✅ Ejecución automática scheduler + idempotency_key en log — OK'),
    p('✅ Notificación push recibida en móvil al ejecutar — OK'),
    p('✅ Load test SSE: 512 conexiones concurrentes, latencia p95 < 50ms — R-016-05 CERRADO'),
    p('✅ Sprint goal aprobado por PO al 100%'),
    sp(),
    h1('Retrospectiva — 2026-04-22'),
    h2('Lo que fue bien'),
    p('• Deuda DEBT-027/028/029 cerrada en S1 según plan — zero slippage'),
    p('• 17º sprint consecutivo sin defectos en producción'),
    p('• Load test superado con margen (objetivo 300 conc., resultado 512 conc.)'),
    h2('Área de mejora'),
    p('• ADR-028 ShedLock identificado tarde — se prioriza como MUST en Sprint 18 S1 día 1'),
    h2('Acciones Sprint 18'),
    p('• [AC-018-01] Implementar ShedLock en S18 S1 día 1 — Tech Lead'),
    p('• [AC-018-02] Definir FEAT-016 con PO antes del planning de S18'),
    sp(),
    p('SOFIA Documentation Agent — CMMI OPD SP 1.1 · Sprint 17 · BankPortal · 2026-04-22',{color:'888888',size:16}),
  ], 'Meeting Minutes Sprint 17', 'Sprint 17 · Actas'), 'MEETING-MINUTES-Sprint17.docx');

  // 6. QUALITY-SUMMARY-Sprint17.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Resumen de Calidad — Sprint 17',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'FEAT-015 · v1.17.0 · QA Sign-Off',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Resultados QA — Resumen'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[3000,3013,3013],rows:[
      new TableRow({children:[hc('Métrica',3000),hc('Valor',3013),hc('Umbral',3013)]}),
      ...[ ['Tests QA FEAT-015 ejecutados','45 / 45 PASS','100% PASS ✅'],
           ['Tests unitarios acumulados','615 tests','> 550 ✅'],
           ['Cobertura application','85%','≥ 80% ✅'],
           ['Defectos críticos','0','= 0 ✅'],['Defectos mayores','0','= 0 ✅'],
           ['NCs Code Review (bloqueantes)','0','= 0 ✅'],
           ['Regresión completa','PASS','PASS ✅'],
           ['CVEs security scan','0 críticos/altos/medios','= 0 ✅'],
           ['DEBT-028 — cifrado push','AES-256-GCM validado','Requisito seg. ✅'],
           ['Load test SSE','512 conc. — p95 <50ms','R-016-05 cerrado ✅'],
      ].map(([m,v,u])=>new TableRow({children:[dc(m,3000,LGRAY,true),dc(v,3013),dc(u,3013,'E8F5E9')]}))
    ]}),
    sp(),
    h1('2. Test Cases FEAT-015'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[850,3376,1000,1400,2400],rows:[
      new TableRow({children:[hc('ID',850),hc('Descripción',3376),hc('Tipo',1000),hc('Resultado',1400),hc('US relacionada',2400)]}),
      ...[ ['TC-1501','Crear transferencia DAILY — validación campos obligatorios','Funcional','PASS','US-1501'],
           ['TC-1502','Crear transferencia WEEKLY — ejecución automática','Funcional','PASS','US-1502'],
           ['TC-1503','Idempotency key — sin duplicación en reintentos','Funcional','PASS','US-1503'],
           ['TC-1504','Push notification al ejecutar transferencia programada','Integración','PASS','US-1504'],
           ['TC-1505','Frontend Angular — CRUD completo programadas','E2E','PASS','US-1505'],
           ['TC-1506','Cancelar transferencia recurrente activa','Funcional','PASS','US-1505'],
           ['TC-1507','Transferencia sin fondos — error gracioso con notificación','Negativo','PASS','US-1501'],
           ['TC-DEBT-028','push_subscriptions.auth cifrado AES-256-GCM','Seguridad','PASS','DEBT-028'],
           ['TC-LOAD-SSE','Load test SSE 512 conexiones concurrentes p95<50ms','Performance','PASS','R-016-05'],
      ].map(([id,d,t,r,us])=>new TableRow({children:[dc(id,850,LGRAY,true,BLUE),dc(d,3376),dc(t,1000),dc(r,1400,'E8F5E9'),dc(us,2400)]}))
    ]}),
    sp(),
    h1('3. QA Sign-Off'),
    p('✅ Sprint 17 aprobado por QA Lead. Criterios de aceptación cumplidos al 100%. No existen defectos bloqueantes ni CVEs pendientes. Autorizado despliegue v1.17.0 a producción.'),
    sp(),
    p('QA Lead: ________________________   Fecha: 2026-04-22'),
    sp(),
    p('SOFIA Documentation Agent — CMMI VER/VAL · Sprint 17 · BankPortal · 2026-04-22',{color:'888888',size:16}),
  ], 'Quality Summary Sprint 17', 'Sprint 17 · QA'), 'QUALITY-SUMMARY-Sprint17.docx');

  // 7. RELEASE-NOTES-v1.17.0.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Release Notes — v1.17.0',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'BankPortal · Banco Meridian · 2026-04-22',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Información de la release'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2700,6326],rows:[
      ['Versión','v1.17.0'],['Fecha','2026-04-22'],['Sprint','17'],
      ['Feature','FEAT-015 — Transferencias Programadas y Recurrentes'],
      ['Tipo','Feature Release'],['Breaking changes','Ninguno'],
      ['DB Migrations','Flyway V17 (scheduled_transfers), V17b (recurrence_config)'],
      ['Estado','✅ Desplegado en producción'],
    ].map(([k,v])=>new TableRow({children:[dc(k,2700,LGRAY,true),dc(v,6326)]}))}),
    sp(),
    h1('2. Nuevas funcionalidades'),
    p('• Motor de transferencias programadas con scheduler idempotente (@Scheduled Spring)'),
    p('• Configuración de recurrencia: DAILY, WEEKLY, MONTHLY con fecha fin opcional'),
    p('• Notificación push automática en cada ejecución de transferencia programada'),
    p('• Gestión completa desde Angular: crear, editar, pausar y cancelar'),
    p('• Tabla scheduled_transfers con idempotency_key UNIQUE (Flyway V17)'),
    p('• Tabla recurrence_config con patrón configurable (Flyway V17b)'),
    sp(),
    h1('3. Correcciones y deuda técnica'),
    p('• DEBT-027: Domain events movidos a paquetes de dominio correctos — refactor package structure'),
    p('• DEBT-028: Columnas auth y p256dh cifradas AES-256-GCM — protección datos en reposo'),
    p('• DEBT-029: Footer email con enlace RGPD Art.7 — preferencias de comunicación'),
    sp(),
    h1('4. Procedimiento de despliegue verificado'),
    p('1. Flyway V17 — crear tabla scheduled_transfers con idempotency_key UNIQUE'),
    p('2. Flyway V17b — crear tabla recurrence_config con patrón y fecha fin'),
    p('3. Desplegar backend: docker pull bankportal-backend:v1.17.0'),
    p('4. Desplegar frontend: ng build --prod → nginx'),
    p('5. Verificar: GET /actuator/health/readiness → {status: UP}'),
    p('6. Smoke test: POST /api/scheduled-transfers → 201, verificar ejecución scheduler'),
    sp(),
    p('✅ Smoke test superado · ✅ Scheduler ejecutando · ✅ Push OK · ✅ Sin regresión'),
    sp(),
    p('SOFIA DevOps Agent — Release Manager · Sprint 17 · BankPortal · 2026-04-22',{color:'888888',size:16}),
  ], 'Release Notes v1.17.0', 'Sprint 17 · Release'), 'RELEASE-NOTES-v1.17.0.docx');

  // 8. TRACEABILITY-FEAT-015-Sprint17.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Matriz de Trazabilidad — FEAT-015',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Transferencias Programadas · Sprint 17 · BankPortal',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Trazabilidad Requisito → Implementación → Test'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1100,2200,2400,1626,1700],rows:[
      new TableRow({children:[hc('US/Item',1100),hc('Requisito',2200),hc('Implementación',2400),hc('Test Case',1626),hc('Estado',1700)]}),
      ...[ ['US-1501','Crear transferencia programada','ScheduledTransferService + V17','TC-1501, TC-1507','✅'],
           ['US-1502','Recurrencia DAILY/WEEKLY/MONTHLY','RecurrenceConfig + V17b','TC-1502','✅'],
           ['US-1503','Scheduler idempotente','ScheduledTransferExecutor + idempotency_key','TC-1503','✅'],
           ['US-1504','Push al ejecutar','PushNotificationService integrado','TC-1504','✅'],
           ['US-1505','Frontend Angular gestión','ScheduledTransfersComponent','TC-1505, TC-1506','✅'],
           ['DEBT-027','Domain events a dominio','Refactor package structure','CR review','✅'],
           ['DEBT-028','Cifrar auth/p256dh','AES-256-GCM EncryptionService','TC-DEBT-028','✅'],
           ['DEBT-029','Footer RGPD Art.7','Email template update','TC manual','✅'],
           ['R-016-05','Validar carga SSE','Load test Gatling','TC-LOAD-SSE','✅'],
      ].map(([us,r,impl,tc,st])=>new TableRow({children:[dc(us,1100,LGRAY,true,BLUE),dc(r,2200),dc(impl,2400),dc(tc,1626),dc(st,1700,'E8F5E9')]}))
    ]}),
    sp(),
    h1('2. Cobertura'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[3013,3013,3000],rows:[
      new TableRow({children:[hc('Items cubiertos',3013),hc('Test cases ligados',3013),hc('Cobertura',3000)]}),
      new TableRow({children:[dc('9 / 9 (100%)',3013,'E8F5E9'),dc('9 / 9 (100%)',3013,'E8F5E9'),dc('100% ✅',3000,'E8F5E9')]}),
    ]}),
    sp(),
    h1('3. Artefactos relacionados'),
    p('• SRS-FEAT-015.md · HLD-FEAT-015-Sprint17.docx · LLD-FEAT-015-Backend-Sprint17.docx'),
    p('• LLD-FEAT-015-Frontend-Sprint17.docx · QUALITY-SUMMARY-Sprint17.docx · RELEASE-NOTES-v1.17.0.docx'),
    sp(),
    p('SOFIA Documentation Agent — CMMI REQM SP 1.1/1.4 · Sprint 17 · BankPortal · 2026-04-22',{color:'888888',size:16}),
  ], 'Traceability FEAT-015', 'Sprint 17 · REQM'), 'TRACEABILITY-FEAT-015-Sprint17.docx');

  console.log('\n✅ Sprint 17 — 8 documentos Word CMMI generados');
}
main().catch(console.error);
