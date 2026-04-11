#!/usr/bin/env node
/**
 * SOFIA v1.9 — Dashboard Global Generator · BankPortal
 *
 * Uso:
 *   node .sofia/scripts/gen-dashboard.js
 *   node .sofia/scripts/gen-dashboard.js --output docs/quality/dashboard.html
 */

const fs   = require('fs');
const path = require('path');

const args        = process.argv.slice(2);
const projectRoot = (() => {
  const pIdx = args.indexOf('--project');
  return pIdx !== -1 ? path.resolve(args[pIdx + 1]) : process.cwd();
})();
const outputArg = (() => {
  const oIdx = args.indexOf('--output');
  return oIdx !== -1 ? path.resolve(args[oIdx + 1]) : null;
})();

const sofiaDir    = path.join(projectRoot, '.sofia');
const sessionFile = path.join(sofiaDir, 'session.json');
const configFile  = path.join(sofiaDir, 'sofia-config.json');
const sprintsDir  = path.join(projectRoot, 'docs', 'sprints');
const templateFile= path.join(sofiaDir, 'templates', 'dashboard.html');

function readJson(filePath, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (_) { return fallback; }
}

const session = readJson(sessionFile, {
  version: '1.9', status: 'idle', current_sprint: 16,
  metrics: { total_sp: 377, total_tests: 553, coverage: 84, defects: 0 }
});
const config  = readJson(configFile, {
  project: { name: 'BankPortal', client: 'Banco Meridian' },
  sprint:  { current: 16, velocity_target: 24 },
  cmmi:    { level: 3, active: true },
  dashboard: { output: 'docs/quality/sofia-dashboard.html' }
});

// Cargar histórico de sprints desde SPRINT-N-data.json
function loadSprintHistory() {
  const sprints = [];
  if (!fs.existsSync(sprintsDir)) {
    // Fallback: usar sprint_history de session.json si existe
    if (session.sprint_history) {
      Object.values(session.sprint_history).forEach(s => {
        if (s.status === 'completed') {
          const num = parseInt(Object.keys(session.sprint_history).find(k => session.sprint_history[k] === s).replace('sprint_',''));
          sprints.push({
            sprint: num, sp: s.sp || 24,
            acum: s.acum || (num * 23.6),
            feat: s.feature || '', titulo: '', rel: s.rel || `v1.${num}.0`,
            tests: 0, cov: 84, ncs: 2, defects: 0
          });
        }
      });
    }
    return sprints;
  }

  const jsonFiles = fs.readdirSync(sprintsDir)
    .filter(f => f.match(/^SPRINT-\d+-data\.json$/i))
    .sort();

  for (const f of jsonFiles) {
    try {
      const data = readJson(path.join(sprintsDir, f));
      if (data.sprint) sprints.push(data);
    } catch (_) {}
  }

  // Si no hay JSON individuales, usar sprint_history embebido
  if (sprints.length === 0 && session.sprint_history) {
    const keys = Object.keys(session.sprint_history).sort();
    keys.forEach(k => {
      const s = session.sprint_history[k];
      const num = parseInt(k.replace('sprint_0','').replace('sprint_',''));
      if (s.status === 'completed' && !isNaN(num)) {
        sprints.push({
          sprint: num, sp: s.sp || 24, acum: s.acum || 0,
          feat: s.feature || `FEAT-${String(num).padStart(3,'0')}`,
          titulo: '', rel: s.rel || `v1.${num}.0`,
          tests: s.tests || 0, cov: s.cov || 84, ncs: s.ncs || 2,
          defects: 0
        });
      }
    });
  }
  return sprints;
}

const sprintHistory = loadSprintHistory();
const openDebts  = session.security?.open_debts || [];
const openRisks  = session.risks?.active || [];
const metrics    = session.metrics || { total_sp: 377, total_tests: 553, coverage: 84, defects: 0 };

const totalSP    = metrics.total_sp    || 377;
const totalTests = metrics.total_tests || 553;
const coverage   = metrics.coverage   || 84;
const defects    = metrics.defects    || 0;
const sprintNum  = session.current_sprint || 16;
const avgVel     = sprintNum > 0 ? (totalSP / sprintNum).toFixed(1) : '23.6';
const projName   = config.project?.name   || config.project || 'BankPortal';
const clientName = config.project?.client || config.client  || 'Banco Meridian';
const sofiaVer   = session.sofia_version  || '1.9';
const currDate   = new Date().toISOString().slice(0, 10);
const currFeat   = session.current_feature || (sprintHistory[sprintHistory.length-1]?.feat) || '—';
const lastRel    = sprintHistory[sprintHistory.length-1]?.rel || '—';
const velTarget  = config.sprint?.velocity_target || config.methodology?.velocity_reference_sp || 24;

const urgentDebts = openDebts.filter(d =>
  d.priority === 'URGENT' || d.priority === 'Alta' || (d.cvss && parseFloat(d.cvss) >= 7)
);
const statusColor = defects === 0 && urgentDebts.length === 0 ? 'VERDE' : 'ÁMBAR';

// Leer plantilla
let html = '';
if (fs.existsSync(templateFile)) {
  html = fs.readFileSync(templateFile, 'utf8');
} else {
  console.error('❌ Template no encontrado:', templateFile);
  process.exit(1);
}

// Sustitución de variables
const replacements = {
  '{{PROJECT_NAME}}':        projName,
  '{{CLIENT_NAME}}':         clientName,
  '{{SOFIA_VERSION}}':       sofiaVer,
  '{{CURRENT_DATE}}':        currDate,
  '{{CURRENT_SPRINT}}':      String(sprintNum),
  '{{CURRENT_FEAT}}':        currFeat,
  '{{LAST_RELEASE}}':        lastRel,
  '{{TOTAL_SP}}':            String(totalSP),
  '{{AVG_VELOCITY}}':        String(avgVel),
  '{{TOTAL_TESTS}}':         String(totalTests),
  '{{COVERAGE}}':            String(coverage),
  '{{DEFECTS}}':             String(defects),
  '{{OPEN_DEBTS}}':          String(openDebts.length),
  '{{OPEN_RISKS}}':          String(openRisks.length),
  '{{CMMI_LEVEL}}':          String(config.cmmi?.level || config.quality?.cmmi_level || 3),
  '{{STATUS_COLOR}}':        statusColor,
  '{{SPRINT_DATA_JSON}}':    JSON.stringify(sprintHistory),
  '{{DEBT_DATA_JSON}}':      JSON.stringify(openDebts),
  '{{RISK_DATA_JSON}}':      JSON.stringify(openRisks),
  '{{PIPELINE_STEPS_JSON}}': JSON.stringify(session.completed_steps || []),
  '{{CMMI_JSON}}':           JSON.stringify(session.cmmi || {}),
  '{{VELOCITY_TARGET}}':     String(velTarget),
};

for (const [key, val] of Object.entries(replacements)) {
  html = html.split(key).join(val);
}

// Escribir output
const outputPath = outputArg
  || path.join(projectRoot, config.dashboard?.output || 'docs/quality/sofia-dashboard.html');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, html, 'utf8');

const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
console.log(`✅ Dashboard generado: ${outputPath} (${sizeKB} KB)`);
console.log(`   Proyecto:  ${projName} · ${clientName}`);
console.log(`   Sprint:    ${sprintNum} · ${currFeat} · ${lastRel}`);
console.log(`   Métricas:  ${totalSP} SP · ${totalTests} tests · ${coverage}% cob · ${defects} defectos`);
console.log(`   Deuda:     ${openDebts.length} items · Riesgos: ${openRisks.length} activos`);
console.log(`   Sprints:   ${sprintHistory.length} históricos cargados`);

// Auto-open si está configurado
if (config.dashboard?.auto_open) {
  const { exec } = require('child_process');
  exec(`open "${outputPath}"`, () => {});
}
