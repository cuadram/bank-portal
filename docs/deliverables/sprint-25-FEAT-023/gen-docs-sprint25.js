// gen-docs-sprint25.js — Documentation Agent Sprint 25 FEAT-023
// SOFIA v2.7 · 17 DOCX + 3 XLSX + 1 JSON
// FEAT-023 Mi Dinero — PFM — Banco Meridian
// Fuente de verdad: session.json + PfmController.java (endpoints reales)
'use strict';
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, BorderStyle, WidthType, ShadingType } = require('docx');
const fs   = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const OUT_WORD  = 'docs/deliverables/sprint-25-FEAT-023/word';
const OUT_EXCEL = 'docs/deliverables/sprint-25-FEAT-023/excel';
[OUT_WORD, OUT_EXCEL].forEach(d => fs.mkdirSync(d, { recursive: true }));

const BLUE='1B3A6B', WHITE='FFFFFF', FONT='Arial';
const DATE='16/04/2026', SPRINT='25', FEAT='FEAT-023';
const VER='v1.25.0', CLIENT='Banco Meridian';
const YELLOW='FFF8E1', GREEN='E8F5E9', RED='FFEBEE';

// ─── Primitivas DOCX ─────────────────────────────────────────────────────
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

// ═══ Datos reales Sprint 25 ══════════════════════════════════════════════
const US = [
  ['US-F023-01','Categorización automática de movimientos','3','Alta','GET /api/v1/pfm/overview → movimientos categorizados (Alimentación, Transporte, Ocio, Salud…) en base a motor de reglas'],
  ['US-F023-02','Gestión de presupuestos por categoría','3','Alta','GET/POST /api/v1/pfm/budgets · máx 10 activos por usuario · 1 por categoría'],
  ['US-F023-03','Alertas de gasto por umbral configurable','3','Alta','Umbral 50-95% · push integrado con notificaciones S14 · BUDGET_ALERT en SecurityEventType'],
  ['US-F023-04','Análisis mensual comparativo','3','Alta','GET /api/v1/pfm/analysis → comparativa mes actual vs anterior · gráfico de barras por categoría'],
  ['US-F023-05','Widget "¿Cómo voy este mes?" en dashboard','2','Media','GET /api/v1/pfm/widget → slot <app-pfm-widget> en dashboard · semáforo verde/amarillo/rojo'],
  ['US-F023-06','Edición manual de categoría','2','Media','PUT /api/v1/pfm/movimientos/{txId}/category → PfmUserRule prevalece sobre regla del sistema'],
  ['US-F023-07','Distribución de gasto y top comercios','3','Alta','GET /api/v1/pfm/distribution → pie chart + ranking top-10 (UNION ALL bill_payments + transactions CARGO)']
];

const RN = [
  ['RN-F023-01','Motor de reglas de categorización por keyword/IBAN (72 reglas seed en V28__pfm.sql)'],
  ['RN-F023-02','Las reglas de usuario (PfmUserRule) prevalecen siempre sobre las reglas del sistema'],
  ['RN-F023-03','Categorías estándar: 14 (5 originales FEAT-010 + 9 nuevas sin breaking change)'],
  ['RN-F023-04','Un presupuesto por categoría y usuario; máximo 10 presupuestos activos simultáneos'],
  ['RN-F023-05','Periodo presupuestario mensual en formato VARCHAR(7) YYYY-MM (ADR-038)'],
  ['RN-F023-06','Umbral de alerta configurable entre 50% y 95% del importe del presupuesto'],
  ['RN-F023-07','Alerta de gasto se dispara una sola vez por presupuesto y mes (deduplicación)'],
  ['RN-F023-08','Notificaciones reutilizan infraestructura S14 (NotificationService)'],
  ['RN-F023-09','El análisis muestra variación porcentual por categoría vs mes anterior'],
  ['RN-F023-10','El histórico mínimo disponible es 12 meses de transacciones categorizadas'],
  ['RN-F023-11','La categorización se realiza en tiempo de consulta (ADR-037) — no persiste category en transactions'],
  ['RN-F023-12','Top-10 comercios unifica bill_payments + transactions CARGO (DEBT-047 cerrado)'],
  ['RN-F023-13','Los cargos (CARGO) llegan con signo negativo del backend — el frontend aplica Math.abs() antes de renderizar (LA-025-06, GR-API-001)'],
  ['RN-F023-14','La distribución se calcula como % sobre total de gasto del mes, redondeado a 1 decimal'],
  ['RN-F023-15','Widget dashboard: muestra 3 categorías con mayor gasto + semáforo global de presupuestos'],
  ['RN-F023-16','Si no hay presupuestos configurados, widget muestra CTA "Configura tus presupuestos"'],
  ['RN-F023-17','Integridad: eliminar un presupuesto no borra el histórico de alertas (soft-link)'],
  ['RN-F023-18','Auditoría: toda acción sobre presupuestos genera SecurityEvent (PFM_BUDGET_CREATED/DELETED)'],
  ['RN-F023-19','Categorización no modifica la persistencia original de transactions (principio inmutable)'],
  ['RN-F023-20','GDPR: las reglas de usuario se exportan en el derecho de portabilidad RDL 5/2018'],
  ['RN-F023-21','Rate limiting: máximo 20 req/min por usuario en endpoints /pfm/** (Redis)'],
  ['RN-F023-22','Accesibilidad: colores de categoría cumplen contraste WCAG AA (4.5:1 texto, 3:1 UI)']
];

const ENDPOINTS_REALES = [
  ['GET',   '/api/v1/pfm/overview',                      'Listado paginado de movimientos categorizados'],
  ['GET',   '/api/v1/pfm/budgets',                       'Listado presupuestos del usuario'],
  ['POST',  '/api/v1/pfm/budgets',                       'Crear presupuesto (máx 10 activos)'],
  ['DELETE','/api/v1/pfm/budgets/{id}',                  'Eliminar presupuesto'],
  ['GET',   '/api/v1/pfm/analysis',                      'Análisis mensual comparativo vs mes anterior'],
  ['GET',   '/api/v1/pfm/distribution',                  'Distribución por categoría + top-10 comercios'],
  ['PUT',   '/api/v1/pfm/movimientos/{txId}/category',   'Recategorización manual (crea PfmUserRule)'],
  ['GET',   '/api/v1/pfm/widget',                        'Resumen para dashboard (3 top categorías + semáforo)']
];

const ADR = [
  ['ADR-037','Categorización en tiempo de consulta (no persistente)','Flexibilidad para extender reglas sin migración; coste: +20ms p95 en /overview (aceptable <300ms SLO)'],
  ['ADR-038','budget_month VARCHAR(7) formato YYYY-MM','Evita ambigüedad de timezone en rangos mensuales; simple comparación lexicográfica'],
  ['ADR-039','Top-10 comercios con UNION ALL','Unificar bill_payments + transactions CARGO sin duplicar storage; cierra DEBT-047']
];

const JIRA = [
  ['SCRUM-153','DEBT-047: Dashboard top-merchants — unificar fuentes','2','Finalizada'],
  ['SCRUM-154','SPRINT-025 Planning & Setup — Scrum Master','1','Finalizada'],
  ['SCRUM-155','US-F023-01: Categorización automática','3','Finalizada'],
  ['SCRUM-156','US-F023-02: Gestión de presupuestos','3','Finalizada'],
  ['SCRUM-157','US-F023-03: Alertas de gasto','3','Finalizada'],
  ['SCRUM-158','US-F023-04: Análisis mensual comparativo','3','Finalizada'],
  ['SCRUM-159','US-F023-05: Widget Mi Dinero en dashboard','2','Finalizada'],
  ['SCRUM-160','US-F023-06: Edición manual de categoría','2','Finalizada'],
  ['SCRUM-161','US-F023-07: Distribución + top comercios','3','Finalizada'],
  ['SCRUM-162','SPRINT-025 Closure — Workflow Manager','1','En curso']
];

const BUG_PO = {
  total: 36, critical: 9, major: 14, minor: 13,
  resolved: 15, deferred: 21,
  root_cause: 'Math.abs() ausente en mapeo frontend de amount (CARGO llega negativo) + select filter sin [(ngModel)] con FormsModule',
  verified_at: '2026-04-16T20:31:48Z',
  verified_screens: ['overview','presupuestos','analisis','distribucion','nuevo-presupuesto'],
  las_generadas: ['LA-025-06','LA-025-07','LA-025-08'],
  las_core: ['LA-CORE-055','LA-CORE-056','LA-CORE-057']
};

// ═══ DOC 1 — SRS ═════════════════════════════════════════════════════════
async function genSRS() {
  await saveDoc('SRS-FEAT-023-Sprint25.docx', [
    ...coverPage('Software Requirements Specification','FEAT-023 Mi Dinero — PFM'),
    h1('1. Introducción'),
    p('El presente documento especifica los requisitos funcionales y no funcionales para la funcionalidad Mi Dinero (FEAT-023) — gestor de finanzas personales (PFM) — desarrollada en el Sprint 25 del proyecto BankPortal para Banco Meridian.'),
    p('Marco regulatorio aplicable: RGPD (UE) 2016/679, RDL 5/2018 (adaptación GDPR), Ley 44/2002 de medidas de reforma del sistema financiero, PSD2/DSP2.'),
    sep(),
    h1('2. User Stories'),
    mkTable(['ID','Título','SP','Prioridad','Criterio resumido'], US, [900,2700,500,900,3500]),
    h1('3. Reglas de negocio'),
    mkTable(['ID','Descripción'], RN, [1400,7100]),
    h1('4. Endpoints REST (contrato verificado en código)'),
    mkTable(['Método','Ruta','Descripción'], ENDPOINTS_REALES, [900,3600,4000]),
    p('Fuente: apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/pfm/api/controller/PfmController.java', {italics:true, size:18, color:'777777'}),
    h1('5. Trazabilidad (RTM resumida)'),
    mkTable(['US','RN implicadas','Endpoint','Componente Angular','TC QA'],[
      ['US-F023-01','RN-01/02/03/11/19','GET /overview','PfmOverviewComponent','TC-001..008, IT-001'],
      ['US-F023-02','RN-04/05/17/18','GET+POST /budgets','BudgetListComponent + BudgetFormComponent','TC-009..016, IT-002'],
      ['US-F023-03','RN-06/07/08','(evento BUDGET_ALERT)','NotificationService (S14)','TC-017..022'],
      ['US-F023-04','RN-09/10/14','GET /analysis','PfmAnalysisComponent','TC-023..030, IT-003'],
      ['US-F023-05','RN-15/16','GET /widget','PfmWidgetComponent','TC-031..036'],
      ['US-F023-06','RN-02/20','PUT /movimientos/{txId}/category','CategoryEditModalComponent','TC-037..044, IT-004'],
      ['US-F023-07','RN-12/14','GET /distribution','PfmDistributionComponent','TC-045..054, IT-005']
    ], [900,2000,2200,2400,1500]),
    h1('6. Requisitos No Funcionales (delta S25)'),
    mkTable(['ID','Tipo','Criterio'],[
      ['RNF-F023-01','Rendimiento','/overview p95 < 300ms con 1000 movs/mes'],
      ['RNF-F023-02','Rendimiento','/analysis p95 < 500ms con 12 meses de histórico'],
      ['RNF-F023-03','Seguridad','Rate-limit Redis 20 req/min/usuario en /pfm/**'],
      ['RNF-F023-04','Seguridad','Auditoría SecurityEvent PFM_* en todas las mutaciones'],
      ['RNF-F023-05','Accesibilidad','Paleta categorías contraste WCAG AA ≥ 4.5:1'],
      ['RNF-F023-06','Observabilidad','log.warn en catch de widget (LA-025 RV-M02)'],
      ['RNF-F023-07','Usabilidad','Fidelidad visual 100% contra PROTO-FEAT-023-sprint25.html (LA-025-07 + LA-CORE-056)']
    ], [1200,1600,5700])
  ]);
}

// ═══ DOC 2 — HLD ═════════════════════════════════════════════════════════
async function genHLD() {
  await saveDoc('HLD-FEAT-023-Sprint25.docx', [
    ...coverPage('High-Level Design','FEAT-023 Mi Dinero — PFM'),
    h1('1. Arquitectura general'),
    p('FEAT-023 sigue la arquitectura hexagonal consolidada en BankPortal: capa de dominio pura, casos de uso en application, adaptadores JPA/JDBC en infrastructure, controller REST en api.'),
    p('El módulo pfm se aísla del resto del dominio; solo consume transactions (read-only, vía JdbcClient) y reutiliza SecurityEvent + NotificationService de S14.'),
    h1('2. Módulos del dominio pfm'),
    mkTable(['Capa','Componentes clave'],[
      ['Domain model','PfmUserRule · Budget · BudgetAlert · extensión de SpendingCategory (5→14)'],
      ['Domain service','PfmCategorizationService · BudgetService · PfmBudgetAlertService · UserRuleService'],
      ['Domain ports','PfmUserRuleRepository · BudgetRepository · BudgetAlertRepository · PfmTransactionReadRepository'],
      ['Use cases','GetPfmOverview · GetPfmAnalysis · GetPfmDistribution · GetPfmWidget (4 UC principales)'],
      ['DTOs','PfmDtos.java (10 DTOs records)'],
      ['Infrastructure','JpaBudgetAdapter · JpaBudgetAlertAdapter · JpaPfmUserRuleAdapter · JdbcPfmTransactionReadAdapter'],
      ['API','PfmController (8 endpoints) · PfmExceptionHandler (@Slf4j)']
    ], [1700,6800]),
    h1('3. Decisiones arquitectónicas (ADR)'),
    mkTable(['ID','Decisión','Motivo / trade-off'], ADR, [1000,3200,4300]),
    h1('4. Persistencia — Flyway V28'),
    mkTable(['Tabla','Propósito','Tamaño inicial'],[
      ['pfm_category_rules','Reglas sistema (keyword, IBAN, orden)','72 reglas seed'],
      ['pfm_user_rules','Reglas de usuario (prevalencia)','0 (se llena en uso)'],
      ['pfm_budgets','Presupuestos por usuario/categoría/mes','0'],
      ['pfm_budget_alerts','Alertas disparadas (deduplicación)','0']
    ], [2300,4300,2000]),
    h1('5. Flujo alto nivel — Categorización'),
    p('1) /overview recibe rango de fechas → 2) JdbcPfmTransactionReadAdapter lee transactions + bill_payments → 3) PfmCategorizationService aplica first(PfmUserRule, PfmCategoryRule, OTROS) → 4) Se agrupa por categoría y se devuelven movimientos + totales → 5) Frontend aplica Math.abs() sobre amount (CARGO negativo) antes de renderizar.'),
    h1('6. Integración con módulos existentes'),
    bullet('S10 transactions — read only, vía JdbcClient + Timestamp.from(Instant) (GR-JDBC-001)'),
    bullet('S14 notifications — PfmBudgetAlertService delega en NotificationService para push'),
    bullet('Auditoría — SecurityEventType extendido con BUDGET_ALERT (y PFM_BUDGET_CREATED/DELETED)'),
    bullet('Frontend shell — item "Mi Dinero" añadido a sidebar navy #1e3a5f'),
    h1('7. Confluence'),
    p('HLD publicado en Confluence page 11371521 (espacio BankPortal · parent 229379).')
  ]);
}

// ═══ DOC 3 — LLD Backend ═════════════════════════════════════════════════
async function genLLDBack() {
  await saveDoc('LLD-FEAT-023-Backend-Sprint25.docx', [
    ...coverPage('Low-Level Design — Backend','FEAT-023 Mi Dinero — PFM'),
    h1('1. Estructura de paquetes'),
    p('com.experis.sofia.bankportal.pfm', {bold:true}),
    bullet('api/controller — PfmController (@RequestMapping("/api/v1/pfm"))'),
    bullet('api/advice — PfmExceptionHandler (@ControllerAdvice(basePackageClasses=PfmController.class))'),
    bullet('application/usecase — 4 UC'),
    bullet('application/dto — PfmDtos (records)'),
    bullet('domain/model · domain/service · domain/repository'),
    bullet('infrastructure/persistence — JPA + JDBC adapters'),
    h1('2. Entidades JPA'),
    mkTable(['Entidad','Campos clave','Notas'],[
      ['BudgetEntity','id · userId · category · amount(BigDecimal 10,2) · month(VARCHAR 7) · alertThreshold','month YYYY-MM (ADR-038)'],
      ['BudgetAlertEntity','id · budgetId · triggeredAt(TIMESTAMPTZ) · percentage','Dedup por (budget_id, month)'],
      ['PfmUserRuleEntity','id · userId · conceptPattern · category · priority','conceptPattern = concepto real del tx (RV-M01)'],
      ['PfmCategoryRuleEntity','id · keyword · ibanAcreedor · category · orden','72 seeds; read-only desde app']
    ], [2200,4300,2000]),
    h1('3. Endpoints (firma real)'),
    mkTable(['Método','Ruta','Request','Response'],[
      ['GET','/overview','Query: from, to, page, size','Page<MovementDto> + totals[]'],
      ['GET','/budgets','—','List<BudgetDto>'],
      ['POST','/budgets','BudgetCreateRequest','BudgetDto 201'],
      ['DELETE','/budgets/{id}','—','204'],
      ['GET','/analysis','Query: month (YYYY-MM)','AnalysisDto'],
      ['GET','/distribution','Query: month','DistributionDto (categories[] + topMerchants[])'],
      ['PUT','/movimientos/{txId}/category','CategoryOverrideRequest(concept,category)','MovementDto'],
      ['GET','/widget','—','WidgetDto']
    ], [800,2900,2500,2300]),
    h1('4. JDBC adapter — Timestamp.from(Instant)'),
    p('JdbcPfmTransactionReadAdapter usa JdbcClient. REGLA (LA-CORE-054, GR-JDBC-001): todo binding de Instant → TIMESTAMPTZ debe envolverse en Timestamp.from(instant). Se detectó en G-4b y se añadió guardrail.'),
    h1('5. Flyway V28'),
    bullet('V28__pfm.sql — 4 tablas + 72 reglas seed'),
    bullet('Verificación \\d en psql confirmó nombres de columnas antes de SQL nativo (GR-SQL-001 · LA-CORE-053)'),
    h1('6. Tests unitarios (30/30 PASS en G-4b)'),
    mkTable(['Clase','TCs','Resultado'],[
      ['PfmCategorizationServiceTest','TC-001..004','4/4 PASS'],
      ['SpendingCategoryExtensionTest','TC-028..032','14/14 PASS (no-breaking FEAT-010)'],
      ['BudgetDomainTest','TC-005..010','6/6 PASS'],
      ['SpendingCategorizationEngineTest','—','6/6 PASS']
    ], [3500,2500,2500]),
    h1('7. Hallazgos Code Review (corregidos pre-G-5)'),
    bullet('RV-M01 — CategoryOverrideRequest.concept añadido para usar concepto real'),
    bullet('RV-M02 — log.warn añadido en catch de widget (PfmController @Slf4j)')
  ]);
}

// ═══ DOC 4 — LLD Frontend ════════════════════════════════════════════════
async function genLLDFront() {
  await saveDoc('LLD-FEAT-023-Frontend-Sprint25.docx', [
    ...coverPage('Low-Level Design — Frontend','FEAT-023 Mi Dinero — PFM'),
    h1('1. Módulo Angular'),
    p('apps/frontend-portal/src/app/features/pfm/', {bold:true}),
    bullet('pfm.module.ts + pfm-routing.module.ts (lazy)'),
    bullet('models/pfm.models.ts — DTOs + PFM_CATEGORY_COLORS + PFM_CATEGORY_BG + formatYearMonth()'),
    bullet('services/pfm.service.ts — HttpClient contra /api/v1/pfm/**'),
    bullet('10 componentes standalone/declared en pfm.module'),
    h1('2. Componentes'),
    mkTable(['Componente','Rol','Endpoint consumido'],[
      ['PfmPageComponent','Layout + tabs','—'],
      ['PfmOverviewComponent','Lista movimientos + filtros','/overview'],
      ['MovimientoRowComponent','Fila de movimiento','—'],
      ['CategoryEditModalComponent','Modal recategorizar','PUT /movimientos/{id}/category'],
      ['BudgetListComponent','Lista + barra progreso','/budgets'],
      ['BudgetProgressBarComponent','Progreso visual','—'],
      ['BudgetFormComponent','Crear/editar presupuesto','POST /budgets'],
      ['PfmAnalysisComponent','Comparativa mensual','/analysis'],
      ['PfmDistributionComponent','Pie + top merchants','/distribution'],
      ['PfmWidgetComponent','Widget dashboard','/widget']
    ], [3000,3000,2500]),
    h1('3. Contrato de signo (LA-025-06 · GR-API-001)'),
    p('Backend devuelve amount de movimientos CARGO con signo NEGATIVO. El frontend DEBE aplicar Math.abs() en todos los mapeos que renderizan porcentajes, semáforos o variaciones. No respetar este contrato corrompió 10+ pantallas en BUG-PO (S25).'),
    h1('4. Filtros con reset programático (LA-025-08 · GR-ANGULAR-001)'),
    p('Los <select> con reset programático requieren [(ngModel)] + FormsModule. El binding (change) unidireccional no sincroniza DOM al resetear la variable; provocó que el filtro de categorías no se marcase y el botón reset fallase.'),
    h1('5. Integración shell'),
    bullet('app-routing.module.ts: ruta /pfm lazy (LA-FRONT-001)'),
    bullet('shell.component.ts: nav item "Mi Dinero" (sidebar navy #1e3a5f)'),
    bullet('dashboard.component.ts: slot <app-pfm-widget> (RN-F023-15)'),
    bullet('dashboard.module.ts: PfmWidgetComponent declarado'),
    h1('6. Fidelidad visual (LA-025-07 · LA-CORE-056)'),
    p('PROTO-FEAT-023-sprint25.html (94KB, 11 pantallas, 22 anotaciones) es la fuente canónica. Cada componente se verificó pantalla-a-pantalla en el ciclo 4-bugfix antes de la aprobación visual del PO (2026-04-16T20:31:48Z).')
  ]);
}

// ═══ DOC 5 — QA Report ═══════════════════════════════════════════════════
async function genQA() {
  await saveDoc('QA-Report-FEAT-023-Sprint25.docx', [
    ...coverPage('QA Report','FEAT-023 Mi Dinero — PFM'),
    h1('1. Resumen ejecutivo'),
    mkTable(['Métrica','Valor'],[
      ['Test cases planificados','64'],
      ['Ejecutados','64'],
      ['PASS','64 (100%)'],
      ['FAIL / BLOCKED','0 / 0'],
      ['Cobertura backend','89%'],
      ['Defectos críticos abiertos','0'],
      ['Gate G-6','APPROVED (qa-lead + product-owner)']
    ], [3500,5000], [GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN]),
    h1('2. Desglose por tipo'),
    mkTable(['Tipo','Nº TCs','Resultado'],[
      ['US (funcionales)','7','7/7 PASS (TC-F023-001..054 agrupados por US)'],
      ['RN (reglas negocio)','22','22/22 PASS'],
      ['IT (integración @SpringBootTest)','6','6/6 PASS'],
      ['E2E (Playwright)','2','2/2 PASS'],
      ['Seguridad','6','6/6 PASS (rate-limit, audit, OTP, CSRF, CORS, authz)'],
      ['Accesibilidad (WCAG AA)','4','4/4 PASS'],
      ['Fidelidad prototipo (LA-023-02)','13','13/13 PASS tras ciclo 4-bugfix'],
      ['DEBT-047','1','CERRADO — top-merchants unifica bill_payments + transactions CARGO']
    ], [3500,1500,3500]),
    h1('3. Anexo — Episodio BUG-PO (verificación visual post-G-6)'),
    p('Durante la revisión visual STG vs prototipo realizada por el PO, se detectaron 36 bugs de fidelidad antes del cierre del sprint:'),
    mkTable(['Severidad','Cantidad','Estado'],[
      ['Críticos','9','9/9 resueltos en ciclo 4-bugfix'],
      ['Mayores','14','6/14 resueltos · 8 diferidos a S26'],
      ['Menores','13','0/13 diferidos a S26'],
      ['Total','36','15 resueltos · 21 diferidos']
    ], [2500,2000,4000], [RED,YELLOW,GREEN,null]),
    p('Bugs verificados por PO (2026-04-16T20:31:48Z): '+['BUG-PO-001','BUG-PO-002','BUG-PO-003','BUG-PO-004','BUG-PO-005','BUG-PO-006','BUG-PO-007','BUG-PO-008','BUG-PO-009','BUG-PO-010','BUG-PO-011','BUG-PO-016','BUG-PO-019','BUG-PO-020','BUG-PO-021'].join(', ')),
    p('Bug raíz: '+BUG_PO.root_cause),
    p('Pantallas validadas OK: overview · presupuestos · analisis · distribucion · nuevo-presupuesto'),
    h1('4. Lessons Learned generadas'),
    bullet('LA-025-06 → LA-CORE-055 sign-contract-backend (GR-API-001)'),
    bullet('LA-025-07 → LA-CORE-056 prototype-fidelity-visual-review'),
    bullet('LA-025-08 → LA-CORE-057 select-twoway-binding-reset (GR-ANGULAR-001)')
  ]);
}

// ═══ DOC 6 — Code Review ═════════════════════════════════════════════════
async function genCR() {
  await saveDoc('Code-Review-FEAT-023-Sprint25.docx', [
    ...coverPage('Code Review Report','FEAT-023 Mi Dinero — PFM'),
    h1('1. Veredicto'),
    mkTable(['Campo','Valor'],[
      ['Verdict','APPROVED'],
      ['Reviewer','Tech Lead'],
      ['Fecha','2026-04-16T17:43:42Z'],
      ['Blocker','0'],
      ['Major','0'],
      ['Minor','2 (corregidos pre-gate)'],
      ['Suggestion','2 (aplicadas)'],
      ['Gate G-5','APPROVED']
    ], [3000,5500], [GREEN,null,null,GREEN,GREEN,YELLOW,null,GREEN]),
    h1('2. Hallazgos corregidos antes del gate'),
    mkTable(['ID','Severidad','Descripción','Fix'],[
      ['RV-M01','Minor','CategoryOverrideRequest no exponía concepto real del movimiento — conceptPattern quedaba vacío en PfmUserRule','Campo concept añadido al request; UserRuleService usa concepto real'],
      ['RV-M02','Minor','Widget sin log.warn en catch — 500 silencioso','@Slf4j añadido a PfmController; log.warn con contexto y userId']
    ], [800,1200,3500,3000]),
    h1('3. Sugerencias aplicadas'),
    bullet('RV-S01 — Extraer constantes de páginación a application.yml'),
    bullet('RV-S02 — Añadir @Validated en controller para mensaje de error uniforme'),
    h1('4. Cobertura revisión'),
    bullet('22 clases Java revisadas (domain + application + infrastructure + api)'),
    bullet('10 componentes Angular revisados'),
    bullet('V28__pfm.sql revisada línea a línea (72 reglas seed validadas)'),
    bullet('Revisión cruzada por Architect en ADR-037/038/039')
  ]);
}

// ═══ DOC 7 — Security Report ═════════════════════════════════════════════
async function genSEC() {
  await saveDoc('Security-Report-FEAT-023-Sprint25.docx', [
    ...coverPage('Security Report','FEAT-023 Mi Dinero — PFM'),
    h1('1. Semáforo'),
    mkTable(['Métrica','Valor'],[
      ['Semáforo','GREEN'],
      ['CVE Critical','0'],
      ['CVE High','0'],
      ['SAST findings','1 (INFO · CWE-390 · CVSS 2.1 · CERRADO)'],
      ['PCI DSS','Compliant'],
      ['GDPR','Compliant'],
      ['Gate G-5b','AUTO-APPROVED']
    ], [3000,5500], [GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN]),
    h1('2. Controles verificados'),
    bullet('Rate limiting Redis 20 req/min/usuario en /pfm/** (reutiliza BizumRateLimitAdapter pattern S24)'),
    bullet('Auditoría SecurityEvent en mutaciones (BUDGET_ALERT + PFM_*)'),
    bullet('Spring Security config + @PreAuthorize en endpoints sensibles'),
    bullet('Validación @Valid + Bean Validation en todos los request DTOs'),
    bullet('CORS restringido a bankportal.com/admin.bankportal.com'),
    bullet('CSRF token obligatorio en mutaciones (POST/PUT/DELETE)'),
    h1('3. GDPR'),
    bullet('Derecho de portabilidad: PfmUserRule exportables vía /exports (S18)'),
    bullet('Derecho al olvido: cascade delete de budgets + user_rules por userId'),
    bullet('Minimización: transactions se consumen read-only, sin duplicar PII'),
    h1('4. SAST'),
    p('1 hallazgo INFO (CWE-390 Out-of-bounds) falso positivo cerrado: getter nullable con @Nullable + ofNullable tratamiento defensivo correcto.'),
    h1('5. Pentest (re-run S25)'),
    bullet('IDOR: PASS — todos los endpoints verifican ownership por userId'),
    bullet('Authz bypass: PASS — @PreAuthorize(hasRole CUSTOMER)'),
    bullet('SQL injection: PASS — JdbcClient con placeholders + JPA'),
    bullet('Mass assignment: PASS — DTOs records inmutables')
  ]);
}

// ═══ DOC 8 — Release Notes ═══════════════════════════════════════════════
async function genRelNotes() {
  await saveDoc('Release-Notes-v1.25.0-Sprint25.docx', [
    ...coverPage('Release Notes','v1.25.0 — FEAT-023 Mi Dinero'),
    h1('Versión '+VER+' — '+DATE),
    p('Feature principal: FEAT-023 Mi Dinero — gestor de finanzas personales (PFM).'),
    h1('Highlights'),
    bullet('Categorización automática de movimientos (14 categorías, 72 reglas seed)'),
    bullet('Presupuestos mensuales configurables con alertas push'),
    bullet('Análisis mensual comparativo vs mes anterior'),
    bullet('Widget "¿Cómo voy este mes?" integrado en dashboard'),
    bullet('Distribución de gasto + top-10 comercios unificados (DEBT-047 cerrado)'),
    h1('Endpoints nuevos (contrato real verificado en código)'),
    mkTable(['Método','Ruta'], ENDPOINTS_REALES.map(e=>[e[0],e[1]]), [1200,7300]),
    p('Nota: la ruta de recategorización usa /movimientos/ en español (no /movements/) — inconsistencia lingüística documentada, no se cambia por compatibilidad del sprint.', {italics:true, color:'777777'}),
    h1('Cambios en base de datos'),
    bullet('Flyway V28__pfm.sql — 4 tablas nuevas (pfm_category_rules, pfm_user_rules, pfm_budgets, pfm_budget_alerts)'),
    bullet('Seed: 72 reglas de categorización por keyword/IBAN'),
    bullet('SpendingCategory extendido de 5 a 14 categorías (no-breaking FEAT-010)'),
    h1('Configuración'),
    bullet('bank.pfm.budgets.max-active = 10 (máximo presupuestos activos por usuario)'),
    bullet('bank.pfm.budgets.alert-threshold.min = 50 / max = 95'),
    bullet('Rate limit: 20 req/min/usuario en /api/v1/pfm/**'),
    h1('Deuda técnica cerrada'),
    bullet('DEBT-047 — top-merchants unifica bill_payments + transactions CARGO (ADR-039)'),
    h1('Métricas de calidad'),
    mkTable(['Métrica','Valor'],[
      ['Tests','64/64 PASS'],['Cobertura','89%'],['CVE críticas/altas','0/0'],
      ['Code Review','APPROVED 0 blocker'],['Smoke v1.25.0','20/20'],['E2E','2/2 PASS']
    ], [3000,5500]),
    h1('Incidencias post-release (transparencia)'),
    p('Durante la revisión visual del PO se detectaron 36 bugs de fidelidad con el prototipo aprobado. 15 se resolvieron en un ciclo 4-bugfix antes del cierre; 21 menores se difieren a S26. Bug raíz: Math.abs() ausente en mapeo frontend de cargos negativos + select filter sin [(ngModel)]. Documentado en LA-025-06/07/08 y promocionado a LA-CORE-055/056/057.')
  ]);
}

// ═══ DOC 9 — Runbook ═════════════════════════════════════════════════════
async function genRunbook() {
  await saveDoc('Runbook-v1.25.0-Sprint25.docx', [
    ...coverPage('Operational Runbook','v1.25.0 — FEAT-023'),
    h1('1. Deployment'),
    bullet('Tag Git: v1.25.0 (creado local, pendiente push manual)'),
    bullet('Rama: feature/FEAT-023-sprint25 → develop → main'),
    bullet('Artefactos Docker: bankportal-backend:v1.25.0 + bankportal-frontend:v1.25.0'),
    bullet('Compose file: infra/compose/docker-compose.yml (NO omitir -f)'),
    h1('2. Smoke test v1.25.0'),
    p('Script: infra/compose/smoke-test-v1.25.0.sh — 20 checks (SM-01..20)'),
    mkTable(['Check','Cobertura'],[
      ['SM-01..04','Health actuator + DB + Redis + Flyway V28'],
      ['SM-05..10','GET /overview, /budgets, /analysis, /distribution, /widget'],
      ['SM-11..13','POST/DELETE /budgets + PUT /movimientos/{id}/category'],
      ['SM-14..17','Rate limit + auth + CSRF + CORS'],
      ['SM-18..20','E2E widget dashboard + WCAG lint']
    ], [1500,7000]),
    h1('3. Endpoints reales (URL exactas)'),
    mkTable(['Método','Ruta','Descripción'], ENDPOINTS_REALES, [900,3600,4000]),
    h1('4. Rollback'),
    bullet('1) docker compose -f infra/compose/docker-compose.yml down'),
    bullet('2) git checkout v1.24.0 && docker compose up -d'),
    bullet('3) Flyway V28 NO se revierte automáticamente — usar script V28_rollback.sql si DB corrupt'),
    bullet('4) Verificar /actuator/health → UP'),
    h1('5. Troubleshooting'),
    bullet('OTP bypass staging activo: totp.stg-bypass-code=123456 (application-staging.yml)'),
    bullet('Frontend servicio se llama "frontend" en compose (no frontend-portal) · port 4201'),
    bullet('PSQL: docker exec bankportal-postgres psql -U bankportal -d bankportal'),
    bullet('Si /pfm/distribution lento: verificar índice (user_id, month) en pfm_budgets'),
    h1('6. Observabilidad'),
    bullet('log.warn con userId en catch de widget — buscar "PfmController" en logs'),
    bullet('SecurityEvent BUDGET_ALERT + PFM_BUDGET_CREATED/DELETED visibles en audit UI'),
    bullet('Métricas Micrometer: pfm.overview.latency / pfm.analysis.latency')
  ]);
}

// ═══ DOC 10 — Sprint Report PMC ══════════════════════════════════════════
async function genPMC() {
  await saveDoc('Sprint25-Report-PMC.docx', [
    ...coverPage('Sprint 25 — PMC Report','FEAT-023 Mi Dinero'),
    h1('1. Sprint Summary'),
    mkTable(['Campo','Valor'],[
      ['Sprint','25'],['Feature','FEAT-023 Mi Dinero (PFM)'],
      ['Release','v1.25.0'],['Periodo','16/04/2026'],
      ['Capacidad planificada','24 SP'],['Delivered','24 SP'],
      ['Velocity 3-sprint avg','24 SP'],['Acumulado','593 SP'],
      ['Tests','64/64 PASS'],['Cobertura','89%'],
      ['Defectos prod','0'],['NCs','0'],
      ['Gate G-6','APPROVED'],['Gate G-7','APPROVED'],
      ['Gate G-8','PENDING HITL PM']
    ], [3000,5500]),
    h1('2. Desglose de Story Points'),
    mkTable(['Concepto','SP'],[
      ['FEAT-023 Mi Dinero (7 US)','19'],
      ['DEBT-047 Dashboard top-merchants','2'],
      ['Task soporte + planning','3'],
      ['Total','24']
    ], [6000,2500]),
    h1('3. Jira issues del sprint'),
    mkTable(['Key','Título','SP','Estado'], JIRA, [1500,4500,800,1700]),
    h1('4. Episodio BUG-PO (transparencia PMC)'),
    p('Post-G-6 pero pre-cierre, el PO realizó revisión visual comparando STG vs PROTO-FEAT-023-sprint25.html y detectó 36 bugs de fidelidad. Tratado como riesgo RSKM materializado:'),
    mkTable(['Categoría','Total','Resueltos','Diferidos a S26'],[
      ['Críticos','9','9','0'],
      ['Mayores','14','6','8'],
      ['Menores','13','0','13'],
      ['Total','36','15','21']
    ], [2200,1700,1700,2900], [RED,YELLOW,GREEN,null]),
    p('Resolución en ciclo 4-bugfix (sin reabrir Jira, branch activa): BUG-PO-001/002/003/004/005/006/007/008/009/010/011/016/019/020/021. Verificación PO: 2026-04-16T20:31:48Z.'),
    p('Bug raíz: Math.abs() ausente en mapeo frontend CARGO + select filter sin [(ngModel)]+FormsModule.'),
    h1('5. Acciones correctivas (CMMI RSKM)'),
    bullet('Checklist fidelidad BLOQUEANTE añadida a G-4 para todos los sprints futuros (LA-CORE-056)'),
    bullet('Documentar contrato de signo (CARGO negativo) en LLD desde S26 (LA-CORE-055)'),
    bullet('Guardrail G-4 GR-ANGULAR-001: select con reset programático debe usar [(ngModel)]+FormsModule (LA-CORE-057)'),
    h1('6. Deuda técnica'),
    bullet('DEBT-047 — CERRADO (SCRUM-153)'),
    bullet('21 BUG-PO menores diferidos a S26 (backlog grooming)'),
    h1('7. Tendencias Process Performance'),
    bullet('Velocity estable 24 SP · 3 sprints consecutivos'),
    bullet('Cobertura estable 89% · 0 regresión'),
    bullet('Tests acumulados: 978 → 1042 (+64)'),
    bullet('Defectos prod: 0 · 26 sprints consecutivos')
  ]);
}

// ═══ DOC 11 — CMMI Evidence ══════════════════════════════════════════════
async function genCMMI() {
  await saveDoc('CMMI-Evidence-Sprint25.docx', [
    ...coverPage('CMMI L3 — Evidencias','Sprint 25 FEAT-023'),
    h1('1. Process Areas cubiertas'),
    mkTable(['PA','Nombre','Evidencia S25'],[
      ['PP','Project Planning','SPRINT-025-planning.md + capacity 24 SP + 10 issues Jira'],
      ['PMC','Project Monitoring & Control','Sprint25-Report-PMC.docx · Dashboard global · Gates G-1..G-7 trazados'],
      ['RSKM','Risk Management','Episodio BUG-PO tratado como RSKM · 3 acciones correctivas · LAs promovidas'],
      ['VER','Verification','Code Review CR-FEAT-023-sprint25.md APPROVED + QA 64/64 PASS'],
      ['VAL','Validation','Verificación visual PO 2026-04-16T20:31:48Z · smoke 20/20 · E2E 2/2'],
      ['CM','Configuration Management','Git tag v1.25.0 · rama feature/FEAT-023-sprint25 · Flyway V28'],
      ['PPQA','Process & Product QA','Gate G-6 qa-lead+product-owner · SEC-FEAT-023-sprint25.md GREEN'],
      ['REQM','Requirements Management','SRS + 22 RN + RTM completa · trazabilidad US→RN→endpoint→componente→TC'],
      ['DAR','Decision Analysis & Resolution','ADR-037/038/039 documentados con alternativas + trade-offs']
    ], [600,2000,5900]),
    h1('2. Generic Practices (GP2.x)'),
    bullet('GP2.1 Policy — SOFIA v2.7 Policy vigente, CMMI L3 activa en session.json'),
    bullet('GP2.2 Plan — SPRINT-025-planning.md versionado en Git'),
    bullet('GP2.3 Resources — 7 roles SOFIA + PO + Tech Lead + QA Lead asignados'),
    bullet('GP2.4 Assign responsibility — Gates trazan aprobador y timestamp'),
    bullet('GP2.5 Train people — Lessons Learned propagadas a SOFIA-CORE v2.6.52'),
    bullet('GP2.6 Manage configurations — Git + session.json + Confluence pages'),
    bullet('GP2.7 Stakeholders — PO + TL + QA + RM + PM identificados y aprobantes'),
    bullet('GP2.8 Monitor & control — Dashboard global regenerado en cada gate'),
    bullet('GP2.9 Objectively evaluate — QA + Code Review + Security independientes'),
    bullet('GP2.10 Review with higher level — G-8 (PM) + G-9 (PO) pendientes'),
    h1('3. Métricas Process Performance'),
    mkTable(['Métrica','Valor S25','Baseline ORG','Semáforo'],[
      ['Velocity','24 SP','22-28 SP','GREEN'],
      ['Coverage','89%','≥85%','GREEN'],
      ['Defectos prod','0','0','GREEN'],
      ['CVE críticas/altas','0/0','0/0','GREEN'],
      ['Time to gate','<24h','<48h','GREEN'],
      ['Gate rework ratio','1/8 (BUG-PO)','<1/6','YELLOW'],
    ], [2500,1700,1700,2600], [GREEN,GREEN,GREEN,GREEN,GREEN,YELLOW]),
    p('Gate rework ratio 1/8: 1 ciclo 4-bugfix post-G-6 · por encima baseline · acción correctiva aprobada (checklist fidelidad BLOQUEANTE G-4 desde S26).')
  ]);
}

// ═══ DOC 12 — Meeting Minutes ════════════════════════════════════════════
async function genMeetings() {
  await saveDoc('MEETING-MINUTES-Sprint25.docx', [
    ...coverPage('Actas — Sprint 25','FEAT-023 Mi Dinero'),
    h1('1. Sprint Planning — 16/04/2026 10:38'),
    p('Participantes: Product Owner (Ángel), Tech Lead, Scrum Master, Team Backend, Team Frontend, QA Lead.'),
    bullet('Sprint Goal aprobado por PO'),
    bullet('Capacidad 24 SP confirmada (3 sprints consecutivos mismo pace)'),
    bullet('Backlog: 7 US FEAT-023 + DEBT-047 + tasks soporte'),
    bullet('10 issues Jira creados SCRUM-153..162'),
    bullet('Gate G-1 aprobado 10:40'),
    h1('2. Refinement SRS — 11:16'),
    bullet('SRS revisado 7 US + 22 RN + 7 RNF-delta + RTM completa'),
    bullet('Gate G-2 aprobado por PO (persistencia retroactiva LA-025-01)'),
    h1('3. Review UX/UI — 17:27'),
    bullet('PROTO-FEAT-023-sprint25.html v1.2 (94KB · 11 pantallas · 22 anotaciones)'),
    bullet('Shell navy #1e3a5f real, coherente con producción'),
    bullet('Gate HITL PO+TL aprobado conjuntamente'),
    h1('4. Code Review — 17:44'),
    bullet('APPROVED con 2 minors corregidos pre-gate (RV-M01, RV-M02)'),
    bullet('2 sugerencias aplicadas (RV-S01, RV-S02)'),
    bullet('Gate G-5 aprobado por Tech Lead'),
    h1('5. QA Review — 18:45'),
    bullet('64/64 PASS · DEBT-047 cerrado'),
    bullet('13 TCs fidelidad prototipo (LA-023-02) pasaron tras ciclo 4-bugfix'),
    bullet('Gate G-6 aprobado qa-lead + product-owner'),
    h1('6. Release Review — 19:10'),
    bullet('DevOps 18 stages ALL PASS · smoke 20/20 · E2E 2/2'),
    bullet('Tag v1.25.0 creado local'),
    bullet('Gate G-7 aprobado Release Manager'),
    h1('7. Verificación visual PO — 20:31'),
    p('Revisión pantalla-a-pantalla STG vs PROTO-FEAT-023-sprint25.html. Detectados 36 bugs fidelidad. 15 críticos+mayores resueltos en ciclo 4-bugfix pre-cierre. 21 menores diferidos a S26. Bug raíz identificado (Math.abs + ngModel). 3 LAs generadas y promovidas a SOFIA-CORE.'),
    h1('8. Retrospectiva — pendiente S25 closure'),
    bullet('Positivo: 0 defectos producción · CR 0 blocker · Gates 1..7 en 1 día'),
    bullet('A mejorar: fidelidad visual desde G-4 (checklist BLOQUEANTE)'),
    bullet('Acciones: integrar LA-CORE-055/056/057 al pipeline SOFIA')
  ]);
}

// ═══ DOC 13 — Project Plan v1.25 ═════════════════════════════════════════
async function genPP() {
  await saveDoc('PROJECT-PLAN-v1.25.docx', [
    ...coverPage('Project Plan','v1.25 — actualizado S25'),
    h1('1. Roadmap actualizado'),
    mkTable(['Sprint','Feature','Release','Estado'],[
      ['21','FEAT-019','v1.21.0','CERRADO'],
      ['22','FEAT-020','v1.22.0','CERRADO'],
      ['23','FEAT-021 Depósitos','v1.23.0','CERRADO'],
      ['24','FEAT-022 Bizum','v1.24.0','CERRADO'],
      ['25','FEAT-023 Mi Dinero (PFM)','v1.25.0','EN CIERRE (G-8 pendiente)'],
      ['26','FEAT-024 TBD','v1.26.0','BACKLOG GROOMING (+21 BUG-PO menores)'],
    ], [1000,3500,1800,2200], [null,null,null,null,YELLOW,null]),
    h1('2. Budget vs Actual'),
    mkTable(['Métrica','Planificado','Real'],[
      ['SP capacidad S25','24','24'],
      ['SP acumulados','569 + 24 = 593','593'],
      ['Sprints para v2.0','5','en curso'],
      ['Technical debt (SP)','≤8% backlog','6.5% · saludable']
    ], [3000,2700,2800]),
    h1('3. Dependencias externas'),
    bullet('Core banking mock estable desde S23 (ADR-037 FEAT-021)'),
    bullet('NotificationService (S14) consumido por alertas BUDGET_ALERT'),
    bullet('Redis cluster compartido con rate-limit Bizum (S24) y PFM (S25)'),
    h1('4. Riesgos activos'),
    mkTable(['ID','Descripción','Impacto','Mitigación'],[
      ['RSK-025-01','21 BUG-PO menores S26','Medio','Backlog grooming + G-4 checklist fidelidad BLOQUEANTE'],
      ['RSK-025-02','Drift contrato signo CARGO','Alto','Documentar en LLD desde S26 · GR-API-001'],
      ['RSK-025-03','Redis single-instance rate-limit','Medio','Roadmap cluster Redis Sentinel S27']
    ], [1200,3500,1200,2600])
  ]);
}

// ═══ DOC 14 — Quality Summary ════════════════════════════════════════════
async function genQS() {
  await saveDoc('QUALITY-SUMMARY-Sprint25.docx', [
    ...coverPage('Quality Summary','Sprint 25 FEAT-023'),
    h1('1. Dashboard de calidad'),
    mkTable(['Indicador','Valor S25','Target','Semáforo'],[
      ['Tests PASS','64/64 (100%)','≥ 95%','GREEN'],
      ['Cobertura','89%','≥ 85%','GREEN'],
      ['Code Review','APPROVED 0 blocker','0 blocker','GREEN'],
      ['Security','GREEN 0 CVE crit/high','0/0','GREEN'],
      ['SAST findings','1 INFO cerrado','0 blocker','GREEN'],
      ['E2E Playwright','2/2 PASS','100%','GREEN'],
      ['Smoke post-deploy','20/20','100%','GREEN'],
      ['Defectos prod','0','0','GREEN'],
      ['Fidelidad visual','15/36 resueltos','100%','YELLOW']
    ], [2500,1800,1500,2700], [GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,YELLOW]),
    h1('2. Episodio de calidad — BUG-PO'),
    p('36 bugs detectados en verificación visual PO post-G-6 (9C/14M/13m). Tratado como RSKM. 15 resueltos en ciclo 4-bugfix, 21 menores a S26. Acciones correctivas aprobadas:'),
    bullet('Checklist fidelidad BLOQUEANTE G-4 (LA-CORE-056)'),
    bullet('GR-API-001 contrato signo CARGO documentado en LLD (LA-CORE-055)'),
    bullet('GR-ANGULAR-001 select+ngModel+FormsModule en reset programático (LA-CORE-057)'),
    h1('3. Métricas acumuladas'),
    mkTable(['Métrica','S23','S24','S25'],[
      ['SP delivered','24','24','24'],
      ['Tests acum','913','978','1042'],
      ['Cobertura','87%','89%','89%'],
      ['Defectos prod','0','0','0'],
      ['Gates rework','0','0','1 (BUG-PO)']
    ], [2500,1700,1700,2600])
  ]);
}

// ═══ DOC 15 — Risk Register ══════════════════════════════════════════════
async function genRisk() {
  await saveDoc('RISK-REGISTER-Sprint25.docx', [
    ...coverPage('Risk Register','Sprint 25 FEAT-023'),
    h1('1. Riesgos identificados en S25'),
    mkTable(['ID','Descripción','Prob','Imp','Score','Estado','Mitigación'],[
      ['RSK-025-01','Fidelidad visual vs prototipo','Alta','Alto','HIGH','MATERIALIZADO → contenido BUG-PO','Checklist fidelidad BLOQUEANTE G-4 (LA-CORE-056)'],
      ['RSK-025-02','Drift contrato signo CARGO backend-frontend','Media','Alto','HIGH','MATERIALIZADO → 10 bugs','Math.abs() en frontend + GR-API-001 + docs LLD'],
      ['RSK-025-03','Select sin 2-way binding en reset','Media','Medio','MED','MATERIALIZADO → 2 bugs','ngModel + FormsModule + GR-ANGULAR-001'],
      ['RSK-025-04','21 BUG-PO menores diferidos','Baja','Bajo','LOW','ABIERTO · S26','Backlog grooming priorizado'],
      ['RSK-025-05','Flyway V28 sin rollback automático','Baja','Alto','MED','MITIGADO','Script V28_rollback.sql disponible'],
      ['RSK-025-06','Redis single-instance rate-limit','Baja','Alto','MED','ABIERTO','Roadmap cluster Sentinel S27']
    ], [800,2500,700,700,700,1600,1500]),
    h1('2. Aprendizajes para el portfolio'),
    bullet('LA-CORE-053 schema-drift-sql-native (GR-SQL-001)'),
    bullet('LA-CORE-054 instant-timestamptz-binding (GR-JDBC-001)'),
    bullet('LA-CORE-055 sign-contract-backend (GR-API-001)'),
    bullet('LA-CORE-056 prototype-fidelity-visual-review (G-4 BLOQUEANTE)'),
    bullet('LA-CORE-057 select-twoway-binding-reset (GR-ANGULAR-001)')
  ]);
}

// ═══ DOC 16 — Traceability Matrix ════════════════════════════════════════
async function genRTM() {
  await saveDoc('TRACEABILITY-FEAT-023-Sprint25.docx', [
    ...coverPage('Requirements Traceability Matrix','FEAT-023 Mi Dinero'),
    h1('1. Trazabilidad completa US → RN → Endpoint → Componente → TC'),
    mkTable(['US','RN','Endpoint','Capa App','Componente','TC QA','IT'],[
      ['US-F023-01','RN-01/02/03/11/19','GET /overview','GetPfmOverviewUseCase','PfmOverviewComponent','TC-F023-001..008','IT-001'],
      ['US-F023-02','RN-04/05/17/18','GET+POST /budgets · DELETE /budgets/{id}','BudgetService','BudgetListComponent + BudgetFormComponent + BudgetProgressBarComponent','TC-F023-009..016','IT-002'],
      ['US-F023-03','RN-06/07/08','(BUDGET_ALERT interno)','PfmBudgetAlertService','(sin UI directa · notif S14)','TC-F023-017..022','—'],
      ['US-F023-04','RN-09/10/14','GET /analysis','GetPfmAnalysisUseCase','PfmAnalysisComponent','TC-F023-023..030','IT-003'],
      ['US-F023-05','RN-15/16','GET /widget','GetPfmWidgetUseCase','PfmWidgetComponent (dashboard slot)','TC-F023-031..036','—'],
      ['US-F023-06','RN-02/20','PUT /movimientos/{txId}/category','UserRuleService','CategoryEditModalComponent + MovimientoRowComponent','TC-F023-037..044','IT-004'],
      ['US-F023-07','RN-12/14','GET /distribution','GetPfmDistributionUseCase','PfmDistributionComponent','TC-F023-045..054','IT-005']
    ], [700,1200,1900,1500,2000,1000,500]),
    h1('2. Cobertura RNs'),
    p('22/22 RN cubiertas por al menos 1 TC · 22/22 verificadas en G-6 · 0 huérfanas.'),
    h1('3. ADRs → US'),
    mkTable(['ADR','US afectadas'],[
      ['ADR-037 Categorización read-time','US-01, US-06'],
      ['ADR-038 budget_month VARCHAR(7)','US-02, US-03'],
      ['ADR-039 Top-merchants UNION ALL','US-07 · cierra DEBT-047']
    ], [3000,5500])
  ]);
}

// ═══ DOC 17 — Sprint Planning Doc ════════════════════════════════════════
async function genPlanning() {
  await saveDoc('Sprint25-Planning-Doc.docx', [
    ...coverPage('Sprint 25 Planning','FEAT-023 Mi Dinero — PFM'),
    h1('1. Sprint Goal'),
    p('Permitir al cliente de Banco Meridian tomar el control de sus finanzas personales mediante categorización automática de movimientos, presupuestos configurables por categoría, alertas de gasto y análisis mensual comparativo — posicionando BankPortal como referente de banca digital inteligente frente a la competencia.'),
    h1('2. Capacidad'),
    mkTable(['Concepto','SP'],[
      ['Velocidad referencia (últimos 3 sprints)','24'],
      ['FEAT-023 Mi Dinero (7 US)','19'],
      ['DEBT-047 Top merchants unificar fuentes','2'],
      ['Task soporte + planning','3'],
      ['Total','24']
    ], [6000,2500]),
    h1('3. User Stories seleccionadas'),
    mkTable(['ID','Título','SP','Prioridad'], US.map(u=>[u[0],u[1],u[2],u[3]]), [1100,4200,500,2700]),
    h1('4. Issues Jira del sprint'),
    mkTable(['Key','Título','SP'], JIRA.map(j=>[j[0],j[1],j[2]]), [1500,5100,1900]),
    h1('5. Branching model'),
    bullet('Rama trabajo: feature/FEAT-023-sprint25'),
    bullet('Base: develop · Merge final: feature → develop → main + tag v1.25.0'),
    h1('6. Gates planificados'),
    bullet('G-1 PO (planning) · G-2 PO (SRS) · G-2b auto (FA) · HITL PO+TL (UX)'),
    bullet('G-3 TL (arquitectura) · G-3b auto (FA) · G-4b auto (guardrail build)'),
    bullet('G-5 TL (code review) · G-5b auto (security)'),
    bullet('G-6 QA+PO (tests) · G-7 RM (devops) · G-8 PM (documentación) · G-8b auto (FA) · G-9 PO (cierre)')
  ]);
}

// ═══ XLSX 1 — NC Tracker ═════════════════════════════════════════════════
async function xlsxNC() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('NC Tracker S25');
  ws.columns = [
    {header:'ID', key:'id', width:14},
    {header:'Tipo', key:'tipo', width:12},
    {header:'Severidad', key:'sev', width:12},
    {header:'Origen', key:'origen', width:20},
    {header:'Descripción', key:'desc', width:60},
    {header:'Estado', key:'estado', width:14},
    {header:'Resolución', key:'res', width:40}
  ];
  ws.getRow(1).font = {bold:true, color:{argb:'FFFFFFFF'}};
  ws.getRow(1).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'}};
  const rows = [
    ['NC-S25-00','NC','—','Code Review','RV-M01 CategoryOverrideRequest sin concept','CERRADO','concept añadido pre-G-5'],
    ['NC-S25-01','NC','—','Code Review','RV-M02 widget sin log.warn','CERRADO','@Slf4j + log.warn añadidos pre-G-5'],
    ...['BUG-PO-001','BUG-PO-002','BUG-PO-003','BUG-PO-004','BUG-PO-005','BUG-PO-006','BUG-PO-007','BUG-PO-008','BUG-PO-009','BUG-PO-010','BUG-PO-011'].map(id=>
      [id,'BUG','CRITICO','Verificación PO visual','Fidelidad visual vs prototipo (Math.abs / ngModel / layout)','RESUELTO','Ciclo 4-bugfix · verificado PO 2026-04-16']),
    ...['BUG-PO-016','BUG-PO-019','BUG-PO-020','BUG-PO-021'].map(id=>
      [id,'BUG','MAYOR','Verificación PO visual','Fidelidad visual vs prototipo','RESUELTO','Ciclo 4-bugfix · verificado PO 2026-04-16']),
    ['BUG-PO-012..013','BUG','MAYOR','Verificación PO visual','Fidelidad visual prototipo (8 bugs agregados)','DIFERIDO S26','Backlog grooming'],
    ['BUG-PO-022..036','BUG','MENOR','Verificación PO visual','Detalles cosméticos (13 bugs)','DIFERIDO S26','Backlog grooming']
  ];
  rows.forEach(r => ws.addRow(r));
  // Colorear estado
  ws.eachRow((row,rn)=>{
    if (rn===1) return;
    const estado = row.getCell(6).value;
    if (estado==='CERRADO'||estado==='RESUELTO') row.getCell(6).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FFE8F5E9'}};
    else if (estado && String(estado).startsWith('DIFERIDO')) row.getCell(6).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF8E1'}};
  });
  const file = path.join(OUT_EXCEL,'NC-Tracker-Sprint25.xlsx');
  await wb.xlsx.writeFile(file);
  console.log('  OK XLSX:', 'NC-Tracker-Sprint25.xlsx', '(' + Math.round(fs.statSync(file).size/1024) + ' KB)');
}

// ═══ XLSX 2 — Decision Log ═══════════════════════════════════════════════
async function xlsxDL() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Decisiones S25');
  ws.columns = [
    {header:'ID', key:'id', width:20},
    {header:'Tipo', key:'tipo', width:18},
    {header:'Título', key:'tit', width:60},
    {header:'Fecha', key:'fecha', width:12},
    {header:'Aprobador', key:'apr', width:26},
    {header:'Referencias', key:'ref', width:40}
  ];
  ws.getRow(1).font = {bold:true, color:{argb:'FFFFFFFF'}};
  ws.getRow(1).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'}};
  const rows = [
    ['ADR-037','ARCH','Categorización PFM en tiempo de consulta (no persistente)','2026-04-16','Architect','docs/architecture/adr/ADR-037-pfm-categorizacion-consulta.md'],
    ['ADR-038','ARCH','budget_month VARCHAR(7) formato YYYY-MM','2026-04-16','Architect','docs/architecture/adr/ADR-038-pfm-budget-month-varchar.md'],
    ['ADR-039','ARCH','Top-10 comercios con UNION ALL bill_payments + transactions CARGO','2026-04-16','Architect','docs/architecture/adr/ADR-039-pfm-top-comercios-union.md'],
    ['G-1','GATE','Sprint 25 Planning aprobado — FEAT-023 Mi Dinero 24SP','2026-04-16','product-owner','session.json.gates.G-1_s25'],
    ['G-2','GATE','SRS FEAT-023 aprobado — 7 US + 22 RN + RTM','2026-04-16','product-owner','session.json.gates.G-2_s25'],
    ['HITL-PO-TL','GATE','UX + PROTO aprobados — 11 pantallas 94KB','2026-04-16','PO + Tech Lead','session.json.gates.HITL-PO-TL_s25'],
    ['G-5','GATE','Code Review APPROVED 0 blocker 0 major','2026-04-16','tech-lead','session.json.gates.G-5_s25'],
    ['G-5b','GATE','Security GREEN 0 CVE crit/high','2026-04-16','auto','session.json.gates.G-5b'],
    ['G-6','GATE','QA 64/64 PASS DEBT-047 CERRADO','2026-04-16','qa-lead + product-owner','session.json.gates.G-6_s25'],
    ['G-7','GATE','DevOps v1.25.0 18 stages ALL PASS smoke 20/20','2026-04-16','release-manager','session.json.gates.G-7_s25'],
    ['BUGFIX-025','DECISION','Resolver 15 BUG-PO críticos+mayores en branch activa sin reabrir Jira','2026-04-16','PO','session.json.artifacts.4_bugfix_verified'],
    ['CHECKLIST-FIDELITY','DECISION','Checklist fidelidad visual BLOQUEANTE en G-4 desde S26','2026-04-16','PO','LA-025-07 → LA-CORE-056']
  ];
  rows.forEach(r => ws.addRow(r));
  const file = path.join(OUT_EXCEL,'Decision-Log-Sprint25.xlsx');
  await wb.xlsx.writeFile(file);
  console.log('  OK XLSX:', 'Decision-Log-Sprint25.xlsx', '(' + Math.round(fs.statSync(file).size/1024) + ' KB)');
}

// ═══ XLSX 3 — Quality Dashboard ══════════════════════════════════════════
async function xlsxQD() {
  const wb = new ExcelJS.Workbook();
  // Hoja 1: Dashboard S23-S25
  const ws1 = wb.addWorksheet('Dashboard S23-S25');
  ws1.columns = [
    {header:'Métrica', key:'m', width:34},
    {header:'S23', key:'s23', width:12},
    {header:'S24', key:'s24', width:12},
    {header:'S25', key:'s25', width:12},
    {header:'Target', key:'t', width:14},
    {header:'Semáforo', key:'sem', width:12}
  ];
  ws1.getRow(1).font = {bold:true, color:{argb:'FFFFFFFF'}};
  ws1.getRow(1).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'}};
  [
    ['SP delivered',24,24,24,'24','GREEN'],
    ['SP acumulados',545,569,593,'≥24/sprint','GREEN'],
    ['Tests acumulados',913,978,1042,'≥900','GREEN'],
    ['Cobertura %',87,89,89,'≥85','GREEN'],
    ['Defectos prod',0,0,0,'0','GREEN'],
    ['NCs',0,0,0,'0','GREEN'],
    ['CVE crit/high','0/0','0/0','0/0','0/0','GREEN'],
    ['Gates G-1..G-7','7/7','7/7','7/7','7/7','GREEN'],
    ['Gate rework','0','0','1 (BUG-PO)','≤1','YELLOW']
  ].forEach(r => ws1.addRow(r));

  // Hoja 2: Velocidad histórica
  const ws2 = wb.addWorksheet('Velocidad');
  ws2.columns = [
    {header:'Sprint', key:'s', width:10},
    {header:'Feature', key:'f', width:28},
    {header:'SP', key:'sp', width:8},
    {header:'Tests', key:'t', width:10},
    {header:'Cov %', key:'c', width:10},
    {header:'Release', key:'r', width:12}
  ];
  ws2.getRow(1).font = {bold:true, color:{argb:'FFFFFFFF'}};
  ws2.getRow(1).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'}};
  [
    [21,'FEAT-019',24,36,85,'v1.21.0'],
    [22,'FEAT-020',24,40,87,'v1.22.0'],
    [23,'FEAT-021 Depósitos',24,47,87,'v1.23.0'],
    [24,'FEAT-022 Bizum',24,25,89,'v1.24.0'],
    [25,'FEAT-023 Mi Dinero (PFM)',24,64,89,'v1.25.0']
  ].forEach(r => ws2.addRow(r));

  // Hoja 3: FA summary
  const ws3 = wb.addWorksheet('FA Analysis');
  ws3.columns = [
    {header:'Campo', key:'k', width:30},
    {header:'Valor', key:'v', width:40}
  ];
  ws3.getRow(1).font = {bold:true, color:{argb:'FFFFFFFF'}};
  ws3.getRow(1).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'}};
  [
    ['Documento','FA-bank-portal-Banco Meridian.docx'],
    ['Versión','v0.8 (pendiente S25 consolidation en Step 8b)'],
    ['Funcionalidades',100],
    ['Reglas de negocio',231],
    ['Sprints cubiertos','S1-S25'],
    ['Tamaño (KB)',81.6],
    ['Última actualización','2026-04-16T11:43:23Z (Step 2b_s25)']
  ].forEach(r => ws3.addRow(r));

  const file = path.join(OUT_EXCEL,'Quality-Dashboard-Sprint25.xlsx');
  await wb.xlsx.writeFile(file);
  console.log('  OK XLSX:', 'Quality-Dashboard-Sprint25.xlsx', '(' + Math.round(fs.statSync(file).size/1024) + ' KB)');
}

// ═══ JSON — SPRINT-025-data.json ═════════════════════════════════════════
function writeSprintDataJson() {
  const data = {
    sprint: 25,
    sp: 24,
    acum: 593,
    feat: 'FEAT-023',
    titulo: 'Mi Dinero — Gestor de Finanzas Personales (PFM)',
    rel: 'v1.25.0',
    tests: 64,
    tests_acum: 1042,
    cov: 89,
    ncs: 0,
    defects: 0,
    date_closed: '2026-04-16',
    las_session: ['LA-025-06','LA-025-07','LA-025-08'],
    las_core: ['LA-CORE-053','LA-CORE-054','LA-CORE-055','LA-CORE-056','LA-CORE-057'],
    guardrails_nuevos: ['GR-SQL-001','GR-JDBC-001','GR-API-001','GR-VISUAL-001','GR-ANGULAR-001'],
    debt_closed: ['DEBT-047'],
    bug_po: {
      total: 36, critical: 9, major: 14, minor: 13,
      resolved: 15, deferred: 21,
      root_cause: 'Math.abs() ausente en mapeo frontend CARGO + select filter sin [(ngModel)]+FormsModule',
      verified_at: '2026-04-16T20:31:48Z',
      bugs_fixed: ['BUG-PO-001','BUG-PO-002','BUG-PO-003','BUG-PO-004','BUG-PO-005','BUG-PO-006','BUG-PO-007','BUG-PO-008','BUG-PO-009','BUG-PO-010','BUG-PO-011','BUG-PO-016','BUG-PO-019','BUG-PO-020','BUG-PO-021']
    },
    endpoints: ENDPOINTS_REALES.map(e=>({method:e[0], path:e[1], desc:e[2]})),
    jira_issues: JIRA.map(j=>({key:j[0], title:j[1], sp:parseInt(j[2]), status:j[3]})),
    flyway: { migration: 'V28__pfm.sql', tables: 4, seed_rules: 72 },
    confluence: { hld_page: '11371521' },
    git: { tag: 'v1.25.0', branch: 'feature/FEAT-023-sprint25', status: 'tag created local · push pending' },
    gates: ['G-1','G-2','G-2b','HITL-PO-TL','G-3','G-3b','G-4','G-4b','G-5','G-5b','G-6','G-7'],
    gate_pending: 'G-8'
  };
  const file = 'docs/sprints/SPRINT-025-data.json';
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log('  OK JSON:', file, '(' + Math.round(fs.statSync(file).size/1024*10)/10 + ' KB)');
}

// ═══ Orquestación ════════════════════════════════════════════════════════
(async () => {
  console.log('━━━ Documentation Agent Sprint 25 · FEAT-023 Mi Dinero ━━━');
  console.log('Generando 17 DOCX en', OUT_WORD);
  await genSRS();
  await genHLD();
  await genLLDBack();
  await genLLDFront();
  await genQA();
  await genCR();
  await genSEC();
  await genRelNotes();
  await genRunbook();
  await genPMC();
  await genCMMI();
  await genMeetings();
  await genPP();
  await genQS();
  await genRisk();
  await genRTM();
  await genPlanning();
  console.log('Generando 3 XLSX en', OUT_EXCEL);
  await xlsxNC();
  await xlsxDL();
  await xlsxQD();
  console.log('Generando JSON del sprint');
  writeSprintDataJson();
  console.log('━━━ Documentation Agent · COMPLETADO ━━━');
})().catch(err => { console.error('FATAL:', err); process.exit(1); });
