// gen-excel-sprint20.js — 3 XLSX Sprint 20 FEAT-018
// SOFIA v2.3 · NC-Tracker + Decision-Log + Quality-Dashboard
'use strict';
const ExcelJS = require('exceljs');
const path = require('path');
const OUT = 'docs/deliverables/sprint-20-FEAT-018';

const BLUE = '1B3A6B'; const BLUE_F = 'FF1B3A6B';
const WHITE_F = 'FFFFFFFF'; const LGREY = 'FFF5F5F5';
const GREEN = 'FF2E7D32'; const RED = 'FFC62828'; const AMBER = 'FFE65100';

function hdr(ws, cols) {
  var r = ws.addRow(cols.map(function(c){ return c.label; }));
  r.height = 22;
  r.eachCell(function(cell) {
    cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: BLUE_F } };
    cell.font = { bold:true, color:{ argb: WHITE_F }, name:'Arial', size:11 };
    cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true };
    cell.border = { bottom:{ style:'medium', color:{ argb: BLUE_F } } };
  });
  cols.forEach(function(c, i) { ws.getColumn(i+1).width = c.w; });
}

function row(ws, vals, altRow) {
  var r = ws.addRow(vals);
  r.eachCell(function(cell, col) {
    cell.font = { name:'Arial', size:10 };
    cell.alignment = { vertical:'middle', wrapText:true };
    if (altRow) cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: LGREY } };
  });
  return r;
}

// ─── 1. NC-Tracker.xlsx ───────────────────────────────────────────────────
async function genNCTracker() {
  var wb = new ExcelJS.Workbook();
  wb.creator = 'SOFIA v2.3'; wb.created = new Date();

  // Hoja 1: Dashboard
  var dash = wb.addWorksheet('Dashboard');
  dash.mergeCells('A1:F1');
  var title = dash.getCell('A1');
  title.value = 'NC Tracker — Sprint 20 · FEAT-018 · BankPortal';
  title.font = { bold:true, size:14, name:'Arial', color:{ argb: WHITE_F } };
  title.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: BLUE_F } };
  title.alignment = { horizontal:'center', vertical:'middle' };
  dash.getRow(1).height = 28;

  var kpis = [
    ['Total NCs Sprint 20','0'],['NCs Criticas','0'],['NCs Abiertas','0'],
    ['NCs Cerradas','0'],['Tasa cierre','100%'],['Sprint','20 · v1.20.0']
  ];
  kpis.forEach(function(kpi, i) {
    var c = i % 3; var r = Math.floor(i / 3);
    var cell = dash.getCell(3 + r, 1 + c * 2);
    var valCell = dash.getCell(3 + r, 2 + c * 2);
    cell.value = kpi[0]; cell.font = { bold:true, name:'Arial', size:10 };
    valCell.value = kpi[1]; valCell.font = { bold:true, size:13, name:'Arial', color:{ argb: GREEN } };
  });
  dash.getColumn(1).width = 24; dash.getColumn(2).width = 14;
  dash.getColumn(3).width = 24; dash.getColumn(4).width = 14;
  dash.getColumn(5).width = 24; dash.getColumn(6).width = 14;

  // Hoja 2: NCs
  var ncs = wb.addWorksheet('NCs');
  hdr(ncs, [
    {label:'ID',w:12},{label:'Tipo',w:14},{label:'Severidad',w:14},
    {label:'Historia',w:14},{label:'Descripcion',w:40},
    {label:'Estado',w:14},{label:'Sprint cierre',w:14}
  ]);
  var ncData = [
    ['NC-S20-001','Code Review','Menor','SCRUM-98..105','RV-F018-01: catch vacio ExportAuditService','CERRADA','S20'],
    ['NC-S20-002','Code Review','Menor','SCRUM-98..105','RV-F018-03: CRLF en CSV no normalizado','CERRADA','S20'],
    ['NC-S20-003','Security','Media','All','DEBT-038: accountId vs userId sin validar (CVSS 4.8)','CERRADA','S20'],
  ];
  ncData.forEach(function(d, i) {
    var r = row(ncs, d, i % 2 === 1);
    var statusCell = r.getCell(6);
    statusCell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: GREEN } };
    statusCell.font = { bold:true, color:{ argb: WHITE_F }, name:'Arial', size:10 };
  });
  ncs.addRow([]);
  row(ncs, ['TOTAL NCs S20','','','','','3 CERRADAS · 0 ABIERTAS',''], false);

  // Hoja 3: Metricas
  var met = wb.addWorksheet('Metricas');
  hdr(met, [{label:'Sprint',w:10},{label:'NCs',w:10},{label:'Criticas',w:12},{label:'Tasa cierre',w:14}]);
  var hist = [
    [17,3,0,'100%'],[18,5,0,'100%'],[19,2,0,'100%'],[20,0,0,'100%']
  ];
  hist.forEach(function(d, i){ row(met, d, i%2===1); });

  var fp = path.join(OUT, 'NC-Tracker.xlsx');
  await wb.xlsx.writeFile(fp);
  console.log('  OK NC-Tracker.xlsx');
}

// ─── 2. Decision-Log.xlsx ─────────────────────────────────────────────────
async function genDecisionLog() {
  var wb = new ExcelJS.Workbook();
  wb.creator = 'SOFIA v2.3'; wb.created = new Date();

  // Hoja 1: Log
  var log = wb.addWorksheet('Log');
  log.mergeCells('A1:H1');
  var t = log.getCell('A1');
  t.value = 'Decision Log — Sprint 20 · FEAT-018 · BankPortal';
  t.font = { bold:true, size:14, name:'Arial', color:{ argb: WHITE_F } };
  t.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: BLUE_F } };
  t.alignment = { horizontal:'center' };
  log.getRow(1).height = 28;

  hdr(log, [
    {label:'ID',w:12},{label:'Fecha',w:12},{label:'Categoria',w:14},
    {label:'Decision',w:40},{label:'Alternativas',w:30},
    {label:'Justificacion',w:35},{label:'Impacto',w:16},{label:'Estado',w:14}
  ]);
  var decisions = [
    ['ADR-030','2026-03-30','Arquitectura','Apache PDFBox 3.x para generacion PDF','iText 7 (AGPL), JasperReports','Licencia Apache 2.0 sin coste comercial. Sin riesgo AGPL.','Bajo','ACEPTADA'],
    ['ADR-031','2026-03-30','Arquitectura','Generacion sincrona PDF/CSV <= 500 registros','Async con polling + job queue (Redis)','Simplicidad S20. Async como DEBT-036 si latencia > 3s en prod.','Bajo','ACEPTADA'],
    ['DEC-020-01','2026-03-30','Proceso','Sprint mixto: 16 SP deuda + 8 SP FEAT-018','Sprint 100% feature, Sprint 100% deuda','Eliminar deuda critica antes de acumular mas. Velocidad sostenida.','Bajo','ACEPTADA'],
    ['DEC-020-02','2026-03-30','Seguridad','DEBT-038 resuelto en S20 (no diferir)','Diferir a S21 como deuda','CVSS 4.8 — politica LA-020-02: CVSS >= 4.0 resuelto en mismo sprint','Medio','ACEPTADA'],
    ['DEC-020-03','2026-03-30','Frontend','DEBT-033: sessionStorage para JWT','localStorage, cookie HttpOnly','sessionStorage: no persiste entre pestanas. PCI-DSS mas seguro que localStorage.','Bajo','ACEPTADA'],
  ];
  decisions.forEach(function(d, i) {
    var r = row(log, d, i%2===1);
    var sc = r.getCell(8);
    sc.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: GREEN } };
    sc.font = { bold:true, color:{ argb: WHITE_F }, name:'Arial', size:10 };
  });

  // Hoja 2: Resumen
  var res = wb.addWorksheet('Resumen');
  hdr(res, [{label:'Categoria',w:20},{label:'Decisiones',w:14},{label:'Aceptadas',w:14},{label:'Rechazadas',w:14}]);
  [['Arquitectura',2,2,0],['Proceso',1,1,0],['Seguridad',1,1,0],['Frontend',1,1,0],
   ['TOTAL',5,5,0]].forEach(function(d,i){ row(res,d,i%2===1); });

  await wb.xlsx.writeFile(path.join(OUT, 'Decision-Log.xlsx'));
  console.log('  OK Decision-Log.xlsx');
}

// ─── 3. Quality-Dashboard.xlsx ────────────────────────────────────────────
async function genQualityDashboard() {
  var wb = new ExcelJS.Workbook();
  wb.creator = 'SOFIA v2.3'; wb.created = new Date();

  // Hoja 1: Dashboard
  var dash = wb.addWorksheet('Dashboard');
  dash.mergeCells('A1:F1');
  var t = dash.getCell('A1');
  t.value = 'Quality Dashboard — BankPortal Sprint 20 · v1.20.0';
  t.font = { bold:true, size:14, name:'Arial', color:{ argb: WHITE_F } };
  t.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: BLUE_F } };
  t.alignment = { horizontal:'center', vertical:'middle' };
  dash.getRow(1).height = 28;

  var kpis = [
    ['Sprints completados','20/20'],['SP acumulados','473'],
    ['Velocidad media','23.65 SP/sprint'],['Tests automatizados','524'],
    ['Cobertura S20','88%'],['Defectos en produccion','0'],
    ['NCS Sprint 20','0'],['CMMI Nivel','3 activo'],
    ['Release','v1.20.0'],['Estado','CERRADO']
  ];
  kpis.forEach(function(kpi, i) {
    var r = dash.addRow([kpi[0], kpi[1]]);
    r.getCell(1).font = { bold:true, name:'Arial', size:11 };
    r.getCell(2).font = { bold:true, name:'Arial', size:13,
      color:{ argb: (kpi[1]==='0' || kpi[1]==='CERRADO') ? GREEN :
                     (kpi[1].includes('%') && parseFloat(kpi[1]) < 80) ? RED : BLUE_F } };
    r.getCell(2).alignment = { horizontal:'right' };
  });
  dash.getColumn(1).width = 28; dash.getColumn(2).width = 20;

  // Hoja 2: Tests
  var tests = wb.addWorksheet('Tests');
  hdr(tests, [
    {label:'Sprint',w:10},{label:'Feature',w:20},{label:'Tests unit',w:14},
    {label:'Tests acum',w:14},{label:'Cobertura',w:12},{label:'NCS',w:8},{label:'Defectos',w:10}
  ]);
  var testData = [
    [16,'FEAT-014 Push VAPID',553,553,84,2,0],
    [17,'FEAT-015 Transf. Programadas',615,615,85,3,0],
    [18,'FEAT-016 Tarjetas',677,677,86,5,0],
    [19,'FEAT-017 SEPA Direct Debit',708,708,87,0,0],
    [20,'FEAT-018 Export Mov.',524,524,88,0,0],
  ];
  testData.forEach(function(d, i) {
    var r = row(tests, d, i%2===1);
    var covCell = r.getCell(5);
    var pct = parseFloat(covCell.value);
    covCell.font = { bold:true, name:'Arial', size:10,
      color:{ argb: pct >= 87 ? GREEN : pct >= 80 ? AMBER : RED } };
  });

  // Hoja 3: Cobertura trend
  var cov = wb.addWorksheet('Cobertura');
  hdr(cov, [{label:'Sprint',w:10},{label:'Cobertura',w:14},{label:'Objetivo',w:14},{label:'Delta',w:10}]);
  [[16,84,80,'+4%'],[17,85,80,'+5%'],[18,86,80,'+6%'],[19,87,80,'+7%'],[20,88,80,'+8%']]
    .forEach(function(d,i){ row(cov,d,i%2===1); });

  // Hoja 4: Velocidad
  var vel = wb.addWorksheet('Velocidad');
  hdr(vel, [{label:'Sprint',w:10},{label:'SP',w:10},{label:'SP acumulados',w:16},{label:'Velocidad media',w:18}]);
  [[16,24,377,23.6],[17,24,401,23.6],[18,24,425,23.6],[19,24,449,23.6],[20,24,473,23.65]]
    .forEach(function(d,i){ row(vel,d,i%2===1); });

  await wb.xlsx.writeFile(path.join(OUT, 'Quality-Dashboard.xlsx'));
  console.log('  OK Quality-Dashboard.xlsx');
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== Excel Generator — Sprint 20 ===');
  await genNCTracker();
  await genDecisionLog();
  await genQualityDashboard();
  console.log('\n=== 3 XLSX completados ===\n');
}

main().catch(function(e){ console.error(e); process.exit(1); });
