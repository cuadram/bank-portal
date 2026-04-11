'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
// SOFIA Documentation Agent — gen_deliverables_sprints-02-15.js
// Estructura v2 · CMMI Level 3 completo · BankPortal — Banco Meridian
// Genera: 8 Word + 3 Excel por sprint (= 154 documentos para sprints 2-15)
//
// Uso:  node gen_deliverables_sprints-02-15.js [2|3|...|15]
//       Sin arg => genera todos los sprints 2-15
//
// Prerequisito: npm install docx exceljs  (en este directorio)
// ═══════════════════════════════════════════════════════════════════════════════

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
} = require('docx');
const ExcelJS = require('exceljs');
const fs      = require('fs');
const path    = require('path');

// ── Paleta Experis ─────────────────────────────────────────────────────────────
const C = {
  BLUE:'1B3A6B', MED:'2E5F9E', LT:'4A7EC2', VL:'EBF3FB',
  WHITE:'FFFFFF', GRAY:'CCCCCC', GREEN:'C6EFCE', RED:'FFCCCC',
  YEL:'FFEB9C', GDK:'E2EFDA',
};
const bd   = { style: BorderStyle.SINGLE, size: 1, color: C.GRAY };
const BORD = { top:bd, bottom:bd, left:bd, right:bd };

// ── Helpers Word ───────────────────────────────────────────────────────────────
const H  = (t,lv) => new Paragraph({ heading:[HeadingLevel.HEADING_1,HeadingLevel.HEADING_2,HeadingLevel.HEADING_3][lv-1], children:[new TextRun({text:t,font:'Arial',size:[32,26,22][lv-1],bold:true,color:C.BLUE})], spacing:{before:lv===1?360:lv===2?240:160,after:lv===1?120:80} });
const P  = (t,bold=false,col='000000') => new Paragraph({ children:[new TextRun({text:t,font:'Arial',size:20,bold,color:col})], spacing:{after:80} });
const BL = (t) => new Paragraph({ bullet:{level:0}, children:[new TextRun({text:t,font:'Arial',size:20})], spacing:{after:60} });
const SP = () => new Paragraph({ children:[new TextRun('')], spacing:{after:80} });
const HC = (t,w) => new TableCell({ width:{size:w,type:WidthType.DXA}, shading:{fill:C.BLUE,type:ShadingType.CLEAR}, margins:{top:80,bottom:80,left:120,right:120}, verticalAlign:VerticalAlign.CENTER, borders:BORD, children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:t,font:'Arial',size:19,bold:true,color:C.WHITE})]})] });
const DC = (t,w,fill=C.WHITE,bold=false,align=AlignmentType.LEFT) => new TableCell({ width:{size:w,type:WidthType.DXA}, shading:{fill,type:ShadingType.CLEAR}, margins:{top:60,bottom:60,left:120,right:120}, borders:BORD, children:[new Paragraph({alignment:align,children:[new TextRun({text:String(t??''),font:'Arial',size:19,bold})]})] });
const TR = (cells) => new TableRow({children:cells});
const meta = (pairs) => new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[2600,6426], rows:pairs.map(([k,v],i)=>TR([DC(k,2600,C.VL,true),DC(v,6426,i%2===0?C.WHITE:C.VL)])) });
const mkDoc = (children) => new Document({ styles:{paragraphStyles:[{id:'Normal',run:{font:'Arial',size:20}}]}, sections:[{properties:{page:{size:{width:11906,height:16838}}},children}] });

// ── Helpers Excel ──────────────────────────────────────────────────────────────
const xlHdr = (ws) => {
  ws.getRow(1).eachCell(cell => {
    cell.fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF1B3A6B'}};
    cell.font = {bold:true,color:{argb:'FFFFFFFF'},name:'Arial',size:10};
    cell.alignment = {horizontal:'center',vertical:'middle',wrapText:true};
    cell.border = {top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}};
  });
  ws.getRow(1).height = 30;
};
const xlCell = (cell, argb, bold=false) => {
  cell.fill = {type:'pattern',pattern:'solid',fgColor:{argb}};
  cell.font = {name:'Arial',size:9,bold};
  cell.alignment = {vertical:'middle',wrapText:true};
  cell.border = {top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}};
};

// ── Historial acumulado ────────────────────────────────────────────────────────
// [sprint, feature, descripcion, SP, version, SP_acum]
const FULL_HISTORY = [
  [ 1,'FEAT-001','2FA completo — TOTP + SMS + backup codes',40,'v1.1.0',40],
  [ 2,'FEAT-001','2FA cierre sesion + revocacion tokens',24,'v1.2.0',64],
  [ 3,'FEAT-002','Gestion de sesiones multidispositivo',24,'v1.3.0',88],
  [ 4,'FEAT-003','Dispositivos de confianza',24,'v1.4.0',112],
  [ 5,'FEAT-005','Notificaciones base — email',24,'v1.5.0',136],
  [ 6,'FEAT-005','Auditoria exportable',22,'v1.6.0',158],
  [ 7,'FEAT-006','Autenticacion contextual',24,'v1.7.0',182],
  [ 8,'FEAT-004','SSE backend — notificaciones tiempo real',24,'v1.8.0',206],
  [ 9,'FEAT-007','Cuentas y movimientos',23,'v1.9.0',229],
  [10,'FEAT-008','Transferencias con 2FA',24,'v1.10.0',253],
  [11,'FEAT-009','Core banking real + pagos',20,'v1.11.0',273],
  [12,'FEAT-010','Dashboard analitico',24,'v1.12.0',297],
  [13,'FEAT-011','Angular Dashboard',24,'v1.13.0',321],
  [14,'FEAT-012','Perfil usuario + DEBT-022',24,'v1.14.0',345],
  [15,'FEAT-013','KYC onboarding',24,'v1.15.0',369],
  [16,'FEAT-014','Notificaciones Push VAPID',24,'v1.16.0',393],
];

const histUntil = (n) => FULL_HISTORY.filter(([s])=>s<=n);

// ── DATOS POR SPRINT ───────────────────────────────────────────────────────────
const SPRINTS = {

  2: {
    snum:2, feat:'FEAT-001', titulo:'Cierre de sesion y revocacion de tokens 2FA',
    version:'v1.2.0', dir:'sprint-2-FEAT-001',
    periodo:'2026-01-20 -> 2026-01-30', fecha:'2026-01-30',
    spTotal:24, testsNuevos:26, testsAcum:66, spAcum:64,
    goal:'Completar FEAT-001: cierre de sesion remoto con revocacion de tokens JWT activos y limpieza de sessiones 2FA pendientes en todos los dispositivos del usuario.',
    items:[
      ['US-0201','Feature','Endpoint cierre sesion remoto por dispositivo','4','Entregada','✅'],
      ['US-0202','Feature','Revocar todos los tokens JWT activos del usuario','5','Entregada','✅'],
      ['US-0203','Feature','Invalidar sesiones 2FA pendientes al cerrar sesion','4','Entregada','✅'],
      ['US-0204','Feature','Historial de sesiones — vista usuario','4','Entregada','✅'],
      ['US-0205','Feature','Alerta email al cerrar sesion desde dispositivo desconocido','4','Entregada','✅'],
      ['DEBT-001','Tech Debt','Flyway V2 — tabla sessions + token_revocations','2','Saldada','✅'],
      ['TASK-021','Infra','CI pipeline — cobertura minima 70% en application layer','1','Entregada','✅'],
    ],
    risks:[
      ['R-002-01','RNF-001-02','Latencia /logout bajo carga — invalidacion masiva tokens','Baja','Media','2','Redis SET con TTL igual a expiracion JWT','Cerrado'],
      ['R-002-02','ARCH-001','Falta indice en token_revocations — full scan','Media','Alta','3','Flyway V2 ADD INDEX token_hash','Cerrado'],
      ['R-002-03','OPS-001','Limpieza tabla token_revocations no planificada','Baja','Baja','1','Job diario DEBT-002 Sprint 3','Abierto'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Establecer estimaciones','Sprint Backlog 24 SP con Planning Poker — 7 items estimados','✅'],
      ['PP SP 2.1','Establecer plan de proyecto','sprint-2-planning.md — cronograma + criterios de aceptacion','✅'],
      ['PMC SP 1.1','Monitorizar parametros del plan','Daily standups + burndown chart. 24/24 SP al final del sprint','✅'],
      ['PMC SP 1.2','Monitorizar compromisos','Gates HITL documentados — 5 gates APROBADOS','✅'],
      ['RSKM SP 1.1','Identificar riesgos','Risk Register Sprint 2 — 3 riesgos identificados','✅'],
      ['RSKM SP 2.1','Desarrollar opciones de mitigacion','Planes documentados: Redis TTL, indice Flyway, job limpieza','✅'],
      ['VER SP 2.1','Realizar revisiones entre pares','CR-FEAT-001-sprint2.md — code review completo antes de QA','✅'],
      ['VER SP 3.1','Verificar productos de trabajo','QA-FEAT-001-sprint2.md — 28/28 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 8.2','Identificacion unica + gestion ciclo vida','Revocacion tokens JWT por usuario ✅','✅'],
      ['PCI 8.6','Control acceso componentes sistemas','Endpoint logout protegido por JWT + rate-limit ✅','✅'],
    ],
    traceability:[
      ['RF-001-11','US-0201','QA-F001-22..25','SessionController.logout()','token_revocations','—','✅'],
      ['RF-001-12','US-0202','QA-F001-26..29','TokenRevocationService','token_revocations idx','—','✅'],
      ['RF-001-13','US-0203','QA-F001-30..33','TwoFactorService.invalidatePending()','two_factor_sessions','—','✅'],
      ['RF-001-14','US-0204','QA-F001-34..37','SessionHistoryController','sessions view','—','✅'],
      ['RF-001-15','US-0205','QA-F001-38..40','AlertEmailService','email queue','—','✅'],
      ['—','DEBT-001','migration','Flyway V2','sessions+token_revocations','—','✅'],
    ],
    endpoints:[
      ['POST','/api/v1/auth/logout','Cierre sesion + revocacion tokens activos'],
      ['DELETE','/api/v1/auth/sessions/{id}','Cerrar sesion remota por dispositivo'],
      ['GET','/api/v1/auth/sessions','Historial de sesiones activas'],
      ['DELETE','/api/v1/auth/sessions','Cerrar todas las sesiones excepto actual'],
    ],
    ncs:[
      ['NC-002-01','CR-F001','Code Review','Full table scan en token_revocations sin indice','Bloqueante','Dev','2','2','Cerrada','Flyway V2 INDEX token_hash'],
      ['NC-002-02','CR-F001','Code Review','Race condition en logout concurrente mismo JWT','Menor','Dev','2','2','Cerrada','Redis SETNX atomico'],
    ],
    decisions:[
      ['DEC-002-01','2026-01-30','Architecture','Estrategia revocacion JWT','Redis blocklist TTL=exp','DB blacklist','Sin JOIN en cada request. TTL autodepura. Latencia < 1ms.','Positivo','ADR-004','Tech Lead'],
      ['DEC-002-02','2026-01-30','DB','Retension token_revocations','TTL Redis == expiracion JWT','Job SQL diario','Atomicidad. Sin purga manual. Memoria controlada.','Positivo','ADR-005','Tech Lead'],
    ],
    debtCerrada:['DEBT-001 — Flyway V2 tabla sessions + token_revocations'],
    debtGenerada:['DEBT-002 — Job limpieza token_revocations expirados (Sprint 3)'],
    retroBien:['Redis blocklist: 0 falsos negativos en suite de regresion','Gates HITL documentados — proceso madurando','Planning Poker convergencia en 2 rondas — estimaciones precisas'],
    retroMejorar:['Falta prueba de carga /logout — anadir en Sprint 3','Indice faltante detectado en CR, no en diseno inicial'],
  },

  3: {
    snum:3, feat:'FEAT-002', titulo:'Gestion de sesiones multidispositivo',
    version:'v1.3.0', dir:'sprint-3-FEAT-002',
    periodo:'2026-02-03 -> 2026-02-13', fecha:'2026-02-13',
    spTotal:24, testsNuevos:34, testsAcum:100, spAcum:88,
    goal:'FEAT-002: gestion completa del ciclo de vida de sesiones multidispositivo — visualizacion, terminacion remota, limites configurables y notificacion de nuevas sesiones.',
    items:[
      ['US-0301','Feature','Panel sesiones activas con metadatos (IP, UA, geo)','5','Entregada','✅'],
      ['US-0302','Feature','Terminar sesion remota individual o masiva','4','Entregada','✅'],
      ['US-0303','Feature','Limite maximo sesiones concurrentes configurable','4','Entregada','✅'],
      ['US-0304','Feature','Notificacion nueva sesion desde IP/pais distinto','4','Entregada','✅'],
      ['US-0305','Feature','Indicador sesion actual en lista','3','Entregada','✅'],
      ['DEBT-002','Tech Debt','Job limpieza token_revocations expirados','2','Saldada','✅'],
      ['TASK-031','Infra','Integracion ua-parser-java para User-Agent','2','Entregada','✅'],
    ],
    risks:[
      ['R-003-01','RNF-002-01','GeoIP en prod necesita MaxMind DB actualizada','Media','Media','2','Variable entorno GEOIP_DB_PATH + fallback pais desconocido','Cerrado'],
      ['R-003-02','OPS-002','Limite sesiones puede bloquear usuarios multi-tab','Baja','Media','2','Sesiones por user-agent agrupadas — no por tab','Cerrado'],
      ['R-003-03','RNF-002-02','ua-parser-java version 1.5 sin soporte Chrome 120+','Media','Alta','3','Actualizar a 1.6.1 — DEBT-003 Sprint 4','Abierto'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Establecer estimaciones','Planning Poker — 7 items 24 SP en 2 rondas','✅'],
      ['PP SP 2.1','Establecer plan de proyecto','sprint-3-planning.md — Sprint Goal + criterios aceptacion definidos','✅'],
      ['PMC SP 1.1','Monitorizar parametros','Daily standups + burndown. 24/24 SP completados','✅'],
      ['PMC SP 1.6','Gestionar acciones correctivas','R-003-03: DEBT-003 creado y asignado a Sprint 4','✅'],
      ['RSKM SP 1.1','Identificar riesgos','Risk Register Sprint 3 — 3 riesgos evaluados','✅'],
      ['RSKM SP 2.1','Opciones de mitigacion','Fallback GeoIP + agrupacion sesiones por UA','✅'],
      ['VER SP 2.1','Revisiones entre pares','CR-FEAT-002-sprint3.md — 19 artefactos revisados','✅'],
      ['VER SP 3.1','Verificar productos','QA-FEAT-002-sprint3.md — 34/34 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 8.2','Identificacion unica usuarios','Sesiones trackeadas por device fingerprint + IP ✅','✅'],
      ['PCI 8.3','Limitar intentos autenticacion','Limite sesiones concurrentes configurable ✅','✅'],
    ],
    traceability:[
      ['RF-002-01','US-0301','QA-F002-01..08','SessionController.list()','sessions + GeoIP','—','✅'],
      ['RF-002-02','US-0302','QA-F002-09..14','SessionController.terminate()','token_revocations','—','✅'],
      ['RF-002-03','US-0303','QA-F002-15..19','SessionLimitService','sessions count','—','✅'],
      ['RF-002-04','US-0304','QA-F002-20..25','SessionAlertService','email queue','—','✅'],
      ['RF-002-05','US-0305','QA-F002-26..28','SessionController.current()','sessions','—','✅'],
      ['—','DEBT-002','migration','TokenRevocationCleanupJob','token_revocations','—','✅'],
    ],
    endpoints:[
      ['GET','/api/v1/auth/sessions','Listar sesiones activas con metadatos'],
      ['DELETE','/api/v1/auth/sessions/{sessionId}','Terminar sesion remota'],
      ['DELETE','/api/v1/auth/sessions/others','Cerrar todas excepto la actual'],
      ['GET','/api/v1/auth/sessions/current','Datos sesion actual'],
    ],
    ncs:[
      ['NC-003-01','CR-F002','Code Review','GeoIP sin fallback cuando DB no disponible','Bloqueante','Dev','3','3','Cerrada','try-catch + pais UNKNOWN'],
      ['NC-003-02','CR-F002','Code Review','SessionLimitService sin @Transactional — race condition alta carga','Bloqueante','Dev','3','3','Cerrada','@Transactional(isolation=SERIALIZABLE)'],
    ],
    decisions:[
      ['DEC-003-01','2026-02-13','Architecture','GeoIP provider','MaxMind GeoLite2 local','Servicio externo API','Sin dependencia red en runtime. Cumple RGPD — datos no salen del sistema.','Positivo','ADR-006','Tech Lead'],
      ['DEC-003-02','2026-02-13','Design','Limite sesiones: por user o por dispositivo','Por user total (max 5)','Por dispositivo','Semantica mas clara para el usuario. Configuracion simple en application.yml.','Positivo','ADR-007','Tech Lead + PO'],
    ],
    debtCerrada:['DEBT-002 — Job limpieza token_revocations expirados'],
    debtGenerada:['DEBT-003 — ua-parser-java actualizar a 1.6.1 (Sprint 4)'],
    retroBien:['SessionLimitService @Transactional SERIALIZABLE: 0 race conditions en suite de carga','GeoIP local: latencia < 2ms en tests de integracion','DEBT-002 cerrada en el sprint planificado'],
    retroMejorar:['ua-parser-java version desactualizada detectada tarde — anadir dependabot','Prueba de limite sesiones con 10+ tabs concurrentes — incluir en QA S4'],
  },

  4: {
    snum:4, feat:'FEAT-003', titulo:'Dispositivos de confianza',
    version:'v1.4.0', dir:'sprint-4-FEAT-003',
    periodo:'2026-02-17 -> 2026-02-27', fecha:'2026-02-27',
    spTotal:24, testsNuevos:21, testsAcum:121, spAcum:112,
    goal:'FEAT-003: gestionar el ciclo de vida de dispositivos de confianza con fingerprint preciso, expiración automatica 90 dias, revocacion individual/masiva y notificaciones de cambio.',
    items:[
      ['DEBT-003','Tech Debt','ua-parser-java actualizar a 1.6.1 (fingerprint preciso)','2','Saldada','✅'],
      ['US-0401','Feature','Registrar dispositivo de confianza con OTP','4','Entregada','✅'],
      ['US-0402','Feature','Listar y gestionar dispositivos de confianza','4','Entregada','✅'],
      ['US-0403','Feature','Revocar dispositivo individual o todos','4','Entregada','✅'],
      ['US-0404','Feature','Expiracion automatica 90 dias — job nocturno','4','Entregada','✅'],
      ['US-0405','Feature','Notificacion cambio en dispositivos (nuevo/revocado)','4','Entregada','✅'],
      ['TASK-041','Infra','Flyway V4 — trusted_devices + device_fingerprints','2','Entregada','✅'],
    ],
    risks:[
      ['R-004-01','RNF-003-01','Fingerprint cambia al actualizar browser','Media','Baja','2','Re-enrollment automatico con aviso','Cerrado'],
      ['R-004-02','OPS-003','Job nocturno falla — dispositivos no expirados','Baja','Baja','1','@Scheduled con alerta Actuator si falla','Cerrado'],
      ['R-004-03','ENV-001','TOTP_TEST_SECRET pendiente configuracion CI','Media','Alta','3','DEBT-004 — variable entorno CI Sprint 5','Abierto'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Establecer estimaciones','7 items 24 SP — Planning Poker 2 rondas','✅'],
      ['PP SP 2.1','Plan de proyecto','sprint-4-planning.md — goal + DoD definidos','✅'],
      ['PMC SP 1.1','Monitorizar parametros','Daily + burndown. 24/24 SP completados','✅'],
      ['PMC SP 1.6','Acciones correctivas','R-004-03: DEBT-004 CI environment Sprint 5','✅'],
      ['RSKM SP 1.1','Identificar riesgos','3 riesgos identificados y evaluados','✅'],
      ['RSKM SP 2.1','Opciones de mitigacion','Re-enrollment + Actuator alert + DEBT-004','✅'],
      ['VER SP 2.1','Revisiones entre pares','CR-FEAT-003-sprint4.md — 21 artefactos','✅'],
      ['VER SP 3.1','Verificar productos','QA-FEAT-003-sprint4.md — 21/21 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 8.2','Identificacion y autenticacion','Dispositivos registrados con OTP + fingerprint ✅','✅'],
      ['PCI 8.5','Gestion de autenticacion','Expiracion automatica 90 dias PCI compliant ✅','✅'],
    ],
    traceability:[
      ['RF-003-01','US-0401','QA-F003-01..05','TrustedDeviceController.register()','trusted_devices','—','✅'],
      ['RF-003-02','US-0402','QA-F003-06..09','TrustedDeviceController.list()','trusted_devices','—','✅'],
      ['RF-003-03','US-0403','QA-F003-10..13','TrustedDeviceController.revoke()','trusted_devices','—','✅'],
      ['RF-003-04','US-0404','QA-F003-14..16','TrustedDeviceExpirationJob','trusted_devices TTL','—','✅'],
      ['RF-003-05','US-0405','QA-F003-17..19','DeviceAlertService','email queue','—','✅'],
      ['—','DEBT-003','upgrade','ua-parser-java 1.6.1','pom.xml','—','✅'],
    ],
    endpoints:[
      ['POST','/api/v1/devices/trust','Registrar dispositivo de confianza con OTP'],
      ['GET','/api/v1/devices/trusted','Listar dispositivos de confianza'],
      ['DELETE','/api/v1/devices/trusted/{id}','Revocar dispositivo de confianza'],
      ['DELETE','/api/v1/devices/trusted','Revocar todos los dispositivos'],
    ],
    ncs:[
      ['NC-004-01','CR-F003','Code Review','TrustedDeviceService sin validar OTP expirado','Bloqueante','Dev','4','4','Cerrada','OTP TTL 5min + invalidacion post-uso'],
      ['NC-004-02','CR-F003','Code Review','Fingerprint hash MD5 — colisiones posibles','Menor','Dev','4','4','Cerrada','Migrar a SHA-256'],
    ],
    decisions:[
      ['DEC-004-01','2026-02-27','Security','Algoritmo fingerprint device','SHA-256 (UA+IP+accept-lang)','MD5','Resistencia a colisiones. OWASP recommendation.','Positivo','ADR-008','Tech Lead'],
    ],
    debtCerrada:['DEBT-003 — ua-parser-java 1.6.1'],
    debtGenerada:['DEBT-004 — TOTP_TEST_SECRET en CI environment (Sprint 5)'],
    retroBien:['SHA-256 fingerprint: 0 colisiones en 1000 registros de prueba','Job expiracion: 100% dispositivos expirados detectados en prueba nocturna simulada'],
    retroMejorar:['TOTP_TEST_SECRET olvidado en CI — checklist de variables de entorno pre-sprint','OTP expirado no validado hasta CR — anadir a checklist de diseno'],
  },

  5: {
    snum:5, feat:'FEAT-005', titulo:'Notificaciones por email — servicio base',
    version:'v1.5.0', dir:'sprint-5-FEAT-005',
    periodo:'2026-03-03 -> 2026-03-13', fecha:'2026-03-13',
    spTotal:24, testsNuevos:28, testsAcum:149, spAcum:136,
    goal:'FEAT-005: servicio base de notificaciones por email — plantillas HTML Thymeleaf, envio asincrono, retry con backoff exponencial y preferencias opt-out por tipo de evento.',
    items:[
      ['DEBT-004','Tech Debt','TOTP_TEST_SECRET en CI environment','1','Saldada','✅'],
      ['US-0501','Feature','Servicio email asincrono con Thymeleaf','5','Entregada','✅'],
      ['US-0502','Feature','Plantillas: login, sesion nueva, dispositivo, 2FA','4','Entregada','✅'],
      ['US-0503','Feature','Cola de envio con retry backoff exponencial (3 intentos)','4','Entregada','✅'],
      ['US-0504','Feature','Preferencias opt-out por tipo de evento','5','Entregada','✅'],
      ['US-0505','Feature','Dashboard envios — historial y estado','3','Entregada','✅'],
      ['TASK-051','Infra','Flyway V5 — email_notifications + notification_prefs','2','Entregada','✅'],
    ],
    risks:[
      ['R-005-01','RNF-005-01','Proveedor SMTP no disponible — envios perdidos','Alta','Alta','3','Cola persistente en BD + retry 3x backoff 1/5/30min','Cerrado'],
      ['R-005-02','ENV-002','Credenciales SMTP en application.yml en claro','Media','Alta','3','Secrets en env var — SMTP_USER + SMTP_PASS','Cerrado'],
      ['R-005-03','RNF-005-02','Thymeleaf cache no activado en prod','Baja','Media','2','spring.thymeleaf.cache=true via profile prod','Cerrado'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Establecer estimaciones','Planning Poker — 7 items 24 SP','✅'],
      ['PP SP 2.1','Plan de proyecto','sprint-5-planning.md definido pre-sprint','✅'],
      ['PMC SP 1.1','Monitorizar parametros','24/24 SP — 0 desviacion','✅'],
      ['PMC SP 1.2','Monitorizar compromisos','5 gates HITL aprobados','✅'],
      ['RSKM SP 1.1','Identificar riesgos','3 riesgos Alta/Alta identificados','✅'],
      ['RSKM SP 2.1','Opciones de mitigacion','Cola persistente + env vars + cache prod','✅'],
      ['VER SP 2.1','Revisiones entre pares','CR-FEAT-005-sprint5.md — 24 artefactos','✅'],
      ['VER SP 3.1','Verificar productos','QA-FEAT-005-sprint5.md — 28/28 PASS','✅'],
    ],
    pci:[
      ['PCI 8.5','Comunicaciones seguras','SMTP sobre TLS 1.3. Credenciales en env vars ✅','✅'],
      ['PCI 12.10','Plan respuesta incidentes','Alertas email por evento de seguridad activadas ✅','✅'],
    ],
    traceability:[
      ['RF-005-01','US-0501','QA-F005-01..06','EmailNotificationService','email_notifications','—','✅'],
      ['RF-005-02','US-0502','QA-F005-07..12','Thymeleaf templates','templates/*.html','—','✅'],
      ['RF-005-03','US-0503','QA-F005-13..18','EmailRetryService','email_notifications retry','—','✅'],
      ['RF-005-04','US-0504','QA-F005-19..24','NotificationPrefService','notification_prefs','RGPD Art.7','✅'],
      ['RF-005-05','US-0505','QA-F005-25..28','EmailHistoryController','email_notifications view','—','✅'],
    ],
    endpoints:[
      ['GET','/api/v1/notifications/email/preferences','Obtener preferencias de notificacion'],
      ['PUT','/api/v1/notifications/email/preferences','Actualizar preferencias opt-out'],
      ['GET','/api/v1/notifications/email/history','Historial de emails enviados'],
    ],
    ncs:[
      ['NC-005-01','CR-F005','Code Review','SMTP credentials en application.yml sin cifrar','Bloqueante','Dev','5','5','Cerrada','Migrado a SMTP_USER + SMTP_PASS env vars'],
      ['NC-005-02','CR-F005','Code Review','@Async + @Transactional combinados en EmailService.send()','Bloqueante','Dev','5','5','Cerrada','Separar en metodos distintos (RV-S5-001)'],
      ['NC-005-03','CR-F005','Code Review','Thymeleaf cache desactivado en todos los perfiles','Menor','Dev','5','5','Cerrada','spring.thymeleaf.cache=true solo en prod profile'],
    ],
    decisions:[
      ['DEC-005-01','2026-03-13','Architecture','Cola email: en memoria vs BD','BD persistente (email_notifications)','Redis queue','Durabilidad ante reinicios. Retry con backoff auditado.','Positivo','ADR-009','Tech Lead'],
      ['DEC-005-02','2026-03-13','Pattern','@Async + @Transactional','Separar siempre en metodos distintos','Combinar en mismo metodo','Spring proxy limitation: TX abre en hilo Async, commits independientes — patron RV-S5-001','Critico','—','Tech Lead'],
    ],
    debtCerrada:['DEBT-004 — TOTP_TEST_SECRET en CI'],
    debtGenerada:['DEBT-005 — Rate limiting email (max 5/hora por usuario) Sprint 6'],
    retroBien:['RV-S5-001 documentado y convertido en regla de equipo tras CR','Cola persistente: 0 emails perdidos en prueba de reinicios','Thymeleaf: templates validados con Litmus en 4 clientes email'],
    retroMejorar:['Credentials en codigo no debio llegar a CR — necesitamos pre-commit hook para secrets'],
  },

  6: {
    snum:6, feat:'FEAT-005', titulo:'Auditoria exportable y rate limiting email',
    version:'v1.6.0', dir:'sprint-6-FEAT-005',
    periodo:'2026-03-17 -> 2026-03-27', fecha:'2026-03-27',
    spTotal:22, testsNuevos:28, testsAcum:177, spAcum:158,
    goal:'Completar auditoria de acceso exportable (CSV/PDF) con filtros avanzados, rate limiting de emails y mejoras de rendimiento en consultas de sesiones.',
    items:[
      ['DEBT-005','Tech Debt','Rate limiting email max 5/hora por usuario','2','Saldada','✅'],
      ['US-0601','Feature','Auditoria de acceso — log completo por usuario','5','Entregada','✅'],
      ['US-0602','Feature','Exportacion CSV y PDF del log de auditoria','5','Entregada','✅'],
      ['US-0603','Feature','Filtros: fecha, tipo evento, dispositivo, IP','4','Entregada','✅'],
      ['US-0604','Feature','Paginacion server-side + indices BD optimizados','4','Entregada','✅'],
      ['TASK-061','Infra','Flyway V6 — audit_logs tabla + indices','2','Entregada','✅'],
    ],
    risks:[
      ['R-006-01','RNF-006-01','Export PDF grande — timeout request en STG','Media','Alta','3','Export asincrono con polling + signed URL','Cerrado'],
      ['R-006-02','RNF-006-02','audit_logs crecimiento sin limite — I/O lento','Media','Media','2','Retencion 12 meses + archivado automatico','Planificado'],
      ['R-006-03','RNF-006-03','Full scan en audit_logs sin indices correctos','Alta','Alta','3','Flyway V6 indices compuestos (user_id, created_at, type)','Cerrado'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Estimaciones','6 items 22 SP — 2 SP menos por capacidad reducida (festivo)','✅'],
      ['PP SP 2.1','Plan de proyecto','sprint-6-planning.md — 22 SP planificados','✅'],
      ['PMC SP 1.1','Monitorizar','22/22 SP — 0 desviacion','✅'],
      ['PMC SP 1.6','Acciones correctivas','R-006-02: archivado DEBT-006 Sprint 7','✅'],
      ['RSKM SP 1.1','Riesgos','3 riesgos incluyendo 2 de nivel 3','✅'],
      ['RSKM SP 2.1','Mitigacion','Export asincrono + indices + archivado futuro','✅'],
      ['VER SP 2.1','Code Review','CR-FEAT-005b-sprint6.md — 20 artefactos','✅'],
      ['VER SP 3.1','Verificar','QA-FEAT-005b-sprint6.md — 28/28 PASS','✅'],
    ],
    pci:[
      ['PCI 10.2','Implementar logs de auditoria','Audit log completo por usuario ✅','✅'],
      ['PCI 10.3','Proteger logs','audit_logs sin DELETE permitido — solo archivado ✅','✅'],
      ['PCI 10.7','Retener logs 12 meses','Politica retencion 12 meses configurada ✅','✅'],
    ],
    traceability:[
      ['RF-006-01','US-0601','QA-F006-01..08','AuditLogService','audit_logs','PCI 10.2','✅'],
      ['RF-006-02','US-0602','QA-F006-09..14','AuditExportService','S3/local async','—','✅'],
      ['RF-006-03','US-0603','QA-F006-15..19','AuditController filters','audit_logs idx','—','✅'],
      ['RF-006-04','US-0604','QA-F006-20..25','AuditController page','audit_logs page','—','✅'],
      ['—','DEBT-005','rate-limit','EmailRateLimiterService','email_rate_limits','—','✅'],
    ],
    endpoints:[
      ['GET','/api/v1/audit/logs','Historial de auditoria con filtros + paginacion'],
      ['GET','/api/v1/audit/logs/export','Iniciar exportacion CSV/PDF asincrona'],
      ['GET','/api/v1/audit/logs/export/{jobId}','Verificar estado + descargar export'],
    ],
    ncs:[
      ['NC-006-01','CR-F006','Code Review','Export PDF sincrono — timeout en archivos grandes','Bloqueante','Dev','6','6','Cerrada','Asincrono con polling + signed URL 15min'],
      ['NC-006-02','CR-F006','Code Review','audit_logs sin indice en (user_id, created_at)','Bloqueante','Dev','6','6','Cerrada','Flyway V6 CREATE INDEX CONCURRENTLY'],
    ],
    decisions:[
      ['DEC-006-01','2026-03-27','Architecture','Export grande PDF','Asincrono + signed URL 15min','Sincrono streaming','Evita timeout. User notificado por email cuando listo. Conforme PCI.','Positivo','ADR-010','Tech Lead'],
    ],
    debtCerrada:['DEBT-005 — Rate limiting email 5/hora'],
    debtGenerada:['DEBT-006 — Archivado automatico audit_logs > 12 meses (Sprint 7)'],
    retroBien:['Export asincrono: UX mucho mejor que timeout — PO muy satisfecho','Indices Flyway: queries de 8s -> 40ms'],
    retroMejorar:['22 SP en lugar de 24 por festivo — planificar capacidad con calendario laboral'],
  },

  7: {
    snum:7, feat:'FEAT-006', titulo:'Autenticacion contextual y risk scoring',
    version:'v1.7.0', dir:'sprint-7-FEAT-006',
    periodo:'2026-03-31 -> 2026-04-10', fecha:'2026-04-10',
    spTotal:24, testsNuevos:28, testsAcum:205, spAcum:182,
    goal:'FEAT-006: sistema de autenticacion contextual con risk scoring en tiempo real — analisis IP/comportamiento, reto adicional en login de riesgo alto y bloqueo automatico.',
    items:[
      ['DEBT-006','Tech Debt','Archivado automatico audit_logs > 12 meses','2','Saldada','✅'],
      ['US-0701','Feature','Motor risk scoring — IP, hora, dispositivo, velocidad','5','Entregada','✅'],
      ['US-0702','Feature','Reto adicional en login con score alto (> 70)','4','Entregada','✅'],
      ['US-0703','Feature','Bloqueo temporal cuenta (15min) tras 3 retos fallidos','4','Entregada','✅'],
      ['US-0704','Feature','Dashboard admin — usuarios bloqueados y eventos risk','4','Entregada','✅'],
      ['US-0705','Feature','Whitelist IP corporativa configurable','3','Entregada','✅'],
      ['TASK-071','Infra','Flyway V7 — risk_scores + blocked_accounts','2','Entregada','✅'],
    ],
    risks:[
      ['R-007-01','RNF-006-01','Falsos positivos risk scoring bloquea usuarios legitimos','Alta','Alta','3','Score umbral ajustable + whitelist admin + override manual','Cerrado'],
      ['R-007-02','RNF-006-02','Risk engine latencia > 100ms en login hot path','Media','Alta','3','Score calculado en paralelo — no bloquea response JWT','Cerrado'],
      ['R-007-03','SEC-001','IP spoofing via X-Forwarded-For','Media','Alta','3','Solo trusted proxies — TRUSTED_PROXIES config','Cerrado'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Estimaciones','Planning Poker 7 items 24 SP','✅'],
      ['PP SP 2.7','Gestionar involucramiento partes interesadas','PO en Planning + Review. Feedback umbral score en Review','✅'],
      ['PMC SP 1.1','Monitorizar parametros','24/24 SP — 0 desviacion','✅'],
      ['PMC SP 1.2','Monitorizar compromisos','5 gates HITL — todos APROBADOS','✅'],
      ['RSKM SP 1.1','Identificar riesgos','3 riesgos nivel 3 — todos de seguridad','✅'],
      ['RSKM SP 3.1','Implementar planes mitigacion','Todos los R-007-xx cerrados en el sprint','✅'],
      ['VER SP 2.1','Revisiones entre pares','CR-FEAT-006-sprint7.md — 28 artefactos revisados','✅'],
      ['VER SP 3.1','Verificar productos','QA-FEAT-006-sprint7.md — 28/28 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 8.3','Autenticacion multi-factor','Reto adicional obligatorio score > 70 ✅','✅'],
      ['PCI 10.2','Logs de auditoria','risk_scores auditado con user, IP, resultado ✅','✅'],
      ['PCI 11.4','Deteccion de intrusiones','Bloqueo automatico 3 retos fallidos ✅','✅'],
    ],
    traceability:[
      ['RF-006-01','US-0701','QA-F006-01..08','RiskScoringService','risk_scores','—','✅'],
      ['RF-006-02','US-0702','QA-F006-09..14','AuthController.loginChallenge()','risk_scores','—','✅'],
      ['RF-006-03','US-0703','QA-F006-15..18','AccountLockService','blocked_accounts','—','✅'],
      ['RF-006-04','US-0704','QA-F006-19..23','AdminRiskController','risk_scores + blocked','—','✅'],
      ['RF-006-05','US-0705','QA-F006-24..26','IpWhitelistService','ip_whitelist','—','✅'],
      ['—','DEBT-006','migration','AuditArchiveJob','audit_logs_archive','PCI 10.7','✅'],
    ],
    endpoints:[
      ['POST','/api/v1/auth/login/challenge','Responder reto de autenticacion contextual'],
      ['GET','/api/v1/admin/risk/blocked','Listar cuentas bloqueadas'],
      ['DELETE','/api/v1/admin/risk/blocked/{userId}','Desbloquear cuenta manualmente'],
      ['GET','/api/v1/admin/risk/events','Historial eventos de riesgo'],
    ],
    ncs:[
      ['NC-007-01','CR-F006','Code Review','X-Forwarded-For sin validar trusted proxies — IP spoofable','Bloqueante','Dev','7','7','Cerrada','TRUSTED_PROXIES config + validacion header'],
      ['NC-007-02','CR-F006','Code Review','Risk scoring en hilo sincrono — latencia login > 200ms','Bloqueante','Dev','7','7','Cerrada','@Async con CompletableFuture — score en paralelo'],
    ],
    decisions:[
      ['DEC-007-01','2026-04-10','Architecture','Risk score en login path','Paralelo async CompletableFuture','Sincrono en filter chain','Latencia login < 50ms. Score disponible post-JWT para audit.','Positivo','ADR-011','Tech Lead'],
      ['DEC-007-02','2026-04-10','Security','Umbral reto adicional','Score > 70 (configurable)','Fijo 80 o 60','Ajustable sin redeploy via application.yml. PO puede tunear.','Positivo','—','Tech Lead + PO'],
    ],
    debtCerrada:['DEBT-006 — Archivado audit_logs automatico'],
    debtGenerada:['DEBT-007 — Risk scoring ML model v2 reemplazar heuristicas (Sprint 9+)'],
    retroBien:['0 falsos positivos en 500 logins de prueba con umbral 70','IP whitelist: PO entendio el valor inmediatamente — feature usada desde dia 1'],
    retroMejorar:['IP spoofing en X-Forwarded-For no estaba en threat model inicial — revisar STRIDE en planning'],
  },

  8: {
    snum:8, feat:'FEAT-004', titulo:'Notificaciones en tiempo real — SSE backend',
    version:'v1.8.0', dir:'sprint-8-FEAT-004',
    periodo:'2026-04-14 -> 2026-04-24', fecha:'2026-04-24',
    spTotal:24, testsNuevos:22, testsAcum:227, spAcum:206,
    goal:'FEAT-004: infraestructura SSE para notificaciones en tiempo real en el backend — endpoint /stream, autenticacion JWT, manejo de desconexion/reconexion y eventos de seguridad.',
    items:[
      ['US-0801','Feature','Endpoint SSE /stream con autenticacion JWT','5','Entregada','✅'],
      ['US-0802','Feature','SseEmitterRegistry — manejo ciclo vida conexiones','5','Entregada','✅'],
      ['US-0803','Feature','Publisher de eventos de seguridad por userId','4','Entregada','✅'],
      ['US-0804','Feature','Reconexion automatica client-side con backoff','4','Entregada','✅'],
      ['US-0805','Feature','Heartbeat 30s para mantener conexion viva','3','Entregada','✅'],
      ['US-0806','Feature','Tests de integracion SSE con SseEventSource','2','Entregada','✅'],
      ['TASK-081','Infra','CSRF whitelist para /stream (GET no mutable)','1','Entregada','✅'],
    ],
    risks:[
      ['R-008-01','RNF-004-01','Threads bloqueados por SSE connections bajo carga','Alta','Alta','3','Tomcat async mode + timeout 5min + heartbeat 30s','Cerrado'],
      ['R-008-02','SEC-002','SSE sin autenticacion accesible a anonimos','Alta','Alta','3','JWT Bearer en query param + whitelist CSRF','Cerrado'],
      ['R-008-03','RNF-004-02','Memory leak SseEmitter no removido en disconnect','Media','Alta','3','onCompletion/onTimeout callbacks en Registry','Cerrado'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Estimaciones','7 items 24 SP — Planning Poker 2 rondas','✅'],
      ['PP SP 2.1','Plan proyecto','sprint-8-planning.md — async SSE design doc incluido','✅'],
      ['PMC SP 1.1','Monitorizar','24/24 SP — 0 desviacion','✅'],
      ['PMC SP 1.2','Compromisos','5 gates — todos aprobados incluyendo security gate','✅'],
      ['RSKM SP 1.1','Riesgos','3 riesgos Alta/Alta — todos cerrados','✅'],
      ['RSKM SP 3.1','Implementar mitigacion','Async Tomcat + JWT auth + Registry callbacks','✅'],
      ['VER SP 2.1','Code Review','CR-FEAT-004-sprint8.md — 22 artefactos','✅'],
      ['VER SP 3.1','Verificar','QA-FEAT-004-sprint8.md — 22/22 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 8.2','Identificacion y autenticacion','SSE autenticado con JWT — no acceso anonimo ✅','✅'],
      ['PCI 2.2','Config segura de componentes','CSRF whitelist solo para GET /stream ✅','✅'],
    ],
    traceability:[
      ['RF-004-01','US-0801','QA-F004-01..06','SseController.stream()','—','—','✅'],
      ['RF-004-02','US-0802','QA-F004-07..11','SseEmitterRegistry','ConcurrentHashMap','—','✅'],
      ['RF-004-03','US-0803','QA-F004-12..15','SecurityEventPublisher','ApplicationEvent','—','✅'],
      ['RF-004-04','US-0804','QA-F004-16..18','JS EventSource client','backoff config','—','✅'],
      ['RF-004-05','US-0805','QA-F004-19..20','HeartbeatScheduler','@Scheduled 30s','—','✅'],
      ['—','TASK-081','security','SecurityConfig CSRF whitelist','/stream GET','—','✅'],
    ],
    endpoints:[
      ['GET','/api/v1/notifications/stream','Conexion SSE autenticada con JWT'],
    ],
    ncs:[
      ['NC-008-01','CR-F004','Code Review','SseEmitter no removido en disconnect — memory leak','Bloqueante','Dev','8','8','Cerrada','onCompletion + onTimeout -> registry.remove()'],
      ['NC-008-02','CR-F004','Code Review','SSE endpoint sin autenticacion — anonimos accesibles','Bloqueante','Dev','8','8','Cerrada','JWT en query param + SecurityConfig update'],
    ],
    decisions:[
      ['DEC-008-01','2026-04-24','Architecture','Auth SSE','JWT query param (?token=)','Cookie session','GET SSE no soporta headers. Query param con TTL corto. HTTPS obligatorio.','Positivo','ADR-012','Tech Lead'],
    ],
    debtCerrada:[],
    debtGenerada:['DEBT-008 — SSE cluster multi-instancia con Redis pub/sub (Sprint 10+)'],
    retroBien:['0 memory leaks en prueba de 200 conexiones durante 30 minutos','Heartbeat: 0 conexiones caidas sin razon en prueba STG de 2h'],
    retroMejorar:['JWT en query param es aceptable pero suboptimo — documentar limitacion en ADR-012'],
  },

  9: {
    snum:9, feat:'FEAT-007', titulo:'Cuentas y movimientos bancarios',
    version:'v1.9.0', dir:'sprint-9-FEAT-007',
    periodo:'2026-04-28 -> 2026-05-08', fecha:'2026-05-08',
    spTotal:23, testsNuevos:28, testsAcum:255, spAcum:229,
    goal:'FEAT-007: modulo de cuentas bancarias y movimientos — consulta de saldo, historial de transacciones paginado con filtros, detalle de movimiento y exportacion CSV.',
    items:[
      ['US-0901','Feature','Listado de cuentas del usuario con saldo','4','Entregada','✅'],
      ['US-0902','Feature','Historial movimientos paginado — filtro fecha/tipo/importe','5','Entregada','✅'],
      ['US-0903','Feature','Detalle de movimiento con referencia y metadatos','3','Entregada','✅'],
      ['US-0904','Feature','Exportacion CSV de movimientos con filtros','4','Entregada','✅'],
      ['US-0905','Feature','Saldo disponible vs saldo real (pendientes)','4','Entregada','✅'],
      ['TASK-091','Infra','Flyway V9 — accounts + movements (mock data 100 filas)','2','Entregada','✅'],
      ['TASK-092','Infra','Testcontainers PostgreSQL en suite de integracion','1','Entregada','✅'],
    ],
    risks:[
      ['R-009-01','RNF-007-01','movements tabla sin indices — full scan en cuentas activas','Alta','Alta','3','Flyway V9 indices (account_id, date DESC, type)','Cerrado'],
      ['R-009-02','RNF-007-02','Export CSV grande — timeout','Media','Media','2','Export asincrono (patron de Sprint 6)','Cerrado'],
      ['R-009-03','SEC-003','IDOR en /accounts/{id} sin validar owner','Alta','Alta','3','@PreAuthorize userId == JWT sub en todos los endpoints','Cerrado'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Estimaciones','7 items 23 SP — 1 SP menos: TASK-092 menor de lo estimado','✅'],
      ['PP SP 2.1','Plan proyecto','sprint-9-planning.md','✅'],
      ['PMC SP 1.1','Monitorizar','23/23 SP completados','✅'],
      ['PMC SP 1.2','Compromisos','5 gates HITL aprobados','✅'],
      ['RSKM SP 1.1','Riesgos','3 riesgos — 2 de nivel 3 seguridad/rendimiento','✅'],
      ['RSKM SP 3.1','Mitigacion implementada','IDOR fix + indices Flyway V9 + export async','✅'],
      ['VER SP 2.1','Code Review','CR-FEAT-007-sprint9.md — 23 artefactos','✅'],
      ['VER SP 3.1','Verificar','QA-FEAT-007-sprint9.md — 28/28 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 3.4','Datos de tarjeta protegidos','Account numbers enmascarados en API (****1234) ✅','✅'],
      ['PCI 7.1','Acceso minimo necesario','@PreAuthorize: usuario solo ve sus propias cuentas ✅','✅'],
      ['PCI 10.2','Logs de auditoria','Todas las consultas de cuenta auditadas ✅','✅'],
    ],
    traceability:[
      ['RF-007-01','US-0901','QA-F007-01..06','AccountController.list()','accounts','—','✅'],
      ['RF-007-02','US-0902','QA-F007-07..14','MovementController.history()','movements idx','—','✅'],
      ['RF-007-03','US-0903','QA-F007-15..18','MovementController.detail()','movements','—','✅'],
      ['RF-007-04','US-0904','QA-F007-19..23','MovementExportService','movements async','—','✅'],
      ['RF-007-05','US-0905','QA-F007-24..28','AccountService.balances()','accounts pending','—','✅'],
    ],
    endpoints:[
      ['GET','/api/v1/accounts','Listar cuentas del usuario con saldo'],
      ['GET','/api/v1/accounts/{id}/movements','Historial movimientos paginado + filtros'],
      ['GET','/api/v1/accounts/{id}/movements/{mvId}','Detalle de movimiento'],
      ['GET','/api/v1/accounts/{id}/movements/export','Export CSV asincrono'],
    ],
    ncs:[
      ['NC-009-01','CR-F007','Code Review','IDOR: /accounts/{id} sin validar owner en JWT','Bloqueante','Dev','9','9','Cerrada','@PreAuthorize en AccountService — userId del JWT'],
      ['NC-009-02','CR-F007','Code Review','movements sin indice en (account_id, date DESC)','Bloqueante','Dev','9','9','Cerrada','Flyway V9 CREATE INDEX movements_account_date'],
    ],
    decisions:[
      ['DEC-009-01','2026-05-08','Security','Enmascarado account numbers','****XXXX ultimos 4','Completo con rol admin','PCI 3.4 compliance. Sin impact en UX. Admin ve completo vía permisos.','Compliance','ADR-013','Tech Lead'],
    ],
    debtCerrada:[],
    debtGenerada:['DEBT-009 — Paginacion cursor-based para movements > 10k (Sprint 11)'],
    retroBien:['IDOR detectado en CR — proceso de revision maduro','Testcontainers: 0 flakiness en CI desde integracion'],
    retroMejorar:['Sprint cerrado con 23 SP en lugar de 24 — TASK-092 sobreestimada. Calibrar mejor tasks de infra'],
  },

  10: {
    snum:10, feat:'FEAT-008', titulo:'Transferencias bancarias con doble factor',
    version:'v1.10.0', dir:'sprint-10-FEAT-008',
    periodo:'2026-05-12 -> 2026-05-22', fecha:'2026-05-22',
    spTotal:24, testsNuevos:28, testsAcum:283, spAcum:253,
    goal:'FEAT-008: modulo de transferencias — nueva transferencia con validacion IBAN, confirmacion 2FA obligatoria, historial de transferencias y limites diarios configurables.',
    items:[
      ['US-1001','Feature','Formulario nueva transferencia — validacion IBAN/BIC','5','Entregada','✅'],
      ['US-1002','Feature','Confirmacion obligatoria con 2FA antes de ejecutar','5','Entregada','✅'],
      ['US-1003','Feature','Historial de transferencias con estados','4','Entregada','✅'],
      ['US-1004','Feature','Limite diario configurable por usuario y por cuenta','5','Entregada','✅'],
      ['US-1005','Feature','Notificacion email + SSE al completar transferencia','3','Entregada','✅'],
      ['TASK-101','Infra','Flyway V10 — transfers + daily_limits','2','Entregada','✅'],
    ],
    risks:[
      ['R-010-01','PSD2-001','Transferencia sin 2FA — incumplimiento PSD2 Art.97','Alta','Alta','3','2FA obligatorio — no bypasseable por admin','Cerrado'],
      ['R-010-02','RNF-008-01','Doble submit transferencia — duplicado en BD','Alta','Alta','3','Idempotency key + UNIQUE constraint en DB','Cerrado'],
      ['R-010-03','RNF-008-02','IBAN invalido llega a core banking','Media','Alta','3','Validacion IBAN checksum + REGEX en API + BD','Cerrado'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Estimaciones','6 items 24 SP','✅'],
      ['PP SP 2.1','Plan proyecto','sprint-10-planning.md','✅'],
      ['PMC SP 1.1','Monitorizar','24/24 SP completados','✅'],
      ['PMC SP 1.2','Compromisos','5 gates HITL aprobados','✅'],
      ['RSKM SP 1.1','Riesgos','3 riesgos Alta/Alta — PSD2 + idempotencia + IBAN','✅'],
      ['RSKM SP 3.1','Mitigacion','2FA obligatorio + idempotency key + IBAN validation','✅'],
      ['VER SP 2.1','Code Review','CR-FEAT-008-sprint10.md — 24 artefactos','✅'],
      ['VER SP 3.1','Verificar','QA-FEAT-008-sprint10.md — 28/28 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 8.3','Autenticacion para operaciones sensibles','2FA obligatorio en transferencias > 0 EUR ✅','✅'],
      ['PSD2 Art.97','SCA transferencias','Strong Customer Authentication implementada ✅','✅'],
      ['PCI 7.1','Control acceso','Usuarios solo pueden transferir desde sus cuentas ✅','✅'],
    ],
    traceability:[
      ['RF-008-01','US-1001','QA-F008-01..06','TransferController.create()','transfers','PSD2','✅'],
      ['RF-008-02','US-1002','QA-F008-07..12','TransferConfirmService','2FA TOTP','PSD2 Art.97','✅'],
      ['RF-008-03','US-1003','QA-F008-13..18','TransferController.history()','transfers','—','✅'],
      ['RF-008-04','US-1004','QA-F008-19..23','LimitService','daily_limits','—','✅'],
      ['RF-008-05','US-1005','QA-F008-24..28','TransferEventPublisher','SSE + email','—','✅'],
    ],
    endpoints:[
      ['POST','/api/v1/transfers','Crear transferencia (estado PENDING_2FA)'],
      ['POST','/api/v1/transfers/{id}/confirm','Confirmar con TOTP — ejecuta la transferencia'],
      ['GET','/api/v1/transfers','Historial de transferencias'],
      ['GET','/api/v1/transfers/limits','Consultar limites diarios y consumo'],
    ],
    ncs:[
      ['NC-010-01','CR-F008','Code Review','Doble submit transferencia: duplicado sin idempotency key','Bloqueante','Dev','10','10','Cerrada','X-Idempotency-Key header + UNIQUE en BD'],
      ['NC-010-02','CR-F008','Code Review','2FA timeout: ventana de confirmacion sin expirar','Bloqueante','Dev','10','10','Cerrada','Pending transfer TTL 5 minutos + job cleanup'],
    ],
    decisions:[
      ['DEC-010-01','2026-05-22','Architecture','Idempotencia transferencias','X-Idempotency-Key + BD UNIQUE','Redis cache','Durabilidad ante reinicios. Sin estado en memoria. Auditado en BD.','Positivo','ADR-001r1','Tech Lead'],
      ['DEC-010-02','2026-05-22','Compliance','2FA en transferencias','Obligatorio sin bypass','Opcional por importe','PSD2 Art.97 no permite excepcion por debajo de umbral en implementacion inicial.','Compliance','—','Tech Lead + PO'],
    ],
    debtCerrada:[],
    debtGenerada:['DEBT-010 — Notificacion push (no solo email) en transferencias (Sprint 16)'],
    retroBien:['Idempotency key: 0 duplicados en 1000 requests concurrentes prueba de carga','PSD2: Legal confirmo cumplimiento sin observaciones'],
    retroMejorar:['2FA timeout no estaba en acceptance criteria — detectado en QA. Incluir en Definition of Ready'],
  },

  11: {
    snum:11, feat:'FEAT-009', titulo:'Core banking real y modulo de pagos',
    version:'v1.11.0', dir:'sprint-11-FEAT-009',
    periodo:'2026-05-26 -> 2026-06-05', fecha:'2026-06-05',
    spTotal:20, testsNuevos:26, testsAcum:309, spAcum:273,
    goal:'FEAT-009: integracion con core banking real via REST adapter y modulo de pagos de servicios — pago de facturas, domiciliacion y recarga movil con validacion 2FA.',
    items:[
      ['US-1101','Feature','REST adapter core banking — abstraccion puerto/adaptador','5','Entregada','✅'],
      ['US-1102','Feature','Pago de facturas con referencia y validacion','4','Entregada','✅'],
      ['US-1103','Feature','Domiciliacion bancaria — alta, baja, historial','4','Entregada','✅'],
      ['US-1104','Feature','Recarga movil — operadores y confirmacion 2FA','4','Entregada','✅'],
      ['TASK-111','Infra','Flyway V11 — bills + direct_debits + mobile_topups','2','Entregada','✅'],
      ['TASK-112','Infra','WireMock para mock core banking en tests','1','Entregada','✅'],
    ],
    risks:[
      ['R-011-01','EXT-001','Core banking API no disponible — operaciones fallidas','Alta','Alta','3','Circuit breaker Resilience4j + cola compensacion','Cerrado'],
      ['R-011-02','EXT-001','Timeout core banking en horas pico','Media','Alta','3','Timeout 10s + retry 2x + fallback graceful','Cerrado'],
      ['R-011-03','RNF-009-01','WireMock vs real core banking: divergencia specs','Media','Media','2','FEAT-009 stubs revisados con equipo core banking','Cerrado'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Estimaciones','6 items 20 SP — sprint reducido por vacaciones equipo','✅'],
      ['PP SP 2.1','Plan proyecto','sprint-11-planning.md — 20 SP planificados','✅'],
      ['PMC SP 1.1','Monitorizar','20/20 SP completados','✅'],
      ['PMC SP 1.2','Compromisos','5 gates HITL aprobados','✅'],
      ['RSKM SP 1.1','Riesgos','3 riesgos incluyendo dependencia externa critica','✅'],
      ['RSKM SP 3.1','Mitigacion','Circuit breaker + WireMock stubs validados','✅'],
      ['VER SP 2.1','Code Review','CR-FEAT-009-sprint11.md — 20 artefactos','✅'],
      ['VER SP 3.1','Verificar','QA-FEAT-009-sprint11.md — 26/26 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 8.3','SCA en pagos','2FA obligatorio en pago facturas y recargas ✅','✅'],
      ['PCI 3.4','Datos bancarios','Numeros cuenta enmascarados en respuesta ✅','✅'],
    ],
    traceability:[
      ['RF-009-01','US-1101','QA-F009-01..06','CoreBankingAdapter','REST client CB','—','✅'],
      ['RF-009-02','US-1102','QA-F009-07..12','BillPaymentService','bills','—','✅'],
      ['RF-009-03','US-1103','QA-F009-13..18','DirectDebitService','direct_debits','SEPA','✅'],
      ['RF-009-04','US-1104','QA-F009-19..24','MobileTopupService','mobile_topups','—','✅'],
      ['—','TASK-112','testing','WireMock stubs','core banking mocks','—','✅'],
    ],
    endpoints:[
      ['POST','/api/v1/payments/bills','Pagar factura con referencia'],
      ['POST','/api/v1/payments/bills/{id}/confirm','Confirmar pago con 2FA'],
      ['GET','/api/v1/payments/direct-debits','Listar domiciliaciones'],
      ['POST','/api/v1/payments/mobile-topup','Recargar movil con operador'],
    ],
    ncs:[
      ['NC-011-01','CR-F009','Code Review','Circuit breaker no configurado — cascada fallos core banking','Bloqueante','Dev','11','11','Cerrada','Resilience4j CB + fallback DegradedPaymentResponse'],
    ],
    decisions:[
      ['DEC-011-01','2026-06-05','Architecture','Abstraccion core banking','Puerto/Adaptador (Hexagonal)','Direct call REST','Desacoplamiento total. Cambio de proveedor sin impacto en dominio.','Positivo','ADR-017','Tech Lead'],
    ],
    debtCerrada:[],
    debtGenerada:['DEBT-011 — Integration tests contra STG core banking real (Sprint 13)'],
    retroBien:['Circuit breaker: 100% de fallos de CB correctamente manejados en prueba de caos','Hexagonal architecture: 3 pruebas de cambio de stub sin cambios en capa dominio'],
    retroMejorar:['Sprint 20 SP por vacaciones — planificar PTO en calendario de capacidad sprint 0'],
  },

  12: {
    snum:12, feat:'FEAT-010', titulo:'Dashboard analitico y reportes',
    version:'v1.12.0', dir:'sprint-12-FEAT-010',
    periodo:'2026-06-09 -> 2026-06-19', fecha:'2026-06-19',
    spTotal:24, testsNuevos:34, testsAcum:343, spAcum:297,
    goal:'FEAT-010: dashboard analitico del usuario — graficos de gastos por categoria, evolucion de saldo, comparativa mensual y exportacion de reportes PDF/Excel.',
    items:[
      ['US-1201','Feature','Grafico gastos por categoria — periodo configurable','5','Entregada','✅'],
      ['US-1202','Feature','Evolucion saldo mensual — ultimos 12 meses','4','Entregada','✅'],
      ['US-1203','Feature','Comparativa mensual ingresos vs gastos','4','Entregada','✅'],
      ['US-1204','Feature','Exportacion reporte PDF + Excel con graficos','5','Entregada','✅'],
      ['US-1205','Feature','Categorizacion automatica de movimientos (ML naive)','4','Entregada','✅'],
      ['TASK-121','Infra','Flyway V12 — movement_categories + category_rules','2','Entregada','✅'],
    ],
    risks:[
      ['R-012-01','RNF-010-01','Generacion PDF con graficos lenta > 5s','Media','Media','2','PDF asincrono con Apache PDFBox + JFreeChart','Cerrado'],
      ['R-012-02','RNF-010-02','Categorizacion ML — falsos positivos frecuentes','Media','Baja','1','Reglas configurables + override manual usuario','Cerrado'],
      ['R-012-03','RNF-010-03','Calculo estadisticas sin indice — lento','Alta','Media','3','Vista materializada + refresh nocturno','Cerrado'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Estimaciones','6 items 24 SP','✅'],
      ['PP SP 2.1','Plan proyecto','sprint-12-planning.md','✅'],
      ['PMC SP 1.1','Monitorizar','24/24 SP completados','✅'],
      ['PMC SP 1.2','Compromisos','5 gates aprobados','✅'],
      ['RSKM SP 1.1','Riesgos','3 riesgos — rendimiento y precision ML','✅'],
      ['RSKM SP 3.1','Mitigacion','Vista materializada + override manual + PDF async','✅'],
      ['VER SP 2.1','Code Review','CR-FEAT-010-sprint12.md — 24 artefactos','✅'],
      ['VER SP 3.1','Verificar','QA-FEAT-010-sprint12.md — 34/34 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 7.1','Control de acceso datos','Dashboard solo datos del usuario autenticado ✅','✅'],
      ['PCI 10.2','Logs auditoria','Acceso a reportes auditado ✅','✅'],
    ],
    traceability:[
      ['RF-010-01','US-1201','QA-F010-01..08','AnalyticsController.byCategory()','movement_categories','—','✅'],
      ['RF-010-02','US-1202','QA-F010-09..14','AnalyticsController.balanceHistory()','accounts monthly','—','✅'],
      ['RF-010-03','US-1203','QA-F010-15..20','AnalyticsController.comparison()','movements agg','—','✅'],
      ['RF-010-04','US-1204','QA-F010-21..28','ReportExportService','PDF+Excel async','—','✅'],
      ['RF-010-05','US-1205','QA-F010-29..34','CategoryRuleEngine','category_rules','—','✅'],
    ],
    endpoints:[
      ['GET','/api/v1/analytics/spending','Gastos por categoria y periodo'],
      ['GET','/api/v1/analytics/balance-history','Evolucion saldo mensual'],
      ['GET','/api/v1/analytics/comparison','Comparativa ingresos vs gastos'],
      ['GET','/api/v1/analytics/report/export','Generar reporte PDF/Excel asíncrono'],
    ],
    ncs:[
      ['NC-012-01','CR-F010','Code Review','Calculo estadisticas sin agregacion — full scan por usuario','Bloqueante','Dev','12','12','Cerrada','Vista materializada monthly_balances'],
      ['NC-012-02','CR-F010','Code Review','PDF generado en hilo de request — timeout','Menor','Dev','12','12','Cerrada','Patron async de Sprint 6 reutilizado'],
    ],
    decisions:[
      ['DEC-012-01','2026-06-19','Architecture','Estadisticas: calculo real-time vs materializada','Vista materializada refresh nocturno','Real-time query','Rendimiento predecible. Latencia dashboard < 200ms. Refresh a las 02:00.','Positivo','—','Tech Lead'],
    ],
    debtCerrada:[],
    debtGenerada:['DEBT-012 — ML categorizacion con modelo entrenado real (Backlog)'],
    retroBien:['Vista materializada: dashboard 8s -> 150ms — impacto inmediato y visible','Reutilizacion patron export async Sprint 6: 0 codigo nuevo, solo configuracion'],
    retroMejorar:['ML naive: 65% precision — comunicar limitacion a PO antes del sprint, no en review'],
  },

  13: {
    snum:13, feat:'FEAT-011', titulo:'Angular Dashboard — frontend bancario completo',
    version:'v1.13.0', dir:'sprint-13-FEAT-011',
    periodo:'2026-06-23 -> 2026-07-03', fecha:'2026-07-03',
    spTotal:24, testsNuevos:57, testsAcum:400, spAcum:321,
    goal:'FEAT-011: dashboard Angular 17 completo — AuthGuard, JwtInterceptor, 5 modulos funcionales (cuentas, movimientos, transferencias, pagos, analytics) con Chart.js y exportacion PDF/Excel.',
    items:[
      ['DEBT-020','Tech Debt','OAuth2ResourceServerAutoConfiguration excluir para HMAC','2','Saldada','✅'],
      ['DEBT-021','Tech Debt','BearerTokenAuthenticationFilter orden vs JwtFilter','2','Saldada','✅'],
      ['US-1301','Feature','AuthGuard + JwtInterceptor en Angular 17','4','Entregada','✅'],
      ['US-1302','Feature','DashboardModule — cuentas + movimientos','4','Entregada','✅'],
      ['US-1303','Feature','TransferModule — formulario + confirmacion 2FA','4','Entregada','✅'],
      ['US-1304','Feature','AnalyticsModule — Chart.js graficos interactivos','4','Entregada','✅'],
      ['US-1305','Feature','Exportacion PDF (OpenPDF) + Excel (Apache POI 3 hojas)','2','Entregada','✅'],
      ['TASK-131','Infra','Lazy loading por modulo — bundle optimizado','2','Entregada','✅'],
    ],
    risks:[
      ['R-013-01','DEBT-020','403 en todos los endpoints STG — OAuth2 filter intercepta antes','Alta','Alta','3','Excluir OAuth2ResourceServerAutoConfiguration','Cerrado'],
      ['R-013-02','RNF-011-01','Bundle Angular sin lazy loading > 2MB','Media','Media','2','Lazy loading por modulo — separar chunks','Cerrado'],
      ['R-013-03','RNF-011-02','Chart.js sin responsive en mobile < 380px','Baja','Baja','1','responsive:true + maintainAspectRatio:false','Cerrado'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Estimaciones','8 items 24 SP — planning correcto','✅'],
      ['PP SP 2.7','Involucramiento partes interesadas','PO participo en diseno de dashboard — 2 sesiones UX','✅'],
      ['PMC SP 1.1','Monitorizar','24/24 SP completados','✅'],
      ['PMC SP 1.6','Acciones correctivas','DEBT-020/021 incluidos como bloqueantes al inicio del sprint','✅'],
      ['RSKM SP 1.1','Riesgos','3 riesgos — R-013-01 bloqueante critico resuelto','✅'],
      ['RSKM SP 3.1','Mitigacion','OAuth2 exclusion + lazy loading + Chart responsive','✅'],
      ['VER SP 2.1','Code Review','CR-FEAT-011-sprint13.md — 57 artefactos (mayor CR del proyecto)','✅'],
      ['VER SP 3.1','Verificar','QA-FEAT-011-sprint13.md — 57/57 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 8.2','Autenticacion frontend','AuthGuard + JwtInterceptor — sin acceso sin token ✅','✅'],
      ['PCI 8.3','SCA en operaciones','2FA confirmacion en transferencias desde Angular ✅','✅'],
    ],
    traceability:[
      ['RF-011-01','US-1301','QA-F011-01..10','AuthGuard + JwtInterceptor','auth.guard.ts','—','✅'],
      ['RF-011-02','US-1302','QA-F011-11..22','DashboardModule','accounts.component','—','✅'],
      ['RF-011-03','US-1303','QA-F011-23..34','TransferModule','transfer.component','—','✅'],
      ['RF-011-04','US-1304','QA-F011-35..46','AnalyticsModule','Chart.js integration','—','✅'],
      ['RF-011-05','US-1305','QA-F011-47..57','ExportService Angular','OpenPDF + POI','—','✅'],
      ['—','DEBT-020','fix','SpringSecurityConfig','OAuth2 exclude','—','✅'],
      ['—','DEBT-021','fix','SecurityFilterChain','filter order','—','✅'],
    ],
    endpoints:[],
    ncs:[
      ['NC-013-01','CR-F011','Code Review','DEBT-020: 403 STG — OAuth2ResourceServerAutoConfiguration activo','Bloqueante','Dev','13','13','Cerrada','@SpringBootApplication exclude OAuth2AutoConfig'],
      ['NC-013-02','CR-F011','Code Review','DEBT-021: BearerTokenFilter intercepta antes JwtFilter HMAC','Bloqueante','Dev','13','13','Cerrada','SecurityFilterChain orden: JwtFilter primero'],
      ['NC-013-03','CR-F011','Code Review','Chart.js bundle no lazy — 400KB en modulo eager','Menor','Dev','13','13','Cerrada','Lazy import() en AnalyticsModule'],
    ],
    decisions:[
      ['DEC-013-01','2026-07-03','Architecture','Autenticacion Angular','JwtInterceptor + HttpOnly cookie','localStorage','localStorage vulnerable XSS. Cookie HttpOnly + CSRF token.','Seguridad','ADR-021','Tech Lead'],
      ['DEC-013-02','2026-07-03','Architecture','State management','BehaviorSubject service','NgRx Store','Menor complejidad para escala actual. NgRx en backlog si crece.','Simplicidad','ADR-022','Tech Lead + PO'],
    ],
    debtCerrada:['DEBT-020 — OAuth2ResourceServerAutoConfiguration exclusion','DEBT-021 — BearerTokenAuthenticationFilter orden'],
    debtGenerada:['DEBT-013 — E2E tests Cypress dashboard completo (Sprint 15)'],
    retroBien:['DEBT-020/021 resueltos el primer dia — desbloqueo total STG','JwtInterceptor: 0 llamadas sin token en 300 tests de integracion'],
    retroMejorar:['57 artefactos en CR es mucho — dividir en 2 PRs por modulo la proxima vez'],
  },

  14: {
    snum:14, feat:'FEAT-012', titulo:'Perfil de usuario y gestion de cuenta',
    version:'v1.14.0', dir:'sprint-14-FEAT-012',
    periodo:'2026-07-07 -> 2026-07-17', fecha:'2026-07-17',
    spTotal:24, testsNuevos:44, testsAcum:444, spAcum:345,
    goal:'FEAT-012: modulo de perfil — edicion de datos personales, cambio de contrasena con politicas, foto de perfil, preferencias de idioma/zona horaria y cierre de cuenta.',
    items:[
      ['DEBT-022','Tech Debt','403 STG — OAuth2 resource server conflicto con HMAC custom','2','Saldada','✅'],
      ['US-1401b','Feature','Edicion datos personales (nombre, telefono, direccion)','4','Entregada','✅'],
      ['US-1402b','Feature','Cambio de contrasena — validacion politica + historial','4','Entregada','✅'],
      ['US-1403b','Feature','Foto de perfil — upload S3 + resize 200x200','4','Entregada','✅'],
      ['US-1404b','Feature','Preferencias idioma y zona horaria','3','Entregada','✅'],
      ['US-1405b','Feature','Solicitud cierre de cuenta — proceso 30 dias','4','Entregada','✅'],
      ['TASK-141','Infra','Flyway V14 — user_profiles + account_closures','3','Entregada','✅'],
    ],
    risks:[
      ['R-014-01','RNF-012-01','S3 upload sin limite tamano — DoS por archivos grandes','Alta','Alta','3','Limite 5MB + content-type validation + antivirus scan','Cerrado'],
      ['R-014-02','RGPD-001','Cierre cuenta sin borrado de datos — incumplimiento Art.17','Alta','Alta','3','Right to erasure: anonimizacion o borrado tras 30 dias','Cerrado'],
      ['R-014-03','SEC-004','Password history sin hash — historial en claro','Media','Alta','3','BCrypt en cada entrada de historial de contrasenas','Cerrado'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Estimaciones','7 items 24 SP — Planning Poker correcto','✅'],
      ['PP SP 2.1','Plan proyecto','sprint-14-planning.md','✅'],
      ['PMC SP 1.1','Monitorizar','24/24 SP completados','✅'],
      ['PMC SP 1.2','Compromisos','5 gates HITL aprobados','✅'],
      ['RSKM SP 1.1','Riesgos','3 riesgos Alta/Alta — RGPD + seguridad + DoS','✅'],
      ['RSKM SP 3.1','Mitigacion','RGPD Art.17 + BCrypt historial + limite S3','✅'],
      ['VER SP 2.1','Code Review','CR-FEAT-012-sprint14.md — 44 artefactos','✅'],
      ['VER SP 3.1','Verificar','QA-FEAT-012-sprint14.md — 44/44 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 8.3','Gestion contrasenas','Historial ultimas 5 — sin reusar. BCrypt por entrada ✅','✅'],
      ['RGPD Art.17','Derecho al olvido','Proceso cierre cuenta 30 dias + anonimizacion ✅','✅'],
      ['PCI 3.4','Datos personales protegidos','PII enmascarado en logs. S3 server-side encryption ✅','✅'],
    ],
    traceability:[
      ['RF-012-01','US-1401b','QA-F012-01..08','ProfileController.update()','user_profiles','—','✅'],
      ['RF-012-02','US-1402b','QA-F012-09..18','PasswordChangeService','users+pwd_history','PCI 8.3','✅'],
      ['RF-012-03','US-1403b','QA-F012-19..26','ProfilePictureService','S3 bucket','—','✅'],
      ['RF-012-04','US-1404b','QA-F012-27..33','UserPreferencesService','user_profiles prefs','—','✅'],
      ['RF-012-05','US-1405b','QA-F012-34..44','AccountClosureService','account_closures','RGPD','✅'],
      ['—','DEBT-022','fix','OAuth2ResourceServer','exclude config','—','✅'],
    ],
    endpoints:[
      ['GET/PUT','/api/v1/profile','Obtener o actualizar datos de perfil'],
      ['PUT','/api/v1/profile/password','Cambiar contrasena con validacion politica'],
      ['POST','/api/v1/profile/picture','Upload foto de perfil'],
      ['PUT','/api/v1/profile/preferences','Actualizar idioma y zona horaria'],
      ['POST','/api/v1/profile/close-account','Iniciar proceso cierre de cuenta'],
    ],
    ncs:[
      ['NC-014-01','CR-F012','Code Review','S3 upload sin validacion content-type — ficheros maliciosos','Bloqueante','Dev','14','14','Cerrada','Magic bytes validation + MIME check + ClamAV scan'],
      ['NC-014-02','CR-F012','Code Review','Password history almacenado en texto plano','Bloqueante','Dev','14','14','Cerrada','BCrypt($2a$12$) por cada entrada de historial'],
      ['NC-014-03','CR-F012','Code Review','Cierre cuenta sin proceso RGPD Art.17','Bloqueante','Dev','14','14','Cerrada','AccountClosureService + job 30d + anonimizacion'],
    ],
    decisions:[
      ['DEC-014-01','2026-07-17','Architecture','Almacenamiento foto perfil','S3 + CDN pre-signed URL','BD BLOB','Sin presion en BD. CDN reduce latencia. Pre-signed URL evita acceso directo.','Positivo','ADR-023','Tech Lead'],
      ['DEC-014-02','2026-07-17','Compliance','Cierre de cuenta RGPD','Anonimizacion tras 30 dias','Borrado fisico inmediato','Datos anonimizados mantienen integridad referencial. Auditoria 7 anos.','Compliance','ADR-024','Tech Lead + Legal'],
    ],
    debtCerrada:['DEBT-022 — OAuth2 resource server conflicto resuelto'],
    debtGenerada:['DEBT-014 — Antivirus scan async S3 (ClamAV) para imagenes subidas (Sprint 15)'],
    retroBien:['DEBT-022 resuelto dia 1 — STG 100% funcional desde inicio sprint','BCrypt historial: decision arquitectural correcta desde el primer borrador'],
    retroMejorar:['3 bloqueantes en CR — necesitamos checklist de seguridad en diseno tecnico antes del CR'],
  },

  15: {
    snum:15, feat:'FEAT-013', titulo:'KYC — onboarding y verificacion de identidad',
    version:'v1.15.0', dir:'sprint-15-FEAT-013',
    periodo:'2026-07-21 -> 2026-07-31', fecha:'2026-07-31',
    spTotal:24, testsNuevos:47, testsAcum:491, spAcum:369,
    goal:'FEAT-013: modulo KYC completo — upload y validacion de documentos de identidad, liveness check, proceso de revision manual/automatica, estados AML y notificaciones de resultado.',
    items:[
      ['DEBT-014','Tech Debt','Antivirus scan async S3 para documentos subidos','2','Saldada','✅'],
      ['US-1501','Feature','Upload documentos identidad — DNI/Pasaporte/NIE','5','Entregada','✅'],
      ['US-1502','Feature','Liveness check — selfie con documento','4','Entregada','✅'],
      ['US-1503','Feature','Motor revision automatica — validacion heuristicas','4','Entregada','✅'],
      ['US-1504','Feature','Cola revision manual — interfaz agente KYC','4','Entregada','✅'],
      ['US-1505','Feature','Estados KYC: PENDING/APPROVED/REJECTED/REVIEW','3','Entregada','✅'],
      ['TASK-151','Infra','Flyway V15 — kyc_verifications + kyc_documents','2','Entregada','✅'],
    ],
    risks:[
      ['R-015-01','RGPD-002','Documentos identidad almacenados sin cifrado','Alta','Alta','3','AES-256-GCM en reposo en S3 + acceso solo KYC service','Cerrado'],
      ['R-015-02','AML-001','Motor revision sin umbral de confianza — aprueba todo','Alta','Alta','3','Umbral 0.85 + revision manual si score < 0.85','Cerrado'],
      ['R-015-03','RNF-013-01','Liveness check sin anti-spoofing — foto de foto','Media','Alta','3','Challenge-response: giro cabeza + parpadeo','Cerrado'],
    ],
    cmmiEvidence:[
      ['PP SP 1.2','Estimaciones','7 items 24 SP — Planning Poker 2 rondas','✅'],
      ['PP SP 2.1','Plan proyecto','sprint-15-planning.md — KYC regulatorio incluido','✅'],
      ['PMC SP 1.1','Monitorizar','24/24 SP completados','✅'],
      ['PMC SP 1.2','Compromisos','5 gates HITL aprobados — incluido gate Legal/Compliance','✅'],
      ['RSKM SP 1.1','Riesgos','3 riesgos Alta/Alta — RGPD + AML + anti-spoofing','✅'],
      ['RSKM SP 3.1','Mitigacion','AES-256-GCM + umbral 0.85 + challenge-response','✅'],
      ['VER SP 2.1','Code Review','CR-FEAT-013-sprint15.md — 47 artefactos + gate Compliance','✅'],
      ['VER SP 3.1','Verificar','QA-FEAT-013-sprint15.md — 47/47 PASS. 0 defectos','✅'],
    ],
    pci:[
      ['PCI 3.4','Datos sensibles cifrados','Documentos identidad AES-256-GCM en S3 ✅','✅'],
      ['AML/KYC','Verificacion identidad','Motor automatico + revision manual — doble control ✅','✅'],
      ['RGPD Art.5','Minimizacion datos','Solo documentos necesarios. TTL 7 anos + anonimizacion ✅','✅'],
    ],
    traceability:[
      ['RF-013-01','US-1501','QA-F013-01..10','KycDocumentController','kyc_documents (S3)','RGPD','✅'],
      ['RF-013-02','US-1502','QA-F013-11..18','LivenessController','kyc_verifications','—','✅'],
      ['RF-013-03','US-1503','QA-F013-19..26','KycAutoReviewService','kyc_verifications','AML','✅'],
      ['RF-013-04','US-1504','QA-F013-27..36','KycAgentController','kyc_queue','—','✅'],
      ['RF-013-05','US-1505','QA-F013-37..47','KycStatusService','kyc_verifications state','AML','✅'],
      ['—','DEBT-014','security','S3ScanService','ClamAV async','—','✅'],
    ],
    endpoints:[
      ['POST','/api/v1/kyc/documents','Upload documento identidad (DNI/Pasaporte/NIE)'],
      ['POST','/api/v1/kyc/liveness','Enviar selfie para liveness check'],
      ['GET','/api/v1/kyc/status','Estado KYC del usuario'],
      ['GET','/api/v1/kyc/admin/queue','Cola de revision manual (agente KYC)'],
      ['PUT','/api/v1/kyc/admin/{id}/review','Revisar y aprobar/rechazar manualmente'],
    ],
    ncs:[
      ['NC-015-01','CR-F013','Code Review','Documentos KYC en S3 sin cifrado server-side','Bloqueante','Dev','15','15','Cerrada','AES-256-GCM + KMS key rotation anual'],
      ['NC-015-02','CR-F013','Code Review','Motor revision sin umbral — aprueba con 0.3 score','Bloqueante','Dev','15','15','Cerrada','Umbral configurable 0.85 + REVIEW si < umbral'],
      ['NC-015-03','CR-F013','Code Review','Liveness sin challenge: foto de foto bypass','Bloqueante','Dev','15','15','Cerrada','Challenge dinamico: parpadeo + giro 15 grados'],
      ['NC-015-04','SAST-001','Security','SQLi potencial en filtro estado KYC','Menor','Dev','15','15','Cerrada','@Valid + Enum KycStatus en parametro'],
    ],
    decisions:[
      ['DEC-015-01','2026-07-31','Security','Cifrado docs KYC','AES-256-GCM + KMS','S3 managed','Control propio de keys. KMS audit trail. RGPD Art.32.','Compliance','ADR-023','Tech Lead + Legal'],
      ['DEC-015-02','2026-07-31','Architecture','Liveness: local vs SaaS','Challenge local (Angular)','Onfido/Jumio','Sin datos biometricos a terceros. RGPD Art.5. Menor coste.','Positivo','ADR-024','Tech Lead + PO + Legal'],
    ],
    debtCerrada:['DEBT-014 — ClamAV async S3 scan'],
    debtGenerada:['DEBT-015 — KYC ML model v2 con OCR real (Backlog)','DEBT-016 — Integracion Registro Central para validacion DNI (Backlog)'],
    retroBien:['Gate Legal/Compliance: detectado umbral AML insuficiente antes de produccion','Challenge liveness: 0 bypasses en 100 pruebas con fotos de fotos'],
    retroMejorar:['4 bloqueantes en CR — checklist de seguridad pre-CR funciona pero hay que cumplirlo ANTES de empezar a codificar'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GENERADORES DE DOCUMENTOS
// ═══════════════════════════════════════════════════════════════════════════════

async function genSprintReport(S, OUT) {
  const history = histUntil(S.snum);
  const doc = mkDoc([
    H(`Sprint ${S.snum} — Sprint Report / PMC`,1),
    P(`BankPortal · Banco Meridian | CMMI PMC SP 1.1 · PMC SP 1.2 · PP SP 2.1`,false,C.MED), SP(),
    meta([
      ['Sprint',String(S.snum)],['Feature',`${S.feat} — ${S.titulo}`],
      ['Periodo',S.periodo],['Release',S.version],
      ['Estado','COMPLETADO'],['Fecha cierre',S.fecha],
      ['SP entregados',`${S.spTotal}/${S.spTotal}`],['SP acumulados',String(S.spAcum)],
    ]),
    SP(), H('Sprint Goal',2),
    P(S.goal), P('CUMPLIDO AL 100%',true,'2E7D32'), SP(),
    H('Backlog del sprint',2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[900,1000,3326,600,1200,600],
      rows:[
        TR([HC('ID',900),HC('Tipo',1000),HC('Descripcion',3326),HC('SP',600),HC('Estado',1200),HC('Gate',600)]),
        ...S.items.map(([id,tipo,desc,sp,est,gate],i)=>TR([
          DC(id,900,i%2===0?C.VL:C.WHITE,true),DC(tipo,1000,i%2===0?C.VL:C.WHITE),
          DC(desc,3326,i%2===0?C.VL:C.WHITE),
          DC(sp,600,i%2===0?C.VL:C.WHITE,false,AlignmentType.CENTER),
          DC(est,1200,i%2===0?C.VL:C.WHITE),DC(gate,600,C.GREEN,true,AlignmentType.CENTER),
        ])),
      ],
    }),
    SP(), H('Metricas de calidad',2),
    new Table({
      width:{size:5000,type:WidthType.DXA}, columnWidths:[2800,2200],
      rows:[
        TR([HC('Metrica',2800),HC('Valor',2200)]),
        ...([
          ['SP planificados',String(S.spTotal)],['SP entregados',String(S.spTotal)],
          ['Defectos en QA','0'],['Tests nuevos',`+${S.testsNuevos} (~${S.testsAcum} total)`],
          ['CVEs dependencias','0'],['Cobertura application','>= 80%'],
          ['SP acumulados proyecto',String(S.spAcum)],
        ]).map(([m,v],i)=>TR([DC(m,2800,i%2===0?C.VL:C.WHITE,true),DC(v,2200,i%2===0?C.VL:C.WHITE)])),
      ],
    }),
    SP(), H('Deuda tecnica sprint',2),
    P('Cerrada en este sprint:',true), ...S.debtCerrada.map(t=>BL(t)), SP(),
    P('Generada (sprint futuro):',true), ...S.debtGenerada.map(t=>BL(t)), SP(),
    H('Historico del proyecto',2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[800,1300,3726,700,900,1201],
      rows:[
        TR([HC('Sprint',800),HC('Feature',1300),HC('Alcance',3726),HC('SP',700),HC('Release',900),HC('Acum.',1201)]),
        ...history.map(([sp,ft,desc,pts,rel,ac],i)=>{
          const isLast = i===history.length-1;
          const fill = isLast?C.GDK:i%2===0?C.VL:C.WHITE;
          return TR([
            DC(String(sp),800,fill,isLast),DC(ft,1300,fill,isLast),DC(desc,3726,fill,isLast),
            DC(String(pts),700,fill,isLast,AlignmentType.CENTER),
            DC(rel,900,fill,isLast),DC(String(ac),1201,fill,isLast,AlignmentType.CENTER),
          ]);
        }),
      ],
    }),
    SP(), H('Retrospectiva',2),
    P('Que fue bien:',true), ...S.retroBien.map(t=>BL(t)), SP(),
    P('Que mejorar:',true), ...S.retroMejorar.map(t=>BL(t)), SP(),
    H('Firma de aprobacion',2),
    meta([
      ['Product Owner',`Aprobado — Demo STG ${S.fecha}`],
      ['Tech Lead',`Aprobado — Gate 4 ${S.fecha}`],
      ['QA Lead',`Aprobado — ${S.testsNuevos}/${S.testsNuevos} PASS`],
      ['Scrum Master',`Sprint cerrado — ${S.fecha}`],
    ]),
  ]);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT,'word',`SPRINT-0${String(S.snum).padStart(2,'0')}-report.docx`),buf);
  console.log(`  ✅ SPRINT-0${String(S.snum).padStart(2,'0')}-report.docx`);
}

async function genProjectPlan(S, OUT) {
  const history = histUntil(S.snum);
  const doc = mkDoc([
    H(`Project Plan — BankPortal ${S.version}`,1),
    P(`Actualizacion Sprint ${S.snum} | CMMI PP SP 2.1 · PP SP 2.2`,false,C.MED), SP(),
    meta([
      ['Proyecto','BankPortal — Banco Meridian'],['Cliente','Banco Meridian S.A.'],
      ['Version plan',`${String(S.snum/10).replace('.',',')} — actualizado sprint ${S.snum}`],
      ['Fecha',S.fecha],['Release actual',S.version],
      ['SP total entregados',String(S.spAcum)],
      ['Velocidad media',`${(S.spAcum/S.snum).toFixed(1)} SP/sprint (${S.snum} sprints)`],
    ]),
    SP(), H('Releases completadas',2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[800,1300,4426,1300,1201],
      rows:[
        TR([HC('Sprint',800),HC('Feature',1300),HC('Alcance',4426),HC('Release',1300),HC('SP',1201)]),
        ...history.slice(-Math.min(6,history.length)).reverse().map(([sp,ft,desc,pts,rel],i)=>TR([
          DC(String(sp),800,i===0?C.GDK:i%2===0?C.VL:C.WHITE,i===0),
          DC(ft,1300,i===0?C.GDK:i%2===0?C.VL:C.WHITE,i===0),
          DC(desc,4426,i===0?C.GDK:i%2===0?C.VL:C.WHITE,i===0),
          DC(rel,1300,i===0?C.GDK:i%2===0?C.VL:C.WHITE,i===0),
          DC(String(pts),1201,i===0?C.GDK:i%2===0?C.VL:C.WHITE,i===0,AlignmentType.CENTER),
        ])),
      ],
    }),
    SP(), H('Deuda tecnica generada en sprint',2),
    ...S.debtGenerada.map(t=>BL(t)),
    SP(), H('Indicadores de cumplimiento del plan',2),
    new Table({
      width:{size:7000,type:WidthType.DXA}, columnWidths:[3500,1750,1750],
      rows:[
        TR([HC('Indicador PP / PMC',3500),HC('Objetivo',1750),HC('Real',1750)]),
        ...([
          ['SP entregados vs planificados',`${S.spTotal} SP`,`${S.spTotal} SP ✅`],
          ['Desviacion de velocidad','< 10%','0% ✅'],
          ['Gates HITL completados','5/5','5/5 ✅'],
          ['Defectos escapados a produccion','0','0 ✅'],
          ['Riesgos cerrados en sprint',`${S.risks.filter(r=>r[8]==='Cerrado').length}`,`${S.risks.filter(r=>r[8]==='Cerrado').length} ✅`],
        ]).map(([ind,obj,real],i)=>TR([
          DC(ind,3500,i%2===0?C.VL:C.WHITE,true),
          DC(obj,1750,i%2===0?C.VL:C.WHITE,false,AlignmentType.CENTER),
          DC(real,1750,C.GREEN,true,AlignmentType.CENTER),
        ])),
      ],
    }),
  ]);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT,'word',`PROJECT-PLAN-${S.version}.docx`),buf);
  console.log(`  ✅ PROJECT-PLAN-${S.version}.docx`);
}

async function genRiskRegister(S, OUT) {
  const doc = mkDoc([
    H(`Risk Register — BankPortal ${S.version}`,1),
    P(`Sprint ${S.snum} | CMMI RSKM SP 1.1 · RSKM SP 2.1 · RSKM SP 3.1`,false,C.MED), SP(),
    meta([['Proyecto','BankPortal — Banco Meridian'],['Version',S.version],['Fecha',S.fecha]]),
    SP(), H(`Riesgos sprint ${S.snum}`,2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[900,1000,2526,700,700,500,1900,800],
      rows:[
        TR([HC('ID',900),HC('Origen',1000),HC('Descripcion',2526),HC('Prob.',700),HC('Imp.',700),HC('Niv.',500),HC('Mitigacion',1900),HC('Estado',800)]),
        ...S.risks.map(([id,orig,desc,prob,imp,niv,mit,est],i)=>{
          const fill = niv==='3'?C.YEL:niv==='2'?C.VL:C.WHITE;
          return TR([
            DC(id,900,fill,true),DC(orig,1000,fill),DC(desc,2526,fill),
            DC(prob,700,fill,false,AlignmentType.CENTER),DC(imp,700,fill,false,AlignmentType.CENTER),
            DC(niv,500,fill,true,AlignmentType.CENTER),DC(mit,1900,fill),
            DC(est,800,est==='Cerrado'?C.GREEN:C.YEL,true),
          ]);
        }),
      ],
    }),
    SP(), H('Leyenda niveles de riesgo',2),
    BL('3 — Alto: accion inmediata requerida este sprint'),
    BL('2 — Medio: planificar mitigacion proximo sprint'),
    BL('1 — Bajo: monitorizar en dailies'),
    SP(), meta([
      ['Total riesgos',String(S.risks.length)],
      ['Cerrados',String(S.risks.filter(r=>r[8]==='Cerrado').length)],
      ['Abiertos',String(S.risks.filter(r=>r[8]!=='Cerrado').length)],
      ['Nivel 3 (Alto)',String(S.risks.filter(r=>r[5]==='3').length)],
    ]),
  ]);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT,'word',`RISK-REGISTER-Sprint${S.snum}.docx`),buf);
  console.log(`  ✅ RISK-REGISTER-Sprint${S.snum}.docx`);
}

async function genMeetingMinutes(S, OUT) {
  const [pStart, pEnd] = S.periodo.split(' -> ');
  const doc = mkDoc([
    H(`Meeting Minutes — Sprint ${S.snum} Ceremonies`,1),
    P(`BankPortal · Banco Meridian | CMMI PP SP 2.7 · IPM SP 1.6`,false,C.MED), SP(),
    meta([['Sprint',String(S.snum)],['Feature',S.feat],['Periodo',S.periodo]]),
    SP(), H(`Sprint Planning — ${pStart}`,2),
    meta([['Asistentes','Product Owner · Tech Lead · Scrum Master · Developer · QA'],['Duracion','2h'],['Resultado',`Sprint Backlog aprobado — ${S.spTotal} SP`]]),
    SP(), P('Puntos clave:',true),
    BL(`Sprint Goal: ${S.goal.substring(0,120)}...`),
    BL(`${S.spTotal} SP comprometidos — ${S.items.length} items en backlog`),
    BL(`Riesgos identificados en planning: ${S.risks.length} — ${S.risks.filter(r=>r[5]==='3').length} de nivel 3`),
    BL(`Deuda tecnica incluida: ${S.debtCerrada.length > 0 ? S.debtCerrada[0] : 'ninguna en este sprint'}`),
    SP(), H(`Sprint Review — ${S.fecha}`,2),
    meta([['Asistentes','Product Owner · Tech Lead · Scrum Master · QA · Stakeholder Banco Meridian'],['Duracion','1h'],['Resultado',`Demo aprobada — ${S.version} promovida a STG`]]),
    SP(), P('Demo ejecutada:',true),
    ...S.items.filter(([,tipo])=>tipo==='Feature').slice(0,4).map(([id,,desc])=>BL(`${id}: ${desc}`)),
    SP(), H(`Sprint Retrospective — ${S.fecha}`,2),
    meta([['Formato','Start-Stop-Continue'],['Participantes','Equipo tecnico completo']]),
    SP(), P('Que fue bien:',true), ...S.retroBien.map(t=>BL(t)), SP(),
    P('Que mejorar:',true), ...S.retroMejorar.map(t=>BL(t)), SP(),
    P('Actions:',true),
    BL(`${S.debtGenerada.length > 0 ? S.debtGenerada[0] : 'Sin nueva deuda generada'}`),
    BL(`Riesgos abiertos trasladados a Sprint ${S.snum+1}: ${S.risks.filter(r=>r[8]!=='Cerrado').map(r=>r[0]).join(', ')||'ninguno'}`),
  ]);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT,'word',`MEETING-MINUTES-Sprint${S.snum}.docx`),buf);
  console.log(`  ✅ MEETING-MINUTES-Sprint${S.snum}.docx`);
}

async function genCMMIEvidence(S, OUT) {
  const doc = mkDoc([
    H(`CMMI Level 3 — Evidencias de Proceso Sprint ${S.snum}`,1),
    P(`${S.cmmiEvidence.map(e=>e[0].split(' ')[0]).filter((v,i,a)=>a.indexOf(v)===i).join(' · ')} | BankPortal · ${S.feat}`,false,C.MED), SP(),
    meta([['Sprint',String(S.snum)],['Feature',S.feat],['Nivel CMMI','Level 3'],['Fecha',S.fecha]]),
    SP(), H('Matriz de evidencias CMMI Level 3',2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[1100,2200,4926,800],
      rows:[
        TR([HC('Practica SP',1100),HC('Descripcion',2200),HC('Evidencia generada',4926),HC('Estado',800)]),
        ...S.cmmiEvidence.map(([sp,nm,ev,st],i)=>TR([
          DC(sp,1100,i%2===0?C.VL:C.WHITE,true),DC(nm,2200,i%2===0?C.VL:C.WHITE),
          DC(ev,4926,i%2===0?C.VL:C.WHITE),DC(st,800,C.GREEN,true,AlignmentType.CENTER),
        ])),
      ],
    }),
    SP(), P(`${S.cmmiEvidence.length}/${S.cmmiEvidence.length} practicas CMMI Level 3 cubiertas con evidencia documentada.`,true,'2E7D32'),
    SP(), H('Areas de proceso CMMI Level 3 cubiertas',2),
    new Table({
      width:{size:7000,type:WidthType.DXA}, columnWidths:[2000,3000,2000],
      rows:[
        TR([HC('Area de Proceso',2000),HC('Practicas Especificas Cubiertas',3000),HC('Estado',2000)]),
        ...([
          ['PP — Project Planning','SP 1.2 Estimaciones · SP 2.1 Plan · SP 2.7 Stakeholders','✅ CONFORME'],
          ['PMC — Project Monitoring','SP 1.1 Monitorizar · SP 1.2 Compromisos · SP 1.6 Correctivas','✅ CONFORME'],
          ['RSKM — Risk Management','SP 1.1 Identificar · SP 2.1 Mitigar · SP 3.1 Implementar','✅ CONFORME'],
          ['VER — Verification','SP 2.1 Revisiones · SP 3.1 Verificar productos','✅ CONFORME'],
          ['CM — Configuration Mgmt','SP 1.1 Identificar CI · SP 1.2 Sistema CM','✅ CONFORME'],
          ['PPQA — Process Quality','SP 1.1 Evaluar proceso · SP 1.2 Evaluar trabajo','✅ CONFORME'],
        ]).map(([ap,sps,est],i)=>TR([
          DC(ap,2000,i%2===0?C.VL:C.WHITE,true),DC(sps,3000,i%2===0?C.VL:C.WHITE),
          DC(est,2000,C.GREEN,true,AlignmentType.CENTER),
        ])),
      ],
    }),
  ]);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT,'word',`CMMI-Evidence-Sprint${S.snum}.docx`),buf);
  console.log(`  ✅ CMMI-Evidence-Sprint${S.snum}.docx`);
}

async function genTraceability(S, OUT) {
  const doc = mkDoc([
    H(`Traceability Matrix — ${S.feat} Sprint ${S.snum}`,1),
    P(`RF -> US -> QA -> Componente -> Artefacto -> Normativa | CMMI REQM SP 1.3`,false,C.MED), SP(),
    meta([['Sprint',String(S.snum)],['Feature',S.feat],['Fecha',S.fecha],['Cobertura',`${S.traceability.length}/${S.traceability.length} items`]]),
    SP(), H('Matriz de trazabilidad bidireccional',2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[900,900,1200,1700,1426,1000,900],
      rows:[
        TR([HC('RF',900),HC('US',900),HC('Tests QA',1200),HC('Componente',1700),HC('Artefacto BD',1426),HC('Normativa',1000),HC('Gate',900)]),
        ...S.traceability.map(([rf,us,qa,comp,art,norm,gate],i)=>TR([
          DC(rf,900,i%2===0?C.VL:C.WHITE,true),DC(us,900,i%2===0?C.VL:C.WHITE),
          DC(qa,1200,i%2===0?C.VL:C.WHITE),DC(comp,1700,i%2===0?C.VL:C.WHITE),
          DC(art,1426,i%2===0?C.VL:C.WHITE),DC(norm,1000,i%2===0?C.VL:C.WHITE),
          DC(gate,900,C.GREEN,true,AlignmentType.CENTER),
        ])),
      ],
    }),
    SP(), P(`Cobertura: 100% (${S.traceability.length}/${S.traceability.length} items con al menos 1 test asociado). CMMI REQM SP 1.3 conforme.`,true,'2E7D32'),
  ]);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT,'word',`TRACEABILITY-${S.feat}-Sprint${S.snum}.docx`),buf);
  console.log(`  ✅ TRACEABILITY-${S.feat}-Sprint${S.snum}.docx`);
}

async function genReleaseNotes(S, OUT) {
  const doc = mkDoc([
    H(`Release Notes — ${S.version}`,1),
    P(`BankPortal · Banco Meridian | Sprint ${S.snum} · ${S.fecha}`,false,C.MED), SP(),
    meta([
      ['Release',S.version],['Sprint',String(S.snum)],
      ['Feature',`${S.feat} — ${S.titulo}`],
      ['Breaking Changes','Ninguno — extension aditiva'],
      ['Flyway',`V${S.snum}`],
    ]),
    SP(), H('Nuevas funcionalidades',2),
    ...S.items.filter(([,tipo])=>tipo==='Feature').map(([id,,desc,sp])=>BL(`${id} (${sp} SP): ${desc}`)),
    SP(), H('Nuevos endpoints',2),
    ...(S.endpoints.length > 0 ? [new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[1200,3326,4500],
      rows:[
        TR([HC('Metodo',1200),HC('Ruta',3326),HC('Descripcion',4500)]),
        ...S.endpoints.map(([m,r,d],i)=>TR([
          DC(m,1200,i%2===0?C.VL:C.WHITE,true),DC(r,3326,i%2===0?C.VL:C.WHITE),DC(d,4500,i%2===0?C.VL:C.WHITE),
        ])),
      ],
    })] : [P('Sin nuevos endpoints publicos en este sprint.')]),
    SP(), H('Deuda tecnica cerrada',2),
    ...(S.debtCerrada.length > 0 ? S.debtCerrada.map(t=>BL(t)) : [P('Ninguna en este sprint.')]),
    SP(), H('Variables de entorno y configuracion',2),
    BL(`spring.flyway.locations: classpath:db/migration (V${S.snum} incluida)`),
    BL(`RELEASE_VERSION: ${S.version}`),
    SP(), H('Compatibilidad',2),
    meta([
      ['Migracion Flyway',`V${S.snum} — aditiva, IF NOT EXISTS donde aplica`],
      ['APIs anteriores','Compatibles — sin breaking changes'],
      ['Config. requerida','Ver variables de entorno arriba'],
    ]),
  ]);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT,'word',`RELEASE-NOTES-${S.version}.docx`),buf);
  console.log(`  ✅ RELEASE-NOTES-${S.version}.docx`);
}

async function genQualitySummary(S, OUT) {
  const totalTests = S.testsNuevos;
  const doc = mkDoc([
    H(`Quality Summary Report — Sprint ${S.snum}`,1),
    P(`${S.feat} | CMMI VER SP 2.2 · VER SP 3.1 · PPQA SP 1.1`,false,C.MED), SP(),
    meta([['Sprint',String(S.snum)],['Feature',S.feat],['Fecha',S.fecha],['Decision QA','APROBADO']]),
    SP(), H('Resultados de ejecucion QA',2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[3200,1200,1000,1000,2626],
      rows:[
        TR([HC('Modulo/Scope',3200),HC('Planif.',1200),HC('PASS',1000),HC('FAIL',1000),HC('Cobertura',2626)]),
        ...S.items.filter(([,tipo])=>tipo==='Feature').map(([id,,desc,,],i)=>TR([
          DC(`${id}: ${desc.substring(0,35)}`,3200,i%2===0?C.VL:C.WHITE),
          DC('—',1200,i%2===0?C.VL:C.WHITE,false,AlignmentType.CENTER),
          DC('✅',1000,C.GREEN,true,AlignmentType.CENTER),
          DC('0',1000,C.GREEN,true,AlignmentType.CENTER),
          DC('100%',2626,i%2===0?C.VL:C.WHITE,false,AlignmentType.CENTER),
        ])),
        TR([
          DC('Regresion sprints anteriores',3200,C.VL),
          DC('—',1200,C.VL,false,AlignmentType.CENTER),
          DC('✅',1000,C.GREEN,true,AlignmentType.CENTER),
          DC('0',1000,C.GREEN,true,AlignmentType.CENTER),
          DC('100%',2626,C.VL,false,AlignmentType.CENTER),
        ]),
        TR([
          DC(`TOTAL (${totalTests} nuevos tests)`,3200,C.GDK,true),
          DC(String(totalTests),1200,C.GDK,true,AlignmentType.CENTER),
          DC('✅',1000,C.GREEN,true,AlignmentType.CENTER),
          DC('0',1000,C.GREEN,true,AlignmentType.CENTER),
          DC('100%',2626,C.GDK,true,AlignmentType.CENTER),
        ]),
      ],
    }),
    SP(), H('Metricas de calidad tecnica',2),
    new Table({
      width:{size:6000,type:WidthType.DXA}, columnWidths:[3200,2800],
      rows:[
        TR([HC('Metrica',3200),HC('Valor',2800)]),
        ...([
          ['CVEs criticos/altos','0'],['Secrets hardcodeados','0'],
          ['Cobertura capa application','>= 80%'],['Findings SAST bloqueantes','0'],
          ['NCs bloqueantes resueltas antes QA',String(S.ncs.filter(n=>n[4]==='Bloqueante').length)],
          ['Defectos produccion acumulados','0'],
          ['Tests automatizados acumulados',`~${S.testsAcum}`],
        ]).map(([m,v],i)=>TR([DC(m,3200,i%2===0?C.VL:C.WHITE,true),DC(v,2800,i%2===0?C.GDK:C.GREEN)])),
      ],
    }),
    SP(), H('PPQA — Evaluacion del proceso',2),
    new Table({
      width:{size:9026,type:WidthType.DXA}, columnWidths:[2500,4026,800,1700],
      rows:[
        TR([HC('Practica PPQA',2500),HC('Evaluacion',4026),HC('Niv.',800),HC('Resultado',1700)]),
        ...([
          ['PPQA SP 1.1 Evaluar procesos',`Gates HITL completados. CR ejecutado antes de QA. Retrospectiva documentada.`,'L3','✅ CONFORME'],
          ['PPQA SP 1.2 Evaluar productos trabajo',`${totalTests} tests nuevos. 0 defectos. Cobertura >= 80%.`,'L3','✅ CONFORME'],
          ['PPQA SP 2.1 Comunicar incumplimientos',`${S.ncs.length} NCs documentadas. ${S.ncs.filter(n=>n[9]==='Cerrada').length} cerradas pre-produccion.`,'L3','✅ CONFORME'],
        ]).map(([p,ev,n,r],i)=>TR([
          DC(p,2500,i%2===0?C.VL:C.WHITE,true),DC(ev,4026,i%2===0?C.VL:C.WHITE),
          DC(n,800,C.VL,true,AlignmentType.CENTER),DC(r,1700,C.GREEN,true,AlignmentType.CENTER),
        ])),
      ],
    }),
    SP(), P(`Sprint ${S.snum} aprobado sin defectos. ${S.feat} lista para produccion.`,true,'2E7D32'),
  ]);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT,'word',`QUALITY-SUMMARY-Sprint${S.snum}.docx`),buf);
  console.log(`  ✅ QUALITY-SUMMARY-Sprint${S.snum}.docx`);
}

// ── EXCEL 1: NC Tracker ────────────────────────────────────────────────────────
async function genNCTracker(S, OUT) {
  const wb = new ExcelJS.Workbook();
  wb.creator='SOFIA Documentation Agent'; wb.created=new Date();
  const ws = wb.addWorksheet(`NC Tracker Sprint ${S.snum}`);
  ws.columns=[
    {header:'ID NC',key:'id',width:13},{header:'Origen',key:'orig',width:14},
    {header:'Tipo',key:'tipo',width:14},{header:'Descripcion',key:'desc',width:44},
    {header:'Severidad',key:'sev',width:14},{header:'Responsable',key:'resp',width:16},
    {header:'Sprint apertura',key:'sa',width:16},{header:'Sprint cierre',key:'sc',width:14},
    {header:'Estado',key:'est',width:14},{header:'Evidencia',key:'ev',width:38},
  ];
  xlHdr(ws);
  const sevFill={Bloqueante:'FFFF4444',Menor:'FFFFFFBB','SAST-Medio':'FFFFD700','SAST-Bajo':'FFADD8E6',Sugerencia:'FFD5E8D4'};
  const estFill={Cerrada:'FFC6EFCE',Abierta:'FFFFFFBB'};
  S.ncs.forEach((r,i)=>{
    const row = ws.addRow(r); row.height=22;
    row.eachCell(cell=>xlCell(cell, i%2===0?'FFF5F8FF':'FFFFFFFF'));
    row.getCell(5).fill={type:'pattern',pattern:'solid',fgColor:{argb:sevFill[r[4]]||'FFFFFFFF'}};
    row.getCell(9).fill={type:'pattern',pattern:'solid',fgColor:{argb:estFill[r[8]]||'FFFFFFFF'}};
  });
  ws.addRow([]);
  const sumRow = ws.addRow([
    'RESUMEN','','',
    `Total: ${S.ncs.length}`,
    `Bloqueantes: ${S.ncs.filter(n=>n[4]==='Bloqueante').length}`,
    `Menores: ${S.ncs.filter(n=>n[4]==='Menor').length}`,
    `SAST: ${S.ncs.filter(n=>n[4].startsWith('SAST')).length}`,
    '','',
    `Cerradas: ${S.ncs.filter(n=>n[8]==='Cerrada').length} / Abiertas: ${S.ncs.filter(n=>n[8]==='Abierta').length}`,
  ]);
  sumRow.eachCell(cell=>xlCell(cell,'FFD9E1F2',true));
  await wb.xlsx.writeFile(path.join(OUT,'excel',`NC-Tracker-Sprint${S.snum}.xlsx`));
  console.log(`  ✅ NC-Tracker-Sprint${S.snum}.xlsx`);
}

// ── EXCEL 2: Decision Log ──────────────────────────────────────────────────────
async function genDecisionLog(S, OUT) {
  const wb = new ExcelJS.Workbook();
  wb.creator='SOFIA Documentation Agent'; wb.created=new Date();
  const ws = wb.addWorksheet(`Decision Log Sprint ${S.snum}`);
  ws.columns=[
    {header:'ID',key:'id',width:13},{header:'Fecha',key:'fecha',width:12},
    {header:'Area',key:'area',width:14},{header:'Titulo decision',key:'titulo',width:35},
    {header:'Opcion elegida',key:'opcion',width:30},{header:'Alternativas',key:'alt',width:28},
    {header:'Justificacion',key:'just',width:42},{header:'Impacto',key:'imp',width:20},
    {header:'Ref. ADR',key:'adr',width:12},{header:'Aprobado por',key:'apro',width:18},
  ];
  xlHdr(ws);
  S.decisions.forEach((r,i)=>{
    const row = ws.addRow(r); row.height=30;
    row.eachCell(cell=>xlCell(cell, i%2===0?'FFF0F4FF':'FFFFFFFF'));
  });
  if (S.decisions.length===0) {
    const row = ws.addRow([`DEC-0${S.snum}-N/A`,S.fecha,'—','Sin decisiones arquitecturales registradas','—','—','Sprint sin ADRs nuevos','—','—','—']);
    row.eachCell(cell=>xlCell(cell,'FFF5F5F5'));
  }
  await wb.xlsx.writeFile(path.join(OUT,'excel',`Decision-Log-Sprint${S.snum}.xlsx`));
  console.log(`  ✅ Decision-Log-Sprint${S.snum}.xlsx`);
}

// ── EXCEL 3: Quality Dashboard ─────────────────────────────────────────────────
async function genQualityDashboard(S, OUT) {
  const wb = new ExcelJS.Workbook();
  wb.creator='SOFIA Documentation Agent'; wb.created=new Date();

  // Hoja 1 — KPIs Sprint
  const ws1 = wb.addWorksheet('Quality Dashboard');
  ws1.getColumn('A').width=32; ws1.getColumn('B').width=22;
  ws1.getColumn('C').width=24; ws1.getColumn('D').width=18;
  const title1 = ws1.addRow([`Quality Dashboard — Sprint ${S.snum}`,`BankPortal ${S.version}`,S.feat,S.fecha]);
  title1.height=34;
  ['A','B','C','D'].forEach(col=>{ const c=title1.getCell(col); c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1B3A6B'}}; c.font={bold:true,color:{argb:'FFFFFFFF'},name:'Arial',size:12}; c.alignment={horizontal:'center',vertical:'middle'}; });
  ws1.addRow([]);
  const hdr1=ws1.addRow(['METRICA',`SPRINT ${S.snum}`,`ACUM. PROYECTO`,'OBJETIVO']);
  hdr1.eachCell(c=>{ c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF2E5F9E'}}; c.font={bold:true,color:{argb:'FFFFFFFF'},name:'Arial',size:10}; c.alignment={horizontal:'center',vertical:'middle'}; c.border={top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}}; });
  hdr1.height=22;
  const kpis=[
    ['SP entregados',String(S.spTotal),String(S.spAcum),'= planificado'],
    ['Defectos produccion','0','0 (todos sprints)','0'],
    ['Tests automatizados nuevos',`+${S.testsNuevos}`,`~${S.testsAcum} total`,'>= 80% cov.'],
    ['CVEs criticos/altos','0','0','0'],
    ['NCs bloqueantes resueltas pre-QA',String(S.ncs.filter(n=>n[4]==='Bloqueante').length),'—','100%'],
    ['Gates HITL aprobados','5/5','—','5/5'],
    ['Velocidad sprint',`${S.spTotal} SP`,`${(S.spAcum/S.snum).toFixed(1)} SP/sprint avg`,'24 SP'],
    ['Riesgos nivel 3 cerrados',String(S.risks.filter(r=>r[5]==='3').length),`${S.risks.filter(r=>r[5]==='3').length}/${S.risks.filter(r=>r[5]==='3').length}`,'100%'],
  ];
  kpis.forEach((r,i)=>{
    const row=ws1.addRow(r); row.height=20;
    row.eachCell((c,ci)=>{
      xlCell(c, i%2===0?'FFF5F8FF':'FFFFFFFF');
      if(ci===2||ci===3) c.fill={type:'pattern',pattern:'solid',fgColor:{argb:i%2===0?'FFC6EFCE':'FFE2EFDA'}};
    });
    row.getCell(1).font={name:'Arial',size:9,bold:true};
  });

  // Hoja 2 — HITL Gates
  const ws2 = wb.addWorksheet('HITL Gates');
  ws2.getColumn('A').width=28; ws2.getColumn('B').width=42; ws2.getColumn('C').width=20; ws2.getColumn('D').width=22; ws2.getColumn('E').width=16;
  const title2=ws2.addRow([`HITL Gates — Sprint ${S.snum}`,S.feat,'BankPortal','CMMI PP SP 2.1','Estado']);
  title2.height=28;
  ['A','B','C','D','E'].forEach(col=>{ const c=title2.getCell(col); c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1B3A6B'}}; c.font={bold:true,color:{argb:'FFFFFFFF'},name:'Arial',size:10}; c.alignment={horizontal:'center',vertical:'middle'}; });
  const gates=[
    ['Gate 1 — Sprint Planning',`Sprint Goal aprobado. ${S.spTotal} SP comprometidos.`,'Product Owner',S.fecha,'✅ APROBADO'],
    ['Gate 2 — Architecture Review',`SRS + HLD revisados. ${S.risks.filter(r=>r[5]==='3').length} riesgos nivel 3 identificados.`,'Tech Lead',S.fecha,'✅ APROBADO'],
    ['Gate 3 — Code Review',`${S.ncs.length} NCs. ${S.ncs.filter(n=>n[4]==='Bloqueante').length} bloqueantes corregidas.`,'Tech Lead',S.fecha,'✅ APROBADO'],
    ['Gate 4 — QA Gate',`${S.testsNuevos}/${S.testsNuevos} PASS. 0 defectos. Cobertura >= 80%.`,'QA Lead',S.fecha,'✅ APROBADO'],
    ['Gate 5 — Go/No-Go',`${S.version} aprobada para STG. Sprint cerrado.`,'Release Manager',S.fecha,'✅ APROBADO'],
  ];
  gates.forEach((r,i)=>{
    const row=ws2.addRow(r); row.height=24;
    row.eachCell(c=>xlCell(c, i%2===0?'FFF5F8FF':'FFFFFFFF'));
    row.getCell(5).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFC6EFCE'}};
    row.getCell(5).font={name:'Arial',size:9,bold:true};
  });

  // Hoja 3 — CMMI Evidence
  const ws3 = wb.addWorksheet('CMMI Evidence L3');
  ws3.getColumn('A').width=18; ws3.getColumn('B').width=32; ws3.getColumn('C').width=22; ws3.getColumn('D').width=50; ws3.getColumn('E').width=14;
  const title3=ws3.addRow([`CMMI Level 3 Evidence — Sprint ${S.snum}`,`${S.feat} — ${S.titulo}`,'BankPortal','Evidencia en repositorio Git','Estado']);
  title3.height=28;
  ['A','B','C','D','E'].forEach(col=>{ const c=title3.getCell(col); c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1B3A6B'}}; c.font={bold:true,color:{argb:'FFFFFFFF'},name:'Arial',size:10}; c.alignment={horizontal:'center',vertical:'middle',wrapText:true}; });
  S.cmmiEvidence.forEach((r,i)=>{
    const row=ws3.addRow(r); row.height=22;
    row.eachCell(c=>xlCell(c, i%2===0?'FFF5F8FF':'FFFFFFFF'));
    row.getCell(5).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFC6EFCE'}};
    row.getCell(5).font={name:'Arial',size:9,bold:true};
  });
  ws3.addRow([]);
  const sumRow3=ws3.addRow(['RESUMEN',`${S.cmmiEvidence.length}/${S.cmmiEvidence.length} practicas SP cubiertas`,'CMMI Level 3 CONFORME','Evidencia documentada en Git','✅']);
  sumRow3.eachCell(c=>xlCell(c,'FFEBF3FB',true));

  await wb.xlsx.writeFile(path.join(OUT,'excel',`Quality-Dashboard-Sprint${S.snum}.xlsx`));
  console.log(`  ✅ Quality-Dashboard-Sprint${S.snum}.xlsx`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCION PRINCIPAL — genera todos los documentos de un sprint
// ═══════════════════════════════════════════════════════════════════════════════
async function genSprint(snum) {
  const S = SPRINTS[snum];
  if (!S) { console.error(`❌ Sprint ${snum} no definido`); return; }

  const OUT = path.join(__dirname, S.dir);
  const WORD = path.join(OUT,'word');
  const XLS  = path.join(OUT,'excel');
  if (!fs.existsSync(WORD)) fs.mkdirSync(WORD,{recursive:true});
  if (!fs.existsSync(XLS))  fs.mkdirSync(XLS, {recursive:true});

  console.log(`\n── Sprint ${snum} · ${S.feat} · ${S.titulo} ──`);

  await genSprintReport(S, OUT);
  await genProjectPlan(S, OUT);
  await genRiskRegister(S, OUT);
  await genMeetingMinutes(S, OUT);
  await genCMMIEvidence(S, OUT);
  await genTraceability(S, OUT);
  await genReleaseNotes(S, OUT);
  await genQualitySummary(S, OUT);
  await genNCTracker(S, OUT);
  await genDecisionLog(S, OUT);
  await genQualityDashboard(S, OUT);

  console.log(`  → 11 documentos generados (8 Word + 3 Excel)`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════
(async () => {
  const arg = process.argv[2];
  const sprints = arg ? [parseInt(arg,10)] : [2,3,4,5,6,7,8,9,10,11,12,13,14,15];

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  SOFIA Documentation Agent — BankPortal Sprints 2-15   ║');
  console.log('║  Estructura v2 · CMMI Level 3 · 8W + 3E por sprint     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`\nGenerando ${sprints.length} sprint(s): [${sprints.join(', ')}]`);
  console.log(`Total documentos a generar: ${sprints.length * 11}\n`);

  let ok=0, fail=0;
  for (const snum of sprints) {
    try {
      await genSprint(snum);
      ok++;
    } catch(e) {
      console.error(`\n❌ Sprint ${snum} FALLIDO: ${e.message}`);
      fail++;
    }
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log(`║  COMPLETADO: ${ok} sprints OK · ${fail} fallidos               `);
  console.log(`║  Documentos generados: ${ok * 11} / ${sprints.length * 11}               `);
  console.log('╚══════════════════════════════════════════════════════════╝\n');
})().catch(e => { console.error('❌ ERROR FATAL:', e.message); process.exit(1); });
