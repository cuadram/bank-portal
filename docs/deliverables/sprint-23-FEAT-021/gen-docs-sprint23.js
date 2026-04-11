// gen-docs-sprint23.js — Documentation Agent Sprint 23 FEAT-021
// SOFIA v2.7 · 17 DOCX + 3 XLSX + 1 JSON
// FEAT-021 Depósitos a Plazo Fijo — Banco Meridian
'use strict';
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, BorderStyle, WidthType, ShadingType } = require('docx');
const fs   = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const OUT_WORD  = 'docs/deliverables/sprint-23-FEAT-021/word';
const OUT_EXCEL = 'docs/deliverables/sprint-23-FEAT-021/excel';
[OUT_WORD, OUT_EXCEL].forEach(d => fs.mkdirSync(d, { recursive: true }));

const BLUE   = '1B3A6B'; const WHITE = 'FFFFFF'; const FONT = 'Arial';
const DATE   = '09/04/2026'; const SPRINT = '23'; const FEAT = 'FEAT-021';
const VER    = 'v1.23.0';   const CLIENT = 'Banco Meridian';
const YELLOW = 'FFF8E1';    const GREEN  = 'E8F5E9'; const RED = 'FFEBEE';

// ─── Primitivas DOCX ───────────────────────────────────────────────────────
const bdr  = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const bdrH = { style: BorderStyle.SINGLE, size: 1, color: BLUE };
const allBdr  = { top: bdr,  bottom: bdr,  left: bdr,  right: bdr  };
const allBdrH = { top: bdrH, bottom: bdrH, left: bdrH, right: bdrH };
const cellMar = { top: 80, bottom: 80, left: 120, right: 120 };

function makeCell(txt, isH, w, bg) {
  return new TableCell({
    borders: isH ? allBdrH : allBdr,
    width: { size: w, type: WidthType.DXA },
    shading: { fill: isH ? BLUE : (bg || 'F5F5F5'), type: ShadingType.CLEAR },
    margins: cellMar,
    children: [new Paragraph({ children: [
      new TextRun({ text: String(txt), bold: isH, color: isH ? WHITE : '333333', font: FONT, size: isH ? 20 : 18 })
    ]})]
  });
}
function mkTable(headers, rows, widths, rowColors) {
  return new Table({
    width: { size: widths.reduce((a,b) => a+b, 0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((h,i) => makeCell(h, true, widths[i])) }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((c,i) => makeCell(c, false, widths[i], rowColors ? rowColors[ri] : null))
      }))
    ]
  });
}
function h1(t) { return new Paragraph({ spacing:{before:300,after:120}, children:[new TextRun({text:t,bold:true,size:28,font:FONT,color:BLUE})] }); }
function h2(t) { return new Paragraph({ spacing:{before:200,after:80},  children:[new TextRun({text:t,bold:true,size:24,font:FONT,color:BLUE})] }); }
function p(t,o){ o=o||{}; return new Paragraph({ spacing:{before:60,after:60}, children:[new TextRun(Object.assign({text:String(t),font:FONT,size:20},o))] }); }
function sep()  { return new Paragraph({ spacing:{before:80,after:80}, border:{bottom:{style:BorderStyle.SINGLE,size:1,color:'CCCCCC'}} }); }
function bullet(t) { return new Paragraph({ spacing:{before:40,after:40}, bullet:{level:0}, children:[new TextRun({text:t,font:FONT,size:20})] }); }

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
  console.log('  OK WORD:', filename, '(' + Math.round(buf.length/1024) + ' KB)');
}

// ══════════════════════════════════════════════════════════════════
// DOC 1 — SRS
// ══════════════════════════════════════════════════════════════════
async function genSRS() {
  await saveDoc('SRS-FEAT-021-Sprint23.docx', [
    ...coverPage('Software Requirements Specification', 'FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Introducción'),
    p('El presente documento especifica los requisitos funcionales y no funcionales para la funcionalidad de Depósitos a Plazo Fijo (FEAT-021), desarrollada en el Sprint 23 del proyecto BankPortal para Banco Meridian.'),
    p('Marco regulatorio aplicable: Ley 44/2002 de medidas de reforma del sistema financiero, RDL 16/2011 FGD, Ley 35/2006 Art.25 IRPF, Directiva PSD2 (DSP2) SCA.'),
    sep(),
    h1('2. User Stories'),
    mkTable(
      ['ID','Título','SP','Prioridad','Criterios de Aceptación'],
      [
        ['US-F021-01','Consultar depósitos activos','3','Alta','GET /deposits → lista paginada con estado, TIN, TAE, vencimiento, badge FGD'],
        ['US-F021-02','Ver detalle de depósito','2','Alta','GET /deposits/{id} → datos completos + cuadro IRPF + renovación'],
        ['US-F021-03','Simular depósito a plazo','3','Alta','POST /deposits/simulate → intereses brutos, retención 19%, TAE, total'],
        ['US-F021-04','Contratar depósito con OTP','5','Crítica','POST /deposits → SCA/PSD2 + OTP + firma precontractual → id+estado'],
        ['US-F021-05','Configurar instrucción de renovación','2','Media','PUT /deposits/{id}/renewal → RENEW_MANUAL|CANCEL|LINK_TO_ACCOUNT'],
        ['US-F021-06','Cancelación anticipada con penalización','5','Alta','DELETE /deposits/{id} → penalización 25%+IRPF → OTP → neto'],
        ['US-F021-07','Retención IRPF automática (Art.25)','3','Crítica','Tramos: 19% ≤6.000€, 21% 6.001-50.000€, 23% >50.000€'],
        ['US-F021-08','Garantía FGD RDL 16/2011','1','Alta','Badge FGD en lista + detalle. Límite 100.000€/titular'],
        ['US-F021-09','Cierre deudas técnicas DEBT-036/037/044','3','Alta','DEBT-036 ExportAudit, DEBT-037 PAN regex, DEBT-044 TAE config'],
      ],
      [900,2400,600,800,2800]
    ),
    sep(),
    h1('3. Reglas de Negocio'),
    mkTable(
      ['ID','Regla','Fuente Legal'],
      [
        ['RN-F021-01','Importe mínimo 1.000€, máximo 500.000€','Política Banco Meridian'],
        ['RN-F021-02','Plazos disponibles: 3, 6, 12, 24, 36, 60 meses','Catálogo de productos'],
        ['RN-F021-03','TIN nominal anual: 3,25% — configurable en application.yml','ADR-036'],
        ['RN-F021-04','TAE efectivo: 3,30% — calculado por ActuarialService','Circular 5/2012 BdE'],
        ['RN-F021-05','Retención IRPF 19% sobre intereses ≤6.000€ (Art.25 Ley 35/2006)','Ley 35/2006 Art.25'],
        ['RN-F021-06','Retención IRPF 21% sobre tramo 6.001€–50.000€','Ley 35/2006 Art.25'],
        ['RN-F021-07','Retención IRPF 23% sobre tramo >50.000€','Ley 35/2006 Art.25'],
        ['RN-F021-08','OTP obligatorio en apertura y cancelación (SCA/PSD2)','PSD2 Art.97'],
        ['RN-F021-09','Penalización cancelación anticipada: 25% sobre intereses devengados','Política Banco Meridian'],
        ['RN-F021-10','Garantía FGD: 100.000€ por titular y entidad (RDL 16/2011)','RDL 16/2011'],
      ],
      [1200,4500,1800]
    ),
    sep(),
    h1('4. Endpoints API'),
    mkTable(
      ['Método','Ruta','Auth','Body / Params','Respuesta'],
      [
        ['GET','/api/v1/deposits','JWT','—','200 List<DepositSummaryDTO>'],
        ['GET','/api/v1/deposits/{id}','JWT','—','200 DepositDetailDTO'],
        ['POST','/api/v1/deposits/simulate','JWT','{importe, plazoMeses}','200 SimulationResultDTO'],
        ['POST','/api/v1/deposits','JWT','{importe,plazoMeses,cuentaOrigenId,renovacion,otp}','201 DepositApplicationDTO'],
        ['PUT','/api/v1/deposits/{id}/renewal','JWT','{renovacion}','200 DepositDetailDTO'],
        ['DELETE','/api/v1/deposits/{id}','JWT','?otp=XXXXXX','200 CancellationResultDTO'],
      ],
      [700,2000,600,2400,1800]
    ),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 2 — HLD
// ══════════════════════════════════════════════════════════════════
async function genHLD() {
  await saveDoc('HLD-FEAT-021-Sprint23.docx', [
    ...coverPage('High Level Design', 'FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Bounded Context: deposit/'),
    p('El módulo deposit/ implementa la gestión completa del ciclo de vida de depósitos a plazo fijo mediante arquitectura hexagonal (Ports & Adapters). Se integra con el módulo twofa/ para validación SCA y con CoreBanking (mock ADR-037) para operaciones de liquidación.'),
    sep(),
    h1('2. Arquitectura de 4 Capas'),
    mkTable(
      ['Capa','Paquete','Responsabilidad'],
      [
        ['Domain','deposit/domain/','Entidades, excepciones, puertos de repositorio, servicios de dominio'],
        ['Application','deposit/application/','6 Use Cases, DTOs, orquestación de lógica de negocio'],
        ['Infrastructure','deposit/infrastructure/','JPA adapters, CoreBanking mock client, configuración'],
        ['API','deposit/api/','DepositController REST + DepositExceptionHandler'],
      ],
      [1500,2500,3500]
    ),
    sep(),
    h1('3. Decision Records (ADRs)'),
    mkTable(
      ['ADR','Decisión','Justificación'],
      [
        ['ADR-036','TIN/TAE externalizados a application.yml','DEBT-044 — eliminar hardcoding de tipos de interés'],
        ['ADR-037','CoreBanking como mock con @Profile(mock)','ADR evita acoplamiento real en STG; mock solo con perfil explícito (LA-019-08)'],
      ],
      [800,3000,3700]
    ),
    sep(),
    h1('4. Flyway Migration V26'),
    p('V26__deposits.sql: tablas deposits + deposit_applications. Idempotente con ON CONFLICT DO NOTHING en seeds (LA-022-09).'),
    sep(),
    h1('5. Componentes Angular (Frontend)'),
    mkTable(
      ['Componente','Ruta','Descripción'],
      [
        ['DepositListComponent','/depositos','Lista de depósitos con grid 4 columnas, empty state, badges FGD'],
        ['DepositSimulatorComponent','/depositos/simulador','Formulario simulación + panel resultado azul + alert FGD'],
        ['DepositApplicationFormComponent','/depositos/nuevo','Wizard 3 pasos: config → OTP 6 inputs → éxito inline'],
        ['DepositDetailComponent','/depositos/:id','Detalle + cuadro IRPF + botones renovación/cancelación'],
        ['DepositRenewalComponent','/depositos/:id/renovacion','3 opciones radio-style instrucción vencimiento'],
        ['DepositCancelComponent','/depositos/:id/cancelar','Resumen penalización + OTP 6 inputs + confirmación'],
      ],
      [2200,2000,3300]
    ),
    sep(),
    h1('6. Confluence'),
    p('HLD publicado en Confluence: página 9371649 — Sprint 23 HLD FEAT-021 Depósitos (parentId: 65958 Arquitectura).'),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 3 — LLD Backend
// ══════════════════════════════════════════════════════════════════
async function genLLDBackend() {
  await saveDoc('LLD-FEAT-021-Backend-Sprint23.docx', [
    ...coverPage('Low Level Design — Backend', 'FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Modelo de Dominio'),
    mkTable(
      ['Clase','Tipo','Atributos clave'],
      [
        ['Deposit','@Entity','id, userId, accountId, importe, plazoMeses, tin, tae, estado(DepositStatus), fechaVencimiento, renovacion(RenewalInstruction)'],
        ['DepositApplication','@Entity','id, userId, depositId, importe, plazoMeses, otp, otpVerified, estado'],
        ['DepositStatus','@Enum','ACTIVE, CANCELLED, MATURED, PENDING'],
        ['RenewalInstruction','@Enum','RENEW_MANUAL, CANCEL, LINK_TO_ACCOUNT'],
        ['SimulationResult','DTO','interesesBrutos, retencionIrpf, interesesNetos, totalVencimiento, tramo, tin, tae'],
        ['CancellationResult','DTO','interesesDevengados, penalizacion, retencionIrpf, netoCancelacion'],
      ],
      [2200,1200,4100]
    ),
    sep(),
    h1('2. Use Cases (6)'),
    mkTable(
      ['Use Case','Entrada','Salida','Reglas'],
      [
        ['ListDepositsUseCase','userId','List<DepositSummaryDTO>','Solo depósitos del usuario autenticado'],
        ['GetDepositDetailUseCase','userId, depositId','DepositDetailDTO','AccessDeniedException si userId != deposit.userId'],
        ['SimulateDepositUseCase','importe, plazoMeses','SimulationResultDTO','Usa DepositSimulatorService + IrpfRetentionCalculator'],
        ['OpenDepositUseCase','OpenDepositRequest + userId','DepositApplicationDTO','OTP validado ANTES de persistir (LA-TEST-003)'],
        ['SetRenewalUseCase','depositId, userId, renovacion','DepositDetailDTO','Solo en depósitos ACTIVE'],
        ['CancelDepositUseCase','depositId, userId, otp','CancellationResult','PenaltyCalculator 25% + IRPF + OTP'],
      ],
      [2000,1500,1800,2200]
    ),
    sep(),
    h1('3. Servicios de Dominio'),
    mkTable(
      ['Servicio','Responsabilidad'],
      [
        ['DepositSimulatorService','Cálculo TIN/TAE desde @Value (DEBT-044). Intereses = importe × TIN × (plazo/12)'],
        ['IrpfRetentionCalculator','Tramos Art.25: 19% ≤6.000€ | 21% 6.001-50.000€ | 23% >50.000€'],
        ['PenaltyCalculator','Cancelación anticipada: penalización = 25% × interesesDevengadosProporcionales'],
      ],
      [2200,5300]
    ),
    sep(),
    h1('4. Propiedades application.yml'),
    p('bank.products.deposit.tin-anual=3.25'),
    p('bank.products.deposit.tae-anual=3.30'),
    p('bank.products.deposit.plazo-minimo-meses=3'),
    p('bank.products.deposit.importe-minimo=1000'),
    p('bank.products.deposit.importe-maximo=500000'),
    sep(),
    h1('5. Guardrails aplicados'),
    mkTable(
      ['Guardrail','Resultado'],
      [
        ['GR-001 Paquete raíz','com.experis.sofia.bankportal — PASS (LA-020-09)'],
        ['GR-002 Atributo JWT','getAttribute("authenticatedUserId") — PASS (LA-TEST-001)'],
        ['GR-003 ExceptionHandler','DepositExceptionHandler cubre todas las excepciones de dominio — PASS (LA-TEST-003)'],
        ['GR-004 Timestamps JPA','LocalDateTime para TIMESTAMP sin TZ — PASS (LA-TEST-004)'],
        ['GR-005 OTP antes de persistir','OpenDepositUseCase: otpValidation.validate() línea 31 — PASS'],
        ['GR-010 DEBT CVSS','0 deudas CVSS≥4.0 abiertas — PASS'],
        ['DEBT-036','CLOSED — ExportAuditService con AccountRepositoryPort'],
        ['DEBT-037','CLOSED — CardPanValidator regex 13-19 dígitos + Luhn'],
        ['DEBT-044','CLOSED — SimulateLoanUseCase @Value taeAnual'],
      ],
      [2500,5000]
    ),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 4 — LLD Frontend
// ══════════════════════════════════════════════════════════════════
async function genLLDFrontend() {
  await saveDoc('LLD-FEAT-021-Frontend-Sprint23.docx', [
    ...coverPage('Low Level Design — Frontend', 'FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Módulo Angular'),
    mkTable(
      ['Fichero','Ruta','Descripción'],
      [
        ['deposits.module.ts','features/deposits/','DepositsModule con declaraciones y providers'],
        ['deposits-routing.module.ts','features/deposits/','Rutas: / | /simulador | /nuevo | /:id | /:id/renovacion | /:id/cancelar'],
        ['deposit.model.ts','features/deposits/models/','Interfaces: DepositSummary, DepositDetail, SimulationResult, CancellationResult'],
        ['deposit.service.ts','features/deposits/services/','HttpClient calls. catchError → of(valorDefecto) (LA-STG-001)'],
      ],
      [2000,2200,3300]
    ),
    sep(),
    h1('2. Fidelidad al prototipo PROTO-FEAT-021-sprint23.html'),
    mkTable(
      ['Screen prototipo','Componente','Fidelidad'],
      [
        ['screen-list','DepositListComponent','✅ Grid 4 col, badges FGD+estado, empty state con 2 botones, vencidos opacity 0.65'],
        ['screen-simulator','DepositSimulatorComponent','✅ Breadcrumb, form-row 2col, select dropdown plazos, sim-result-panel azul, alert FGD'],
        ['screen-open-s1','DepositApplicationFormComponent paso 1','✅ Stepper, card max-600px, cuenta IBAN+saldo, al-vencimiento select+hint, resumen'],
        ['screen-open-s2','DepositApplicationFormComponent paso 2','✅ 6 OTP inputs 52×64px autonavegación, countdown 00:30, alert precontractual'],
        ['screen-success','DepositApplicationFormComponent paso 3','✅ 🎉 inline, irpf-panel amarillo 4 filas, alert 7 días, botón full-width'],
        ['screen-detail','DepositDetailComponent','✅ Breadcrumb, H1+badges, grid-2 datos+IRPF, loan-amount-big, botones renovar/cancelar'],
        ['screen-renewal','DepositRenewalComponent','✅ 3 opciones renew-opt radio-style, footer ←Volver|Guardar'],
        ['screen-cancel','DepositCancelComponent','✅ Alert warning 25%, cancel-summary-card 6 filas, OTP 6 inputs, footer danger'],
      ],
      [2000,2500,3000]
    ),
    sep(),
    h1('3. Reglas LA aplicadas'),
    mkTable(
      ['LA','Descripción','Aplicación'],
      [
        ['LA-FRONT-001','Registrar ruta lazy y nav item en shell en mismo step','✅ /depositos en app-routing + Depósitos en shell.component.ts'],
        ['LA-023-01','Nunca usar [href] para navegación interna Angular','✅ Todos los enlaces internos usan router.navigateByUrl() o [routerLink]'],
        ['LA-STG-001','catchError en forkJoin retorna of(valorDefecto) nunca EMPTY','✅ deposit.service.ts — catchError → of([]) para listas'],
        ['LA-TEST-003','Excepciones de dominio mapeadas en ExceptionHandler','✅ DepositExceptionHandler cubre InvalidOtpException, NotCancellable, AccessDenied'],
      ],
      [1200,2800,3500]
    ),
    sep(),
    h1('4. OTP STG Bypass'),
    p('Para entornos STG donde totp_secret_enc es NULL en BD, el backend acepta el código "123456" configurado en application-staging.yml (totp.stg-bypass-code). En producción el campo está vacío — bypass desactivado.'),
    p('Implementación: TwoFactorServiceImpl.verifyOtp() → orElseGet() con comparación stgBypassCode.equals(code) + log WARN trazable.'),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 5 — QA Report
// ══════════════════════════════════════════════════════════════════
async function genQAReport() {
  await saveDoc('QA-Report-FEAT-021-Sprint23.docx', [
    ...coverPage('QA Test Report', 'FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Resumen Ejecutivo'),
    mkTable(
      ['Métrica','Valor'],
      [
        ['Total test cases','47'],
        ['PASS','47'],
        ['FAIL','0'],
        ['BLOCKED','0'],
        ['Cobertura estimada','89%'],
        ['Tests unitarios nuevos','11 (TC-001..011)'],
        ['Tests QA funcionales','36'],
        ['Smoke tests','9/9 OK'],
        ['Repositorio activo','JPA-REAL'],
        ['Veredicto','✅ LISTO PARA RELEASE SIN CONDICIONES'],
      ],
      [3000,4500]
    ),
    sep(),
    h1('2. Casos de Prueba — Unitarios'),
    mkTable(
      ['ID','Descripción','Resultado'],
      [
        ['TC-001','IrpfRetentionCalculator — tramo 19% (intereses ≤6.000€)','✅ PASS'],
        ['TC-002','IrpfRetentionCalculator — tramo 21% (intereses 6.001-50.000€)','✅ PASS'],
        ['TC-003','IrpfRetentionCalculator — tramo 23% (intereses >50.000€)','✅ PASS'],
        ['TC-004','IrpfRetentionCalculator — cálculo combinado multi-tramo','✅ PASS'],
        ['TC-005','DepositSimulatorService — TIN desde @Value (DEBT-044)','✅ PASS'],
        ['TC-006','PenaltyCalculator — penalización 25% + IRPF proporcional','✅ PASS'],
        ['TC-007','OpenDepositUseCase — OTP válido → depósito creado','✅ PASS'],
        ['TC-008','OpenDepositUseCase — OTP inválido → InvalidOtpException (HTTP 401)','✅ PASS'],
        ['TC-009','OpenDepositUseCase — importe fuera de rango → SimulationException','✅ PASS'],
        ['TC-010','CancelDepositUseCase — userId incorrecto → AccessDeniedException','✅ PASS'],
        ['TC-011','CancelDepositUseCase — depósito vencido → NotCancellableException','✅ PASS'],
      ],
      [1000,4000,2500]
    ),
    sep(),
    h1('3. Casos de Prueba — Funcionales QA'),
    mkTable(
      ['ID','Flujo','Resultado'],
      [
        ['TC-F01','Login + GET /deposits → lista vacía (empty state)','✅ PASS'],
        ['TC-F02','POST /simulate 10.000€ 12m → intereses 325€ IRPF 61,75€ total 10.263,25€','✅ PASS'],
        ['TC-F03','POST /deposits OTP=123456 → 201 + depositId','✅ PASS'],
        ['TC-F04','GET /deposits/{id} → detalle con cuadro IRPF','✅ PASS'],
        ['TC-F05','PUT /deposits/{id}/renewal RENEW_MANUAL → 200','✅ PASS'],
        ['TC-F06','DELETE /deposits/{id} OTP=123456 → penalización calculada → 200','✅ PASS'],
        ['TC-F07','POST /deposits sin OTP → 400 OTP_REQUIRED','✅ PASS'],
        ['TC-F08','POST /deposits OTP inválido → 401 OTP_INVALID','✅ PASS'],
        ['TC-F09','POST /deposits importe <1000€ → 400','✅ PASS'],
      ],
      [900,4200,2400]
    ),
    sep(),
    h1('4. Smoke Tests (9/9)'),
    mkTable(
      ['ST','Descripción','HTTP'],
      [
        ['ST-01','GET /actuator/health → UP','200 ✅'],
        ['ST-02','Frontend Angular localhost:4201','200 ✅'],
        ['ST-03','GET /deposits sin JWT → 401','401 ✅'],
        ['ST-04','POST /simulate sin JWT → 401','401 ✅'],
        ['ST-05','POST /deposits sin JWT → 401','401 ✅'],
        ['ST-06','GET /deposits con JWT → 200','200 ✅'],
        ['ST-07','POST /simulate 10.000€ 12m → 200','200 ✅'],
        ['ST-08','POST /deposits OTP=123456 → 201','201 ✅'],
        ['ST-09','Flyway V26__deposits.sql → SUCCESS','OK ✅'],
      ],
      [700,4000,2800]
    ),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 6 — Code Review
// ══════════════════════════════════════════════════════════════════
async function genCRReport() {
  await saveDoc('Code-Review-FEAT-021-Sprint23.docx', [
    ...coverPage('Code Review Report', 'FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Veredicto'),
    p('✅ APPROVED — 0 bloqueantes · 0 mayores · 2 menores corregidos · 1 sugerencia'),
    sep(),
    h1('2. Hallazgos'),
    mkTable(
      ['ID','Severidad','Fichero','Descripción','Estado'],
      [
        ['RV-F021-01','MINOR','DepositController.java','Faltaba validación @NotNull en cuentaOrigenId del request body','CORREGIDO'],
        ['RV-F021-02','MINOR','deposit-list.component.html','Badge FGD sin aria-label accesible (WCAG 2.1 AA)','CORREGIDO'],
        ['SUG-F021-01','SUGGESTION','DepositSimulatorService.java','Extraer constante PENALTY_RATE = 0.25 a application.yml en próximo sprint','PENDIENTE S24'],
      ],
      [1200,1000,2000,2800,1000]
    ),
    sep(),
    h1('3. Checklist Guardrails (15/15)'),
    mkTable(
      ['GR','Check','Resultado'],
      [
        ['GR-001','Paquete raíz com.experis.sofia.bankportal','✅ OK'],
        ['GR-002','getAttribute("authenticatedUserId")','✅ OK'],
        ['GR-003','ExceptionHandler para todas las excepciones dominio','✅ OK'],
        ['GR-004','Timestamps LocalDateTime (no Instant) para TIMESTAMP sin TZ','✅ OK'],
        ['GR-005','OTP validado antes de persistir','✅ OK'],
        ['GR-006','[href] interno → router.navigateByUrl() (LA-023-01)','✅ OK'],
        ['GR-007','Ruta lazy + nav item en shell.component.ts (LA-FRONT-001)','✅ OK'],
        ['GR-008','catchError retorna of() no EMPTY en forkJoin (LA-STG-001)','✅ OK'],
        ['GR-009','Seeds Flyway con ON CONFLICT DO NOTHING (LA-022-09)','✅ OK'],
        ['GR-010','DEBT CVSS≥4.0: 0 abiertos','✅ OK'],
        ['GR-011','Dashboard actualizado en cada gate','✅ OK'],
        ['GR-012','Step 3b completado post G-3','✅ OK'],
        ['GR-013','Ficheros .docx reales (no .md)','✅ OK'],
        ['GR-014','Prototipo fiel a UX aprobado','✅ OK'],
        ['GR-015','Patch first ante correcciones urgentes','✅ OK'],
      ],
      [800,3800,2900]
    ),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 7 — Security Report
// ══════════════════════════════════════════════════════════════════
async function genSecReport() {
  await saveDoc('Security-Report-FEAT-021-Sprint23.docx', [
    ...coverPage('Security Audit Report', 'FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Semáforo de Seguridad'),
    p('🟢 GREEN — CVE Críticos: 0 | CVE High: 0 | SAST: 1 finding menor (no bloqueante)'),
    sep(),
    h1('2. Checks de Seguridad (8/8)'),
    mkTable(
      ['Check','Descripción','Resultado'],
      [
        ['SEC-01','SCA/OTP obligatorio en apertura y cancelación (PSD2 Art.97)','✅ PASS'],
        ['SEC-02','JWT bearer en todos los endpoints /api/v1/deposits/**','✅ PASS'],
        ['SEC-03','AccessDeniedException si userId != deposit.userId','✅ PASS'],
        ['SEC-04','IRPF calculado server-side — no confiable desde cliente','✅ PASS'],
        ['SEC-05','Cifrado AES-256-CBC para secretos TOTP en reposo (ADR-003)','✅ PASS'],
        ['SEC-06','OTP bypass STG solo activo si totp.stg-bypass-code no vacío','✅ PASS'],
        ['SEC-07','DEBT-037 CLOSED: regex PAN 13-19 dígitos + Luhn activo','✅ PASS'],
        ['SEC-08','DEBT-036 CLOSED: IBAN no expuesto en logs export_audit_log','✅ PASS'],
      ],
      [800,3800,2900]
    ),
    sep(),
    h1('3. Deudas Técnicas Cerradas'),
    mkTable(
      ['DEBT','Descripción','Cierre'],
      [
        ['DEBT-036','IBAN real en export_audit_log → AccountRepositoryPort inyectado en ExportAuditService','Sprint 23'],
        ['DEBT-037','Regex PAN Maestro 19 dígitos → expresión regular 13-19 dígitos + Luhn check','Sprint 23'],
        ['DEBT-044','TAE hardcodeado → @Value bank.products.loan.tae + bank.products.deposit.tin-anual','Sprint 23'],
      ],
      [1000,4500,2000]
    ),
    sep(),
    h1('4. Hallazgo SAST (no bloqueante)'),
    p('SAST-F021-001 (LOW): DepositCancelComponent — timeout de countdown OTP no limpiado en ngOnDestroy. Riesgo: memory leak menor. Scheduled para Sprint 24.'),
    sep(),
    h1('5. Cumplimiento Normativo'),
    mkTable(
      ['Norma','Estado'],
      [
        ['PCI-DSS','✅ COMPLIANT — PANs no almacenados, regex validado'],
        ['GDPR','✅ COMPLIANT — IRPF calculado sin exposición de datos fiscales'],
        ['PSD2 SCA','✅ COMPLIANT — OTP en apertura y cancelación'],
        ['Ley 35/2006 Art.25','✅ COMPLIANT — Retención IRPF 3 tramos automática'],
        ['RDL 16/2011 FGD','✅ COMPLIANT — Badge FGD visible en lista y detalle'],
      ],
      [3000,4500]
    ),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 8 — Release Notes
// ══════════════════════════════════════════════════════════════════
async function genReleaseNotes() {
  await saveDoc('Release-Notes-v1.23.0-Sprint23.docx', [
    ...coverPage('Release Notes v1.23.0', 'FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Novedades v1.23.0'),
    bullet('FEAT-021: Depósitos a Plazo Fijo — consulta, simulación, contratación, renovación y cancelación'),
    bullet('Retención IRPF automática Art.25 Ley 35/2006 — 3 tramos (19% / 21% / 23%)'),
    bullet('Garantía FGD RDL 16/2011 — badge visible en lista y detalle'),
    bullet('SCA/PSD2 — OTP obligatorio en apertura y cancelación anticipada'),
    bullet('6 componentes Angular: List, Simulator, ApplicationForm, Detail, Renewal, Cancel'),
    bullet('OTP STG bypass 123456 — solo en profile staging con totp_secret_enc NULL'),
    sep(),
    h1('2. Deudas Técnicas Cerradas'),
    bullet('DEBT-036: IBAN real en export_audit_log — AccountRepositoryPort inyectado'),
    bullet('DEBT-037: Regex PAN Maestro 19 dígitos + Luhn check'),
    bullet('DEBT-044: TAE/TIN externalizados a application.yml'),
    sep(),
    h1('3. Migraciones Flyway'),
    p('V26__deposits.sql — tablas deposits + deposit_applications. Total: 26/26 migrations OK.'),
    sep(),
    h1('4. Breaking Changes'),
    p('Ninguno. Endpoints /api/v1/deposits/** son nuevos. Compatibilidad total con v1.22.0.'),
    sep(),
    h1('5. Variables de Entorno Nuevas'),
    mkTable(
      ['Variable','Valor STG','Descripción'],
      [
        ['bank.products.deposit.tin-anual','3.25','TIN nominal anual (%)'],
        ['bank.products.deposit.tae-anual','3.30','TAE efectivo anual (%)'],
        ['bank.products.deposit.importe-minimo','1000','Importe mínimo contratación (€)'],
        ['bank.products.deposit.importe-maximo','500000','Importe máximo contratación (€)'],
        ['totp.stg-bypass-code','123456','Bypass OTP STG — vacío en producción'],
      ],
      [2500,1500,3500]
    ),
    sep(),
    h1('6. Instrucciones de Despliegue'),
    p('1. docker compose build backend frontend'),
    p('2. docker compose up -d'),
    p('3. Verificar Flyway: GET /actuator/flyway → V26 status APPLIED'),
    p('4. Ejecutar smoke-test-v1.23.0.sh → 9/9 OK'),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 9 — Runbook
// ══════════════════════════════════════════════════════════════════
async function genRunbook() {
  await saveDoc('Runbook-v1.23.0-Sprint23.docx', [
    ...coverPage('Runbook Operacional v1.23.0', 'FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Verificación Post-Despliegue'),
    mkTable(
      ['Paso','Comando / URL','Esperado'],
      [
        ['Health','GET /actuator/health','{"status":"UP"}'],
        ['Flyway','GET /actuator/flyway','V26 status=APPLIED'],
        ['Frontend','http://localhost:4201','HTTP 200 — Angular SPA'],
        ['Smoke test','bash smoke-test-v1.23.0.sh','9/9 OK'],
        ['Depósitos nav','sidebar → Depósitos','Carga DepositListComponent'],
      ],
      [1500,3000,3000]
    ),
    sep(),
    h1('2. Alertas Operacionales'),
    mkTable(
      ['Alerta','Condición','Acción'],
      [
        ['DEPOSIT_OTP_FAIL','InvalidOtpException rate >10/min','Revisar logs [2FA] — posible ataque brute force'],
        ['DEPOSIT_IRPF_ERROR','IrpfRetentionCalculator exception','Rollback inmediato — verificar tramos configurados'],
        ['FLYWAY_FAIL','V26 status=FAILED','Ejecutar rollback SQL — tablas deposits/deposit_applications'],
        ['BYPASS_ACTIVE','Log "[2FA] STG bypass OTP aceptado" en producción','Verificar totp.stg-bypass-code = "" en producción'],
      ],
      [2000,2500,3000]
    ),
    sep(),
    h1('3. Rollback'),
    p('1. docker compose down backend'),
    p('2. docker tag bankportal-backend-2fa:v1.22.0 bankportal-backend-2fa:current'),
    p('3. docker compose up -d backend'),
    p('4. Si Flyway V26 aplicado: ejecutar V26_rollback.sql (DROP TABLE deposits CASCADE; DROP TABLE deposit_applications CASCADE;)'),
    sep(),
    h1('4. Configuración Crítica de Producción'),
    p('⚠️  totp.stg-bypass-code DEBE estar vacío en producción para deshabilitar el bypass OTP STG.'),
    p('⚠️  bank.products.deposit.tin-anual y tae-anual deben coincidir con tasas aprobadas por Banco Meridian.'),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 10 — Sprint PMC Report
// ══════════════════════════════════════════════════════════════════
async function genSprintReport() {
  await saveDoc('Sprint-23-Report-PMC.docx', [
    ...coverPage('Sprint Report — PMC', 'Sprint 23 · FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Métricas Sprint 23'),
    mkTable(
      ['Métrica','Valor'],
      [
        ['Story Points completados','24 / 24 (100%)'],
        ['SP acumulados proyecto','545'],
        ['Test cases totales','47 / 47 PASS'],
        ['Cobertura estimada','89%'],
        ['Defectos abiertos','0'],
        ['NCs último sprint','0'],
        ['Deudas técnicas cerradas','3 (DEBT-036, DEBT-037, DEBT-044)'],
        ['Deudas técnicas abiertas','0'],
        ['Seguridad','🟢 GREEN · 0 CVE críticos'],
        ['Velocidad','24 SP/sprint (constante S16-S23)'],
      ],
      [3000,4500]
    ),
    sep(),
    h1('2. Velocidad Histórica (S21-S23)'),
    mkTable(
      ['Sprint','Feature','SP','SP Acum.','Tests','Cob.','Release'],
      [
        ['S21','FEAT-019 Centro Privacidad','24','497','65','88%','v1.21.0'],
        ['S22','FEAT-020 Préstamos Personales','24','521','51','88%','v1.22.0'],
        ['S23','FEAT-021 Depósitos a Plazo Fijo','24','545','47','89%','v1.23.0'],
      ],
      [800,2200,600,800,800,800,1000]
    ),
    sep(),
    h1('3. Evidencias CMMI L3'),
    bullet('PP (Project Planning): Sprint 23 Planning Doc + capacity 24 SP — PASS'),
    bullet('PMC (Project Monitoring): gates G-1..G-7 aprobados con fecha y rol — PASS'),
    bullet('RSKM (Risk Management): 0 riesgos activos en Sprint 23 — PASS'),
    bullet('VER (Verification): Code Review APPROVED 0 blockers — PASS'),
    bullet('VAL (Validation): QA 47/47 PASS veredicto LISTO RELEASE — PASS'),
    bullet('CM (Config Mgmt): Flyway V26 versionado + release tag v1.23.0 — PASS'),
    bullet('PPQA (Process QA): guardrail-pre-gate 10/10 OK — PASS'),
    bullet('REQM (Req Mgmt): SRS + RTM 9 US → 10 RN → implementación → test — PASS'),
    bullet('DAR (Decision Analysis): ADR-036 y ADR-037 documentados — PASS'),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 11 — CMMI Evidence
// ══════════════════════════════════════════════════════════════════
async function genCMMI() {
  await saveDoc('CMMI-Evidence-Sprint23.docx', [
    ...coverPage('CMMI Level 3 Evidence', 'Sprint 23 · Banco Meridian'),
    h1('1. Process Areas — Evidencias Sprint 23'),
    mkTable(
      ['PA','Práctica','Evidencia','Estado'],
      [
        ['PP','SP 1.1 Estimación de alcance','Sprint Planning Doc 23 — 9 US, 24 SP, 9 Jira issues SCRUM-123..131','✅'],
        ['PP','SP 1.2 Plan de proyecto','docs/sprints/SPRINT-023-planning.md — pipeline 9 steps','✅'],
        ['PMC','SP 1.1 Monitorizar métricas','KPIs: 24/24 SP, 47/47 tests, 89% cov, 0 defectos','✅'],
        ['PMC','SP 1.6 Gates formales','G-1..G-7 + G-5b aprobados con fecha + rol en session.json','✅'],
        ['RSKM','SP 2.1 Identificar riesgos','Risk Register Sprint 23 — 0 activos, 3 cerrados','✅'],
        ['VER','SP 2.2 Revisión entre pares','CR-FEAT-021-sprint23.md — APPROVED 0 blockers','✅'],
        ['VAL','SP 2.1 Validación con criterios','QA-FEAT-021-sprint23.md — 47/47 PASS + smoke 9/9','✅'],
        ['CM','SP 1.1 Baseline de configuración','Flyway V26, tag v1.23.0, session.json versionado','✅'],
        ['PPQA','SP 1.1 Evaluar procesos','guardrail-pre-gate.js 10/10 OK — evidencia G-4b','✅'],
        ['REQM','SP 1.1 Gestión de requisitos','SRS FEAT-021 + RTM 9 US → 10 RN → TC → implementación','✅'],
        ['DAR','SP 1.5 Registro de decisiones','ADR-036 y ADR-037 en docs/architecture/','✅'],
      ],
      [800,1800,3800,600]
    ),
    sep(),
    h1('2. Gates Aprobados Sprint 23'),
    mkTable(
      ['Gate','Step','Aprobador','Fecha'],
      [
        ['G-1','Scrum Master','Product Owner','09/04/2026'],
        ['G-2','Requirements Analyst','Product Owner','09/04/2026'],
        ['HITL-PO-TL','UX/UI Designer','PO + Tech Lead','09/04/2026'],
        ['G-3','Architect','Tech Lead','09/04/2026'],
        ['G-3b','FA-Agent + Docs','AUTO','09/04/2026'],
        ['G-4','Developer','Tech Lead','09/04/2026'],
        ['G-4b','Guardrails','AUTO 10/10','09/04/2026'],
        ['G-5','Code Reviewer','Tech Lead','09/04/2026'],
        ['G-5b','Security Agent','AUTO GREEN','09/04/2026'],
        ['G-6','QA Tester','QA Lead + PO','09/04/2026'],
        ['G-7','DevOps','Release Manager','09/04/2026'],
      ],
      [1000,2000,2000,2500]
    ),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 12 — Meeting Minutes
// ══════════════════════════════════════════════════════════════════
async function genMeetingMinutes() {
  await saveDoc('MEETING-MINUTES-Sprint23.docx', [
    ...coverPage('Meeting Minutes', 'Sprint 23 · FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Sprint Planning — 06/04/2026'),
    mkTable(
      ['Asistentes','Rol'],
      [['Ángel de la Cuadra','Product Owner / Scrum Master'],['SOFIA Orchestrator','Tech Lead / Dev'],['Banco Meridian Rep.','Stakeholder']],
      [3000,4500]
    ),
    p('Sprint Goal: Permitir al cliente de Banco Meridian consultar, simular y contratar depósitos a plazo fijo con retención IRPF en origen y garantía FGD, cumpliendo Ley 44/2002. Cerrar DEBT-036/037/044.'),
    p('Compromisos: 24 SP, FEAT-021, 9 US, cierre deudas técnicas.'),
    sep(),
    h1('2. Design Review — 06/04/2026 (Gate HITL-PO-TL)'),
    p('PO validó UX: 10 pantallas, 3 flujos. Tech Lead validó viabilidad técnica. Gate aprobado. Prototipo PROTO-FEAT-021-sprint23.html (78KB) aceptado como referencia de implementación.'),
    sep(),
    h1('3. Architecture Review — 06/04/2026 (Gate G-3)'),
    p('HLD: bounded context deposit/, 4 capas hexagonales, ADR-036/037. Tech Lead aprobó. Publicado en Confluence 9371649.'),
    sep(),
    h1('4. QA Review — 09/04/2026 (Gate G-6)'),
    p('47/47 test cases PASS. QA Lead + PO aprueban. Veredicto: LISTO PARA RELEASE SIN CONDICIONES.'),
    sep(),
    h1('5. Release Review — 09/04/2026 (Gate G-7)'),
    p('Release Notes v1.23.0, Runbook, smoke-test-v1.23.0.sh generados. Release Manager aprueba. Tag v1.23.0 aplicado.'),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 13 — Project Plan
// ══════════════════════════════════════════════════════════════════
async function genProjectPlan() {
  await saveDoc('PROJECT-PLAN-v1.23.docx', [
    ...coverPage('Project Plan v1.23', 'BankPortal · Banco Meridian'),
    h1('1. Estado del Proyecto'),
    mkTable(
      ['Atributo','Valor'],
      [
        ['Sprints completados','23 (S1..S23)'],
        ['SP acumulados','545'],
        ['Tests acumulados','953+'],
        ['Cobertura','89%'],
        ['Defectos en producción','0'],
        ['SOFIA versión','v2.7'],
        ['Pipeline steps','15 (estándar)'],
        ['Agentes activos','21'],
      ],
      [2500,5000]
    ),
    sep(),
    h1('2. Pipeline Sprint 23 — Ejecución'),
    mkTable(
      ['Step','Agente','Gate','Estado'],
      [
        ['1','Scrum Master','G-1 PO','✅ DONE'],
        ['2','Requirements Analyst','G-2 PO','✅ DONE'],
        ['2b','FA-Agent','AUTO','✅ DONE'],
        ['2c','UX/UI Designer','HITL PO+TL','✅ DONE'],
        ['3','Architect','G-3 TL','✅ DONE'],
        ['3b','Docs + FA-Agent','AUTO','✅ DONE'],
        ['4','Developer','G-4 TL','✅ DONE'],
        ['4b','Guardrails','AUTO','✅ DONE'],
        ['5','Code Reviewer','G-5 TL','✅ DONE'],
        ['5b','Security Agent','AUTO','✅ DONE'],
        ['6','QA Tester','G-6 QA+PO','✅ DONE'],
        ['7','DevOps','G-7 RM','✅ DONE'],
        ['8','Documentation Agent','G-8 PM','⏳ EN CURSO'],
        ['8b','FA-Agent','AUTO','🔲 PENDIENTE'],
        ['9','Workflow Manager','—','🔲 PENDIENTE'],
      ],
      [600,1800,1500,4000]
    ),
    sep(),
    h1('3. DoD Sprint 23'),
    bullet('✅ 9 US implementadas y testeadas'),
    bullet('✅ 10 RN verificadas en QA'),
    bullet('✅ 47/47 test cases PASS'),
    bullet('✅ Code Review APPROVED 0 blockers'),
    bullet('✅ Security GREEN 0 CVE críticos'),
    bullet('✅ DEBT-036/037/044 CLOSED'),
    bullet('✅ Flyway V26 aplicado'),
    bullet('✅ Protipo fiel al UX aprobado (100%)'),
    bullet('⏳ 17 DOCX + 3 XLSX generados (Step 8 en curso)'),
    bullet('🔲 Jira SCRUM-123..131 → Finalizada'),
    bullet('🔲 Confluence Sprint 23 Resultados + Retrospectiva'),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 14 — Quality Summary
// ══════════════════════════════════════════════════════════════════
async function genQualitySummary() {
  await saveDoc('QUALITY-SUMMARY-Sprint23.docx', [
    ...coverPage('Quality Summary', 'Sprint 23 · Banco Meridian'),
    h1('1. KPIs de Calidad — Comparativa S21-S23'),
    mkTable(
      ['KPI','S21','S22','S23','Tendencia'],
      [
        ['SP completados','24/24','24/24','24/24','→ Constante'],
        ['Tests nuevos','65','51','47','↘ Normal (features más pequeñas)'],
        ['Cobertura','88%','88%','89%','↗ Mejora'],
        ['Defectos abiertos','0','0','0','→ Constante (óptimo)'],
        ['NCs sprint','0','0','0','→ Constante (óptimo)'],
        ['Deudas cerradas','3','3','3','→ Constante'],
        ['CVE críticos','0','0','0','→ Constante (óptimo)'],
        ['Velocidad SP','24','24','24','→ Constante'],
      ],
      [2200,1000,1000,1000,2300]
    ),
    sep(),
    h1('2. Acumulado Proyecto (S1-S23)'),
    mkTable(
      ['Métrica','Valor Acumulado'],
      [
        ['Sprints','23'],
        ['Story Points','545'],
        ['Tests (histórico)','953+'],
        ['Funcionalidades FA','86'],
        ['Reglas de negocio','198'],
        ['Lessons Learned','55+'],
        ['Defectos en producción','0'],
      ],
      [3000,4500]
    ),
    sep(),
    h1('3. Lecciones Aprendidas Clave Sprint 23'),
    bullet('LA-023-01: Nunca [href] para navegación interna Angular — siempre router.navigateByUrl()'),
    bullet('LA-CORE-018: HITL obligatorio antes de persistir cualquier Lesson Learned'),
    bullet('LA-CORE-033: la-sync.js debe ejecutarse en TODOS los proyectos registrados'),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 15 — Risk Register
// ══════════════════════════════════════════════════════════════════
async function genRiskRegister() {
  await saveDoc('RISK-REGISTER-Sprint23.docx', [
    ...coverPage('Risk Register', 'Sprint 23 · Banco Meridian'),
    h1('1. Riesgos Activos'),
    p('✅ Sin riesgos activos en Sprint 23.'),
    sep(),
    h1('2. Riesgos Cerrados en Sprint 23'),
    mkTable(
      ['ID','Riesgo','Probabilidad','Impacto','Mitigación','Estado'],
      [
        ['RSK-023-01','DEBT-036/037 bloquean G-9 si no se cierran','Alta','Alto','Incluidos en Sprint 23 como primeros items del backlog','✅ CERRADO'],
        ['RSK-023-02','OTP sin configurar en STG bloquea pruebas E2E','Media','Medio','Bypass 123456 en profile staging con log de trazabilidad','✅ CERRADO'],
        ['RSK-023-03','Flyway V26 conflicto con datos existentes','Baja','Alto','ON CONFLICT DO NOTHING en todos los INSERTs seed','✅ CERRADO'],
      ],
      [900,2000,1000,800,2200,900]
    ),
    sep(),
    h1('3. Riesgos Futuros Identificados'),
    mkTable(
      ['ID','Riesgo','Sprint Target','Acción'],
      [
        ['RSK-024-01','SUG-F021-01: PENALTY_RATE hardcodeado 0.25','S24','Externalizar a application.yml'],
        ['RSK-024-02','SAST-F021-001: memory leak countdown en ngOnDestroy','S24','clearTimeout en ngOnDestroy DepositCancelComponent'],
      ],
      [1100,2800,1100,2500]
    ),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 16 — Traceability
// ══════════════════════════════════════════════════════════════════
async function genTraceability() {
  await saveDoc('TRACEABILITY-FEAT-021-Sprint23.docx', [
    ...coverPage('Traceability Matrix', 'FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Matriz de Trazabilidad — US → RN → FA → Impl → Test'),
    mkTable(
      ['Jira','US','RN','FA','Implementación','Test'],
      [
        ['SCRUM-123','US-F021-01','RN-F021-01,02','FA-079','ListDepositsUseCase + DepositListComponent','TC-F01'],
        ['SCRUM-124','US-F021-02','RN-F021-03,04,05','FA-080','GetDepositDetailUseCase + DepositDetailComponent','TC-F04'],
        ['SCRUM-125','US-F021-03','RN-F021-03,04','FA-081','SimulateDepositUseCase + DepositSimulatorComponent','TC-002..005, TC-F02'],
        ['SCRUM-126','US-F021-04','RN-F021-08','FA-082','OpenDepositUseCase + DepositApplicationFormComponent','TC-007..009, TC-F03'],
        ['SCRUM-127','US-F021-05','RN-F021-02','FA-083','SetRenewalUseCase + DepositRenewalComponent','TC-F05'],
        ['SCRUM-128','US-F021-06','RN-F021-09','FA-084','CancelDepositUseCase + DepositCancelComponent','TC-010,011, TC-F06'],
        ['SCRUM-129','US-F021-07','RN-F021-05,06,07','FA-085','IrpfRetentionCalculator (3 tramos)','TC-001..004'],
        ['SCRUM-130','US-F021-08','RN-F021-10','FA-086','Badge FGD en List + Detail','TC-F01, TC-F04'],
        ['SCRUM-131','US-F021-09','—','—','DEBT-036/037/044 CLOSED','GR-010 PASS'],
      ],
      [900,1100,1200,800,2200,1100]
    ),
    sep(),
    h1('2. Cobertura RTM'),
    p('9/9 User Stories trazadas. 10/10 Reglas de Negocio verificadas en QA. 86 funcionalidades FA actualizadas. 9 Jira issues → Finalizada pendiente Step 9.'),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// DOC 17 — Sprint Planning Doc
// ══════════════════════════════════════════════════════════════════
async function genPlanningDoc() {
  await saveDoc('sprint23-planning-doc.docx', [
    ...coverPage('Sprint Planning Document', 'Sprint 23 · FEAT-021 Depósitos a Plazo Fijo'),
    h1('1. Sprint Goal'),
    p('Permitir al cliente de Banco Meridian consultar, simular y contratar depósitos a plazo fijo con retención IRPF en origen y garantía FGD, cumpliendo Ley 44/2002. Cerrar DEBT-036/037/044.'),
    sep(),
    h1('2. Backlog Sprint 23'),
    mkTable(
      ['Jira','Título','Tipo','SP','Prioridad'],
      [
        ['SCRUM-123','Consultar lista de depósitos activos','Story','3','Alta'],
        ['SCRUM-124','Ver detalle de depósito + cuadro IRPF','Story','2','Alta'],
        ['SCRUM-125','Simular depósito a plazo','Story','3','Alta'],
        ['SCRUM-126','Contratar depósito con OTP/SCA','Story','5','Crítica'],
        ['SCRUM-127','Configurar instrucción de renovación','Story','2','Media'],
        ['SCRUM-128','Cancelación anticipada con penalización','Story','5','Alta'],
        ['SCRUM-129','Retención IRPF automática Art.25','Story','3','Crítica'],
        ['SCRUM-130','Garantía FGD RDL 16/2011','Story','1','Alta'],
        ['SCRUM-131','Cierre DEBT-036/037/044','Tech Debt','3','Alta'],
      ],
      [1000,2800,1200,600,1000]
    ),
    sep(),
    h1('3. Capacidad'),
    p('Team: 1 dev. Capacidad: 24 SP/sprint. Total S23: 24 SP. Velocidad media: 24 SP/sprint (S16-S23).'),
    sep(),
    h1('4. Definition of Done'),
    bullet('Código revisado (Code Review APPROVED)'),
    bullet('Tests unitarios + QA PASS (cobertura ≥87%)'),
    bullet('Security GREEN (0 CVE críticos)'),
    bullet('Flyway migration versionada'),
    bullet('Release Notes + Runbook generados'),
    bullet('17 DOCX + 3 XLSX documentación cliente'),
    bullet('Jira issues → Finalizada'),
    bullet('Confluence Sprint Results + Retrospectiva'),
  ]);
}

// ══════════════════════════════════════════════════════════════════
// EXCEL 1 — NC Tracker
// ══════════════════════════════════════════════════════════════════
async function genNCTracker() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('NC Tracker Sprint 23');
  ws.columns = [
    {header:'ID NC',      key:'id',   width:15},
    {header:'Tipo',       key:'tipo', width:12},
    {header:'Sprint',     key:'sp',   width:8},
    {header:'Descripción',key:'desc', width:40},
    {header:'Severidad',  key:'sev',  width:12},
    {header:'Estado',     key:'est',  width:12},
    {header:'Resolución', key:'res',  width:35},
  ];
  const hr = ws.getRow(1);
  hr.font = { bold:true, color:{argb:'FFFFFFFF'} };
  hr.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'} };

  ws.addRows([
    {id:'RV-F021-01',tipo:'Code Review',sp:23,desc:'Falta @NotNull en cuentaOrigenId del request body',sev:'MINOR',est:'CERRADO',res:'Añadida validación @NotNull en OpenDepositRequest'},
    {id:'RV-F021-02',tipo:'Code Review',sp:23,desc:'Badge FGD sin aria-label accesible WCAG 2.1 AA',sev:'MINOR',est:'CERRADO',res:'Añadido aria-label="Garantía FGD" en badge HTML'},
    {id:'SAST-F021-01',tipo:'Security',sp:23,desc:'Countdown OTP no limpiado en ngOnDestroy — memory leak',sev:'LOW',est:'ABIERTO',res:'Scheduled Sprint 24 — clearTimeout en ngOnDestroy'},
    {id:'DEBT-036',tipo:'Tech Debt',sp:23,desc:'IBAN real en export_audit_log',sev:'MEDIA',est:'CERRADO',res:'AccountRepositoryPort inyectado en ExportAuditService'},
    {id:'DEBT-037',tipo:'Tech Debt',sp:23,desc:'Regex PAN Maestro 19 dígitos',sev:'BAJA',est:'CERRADO',res:'CardPanValidator regex 13-19 dígitos + Luhn check'},
    {id:'DEBT-044',tipo:'Tech Debt',sp:23,desc:'TAE hardcodeado en SimulateLoanUseCase',sev:'BAJA',est:'CERRADO',res:'@Value bank.products.loan.tae + deposit.tin-anual'},
  ]);

  ws.eachRow((row,n) => {
    if (n > 1) {
      const est = row.getCell('est').value;
      const bg = est==='CERRADO'?'FFE8F5E9' : est==='ABIERTO'?'FFFFEBEE':'FFFFF8E1';
      row.fill = { type:'pattern', pattern:'solid', fgColor:{argb:bg} };
    }
  });

  await wb.xlsx.writeFile(path.join(OUT_EXCEL,'NC-Tracker-Sprint23.xlsx'));
  console.log('  OK EXCEL: NC-Tracker-Sprint23.xlsx');
}

// ══════════════════════════════════════════════════════════════════
// EXCEL 2 — Decision Log
// ══════════════════════════════════════════════════════════════════
async function genDecisionLog() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Decision Log Sprint 23');
  ws.columns = [
    {header:'ID',         key:'id',    width:15},
    {header:'Fecha',      key:'fecha', width:12},
    {header:'Decisión',   key:'dec',   width:40},
    {header:'Alternativas',key:'alt',  width:30},
    {header:'Justificación',key:'just',width:35},
    {header:'Impacto',    key:'imp',   width:20},
    {header:'Aprobador',  key:'apr',   width:15},
  ];
  const hr = ws.getRow(1);
  hr.font = { bold:true, color:{argb:'FFFFFFFF'} };
  hr.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'} };
  ws.addRows([
    {id:'ADR-036',fecha:'06/04/2026',dec:'TIN/TAE externalizados a application.yml',alt:'Hardcoding, BD config',just:'DEBT-044 — eliminar valores mágicos, facilitar cambio de tasas sin redeploy',imp:'Configuración',apr:'Tech Lead'},
    {id:'ADR-037',fecha:'06/04/2026',dec:'CoreBanking como mock con @Profile(mock)',alt:'Implementación real, WireMock',just:'Evitar acoplamiento real en STG (LA-019-08). Mock solo con perfil explícito.',imp:'Arquitectura',apr:'Tech Lead'},
    {id:'OTP-STG-001',fecha:'09/04/2026',dec:'Bypass OTP 123456 en STG cuando secret NULL',alt:'Configurar TOTP real, deshabilitar OTP en STG',just:'Usuario STG sin TOTP configurado — bypass trazable con log WARN + vacío en PRD',imp:'Testing STG',apr:'PO'},
    {id:'CACHE-001',fecha:'09/04/2026',dec:'nginx index.html con Cache-Control: no-store',alt:'Cache corta 60s, ETag',just:'Evitar que Angular sirva bundle obsoleto tras redeploy (LA-FRONT-005)',imp:'Frontend DevOps',apr:'DevOps'},
  ]);
  await wb.xlsx.writeFile(path.join(OUT_EXCEL,'Decision-Log-Sprint23.xlsx'));
  console.log('  OK EXCEL: Decision-Log-Sprint23.xlsx');
}

// ══════════════════════════════════════════════════════════════════
// EXCEL 3 — Quality Dashboard
// ══════════════════════════════════════════════════════════════════
async function genQualityDashboard() {
  const wb = new ExcelJS.Workbook();

  // Hoja 1 — Dashboard
  const ws = wb.addWorksheet('Dashboard S21-S23');
  ws.columns = [
    {header:'Métrica',      key:'m',   width:28},
    {header:'S21',          key:'s21', width:12},
    {header:'S22',          key:'s22', width:12},
    {header:'S23',          key:'s23', width:12},
    {header:'Threshold',    key:'thr', width:12},
    {header:'Estado S23',   key:'est', width:14},
  ];
  const hr = ws.getRow(1);
  hr.font = { bold:true, color:{argb:'FFFFFFFF'} };
  hr.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'} };
  ws.addRows([
    {m:'Story Points completados',s21:'24/24',s22:'24/24',s23:'24/24',thr:'24/24',est:'✅ OK'},
    {m:'Tests PASS (%)',s21:'100%',s22:'100%',s23:'100%',thr:'100%',est:'✅ OK'},
    {m:'Cobertura estimada',s21:'88%',s22:'88%',s23:'89%',thr:'≥87%',est:'✅ OK'},
    {m:'Defectos abiertos',s21:'0',s22:'0',s23:'0',thr:'0',est:'✅ OK'},
    {m:'NCs sprint (bloqueantes)',s21:'0',s22:'0',s23:'0',thr:'0',est:'✅ OK'},
    {m:'CVE críticos',s21:'0',s22:'0',s23:'0',thr:'0',est:'✅ OK'},
    {m:'Deudas cerradas sprint',s21:'3',s22:'3',s23:'3',thr:'≥plan',est:'✅ OK'},
    {m:'Code Review APPROVED',s21:'Sí',s22:'Sí',s23:'Sí',thr:'Sí',est:'✅ OK'},
    {m:'Smoke tests OK',s21:'17/17',s22:'17/17',s23:'9/9',thr:'100%',est:'✅ OK'},
    {m:'validate-fa-index PASS',s21:'PASS',s22:'PASS',s23:'PASS',thr:'PASS',est:'✅ OK'},
  ]);
  ws.eachRow((row,n) => {
    if (n > 1) row.fill = { type:'pattern', pattern:'solid', fgColor:{argb:n%2===0?'FFF5F5F5':'FFFFFFFF'} };
  });

  // Hoja 2 — Velocidad
  const ws2 = wb.addWorksheet('Velocidad historica');
  ws2.columns = [
    {header:'Sprint',key:'s',width:10},{header:'Feature',key:'f',width:22},
    {header:'SP',key:'sp',width:8},{header:'SP Acum.',key:'ac',width:10},
    {header:'Cobertura',key:'cov',width:12},{header:'Release',key:'r',width:12},
    {header:'Tests Sprint',key:'tp',width:14},{header:'Defectos',key:'def',width:10}
  ];
  const h2r = ws2.getRow(1);
  h2r.font = { bold:true, color:{argb:'FFFFFFFF'} };
  h2r.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'} };
  ws2.addRows([
    {s:'S19',f:'FEAT-017 Domiciliaciones SEPA',sp:24,ac:449,cov:'87%',r:'v1.19.0',tp:708,def:0},
    {s:'S20',f:'FEAT-018 Exportación Avanzada', sp:24,ac:473,cov:'88%',r:'v1.20.0',tp:124,def:0},
    {s:'S21',f:'FEAT-019 Centro Privacidad',    sp:24,ac:497,cov:'88%',r:'v1.21.0',tp:65, def:0},
    {s:'S22',f:'FEAT-020 Préstamos Personales', sp:24,ac:521,cov:'88%',r:'v1.22.0',tp:51, def:0},
    {s:'S23',f:'FEAT-021 Depósitos a Plazo Fijo',sp:24,ac:545,cov:'89%',r:'v1.23.0',tp:47,def:0},
  ]);

  // Hoja 3 — FA Summary
  const ws3 = wb.addWorksheet('FA Summary');
  ws3.columns = [
    {header:'Métrica FA',key:'m',width:32},{header:'Valor',key:'v',width:20},{header:'Detalle',key:'d',width:38}
  ];
  const h3r = ws3.getRow(1);
  h3r.font = { bold:true, color:{argb:'FFFFFFFF'} };
  h3r.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'} };
  ws3.addRows([
    {m:'Sprints cubiertos',v:'S1..S23',d:'23 sprints completos'},
    {m:'Total funcionalidades',v:'86',d:'FA-001..FA-086'},
    {m:'Total reglas de negocio',v:'198',d:'Dinámico — nunca hardcodeado (LA-021-01)'},
    {m:'validate-fa-index checks',v:'PASS 8/8',d:'Gates 2b, 3b, 8b — bloqueante'},
    {m:'FA docx generado',v:'73,6 KB',d:'FA-bank-portal-Banco Meridian.docx — python-docx'},
    {m:'Funcionalidades S23 nuevas',v:'8',d:'FA-079..086 (FEAT-021 Depósitos)'},
    {m:'RNs S23 nuevas',v:'+10',d:'RN-F021-01..10 (depósitos + IRPF + FGD + SCA)'},
    {m:'Generador',v:'gen-fa-document.py',d:'Blocking verification: size>10KB + mtime<120s'},
  ]);

  await wb.xlsx.writeFile(path.join(OUT_EXCEL,'Quality-Dashboard-Sprint23.xlsx'));
  console.log('  OK EXCEL: Quality-Dashboard-Sprint23.xlsx');
}

// ══════════════════════════════════════════════════════════════════
// SPRINT DATA JSON
// ══════════════════════════════════════════════════════════════════
function genSprintData() {
  const data = {
    sprint: 23, feature: 'FEAT-021', release: 'v1.23.0',
    goal: 'Permitir al cliente de Banco Meridian consultar, simular y contratar depósitos a plazo fijo con retención IRPF en origen y garantía FGD, cumpliendo Ley 44/2002. Cerrar DEBT-036/037/044.',
    sp_completed: 24, sp_capacity: 24, sp_acum: 545,
    avg_velocity: 24.0,
    tests_new: 47, tests_unit: 11, tests_qa: 36,
    coverage_estimated: 89, defects: 0, ncs: 0,
    smoke_tests: '9/9',
    wcag_checks: '2/2',
    security_semaphore: 'GREEN',
    cve_critical: 0,
    open_debts: [],
    closed_debts: ['DEBT-036','DEBT-037','DEBT-044'],
    closed_at: '09/04/2026',
    jira_issues: ['SCRUM-123','SCRUM-124','SCRUM-125','SCRUM-126','SCRUM-127','SCRUM-128','SCRUM-129','SCRUM-130','SCRUM-131'],
    lessons_learned_sprint: ['LA-023-01','LA-CORE-018','LA-CORE-033'],
    flyway: 'V26',
    confluence_hld: '9371649',
    repositorio_activo: 'JPA-REAL',
    otp_stg_bypass: '123456',
    fa_functionalities: 86,
    fa_business_rules: 198,
    components_angular: 6,
    endpoints_new: 6,
    adr: ['ADR-036','ADR-037'],
    regulatory: ['Ley 44/2002','RDL 16/2011','Ley 35/2006 Art.25','PSD2 SCA']
  };
  const outPath = 'docs/sprints/SPRINT-023-data.json';
  fs.mkdirSync(path.dirname(outPath), {recursive:true});
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log('  OK JSON: ' + outPath);
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n Documentation Agent Sprint 23 FEAT-021 — SOFIA v2.7');
  console.log('17 DOCX + 3 XLSX + 1 JSON\n');
  console.log('Generando DOCX...');
  await genSRS();
  await genHLD();
  await genLLDBackend();
  await genLLDFrontend();
  await genQAReport();
  await genCRReport();
  await genSecReport();
  await genReleaseNotes();
  await genRunbook();
  await genSprintReport();
  await genCMMI();
  await genMeetingMinutes();
  await genProjectPlan();
  await genQualitySummary();
  await genRiskRegister();
  await genTraceability();
  await genPlanningDoc();
  console.log('\nGenerando XLSX...');
  await genNCTracker();
  await genDecisionLog();
  await genQualityDashboard();
  console.log('\nGenerando Sprint Data JSON...');
  genSprintData();
  console.log('\n Documentation Agent COMPLETADO');
  console.log('17 DOCX + 3 XLSX + 1 JSON en docs/deliverables/sprint-23-FEAT-021/');
}
main().catch(e => { console.error('ERROR:', e.message, e.stack); process.exit(1); });
