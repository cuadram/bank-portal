// gen-docs-sprint20.js — Documentation Agent Sprint 20 FEAT-018
// SOFIA v2.3 · 10 DOCX + Sprint data JSON
'use strict';
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, PageNumber, PageNumberElement } = require('docx');
const fs = require('fs');
const path = require('path');

const OUT = 'docs/deliverables/sprint-20-FEAT-018';
const BLUE = '1B3A6B';
const WHITE = 'FFFFFF';
const FONT = 'Arial';
const DATE_STR = '30/03/2026';

// ─── Primitivas ────────────────────────────────────────────────────────────

const bdr = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const bdrH = { style: BorderStyle.SINGLE, size: 1, color: BLUE };
const allBdr = { top: bdr, bottom: bdr, left: bdr, right: bdr };
const allBdrH = { top: bdrH, bottom: bdrH, left: bdrH, right: bdrH };
const cellMar = { top: 80, bottom: 80, left: 120, right: 120 };

function makeCell(txt, isH, w) {
  return new TableCell({
    borders: isH ? allBdrH : allBdr,
    width: { size: w, type: WidthType.DXA },
    shading: { fill: isH ? BLUE : 'F5F5F5', type: ShadingType.CLEAR },
    margins: cellMar,
    children: [new Paragraph({ children: [
      new TextRun({ text: String(txt), bold: isH, color: isH ? WHITE : '333333', font: FONT, size: isH ? 20 : 18 })
    ]})]
  });
}

function mkTable(headers, rows, widths) {
  const total = widths.reduce(function(a,b){ return a+b; }, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map(function(h,i){ return makeCell(h, true, widths[i]); }) })
    ].concat(rows.map(function(row) {
      return new TableRow({ children: row.map(function(c,i){ return makeCell(c, false, widths[i]); }) });
    }))
  });
}

function h1(t) {
  return new Paragraph({ spacing: { before: 300, after: 120 },
    children: [new TextRun({ text: t, bold: true, size: 28, font: FONT, color: BLUE })] });
}
function h2(t) {
  return new Paragraph({ spacing: { before: 200, after: 80 },
    children: [new TextRun({ text: t, bold: true, size: 24, font: FONT, color: BLUE })] });
}
function p(t, opts) {
  opts = opts || {};
  return new Paragraph({ spacing: { before: 60, after: 60 },
    children: [new TextRun(Object.assign({ text: String(t), font: FONT, size: 20 }, opts))] });
}
function sp() {
  return new Paragraph({ spacing: { before: 120, after: 120 }, children: [new TextRun('')] });
}

function buildDoc(title, subtitle, children) {
  return new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 20 } } }
    },
    sections: [{
      properties: { page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1134, bottom: 1440, left: 1134 }
      }},
      headers: { default: new Header({ children: [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
          children: [new TextRun({ text: 'BankPortal · Banco Meridian · SOFIA v2.3  —  ' + title, font: FONT, size: 18, color: '666666' })]
        })
      ]})},
      footers: { default: new Footer({ children: [
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 1 } },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'SOFIA v2.3 · Confidencial · ' + DATE_STR + ' · Pag. ', font: FONT, size: 16, color: '888888' }),
                     new PageNumberElement({ page: PageNumber.CURRENT })]
        })
      ]})},
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1440, after: 240 },
          children: [new TextRun({ text: title, bold: true, size: 40, font: FONT, color: BLUE })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 },
          children: [new TextRun({ text: subtitle, size: 24, font: FONT, color: '555555' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 1440 },
          children: [new TextRun({ text: 'BankPortal · Banco Meridian · Sprint 20 · ' + DATE_STR, size: 20, font: FONT, color: '888888' })] })
      ].concat(children)
    }]
  });
}

async function save(doc, fn) {
  var buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, fn), buf);
  console.log('  OK ' + fn + ' (' + Math.round(buf.length/1024) + 'KB)');
}

// ─── Documentos ───────────────────────────────────────────────────────────

async function genSRS() {
  var doc = buildDoc('SRS - FEAT-018', 'Exportacion de Movimientos Bancarios', [
    h1('1. Proposito y alcance'),
    p('Especifica requisitos para exportacion PDF/CSV de movimientos. PSD2 Art.47, GDPR Art.15, PCI-DSS.'),
    sp(),
    h1('2. Requisitos funcionales'),
    mkTable(['ID','Requisito'],[
      ['RF-018-01.1','PDF con cabecera corporativa, IBAN, titular'],
      ['RF-018-01.2','Generacion < 3s p95 para 500 registros'],
      ['RF-018-01.3','PAN enmascarado — solo 4 ultimos digitos (PCI-DSS Req.3.4)'],
      ['RF-018-01.4','Hash SHA-256 en pie de pagina'],
      ['RF-018-01.5','Historial maximo 12 meses (PSD2 Art.47)'],
      ['RF-018-02.1','CSV UTF-8 BOM, separador ";", coma decimal'],
      ['RF-018-02.2','Columnas: fecha_valor, concepto, importe, divisa, saldo, tipo, iban'],
      ['RF-018-03.1','Filtros: tipo movimiento, rango fechas, cuenta'],
      ['RF-018-03.2','Preview count antes de exportar — bloqueo si > 500'],
      ['RF-018-04.1','Audit log asincrono — no bloquea exportacion'],
      ['RF-018-04.2','Retencion 7 anos (GDPR Art.17 + PCI-DSS Req.10.7)'],
    ],[1800,7200]),
    sp(),
    h1('3. Requisitos no funcionales'),
    mkTable(['ID','Categoria','Requisito'],[
      ['RNF-018-01','Rendimiento','PDF < 3s · CSV < 1s (p95, 500 registros)'],
      ['RNF-018-02','Seguridad','PAN enmascarado en todos los formatos'],
      ['RNF-018-03','Accesibilidad','WCAG 2.1 AA — aria-label en boton export'],
      ['RNF-018-04','Disponibilidad','99.5% SLA'],
    ],[1800,2400,4800]),
    sp(),
    h1('4. Marco regulatorio'),
    mkTable(['Regulacion','Articulo','Requisito'],[
      ['PSD2','Art.47','Historial pagos 12 meses accesible al usuario'],
      ['GDPR','Art.15','Derecho de acceso — portabilidad de datos'],
      ['GDPR','Art.17','Retencion audit log 7 anos'],
      ['PCI-DSS','Req.3.4','PAN enmascarado — solo 4 ultimos digitos'],
      ['PCI-DSS','Req.10','Audit log de todos los accesos a datos'],
    ],[2000,1500,5500]),
  ]);
  await save(doc, 'FEAT-018-SRS.docx');
}

async function genHLD() {
  var doc = buildDoc('HLD - FEAT-018', 'High Level Design · Exportacion de Movimientos', [
    h1('1. Componentes nuevos'),
    mkTable(['Componente','Tipo','Descripcion'],[
      ['ExportController','REST Controller','Endpoints /exports/pdf, /csv, /preview'],
      ['ExportService','Service','Orquestacion: validacion PSD2 + fetch + generate + audit'],
      ['DocumentGenerator','Interface','Contrato extensible OCP — ADR-031'],
      ['PdfDocumentGenerator','Component','Apache PDFBox 3.0.2 — PAN masked, SHA-256'],
      ['CsvDocumentGenerator','Component','UTF-8 BOM, separador ";", coma decimal'],
      ['ExportAuditService','Service @Async','fire-and-forget + retry x3'],
      ['V21__export_audit_log.sql','Flyway','DDL tabla audit — retencion 7 anos'],
    ],[2400,1600,5000]),
    sp(),
    h1('2. Decisiones arquitecturales'),
    mkTable(['ADR','Decision','Justificacion'],[
      ['ADR-030','Apache PDFBox 3.x sobre iText 7','Licencia Apache 2.0 vs AGPL — sin coste'],
      ['ADR-031','Generacion sincrona <= 500 registros','Simplicidad S20 — async como DEBT-036 futuro'],
    ],[1200,3200,4600]),
    sp(),
    h1('3. Flujo de secuencia — Export PDF'),
    p('1. POST /api/v1/accounts/{id}/exports/pdf + JWT Bearer'),
    p('2. ExportController → ExportService.export()'),
    p('3. Validacion 12 meses PSD2 + accountId vs userId JWT (DEBT-038)'),
    p('4. TransactionJpaRepository.findByAccountIdAndFilters() — max 501'),
    p('5. Limite 500 — HTTP 422 si excede'),
    p('6. PdfDocumentGenerator.generate() — SHA-256 — PAN masked'),
    p('7. ExportAuditService.recordAsync() — @Async fire-and-forget'),
    p('8. ResponseEntity<byte[]> application/pdf + Content-Disposition attachment'),
    sp(),
    h1('4. Impacto en componentes existentes'),
    mkTable(['Componente','Cambio','Riesgo'],[
      ['TransactionJpaRepository','Nuevo metodo findByAccountIdAndFilters()','Bajo'],
      ['SecurityConfig','Nuevo path /exports/** con JWT','Bajo'],
      ['pom.xml','Nueva dependencia pdfbox 3.0.2 (Apache 2.0)','Bajo'],
    ],[3200,3200,2600]),
  ]);
  await save(doc, 'FEAT-018-HLD.docx');
}

async function genLLDBackend() {
  var doc = buildDoc('LLD Backend - FEAT-018', 'Low Level Design · Java 21 / Spring Boot 3.3.4', [
    h1('1. Estructura de paquetes'),
    p('export/controller/  ExportController.java'),
    p('export/service/     ExportService.java · ExportAuditService.java'),
    p('export/service/generator/  DocumentGenerator.java · PdfDocumentGenerator.java · CsvDocumentGenerator.java'),
    p('export/repository/  ExportAuditLogRepository.java'),
    p('export/domain/      ExportAuditLog.java · ExportFormat.java'),
    p('export/dto/         ExportRequest.java · ExportPreviewResponse.java'),
    p('directdebit/strategy/  DebitProcessingStrategy · SEPACoreDebitStrategy · SEPACORDebitStrategy · RecurringDebitStrategy · DebitProcessorStrategyFactory'),
    p('directdebit/webhook/   CoreBankingReturnedHandler · SepaReturnCode'),
    sp(),
    h1('2. Endpoints API'),
    mkTable(['Metodo','Path','Response'],[
      ['POST','/api/v1/accounts/{id}/exports/pdf','200 byte[] application/pdf'],
      ['POST','/api/v1/accounts/{id}/exports/csv','200 byte[] text/csv;charset=UTF-8'],
      ['GET','/api/v1/accounts/{id}/exports/preview','200 ExportPreviewResponse {count, exceedsLimit}'],
      ['GET','/api/v1/admin/exports/audit-log','200 Page<ExportAuditLog> — rol ADMIN'],
    ],[1000,3800,4200]),
    sp(),
    h1('3. Flyway V21 — export_audit_log'),
    mkTable(['Columna','Tipo PG','Tipo Java'],[
      ['id','UUID','UUID — PK gen_random_uuid()'],
      ['user_id','UUID','UUID'],
      ['timestamp_utc','TIMESTAMPTZ','OffsetDateTime — LA-019-13'],
      ['iban','VARCHAR(34)','String'],
      ['fecha_desde','DATE','LocalDate'],
      ['fecha_hasta','DATE','LocalDate'],
      ['tipo_movimiento','VARCHAR(50)','String — default TODOS'],
      ['formato','VARCHAR(10)','ExportFormat — CHECK IN (PDF,CSV)'],
      ['num_registros','INT','int'],
      ['ip_origen','VARCHAR(45)','String — IPv4/IPv6'],
      ['hash_sha256','VARCHAR(64)','String — solo PDF'],
    ],[2000,2200,4800]),
    sp(),
    h1('4. Lecciones aprendidas aplicadas'),
    mkTable(['ID','Aplicacion'],[
      ['LA-019-13','TIMESTAMPTZ → OffsetDateTime (no Instant)'],
      ['LA-019-15','SQL con parametros posicionales (?) sin concatenacion'],
      ['LA-019-08','Sin @Profile("!production") en nuevos beans'],
      ['DEBT-038','Validacion accountId vs userId JWT en ExportService.export()'],
    ],[1800,7200]),
    sp(),
    h1('5. DEBT-034 — Strategy pattern'),
    p('Interface: DebitProcessingStrategy.process(DirectDebit) + supports(DebitType)'),
    p('Implementaciones: SEPACoreDebitStrategy · SEPACORDebitStrategy · RecurringDebitStrategy'),
    p('DebitProcessorStrategyFactory — lookup OCP. Nueva estrategia: @Component solo, sin tocar Factory.'),
    sp(),
    h1('6. DEBT-035 — RETURNED handler'),
    p('CoreBankingReturnedHandler.handleReturned(mandateId, rCode, returnedAt)'),
    p('R-codes R01..R10 — descripciones en espanol en enum SepaReturnCode'),
    p('@Transactional — update mandato + push notification + audit trail'),
  ]);
  await save(doc, 'FEAT-018-LLD-backend.docx');
}

async function genLLDFrontend() {
  var doc = buildDoc('LLD Frontend - FEAT-018', 'Low Level Design · Angular 17', [
    h1('1. Estructura de modulo'),
    p('features/export/components/export-panel/  ExportPanelComponent'),
    p('features/export/services/                 export.service.ts'),
    p('features/export/models/                   export-request.model.ts'),
    p('core/auth/  token.service.ts · session.service.ts · auth.guard.ts  (DEBT-033)'),
    sp(),
    h1('2. ExportService Angular'),
    mkTable(['Metodo','Descripcion'],[
      ['preview(accountId, filters)','GET /exports/preview → Observable<ExportPreviewResponse>'],
      ['exportDocument(accountId, request)','POST /exports/pdf|csv → Observable<Blob>'],
      ['triggerDownload(blob, filename)','Descarga automatica via URL.createObjectURL'],
    ],[2800,6200]),
    sp(),
    h1('3. Lecciones aprendidas aplicadas'),
    mkTable(['ID','Aplicacion'],[
      ['LA-019-10','ExportModule en MovementsModule imports — no en router'],
      ['LA-019-11','accountId via @Input directo — no via @Input de ruta'],
      ['LA-019-14','ChangeDetectionStrategy.Default en ExportPanelComponent'],
      ['LA-019-05','ng build --configuration=production en CI'],
      ['LA-019-09','ExportService URL en environment.ts Y environment.prod.ts'],
    ],[1800,7200]),
    sp(),
    h1('4. DEBT-033 — Split AuthService'),
    p('TokenService: JWT lifecycle (setTokens, getAccessToken, isTokenExpired, clearTokens)'),
    p('sessionStorage intencional — tokens no persisten entre pestanas (PCI-DSS)'),
    p('SessionService: Angular signal<SessionUser|null> — isAuthenticated() + hasRole()'),
    p('AuthGuard: authGuard + adminGuard functional — restoreFocus WCAG'),
  ]);
  await save(doc, 'FEAT-018-LLD-frontend.docx');
}

async function genTestPlan() {
  var doc = buildDoc('Test Plan - FEAT-018', 'Plan de Pruebas · Sprint 20', [
    h1('1. Alcance'),
    p('FEAT-018 (Export PDF/CSV/Filtros/Audit) + DEBT-032..035. Pruebas unitarias, integracion y regresion S19.'),
    sp(),
    h1('2. Estrategia'),
    mkTable(['Tipo','Herramienta','Alcance'],[
      ['Unit Tests','JUnit 5 + Mockito','Todas las clases nuevas — cobertura >= 85%'],
      ['Angular Tests','Jasmine + Karma','ExportService, ExportPanelComponent, AuthGuard'],
      ['Smoke Tests','Bash script','13 endpoints — /exports/preview, /pdf, /csv'],
      ['Regresion S19','Suite completa','DirectDebitService, TransactionService, CardService'],
    ],[2000,2200,4800]),
    sp(),
    h1('3. Casos de prueba criticos'),
    mkTable(['ID','Descripcion','Criterio de exito'],[
      ['TC-018-PDF-02','PDF 500 registros p95','t < 3s'],
      ['TC-018-PDF-05','PAN enmascarado','regex ****XXXX. PAN completo ausente'],
      ['TC-018-PDF-07','501 registros','HTTP 422 ExportLimitExceededException'],
      ['TC-018-PDF-12','DEBT-038: cuenta ajena','HTTP 403 AccessDeniedException'],
      ['TC-018-CSV-01','UTF-8 BOM','Bytes 0-2 = EF BB BF'],
      ['TC-018-AUD-07','Audit fallo no bloquea export','Export OK aunque audit falle'],
      ['TC-DEBT035-01','RETURNED < 2s','Mandato actualizado en < 2s. Push enviado'],
      ['TC-DEBT034-01','Factory OCP','Nueva estrategia sin modificar Factory'],
    ],[1800,3600,3600]),
    sp(),
    h1('4. Entorno'),
    p('JPA-REAL activo (LA-019-08). PostgreSQL 16 local. Angular CLI + ChromeHeadless.'),
    p('Comando backend: mvn clean test -Dsurefire.excludes=**/*IT.java'),
  ]);
  await save(doc, 'FEAT-018-Test-Plan.docx');
}

async function genQAReport() {
  var doc = buildDoc('QA Report - FEAT-018', 'Informe de Calidad · Sprint 20', [
    h1('1. Veredicto: LISTO PARA RELEASE'),
    p('124/124 PASS · 0 FAIL · NCS: 0 · Cobertura: 88%', { bold: true }),
    sp(),
    h1('2. Resumen por historia'),
    mkTable(['Historia','SP','Casos','Pass','Fail'],[
      ['SCRUM-98 Export PDF','3','18','18','0'],
      ['SCRUM-99 Export CSV','2','15','15','0'],
      ['SCRUM-100 Filtros','2','14','14','0'],
      ['SCRUM-101 Audit log','1','10','10','0'],
      ['SCRUM-102 DEBT-032','4','14','14','0'],
      ['SCRUM-103 DEBT-033','4','18','18','0'],
      ['SCRUM-104 DEBT-034','4','17','17','0'],
      ['SCRUM-105 DEBT-035','4','18','18','0'],
      ['TOTAL','24','124','124','0'],
    ],[3200,800,1000,1000,800]),
    sp(),
    h1('3. Checks regulatorios'),
    mkTable(['Check','Resultado'],[
      ['PCI-DSS Req.3.4 — PAN enmascarado en PDF','PASS'],
      ['PCI-DSS Req.3.4 — PAN ausente en CSV','PASS'],
      ['PSD2 Art.47 — rango 12 meses enforced','PASS'],
      ['GDPR Art.15 — solo titular accede (DEBT-038)','PASS'],
      ['WCAG 2.1 AA — aria-label + role=alert','PASS'],
      ['Audit log retencion 7 anos — sin CASCADE','PASS'],
    ],[5000,4000]),
    sp(),
    h1('4. Rendimiento'),
    mkTable(['Operacion','p95 medido','Objetivo'],[
      ['Export PDF 500 registros','2.1s','< 3s OK'],
      ['Export CSV 500 registros','0.3s','< 1s OK'],
      ['Preview count','87ms','< 200ms OK'],
      ['RETURNED webhook','340ms','< 2s OK'],
    ],[3200,2000,3800]),
    sp(),
    h1('5. Aprobacion'),
    mkTable(['Rol','Aprobacion'],[
      ['QA Lead','Aprobado 2026-03-30'],
      ['Product Owner','Aprobado — criterios de aceptacion verificados'],
    ],[3000,6000]),
  ]);
  await save(doc, 'FEAT-018-QA-Report.docx');
}

async function genCodeReview() {
  var doc = buildDoc('Code Review Report - FEAT-018', 'Informe de Revision de Codigo · Sprint 20', [
    h1('1. Veredicto: APPROVED'),
    p('0 bloqueantes · 4 menores · 3 sugerencias. Correcciones RV-F018-01 y RV-F018-03 aplicadas.', { bold: true }),
    sp(),
    h1('2. Hallazgos'),
    mkTable(['ID','Severidad','Descripcion','Estado'],[
      ['RV-F018-01','Menor','catch vacio en ExportAuditService','Corregido'],
      ['RV-F018-02','Menor','IBAN hardcodeado en audit','DEBT-036 S21'],
      ['RV-F018-03','Menor','CRLF en CSV no normalizado','Corregido'],
      ['RV-F018-04','Menor','sessionStorage sin comentario justificativo','Documentar'],
      ['RV-F018-S01','Sugerencia','MAX_HISTORY_MONTHS en application.properties','S21'],
      ['RV-F018-S02','Sugerencia','Paginacion PDF multi-pagina incompleta','S21'],
      ['RV-F018-S03','Sugerencia','Log de estrategia en DebitProcessorStrategyFactory','S21'],
    ],[1400,1200,4400,2200]),
    sp(),
    h1('3. Checklist CMMI — CM'),
    mkTable(['Check','Resultado'],[
      ['Todos los archivos en rama sprint/20','OK'],
      ['Flyway V21 numeracion correcta','OK'],
      ['DEBT-022 no introducido en S20','OK — 0 ocurrencias BearerTokenAuthenticationFilter'],
      ['LA-019-15: sin SQL por concatenacion','OK'],
      ['LA-019-08: sin @Profile("!production")','OK'],
      ['DEBT-038: accountId vs userId JWT','OK — corregido en ExportService'],
    ],[5000,4000]),
    sp(),
    h1('4. Deuda tecnica generada'),
    mkTable(['ID','Descripcion','Sprint'],[
      ['DEBT-036','IBAN real en audit desde AccountRepository','S21'],
      ['DEBT-037','Regex PAN Maestro 19d (CVSS 2.1)','S21'],
    ],[1400,5600,2000]),
  ]);
  await save(doc, 'FEAT-018-Code-Review-Report.docx');
}

async function genReleaseNotes() {
  var doc = buildDoc('Release Notes - v1.20.0', 'BankPortal · Sprint 20', [
    h1('Novedades — FEAT-018'),
    p('Exportacion de movimientos bancarios en PDF y CSV desde la vista de movimientos.'),
    mkTable(['Historia','SP','Descripcion'],[
      ['SCRUM-98','3','Extracto PDF — cabecera Banco Meridian, hash SHA-256, PAN enmascarado'],
      ['SCRUM-99','2','CSV UTF-8 BOM, separador ";", compatible Excel'],
      ['SCRUM-100','2','Filtros tipo/fechas/cuenta, preview count antes de exportar'],
      ['SCRUM-101','1','Audit log GDPR/PCI-DSS — retencion 7 anos'],
    ],[1400,800,6800]),
    sp(),
    h1('Deuda tecnica resuelta'),
    mkTable(['Issue','SP','Descripcion'],[
      ['SCRUM-102','4','DEBT-032: Lambda refactor — stack traces legibles'],
      ['SCRUM-103','4','DEBT-033: Angular AuthService → TokenService + SessionService + AuthGuard'],
      ['SCRUM-104','4','DEBT-034: Strategy pattern DebitProcessorService (OCP)'],
      ['SCRUM-105','4','DEBT-035: Handler RETURNED webhook + push R-code SEPA (R01-R10)'],
    ],[1400,800,6800]),
    sp(),
    h1('Seguridad'),
    p('DEBT-038: validacion accountId vs userId JWT (CVSS 4.8 cerrado en S20).'),
    p('Sin CVE nuevos. Semaforo: GREEN.'),
    sp(),
    h1('Base de datos'),
    mkTable(['Version','Archivo','Descripcion'],[
      ['V21','V21__export_audit_log.sql','Nueva tabla export_audit_log (additive, rollback safe)'],
    ],[1200,3200,4600]),
    sp(),
    h1('Dependencias nuevas'),
    mkTable(['Libreria','Version','Licencia'],[
      ['pdfbox','3.0.2','Apache 2.0'],
    ],[3000,2000,4000]),
    sp(),
    h1('Breaking changes: Ninguno. Compatible con v1.19.0.'),
    sp(),
    h1('Metricas'),
    mkTable(['Metrica','Valor'],[
      ['SP entregados','24/24 (100%)'],
      ['Tests acumulados','524'],
      ['Cobertura','88%'],
      ['Defectos produccion','0'],
      ['SP acumulados proyecto','473'],
    ],[4000,5000]),
  ]);
  await save(doc, 'FEAT-018-Release-Notes.docx');
}

async function genRunbook() {
  var doc = buildDoc('Runbook - v1.20.0', 'Manual de Operacion · backend-2fa', [
    h1('1. Informacion del release'),
    mkTable(['Campo','Valor'],[
      ['Imagen Docker','backend-2fa:v1.20.0'],
      ['Tag Git','v1.20.0'],
      ['Flyway','V21__export_audit_log.sql'],
      ['Breaking changes','Ninguno — rollback safe'],
      ['Nueva dependencia','pdfbox 3.0.2 (~5MB JAR adicional)'],
    ],[3000,6000]),
    sp(),
    h1('2. Checklist pre-despliegue'),
    p('1. git checkout main && git pull origin main'),
    p('2. git tag | grep v1.20.0'),
    p('3. pg_dump bankportal_db > backup_pre_v1.20.0_$(date +%Y%m%d).sql'),
    p('4. df -h /var/lib/docker  (PDFBox +5MB)'),
    sp(),
    h1('3. Despliegue'),
    p('docker compose pull backend-2fa'),
    p('docker compose up -d --build --no-deps backend-2fa'),
    p('docker compose logs backend-2fa --tail=50 | grep -E "Started|ERROR|Flyway"'),
    sp(),
    h1('4. Verificacion Flyway V21'),
    p("SELECT version, success FROM flyway_schema_history WHERE version='21';"),
    p('Esperado: version=21, success=t'),
    sp(),
    h1('5. Smoke test'),
    p('bash infra/compose/smoke-test-v1.20.sh  →  13 checks PASS'),
    sp(),
    h1('6. Rollback'),
    p('docker compose stop backend-2fa'),
    p('docker tag backend-2fa:v1.19.0 backend-2fa:rollback'),
    p('docker compose up -d --no-deps backend-2fa'),
    p("(Opcional) DROP TABLE export_audit_log; DELETE FROM flyway_schema_history WHERE version='21';"),
    sp(),
    h1('7. Escalado'),
    mkTable(['Incidencia','Contacto'],[
      ['Error Flyway V21','Tech Lead'],
      ['PDF generation failure','Backend Dev'],
      ['Audit log no persiste','Backend Dev + DBA'],
      ['HTTP 403 inesperado','Security Team'],
    ],[4000,5000]),
  ]);
  await save(doc, 'FEAT-018-Runbook.docx');
}

async function genSprintPMC() {
  var doc = buildDoc('Sprint 20 - PMC Report', 'Project Monitoring & Control · CMMI Nivel 3', [
    h1('1. Estado del sprint'),
    mkTable(['Metrica','Planificado','Real','Desviacion'],[
      ['Story Points','24','24','0 (0%)'],
      ['NCS','0','0','OK'],
      ['Defectos produccion','0','0','OK'],
      ['Cobertura','>=87%','88%','+1%'],
      ['Velocidad','23.6 SP/sprint','24 SP','+0.4 SP'],
    ],[3000,2000,2000,2000]),
    sp(),
    h1('2. Sprint Goal: CUMPLIDO'),
    p('FEAT-018: 4 historias entregadas — 8 SP — 100%'),
    p('DEBT-032..035: 4 deudas cerradas — 16 SP — 100%'),
    p('DEBT-038 (CVSS 4.8): resuelto en el mismo sprint (LA-020-02)'),
    sp(),
    h1('3. Metricas acumuladas'),
    mkTable(['Metrica','Valor'],[
      ['Sprints completados','20/20'],
      ['Story Points acumulados','473'],
      ['Velocidad media (S1-S20)','23.65 SP/sprint'],
      ['Tests automatizados','524'],
      ['Cobertura','88%'],
      ['Defectos acumulados en produccion','0'],
      ['CMMI Nivel','3 activo'],
    ],[4000,5000]),
    sp(),
    h1('4. Lecciones aprendidas Sprint 20'),
    mkTable(['ID','Descripcion'],[
      ['LA-020-01','Jira actualizado automaticamente en cada step del pipeline'],
      ['LA-020-02','Hallazgos CVSS >= 4.0 resueltos en el mismo sprint de deteccion'],
      ['LA-020-03','Audit log enriquecido en el momento de escritura — no con proxies'],
      ['LA-020-04','Workflow Jira con estados SOFIA configurado en onboarding de proyecto'],
      ['LA-020-05','Documentation Agent (10 DOCX + 3 XLSX + dashboard) es bloqueante para cierre de sprint'],
    ],[1800,7200]),
    sp(),
    h1('5. Aprobacion del cierre'),
    mkTable(['Rol','Gate','Fecha'],[
      ['Tech Lead','G-3 aprobado','2026-03-30'],
      ['QA Lead','G-6 aprobado','2026-03-30'],
      ['DevOps Lead','G-7 aprobado','2026-03-30'],
      ['PM / Release Manager','G-8 aprobado','2026-03-30'],
    ],[2400,2600,4000]),
  ]);
  await save(doc, 'Sprint-20-Report-PMC.docx');
}

// ─── Sprint data JSON ──────────────────────────────────────────────────────

function genSprintDataJSON() {
  var data = {
    sprint: 20, sp: 24, acum: 473,
    feat: "FEAT-018",
    titulo: "Exportacion de Movimientos (PDF/CSV) + Deuda DEBT-032..035",
    rel: "v1.20.0", tests: 524, cov: 88, ncs: 0, defects: 0,
    date_closed: "2026-03-30",
    debt_resolved: ["DEBT-032","DEBT-033","DEBT-034","DEBT-035","DEBT-038"],
    debt_pending: ["DEBT-036","DEBT-037"],
    regulation: ["PSD2-Art47","GDPR-Art15","PCI-DSS-Req34","SEPA-SDD"]
  };
  fs.writeFileSync('docs/sprints/SPRINT-020-data.json', JSON.stringify(data, null, 2));
  console.log('  OK SPRINT-020-data.json');
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Documentation Agent — Sprint 20 ===');
  await genSRS();
  await genHLD();
  await genLLDBackend();
  await genLLDFrontend();
  await genTestPlan();
  await genQAReport();
  await genCodeReview();
  await genReleaseNotes();
  await genRunbook();
  await genSprintPMC();
  genSprintDataJSON();
  console.log('\n=== 10 DOCX + JSON completados ===\n');
}

main().catch(function(e){ console.error(e); process.exit(1); });
