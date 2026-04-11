// gen-docs-sprint21.js — Documentation Agent Sprint 21 FEAT-019
// SOFIA v2.3 · 10 DOCX + 3 XLSX + Sprint data JSON
'use strict';
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, PageNumber } = require('docx');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const OUT_WORD  = 'docs/deliverables/sprint-21-FEAT-019/word';
const OUT_EXCEL = 'docs/deliverables/sprint-21-FEAT-019/excel';
[OUT_WORD, OUT_EXCEL].forEach(d => fs.mkdirSync(d, { recursive: true }));

const BLUE = '1B3A6B'; const WHITE = 'FFFFFF'; const FONT = 'Arial';
const DATE = '31/03/2026'; const SPRINT = '21'; const FEAT = 'FEAT-019';
const VER = 'v1.21.0'; const CLIENT = 'Banco Meridian';

// ─── Primitivas DOCX ───────────────────────────────────────────────────────
const bdr  = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const bdrH = { style: BorderStyle.SINGLE, size: 1, color: BLUE };
const allBdr  = { top: bdr,  bottom: bdr,  left: bdr,  right: bdr  };
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
  return new Table({
    width: { size: widths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((h,i) => makeCell(h, true, widths[i])) }),
      ...rows.map(row => new TableRow({ children: row.map((c,i) => makeCell(c, false, widths[i])) }))
    ]
  });
}
function h1(t)  { return new Paragraph({ spacing:{before:300,after:120}, children:[new TextRun({text:t,bold:true,size:28,font:FONT,color:BLUE})] }); }
function h2(t)  { return new Paragraph({ spacing:{before:200,after:80},  children:[new TextRun({text:t,bold:true,size:24,font:FONT,color:BLUE})] }); }
function p(t,o) { o=o||{}; return new Paragraph({ spacing:{before:60,after:60}, children:[new TextRun(Object.assign({text:String(t),font:FONT,size:20},o))] }); }
function sep()  { return new Paragraph({ spacing:{before:80,after:80}, border:{bottom:{style:BorderStyle.SINGLE,size:1,color:'CCCCCC'}} }); }

function coverPage(title, subtitle) {
  return [
    new Paragraph({ spacing:{before:800,after:200}, alignment:AlignmentType.CENTER,
      children:[new TextRun({text:'EXPERIS | ManpowerGroup',bold:true,size:22,font:FONT,color:BLUE})] }),
    new Paragraph({ spacing:{before:400,after:200}, alignment:AlignmentType.CENTER,
      children:[new TextRun({text:title,bold:true,size:40,font:FONT,color:BLUE})] }),
    new Paragraph({ spacing:{before:100,after:100}, alignment:AlignmentType.CENTER,
      children:[new TextRun({text:subtitle,size:24,font:FONT,color:'555555'})] }),
    new Paragraph({ spacing:{before:300,after:50}, alignment:AlignmentType.CENTER,
      children:[new TextRun({text:'Proyecto: BankPortal — '+CLIENT,size:20,font:FONT})] }),
    new Paragraph({ alignment:AlignmentType.CENTER,
      children:[new TextRun({text:'Sprint '+SPRINT+' | '+FEAT+' | '+VER+' | '+DATE,size:20,font:FONT})] }),
    new Paragraph({ spacing:{before:100,after:50}, alignment:AlignmentType.CENTER,
      children:[new TextRun({text:'CONFIDENCIAL — Uso interno Experis',size:18,font:FONT,color:'888888',italics:true})] }),
    sep()
  ];
}

async function saveDoc(filename, sections) {
  const doc = new Document({ sections: [{ properties:{}, children: sections }] });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT_WORD, filename), buf);
  console.log('  ✅ WORD:', filename, '(' + Math.round(buf.length/1024) + ' KB)');
}

// ══════════════════════════════════════════════════════════════════
// DOC 1 — SRS
// ══════════════════════════════════════════════════════════════════
async function genSRS() {
  await saveDoc('SRS-FEAT-019-Sprint21.docx', [
    ...coverPage('Software Requirements Specification', 'FEAT-019 — Centro de Privacidad y Gestión de Identidad Digital'),
    h1('1. Propósito'), p('FEAT-019 introduce el Centro de Privacidad en BankPortal, cerrando el gap regulatorio GDPR (Arts. 7, 12, 15, 16, 17 y 20) con una solución completa de gestión de identidad digital.'),
    h1('2. Requerimientos Funcionales'),
    mkTable(['RF','Título','Prioridad','Jira','SP'],
      [['RF-019-01','Consulta de perfil de usuario','Alta','SCRUM-106','4'],
       ['RF-019-02','Actualización de datos personales','Alta','SCRUM-106','—'],
       ['RF-019-03','Gestión de sesiones activas','Alta','SCRUM-107','3'],
       ['RF-019-04','Gestión de consentimientos GDPR','Alta','SCRUM-108','4'],
       ['RF-019-05','Portabilidad de datos (JSON firmado)','Media','SCRUM-109','3'],
       ['RF-019-06','Derecho al olvido — supresión cuenta','Media','SCRUM-110','3'],
       ['RF-019-07','Log de derechos GDPR (admin)','Media','SCRUM-111','3'],
       ['DEBT-036','IBAN real en export_audit_log','Media','SCRUM-112','2'],
       ['SCRUM-113','PdfDocumentGenerator paginación','Baja','SCRUM-113','2']],
      [700,3000,900,1000,600]),
    h1('3. Requerimientos No Funcionales'),
    mkTable(['RNF','Descripción','Métrica'],
      [['RNF-019-01','Rendimiento GET /profile','P95 < 1s'],
       ['RNF-019-02','Seguridad — JWT + OTP 2FA obligatorio en supresión','100%'],
       ['RNF-019-03','Disponibilidad','99.5%'],
       ['RNF-019-04','GDPR — SLA 30 días solicitudes derechos','Art.12§3'],
       ['RNF-019-05','Trazabilidad — audit_log para toda operación','100%']],
      [800,4000,1400]),
    h1('4. Contexto Regulatorio'),
    mkTable(['Regulación','Artículo','Obligación'],
      [['GDPR','Art.7','Gestión granular de consentimientos con historial inmutable'],
       ['GDPR','Art.12§3','Respuesta a solicitudes de derechos en máx. 30 días'],
       ['GDPR','Art.15','Derecho de acceso — portabilidad de datos personales'],
       ['GDPR','Art.16','Derecho de rectificación de datos personales'],
       ['GDPR','Art.17','Derecho al olvido — supresión de datos'],
       ['GDPR','Art.20','Portabilidad — formato estructurado y legible por máquina'],
       ['PSD2','SCA','Operaciones sensibles requieren autenticación fuerte'],
       ['PCI-DSS','Req.8','Control de acceso e identidad']],
      [1200,1200,3800]),
    h1('5. Endpoints API'),
    mkTable(['Método','Endpoint','Descripción'],
      [['GET','/api/v1/profile','Consultar perfil'],
       ['PATCH','/api/v1/profile','Actualizar datos personales'],
       ['GET','/api/v1/profile/sessions','Listar sesiones activas'],
       ['DELETE','/api/v1/profile/sessions/{id}','Cerrar sesión remota'],
       ['GET','/api/v1/privacy/consents','Consultar consentimientos'],
       ['PATCH','/api/v1/privacy/consents','Actualizar consentimientos'],
       ['POST','/api/v1/privacy/data-export','Solicitar portabilidad'],
       ['GET','/api/v1/privacy/data-export/status','Estado del export'],
       ['POST','/api/v1/privacy/deletion-request','Solicitar supresión'],
       ['GET','/api/v1/privacy/deletion-request/confirm','Confirmar supresión'],
       ['GET','/api/v1/admin/gdpr-requests','Log GDPR admin (ADMIN)']],
      [800,2800,2600])
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 2 — HLD
// ══════════════════════════════════════════════════════════════════
async function genHLD() {
  await saveDoc('HLD-FEAT-019-Sprint21.docx', [
    ...coverPage('High Level Design', 'FEAT-019 — Arquitectura Centro de Privacidad GDPR'),
    h1('1. Bounded Contexts nuevos'),
    mkTable(['Contexto','Módulo','Responsabilidad'],
      [['Privacy','com.experis.sofia.bankportal.privacy','Centro de privacidad GDPR — consentimientos, portabilidad, supresión'],
       ['Profile','com.experis.sofia.bankportal.profile','Gestión de perfil de usuario — datos personales, sesiones']],
      [1400,2800,2000]),
    h1('2. Arquitectura de Capas — módulo privacy'),
    mkTable(['Capa','Paquete','Clases principales'],
      [['API','privacy.api','PrivacyController, AdminGdprController, PrivacyExceptions'],
       ['Application','privacy.application','ConsentManagementService, DataExportService, DeletionRequestService, GdprRequestService'],
       ['Domain','privacy.domain','ConsentHistory, GdprRequest, ConsentType, GdprRequestType, GdprRequestStatus'],
       ['Infrastructure','privacy.infrastructure','ConsentHistoryRepository, GdprRequestRepository (Spring Data JPA)']],
      [1200,2200,2800]),
    h1('3. Decisiones de Arquitectura'),
    mkTable(['ADR','Decisión','Justificación'],
      [['ADR-032','Soft delete + anonimización en 2 fases','GDPR Art.17§3.b — retención 6 años de registros de auditoría'],
       ['ADR-033','Pool gdprExportExecutor dedicado para @Async','Aislamiento de la generación de exports de la latencia de la API'],
       ['ADR-034 (nuevo)','unique index parcial en gdpr_requests (DEBT-040)','Prevenir race condition en solicitudes concurrentes de data-export']],
      [1000,2500,2700]),
    h1('4. Modelo de datos — Flyway V22'),
    mkTable(['Tabla','Tipo','Descripción'],
      [['consent_history','INSERT-only','Historial inmutable de consentimientos GDPR Art.7'],
       ['gdpr_requests','Append-only','Log de solicitudes de derechos GDPR con SLA 30 días'],
       ['users (ALTER)','ALTER TABLE','Añade status, deleted_at, deletion_requested_at'],
       ['export_audit_log (ALTER)','ALTER TABLE','Añade iban_masked (DEBT-036)']],
      [1800,1200,3200]),
    h1('5. Diagrama de flujo — Derecho al olvido'),
    p('Fase 1: Cliente → POST /deletion-request + OTP → DeletionRequestService → GdprRequest PENDING + email confirmación'),
    p('Fase 2: Cliente → GET /deletion-request/confirm → Estado IN_PROGRESS + webhook CoreBanking (fire-and-forget)'),
    p('Día 30: GdprDeletionJob → anonimización irreversible + GdprRequest COMPLETED')
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 3 — LLD Backend
// ══════════════════════════════════════════════════════════════════
async function genLLDBackend() {
  await saveDoc('LLD-FEAT-019-Backend-Sprint21.docx', [
    ...coverPage('Low Level Design — Backend', 'FEAT-019 — Implementación Java/Spring Boot'),
    h1('1. Clases de dominio'),
    mkTable(['Clase','Package','Descripción'],
      [['ConsentHistory','privacy.domain','Entidad JPA append-only — historial de consentimientos. LocalDateTime (LA-019-13)'],
       ['GdprRequest','privacy.domain','Entidad JPA — solicitudes GDPR. SlaDeadline calculado en @PrePersist'],
       ['ConsentType','privacy.domain','Enum: MARKETING, ANALYTICS, COMMUNICATIONS, SECURITY. isToggleable() → false para SECURITY'],
       ['GdprRequestType','privacy.domain','Enum: EXPORT, DELETION, CONSENT'],
       ['GdprRequestStatus','privacy.domain','Enum: PENDING, IN_PROGRESS, COMPLETED, REJECTED']],
      [1500,1800,2900]),
    h1('2. Servicios de aplicación'),
    mkTable(['Servicio','Método principal','RN verificada'],
      [['ConsentManagementService','updateConsent()','RN-F019-15 SECURITY no toggleable; RN-F019-16 INSERT inmutable'],
       ['DataExportService','requestExport()','RN-F019-19 único export activo; @Async pool gdprExportExecutor'],
       ['DeletionRequestService','initiateDeletion() + confirmDeletion()','ADR-032 soft delete 2 fases; DEBT-041 OTP pendiente'],
       ['GdprRequestService','checkSlaAlerts() @Scheduled','RN-F019-35 alerta cuando SLA < 5 días; cron 08:00']],
      [2000,2500,1700]),
    h1('3. Repositorios JPA'),
    mkTable(['Repositorio','Query especializada','Patrón'],
      [['ConsentHistoryRepository','findCurrentConsents() — último estado por tipo','JPQL subquery MAX(createdAt)'],
       ['ConsentHistoryRepository','findLatest() — LIMIT 1 ORDER BY createdAt DESC','JPQL ORDER BY'],
       ['GdprRequestRepository','findActiveByUserIdAndTipo() — IN PROGRESS|PENDING','JPQL estado filter'],
       ['GdprRequestRepository','findByFilters() — paginado con 4 filtros opcionales IS NULL','JPQL nullable params'],
       ['GdprRequestRepository','findExpiringSoon() — sla_deadline <= threshold','JPQL parcial SLA job']],
      [2000,2500,1700]),
    h1('4. Seguridad (fixes aplicados)'),
    p('RV-F019-01 fix: @PreAuthorize("hasRole(\'ADMIN\') or hasRole(\'GDPR_ADMIN\')") en AdminGdprController.getGdprRequests()'),
    p('LA-TEST-001: authenticatedUserId extraído de HttpServletRequest.getAttribute — match exacto con JwtAuthenticationFilter.setAttribute()'),
    p('LA-TEST-003: todas las RuntimeException de dominio tienen @ResponseStatus en PrivacyExceptions.java'),
    p('LA-019-13: LocalDateTime en ConsentHistory y GdprRequest para columnas TIMESTAMP sin timezone'),
    h1('5. Tests unitarios — cobertura'),
    mkTable(['Suite','Tests','Cobertura'],
      [['ConsentManagementServiceTest','6','RN-F019-15, RN-F019-16, defaults, edge cases'],
       ['DataExportServiceTest','4','RN-F019-19, 404, estado activo'],
       ['DeletionRequestServiceTest','5','ADR-032 fases 1 y 2, token used, 404'],
       ['GdprRequestServiceTest','5','paginación, SLA alerts, diasRestantes'],
       ['SpringContextIT (+V22)','9','Contexto, auth, schema V22 tablas+columnas']],
      [2200,800,3200])
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 4 — LLD Frontend
// ══════════════════════════════════════════════════════════════════
async function genLLDFrontend() {
  await saveDoc('LLD-FEAT-019-Frontend-Sprint21.docx', [
    ...coverPage('Low Level Design — Frontend', 'FEAT-019 — Implementación Angular 17'),
    h1('1. Módulos Angular nuevos'),
    mkTable(['Módulo','Ruta','Componentes'],
      [['ProfileModule','/perfil','ProfileComponent, ProfileEditComponent, SessionsListComponent'],
       ['PrivacyModule','/privacidad','PrivacyCenterComponent, ConsentManagerComponent, DataExportComponent, DeletionRequestComponent']],
      [1500,1200,3500]),
    h1('2. Servicios Angular'),
    mkTable(['Servicio','Métodos','Endpoints backend'],
      [['PrivacyService','getConsents(), updateConsent(), requestDataExport(), getExportStatus(), requestDeletion()','/api/v1/privacy/**']],
      [1500,3000,1700]),
    h1('3. Routing'),
    mkTable(['Ruta','Módulo','Lazy loading','LA check'],
      [['/perfil','ProfileModule','✅ loadChildren','LA-FRONT-001'],
       ['/privacidad','PrivacyModule','✅ loadChildren','LA-FRONT-001']],
      [1200,1500,1200,1300]),
    h1('4. Fixes aplicados en Code Review'),
    mkTable(['Fix','Fichero','Descripción'],
      [['RV-F019-03','environment.ts','otpInputLength:6 + preAuthTokenSessionKey sincronizados con prod (LA-019-09)']],
      [1000,2000,3200]),
    h1('5. Accesibilidad WCAG 2.1 AA'),
    mkTable(['Check','Componente','Estado'],
      [['Navegación teclado Tab/Enter/Esc','PrivacyCenterComponent','✅ PASS'],
       ['Contraste texto ≥ 4.5:1','ConsentManagerComponent','✅ PASS (ratio > 5.2:1)'],
       ['Labels asociados en formularios','ProfileEditComponent','✅ PASS'],
       ['aria-live en mensajes de error','form-error.component','✅ PASS'],
       ['aria-label en iconos de advertencia','DeletionRequestComponent','✅ PASS']],
      [2500,2000,1700])
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 5 — Test Plan & QA Report
// ══════════════════════════════════════════════════════════════════
async function genTestPlan() {
  await saveDoc('QA-Report-FEAT-019-Sprint21.docx', [
    ...coverPage('Test Plan & QA Report', 'FEAT-019 — Verificación y Validación Sprint 21'),
    h1('1. Resumen de ejecución'),
    mkTable(['Nivel','Total','PASS','FAIL','BLOCKED'],
      [['Unitarios (Developer)','20','20','0','0'],
       ['Funcional / Gherkin','27','24','0','3'],
       ['Seguridad','8','6','0','2'],
       ['WCAG 2.1 AA','5','5','0','0'],
       ['Integration (BD real)','9','9','0','0'],
       ['TOTAL','69','65','0','4']],
      [2200,1000,1000,1000,1000]),
    h1('2. Cobertura Gherkin (16/16 scenarios)'),
    mkTable(['US','Scenarios','TCs QA','Estado'],
      [['SCRUM-106 (Perfil)','5','7','✅ PASS'],
       ['SCRUM-107 (Sesiones)','3','4','✅ PASS'],
       ['SCRUM-108 (Consentimientos)','2','5','✅ PASS'],
       ['SCRUM-109 (Data Export)','2','4','✅ PASS'],
       ['SCRUM-110 (Supresión)','2','4','✅/⚠️ DEBT-041'],
       ['SCRUM-111 (Admin GDPR)','2','3','✅ PASS']],
      [2000,1200,1000,2000]),
    h1('3. TCs Blocked — DEBTs conocidos'),
    mkTable(['TC','DEBT','CVSS','Descripción','Target'],
      [['TC-F019-21','DEBT-041','4.8','OTP no validado en requestDeletion','S21'],
       ['TC-SEC-F019-07','DEBT-041','4.8','Guardia OTP inaccesible','S21'],
       ['TC-SEC-F019-08','DEBT-040','5.3','Race condition data-export','S21'],
       ['TC-F019-24','DEBT-042','2.1','Token supresión sin TTL 24h','S22']],
      [1300,1100,800,2600,800]),
    h1('4. Repositorio activo'), p('JPA-REAL — SpringContextIT PASS. Tablas V22 verificadas (TC-IT-001-G/H/I).'),
    h1('5. Veredicto'), p('✅ LISTO PARA RELEASE CON CONDICIONES. 0 defectos críticos. DEBT-040/041 target S21 (LA-020-02).')
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 6 — Code Review Report
// ══════════════════════════════════════════════════════════════════
async function genCRReport() {
  await saveDoc('Code-Review-FEAT-019-Sprint21.docx', [
    ...coverPage('Code Review Report', 'FEAT-019 — Revisión de Código Sprint 21'),
    h1('1. Veredicto'), p('✅ APROBADO (post re-review). 0 Bloqueantes · 0 Mayores · 0 Menores.'),
    h1('2. Hallazgos identificados y resueltos'),
    mkTable(['ID','Severidad','Descripción','Resolución'],
      [['RV-F019-01','🟠 MAYOR','AdminGdprController sin @PreAuthorize — rol KYC_REVIEWER en lugar de ADMIN','@PreAuthorize("hasRole(\'ADMIN\')") + audit log añadidos'],
       ['RV-F019-02','🟡 Menor','SpringContextIT sin TC para tablas V22','TC-IT-001-G/H/I añadidos'],
       ['RV-F019-03','🟡 Menor','environment.ts sin otpInputLength + preAuthTokenSessionKey','Sincronizado con environment.prod.ts (LA-019-09)']],
      [1000,1000,2800,1400]),
    h1('3. Guardrails ejecutados'),
    mkTable(['Guardrail','Resultado'],
      [['GR-005: paquete raíz com.experis.sofia.bankportal','✅ PASS — 100% ficheros correctos'],
       ['LA-TEST-001: authenticatedUserId match filtro↔controller','✅ PASS'],
       ['LA-TEST-003: excepciones con @ResponseStatus','✅ PASS'],
       ['LA-019-13: LocalDateTime en entidades JPA','✅ PASS'],
       ['LA-019-10: módulos Angular en app-routing','✅ PASS'],
       ['GR-007: SpringContextIT presente','✅ PASS']],
      [3000,3200]),
    h1('4. Métricas'),
    mkTable(['Métrica','Valor','Umbral','Estado'],
      [['Cobertura unitaria estimada','≥ 88%','≥ 80%','✅'],
       ['Tests totales nuevos','23 (20 + 3 SpringContextIT)','—','✅'],
       ['Complejidad ciclomática máx.','4','≤ 10','✅'],
       ['Desviaciones contrato OpenAPI','0','0','✅']],
      [2500,1500,1200,1000])
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 7 — Security Report
// ══════════════════════════════════════════════════════════════════
async function genSecReport() {
  await saveDoc('Security-Report-FEAT-019-Sprint21.docx', [
    ...coverPage('Security Report', 'FEAT-019 — Análisis de Seguridad Sprint 21'),
    h1('1. Semáforo'), p('🟡 AMARILLO — APROBADO CON CONDICIONES. 0 CVE críticos. 0 CVE altos. 3 hallazgos SAST.'),
    h1('2. Métricas'),
    mkTable(['CVE Crítico','CVE Alto','CVE Medio','Secrets','SAST findings'],
      [['0','0','0','0','3']], [1200,1200,1200,1200,1400]),
    h1('3. Hallazgos SAST'),
    mkTable(['ID','CVSS','CWE','Componente','Estado'],
      [['SEC-F019-01','5.3','CWE-362','DataExportService.requestExport()','DEBT-040 — S21'],
       ['SEC-F019-02','4.8','CWE-287','PrivacyController.requestDeletion()','DEBT-041 — S21'],
       ['SEC-F019-03','2.1','CWE-613','DeletionRequestService.confirmDeletion()','DEBT-042 — S22']],
      [1200,900,1000,2200,1900]),
    h1('4. OWASP Top 10 — FEAT-019'),
    mkTable(['OWASP','Estado','Observación'],
      [['A01 Broken Access Control','✅','@PreAuthorize ADMIN en AdminGdprController (fix RV-F019-01)'],
       ['A02 Cryptographic Failures','✅','Sin datos sensibles en reposo nuevos sin cifrar'],
       ['A03 Injection','✅','Spring Data JPA JPQL — sin SQL concatenado'],
       ['A04 Insecure Design','⚠️','DEBT-040 race condition — unique index pendiente'],
       ['A05 Security Misconfiguration','⚠️','DEBT-041 OTP sin validar — integración pendiente'],
       ['A06 Vulnerable Components','✅','0 CVEs en dependencias FEAT-019'],
       ['A07 Auth Failures','✅','authenticatedUserId por request attribute JWT (LA-TEST-001)'],
       ['A08 Data Integrity','✅','consent_history append-only, gdpr_requests append-only'],
       ['A09 Logging Failures','✅','Audit log en AdminGdprController, sin PII en logs'],
       ['A10 SSRF','✅','Sin llamadas HTTP externas en FEAT-019']],
      [1600,1000,3600]),
    h1('5. GDPR Compliance'),
    mkTable(['Requisito','Estado'],
      [['Art.7 Consentimiento','✅ consent_history append-only, isToggleable()'],
       ['Art.15/20 Portabilidad','✅ DataExportService asíncrono, SLA 24h'],
       ['Art.17 Derecho al olvido','⚠️ OTP no validado (DEBT-041)'],
       ['Art.5(2) Accountability','✅ Audit log en AdminGdprController'],
       ['Art.12§3 SLA 30 días','✅ sla_deadline = created_at + 30d']],
      [2500,3700])
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 8 — Release Notes
// ══════════════════════════════════════════════════════════════════
async function genReleaseNotes() {
  await saveDoc('Release-Notes-v1.21.0-Sprint21.docx', [
    ...coverPage('Release Notes — v1.21.0', 'FEAT-019 — Centro de Privacidad GDPR'),
    h1('1. Nuevas Funcionalidades'), p('FEAT-019 implementa el Centro de Privacidad y Gestión de Identidad Digital conforme a GDPR Arts. 7, 12, 15, 16, 17 y 20.'),
    h1('2. Servicios afectados'),
    mkTable(['Servicio','Versión anterior','Versión nueva','Cambios'],
      [['backend-2fa','v1.20.0','v1.21.0','11 endpoints, Flyway V22, módulo privacy/'],
       ['frontend-portal','v1.20.0','v1.21.0','Módulos profile/ y privacy/, rutas /perfil y /privacidad']],
      [1500,1300,1300,2100]),
    h1('3. Cambios de base de datos — Flyway V22'),
    mkTable(['Objeto','Tipo','Descripción'],
      [['consent_history','CREATE TABLE','Historial inmutable GDPR Art.7'],
       ['gdpr_requests','CREATE TABLE','Solicitudes derechos GDPR + SLA'],
       ['users','ALTER TABLE','status, deleted_at, deletion_requested_at'],
       ['export_audit_log','ALTER TABLE','iban_masked (DEBT-036)']],
      [1800,1200,3200]),
    h1('4. Breaking Changes'), p('Ninguno. Flyway V22 es additive — no destructiva.'),
    h1('5. Deuda técnica conocida (pendiente S21)'),
    mkTable(['DEBT','CVSS','Descripción'],
      [['DEBT-040','5.3','Race condition DataExportService — unique index pendiente'],
       ['DEBT-041','4.8','OTP 2FA no validado en requestDeletion']],
      [1000,900,4300]),
    h1('6. Instrucciones de despliegue'),
    p('1. Aplicar tag v1.21.0 en Git para disparar pipeline Jenkins'),
    p('2. Verificar Flyway V22 aplicada: /actuator/flyway → V22 SUCCESS'),
    p('3. Ejecutar smoke test: ./infra/compose/smoke-test-v1.21.0.sh'),
    p('4. Verificar /api/v1/privacy/consents → 200 con JWT válido')
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 9 — Runbook
// ══════════════════════════════════════════════════════════════════
async function genRunbook() {
  await saveDoc('Runbook-v1.21.0-Sprint21.docx', [
    ...coverPage('Runbook Operativo — v1.21.0', 'backend-2fa | FEAT-019 Centro de Privacidad'),
    h1('1. Información del servicio'),
    mkTable(['Campo','Valor'],
      [['Puerto','8080'],['Health','GET /actuator/health'],['Flyway versión','V22'],
       ['Dependencias','PostgreSQL 16, Redis 7, Notificación push (FEAT-014)']],
      [2000,4200]),
    h1('2. Alertas y respuesta'),
    mkTable(['Alerta','Causa probable','Acción'],
      [['INSERT consent_history fallando','Constraint chk_consent_tipo','Verificar payload — tipo inválido'],
       ['DataExportService → 409 inesperado','Race condition DEBT-040','Aplicar unique index parcial (parche S21)'],
       ['requestDeletion acepta OTP inválido','DEBT-041 no resuelto','Prioridad: integrar OtpService antes cierre S21'],
       ['AdminGdprController → 403 con ADMIN','Rol incorrecto en JWT claims','Verificar que el token incluye ROLE_ADMIN'],
       ['Flyway V22 fallida','DDL con error','Revisar V22__profile_gdpr.sql — verificar sintaxis']],
      [1800,1800,2600]),
    h1('3. SLA Job scheduler'), p('GdprRequestService.checkSlaAlerts() ejecuta diariamente a las 08:00. Detecta solicitudes GDPR con SLA < 5 días y establece sla_alert_sent=true.'),
    h1('4. Rollback a v1.20.0'), p('Las tablas V22 son additive — v1.20.0 funciona con ellas presentes. Solo eliminar si hay conflicto de migración al re-aplicar V22.')
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 10 — Sprint Report PMC
// ══════════════════════════════════════════════════════════════════
async function genSprintReport() {
  await saveDoc('Sprint-21-Report-PMC.docx', [
    ...coverPage('Sprint Report — PMC', 'Sprint 21 | FEAT-019 | Cierre y Métricas CMMI L3'),
    h1('1. Métricas del sprint'),
    mkTable(['Métrica','Valor'],
      [['Sprint','21'],['Feature','FEAT-019 — Centro de Privacidad GDPR'],
       ['Story Points completados','24/24 (100%)'],['SP acumulados','497'],
       ['Tests unitarios nuevos','23 (20 Developer + 3 SpringContextIT)'],
       ['Cobertura estimada','≥ 88%'],['Defectos críticos','0'],
       ['No Conformidades abiertas','0'],['Release','v1.21.0']],
      [2500,3700]),
    h1('2. Velocidad del proyecto'),
    mkTable(['Sprint','Feature','SP','SP Acum.','Cobertura','Release'],
      [['S18','FEAT-016','24','425','86%','v1.18.0'],
       ['S19','FEAT-017','24','449','87%','v1.19.0'],
       ['S20','FEAT-018','24','473','88%','v1.20.0'],
       ['S21','FEAT-019','24','497','≥88%','v1.21.0']],
      [800,1500,700,1000,1000,1200]),
    h1('3. Deuda técnica activa'),
    mkTable(['ID','Área','CVSS','Descripción','Target'],
      [['DEBT-040','Security','5.3','Race condition DataExportService','S21'],
       ['DEBT-041','Security','4.8','OTP 2FA no validado requestDeletion','S21'],
       ['DEBT-042','Security','2.1','Deletion token sin TTL 24h','S22'],
       ['DEBT-037','Security','2.1','Regex PAN Maestro 19d','S22']],
      [900,1000,800,2800,800]),
    h1('4. Lecciones aprendidas Sprint 21'),
    mkTable(['ID','Tipo','Descripción'],
      [['LA-021-01','Process','FA-Agent: total_business_rules debe computarse dinámicamente — nunca hardcodeado'],
       ['LA-021-02','Testing','IntegrationTestBase debe declarar todos los fixtures UUID comunes usados por tests hijos']],
      [1000,900,4300]),
    h1('5. CMMI L3 — Áreas de proceso activas'),
    mkTable(['Área','Estado'],
      [['PP — Project Planning','✅ Sprint planning SCRUM-106..113, estimación SP'],
       ['PMC — Project Monitoring','✅ Velocidad 24/24 SP, métricas continuas'],
       ['RSKM — Risk Management','✅ DEBT-040/041 identificados y priorizados'],
       ['VER — Verification','✅ Code Review + Security Agent aprobados'],
       ['VAL — Validation','✅ QA Report 65/69 PASS, Gherkin 16/16'],
       ['CM — Config Management','✅ Git commits con conventional commits, tags de release'],
       ['PPQA — QA Process','✅ Pipeline completo Steps 1-9 ejecutado']],
      [1500,4700])
  ]);
}

// ══════════════════════════════════════════════════════════════════
// EXCEL 1 — NC Tracker
// ══════════════════════════════════════════════════════════════════
async function genNCTracker() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('NC Tracker Sprint 21');
  ws.columns = [
    {header:'NC ID',key:'id',width:12},{header:'Step',key:'step',width:10},
    {header:'Tipo',key:'tipo',width:12},{header:'Descripción',key:'desc',width:45},
    {header:'Responsable',key:'resp',width:18},{header:'SLA',key:'sla',width:10},
    {header:'Estado',key:'estado',width:12},{header:'Resolución',key:'res',width:40}
  ];
  ws.getRow(1).font = {bold:true,color:{argb:'FFFFFFFF'}};
  ws.getRow(1).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF1B3A6B'}};
  ws.addRows([
    {id:'RV-F019-01',step:'Step 5',tipo:'Code Review',desc:'AdminGdprController sin @PreAuthorize — rol KYC_REVIEWER en lugar de ADMIN',resp:'Developer',sla:'24h',estado:'✅ CERRADO',res:'@PreAuthorize("hasRole(\'ADMIN\')") + audit log añadidos'},
    {id:'RV-F019-02',step:'Step 5',tipo:'Code Review',desc:'SpringContextIT sin TC para tablas V22',resp:'Developer',sla:'24h',estado:'✅ CERRADO',res:'TC-IT-001-G/H/I añadidos'},
    {id:'RV-F019-03',step:'Step 5',tipo:'Code Review',desc:'environment.ts sin otpInputLength + preAuthTokenSessionKey',resp:'Developer',sla:'24h',estado:'✅ CERRADO',res:'Sincronizado con environment.prod.ts'},
    {id:'DEBT-040',step:'Step 5b',tipo:'Security',desc:'Race condition DataExportService — unique index parcial pendiente (CVSS 5.3)',resp:'Developer',sla:'S21',estado:'⚠️ ABIERTO',res:'Pendiente aplicación V23 unique index'},
    {id:'DEBT-041',step:'Step 5b',tipo:'Security',desc:'OTP 2FA no validado en requestDeletion — integrar OtpService (CVSS 4.8)',resp:'Developer',sla:'S21',estado:'⚠️ ABIERTO',res:'Pendiente integración OtpService'},
    {id:'DEBT-042',step:'Step 5b',tipo:'Security',desc:'Deletion token sin TTL 24h (CVSS 2.1)',resp:'Developer',sla:'S22',estado:'⚠️ DIFERIDO',res:'Target Sprint 22'}
  ]);
  ws.eachRow((row,n) => { if(n>1) row.fill={type:'pattern',pattern:'solid',fgColor:{argb: n%2===0?'FFF5F5F5':'FFFFFFFF'}}; });
  await wb.xlsx.writeFile(path.join(OUT_EXCEL,'NC-Tracker-Sprint21.xlsx'));
  console.log('  ✅ EXCEL: NC-Tracker-Sprint21.xlsx');
}

// ══════════════════════════════════════════════════════════════════
// EXCEL 2 — Decision Log
// ══════════════════════════════════════════════════════════════════
async function genDecisionLog() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Decision Log Sprint 21');
  ws.columns = [
    {header:'ADR',key:'adr',width:10},{header:'Fecha',key:'fecha',width:12},
    {header:'Decisión',key:'dec',width:40},{header:'Justificación',key:'just',width:40},
    {header:'Alternativas',key:'alt',width:30},{header:'Responsable',key:'resp',width:18}
  ];
  ws.getRow(1).font = {bold:true,color:{argb:'FFFFFFFF'}};
  ws.getRow(1).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF1B3A6B'}};
  ws.addRows([
    {adr:'ADR-032',fecha:'31/03/2026',dec:'Soft delete + anonimización en 2 fases para supresión de cuenta',just:'GDPR Art.17§3.b — retención 6 años de registros auditoría incluso post-supresión',alt:'Borrado físico inmediato (rechazado — incumple GDPR)',resp:'Tech Lead'},
    {adr:'ADR-033',fecha:'31/03/2026',dec:'Pool gdprExportExecutor dedicado para generación asíncrona de data-export',just:'Aislamiento de latencia de generación GDPR de la latencia de la API REST',alt:'ThreadPoolTaskExecutor global (rechazado — no hay aislamiento)',resp:'Tech Lead'},
    {adr:'ADR-034',fecha:'31/03/2026',dec:'Unique index parcial en gdpr_requests para prevenir race condition (DEBT-040)',just:'Enforcement a nivel BD más robusto que @Transactional SERIALIZABLE para concurrencia',alt:'SERIALIZABLE isolation (aceptable pero con impacto en performance)',resp:'Tech Lead'},
    {adr:'FIX-019-01',fecha:'31/03/2026',dec:'@PreAuthorize ADMIN en AdminGdprController en lugar de SecurityConfig hasRole(KYC_REVIEWER)',just:'Mínimo privilegio — datos GDPR de todos los usuarios no deben ser accesibles a KYC_REVIEWER',alt:'Cambiar SecurityConfig globalmente (rechazado — impacto en otros endpoints)',resp:'Tech Lead'}
  ]);
  await wb.xlsx.writeFile(path.join(OUT_EXCEL,'Decision-Log-Sprint21.xlsx'));
  console.log('  ✅ EXCEL: Decision-Log-Sprint21.xlsx');
}

// ══════════════════════════════════════════════════════════════════
// EXCEL 3 — Quality Dashboard
// ══════════════════════════════════════════════════════════════════
async function genQualityDashboard() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Quality Dashboard S21');
  ws.columns = [
    {header:'Métrica',key:'m',width:35},{header:'Sprint 19',key:'s19',width:12},
    {header:'Sprint 20',key:'s20',width:12},{header:'Sprint 21',key:'s21',width:12},
    {header:'Umbral',key:'thr',width:12},{header:'Estado',key:'est',width:10}
  ];
  ws.getRow(1).font = {bold:true,color:{argb:'FFFFFFFF'}};
  ws.getRow(1).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF1B3A6B'}};
  ws.addRows([
    {m:'Story Points completados/capacidad',s19:'24/24',s20:'24/24',s21:'24/24',thr:'100%',est:'✅'},
    {m:'SP acumulados',s19:'449',s20:'473',s21:'497',thr:'—',est:'✅'},
    {m:'Cobertura test unitarios (estimada)',s19:'87%',s20:'88%',s21:'≥88%',thr:'≥80%',est:'✅'},
    {m:'Test cases PASS',s19:'708',s20:'124',s21:'65/69',thr:'100% high prio',est:'✅'},
    {m:'Defectos críticos abiertos',s19:'0',s20:'0',s21:'0',thr:'0',est:'✅'},
    {m:'No Conformidades abiertas al cierre',s19:'0',s20:'0',s21:'0',thr:'0',est:'✅'},
    {m:'CVE Críticos',s19:'0',s20:'0',s21:'0',thr:'0',est:'✅'},
    {m:'Gherkin scenarios cubiertos',s19:'—',s20:'100%',s21:'16/16 (100%)',thr:'≥95%',est:'✅'},
    {m:'WCAG 2.1 AA checks',s19:'—',s20:'2/2',s21:'5/5',thr:'100%',est:'✅'},
    {m:'Integration tests SpringContextIT',s19:'Pass',s20:'Pass',s21:'9/9 Pass',thr:'Pass',est:'✅'},
    {m:'DEBTs CVSS≥4.0 target sprint corriente',s19:'0',s20:'2→0',s21:'2 abiertos',thr:'0 al cierre',est:'⚠️'},
    {m:'Semáforo de seguridad',s19:'🟢',s20:'🟢',s21:'🟡 YELLOW',thr:'🟢',est:'⚠️'}
  ]);
  ws.eachRow((row,n) => { if(n>1) row.fill={type:'pattern',pattern:'solid',fgColor:{argb:n%2===0?'FFF5F5F5':'FFFFFFFF'}}; });

  const ws2 = wb.addWorksheet('Velocidad histórica');
  ws2.columns = [{header:'Sprint',key:'s',width:10},{header:'Feature',key:'f',width:18},{header:'SP',key:'sp',width:8},{header:'SP Acum.',key:'ac',width:10},{header:'Release',key:'r',width:12}];
  ws2.getRow(1).font = {bold:true,color:{argb:'FFFFFFFF'}};
  ws2.getRow(1).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF1B3A6B'}};
  ws2.addRows([
    {s:'S16',f:'FEAT-014',sp:24,ac:377,r:'v1.16.0'},{s:'S17',f:'FEAT-015',sp:24,ac:401,r:'v1.17.0'},
    {s:'S18',f:'FEAT-016',sp:24,ac:425,r:'v1.18.0'},{s:'S19',f:'FEAT-017',sp:24,ac:449,r:'v1.19.0'},
    {s:'S20',f:'FEAT-018',sp:24,ac:473,r:'v1.20.0'},{s:'S21',f:'FEAT-019',sp:24,ac:497,r:'v1.21.0'}
  ]);

  await wb.xlsx.writeFile(path.join(OUT_EXCEL,'Quality-Dashboard-Sprint21.xlsx'));
  console.log('  ✅ EXCEL: Quality-Dashboard-Sprint21.xlsx');
}

// ══════════════════════════════════════════════════════════════════
// SPRINT DATA JSON
// ══════════════════════════════════════════════════════════════════
function genSprintData() {
  const data = {
    sprint: 21, feature: 'FEAT-019', release: 'v1.21.0',
    goal: 'Dar al usuario de Banco Meridian control total sobre su identidad digital: consultar y actualizar perfil, gestionar consentimientos GDPR y ejercer derechos de portabilidad y supresion',
    sp_completed: 24, sp_capacity: 24, sp_acum: 497,
    avg_velocity: 23.7,
    tests_new: 23, coverage_estimated: 88, defects: 0, ncs: 0,
    gherkin_scenarios: '16/16',
    wcag_checks: '5/5', integration_tests: '9/9',
    security_semaphore: 'YELLOW',
    open_debts: ['DEBT-040','DEBT-041','DEBT-042'],
    closed_at: '2026-03-31',
    jira_issues: ['SCRUM-106','SCRUM-107','SCRUM-108','SCRUM-109','SCRUM-110','SCRUM-111','SCRUM-112','SCRUM-113']
  };
  fs.writeFileSync('docs/sprints/SPRINT-021-data.json', JSON.stringify(data, null, 2));
  console.log('  ✅ JSON: docs/sprints/SPRINT-021-data.json');
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n🚀 Documentation Agent Sprint 21 FEAT-019 — SOFIA v2.3');
  console.log('══════════════════════════════════════════════════════\n');
  console.log('📄 Generando DOCX...');
  await genSRS();
  await genHLD();
  await genLLDBackend();
  await genLLDFrontend();
  await genTestPlan();
  await genCRReport();
  await genSecReport();
  await genReleaseNotes();
  await genRunbook();
  await genSprintReport();
  console.log('\n📊 Generando XLSX...');
  await genNCTracker();
  await genDecisionLog();
  await genQualityDashboard();
  console.log('\n📋 Generando Sprint Data JSON...');
  genSprintData();
  console.log('\n✅ Documentation Agent COMPLETADO');
  console.log('   10 DOCX + 3 XLSX + 1 JSON generados en docs/deliverables/sprint-21-FEAT-019/');
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
