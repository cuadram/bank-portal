// gen-docs-sprint26.js — Documentation Agent Sprint 26 FEAT-024
// SOFIA v2.7 · 17 DOCX + 3 XLSX + 1 JSON
// FEAT-024 Objetivos de Ahorro ("Mis Metas") — Banco Meridian
// Fuente de verdad: session.json + SRS-FEAT-024-sprint26.md + DR-S26-007/008 + handoffs Step 4-7
'use strict';
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, BorderStyle, WidthType, ShadingType } = require('docx');
const fs   = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const OUT_WORD  = 'docs/deliverables/sprint-26-FEAT-024/word';
const OUT_EXCEL = 'docs/deliverables/sprint-26-FEAT-024/excel';
[OUT_WORD, OUT_EXCEL].forEach(d => fs.mkdirSync(d, { recursive: true }));

const BLUE='1B3A6B', WHITE='FFFFFF', FONT='Arial';
const DATE='10/05/2026', SPRINT='26', FEAT='FEAT-024';
const VER='v1.26.0', CLIENT='Banco Meridian';
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

// ═══ Datos reales Sprint 26 ══════════════════════════════════════════════
const US = [
  ['US-024-01','Crear objetivo de ahorro','3','MUST','POST /api/v1/savings/goals → creación atómica con reserva inicial; targetAmount 100€-500.000€; max 10 ACTIVE'],
  ['US-024-02','Listar objetivos con progreso y proyección','2','MUST','GET /api/v1/savings/goals → barra progreso, fecha proyectada, filtros estado/orden'],
  ['US-024-03','Detalle de objetivo con histórico','2','MUST','GET /api/v1/savings/goals/{id} → timeline aportaciones + hitos + auto-rule + estado reserva'],
  ['US-024-04','Aportación manual a objetivo','3','MUST','POST /contributions desde cualquier cuenta propia; @Version retry 3x; 409 CONCURRENCY_CONFLICT con backoff frontend'],
  ['US-024-05','Aportación automática mensual','3','MUST','PUT /auto-rule + scheduler ShedLock; reintentos saldo insuficiente; pausable sin perder configuración'],
  ['US-024-06','Editar / pausar / cerrar objetivo con devolución','2','MUST','PUT/DELETE /goals/{id} → liberar reserva, ABONO trazable, OTP si > 30€ (SCA PSD2)'],
  ['US-024-07','Alertas push de hitos','2','SHOULD','Hitos 25/50/75/100% → push VAPID (FEAT-014) + centro notificaciones (FEAT-004); deduplicación por (goalId, percent)'],
  ['US-024-08','Widget "Mi ahorro del mes" en dashboard','1','SHOULD','GET /dashboard-widget → top-3 progreso + semáforo + CTA si vacío; degradación elegante']
];

const RN = [
  ['RN-F024-01','targetAmount ∈ [100€..500.000€]; targetDate ∈ [hoy+30d..hoy+30a]'],
  ['RN-F024-02','Máximo 10 objetivos ACTIVE simultáneos por usuario'],
  ['RN-F024-03','Aportación manual: importe ∈ [10€..5.000€]'],
  ['RN-F024-04','Aportación automática con saldo insuficiente → estado FAILED + notificación; NO bloquea ciclo del scheduler'],
  ['RN-F024-05','Fondos virtualmente segregados (ADR-040): reservedAmount afecta availableBalance, NO ledgerBalance'],
  ['RN-F024-06','Cierre con devolución t+0 a cuenta origen última aportación; si no hay, cuenta primaria del cliente'],
  ['RN-F024-07','Categorías estándar: VIAJE, HOGAR, VEHICULO, EMERGENCIA, EDUCACION, OTROS + customCategory (max 50 chars)'],
  ['RN-F024-08','Proyección: ritmo insuficiente → projectionRisk=true; suggestedMonthlyContribution = (target-reserved)/mesesHastaTarget'],
  ['RN-F024-09','Hitos: una notificación por (goalId, percent) — UK idempotente goal_milestones'],
  ['RN-F024-10','GDPR Art.15/17: objetivos+aportaciones incluidos en export FEAT-019; soft-delete preserva 7 años'],
  ['RN-F024-11','Cierre con devolución > 30€ requiere SCA PSD2 (FEAT-001 2FA con OTP)'],
  ['RN-F024-12','Objetivos CLOSED preservados 7 años (obligación contable/fiscal RDL 5/2018)'],
  ['RN-F024-13','Scheduler ejecuta 00:00-06:00 UTC; dayOfMonth ∈ [1..28] (evita ambigüedad meses cortos)'],
  ['RN-F024-14','Reintentos 3x backoff exponencial (1m/5m/15m) antes de marcar FAILED por fallo técnico'],
  ['RN-F024-15','availableBalance de la cuenta considera SUM(reservedAmount) de objetivos ACTIVE que la usan como origen'],
  ['RN-F024-16','Concurrencia POST contribución: tras 3 retries optimistas backend agotados → 409 CONCURRENCY_CONFLICT; frontend reintenta 1x con backoff 500ms; mensaje UX inline si persiste (DR-S26-007)'],
  ['RN-F024-17','Selector cuenta origen aportación manual: muestra todas las cuentas activas del usuario (GET /api/v1/accounts), prioridad goal.sourceAccountId si está, fallback primera cuenta (DR-S26-008)']
];

const ENDPOINTS_REALES = [
  ['GET',    '/api/v1/savings/goals',                              'Listar objetivos del usuario con filtros (status, page, size)'],
  ['POST',   '/api/v1/savings/goals',                              'Crear objetivo (max 10 ACTIVE)'],
  ['GET',    '/api/v1/savings/goals/{id}',                         'Detalle objetivo con histórico y proyección'],
  ['PUT',    '/api/v1/savings/goals/{id}',                         'Editar título/importe/fecha/categoría/icono'],
  ['DELETE', '/api/v1/savings/goals/{id}',                         'Cerrar con devolución (X-OTP si > 30€)'],
  ['POST',   '/api/v1/savings/goals/{id}/contributions',           'Aportación manual (@Version retry, 409 si conflicto)'],
  ['GET',    '/api/v1/savings/goals/{id}/contributions',           'Histórico aportaciones paginado'],
  ['PUT',    '/api/v1/savings/goals/{id}/auto-rule',               'Configurar regla automática mensual'],
  ['DELETE', '/api/v1/savings/goals/{id}/auto-rule',               'Pausar regla automática'],
  ['GET',    '/api/v1/savings/goals/{id}/milestones',              'Hitos alcanzados'],
  ['GET',    '/api/v1/savings/dashboard-widget',                   'Widget dashboard (top-3 + semáforo)'],
  ['GET',    '/v3/api-docs',                                       'OpenAPI 3.1 contract (springdoc · DEBT-048)']
];

const ADR = [
  ['ADR-040','Segregación virtual de fondos: reservedAmount NO mueve ledgerBalance','Mantiene contabilidad inmutable y trazable; availableBalance refleja la reserva sin alterar saldos contables; coste cero en migración (β sub-cuentas reales aplazado)'],
  ['ADR-041','Concurrencia optimista con @Version + retry 3x','Evita locks pesimistas y deadlocks; lleva a 409 CONCURRENCY_CONFLICT bajo carga; DR-S26-007 cierra el ciclo con backoff frontend (RN-F024-16)'],
  ['ADR-042','OpenAPI 3.1 vía springdoc como única fuente de verdad de contratos','Habilita GR-SMOKE-001 (validate-smoke-vs-openapi); cierra DEBT-048..050; smoke tests dejan de divergir del backend real'],
  ['ADR-043','Selector multi-cuenta en aportación manual usa GET /api/v1/accounts','La cuenta de aportación NO está fijada al sourceAccountId del objetivo; el cliente elige en el momento; consolida UX coherente con FEAT-007 (DR-S26-008, RN-F024-17)']
];

const DR = [
  ['DR-S26-007','B.4 quick patch retry 409','Frontend reintenta 1x con backoff 500ms ante 409 CONCURRENCY_CONFLICT; mensaje UX inline si persiste; DEBT-Q-073 abierta para refactor limpio en S27'],
  ['DR-S26-008','Auth guard fix + multi-cuenta selector','Hallazgo 1 (goalOwnerGuard redirigía a /login por refactor parcial DEBT-033) + OBS-008/OBS-009 (selector cuenta única hardcoded → multi-cuenta real); DEBT-FE-074 (auth refactor) y DEBT-FE-075 (E2E UI-driven) abiertas para S27']
];

const JIRA = [
  ['SCRUM-163','SPRINT-026 Planning & Setup — Scrum Master','1','Finalizada'],
  ['SCRUM-164','US-024-01: Crear objetivo de ahorro','3','Finalizada'],
  ['SCRUM-165','US-024-02: Listar objetivos con progreso','2','Finalizada'],
  ['SCRUM-166','US-024-03: Detalle de objetivo con histórico','2','Finalizada'],
  ['SCRUM-167','US-024-04: Aportación manual a objetivo','3','Finalizada'],
  ['SCRUM-168','US-024-05: Aportación automática mensual','3','Finalizada'],
  ['SCRUM-169','US-024-06: Editar / pausar / cerrar objetivo','2','Finalizada'],
  ['SCRUM-170','US-024-07: Alertas push de hitos','2','Finalizada'],
  ['SCRUM-171','US-024-08: Widget Mi ahorro en dashboard','1','Finalizada'],
  ['SCRUM-172','DEBT-051: Cablear ShedLock','2','Finalizada'],
  ['SCRUM-173','SPRINT-026 Closure — Workflow Manager','3','En curso']
];

// Hallazgos de PO durante Step 7 (verificación visual) — escalados a DR + DEBT
const HALLAZGOS = {
  total: 4, // B.4 + Hallazgo 1 + OBS-008 + OBS-009
  scope_step: 'Step 7 DevOps · verificación visual PO',
  resolved_in_step7: 4,
  deferred: 0,
  root_causes: 'Refactor parcial auth abandonado (DEBT-033) + E2E API-driven exclusivo no detecta UI + OBS inline sin escalado formal a DEBT',
  drs: ['DR-S26-007','DR-S26-008'],
  debts_opened: ['DEBT-Q-073','DEBT-FE-074','DEBT-FE-075'],
  las_generadas: ['LA-026-01','LA-026-02','LA-026-03','LA-026-04','LA-026-05','LA-026-06','LA-026-07','LA-026-08'],
  la_candidates_core: ['GR-SHELL-002','GR-FE-002'],
  la_core_applied: ['GR-SHELL-001'],
  verified_at: '2026-05-08T13:07:59Z',
  verified_screens: ['lista-metas','detalle-meta','modal-aportacion','widget-dashboard']
};


// ═══ DOC 1 — SRS ═════════════════════════════════════════════════════════
async function genSRS() {
  await saveDoc('SRS-FEAT-024-Sprint26.docx', [
    ...coverPage('Software Requirements Specification','FEAT-024 Objetivos de Ahorro · "Mis Metas"'),
    h1('1. Introducción'),
    p('Este documento especifica los requisitos funcionales y no funcionales para la funcionalidad Objetivos de Ahorro (FEAT-024) — "Mis Metas" — desarrollada en el Sprint 26 del proyecto BankPortal para Banco Meridian. La feature incorpora metas de ahorro con reserva virtual sobre cuentas del cliente, aportaciones manuales y automáticas, hitos y proyección de cumplimiento.'),
    p('Marco regulatorio aplicable: RGPD (UE) 2016/679, RDL 5/2018 (adaptación GDPR), Ley 44/2002 de medidas de reforma del sistema financiero, PSD2/DSP2 (autenticación reforzada SCA en operaciones > 30€).'),
    sep(),
    h1('2. User Stories (18 SP totales)'),
    mkTable(['ID','Título','SP','Prioridad','Criterio resumido'], US, [900,2700,500,900,3500]),
    h1('3. Reglas de negocio'),
    mkTable(['ID','Descripción'], RN, [1400,7100]),
    h1('4. Endpoints REST (contrato verificado en código)'),
    mkTable(['Método','Ruta','Descripción'], ENDPOINTS_REALES, [900,3600,4000]),
    p('Fuente: apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/savings/api/controller/SavingsGoalController.java + SavingsContributionController.java + SavingsAutoRuleController.java', {italics:true, size:18, color:'777777'}),
    h1('5. Trazabilidad (RTM resumida)'),
    mkTable(['US','RN implicadas','Endpoint','Componente Angular','TC QA'],[
      ['US-024-01','RN-01/02/05/07','POST /goals','GoalCreateModalComponent','TC-001..010'],
      ['US-024-02','RN-08','GET /goals','GoalListComponent','TC-011..018'],
      ['US-024-03','RN-08/09','GET /goals/{id}','GoalDetailComponent','TC-019..028'],
      ['US-024-04','RN-03/05/15/16','POST /contributions','ContributeModalComponent','TC-029..044, IT-001'],
      ['US-024-05','RN-04/13/14','PUT /auto-rule + scheduler','AutoRuleFormComponent + SavingsAutoRuleScheduler','TC-045..056, IT-002'],
      ['US-024-06','RN-06/11/12','PUT/DELETE /goals/{id}','GoalEditModalComponent','TC-057..072, IT-003'],
      ['US-024-07','RN-09','(evento MILESTONE_REACHED)','NotificationService (FEAT-014/004)','TC-073..082'],
      ['US-024-08','RN-08','GET /dashboard-widget','SavingsWidgetComponent','TC-083..094']
    ], [900,2000,2200,2400,1500]),
    h1('6. Requisitos No Funcionales (delta S26)'),
    mkTable(['ID','Tipo','Criterio'],[
      ['RNF-F024-01','Rendimiento','GET /goals p95 < 250ms con 10 objetivos ACTIVE'],
      ['RNF-F024-02','Rendimiento','POST /contributions p95 < 400ms incluso bajo retry optimista (3x)'],
      ['RNF-F024-03','Concurrencia','@Version + retry exponencial; 409 CONCURRENCY_CONFLICT trazable y recuperable en frontend (DR-S26-007)'],
      ['RNF-F024-04','Seguridad','Auditoría SecurityEvent SAVINGS_* en mutaciones; SCA PSD2 en cierres > 30€'],
      ['RNF-F024-05','Observabilidad','Métricas Spring Actuator de tasa 409 y duración scheduler ShedLock'],
      ['RNF-F024-06','Contrato','OpenAPI 3.1 vía springdoc como única fuente de verdad — habilita GR-SMOKE-001'],
      ['RNF-F024-07','Usabilidad','Fidelidad visual contra PROTO-FEAT-024-sprint26.html (LA-CORE-056 + LA-CORE-068)']
    ], [1200,1600,5700])
  ]);
}

// ═══ DOC 2 — HLD ═════════════════════════════════════════════════════════
async function genHLD() {
  await saveDoc('HLD-FEAT-024-Sprint26.docx', [
    ...coverPage('High-Level Design','FEAT-024 Objetivos de Ahorro · "Mis Metas"'),
    h1('1. Arquitectura general'),
    p('FEAT-024 sigue la arquitectura hexagonal consolidada en BankPortal: dominio puro, casos de uso en application, adaptadores JPA/JDBC en infrastructure, controllers REST en api. El módulo savings se aísla del resto del dominio; consume accounts (read+write availableBalance) e integra con NotificationService (FEAT-014) para hitos.'),
    p('La pieza arquitectónica clave es ADR-040: la segregación de fondos es virtual — reservedAmount afecta availableBalance pero NO ledgerBalance. Esto preserva la inmutabilidad contable y evita migrar hacia sub-cuentas reales en esta release (β aplazado).'),
    h1('2. Módulos del dominio savings'),
    mkTable(['Capa','Componentes clave'],[
      ['Domain model','SavingsGoal · GoalAllocation · GoalAutoRule · GoalMilestone · GoalStatus · GoalCategory'],
      ['Domain service','SavingsGoalService · ContributionService · AutoRuleService · MilestoneEvaluator · ProjectionCalculator'],
      ['Domain ports','SavingsGoalRepository · GoalAllocationRepository · GoalAutoRuleRepository · GoalMilestoneRepository · AccountReservedAmountPort'],
      ['Use cases','CreateGoal · ContributeToGoal · ConfigureAutoRule · CloseGoalWithRefund · GetDashboardWidget (5 UC principales)'],
      ['DTOs','SavingsDtos.java (12 DTOs records)'],
      ['Infrastructure','JpaSavingsGoalAdapter · JpaAllocationAdapter · JpaAutoRuleAdapter · JpaMilestoneAdapter · SavingsAutoRuleScheduler (ShedLock)'],
      ['API','SavingsGoalController · SavingsContributionController · SavingsAutoRuleController · SavingsExceptionHandler']
    ], [1700,6800]),
    h1('3. Decisiones arquitectónicas (ADR)'),
    mkTable(['ID','Decisión','Motivo / trade-off'], ADR, [1000,3200,4300]),
    h1('4. Persistencia — Flyway V32 + V33'),
    mkTable(['Tabla','Propósito','Tamaño inicial'],[
      ['savings_goals','Metas con targetAmount, reservedAmount, status, deadline','0 (se llena en uso)'],
      ['goal_allocations','Histórico aportaciones (manual + auto) con sourceAccountId','0'],
      ['goal_auto_rules','Reglas auto: amount, dayOfMonth, sourceAccountId','0'],
      ['goal_milestones','Hitos alcanzados (UK goalId+percent, idempotente)','0']
    ], [2300,4300,2000]),
    h1('5. Flujo alto nivel — Aportación manual con concurrencia'),
    p('1) Frontend POST /contributions con sourceAccountId+amount → 2) Backend valida saldo y carga goal con @Version → 3) Decrementa availableBalance en account (DECREMENT_RESERVED) e incrementa goal.reservedAmount → 4) Si OptimisticLockException, retry 3x con backoff (jitter) → 5) Si tras retries persiste conflicto, devuelve 409 CONCURRENCY_CONFLICT → 6) Frontend reintenta 1x con backoff 500ms → 7) Si vuelve a fallar, mensaje UX inline (RN-F024-16, DR-S26-007).'),
    h1('6. Integración con módulos existentes'),
    bullet('S07 accounts — port AccountReservedAmountPort para mover availableBalance sin tocar ledgerBalance (ADR-040)'),
    bullet('S14 notifications — MilestoneEvaluator publica MILESTONE_REACHED a NotificationService'),
    bullet('S15 schedules — SavingsAutoRuleScheduler reutiliza patrón de ShedLock; DEBT-051 cerrada'),
    bullet('S19 GDPR export — savings_goals y goal_allocations añadidos a la exportación FEAT-019'),
    bullet('Frontend shell — item "Mis Metas" añadido a sidebar; widget "Mi ahorro del mes" en dashboard'),
    h1('7. OpenAPI 3.1 como contrato canónico'),
    p('Springdoc expone /v3/api-docs con el contrato real del backend. El script infra/scripts/validate-smoke-vs-openapi.sh consume este endpoint y valida que los smoke tests no usan rutas obsoletas (cierra DEBT-048..050, habilita GR-SMOKE-001).')
  ]);
}

// ═══ DOC 3 — LLD Backend ═════════════════════════════════════════════════
async function genLLDBack() {
  await saveDoc('LLD-FEAT-024-Backend-Sprint26.docx', [
    ...coverPage('Low-Level Design — Backend','FEAT-024 Objetivos de Ahorro · "Mis Metas"'),
    h1('1. Estructura de paquetes'),
    p('com.experis.sofia.bankportal.savings', {bold:true}),
    bullet('api/controller — SavingsGoalController · SavingsContributionController · SavingsAutoRuleController'),
    bullet('api/advice — SavingsExceptionHandler (@ControllerAdvice basePackageClasses)'),
    bullet('application/usecase — 5 UC principales'),
    bullet('application/dto — SavingsDtos (12 records)'),
    bullet('domain/model · domain/service · domain/repository'),
    bullet('infrastructure/persistence — JPA adapters + ShedLock scheduler'),
    h1('2. Entidades JPA'),
    mkTable(['Entidad','Campos clave','Notas'],[
      ['SavingsGoalEntity','id · userId · title · targetAmount(BigDecimal) · reservedAmount · deadline · category · icon · status · sourceAccountId · @Version','UK (userId, title) cuando status=ACTIVE'],
      ['GoalAllocationEntity','id · goalId · sourceAccountId · amount · type(MANUAL/AUTO) · createdAt(TIMESTAMPTZ)','Trazabilidad inmutable de aportaciones'],
      ['GoalAutoRuleEntity','id · goalId · amount · dayOfMonth · sourceAccountId · status(ACTIVE/PAUSED) · lastExecutionAt','dayOfMonth ∈ [1..28] (RN-F024-13)'],
      ['GoalMilestoneEntity','id · goalId · percent(25/50/75/100) · reachedAt','UK (goalId, percent) idempotente (RN-F024-09)']
    ], [2200,4300,2000]),
    h1('3. Endpoints (firma real)'),
    mkTable(['Método','Ruta','Request','Response'],[
      ['GET','/savings/goals','Query: status, page, size','Page<SavingsGoalDto>'],
      ['POST','/savings/goals','CreateGoalRequest','SavingsGoalDto 201'],
      ['GET','/savings/goals/{id}','—','GoalDetailDto'],
      ['PUT','/savings/goals/{id}','UpdateGoalRequest','SavingsGoalDto'],
      ['DELETE','/savings/goals/{id}','Header X-OTP si > 30€','CloseResultDto'],
      ['POST','/savings/goals/{id}/contributions','ContributeRequest','AllocationDto 201 / 409'],
      ['GET','/savings/goals/{id}/contributions','Query: page, size','Page<AllocationDto>'],
      ['PUT','/savings/goals/{id}/auto-rule','AutoRuleRequest','AutoRuleDto'],
      ['DELETE','/savings/goals/{id}/auto-rule','—','204'],
      ['GET','/savings/goals/{id}/milestones','—','MilestoneDto[]'],
      ['GET','/savings/dashboard-widget','—','WidgetDto']
    ], [800,2900,2500,2300]),
    h1('4. Concurrencia optimista — @Version + retry'),
    p('SavingsContributionService usa retry 3x con backoff exponencial (50ms / 150ms / 450ms + jitter) ante OptimisticLockException. Tras los 3 intentos, eleva a 409 CONCURRENCY_CONFLICT (ADR-041). El @Version se mantiene en SavingsGoalEntity y se incrementa en cada actualización de reservedAmount.'),
    p('LA aplicada (LA-CORE-068 / GR-API-001): el contrato del 409 incluye un campo retryAfterMs (500ms) para que el frontend implemente backoff coherente con backend.'),
    h1('5. Scheduler ShedLock — Aportación automática'),
    bullet('SavingsAutoRuleScheduler @Scheduled(cron="0 0 4 * * *") con @SchedulerLock'),
    bullet('Por dayOfMonth coincidente, ejecuta aportaciones idempotentes (UK GoalAllocation por (goalId, type=AUTO, monthYear))'),
    bullet('Reintentos exponenciales 1m/5m/15m antes de marcar FAILED (RN-F024-14)'),
    bullet('DEBT-051 cerrada: ShedLock estaba declarado pero sin @SchedulerLock; ahora protegido frente a multi-instancia'),
    h1('6. Flyway V32 + V33'),
    bullet('V32__savings.sql — 4 tablas + índices + UK'),
    bullet('V33__savings_categories.sql — categorización inicial y corrección de seed (BUG-Q-001)'),
    bullet('Verificación previa de schema con \d en psql (GR-SQL-001 · LA-CORE-053)'),
    h1('7. Tests unitarios e integración'),
    mkTable(['Clase','TCs','Resultado'],[
      ['SavingsGoalServiceTest','TC-001..010','10/10 PASS'],
      ['ContributionServiceTest','TC-029..044','16/16 PASS (incluye retry 409)'],
      ['AutoRuleSchedulerIT','TC-045..056','12/12 PASS @SpringBootTest'],
      ['CloseGoalWithRefundIT','TC-057..072','16/16 PASS (OTP path)'],
      ['MilestoneEvaluatorTest','TC-073..082','10/10 PASS'],
      ['DashboardWidgetIT','TC-083..094','12/12 PASS']
    ], [3500,2500,2500]),
    h1('8. Hallazgos Code Review (corregidos pre-G-5)'),
    bullet('RV-M01 — DTO ContributeRequest sin validación @Min(10); resuelto'),
    bullet('RV-M02 — ExceptionHandler 409 sin Content-Type explícito; resuelto')
  ]);
}

// ═══ DOC 4 — LLD Frontend ════════════════════════════════════════════════
async function genLLDFront() {
  await saveDoc('LLD-FEAT-024-Frontend-Sprint26.docx', [
    ...coverPage('Low-Level Design — Frontend','FEAT-024 Objetivos de Ahorro · "Mis Metas"'),
    h1('1. Estructura de módulos Angular'),
    p('NgModule classic (sin signals — directiva PO). Módulo lazy /savings con 12 componentes; widget eager declarado en DashboardModule.'),
    bullet('savings.module.ts — 12 declarations + ReactiveFormsModule + FormsModule'),
    bullet('savings-routing.module.ts — 4 rutas: lista, detalle, crear, editar'),
    bullet('savings.service.ts — HTTP client con manejo defensivo 409'),
    h1('2. Componentes principales'),
    mkTable(['Componente','Selector','Responsabilidad'],[
      ['GoalListComponent','app-goal-list','Lista paginada con filtros, ordenación, barra progreso'],
      ['GoalDetailComponent','app-goal-detail','Detalle + timeline + auto-rule + acciones'],
      ['GoalCreateModalComponent','app-goal-create-modal','Crear objetivo (ReactiveForm validación)'],
      ['GoalEditModalComponent','app-goal-edit-modal','Editar / pausar / cerrar (con OTP path)'],
      ['ContributeModalComponent','app-contribute-modal','Aportación manual + selector multi-cuenta (RN-F024-17)'],
      ['AutoRuleFormComponent','app-auto-rule-form','Configurar regla automática mensual'],
      ['MilestoneTimelineComponent','app-milestone-timeline','Visualización hitos 25/50/75/100%'],
      ['SavingsWidgetComponent','app-savings-widget','Widget dashboard (eager · DashboardModule)'],
      ['ProjectionChartComponent','app-projection-chart','Gráfico proyección vs deadline'],
      ['GoalIconPickerComponent','app-goal-icon-picker','Selector visual icono'],
      ['ProgressBarComponent','app-progress-bar','Reusable progress bar con semáforo'],
      ['AccountSelectorComponent','app-account-selector','Selector cuenta origen con saldo (DR-S26-008)']
    ], [2500,2200,3800]),
    h1('3. Patrones aplicados'),
    bullet('OnPush change detection en todos los componentes + cdr.markForCheck() en cada mutación'),
    bullet('destroy$ + takeUntil en suscripciones para evitar memory leaks (LA-CORE-051)'),
    bullet('router.navigateByUrl exclusivamente (LA-CORE-068) — NUNCA [href] interno'),
    bullet('clearTimeout en ngOnDestroy donde se usa setTimeout'),
    bullet('[(ngModel)] + FormsModule en selects con reset programático (GR-ANGULAR-001)'),
    h1('4. Manejo defensivo de concurrencia (B.4 quick patch)'),
    p('Tras hallazgo del PO durante Step 7 (DR-S26-007), ContributeModalComponent implementa:'),
    bullet('1) POST /contributions inicial'),
    bullet('2) Si 409 → setTimeout 500ms → reintento automático (1 vez)'),
    bullet('3) Si segundo 409 → mensaje UX inline "Conflicto de concurrencia detectado. Espera unos segundos y reintenta la aportación."'),
    bullet('4) DEBT-Q-073 abierta para refactor limpio en S27 (jitter + logging + endpoints unificados)'),
    h1('5. Auth guard fix (Hallazgo 1)'),
    p('goalOwnerGuard fue reescrito durante Step 7 (DR-S26-008): el refactor parcial de DEBT-033 había dejado tres sistemas de auth coexistiendo (sessionStorage, JWT decode, AuthService) sin escritor para el path sessionStorage, lo que provocaba redirect a /login. El guard ahora consulta exclusivamente AuthService.getUser() y comprueba ownership contra la respuesta del backend. DEBT-FE-074 abierta para refactor unificado completo en S27.'),
    h1('6. Selector multi-cuenta (OBS-008/009)'),
    p('AccountSelectorComponent obtiene cuentas desde GET /api/v1/accounts y muestra saldos reales. Selección inicial: si goal.sourceAccountId está en la lista activa, se preselecciona; si no, primera cuenta. Sustituye la cuenta única hardcoded y los placeholders de saldo (RN-F024-17).'),
    h1('7. UX preflight gate (lecciones aprendidas)'),
    bullet('PROTO-FEAT-024-sprint26.html validado por PO antes de implementación (LA-CORE-050)'),
    bullet('Verificación visual componente-por-componente en G-4 y G-5 (GR-VISUAL-001)'),
    bullet('LA-CORE-067 / 068: políticas de UI estable y router de navegación')
  ]);
}

// ═══ DOC 5 — QA Report ═══════════════════════════════════════════════════
async function genQA() {
  await saveDoc('QA-Report-FEAT-024-Sprint26.docx', [
    ...coverPage('QA Report','FEAT-024 Objetivos de Ahorro · "Mis Metas"'),
    h1('1. Resumen ejecutivo'),
    mkTable(['Métrica','Valor'],[
      ['Test cases backend','147'],
      ['Ejecutados','147'],
      ['PASS','147 (100%)'],
      ['Tests E2E (Playwright)','6 (6/6 PASS)'],
      ['Cobertura instrucciones (Jacoco savings)','84.3%'],
      ['Cobertura líneas','87.2%'],
      ['Cobertura ramas','88.1%'],
      ['Defectos críticos abiertos','0'],
      ['Gate G-6','APROBADO CON CONDICIONES (qa-lead + product-owner)'],
      ['Condiciones G-6 → resueltas en Step 7','C1 BUG-Q-001 + C2 BUG-Q-008 + C3 BUG-Q-003']
    ], [3500,5000], [GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,YELLOW,GREEN]),
    h1('2. Desglose por tipo'),
    mkTable(['Tipo','Nº TCs','Resultado'],[
      ['US (funcionales)','8','8/8 PASS (TC agrupados por US: 094 TCs totales)'],
      ['RN (reglas negocio)','17','17/17 PASS'],
      ['IT (integración @SpringBootTest)','12','12/12 PASS'],
      ['E2E (Playwright)','6','6/6 PASS'],
      ['Concurrencia (smoke 409)','10','7×201 + 3×409 sin pérdida de datos'],
      ['Seguridad','7','7/7 PASS (rate-limit, audit, OTP, CSRF, CORS, authz, SCA > 30€)'],
      ['Accesibilidad (WCAG AA)','5','5/5 PASS'],
      ['Fidelidad prototipo (GR-VISUAL-001)','12','12/12 PASS post fixes Hallazgo 1 + OBS-008/009']
    ], [3500,1500,3500]),
    h1('3. Bugs gestionados durante Step 6 + Step 7'),
    p('Step 6 abrió 8 bugs (BUG-S26-Q-001 a BUG-S26-Q-009 sin Q-002): 2 críticos, 1 alto, 4 medios, 1 bajo. Resolución completa en Step 7:'),
    mkTable(['ID','Severidad','Descripción','Resolución'],[
      ['BUG-Q-001','Crítico','seed inicial categoría VIAJES → debía ser VIAJE','Flyway V33 UPDATE category VIAJES → VIAJE'],
      ['BUG-Q-008','Crítico','Race condition en POST /contributions sin @Version','@Version + retry 3x + IT concurrencia (cierra ADR-041)'],
      ['BUG-Q-003','Alto','availableBalance no decrementaba correctamente al aportar','Fix en SavingsContributionService — orden transaccional'],
      ['BUG-Q-004..007','Medio','Validaciones DTO + mensajes error i18n','@Validated + i18n keys'],
      ['BUG-Q-009','Bajo','Spinner sin aria-label','Atributo ARIA añadido']
    ], [800,1200,3500,3000]),
    h1('4. Hallazgos detectados durante Step 7 (verificación visual PO)'),
    p('Cuatro hallazgos adicionales durante DevOps; los cuatro resueltos in-step antes de G-7:'),
    mkTable(['Hallazgo','Tipo','Resolución','DR'],[
      ['B.4 quick patch 409','Robustez frontend','Reintento backoff 500ms + mensaje UX inline','DR-S26-007'],
      ['Hallazgo 1 auth guard','Defecto crítico','goalOwnerGuard reescrito — 3 auth systems consolidados','DR-S26-008'],
      ['OBS-008 selector cuenta única','Fidelidad UX','AccountSelectorComponent multi-cuenta + saldos reales','DR-S26-008'],
      ['OBS-009 saldos placeholder','Fidelidad UX','GET /api/v1/accounts integrado en aportación','DR-S26-008']
    ], [2200,1800,3500,1500]),
    h1('5. Lessons Learned generadas'),
    bullet('LA-026-01..08 — 8 lecciones documentadas en sprint (memoria session.json)'),
    bullet('Candidatas a SOFIA-CORE: GR-SHELL-002 (parser shell VAR=val) y GR-FE-002 (E2E UI-driven obligatoria)'),
    bullet('Aplicada en SOFIA-CORE: GR-SHELL-001 (mvn en allowlist + TIMEOUT 600s · commit 998f430)'),
    h1('6. Cobertura por módulo (Jacoco savings)'),
    bullet('domain — 92% instr, 95% line'),
    bullet('application/usecase — 88% instr, 90% line'),
    bullet('infrastructure/persistence — 81% instr, 84% line'),
    bullet('api/controller — 79% instr, 82% line (ramas defensivas 409 difíciles de cubrir sin chaos test)')
  ]);
}

// ═══ DOC 6 — Code Review Report ══════════════════════════════════════════
async function genCR() {
  await saveDoc('Code-Review-FEAT-024-Sprint26.docx', [
    ...coverPage('Code Review Report','FEAT-024 Objetivos de Ahorro · "Mis Metas"'),
    h1('1. Veredicto'),
    mkTable(['Campo','Valor'],[
      ['Verdict','APPROVED'],
      ['Reviewer','SOFIA Code Reviewer Agent v2.6'],
      ['Fecha','2026-05-08T06:47:56Z'],
      ['Scope','Step 4 Fase H (5 commits) + Fases A..G validadas en G-4'],
      ['Blocker','0'],
      ['Major','0'],
      ['Minor','2 (corregidos pre-G-5)'],
      ['Suggestion','4 (3 aplicadas, 1 deferred)'],
      ['Gate G-5','APPROVED HITL TL']
    ], [3000,5500], [GREEN,null,null,null,GREEN,GREEN,YELLOW,null,GREEN]),
    h1('2. Hallazgos corregidos antes del gate'),
    mkTable(['ID','Severidad','Descripción','Fix'],[
      ['RV-M01','Minor','ContributeRequest.amount sin @Min(10) — RN-F024-03 no validada en API','@Min(10) y @Max(5000) añadidos al DTO'],
      ['RV-M02','Minor','SavingsExceptionHandler 409 sin Content-Type explicit','MediaType.APPLICATION_JSON_VALUE en ResponseEntity']
    ], [800,1200,3500,3000]),
    h1('3. Sugerencias'),
    bullet('RV-S01 — Extraer paginación máxima a application.yml — APLICADA'),
    bullet('RV-S02 — Métricas Micrometer en SavingsContributionService — APLICADA'),
    bullet('RV-S03 — Helper userId() duplicado en 3 controllers — DEFERIDA a DEBT-053 (refactor transversal)'),
    bullet('RV-S04 — Documentar invariante reservedAmount ≤ targetAmount con assertion — APLICADA'),
    h1('4. Cobertura revisión'),
    bullet('21 clases Java revisadas (domain + application + infrastructure + api)'),
    bullet('12 componentes Angular revisados'),
    bullet('V32__savings.sql + V33__savings_categories.sql revisadas (BUG-Q-001 detectado en CR pero solo confirmado en QA)'),
    bullet('Revisión cruzada Architect en ADR-040/041/042/043'),
    h1('5. Política OBS — gap detectado'),
    p('Durante Step 7 emergieron dos OBS-008/009 que NO habían sido escaladas a DEBT formal en este informe Code Review. Lección aprendida: cualquier OBS-XXX inline en código debe generar entrada en informe Code Reviewer (política GR-FE-002 propuesta a SOFIA-CORE).')
  ]);
}

// ═══ DOC 7 — Security Report ═════════════════════════════════════════════
async function genSEC() {
  await saveDoc('Security-Report-FEAT-024-Sprint26.docx', [
    ...coverPage('Security Report','FEAT-024 Objetivos de Ahorro · "Mis Metas"'),
    h1('1. Resumen — Semáforo VERDE'),
    mkTable(['Campo','Valor','Estado'],[
      ['Última auditoría','2026-05-08','GREEN'],
      ['CVE críticos','0','GREEN'],
      ['CVE altos','0','GREEN'],
      ['CVE LOW transitivos','2 (DEBT-060)','YELLOW'],
      ['SAST findings','1 BAJO (SEC-F024-01 → DEBT-059)','YELLOW'],
      ['SAST blocker','0','GREEN'],
      ['Secrets en código','0','GREEN'],
      ['PCI-DSS compliant','true','GREEN'],
      ['GDPR compliant','true','GREEN']
    ], [3000,4000,1500], [GREEN,GREEN,GREEN,YELLOW,YELLOW,GREEN,GREEN,GREEN,GREEN]),
    h1('2. Controles de seguridad implementados'),
    bullet('Autorización: ownership check obligatorio en todos los endpoints /savings/goals/{id}/* (goalOwnerGuard backend)'),
    bullet('Auditoría: SecurityEventType extendido con SAVINGS_GOAL_CREATED, SAVINGS_GOAL_CLOSED, SAVINGS_CONTRIBUTION_MADE, SAVINGS_AUTO_RULE_CONFIGURED'),
    bullet('Rate limiting: 30 req/min/usuario en /savings/** (Redis token bucket)'),
    bullet('SCA PSD2: cierres con devolución > 30€ requieren X-OTP header (FEAT-001 2FA)'),
    bullet('CSRF: token validado en POST/PUT/DELETE'),
    bullet('CORS: orígenes restrictivos según application-prod.yml'),
    h1('3. SAST findings'),
    mkTable(['ID','Severidad','Descripción','Status'],[
      ['SEC-F024-01','BAJO','Validación regex en title permitiría unicode normalization edge case','Aceptado · DEBT-059 S27']
    ], [1000,1200,5000,1300]),
    h1('4. CVE LOW transitivos'),
    bullet('2 CVEs LOW heredados de dependencias transitivas Spring Boot (preexistentes, no introducidos por FEAT-024)'),
    bullet('DEBT-060 abierta para evaluación caso a caso (CVSS 3.1 ambos)'),
    h1('5. PCI-DSS y GDPR'),
    bullet('PCI-DSS: no se manejan datos de tarjeta en savings (solo accounts internas)'),
    bullet('GDPR Art.15 (acceso): savings_goals + goal_allocations añadidos a export FEAT-019'),
    bullet('GDPR Art.17 (supresión): soft-delete con preservación 7 años (RN-F024-10) por obligación contable RDL 5/2018'),
    bullet('Auditoría SecurityEvent retenida 7 años'),
    h1('6. Veredicto Step 5b'),
    p('APPROVED sin condiciones · 0 CVEs críticos · 0 secrets · 1 hallazgo SAST BAJO documentado como DEBT-059. La feature FEAT-024 no introduce vectores nuevos de ataque significativos. Se recomienda activar monitorización de tasa 409 en producción para detectar abuso del retry path.')
  ]);
}

// ═══ DOC 8 — Release Notes ═══════════════════════════════════════════════
async function genRelNotes() {
  await saveDoc('Release-Notes-v1.26.0-Sprint26.docx', [
    ...coverPage('Release Notes — v1.26.0','FEAT-024 Objetivos de Ahorro · "Mis Metas"'),
    h1('1. Metadata'),
    mkTable(['Campo','Valor'],[
      ['Fecha release','2026-05-08'],
      ['Sprint','26 · FEAT-024 Objetivos de Ahorro'],
      ['Servicios','bankportal-backend · bankportal-frontend'],
      ['Release Manager','DevOps Agent (G-7 APROBADO HITL-DV)'],
      ['Release anterior','v1.25.0 (Mi Dinero PFM · Sprint 25)']
    ], [2500,6000]),
    h1('2. Nueva funcionalidad'),
    p('FEAT-024 introduce el módulo de Objetivos de Ahorro nativo: tras "Mi Dinero" (S25, entender los gastos), ahora el cliente puede actuar sobre su ahorro con metas concretas, aportaciones manuales y automáticas, hitos y proyección. Cierra la narrativa "banca inteligente" y refuerza el posicionamiento competitivo frente a N26, Revolut y Monzo.'),
    h1('3. User Stories entregadas'),
    mkTable(['ID','Título','SP'], US.map(u=>[u[0],u[1],u[2]]), [1500,5500,1500]),
    h1('4. Mejoras de robustez Step 7'),
    bullet('B.4 quick patch retry 409 — manejo defensivo del frontend ante CONCURRENCY_CONFLICT (DR-S26-007)'),
    bullet('Hallazgo 1 fix auth guard — goalOwnerGuard reescrito tras 3 sistemas auth coexistiendo (DR-S26-008)'),
    bullet('OBS-008 + OBS-009 selector multi-cuenta — AccountSelectorComponent con saldos reales (DR-S26-008)'),
    h1('5. Deuda técnica cerrada'),
    bullet('DEBT-051 — ShedLock cableado correctamente (estaba declarado pero sin @SchedulerLock)'),
    bullet('DEBT-048..050 — OpenAPI 3.1 vía springdoc + script validate-smoke-vs-openapi (cierra GR-SMOKE-001)'),
    bullet('DEBT-033 — refactor parcial auth identificado y formalizado para cierre completo en S27 (DEBT-FE-074)'),
    h1('6. Servicios desplegados'),
    mkTable(['Servicio','Versión anterior','Versión nueva'],[
      ['bankportal-backend','v1.25.0','v1.26.0'],
      ['bankportal-frontend','v1.25.0','v1.26.0']
    ], [3500,2500,2500]),
    h1('7. Cambios infraestructura'),
    bullet('Flyway V32 + V33 — 4 nuevas tablas savings_goals · goal_allocations · goal_auto_rules · goal_milestones'),
    bullet('Angular módulo /savings lazy-loaded con 12 componentes; widget eager en DashboardModule'),
    bullet('OpenAPI 3.1 endpoint /v3/api-docs activo'),
    bullet('Sin variables de entorno nuevas — reutiliza PostgreSQL, Redis, VAPID'),
    h1('8. Métricas de calidad de release'),
    mkTable(['Métrica','Valor'],[
      ['Tests backend','147/147 PASS'],
      ['Tests E2E','6/6 PASS'],
      ['Cobertura instr/línea/rama','84.3% / 87.2% / 88.1%'],
      ['CVE críticos / altos','0 / 0'],
      ['Defectos en producción','0'],
      ['NCs','0'],
      ['Smoke 409 concurrencia','7×201 + 3×409 sin pérdida'],
      ['Trazabilidad Jira','SCRUM-163 → SCRUM-173 (sprint 497)']
    ], [3500,5000]),
    h1('9. Breaking changes / Rollback'),
    bullet('Sin breaking changes. Endpoints existentes mantienen compatibilidad.'),
    bullet('Tablas savings_* aditivas — invariante availableBalance ≤ ledgerBalance preservado (ADR-040)'),
    bullet('Rollback a v1.25.0 documentado en Runbook v1.26.0 — RTO 10 min, requiere DROP manual de tablas savings_*')
  ]);
}

// ═══ DOC 9 — Runbook ═════════════════════════════════════════════════════
async function genRunbook() {
  await saveDoc('Runbook-v1.26.0-Sprint26.docx', [
    ...coverPage('Runbook — backend-2fa v1.26.0','FEAT-024 Objetivos de Ahorro · "Mis Metas"'),
    h1('1. Despliegue'),
    p('Stack docker compose en infra/compose/docker-compose.yml. Puertos host: PG 5433, Redis 6380, backend 8081, frontend 4201, Mailhog 8025.'),
    bullet('docker compose -f infra/compose/docker-compose.yml build --no-cache backend frontend'),
    bullet('docker compose -f infra/compose/docker-compose.yml up -d'),
    bullet('docker compose -f infra/compose/docker-compose.yml ps · logs --tail=80'),
    h1('2. Verificación post-despliegue'),
    bullet('Flyway V32+V33 aplicadas: SELECT version FROM flyway_schema_history WHERE version IN (32,33);'),
    bullet('Tablas savings_* y goal_* creadas (information_schema.tables)'),
    bullet('Smoke completo: bash infra/compose/smoke-test-v1.26.0.sh'),
    bullet('Health check: curl http://localhost:8081/actuator/health'),
    bullet('OpenAPI contract: curl http://localhost:8081/v3/api-docs'),
    h1('3. Endpoints nuevos — verificación manual'),
    p('Token JWT requerido (OTP bypass staging/local: 123456)', {italics:true}),
    mkTable(['Acción','Curl resumido'],[
      ['Listar objetivos','GET /api/v1/savings/goals'],
      ['Crear objetivo','POST /api/v1/savings/goals con title/targetAmount/deadline/category/sourceAccountId'],
      ['Aportar','POST /api/v1/savings/goals/{id}/contributions con sourceAccountId/amount'],
      ['Configurar regla auto','PUT /api/v1/savings/goals/{id}/auto-rule con amount/dayOfMonth/sourceAccountId'],
      ['Widget dashboard','GET /api/v1/savings/dashboard-widget']
    ], [2500,6000]),
    h1('4. Verificación frontend'),
    bullet('Login con OTP bypass · sidebar muestra "Mis Metas"'),
    bullet('Dashboard muestra widget "Mi ahorro del mes" sin errores en consola'),
    bullet('Crear objetivo → modal abre, validaciones funcionan, persiste'),
    bullet('Aportar → selector multi-cuenta muestra saldos reales (no placeholders)'),
    bullet('Smoke 409: 10 aportaciones secuenciales rápidas → frontend recupera con mensaje correcto'),
    h1('5. Procedimiento de rollback a v1.25.0'),
    p('RTO objetivo 10 min · RPO 0', {bold:true}),
    bullet('Detener servicios: docker compose stop backend frontend'),
    bullet('Editar docker-compose.yml a imágenes v1.25.0'),
    bullet('Rollback Flyway manual: DROP TABLE goal_milestones, goal_auto_rules, goal_allocations, savings_goals CASCADE; DELETE FROM flyway_schema_history WHERE version IN (32,33);'),
    bullet('Levantar v1.25.0: docker compose up -d backend frontend'),
    bullet('Validar smoke v1.25.0: bash infra/compose/smoke-test-v1.25.0.sh'),
    h1('6. Monitorización'),
    bullet('Logs en tiempo real: docker compose logs -f backend'),
    bullet('Métricas Spring Actuator: http://localhost:8081/actuator/metrics'),
    bullet('Endpoint crítico — concurrencia 409: tasa 409/201 target < 5%; si > 10% sostenido revisar saturación retry optimista (DEBT-Q-073)'),
    bullet('Endpoint crítico — auto-rule scheduler: ejecución diaria 04:00 vía ShedLock; verificar lock acquisition + conteo aportaciones procesadas'),
    bullet('Notificaciones push: revisar Mailhog (UI :8025) en local-dev'),
    h1('7. Side-effects local-dev tras smoke C4'),
    bullet('savings_goals.id=51000000-...-1101 ("Vacaciones Japón 2027"): reservedAmount=3060'),
    bullet('Auto-rule del goal Vacaciones Japón: amount=30, dayOfMonth=5'),
    bullet('Cleanup baseline: bash infra/scripts/cleanup-e2e-data-sprint26.sh + docker compose down -v + up -d'),
    h1('8. Configuración relevante'),
    mkTable(['Aspecto','Valor'],[
      ['Java home','/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home'],
      ['Maven','/opt/homebrew/bin/mvn (sin pom raíz; ejecutar desde apps/backend-2fa)'],
      ['Imagen backend','bankportal-backend-2fa:local-dev (rebuild 2026-05-08 11:09)'],
      ['Imagen frontend','bankportal-frontend-portal:local-dev (rebuild 2026-05-08 13:05)'],
      ['Esquema BBDD','bankportal versión 33'],
      ['OTP bypass staging/local','123456'],
      ['Branch / Tag','feature/FEAT-024-sprint26 → tag v1.26.0 post-G-9']
    ], [3000,5500])
  ]);
}

// ═══ DOC 10 — Sprint Report PMC ══════════════════════════════════════════
async function genPMC() {
  await saveDoc('Sprint26-Report-PMC.docx', [
    ...coverPage('Sprint Report — CMMI PMC','Sprint 26 · FEAT-024 · v1.26.0'),
    h1('1. Sprint metadata'),
    mkTable(['Campo','Valor'],[
      ['Sprint number','26'],
      ['Sprint name','Tablero Sprint 26'],
      ['Feature','FEAT-024 Objetivos de Ahorro'],
      ['Release target','v1.26.0'],
      ['Sprint goal','Extender banca inteligente de BankPortal mediante gestor de Objetivos de Ahorro con aportaciones manuales y automáticas, seguimiento de hitos y proyección. Consolidar contrato API backend mediante OpenAPI 3.1.'],
      ['Sprint Jira ID','497'],
      ['Started','2026-04-21'],
      ['End date planned','2026-06-16'],
      ['Closure target','2026-05-10 (post G-9)']
    ], [3000,6000]),
    h1('2. Velocity y entrega'),
    mkTable(['Métrica','Valor','Target','Semáforo'],[
      ['SP delivered','24','24','GREEN'],
      ['SP acumulados','617','≥24/sprint','GREEN'],
      ['Tests backend','147','≥100','GREEN'],
      ['Tests E2E','6','≥4','GREEN'],
      ['Tests acumulados','1189','≥1000','GREEN'],
      ['Cobertura instrucciones','84.3%','≥80%','GREEN'],
      ['Cobertura líneas','87.2%','≥85%','GREEN'],
      ['Defectos prod','0','0','GREEN'],
      ['NCs','0','0','GREEN'],
      ['CVE crit/high','0/0','0/0','GREEN']
    ], [2500,1700,1700,2600], [GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN]),
    h1('3. Backlog Jira'),
    mkTable(['Issue','Título','SP','Estado'], JIRA, [1500,4500,800,1700]),
    h1('4. Gates aprobados'),
    bullet('G-1 Scrum Master · APPROVED HITL-PO'),
    bullet('G-2 Requirements Analyst · APPROVED HITL-PO'),
    bullet('G-2b FA-Agent · AUTO'),
    bullet('G-2c UX/UI Designer · APPROVED HITL-PO+TL (PROTO-FEAT-024-sprint26.html)'),
    bullet('G-3 Architect · APPROVED HITL-TL (ADR-040..043)'),
    bullet('G-3b Documentation Agent + FA-Agent · AUTO'),
    bullet('G-4 Developer · COMPLETED 4 fases (A..H)'),
    bullet('G-5 Code Reviewer · APPROVED HITL-TL · 0 blockers'),
    bullet('G-5b Security Agent · APPROVED · semáforo GREEN'),
    bullet('G-6 QA Tester · APPROVED CON CONDICIONES (resueltas en Step 7)'),
    bullet('G-7 DevOps · APPROVED HITL-DV (scope ampliado B.4 + Hallazgo 1 + OBS-008/009)'),
    bullet('G-8 pendiente HITL-PM (esta documentación)'),
    bullet('G-9 pendiente HITL-PO (cierre sprint en Step 9)'),
    h1('5. Hallazgos durante Step 7 (verificación visual PO)'),
    p('Cuatro hallazgos detectados durante DevOps fueron resueltos in-step antes de G-7:'),
    bullet('B.4 retry 409 (DR-S26-007 → DEBT-Q-073)'),
    bullet('Hallazgo 1 auth guard (DR-S26-008 → DEBT-FE-074)'),
    bullet('OBS-008 selector cuenta única (DR-S26-008 → DEBT-FE-075)'),
    bullet('OBS-009 saldos placeholder (DR-S26-008 → DEBT-FE-075)'),
    h1('6. Lessons Learned generadas'),
    bullet('LA-026-01..08 — 8 lecciones documentadas en sprint'),
    bullet('LA-CORE candidatas pendientes promoción: GR-SHELL-002, GR-FE-002'),
    bullet('LA-CORE aplicada: GR-SHELL-001 (commit SOFIA-CORE 998f430)'),
    h1('7. Riesgos detectados y mitigaciones (RSKM)'),
    bullet('RSK-S26-01 — refactors auth abandonados (DEBT-033) generaron Hallazgo 1 → mitigación: DEBT-FE-074 prioridad ALTA en S27'),
    bullet('RSK-S26-02 — E2E API-driven exclusivo no detectó OBS-008/009 → mitigación: GR-FE-002 + DEBT-FE-075 en S27'),
    bullet('RSK-S26-03 — OBS-XXX inline sin escalado a DEBT formal (deuda invisible) → mitigación: política nueva GR-FE-002 obligatoria en informe Code Reviewer')
  ]);
}

// ═══ DOC 11 — CMMI Evidence ══════════════════════════════════════════════
async function genCMMI() {
  await saveDoc('CMMI-Evidence-Sprint26.docx', [
    ...coverPage('CMMI L3 — Evidencias','Sprint 26 FEAT-024'),
    h1('1. Process Areas cubiertas'),
    mkTable(['PA','Nombre','Evidencia S26'],[
      ['PP','Project Planning','sprint26-planning-doc.docx · capacity 24 SP · 11 issues Jira (SCRUM-163..173)'],
      ['PMC','Project Monitoring & Control','Sprint26-Report-PMC.docx · Dashboard global · Gates G-1..G-7 trazados con timestamps'],
      ['RSKM','Risk Management','3 riesgos RSK-S26-01..03 tratados; LA promovidas a SOFIA-CORE; mitigaciones formalizadas en DEBT-FE-074/075'],
      ['VER','Verification','Code Review CR APPROVED + QA 147/147 PASS + 6/6 E2E + smoke 409 sin pérdida'],
      ['VAL','Validation','Verificación visual PO 2026-05-08 · 4 hallazgos detectados Y resueltos in-step antes G-7'],
      ['CM','Configuration Management','Git tag v1.26.0 previsto · branch feature/FEAT-024-sprint26 · Flyway V32+V33'],
      ['PPQA','Process & Product QA','Gate G-6 qa-lead+product-owner · Security Report semáforo GREEN'],
      ['REQM','Requirements Management','SRS + 17 RN + RTM completa · trazabilidad US→RN→endpoint→componente→TC'],
      ['DAR','Decision Analysis & Resolution','ADR-040..043 documentados con alternativas + trade-offs · DR-S26-007/008 con análisis raíz · GR-CI-002 diferida formalmente a S27 (decisión documentada en sección 4 de este informe)']
    ], [600,2000,5900]),
    h1('2. Generic Practices (GP2.x)'),
    bullet('GP2.1 Policy — SOFIA v2.7 + CMMI L3 activa en session.json'),
    bullet('GP2.2 Plan — sprint26-planning-doc.docx versionado en Git'),
    bullet('GP2.3 Resources — 7 roles SOFIA + PO + Tech Lead + QA Lead asignados (HITL = Angel de la Cuadra)'),
    bullet('GP2.4 Assign responsibility — Gates trazan aprobador y timestamp en gate_history'),
    bullet('GP2.5 Train people — Lessons Learned propagadas a SOFIA-CORE (GR-SHELL-001 aplicada · GR-SHELL-002, GR-FE-002 pendientes)'),
    bullet('GP2.6 Manage configurations — Git + session.json + Confluence pages'),
    bullet('GP2.7 Stakeholders — PO + TL + QA + RM + PM identificados'),
    bullet('GP2.8 Monitor & control — Dashboard global regenerado en cada gate'),
    bullet('GP2.9 Objectively evaluate — QA + Code Review + Security agents independientes'),
    bullet('GP2.10 Review with higher level — G-8 (PM) + G-9 (PO) pendientes en Step 8 y Step 9'),
    h1('3. Métricas Process Performance'),
    mkTable(['Métrica','Valor S26','Baseline ORG','Semáforo'],[
      ['Velocity','24 SP','22-28 SP','GREEN'],
      ['Coverage instr','84.3%','≥80%','GREEN'],
      ['Coverage línea','87.2%','≥85%','GREEN'],
      ['Defectos prod','0','0','GREEN'],
      ['CVE críticas/altas','0/0','0/0','GREEN'],
      ['Time to gate','<24h','<48h','GREEN'],
      ['Gate rework ratio','3/11 (B.4 + H1 + OBS)','<1/6','YELLOW']
    ], [2500,1700,1700,2600], [GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,YELLOW]),
    p('Gate rework ratio 3/11 (YELLOW): 4 hallazgos durante verificación visual PO en Step 7 — todos resueltos in-step pre-G-7. Acciones correctivas formalizadas en DEBT-FE-074 (refactor unificado auth) y DEBT-FE-075 (E2E UI-driven obligatoria), ambas alta prioridad S27. Política nueva GR-FE-002 cierra el gap de OBS-XXX inline sin escalado.'),
    h1('4. Decisión DAR — GR-CI-002 (diferida desde Step 4)'),
    p('GR-CI-002 (Continuous Integration enhancement no especificada en S26 scope) fue diferida durante Step 4 sin formalización. Decisión registrada en este informe:'),
    bullet('Estado: DIFERIDA FORMAL a Sprint 27'),
    bullet('Justificación: S26 sobrepasó scope original (B.4 + Hallazgo 1 + OBS-008/009 absorbieron capacidad de Step 7 DevOps); activar GR-CI-002 mid-sprint generaría riesgo CI sin valor en cierre actual'),
    bullet('Acción S27: definir ADR-S27-XX al inicio del sprint con análisis de alternativas (activar / refinar / archivar)'),
    bullet('Owner: Architect S27 + DevOps S27 · HITL: PO + TL'),
    h1('5. Trazabilidad CMMI a artefactos'),
    bullet('PP → docs/sprints/sprint26-planning-doc.docx + session.json.cmmi'),
    bullet('PMC → docs/dashboard/bankportal-global-dashboard.html + sofia.log + Sprint26-Report-PMC.docx'),
    bullet('REQM → docs/deliverables/sprint-26-FEAT-024/SRS-FEAT-024-sprint26.md + TRACEABILITY-FEAT-024-Sprint26.docx'),
    bullet('VER → docs/quality/QA-Report-FEAT-024-sprint26.md + STEP5-code-review-sprint26-FEAT-024.md'),
    bullet('VAL → docs/quality/evidence/sprint-26/ + checklist-pre-G7-sprint26.md'),
    bullet('CM → git log feature/FEAT-024-sprint26 + Flyway V32+V33'),
    bullet('PPQA → SecurityReport-Sprint26-FEAT-024.md + gates session.json'),
    bullet('RSKM → RISK-REGISTER-Sprint26.docx + DEBTs S26'),
    bullet('DAR → ADRs S26 + DRs S26-007/008 + sección 4 de este informe (GR-CI-002)')
  ]);
}

// ═══ DOC 12 — Meeting Minutes ════════════════════════════════════════════
async function genMeetings() {
  await saveDoc('MEETING-MINUTES-Sprint26.docx', [
    ...coverPage('Meeting Minutes','Sprint 26 · FEAT-024 · Planning + Reviews + Retro'),
    h1('1. Sprint Planning (2026-04-21)'),
    mkTable(['Campo','Detalle'],[
      ['Fecha','2026-04-21'],
      ['Asistentes','PO + Scrum Master + Tech Lead + QA Lead + Architect (HITL = Angel)'],
      ['Sprint goal','Objetivos de Ahorro · 24 SP capacity · v1.26.0 target'],
      ['Backlog comprometido','SCRUM-163..173 · 11 issues · 24 SP'],
      ['Definition of Done','17 docs entregables + tests ≥85% línea + 0 CVE crit/high + smoke OK + 0 blockers Code Review'],
      ['Decisiones clave','ADR-040 segregación virtual aprobada en planning · OpenAPI 3.1 como contrato canónico (cierra DEBT-048..050)']
    ], [2500,6000]),
    h1('2. Daily standups y review intermedio'),
    bullet('Step 4 ejecutado en 4 fases (A..H) con review entre fases por TL'),
    bullet('Step 5 Code Review pre-G-5 detectó RV-M01/M02 — corregidos in-step'),
    bullet('Step 5b Security Agent semáforo GREEN sin condiciones'),
    bullet('Step 6 QA Tester aprobó con condiciones C1+C2+C3 — resueltas en Step 7'),
    h1('3. Step 7 verificación visual PO (2026-05-08)'),
    p('Sesión de validación visual con el PO descubrió 4 hallazgos no detectados por automated tests:'),
    bullet('B.4 quick patch retry 409 → DR-S26-007 + DEBT-Q-073'),
    bullet('Hallazgo 1 auth guard → DR-S26-008 + DEBT-FE-074'),
    bullet('OBS-008 selector cuenta única → DR-S26-008 + DEBT-FE-075'),
    bullet('OBS-009 saldos placeholder → DR-S26-008 + DEBT-FE-075'),
    p('Decisión PO: resolver in-step (no diferir) por ser críticos para UX cliente. Resueltos antes de G-7.'),
    h1('4. Sprint Review (programada post-G-9)'),
    bullet('Demo a Banco Meridian de Mis Metas con todos los flujos (crear, aportar, regla auto, hitos, cierre con devolución)'),
    bullet('Demostración de robustez 409 (10 aportaciones secuenciales)'),
    bullet('Métricas de calidad presentadas'),
    h1('5. Sprint Retrospective (programada post-G-9)'),
    p('Temas a debatir en retro S26:'),
    bullet('What went well: 0 defectos prod · 8 LAs documentadas · GR-SHELL-001 aplicada en SOFIA-CORE'),
    bullet('What didnt: 4 hallazgos visuales en Step 7 que escaparon a Step 5/5b/6 · refactor parcial DEBT-033 abandonado'),
    bullet('Action items: DEBT-FE-074 + DEBT-FE-075 obligatorias S27 · políticas GR-FE-002 + GR-SHELL-002 en SOFIA-CORE · activar checklist fidelidad pre-G-4 desde S27'),
    h1('6. Decisiones documentadas en el sprint'),
    mkTable(['ID','Tipo','Descripción'], DR, [1500,1500,5500])
  ]);
}

// ═══ DOC 13 — Project Plan v1.26 ═════════════════════════════════════════
async function genPP() {
  await saveDoc('PROJECT-PLAN-v1.26.docx', [
    ...coverPage('Project Plan v1.26','BankPortal · Sprint 26 + S27 outlook'),
    h1('1. Hitos Sprint 26 (S26)'),
    mkTable(['Fecha','Hito','Estado'],[
      ['2026-04-21','Sprint Planning · Goal aprobado','COMPLETED'],
      ['2026-04-22..27','Step 1-2-2b-2c (Scrum + Requirements + FA + UX/UI)','COMPLETED'],
      ['2026-04-28..05-02','Step 3-3b (Architect + Doc + FA)','COMPLETED'],
      ['2026-05-03..06','Step 4 Developer (4 fases)','COMPLETED'],
      ['2026-05-07','Step 5 Code Review + Step 5b Security','COMPLETED'],
      ['2026-05-08','Step 6 QA + Step 7 DevOps','COMPLETED'],
      ['2026-05-10','G-7 APROBADO HITL-DV · Step 8 (este informe)','IN PROGRESS'],
      ['2026-05-10..11','G-8 HITL-PM · Step 8b FA-Agent','PENDING'],
      ['2026-05-11..12','G-9 HITL-PO · Step 9 Workflow Manager · Tag v1.26.0','PENDING']
    ], [1500,5500,1500]),
    h1('2. Métricas acumuladas (S1 → S26)'),
    mkTable(['Métrica','S26 cierre proyectado'],[
      ['Story Points acumulados','617 SP'],
      ['Tests acumulados','1189'],
      ['Sprints cerrados con 0 defectos prod','25/26 (Sprint 5 tuvo 1 defecto pre-CMMI L3)'],
      ['Cobertura proyecto promedio','≥85% línea sostenida'],
      ['Process Areas CMMI cubiertas','9 (PP, PMC, REQM, RSKM, VER, VAL, CM, PPQA, DAR)'],
      ['LA promovidas a SOFIA-CORE','60+ (más LA-CORE-053..068 recientes)']
    ], [4500,4000]),
    h1('3. Plan Sprint 27 (preliminar — pending PO definition)'),
    mkTable(['ID','Scope','Prioridad','Estimación'],[
      ['DEBT-FE-074','Refactor unificado auth (cierra DEBT-033)','ALTA','2-4 días Frontend TL'],
      ['DEBT-Q-073','Refactor 409 handling clean (jitter + logging + endpoints)','MEDIA','1-2 días Frontend Dev'],
      ['DEBT-FE-075','OBS-005 + cobertura E2E UI-driven + prototype-fidelity check','MEDIA','2-3 días Frontend + QA'],
      ['DEBT-052','springdoc política prod (decisión pre-PROD con cliente)','MEDIA','discusión política'],
      ['GR-CI-002','Activación CI enhancement diferida desde S26 (decisión DAR)','MEDIA','definir ADR S27 al arranque'],
      ['FEAT-025','Por determinar PO (sugerido: feature funcional que NO toque auth)','TBD','TBD']
    ], [1500,4500,1200,1800]),
    h1('4. Capacidad y velocity baseline'),
    bullet('Velocity 24 SP/sprint sostenida durante S22-S26 (5 sprints consecutivos)'),
    bullet('Capacidad S27 estimada 24 SP — sin cambios en composición de equipo'),
    bullet('Recomendación: reservar 8-10 SP para deudas FE-074/Q-073/FE-075 en S27 (cierre técnico de S26)'),
    h1('5. Riesgos en horizonte S27'),
    bullet('Refactor auth (DEBT-FE-074) puede colisionar con FEAT-025 si esta toca auth — recomendación: FEAT-025 NO debe tocar auth'),
    bullet('GR-CI-002 ADR S27 puede revelar coste mayor del estimado — buffer de 1 SP'),
    bullet('S26 preflight Tier-A sync a SOFIA-CORE (POST-G-9) — coordinación con commit ventana cierre'),
    h1('6. Confluence + Jira'),
    bullet('Confluence parent BankPortal: 229379 · Lessons Learned: 10321921'),
    bullet('Jira project SCRUM · board 1 · sprint 497 (S26) ACTIVE'),
    bullet('Cierre Jira S26 vía UI manual (LA-025-10 / GR-ATLASSIAN-001 — MCP no soporta sprint lifecycle endpoints)')
  ]);
}

// ═══ DOC 14 — Quality Summary ════════════════════════════════════════════
async function genQS() {
  await saveDoc('QUALITY-SUMMARY-Sprint26.docx', [
    ...coverPage('Quality Summary','Sprint 26 · FEAT-024 · v1.26.0'),
    h1('1. Resumen ejecutivo · Semáforo GREEN'),
    mkTable(['Dimensión','Estado','Detalle'],[
      ['Funcionalidad','GREEN','8/8 US entregadas + 4 hallazgos resueltos in-step pre-G-7'],
      ['Tests backend','GREEN','147/147 PASS'],
      ['Tests E2E','GREEN','6/6 PASS Playwright'],
      ['Cobertura','GREEN','instr 84.3% · línea 87.2% · rama 88.1%'],
      ['Seguridad','GREEN','0 CVE crit/high · 1 SAST BAJO documentado'],
      ['Code Review','GREEN','APPROVED · 0 blockers · 2 minors corregidos'],
      ['Defectos producción','GREEN','0'],
      ['NCs','GREEN','0'],
      ['Smoke tests','GREEN','validate-smoke-vs-openapi PASS · 7×201+3×409 sin pérdida'],
      ['Documentación','IN PROGRESS','17 docs + 3 xlsx + 1 json (este Step 8)'],
      ['Dashboard global','GREEN','regenerado en cada gate']
    ], [2200,1500,5000], [GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,GREEN,YELLOW,GREEN]),
    h1('2. Trending S24 → S25 → S26'),
    mkTable(['Métrica','S24','S25','S26','Tendencia'],[
      ['SP delivered','24','24','24','SOSTENIDO'],
      ['SP acumulados','569','593','617','SOSTENIDO +24/sprint'],
      ['Tests sprint','25','64','147','SUBIDA marcada (smoke 409 + IT)'],
      ['Tests acumulados','978','1042','1189','+147 sprint'],
      ['Cobertura línea','89%','89%','87.2%','LIGERA BAJADA · concurrencia retry difícil cubrir'],
      ['Defectos prod','0','0','0','SOSTENIDO'],
      ['Gate rework','0','1 (BUG-PO)','3 (B.4+H1+OBS)','SUBIDA · acción correctiva GR-FE-002'],
      ['CVE crit/high','0/0','0/0','0/0','SOSTENIDO']
    ], [2500,1300,1300,1300,2100]),
    h1('3. Indicadores de proceso (PPQA)'),
    bullet('Time to gate: 100% gates < 24h target · GREEN'),
    bullet('Code Review verdict: APPROVED first-time · GREEN'),
    bullet('Security verdict: APPROVED sin condiciones · GREEN'),
    bullet('QA verdict: APPROVED CON CONDICIONES (3 condiciones resueltas en Step 7) · YELLOW recovered'),
    bullet('DevOps verdict: APPROVED con scope ampliado (autorizado por PO · 4 hallazgos visuales resueltos) · YELLOW recovered'),
    h1('4. Acciones correctivas formalizadas'),
    bullet('DEBT-FE-074 prioridad ALTA S27 — refactor unificado auth (raíz Hallazgo 1)'),
    bullet('DEBT-FE-075 prioridad MEDIA S27 — E2E UI-driven + prototype-fidelity check'),
    bullet('DEBT-Q-073 prioridad MEDIA S27 — refactor clean 409 handling'),
    bullet('GR-FE-002 política nueva — OBS-XXX inline obligatoriamente escalado a DEBT en informe Code Reviewer (promoción a SOFIA-CORE pendiente)'),
    bullet('GR-SHELL-002 — parser shell SOFIA admite VAR=val cmd inline (promoción a SOFIA-CORE pendiente)'),
    bullet('Activado checklist fidelidad pre-G-4 desde S26 (acción ya implementada)')
  ]);
}

// ═══ DOC 15 — Risk Register ══════════════════════════════════════════════
async function genRisk() {
  await saveDoc('RISK-REGISTER-Sprint26.docx', [
    ...coverPage('Risk Register','Sprint 26 · FEAT-024'),
    h1('1. Matriz de riesgos S26'),
    mkTable(['ID','Riesgo','Probabilidad','Impacto','Mitigación','Estado'],[
      ['RSK-S26-01','Refactor parcial auth (DEBT-033) abandonado genera código orfano y guards rotos','REALIZED','ALTO','DEBT-FE-074 ALTA prioridad S27 · refactor unificado completo','MITIGATED in-step (Hallazgo 1 resuelto pre-G-7)'],
      ['RSK-S26-02','E2E API-driven exclusivo no cubre defectos UI/visual','REALIZED','MEDIO','DEBT-FE-075 + GR-FE-002 · E2E UI-driven obligatoria + prototype-fidelity check','MITIGATED in-step (OBS-008/009 resueltos pre-G-7)'],
      ['RSK-S26-03','OBS-XXX inline sin escalado formal a DEBT (deuda invisible)','REALIZED','MEDIO','GR-FE-002 política nueva · informe Code Reviewer obligado a escalar OBS','OPEN (promoción SOFIA-CORE pendiente)'],
      ['RSK-S26-04','Concurrencia POST contributions bajo carga genera 409 sin recuperación frontend','REALIZED','ALTO','DR-S26-007 + B.4 quick patch retry · DEBT-Q-073 refactor S27','MITIGATED in-step (smoke 7×201+3×409 sin pérdida)'],
      ['RSK-S26-05','Activar GR-CI-002 mid-sprint sin análisis previo genera riesgo CI sin valor','MEDIA','MEDIO','Diferir formal a S27 con ADR-S27-XX · documentado en CMMI-Evidence sec.4 DAR','DEFERRED to S27'],
      ['RSK-S26-06','MCP shell allowlist sin VAR=val rompe scripts con env vars inline','REALIZED','BAJO','Wrapper python3 .sofia/tmp/run-mvn.py · GR-SHELL-002 a SOFIA-CORE','WORKAROUND ACTIVE'],
      ['RSK-S26-07','Sprint Jira lifecycle requiere UI manual (MCP no expone endpoints)','REALIZED','BAJO','LA-025-10 / GR-ATLASSIAN-001 · cierre via UI documentado en handoff Step 9','ACCEPTED'],
      ['RSK-S26-08','S26 preflight Tier-A sync mid-sprint romperia gobernanza SOFIA-CORE','MEDIA','MEDIO','Postpuesto a POST-G-9 · sincronización tras cierre formal','PLANNED']
    ], [1100,2800,1100,900,2300,1200])
  ]);
}

// ═══ DOC 16 — Traceability ═══════════════════════════════════════════════
async function genRTM() {
  await saveDoc('TRACEABILITY-FEAT-024-Sprint26.docx', [
    ...coverPage('Traceability Matrix (RTM)','FEAT-024 · Sprint 26'),
    h1('1. Trazabilidad RF → US → Módulo → Test → Regulación'),
    mkTable(['RF','US','Módulo / Endpoint','TC QA','Regulación'],[
      ['RF-01 Crear meta','US-024-01','SavingsGoalController POST /goals · GoalCreateModalComponent','TC-001..010','GDPR Art.5/6'],
      ['RF-02 Listar metas con progreso','US-024-02','SavingsGoalController GET /goals · GoalListComponent','TC-011..018','—'],
      ['RF-03 Detalle con histórico','US-024-03','SavingsGoalController GET /goals/{id} · GoalDetailComponent','TC-019..028','GDPR Art.15'],
      ['RF-04 Aportación manual','US-024-04','SavingsContributionController POST /contributions · ContributeModalComponent','TC-029..044, IT-001','PSD2 (rate-limit)'],
      ['RF-05 Aportación automática','US-024-05','SavingsAutoRuleController PUT /auto-rule · SavingsAutoRuleScheduler ShedLock · AutoRuleFormComponent','TC-045..056, IT-002','—'],
      ['RF-06 Editar/pausar/cerrar','US-024-06','SavingsGoalController PUT/DELETE · GoalEditModalComponent','TC-057..072, IT-003','PSD2 SCA (X-OTP > 30€)'],
      ['RF-07 Alertas hitos','US-024-07','MilestoneEvaluator → NotificationService VAPID','TC-073..082','—'],
      ['RF-08 Widget dashboard','US-024-08','SavingsGoalController GET /dashboard-widget · SavingsWidgetComponent','TC-083..094','—'],
      ['RF-09 Concurrencia 409','RN-F024-16','SavingsContributionService @Version retry · ContributeModalComponent backoff','smoke 409 (10 calls)','—'],
      ['RF-10 Multi-cuenta selector','RN-F024-17','GET /api/v1/accounts · AccountSelectorComponent','TC fidelidad (12 visual)','—'],
      ['RF-11 GDPR export/delete','RN-F024-10/12','FEAT-019 export · soft-delete preservación 7 años','TC seguridad GDPR','GDPR Art.15/17 + RDL 5/2018'],
      ['RF-12 OpenAPI contrato','DEBT-048..050','springdoc /v3/api-docs · validate-smoke-vs-openapi','smoke contract','—']
    ], [1500,1300,3500,1500,1200])
  ]);
}

// ═══ DOC 17 — Sprint Planning Doc ════════════════════════════════════════
async function genPlanning() {
  await saveDoc('sprint26-planning-doc.docx', [
    ...coverPage('Sprint 26 Planning Doc','FEAT-024 Objetivos de Ahorro · "Mis Metas"'),
    h1('1. Sprint goal'),
    p('Extender banca inteligente de BankPortal mediante gestor de Objetivos de Ahorro (viajes, hogar, emergencia, educación) con aportaciones manuales y automáticas, seguimiento de hitos y proyección. Consolidar contrato API backend mediante OpenAPI 3.1 como fuente de verdad para habilitar GR-SMOKE-001.'),
    h1('2. Capacidad y composición'),
    mkTable(['Recurso','Capacidad','Asignación'],[
      ['Sprint capacity','24 SP','11 issues SCRUM-163..173'],
      ['Equipo SOFIA','7 agentes','Scrum Master, Requirements, FA, UX/UI, Architect, Dev, Code Review, Sec, QA, DevOps, Doc, Workflow'],
      ['HITL','1 persona','Angel (PO + TL + SM + QA + DV + PM)'],
      ['Días sprint','15 días hábiles','Bandwidth ajustada por scope ampliado Step 7']
    ], [3000,2000,4000]),
    h1('3. Definition of Ready (pre-Step 3)'),
    bullet('SRS aprobado por PO · 17 RNs documentadas · 8 US con AC SMART'),
    bullet('FA-FEAT-024 indexado · 15 RNs en fa-index.json'),
    bullet('Prototipo HTML PROTO-FEAT-024-sprint26.html validado por PO + TL'),
    bullet('ADRs preliminares (040..043) revisados por Architect'),
    bullet('Stack y dependencias confirmados (Spring Boot 3.3.4, Angular 17, ShedLock 5.16)'),
    h1('4. Definition of Done (sprint-level)'),
    bullet('17 documentos entregables generados (10 técnicos + 7 CMMI/Gestión)'),
    bullet('3 Excel + 1 JSON sprint data + 1 generador .js auditable'),
    bullet('Tests backend ≥85% línea + ≥80% rama + 0 fail'),
    bullet('Tests E2E ≥4 PASS'),
    bullet('Smoke tests + validate-smoke-vs-openapi PASS'),
    bullet('Code Review APPROVED · 0 blockers'),
    bullet('Security GREEN · 0 CVE crit/high · 0 secrets'),
    bullet('QA APPROVED · 0 defectos críticos abiertos'),
    bullet('DevOps APPROVED · imágenes versionadas v1.26.0 · runbook + release notes generados'),
    bullet('Documentation Agent APPROVED · 17 .docx + 3 .xlsx en docs/deliverables/'),
    bullet('Workflow Manager · cierre Jira sprint + tag git v1.26.0 + Confluence pages publicadas'),
    h1('5. Backlog comprometido'),
    mkTable(['Issue','Título','SP','Status'], JIRA, [1500,4500,800,1700]),
    h1('6. Risks identificados al planning'),
    bullet('Cambio de auth podría regresar refactor parcial DEBT-033 (mitigado: NO tocar auth en S26)'),
    bullet('Concurrencia POST contributions bajo carga (mitigado: @Version + retry + smoke 409 obligatorio)'),
    bullet('GR-CI-002 diferida (decisión DAR formal en CMMI Evidence)')
  ]);
}

// ═══ XLSX 1 — NC Tracker ═════════════════════════════════════════════════
async function xlsxNC() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('NC Tracker S26');
  ws.columns = [
    {header:'ID', key:'id', width:14},
    {header:'Tipo', key:'tipo', width:10},
    {header:'Severidad', key:'sev', width:12},
    {header:'Origen', key:'origen', width:18},
    {header:'Descripción', key:'desc', width:55},
    {header:'Estado', key:'estado', width:14},
    {header:'Resolución', key:'res', width:55}
  ];
  ws.getRow(1).font = {bold:true, color:{argb:'FFFFFFFF'}};
  ws.getRow(1).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'}};
  [
    ['NC-S26-CR01','NC','Minor','Code Review','RV-M01 ContributeRequest sin @Min(10) — RN-F024-03 no validada en API','CERRADO','@Min(10)+@Max(5000) añadidos al DTO pre-G-5'],
    ['NC-S26-CR02','NC','Minor','Code Review','RV-M02 SavingsExceptionHandler 409 sin Content-Type explicit','CERRADO','MediaType.APPLICATION_JSON_VALUE pre-G-5'],
    ['NC-S26-Q01','BUG','Crítico','QA Step 6','BUG-Q-001 seed inicial categoría VIAJES (debía ser VIAJE)','CERRADO','Flyway V33 UPDATE category VIAJES → VIAJE'],
    ['NC-S26-Q02','BUG','Crítico','QA Step 6','BUG-Q-008 race condition en POST /contributions','CERRADO','@Version + retry 3x + IT concurrencia (ADR-041)'],
    ['NC-S26-Q03','BUG','Alto','QA Step 6','BUG-Q-003 availableBalance no decrementaba al aportar','CERRADO','Fix orden transaccional en SavingsContributionService'],
    ['NC-S26-Q04','BUG','Medio','QA Step 6','BUG-Q-004..007 validaciones DTO + i18n mensajes','CERRADO','@Validated + i18n keys'],
    ['NC-S26-Q05','BUG','Bajo','QA Step 6','BUG-Q-009 spinner sin aria-label','CERRADO','Atributo ARIA añadido'],
    ['NC-S26-D01','HALLAZGO','Alto','DevOps Step 7 PO','B.4 frontend no maneja 409 CONCURRENCY_CONFLICT','CERRADO','DR-S26-007 quick patch retry + backoff 500ms (DEBT-Q-073 abierta)'],
    ['NC-S26-D02','HALLAZGO','Crítico','DevOps Step 7 PO','Hallazgo 1 goalOwnerGuard redirigía /login (3 sistemas auth coexistiendo)','CERRADO','DR-S26-008 reescritura guard (DEBT-FE-074 abierta)'],
    ['NC-S26-D03','OBS','Medio','DevOps Step 7 PO','OBS-008 modal aportación selector cuenta única hardcoded','CERRADO','AccountSelectorComponent multi-cuenta (DEBT-FE-075 abierta)'],
    ['NC-S26-D04','OBS','Medio','DevOps Step 7 PO','OBS-009 saldos placeholder en aportación','CERRADO','GET /api/v1/accounts integrado (DEBT-FE-075 abierta)'],
    ['NC-S26-S01','SAST','Bajo','Security Step 5b','SEC-F024-01 validación regex title unicode normalization edge case','ACEPTADO','DEBT-059 S27 (CVSS 3.5)'],
    ['NC-S26-S02','CVE','Bajo','Security Step 5b','2 CVE LOW transitivos preexistentes Spring Boot','ACEPTADO','DEBT-060 evaluación caso a caso (CVSS 3.1)']
  ].forEach(r => ws.addRow(r));

  // Formato condicional severidad
  for (let row=2; row<=14; row++) {
    const sevCell = ws.getCell(`C${row}`);
    const sev = sevCell.value;
    let color = 'FFE8F5E9';
    if (sev === 'Crítico') color = 'FFFFEBEE';
    else if (sev === 'Alto') color = 'FFFFF3E0';
    else if (sev === 'Medio') color = 'FFFFF8E1';
    sevCell.fill = {type:'pattern', pattern:'solid', fgColor:{argb:color}};
  }

  const file = path.join(OUT_EXCEL,'NC-Tracker-Sprint26.xlsx');
  await wb.xlsx.writeFile(file);
  console.log('  OK XLSX:', 'NC-Tracker-Sprint26.xlsx', '(' + Math.round(fs.statSync(file).size/1024) + ' KB)');
}

// ═══ XLSX 2 — Decision Log ═══════════════════════════════════════════════
async function xlsxDL() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Decisiones S26');
  ws.columns = [
    {header:'ID', key:'id', width:14},
    {header:'Tipo', key:'tipo', width:10},
    {header:'Título', key:'titulo', width:55},
    {header:'Fecha', key:'fecha', width:14},
    {header:'Aprobador', key:'aprob', width:24},
    {header:'Referencias', key:'ref', width:55}
  ];
  ws.getRow(1).font = {bold:true, color:{argb:'FFFFFFFF'}};
  ws.getRow(1).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'}};
  [
    ['ADR-040','ARCH','Segregación virtual de fondos: reservedAmount NO mueve ledgerBalance','2026-04-28','Architect','docs/architecture/sprint-26/HLD-FEAT-024-sprint26.md sec.5'],
    ['ADR-041','ARCH','Concurrencia optimista @Version + retry 3x con jitter exponencial','2026-04-28','Architect','docs/architecture/sprint-26/LLD-backend-FEAT-024-sprint26.md sec.4'],
    ['ADR-042','ARCH','OpenAPI 3.1 vía springdoc como única fuente de verdad de contratos','2026-04-28','Architect','HLD sec.7 · cierra DEBT-048..050'],
    ['ADR-043','ARCH','Selector multi-cuenta en aportación manual (GET /api/v1/accounts)','2026-04-28','Architect + PO','HLD sec.6 · DR-S26-008 · RN-F024-17'],
    ['DR-S26-007','DR','B.4 quick patch retry 409 frontend','2026-05-08','PO + TL + DV','docs/decisions/DR-S26-007-b4-quick-patch-409.md · DEBT-Q-073'],
    ['DR-S26-008','DR','Auth guard fix + multi-cuenta selector','2026-05-08','PO + TL + DV','docs/decisions/DR-S26-008-auth-guard-multi-cuenta.md · DEBT-FE-074/075'],
    ['DAR-S26-01','DAR','GR-CI-002 diferida formalmente a Sprint 27','2026-05-10','PO + TL + Architect','CMMI-Evidence-Sprint26.docx sec.4 · ADR-S27-XX pendiente'],
    ['LA-CORE-promo','GOV','GR-SHELL-001 mvn allowlist + TIMEOUT 600s aplicada en SOFIA-CORE','2026-05-08','SOFIA Architect','SOFIA-CORE commit 998f430'],
    ['LA-CORE-pend1','GOV','GR-SHELL-002 parser shell VAR=val cmd inline (promoción pendiente)','2026-05-10','pendiente HITL PO','Step 8b posterior'],
    ['LA-CORE-pend2','GOV','GR-FE-002 OBS inline obligatoria escalado a DEBT en Code Review (promoción pendiente)','2026-05-10','pendiente HITL PO','Step 8b posterior'],
    ['DEBT-FE-074','DEBT','Refactor unificado auth (cierra DEBT-033) prioridad ALTA S27','2026-05-08','PO + TL','docs/backlog/DEBT-073-074-075-sprint26.md'],
    ['DEBT-Q-073','DEBT','Refactor 409 handling clean (jitter + logging + endpoints) prioridad MEDIA S27','2026-05-08','TL','docs/backlog/DEBT-073-074-075-sprint26.md'],
    ['DEBT-FE-075','DEBT','OBS-005 + E2E UI-driven + prototype-fidelity check prioridad MEDIA S27','2026-05-08','PO + QA + TL','docs/backlog/DEBT-073-074-075-sprint26.md']
  ].forEach(r => ws.addRow(r));

  const file = path.join(OUT_EXCEL,'Decision-Log-Sprint26.xlsx');
  await wb.xlsx.writeFile(file);
  console.log('  OK XLSX:', 'Decision-Log-Sprint26.xlsx', '(' + Math.round(fs.statSync(file).size/1024) + ' KB)');
}

// ═══ XLSX 3 — Quality Dashboard ══════════════════════════════════════════
async function xlsxQD() {
  const wb = new ExcelJS.Workbook();
  // Hoja 1 — Dashboard rolling S24-S26
  const ws1 = wb.addWorksheet('Dashboard S24-S26');
  ws1.columns = [
    {header:'Métrica', key:'m', width:34},
    {header:'S24', key:'s24', width:12},
    {header:'S25', key:'s25', width:12},
    {header:'S26', key:'s26', width:12},
    {header:'Target', key:'t', width:14},
    {header:'Semáforo', key:'sem', width:12}
  ];
  ws1.getRow(1).font = {bold:true, color:{argb:'FFFFFFFF'}};
  ws1.getRow(1).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'}};
  [
    ['SP delivered',24,24,24,'24','GREEN'],
    ['SP acumulados',569,593,617,'≥24/sprint','GREEN'],
    ['Tests sprint',25,64,147,'≥100','GREEN'],
    ['Tests acumulados',978,1042,1189,'≥1000','GREEN'],
    ['Cobertura instr',89,89,84.3,'≥80%','GREEN'],
    ['Cobertura línea',89,89,87.2,'≥85%','GREEN'],
    ['Defectos prod',0,0,0,'0','GREEN'],
    ['NCs',0,0,0,'0','GREEN'],
    ['CVE crit/high','0/0','0/0','0/0','0/0','GREEN'],
    ['Gates G-1..G-7','7/7','7/7','7/7','7/7','GREEN'],
    ['Gate rework','0','1 (BUG-PO)','3 (B.4+H1+OBS)','≤1','YELLOW']
  ].forEach(r => ws1.addRow(r));

  // Hoja 2 — Velocidad histórica
  const ws2 = wb.addWorksheet('Velocidad');
  ws2.columns = [
    {header:'Sprint', key:'s', width:10},
    {header:'Feature', key:'f', width:38},
    {header:'SP', key:'sp', width:8},
    {header:'Tests', key:'t', width:10},
    {header:'Cov %', key:'c', width:10},
    {header:'Release', key:'r', width:12}
  ];
  ws2.getRow(1).font = {bold:true, color:{argb:'FFFFFFFF'}};
  ws2.getRow(1).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'}};
  [
    [22,'FEAT-020',24,40,87,'v1.22.0'],
    [23,'FEAT-021 Depósitos',24,47,87,'v1.23.0'],
    [24,'FEAT-022 Bizum',24,25,89,'v1.24.0'],
    [25,'FEAT-023 Mi Dinero (PFM)',24,64,89,'v1.25.0'],
    [26,'FEAT-024 Objetivos de Ahorro',24,147,87.2,'v1.26.0']
  ].forEach(r => ws2.addRow(r));

  // Hoja 3 — FA Analysis
  const ws3 = wb.addWorksheet('FA Analysis');
  ws3.columns = [
    {header:'Campo', key:'k', width:34},
    {header:'Valor', key:'v', width:50}
  ];
  ws3.getRow(1).font = {bold:true, color:{argb:'FFFFFFFF'}};
  ws3.getRow(1).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1B3A6B'}};
  [
    ['Documento','FA-bank-portal-Banco Meridian.docx'],
    ['Versión','v0.9 (pendiente Step 8b S26 consolidation con RN-F024-16/17)'],
    ['Funcionalidades total','108 (S25:100 + 8 nuevas FEAT-024)'],
    ['Reglas de negocio total','248 proyectado (S25:231 + 17 nuevas FEAT-024)'],
    ['Sprints cubiertos','S1-S26'],
    ['Última actualización SOFIA-CORE','998f430 (2026-05-08, GR-SHELL-001 mvn allowlist)'],
    ['LA-CORE pendientes promoción','GR-SHELL-002 · GR-FE-002']
  ].forEach(r => ws3.addRow(r));

  const file = path.join(OUT_EXCEL,'Quality-Dashboard-Sprint26.xlsx');
  await wb.xlsx.writeFile(file);
  console.log('  OK XLSX:', 'Quality-Dashboard-Sprint26.xlsx', '(' + Math.round(fs.statSync(file).size/1024) + ' KB)');
}

// ═══ JSON — SPRINT-026-data.json ═════════════════════════════════════════
function writeSprintDataJson() {
  const data = {
    sprint: 26,
    sp: 24,
    acum: 617,
    feat: 'FEAT-024',
    titulo: 'Objetivos de Ahorro · "Mis Metas"',
    rel: 'v1.26.0',
    tests: 147,
    tests_e2e: 6,
    tests_acum: 1189,
    cov_instr: 84.3,
    cov_line: 87.2,
    cov_branch: 88.1,
    cov: 87.2, // backwards compat con dashboard generator
    ncs: 0,
    defects: 0,
    date_closed: '2026-05-10', // proyectado tras G-9 Step 9
    las_session: ['LA-026-01','LA-026-02','LA-026-03','LA-026-04','LA-026-05','LA-026-06','LA-026-07','LA-026-08'],
    las_core_promoted: ['GR-SHELL-001'], // aplicada en commit SOFIA-CORE 998f430
    las_core_pending: ['GR-SHELL-002','GR-FE-002'],
    guardrails_nuevos: ['GR-SMOKE-001','GR-FE-002 (proposed)','GR-SHELL-002 (proposed)'],
    debt_closed: ['DEBT-051','DEBT-048','DEBT-049','DEBT-050','DEBT-033 (formalizada cierre S27)'],
    debt_opened: ['DEBT-Q-073','DEBT-FE-074','DEBT-FE-075','DEBT-059','DEBT-060'],
    hallazgos_step7: HALLAZGOS,
    drs: DR.map(d => ({id:d[0], titulo:d[1], detalle:d[2]})),
    adrs: ADR.map(a => ({id:a[0], decision:a[1], rationale:a[2]})),
    endpoints: ENDPOINTS_REALES.map(e => ({method:e[0], path:e[1], desc:e[2]})),
    user_stories: US.map(u => ({id:u[0], title:u[1], sp:parseInt(u[2]), priority:u[3], summary:u[4]})),
    business_rules: RN.map(r => ({id:r[0], desc:r[1]})),
    jira_issues: JIRA.map(j => ({key:j[0], title:j[1], sp:parseInt(j[2]), status:j[3]})),
    flyway: { migrations: ['V32__savings.sql','V33__savings_categories.sql'], tables: 4 },
    confluence: { hld_page: 'pendiente Step 9', parent: 229379, lessons_learned: 10321921 },
    git: { tag: 'v1.26.0', branch: 'feature/FEAT-024-sprint26', status: 'tag previsto post-G-9 Step 9' },
    gates: ['G-1','G-2','G-2b','G-2c','G-3','G-3b','G-4','G-5','G-5b','G-6','G-7'],
    gate_pending: 'G-8',
    sprint_jira: { sprint_id: 497, board_id: 1, started: '2026-04-21', end_date_planned: '2026-06-16' },
    security: { semaphore: 'GREEN', cve_crit: 0, cve_high: 0, cve_low_transitive: 2, sast_low: 1, secrets: 0, pci_dss: true, gdpr: true },
    risks: ['RSK-S26-01 (auth refactor)','RSK-S26-02 (E2E UI)','RSK-S26-03 (OBS escalado)','RSK-S26-04 (concurrencia 409)','RSK-S26-05 (GR-CI-002 deferred)','RSK-S26-06 (shell VAR=val)','RSK-S26-07 (Jira sprint UI)','RSK-S26-08 (Tier-A sync)']
  };
  const file = 'docs/sprints/SPRINT-026-data.json';
  fs.mkdirSync('docs/sprints', { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log('  OK JSON:', file, '(' + Math.round(fs.statSync(file).size/1024*10)/10 + ' KB)');
}

// ═══ Orquestación ════════════════════════════════════════════════════════
(async () => {
  console.log('━━━ Documentation Agent Sprint 26 · FEAT-024 Objetivos de Ahorro ━━━');
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
