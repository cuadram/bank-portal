const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType
} = require('docx');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'word');
const BLUE='1B3A6B', BLUE2='2E5F9E', WHITE='FFFFFF', LGRAY='F5F7FA', MGRAY='E2E8F0';

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
  // 1. LLD-016-cards-frontend-Sprint18.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'LLD — Frontend Angular — FEAT-016 Gestión de Tarjetas',bold:true,color:BLUE,size:32,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Low Level Design · Sprint 18 · BankPortal · Banco Meridian',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Componentes Angular'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2800,3000,3226],rows:[
      new TableRow({children:[hc('Componente',2800),hc('Responsabilidad',3000),hc('US asociada',3226)]}),
      ...[ ['CardListComponent','Lista de tarjetas del usuario con estado (activa/bloqueada)','US-1601, US-1602'],
           ['CardDetailComponent','Detalle: número enmascarado, límites, tipo, estado','US-1602'],
           ['CardBlockComponent','Diálogo bloqueo/desbloqueo con step 2FA TOTP','US-1603'],
           ['CardLimitsComponent','Formulario reactive edición límites diarios/mensuales','US-1604'],
           ['CardPinChangeComponent','Wizard cambio PIN: 2FA → PIN nuevo → confirmación','US-1605'],
           ['CardsRoutingModule','Lazy loading rutas /cards, /cards/:id, /cards/:id/pin','Todas'] ]
        .map(([c,r,u])=>new TableRow({children:[dc(c,2800,LGRAY,true,BLUE2),dc(r,3000),dc(u,3226)]}))
    ]}),
    sp(),
    h1('2. Servicios Angular'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2400,3226,3400],rows:[
      new TableRow({children:[hc('Servicio',2400),hc('Métodos principales',3226),hc('Backend endpoint',3400)]}),
      ...[ ['CardService','getCards(), getCard(id), blockCard(id), unblockCard(id)','GET /api/cards, PATCH /api/cards/{id}/status'],
           ['CardLimitService','getLimits(id), updateLimits(id, dto)','GET/PUT /api/cards/{id}/limits'],
           ['CardPinService','changePin(id, dto) — incluye token 2FA','POST /api/cards/{id}/pin'],
           ['TwoFactorService','generateChallenge(), validateOtp(token) — reutilizado','POST /api/2fa/challenge, /api/2fa/validate'] ]
        .map(([s,m,e])=>new TableRow({children:[dc(s,2400,LGRAY,true,BLUE2),dc(m,3226),dc(e,3400)]}))
    ]}),
    sp(),
    h1('3. Modelos TypeScript'),
    p('interface Card { id: string; maskedNumber: string; type: CardType; status: CardStatus; expiryDate: string; holder: string; }'),
    p('interface CardLimits { dailyLimit: number; monthlyLimit: number; contactlessLimit: number; }'),
    p('enum CardStatus { ACTIVE = "ACTIVE", BLOCKED = "BLOCKED", EXPIRED = "EXPIRED" }'),
    p('enum CardType { DEBIT = "DEBIT", CREDIT = "CREDIT", PREPAID = "PREPAID" }'),
    sp(),
    h1('4. Flujos de pantalla'),
    h2('Flujo bloqueo de tarjeta (US-1603)'),
    p('1. Usuario en CardDetailComponent → botón "Bloquear tarjeta"'),
    p('2. Se abre CardBlockComponent (modal) → solicita código 2FA'),
    p('3. 2FA validado → PATCH /api/cards/{id}/status {status: "BLOCKED", totpToken: "..."}'),
    p('4. Respuesta 200 → UI actualiza estado → notificación toast "Tarjeta bloqueada"'),
    h2('Flujo cambio de PIN (US-1605)'),
    p('1. CardPinChangeComponent wizard — Step 1: código 2FA'),
    p('2. Step 2: nuevo PIN (4-6 dígitos, campo tipo password)'),
    p('3. Step 3: confirmación PIN → POST /api/cards/{id}/pin'),
    p('4. Respuesta 204 → redirigir a CardDetailComponent → toast éxito'),
    sp(),
    h1('5. Seguridad frontend'),
    p('• AuthGuard en todas las rutas /cards — requiere JWT válido'),
    p('• PAN nunca almacenado en estado local — solo número enmascarado en UI'),
    p('• Campos PIN en input type="password" con autocomplete="new-password"'),
    p('• Timeout automático de sesión a 5 min en operaciones sensibles (PIN/bloqueo)'),
    sp(),
    p('SOFIA Documentation Agent — LLD Frontend Angular · Sprint 18 · BankPortal · 2026-05-07',{color:'888888',size:16}),
  ], 'LLD Frontend Sprint 18', 'Sprint 18 · LLD Frontend'), 'LLD-016-cards-frontend-Sprint18.docx');

  // 2. SPRINT-018-report.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Sprint 18 — Informe de Cierre',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'FEAT-016 · Gestión de Tarjetas · v1.18.0',color:BLUE2,size:22,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'BankPortal · Banco Meridian · 2026-05-07',color:'888888',size:18,font:'Arial'})]}),
    sp(),
    h1('1. Resumen ejecutivo'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2700,6326],rows:[
      ['Sprint','18'],['Feature','FEAT-016 — Gestión de Tarjetas'],
      ['Período','2026-04-23 → 2026-05-07'],['Release','v1.18.0'],
      ['SP entregados','24 / 24 (100%)'],['SP acumulados','425 SP (18 sprints)'],
      ['Velocidad media','23.6 SP/sprint'],['Estado','✅ COMPLETADO — Gate 9 aprobado'],
      ['PCI-DSS','req. 3/8/10 validados'],['Defectos PRD','0']
    ].map(([k,v])=>new TableRow({children:[dc(k,2700,LGRAY,true),dc(v,6326)]}))}),
    sp(),
    p('Sprint Goal cumplido al 100%: Gestión completa de tarjetas (consulta, bloqueo, límites, cambio PIN con 2FA) con trazabilidad PCI-DSS y ShedLock implementado para scheduler multi-instancia.',{italics:true}),
    sp(),
    h1('2. Pipeline — Todos los Steps Completados'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[550,2000,700,5776],rows:[
      new TableRow({children:[hc('Step',550),hc('Agente',2000),hc('Estado',700),hc('Artefacto',5776)]}),
      ...[ ['1','Scrum Master','✅','SPRINT-018-planning.md'],
           ['2','Requirements','✅','RF-1601..1606 + RNF cards'],
           ['3','Architect','✅','HLD-FEAT-016 + LLD backend/frontend'],
           ['3b','Doc Agent','✅','HLD Word + LLD Word (2 docs)'],
           ['4','Developer','✅','Cards domain + Flyway V18/V18b/V18c + ADR-028'],
           ['5','Code Review','✅','5/5 findings resueltos — 0 NCs bloqueantes'],
           ['5b','Security','✅','0 CVEs — DEBT-031/032 diferidos no bloqueantes'],
           ['6','QA Tester','✅','101/101 PASS — 86% cov — PCI validado'],
           ['7','DevOps','✅','v1.18.0 PRD — ShedLock test — PCI scan limpio'],
           ['8','Doc Agent','✅','Deliverables CMMI completos'],
           ['9','Workflow Mgr','✅','Informe de cierre — sprint cerrado'] ].map(([s,a,e,art])=>
        new TableRow({children:[dc(s,550,LGRAY,true),dc(a,2000),dc(e,700,'E8F5E9'),dc(art,5776)]}))
    ]}),
    sp(),
    h1('3. Métricas finales'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[3500,2763,2763],rows:[
      new TableRow({children:[hc('Métrica',3500),hc('Valor',2763),hc('vs S17',2763)]}),
      ...[ ['SP entregados','24','='],['Tests QA ejecutados','101 / 101 PASS','+56'],
           ['Tests unitarios (Developer)','16','—'],['Cobertura application','86%','+1%'],
           ['Defectos producción','0','='],['CVEs críticos/altos/medios','0','='],
           ['NCs Code Review','5 (0 bloq.)','+2 menores'],
           ['Deuda cerrada','DEBT-026/030/V17c/ADR-028','4 items'],
           ['Riesgos cerrados','R-015-01/R-018-01/02','3 riesgos'],
           ['PCI-DSS req.3/8/10','Validados','NUEVO'] ]
        .map(([m,v,c])=>new TableRow({children:[dc(m,3500,LGRAY,true),dc(v,2763),dc(c,2763)]}))
    ]}),
    sp(),
    h1('4. Deuda técnica abierta → Sprint 19'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1500,5526,2000],rows:[
      new TableRow({children:[hc('ID',1500),hc('Descripción',5526),hc('Sprint',2000)]}),
      ...[ ['DEBT-031','Rate limiting específico /cards/{id}/pin','S19'],
           ['DEBT-032','mTLS CoreBankingAdapter para producción','Pre-PRD'] ]
        .map(([id,d,s])=>new TableRow({children:[dc(id,1500,LGRAY,true,BLUE),dc(d,5526),dc(s,2000)]}))
    ]}),
    sp(),
    p('SOFIA Workflow Manager — CMMI PMC SP 1.1 · Sprint 18 · BankPortal · 2026-05-07',{color:'888888',size:16}),
  ], 'Sprint 18 Informe de Cierre', 'Sprint 18 · FEAT-016'), 'SPRINT-018-report.docx');

  // 3. PROJECT-PLAN-v1.18.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'BankPortal — Plan de Proyecto v1.18',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'CMMI Level 3 · PP SP 1.1/2.1/3.1 · Actualización Sprint 18',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Estado general post Sprint 18'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2700,6326],rows:[
      ['Sprints completados','18 / ~22 estimados'],
      ['SP acumulados','425 SP'],['Velocidad media','23.6 SP/sprint'],
      ['Features entregadas','16 (FEAT-001 → FEAT-016)'],
      ['Release actual','v1.18.0 en producción'],
      ['Cobertura tests','86%'],['Defectos PRD (acum.)','0'],['CVEs críticos/altos','0'],
      ['Nivel CMMI','Level 3 — activo'],['PCI-DSS','req.3/8/10 validados en S18'],
    ].map(([k,v])=>new TableRow({children:[dc(k,2700,LGRAY,true),dc(v,6326)]}))}),
    sp(),
    h1('2. Features entregadas — histórico completo'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1200,4326,700,1000,1800],rows:[
      new TableRow({children:[hc('ID',1200),hc('Feature',4326),hc('Sprint',700),hc('SP',1000),hc('Estado',1800)]}),
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
           ['FEAT-015','Transferencias Programadas','S17','24','✅'],
           ['FEAT-016','Gestión de Tarjetas','S18','24','✅'] ]
        .map(([id,f,s,sp2,st])=>new TableRow({children:[dc(id,1200,LGRAY,true,BLUE),dc(f,4326),dc(s,700),dc(sp2,1000),dc(st,1800,'E8F5E9')]}))
    ]}),
    sp(),
    h1('3. Riesgos post Sprint 18'),
    p('• R-016-02: Safari iOS <16.4 sin Web Push — Aceptado (vigente)'),
    p('• Todos los demás riesgos registrados cerrados a fecha 2026-05-07'),
    sp(),
    h1('4. Próximas actividades'),
    p('• Sprint 19: FEAT-017 (por definir con PO) + DEBT-031 rate limiting /cards/pin'),
    p('• Pre-PRD: DEBT-032 mTLS CoreBankingAdapter'),
    sp(),
    p('SOFIA Documentation Agent — CMMI PP SP 1.1/2.1/3.1 · Sprint 18 · BankPortal · 2026-05-07',{color:'888888',size:16}),
  ], 'Plan de Proyecto v1.18', 'Sprint 18 · CMMI PP'), 'PROJECT-PLAN-v1.18.docx');

  // 4. RISK-REGISTER-Sprint18.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Registro de Riesgos — Sprint 18',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'CMMI Level 3 · RSKM SP 1.1/1.2/1.3 · BankPortal',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Resumen'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2256,2256,2257,2257],rows:[
      new TableRow({children:[hc('Identificados',2256),hc('Cerrados S18',2256),hc('Activos',2257),hc('Nuevos S18',2257)]}),
      new TableRow({children:[dc('6',2256,LGRAY),dc('3 (R-015-01, R-018-01, R-018-02)',2256,'E8F5E9'),dc('1 (R-016-02)',2257,'E3F2FD'),dc('0',2257,LGRAY)]}),
    ]}),
    sp(),
    h1('2. Registro detallado'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1000,2400,600,2200,826,2000],rows:[
      new TableRow({children:[hc('ID',1000),hc('Descripción',2400),hc('Nivel',600),hc('Mitigación',2200),hc('Estado',826),hc('Cierre',2000)]}),
      ...[ ['R-015-01','Scheduler duplicado multi-instancia','N3→N1','ShedLock implementado ADR-028','✅ CERRADO','2026-05-07'],
           ['R-016-02','Safari iOS <16.4 sin Web Push','N2','Limitación plataforma — PO aceptado','ACEPTADO','Vigente'],
           ['R-018-01','IDOR en /cards/{id}','N2','@PreAuthorize userId check implementado','✅ CERRADO','2026-05-05'],
           ['R-018-02','PAN en claro en logs Spring','N2','Masking implementado en LoggingFilter','✅ CERRADO','2026-05-05'],
      ].map(([id,d,n,m,e,c])=>new TableRow({children:[dc(id,1000,LGRAY,true,BLUE),dc(d,2400),dc(n,600,'FFF9C4'),dc(m,2200),dc(e,826,e.includes('✅')?'E8F5E9':'E3F2FD'),dc(c,2000)]}))
    ]}),
    sp(),
    p('SOFIA Documentation Agent — CMMI RSKM SP 1.1/1.2/1.3 · Sprint 18 · BankPortal · 2026-05-07',{color:'888888',size:16}),
  ], 'Risk Register Sprint 18', 'Sprint 18 · RSKM'), 'RISK-REGISTER-Sprint18.docx');

  // 5. CMMI-Evidence-Sprint18.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Evidencias CMMI Level 3 — Sprint 18',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'BankPortal · Banco Meridian · 2026-05-07',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Declaración de conformidad'),
    p('El Sprint 18 ha sido ejecutado conforme a los procesos CMMI Nivel 3 activos en el proyecto BankPortal. Todas las áreas de proceso aplicables han sido satisfechas con evidencia documental completa.'),
    sp(),
    h1('2. Áreas de proceso — Evidencia Sprint 18'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1800,1600,1200,4426],rows:[
      new TableRow({children:[hc('Área de Proceso',1800),hc('SPs',1600),hc('Estado',1200),hc('Evidencia',4426)]}),
      ...[ ['PP — Project Planning','SP 1.1, 2.1, 3.1','✅','SPRINT-018-planning.md, PROJECT-PLAN-v1.18.docx'],
           ['PMC — Monitoring & Control','SP 1.1, 1.2, 1.3','✅','Burndown, daily scrums, SPRINT-018-report.docx'],
           ['RSKM — Risk Management','SP 1.1, 1.2, 1.3','✅','RISK-REGISTER-Sprint18.docx, 3 riesgos cerrados'],
           ['REQM — Requirements Mgmt','SP 1.1, 1.4','✅','RF-1601..1606, TRACEABILITY-FEAT-016.docx'],
           ['VER — Verification','SP 1.1, 2.1, 3.1','✅','CR 5/5 resueltos, 101 tests PASS, PCI validado'],
           ['VAL — Validation','SP 1.1, 2.1','✅','QA sign-off, 86% cov, sprint goal 100%'],
           ['CM — Config Management','SP 1.1, 1.2, 2.1','✅','Git branching, v1.18.0 tag, Flyway V18/V18b/V18c'],
           ['MA — Measurement','SP 1.1, 1.2, 2.1','✅','Velocidad 23.6 SP/sprint, KPIs dashboard'],
           ['CAR — Causal Analysis','SP 1.1, 2.1','✅','Retrospectiva S17 → AC-018-01 ShedLock implementado'],
      ].map(([pa,sp3,st,ev])=>new TableRow({children:[dc(pa,1800,LGRAY,true),dc(sp3,1600),dc(st,1200,'E8F5E9'),dc(ev,4426)]}))
    ]}),
    sp(),
    h1('3. KPIs CMMI Sprint 18'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[3500,2763,2763],rows:[
      new TableRow({children:[hc('KPI',3500),hc('Valor S18',2763),hc('Umbral',2763)]}),
      ...[ ['Cobertura tests','86%','≥ 80% ✅'],['Defectos producción','0','= 0 ✅'],
           ['CVEs críticos/altos','0','= 0 ✅'],['NCs bloqueantes CR','0','= 0 ✅'],
           ['Sprint Goal','100%','≥ 90% ✅'],['Deuda cerrada','4 items','≥ 2/sprint ✅'],
           ['PCI-DSS','req.3/8/10 validados','Nuevo KPI ✅'] ]
        .map(([k,v,u])=>new TableRow({children:[dc(k,3500,LGRAY,true),dc(v,2763),dc(u,2763,'E8F5E9')]}))
    ]}),
    sp(),
    p('Tech Lead / CMMI Process Owner: ________________________   Fecha: 2026-05-07'),
    sp(),
    p('SOFIA Documentation Agent — CMMI Evidence Package · Sprint 18 · BankPortal · 2026-05-07',{color:'888888',size:16}),
  ], 'CMMI Evidence Sprint 18', 'Sprint 18 · CMMI L3'), 'CMMI-Evidence-Sprint18.docx');

  // 6. MEETING-MINUTES-Sprint18.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Actas de Reunión — Sprint 18',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'FEAT-016 · Gestión de Tarjetas · BankPortal',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('Sprint Planning — 2026-04-23'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2200,6826],rows:[
      ['Fecha','2026-04-23'],['Asistentes','Tech Lead, Backend Dev, Frontend Dev, QA Lead, DevOps, PO, Scrum Master'],
      ['Duración','2 horas'],['Objetivo','Planificación Sprint 18 — FEAT-016 Gestión de Tarjetas']
    ].map(([k,v])=>new TableRow({children:[dc(k,2200,LGRAY,true),dc(v,6826)]}))}),
    sp(),
    h2('Decisiones tomadas'),
    p('✅ Sprint goal aprobado: gestión completa de tarjetas con PCI-DSS compliance'),
    p('✅ ADR-028 ShedLock: MUST S1 día 1 — R-015-01 requiere cierre urgente'),
    p('✅ FEAT-016 aceptado: 6 US (US-1601 → US-1606) + 4 items deuda (24 SP)'),
    p('✅ R-018-01/02 identificados en planning: IDOR cards y PAN en logs — mitigar en S1'),
    p('✅ PCI-DSS scope: req.3 (datos en reposo), req.8 (2FA), req.10 (logs auditados)'),
    sp(),
    h1('Sprint Review — 2026-05-07'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2200,6826],rows:[
      ['Fecha','2026-05-07'],['Asistentes','Tech Lead, Backend Dev, Frontend Dev, QA Lead, DevOps, PO, Scrum Master'],
      ['Duración','1.5 horas'],['Release demo','v1.18.0']
    ].map(([k,v])=>new TableRow({children:[dc(k,2200,LGRAY,true),dc(v,6826)]}))}),
    sp(),
    h2('Demo y resultados'),
    p('✅ Consulta tarjetas con número enmascarado (últimos 4 dígitos) — OK'),
    p('✅ Bloqueo/desbloqueo con validación 2FA TOTP — OK'),
    p('✅ Edición límites diarios/mensuales — OK'),
    p('✅ Cambio de PIN wizard 3 pasos con 2FA — OK'),
    p('✅ ShedLock test: 2 instancias simultáneas — solo 1 ejecuta — R-015-01 CERRADO'),
    p('✅ PCI scan limpio: req.3/8/10 validados — PAN enmascarado en todos los logs'),
    p('✅ Sprint goal aprobado por PO al 100%'),
    sp(),
    h1('Retrospectiva — 2026-05-07'),
    h2('Lo que fue bien'),
    p('• ShedLock implementado en S1 día 1 — acción AC-018-01 ejecutada según plan'),
    p('• PCI-DSS scope cubierto completamente — hito de compliance del proyecto'),
    p('• 18º sprint consecutivo sin defectos en producción'),
    h2('Área de mejora'),
    p('• DEBT-031 rate limiting /pin identificado tarde — priorizar en Sprint 19 S1'),
    h2('Acciones Sprint 19'),
    p('• [AC-019-01] DEBT-031 rate limiting /cards/{id}/pin — Backend Dev — S1'),
    p('• [AC-019-02] Definir FEAT-017 con PO antes del planning de S19'),
    sp(),
    p('SOFIA Documentation Agent — CMMI OPD SP 1.1 · Sprint 18 · BankPortal · 2026-05-07',{color:'888888',size:16}),
  ], 'Meeting Minutes Sprint 18', 'Sprint 18 · Actas'), 'MEETING-MINUTES-Sprint18.docx');

  // 7. QUALITY-SUMMARY-Sprint18.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Resumen de Calidad — Sprint 18',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'FEAT-016 · v1.18.0 · QA Sign-Off · PCI-DSS Validado',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Resultados QA — Resumen'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[3000,3013,3013],rows:[
      new TableRow({children:[hc('Métrica',3000),hc('Valor',3013),hc('Umbral',3013)]}),
      ...[ ['Tests QA FEAT-016 ejecutados','101 / 101 PASS','100% PASS ✅'],
           ['Tests unitarios Developer (S18)','16 / 16 PASS','100% PASS ✅'],
           ['Tests unitarios acumulados','~677 tests','> 600 ✅'],
           ['Cobertura application','86%','≥ 80% ✅'],
           ['Defectos críticos','0','= 0 ✅'],['Defectos mayores','0','= 0 ✅'],
           ['NCs CR (bloqueantes)','0','= 0 ✅'],['NCs CR (menores)','5 resueltas','0 abiertas ✅'],
           ['Regresión completa','PASS','PASS ✅'],
           ['CVEs security scan','0 críticos/altos/medios','= 0 ✅'],
           ['PCI-DSS req.3 (datos reposo)','PASS — PAN enmascarado logs','Requisito ✅'],
           ['PCI-DSS req.8 (2FA)','PASS — bloqueo y PIN con TOTP','Requisito ✅'],
           ['PCI-DSS req.10 (audit logs)','PASS — logs auditados sin PAN','Requisito ✅'],
           ['ShedLock test multi-instancia','PASS — solo 1 instancia ejecuta','ADR-028 ✅'],
      ].map(([m,v,u])=>new TableRow({children:[dc(m,3000,LGRAY,true),dc(v,3013),dc(u,3013,'E8F5E9')]}))
    ]}),
    sp(),
    h1('2. Test Cases FEAT-016 (muestra representativa)'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[850,3376,1000,1400,2400],rows:[
      new TableRow({children:[hc('ID',850),hc('Descripción',3376),hc('Tipo',1000),hc('Resultado',1400),hc('US',2400)]}),
      ...[ ['TC-1601','Modelo cards + Flyway V18 migraciones','Integración','PASS','US-1601'],
           ['TC-1602','Consulta lista tarjetas — número enmascarado','Funcional','PASS','US-1602'],
           ['TC-1602b','IDOR /cards/{id} — acceso restringido usuario','Seguridad','PASS','R-018-01'],
           ['TC-1603','Bloquear tarjeta con 2FA TOTP válido','Funcional','PASS','US-1603'],
           ['TC-1603b','Bloquear tarjeta con 2FA TOTP inválido — 401','Negativo','PASS','US-1603'],
           ['TC-1604','Actualizar límites diarios y mensuales','Funcional','PASS','US-1604'],
           ['TC-1605','Cambio PIN wizard 3 steps con 2FA','Funcional','PASS','US-1605'],
           ['TC-1606','Frontend Angular gestión completa E2E','E2E','PASS','US-1606'],
           ['TC-ADR-028','ShedLock — 2 instancias, 1 ejecuta','Concurrencia','PASS','ADR-028'],
           ['TC-PCI-003','PAN no aparece en ningún log Spring','Seguridad','PASS','PCI req.10'],
      ].map(([id,d,t,r,us])=>new TableRow({children:[dc(id,850,LGRAY,true,BLUE),dc(d,3376),dc(t,1000),dc(r,1400,'E8F5E9'),dc(us,2400)]}))
    ]}),
    sp(),
    h1('3. QA Sign-Off'),
    p('✅ Sprint 18 aprobado por QA Lead. 101/101 tests PASS. PCI-DSS req.3/8/10 validados. 0 CVEs. Autorizado despliegue v1.18.0 a producción.'),
    sp(),
    p('QA Lead: ________________________   Fecha: 2026-05-07'),
    sp(),
    p('SOFIA Documentation Agent — CMMI VER/VAL · Sprint 18 · BankPortal · 2026-05-07',{color:'888888',size:16}),
  ], 'Quality Summary Sprint 18', 'Sprint 18 · QA'), 'QUALITY-SUMMARY-Sprint18.docx');

  // 8. RELEASE-NOTES-v1.18.0.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Release Notes — v1.18.0',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'BankPortal · Banco Meridian · 2026-05-07',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Información de la release'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[2700,6326],rows:[
      ['Versión','v1.18.0'],['Fecha','2026-05-07'],['Sprint','18'],
      ['Feature','FEAT-016 — Gestión de Tarjetas'],
      ['Tipo','Feature Release + PCI-DSS compliance + ShedLock'],
      ['Breaking changes','Ninguno'],
      ['DB Migrations','Flyway V18 (cards), V18b (drop plain cols), V18c (card_limits)'],
      ['Estado','✅ Desplegado en producción'],
    ].map(([k,v])=>new TableRow({children:[dc(k,2700,LGRAY,true),dc(v,6326)]}))}),
    sp(),
    h1('2. Nuevas funcionalidades'),
    p('• Consulta de tarjetas con número PAN enmascarado (últimos 4 dígitos)'),
    p('• Bloqueo y desbloqueo de tarjeta con verificación 2FA TOTP'),
    p('• Gestión de límites: diario, mensual y contactless'),
    p('• Cambio de PIN con flujo wizard 3 pasos y 2FA'),
    p('• Frontend Angular completo: CardListComponent, CardDetailComponent, CardPinChangeComponent'),
    p('• Tabla cards + card_limits (Flyway V18 + V18c)'),
    p('• ShedLock implementado (ADR-028): scheduler transferencias blindado ante scale-out'),
    sp(),
    h1('3. Deuda técnica incluida'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1500,5526,2000],rows:[
      new TableRow({children:[hc('ID',1500),hc('Descripción',5526),hc('Estado',2000)]}),
      ...[ ['ADR-028','ShedLock scheduler multi-instancia','✅ Cerrada'],
           ['DEBT-026','Race condition push subscription limit','✅ Cerrada'],
           ['DEBT-030','Batch size ilimitado findDueTransfers','✅ Cerrada'],
           ['V17c','Drop auth_plain / p256dh_plain (Flyway V18b)','✅ Cerrada'] ]
        .map(([id,d,st])=>new TableRow({children:[dc(id,1500,LGRAY,true,BLUE),dc(d,5526),dc(st,2000,'E8F5E9')]}))
    ]}),
    sp(),
    h1('4. Procedimiento de despliegue verificado'),
    p('1. Flyway V18 — crear tabla cards con columnas PCI-compliant'),
    p('2. Flyway V18b — DROP auth_plain, p256dh_plain (V17c)'),
    p('3. Flyway V18c — crear tabla card_limits'),
    p('4. Desplegar backend: docker pull bankportal-backend:v1.18.0'),
    p('5. Desplegar frontend: ng build --prod → nginx'),
    p('6. Verificar: GET /actuator/health/readiness → {status: UP}'),
    p('7. Smoke test: GET /api/cards → lista enmascarada'),
    p('8. ShedLock test: 2 instancias, verificar solo 1 ejecuta'),
    sp(),
    p('✅ Smoke test superado · ✅ PCI scan limpio · ✅ ShedLock OK · ✅ Sin regresión'),
    sp(),
    p('SOFIA DevOps Agent — Release Manager · Sprint 18 · BankPortal · 2026-05-07',{color:'888888',size:16}),
  ], 'Release Notes v1.18.0', 'Sprint 18 · Release'), 'RELEASE-NOTES-v1.18.0.docx');

  // 9. TRACEABILITY-FEAT-016-Sprint18.docx
  await save(mkDoc([
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Matriz de Trazabilidad — FEAT-016',bold:true,color:BLUE,size:36,font:'Arial'})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:'Gestión de Tarjetas · Sprint 18 · BankPortal',color:BLUE2,size:22,font:'Arial'})]}),
    sp(),
    h1('1. Trazabilidad Requisito → Implementación → Test'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[1100,2100,2500,1526,1800],rows:[
      new TableRow({children:[hc('US/Item',1100),hc('Requisito',2100),hc('Implementación',2500),hc('Test Case',1526),hc('Estado',1800)]}),
      ...[ ['US-1601','Modelo datos cards + Flyway','CardEntity + V18 + V18c migrations','TC-1601','✅'],
           ['US-1602','Consulta tarjetas enmascaradas','CardController GET /api/cards','TC-1602, TC-1602b','✅'],
           ['US-1603','Bloqueo/desbloqueo con 2FA','CardService block/unblock + 2FA','TC-1603, TC-1603b','✅'],
           ['US-1604','Gestión de límites','CardLimitsService + PUT /api/cards/{id}/limits','TC-1604','✅'],
           ['US-1605','Cambio PIN con 2FA','CardPinService + wizard Angular','TC-1605','✅'],
           ['US-1606','Frontend Angular gestión','CardsModule + todos los componentes','TC-1606','✅'],
           ['ADR-028','ShedLock multi-instancia','ShedLock config + @SchedulerLock','TC-ADR-028','✅'],
           ['DEBT-026','Race condition push limit','Optimistic lock push_subscriptions','CR + test','✅'],
           ['DEBT-030','Paginación findDueTransfers','Pageable batch 500','CR + test','✅'],
           ['V17c','Drop plain cols','Flyway V18b — DROP auth_plain, p256dh_plain','Flyway + test','✅'],
      ].map(([us,r,impl,tc,st])=>new TableRow({children:[dc(us,1100,LGRAY,true,BLUE),dc(r,2100),dc(impl,2500),dc(tc,1526),dc(st,1800,'E8F5E9')]}))
    ]}),
    sp(),
    h1('2. Cobertura'),
    new Table({width:{size:9026,type:WidthType.DXA},columnWidths:[3013,3013,3000],rows:[
      new TableRow({children:[hc('Items cubiertos',3013),hc('Test cases ligados',3013),hc('Cobertura',3000)]}),
      new TableRow({children:[dc('10 / 10 (100%)',3013,'E8F5E9'),dc('10 / 10 (100%)',3013,'E8F5E9'),dc('100% ✅',3000,'E8F5E9')]}),
    ]}),
    sp(),
    h1('3. Artefactos relacionados'),
    p('• HLD-FEAT-016-Sprint18.docx · LLD-016-cards-backend-Sprint18.docx · LLD-016-cards-frontend-Sprint18.docx'),
    p('• QUALITY-SUMMARY-Sprint18.docx · RELEASE-NOTES-v1.18.0.docx · CMMI-Evidence-Sprint18.docx'),
    sp(),
    p('SOFIA Documentation Agent — CMMI REQM SP 1.1/1.4 · Sprint 18 · BankPortal · 2026-05-07',{color:'888888',size:16}),
  ], 'Traceability FEAT-016', 'Sprint 18 · REQM'), 'TRACEABILITY-FEAT-016-Sprint18.docx');

  console.log('\n✅ Sprint 18 — 9 documentos Word CMMI generados');
}
main().catch(console.error);
