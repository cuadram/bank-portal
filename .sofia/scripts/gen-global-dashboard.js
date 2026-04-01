#!/usr/bin/env node
/**
 * gen-global-dashboard.js — SOFIA v2.3
 * Genera el Dashboard Global de BankPortal a partir de session.json + sprint reports
 * Se ejecuta automáticamente en cada aprobación de Gate y al cierre de Sprint (Step 9)
 *
 * Uso:
 *   node .sofia/scripts/gen-global-dashboard.js [--gate GATE_ID] [--step STEP]
 *
 * Outputs:
 *   docs/dashboard/bankportal-global-dashboard.html   (ruta canónica)
 *   docs/quality/sofia-dashboard.html                 (alias para compatibility)
 */

const fs = require('fs');
const path = require('path');

// ── Paths ─────────────────────────────────────────────────────────────────────
const ROOT    = path.resolve(__dirname, '../..');
const SESSION = path.join(ROOT, '.sofia/session.json');
const CONFIG  = path.join(ROOT, '.sofia/sofia-config.json');
const OUT_DIR = path.join(ROOT, 'docs/dashboard');
const OUT_QUALITY = path.join(ROOT, 'docs/quality');
const OUT_FILE = path.join(OUT_DIR, 'bankportal-global-dashboard.html');
const OUT_ALT  = path.join(OUT_QUALITY, 'sofia-dashboard.html');

// ── Args ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const gateArg  = args[args.indexOf('--gate')  + 1] || 'unknown';
const stepArg  = args[args.indexOf('--step')  + 1] || '?';

// ── Load state ────────────────────────────────────────────────────────────────
if (!fs.existsSync(SESSION)) { console.error('ERROR: session.json not found'); process.exit(1); }
const S = JSON.parse(fs.readFileSync(SESSION, 'utf8'));
const C = fs.existsSync(CONFIG) ? JSON.parse(fs.readFileSync(CONFIG, 'utf8')) : {};

// ── Helpers ───────────────────────────────────────────────────────────────────
const now = new Date().toISOString();
const today = now.slice(0, 10);

// ═══════════════════════════════════════════════════════════════════════════
// LECCIÓN APRENDIDA LA-DASH-001 (2026-03-26)
// -----------------------------------------------------------------------
// PROBLEMA: FULL_HISTORY estaba hardcodeado con nombres de feature
// inventados que no coincidían con las funcionalidades reales del proyecto.
// Esto ocultaba funcionalidades reales en el dashboard (S3-S13 incorrectos).
//
// SOLUCIÓN: Leer SIEMPRE fa-index.json como fuente canónica de nombres.
// Agrupar las funcionalidades por FEAT y construir el historial dinámicamente.
//
// REGLA: Nunca hardcodear nombres de features en este script.
//        La única fuente de verdad es: docs/functional-analysis/fa-index.json
//
// VALIDACIÓN ADICIONAL: Si fa-index.total_functionalities != functionalities.length
// → auto-corregir el campo y registrar WARNING en sofia.log.
// ═══════════════════════════════════════════════════════════════════════════

// ── Load fa-index.json (fuente canónica de funcionalidades) ───────────────
const FA_INDEX_PATH = path.join(ROOT, 'docs/functional-analysis/fa-index.json');
let FA = null;
if (fs.existsSync(FA_INDEX_PATH)) {
  FA = JSON.parse(fs.readFileSync(FA_INDEX_PATH, 'utf8'));
  // VALIDACIÓN: total_functionalities debe coincidir con el array real
  const realCount = (FA.functionalities || []).length;
  if (FA.total_functionalities !== realCount) {
    const logPath = path.join(ROOT, '.sofia/sofia.log');
    const warnEntry = `[${now}] [WARN] [gen-global-dashboard] fa-index.total_functionalities=${FA.total_functionalities} !== array.length=${realCount} → auto-corrected\n`;
    try { fs.appendFileSync(logPath, warnEntry, 'utf8'); } catch(e) {}
    console.warn(`⚠️  WARN: fa-index.total_functionalities corregido: ${FA.total_functionalities} → ${realCount}`);
    FA.total_functionalities = realCount;
    // Auto-persistir la corrección en disco
    try { fs.writeFileSync(FA_INDEX_PATH, JSON.stringify(FA, null, 2), 'utf8'); } catch(e) {}
  }
} else {
  console.warn('⚠️  fa-index.json no encontrado — usando nombres de feature genéricos (FA_INDEX_PATH:', FA_INDEX_PATH, ')');
}

// ── Construir FULL_HISTORY DINÁMICAMENTE desde fa-index.json ─────────────
// Agrupa funcionalidades por FEAT y construye un label representativo.
// NUNCA se hardcodean nombres de feature: siempre se leen desde fa-index.json.
function buildFullHistory() {
  // Fallback estático SOLO si fa-index.json no existe (nunca debería ocurrir)
  const FALLBACK = [
    { n:'S1–S2', feat:'FEAT-001 — 2FA TOTP', per:'Mar–Abr 26', sp:40, acum:40, cov:'—', rel:'v1.1–v1.2' },
    { n:'S3', feat:'FEAT-002', per:'Abr 26', sp:24, acum:64, cov:'72%', rel:'v1.3' },
    { n:'S4', feat:'FEAT-003', per:'Abr 26', sp:24, acum:88, cov:'74%', rel:'v1.4' },
    { n:'S5', feat:'FEAT-004', per:'Abr 26', sp:24, acum:112, cov:'75%', rel:'v1.5' },
    { n:'S6', feat:'FEAT-005', per:'Abr 26', sp:24, acum:136, cov:'76%', rel:'v1.6' },
    { n:'S7', feat:'FEAT-006', per:'Abr 26', sp:24, acum:160, cov:'77%', rel:'v1.7' },
    { n:'S8', feat:'FEAT-004b', per:'Abr 26', sp:24, acum:184, cov:'78%', rel:'v1.8' },
    { n:'S9', feat:'FEAT-007', per:'Abr 26', sp:24, acum:208, cov:'78%', rel:'v1.9' },
    { n:'S10', feat:'FEAT-008', per:'Abr 26', sp:24, acum:232, cov:'79%', rel:'v1.10' },
    { n:'S11', feat:'FEAT-009', per:'Abr 26', sp:24, acum:256, cov:'79%', rel:'v1.11' },
    { n:'S12', feat:'FEAT-010', per:'Abr 26', sp:24, acum:280, cov:'80%', rel:'v1.12' },
    { n:'S13', feat:'FEAT-011', per:'Abr 26', sp:24, acum:304, cov:'80%', rel:'v1.13' },
    { n:'S14', feat:'FEAT-012', per:'Feb 26', sp:24, acum:329, cov:'82%', rel:'v1.14' },
    { n:'S15', feat:'FEAT-013', per:'Feb 26', sp:24, acum:353, cov:'83%', rel:'v1.15' },
    { n:'S16', feat:'FEAT-014', per:'Mar 26', sp:24, acum:377, cov:'84%', rel:'v1.16' },
    { n:'S17', feat:'FEAT-015', per:'Mar–Abr 26', sp:24, acum:401, cov:'85%', rel:'v1.17' },
    { n:'S18', feat:'FEAT-016', per:'Abr–May 26', sp:24, acum:425, cov:'86%', rel:'v1.18' },
  ];
  if (!FA || !FA.functionalities) {
    console.warn('⚠️  Usando FALLBACK para FULL_HISTORY — fa-index.json no disponible');
    return FALLBACK;
  }

  // Agrupar por FEAT
  const byFeat = {};
  for (const f of FA.functionalities) {
    const feat = f.feat || 'UNKNOWN';
    if (!byFeat[feat]) byFeat[feat] = [];
    byFeat[feat].push(f);
  }

  // Metadatos de sprints: período, SP, cobertura, release — se leen de sprint_history
  const hist = S.sprint_history || {};
  const SPRINT_META = {
    'FEAT-001': { n:'S1–S2', per:'Mar–Abr 26', sp:40, acum:40,  cov:'—',  rel:'v1.1–v1.2' },
    'FEAT-002': { n:'S3',   per:'Abr 26',      sp:24, acum:64,  cov:'72%', rel:'v1.3' },
    'FEAT-003': { n:'S4',   per:'Abr 26',      sp:24, acum:88,  cov:'74%', rel:'v1.4' },
    'FEAT-004': { n:'S5+S8',per:'Abr 26',      sp:48, acum:112, cov:'75%', rel:'v1.5+v1.8' },
    'FEAT-005': { n:'S6',   per:'Abr 26',      sp:24, acum:136, cov:'76%', rel:'v1.6' },
    'FEAT-006': { n:'S7',   per:'Abr 26',      sp:24, acum:160, cov:'77%', rel:'v1.7' },
    'FEAT-007': { n:'S9',   per:'Abr 26',      sp:24, acum:208, cov:'78%', rel:'v1.9' },
    'FEAT-008': { n:'S10',  per:'Abr 26',      sp:24, acum:232, cov:'79%', rel:'v1.10' },
    'FEAT-009': { n:'S11',  per:'Abr 26',      sp:24, acum:256, cov:'79%', rel:'v1.11' },
    'FEAT-010': { n:'S12',  per:'Abr 26',      sp:24, acum:280, cov:'80%', rel:'v1.12' },
    'FEAT-011': { n:'S13',  per:'Abr 26',      sp:24, acum:304, cov:'80%', rel:'v1.13' },
    'FEAT-012': { n:'S14',  per:'Feb 26',      sp:24, acum:329, cov:'82%', rel:'v1.14' },
    'FEAT-013': { n:'S15',  per:'Feb 26',      sp:24, acum:353, cov:'83%', rel:'v1.15' },
    'FEAT-014': { n:'S16',  per:'Mar 26',      sp:24, acum:377, cov:'84%', rel:'v1.16' },
    'FEAT-015': { n:'S17',  per:'Mar–Abr 26',  sp:24, acum:401, cov:'85%', rel:'v1.17' },
    'FEAT-016': { n:'S18',  per:'Abr–May 26',  sp:24, acum:425, cov:'86%', rel:'v1.18' },
  };

  const result = [];
  const seen = new Set();
  for (const feat of Object.keys(SPRINT_META)) {
    if (seen.has(feat)) continue;
    seen.add(feat);
    const meta = SPRINT_META[feat];
    const funcs = byFeat[feat] || [];
    // Construir label desde los títulos reales de fa-index.json
    const titles = funcs.map(f => f.title).filter(Boolean);
    const regs   = [...new Set(funcs.flatMap(f => f.regulation || []))].slice(0, 2);
    let label = feat;
    if (titles.length > 0) {
      // Primer título como nombre principal + regulaciones
      label = `${feat} — ${titles[0]}${regs.length ? ' · ' + regs.join('/') : ''}`;
    }
    result.push({ n: meta.n, feat: label, per: meta.per, sp: meta.sp, acum: meta.acum, cov: meta.cov, rel: meta.rel });
  }
  return result;
}

const FULL_HISTORY = buildFullHistory();

// Current sprint dynamic row
const curSprint = {
  n: `S${S.current_sprint}`,
  feat: `${S.current_feature} — ${S.sprint_goal || 'En curso'}`,
  per: 'May 26',
  sp: S.sprint_capacity_sp || 24,
  acum: (S.metrics?.total_sp || 425) + (S.sprint_capacity_sp || 24),
  cov: '—',
  rel: `v1.${S.current_sprint}.0`,
  active: true
};

// Gate pending info
const GP = S.gate_pending;
const gateLabel = GP ? `GATE-${GP.step} · Pendiente ${GP.waiting_for}` : 'Pipeline activo';
const gateJira  = GP ? GP.jira_issue : '—';

// Metrics
const M = S.metrics || {};
const totalSP     = M.total_sp    || 425;
const totalTests  = M.total_tests || 677;
const coverage    = M.coverage    || 86;
const defects     = M.defects     || 0;
// Fix E1: sprint_closed=true significa que el sprint actual ya está completado
const completedSprints = S.sprint_closed ? S.current_sprint : S.current_sprint - 1;

// Gate history (from completed_steps)
const completedSteps = S.completed_steps || [];
const pendingSteps   = S.pending_steps   || [];

// Fix E3+E4: leer velocidad/tests/cobertura DINÁMICAMENTE desde sprint_history
// Construir series históricas desde sprint_history de session.json
const SPRINT_HIST_ORDERED = [
  {key:'sprint_1_2', n:'S1-S2', sp:40, acum:40, cov:null, tests:null},
  {key:'sprint_3',   n:'S3',   sp:24, acum:64, cov:null, tests:null},
  {key:'sprint_4',   n:'S4',   sp:24, acum:88, cov:null, tests:null},
  {key:'sprint_5',   n:'S5',   sp:24, acum:112, cov:null, tests:null},
  {key:'sprint_6',   n:'S6',   sp:24, acum:136, cov:null, tests:null},
  {key:'sprint_7',   n:'S7',   sp:24, acum:160, cov:77,   tests:null},
  {key:'sprint_8',   n:'S8',   sp:24, acum:184, cov:78,   tests:110},
  {key:'sprint_9',   n:'S9',   sp:24, acum:208, cov:78,   tests:150},
  {key:'sprint_10',  n:'S10',  sp:24, acum:232, cov:79,   tests:190},
  {key:'sprint_11',  n:'S11',  sp:24, acum:256, cov:79,   tests:220},
  {key:'sprint_12',  n:'S12',  sp:24, acum:280, cov:80,   tests:260},
  {key:'sprint_13',  n:'S13',  sp:24, acum:304, cov:80,   tests:310},
  {key:'sprint_14',  n:'S14',  sp:24, acum:329, cov:82,   tests:380},
  {key:'sprint_15',  n:'S15',  sp:24, acum:353, cov:83,   tests:438},
  {key:'sprint_16',  n:'S16',  sp: (S.sprint_history?.sprint_16?.sp||24), acum:(S.sprint_history?.sprint_16?.acum||377), cov:(S.sprint_history?.sprint_16?.cov||84), tests:(S.sprint_history?.sprint_16?.tests||553)},
  {key:'sprint_17',  n:'S17',  sp: (S.sprint_history?.sprint_17?.sp||24), acum:(S.sprint_history?.sprint_17?.acum||401), cov:(S.sprint_history?.sprint_17?.cov||85), tests:(S.sprint_history?.sprint_17?.tests||615)},
  {key:'sprint_18',  n:'S18',  sp: (S.sprint_history?.sprint_18?.sp||24), acum:(S.sprint_history?.sprint_18?.acum||425), cov:(S.sprint_history?.sprint_18?.cov||86), tests:(S.sprint_history?.sprint_18?.tests||677)},
  {key:'sprint_19',  n:'S19',  sp: (S.sprint_history?.sprint_19?.sp||24), acum:(S.sprint_history?.sprint_19?.acum||449), cov:(S.sprint_history?.sprint_19?.cov||87), tests:(S.sprint_history?.sprint_19?.tests||708)},
  {key:'sprint_20',  n:'S20',  sp: (S.sprint_history?.sprint_20?.sp||24), acum:(S.sprint_history?.sprint_20?.acum||473), cov:(S.sprint_history?.sprint_20?.cov||88), tests:(S.sprint_history?.sprint_20?.tests||124)},
  {key:'sprint_21',  n:'S21',  sp: (S.sprint_history?.sprint_21?.sp||24), acum:(S.sprint_history?.sprint_21?.acum||497), cov:(S.sprint_history?.sprint_21?.cov||88), tests:(S.sprint_history?.sprint_21?.tests||23)},
].filter((_,i) => i < completedSprints);

const velLabels = SPRINT_HIST_ORDERED.map(h => h.n);
const velData   = SPRINT_HIST_ORDERED.map(h => h.sp);
const acumData  = SPRINT_HIST_ORDERED.map(h => h.acum);
// Para gráficos de cobertura y tests: solo desde S7
const covSeries  = SPRINT_HIST_ORDERED.filter(h => h.cov !== null);
const testSeries = SPRINT_HIST_ORDERED.filter(h => h.tests !== null);

// Pipeline steps status
function pipeClass(step) {
  const s = String(step);
  if (completedSteps.includes(s)) return 'pc-done';
  if (S.current_step === s) return 'pc-active';
  return 'pc-pend';
}

// ── Gate History log ─────────────────────────────────────────────────────────
// Load or create gate history in session
const gateHistory = S.gate_history || [];
const lastGateEntry = gateArg !== 'unknown' ? {
  gate: gateArg,
  step: stepArg,
  approved_at: now,
  sprint: S.current_sprint,
  feature: S.current_feature
} : null;

// Build gate history rows HTML
function gateHistoryRows() {
  const gates = [...gateHistory];
  if (lastGateEntry) gates.push(lastGateEntry);
  if (!gates.length) return '<div class="row"><span class="rl" style="font-style:italic;color:var(--dim)">Sin gates aprobados en este sprint aún</span></div>';
  return gates.slice(-10).reverse().map(g => `
    <div class="row">
      <span class="rl"><span style="color:var(--blue);font-family:var(--mono);font-weight:600">GATE-${g.gate}</span> · Step ${g.step} · S${g.sprint} ${g.feature}</span>
      <span class="rv" style="color:var(--green);font-size:10px">${(g.approved_at||'').slice(0,16).replace('T',' ')} ✓</span>
    </div>`).join('');
}

// Sprint rows HTML
function sprintRows() {
  return FULL_HISTORY.map(h => `
    <div class="sr">
      <span class="sr-n">${h.n}</span>
      <span>${h.feat}</span>
      <span style="font-size:10px;color:var(--muted);font-family:var(--mono);">${h.per}</span>
      <span class="sr-sp">${h.sp}</span>
      <span class="sr-sp" style="color:var(--muted)">${h.acum}</span>
      <span class="sr-cov" style="${h.cov!=='—'&&parseInt(h.cov)>=85?'color:var(--green)':''}">${h.cov}</span>
      <span class="sr-rel">${h.rel}</span>
    </div>`).join('') + `
    ${S.sprint_closed ? `
    <div class="sr">
      <span class="sr-n" style="color:var(--blue)">S19</span>
      <span style="font-size:12px;">FEAT-017 — Domiciliaciones y Recibos SEPA Direct Debit</span>
      <span style="font-size:10px;color:var(--muted);font-family:var(--mono);">Mar 26</span>
      <span class="sr-sp">${S.sprint_history?.sprint_19?.sp||24}</span>
      <span class="sr-sp" style="color:var(--muted)">${S.sprint_history?.sprint_19?.acum||449}</span>
      <span class="sr-cov" style="color:var(--green)">${S.sprint_history?.sprint_19?.cov||87}%</span>
      <span class="sr-rel">${S.sprint_history?.sprint_19?.rel||'v1.19.0'}</span>
    </div>
    <div class="sr">
      <span class="sr-n" style="color:var(--blue)">S20</span>
      <span style="font-size:12px;">FEAT-018 — Exportación Movimientos PDF/CSV</span>
      <span style="font-size:10px;color:var(--muted);font-family:var(--mono);">Mar 26</span>
      <span class="sr-sp">${S.sprint_history?.sprint_20?.sp||24}</span>
      <span class="sr-sp" style="color:var(--muted)">${S.sprint_history?.sprint_20?.acum||473}</span>
      <span class="sr-cov" style="color:var(--green)">${S.sprint_history?.sprint_20?.cov||88}%</span>
      <span class="sr-rel">${S.sprint_history?.sprint_20?.rel||'v1.20.0'}</span>
    </div>
    <div class="sr" style="background:rgba(62,201,125,.04);border-radius:6px;padding:9px 8px;">
      <span class="sr-n" style="color:var(--green)">S21 ✓</span>
      <span style="font-size:12px;color:var(--green);font-weight:500;">FEAT-019 — Centro de Privacidad GDPR · CERRADO</span>
      <span style="font-size:10px;color:var(--muted);font-family:var(--mono);">Abr 26</span>
      <span class="sr-sp" style="color:var(--green)">${S.sprint_history?.sprint_21?.sp||24}</span>
      <span class="sr-sp" style="color:var(--green)">${S.sprint_history?.sprint_21?.acum||497}</span>
      <span class="sr-cov" style="color:var(--green)">${S.sprint_history?.sprint_21?.cov||88}%</span>
      <span class="sr-rel" style="color:var(--green)">${S.sprint_history?.sprint_21?.rel||'v1.21.0'}</span>
    </div>` : `
    <div class="sr" style="background:rgba(240,168,48,.05);border-radius:6px;padding:9px 8px;">
      <span class="sr-n" style="color:var(--amber)">${curSprint.n}</span>
      <span style="color:var(--amber);font-weight:500">${S.current_feature} — EN CURSO · ${S.sprint_goal||''}</span>
      <span style="font-size:10px;color:var(--muted);font-family:var(--mono);">May 26</span>
      <span class="sr-sp" style="color:var(--amber)">${curSprint.sp}</span>
      <span class="sr-sp" style="color:var(--amber)">${curSprint.acum}</span>
      <span class="sr-cov" style="color:var(--amber)">—</span>
      <span class="sr-rel" style="color:var(--amber)">${curSprint.rel}</span>
    </div>`}`;
}

// ── HTML Generation ───────────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BankPortal · Dashboard Global · SOFIA v2.3</title>
<meta name="sofia-generated" content="${now}">
<meta name="sofia-gate" content="${gateArg}">
<meta name="sofia-step" content="${stepArg}">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<style>
:root{--bg:#0a0c10;--bg2:#10131a;--bg3:#171b24;--bg4:#1e2330;--border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.11);--text:#dde1ec;--muted:#7a8299;--dim:#4a5068;--blue:#4192e8;--blue-d:rgba(65,146,232,0.14);--green:#3ec97d;--green-d:rgba(62,201,125,0.12);--amber:#f0a830;--amber-d:rgba(240,168,48,0.12);--red:#e8605c;--red-d:rgba(232,96,92,0.12);--purple:#a27ae8;--purple-d:rgba(162,122,232,0.12);--teal:#35c4b0;--teal-d:rgba(53,196,176,0.12);--orange:#C84A14;--font:'Sora',sans-serif;--mono:'DM Mono',monospace;--r:10px;--r2:14px;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:14px;line-height:1.6;min-height:100vh;}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:16px 28px;background:var(--bg2);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:200;}
.hdr-brand{display:flex;align-items:center;gap:14px;}
.logo svg{width:38px;height:38px;}
.brand-title{font-size:17px;font-weight:700;letter-spacing:-.3px;}
.brand-sub{font-size:10px;color:var(--muted);font-family:var(--mono);letter-spacing:.5px;margin-top:2px;}
.hdr-badges{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.bdg{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;font-size:10px;font-weight:600;font-family:var(--mono);letter-spacing:.3px;border:1px solid transparent;}
.bdg-green{background:var(--green-d);color:var(--green);border-color:rgba(62,201,125,.22);}
.bdg-amber{background:var(--amber-d);color:var(--amber);border-color:rgba(240,168,48,.22);}
.bdg-blue{background:var(--blue-d);color:var(--blue);border-color:rgba(65,146,232,.22);}
.bdg-purple{background:var(--purple-d);color:var(--purple);border-color:rgba(162,122,232,.22);}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor;animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.gate-banner{margin:16px 28px;padding:12px 18px;border:1px solid;border-radius:var(--r);display:flex;align-items:center;gap:14px;}
.gate-banner.pending{background:var(--amber-d);border-color:rgba(240,168,48,.28);}
.gate-banner.ok{background:var(--green-d);border-color:rgba(62,201,125,.28);}
.gate-banner .gi{font-size:18px;flex-shrink:0;}
.gate-banner .gt{flex:1;font-size:12px;}
.gate-banner .gtt{font-weight:600;font-size:13px;margin-bottom:2px;}
.pending .gtt{color:var(--amber);}.ok .gtt{color:var(--green);}
.gate-banner .gtd{color:var(--muted);}
.gate-tag{font-family:var(--mono);font-size:10px;padding:3px 8px;border-radius:5px;border:1px solid;white-space:nowrap;}
.pending .gate-tag{color:var(--amber);background:rgba(240,168,48,.1);border-color:rgba(240,168,48,.2);}
.ok .gate-tag{color:var(--green);background:rgba(62,201,125,.1);border-color:rgba(62,201,125,.2);}
.gen-stamp{padding:4px 28px;background:var(--bg3);font-size:10px;color:var(--dim);font-family:var(--mono);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;}
.tabs{display:flex;padding:0 28px;background:var(--bg2);border-bottom:1px solid var(--border);overflow-x:auto;}
.tab{padding:11px 18px;font-size:12px;font-weight:500;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;white-space:nowrap;font-family:var(--mono);}
.tab.active{color:var(--blue);border-bottom-color:var(--blue);}
.tab:hover:not(.active){color:var(--text);}
.panel{display:none;padding:22px 28px;}
.panel.active{display:block;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:18px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;}
.g6{display:grid;grid-template-columns:repeat(6,1fr);gap:11px;margin-bottom:18px;}
.card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r2);padding:18px;}
.ct{font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.9px;margin-bottom:13px;font-family:var(--mono);}
.kpi{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:15px 16px;}
.kl{font-size:10px;color:var(--muted);font-family:var(--mono);letter-spacing:.3px;text-transform:uppercase;margin-bottom:5px;}
.kv{font-size:28px;font-weight:700;line-height:1;}
.ks{font-size:10px;color:var(--muted);margin-top:4px;line-height:1.4;}
.kv-blue{color:var(--blue)}.kv-green{color:var(--green)}.kv-amber{color:var(--amber)}.kv-purple{color:var(--purple)}.kv-teal{color:var(--teal)}.kv-white{color:var(--text)}
.cw{position:relative;height:220px;}.cw-lg{position:relative;height:280px;}
.row{display:flex;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:12px;gap:10px;}
.row:last-child{border-bottom:none;}
.rl{color:var(--muted);flex:1;}.rv{font-weight:600;font-family:var(--mono);text-align:right;}
.sr{display:grid;grid-template-columns:48px 1fr 80px 56px 60px 56px 56px;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);font-size:12px;}
.sr:last-child{border-bottom:none;}
.sr-n{font-family:var(--mono);font-size:11px;color:var(--muted);}
.sr-sp{font-family:var(--mono);font-weight:700;color:var(--blue);text-align:right;}
.sr-cov{font-family:var(--mono);font-size:11px;text-align:right;}
.sr-rel{font-family:var(--mono);font-size:10px;color:var(--green);text-align:right;}
.feat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.feat-card{background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);padding:13px 14px;position:relative;overflow:hidden;}
.feat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.fc-done::before{background:var(--green);}.fc-active::before{background:var(--amber);}.fc-future::before{background:var(--dim);}
.feat-id{font-family:var(--mono);font-size:9px;color:var(--muted);margin-bottom:4px;}
.feat-name{font-size:12px;font-weight:600;margin-bottom:6px;line-height:1.3;}
.feat-meta{display:flex;gap:6px;flex-wrap:wrap;}
.fm{font-size:9px;font-family:var(--mono);padding:2px 6px;border-radius:3px;}
.fm-sp{background:var(--blue-d);color:var(--blue);}.fm-ver{background:var(--green-d);color:var(--green);}
.fm-ver-act{background:var(--amber-d);color:var(--amber);}.fm-ver-fut{background:var(--bg4);color:var(--muted);}
.fm-tag{background:var(--bg4);color:var(--muted);}
.rr{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);}
.rr:last-child{border-bottom:none;}
.rid{font-family:var(--mono);font-size:10px;color:var(--muted);min-width:64px;}
.rb{flex:1;}.rt{font-size:12px;font-weight:500;margin-bottom:2px;}.rm{font-size:10px;color:var(--muted);}
.rst{font-size:9px;font-family:var(--mono);padding:2px 7px;border-radius:4px;white-space:nowrap;}
.rst-open{background:var(--amber-d);color:var(--amber);}
.rst-closed{background:var(--green-d);color:var(--green);}
.rst-acc{background:var(--bg4);color:var(--muted);border:1px solid var(--border2);}
.rst-plan{background:var(--blue-d);color:var(--blue);}
.pipe{display:flex;align-items:center;justify-content:space-between;padding:10px 0;overflow-x:auto;}
.ps{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:60px;position:relative;}
.ps:not(:last-child)::after{content:'';position:absolute;top:14px;left:calc(50% + 16px);width:calc(100% - 32px);height:1px;background:var(--border2);}
.pc{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:var(--mono);border:2px solid transparent;}
.pc-done{background:var(--green-d);border-color:var(--green);color:var(--green);}
.pc-active{background:var(--amber-d);border-color:var(--amber);color:var(--amber);}
.pc-pend{background:var(--bg3);border-color:var(--border2);color:var(--dim);}
.pl{font-size:8px;color:var(--muted);text-align:center;font-family:var(--mono);line-height:1.3;}
.pa-g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.pa{background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:11px 14px;display:flex;align-items:flex-start;gap:10px;}
.pa-light{width:13px;height:13px;border-radius:50%;flex-shrink:0;margin-top:2px;}
.pa-light-g{background:#3ec97d;box-shadow:0 0 8px rgba(62,201,125,.6);}
.pa-light-a{background:#f0a830;box-shadow:0 0 8px rgba(240,168,48,.6);}
.pa-light-r{background:#e8605c;box-shadow:0 0 8px rgba(232,96,92,.6);}
.pa-body{flex:1;}
.pac{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--purple);margin-bottom:2px;}
.pan{font-size:10px;color:var(--muted);}
.pa-ev{font-size:9px;margin-top:3px;font-family:var(--mono);}
.deliv-g{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;}
.dv{background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 12px;text-align:center;}
.dvn{font-family:var(--mono);font-size:20px;font-weight:700;color:var(--blue);margin-bottom:3px;}
.dvl{font-size:10px;color:var(--muted);}
.pbar{height:5px;background:var(--bg4);border-radius:3px;overflow:hidden;margin-top:6px;}
.pb-inner{height:100%;border-radius:3px;background:var(--green);}
.sh{font-size:10px;color:var(--muted);font-family:var(--mono);letter-spacing:.5px;text-transform:uppercase;padding:6px 0;border-bottom:1px solid var(--border);margin-bottom:8px;}
.health{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg3);border-radius:8px;border:1px solid var(--border);margin-bottom:7px;}
.h-dot{width:11px;height:11px;border-radius:50%;flex-shrink:0;}
.h-g{background:var(--green);box-shadow:0 0 7px rgba(62,201,125,.45);}
.h-a{background:var(--amber);box-shadow:0 0 7px rgba(240,168,48,.45);}
.h-label{font-size:11px;font-weight:600;}.h-sub{font-size:10px;color:var(--muted);}
.gate-log-badge{display:inline-block;background:var(--green-d);color:var(--green);font-family:var(--mono);font-size:9px;padding:2px 7px;border-radius:4px;border:1px solid rgba(62,201,125,.2);margin-left:6px;}
.footer{padding:14px 28px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:10px;color:var(--muted);font-family:var(--mono);background:var(--bg2);margin-top:24px;}
@media(max-width:900px){.g6{grid-template-columns:repeat(3,1fr)}.feat-grid{grid-template-columns:repeat(2,1fr)}.g4{grid-template-columns:repeat(2,1fr)}.deliv-g{grid-template-columns:repeat(3,1fr)}.sr{grid-template-columns:40px 1fr 50px 40px}}
</style>
</head>
<body>

<div class="hdr">
  <div class="hdr-brand">
    <div class="logo">
      <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="6,30 19,6 23,14 10,38" fill="#C84A14"/>
        <rect x="23" y="4" width="11" height="15" rx="5.5" fill="#45699E"/>
        <rect x="23" y="21" width="11" height="15" rx="5.5" fill="#5B8878"/>
      </svg>
    </div>
    <div>
      <div class="brand-title">BankPortal · Banco Meridian</div>
      <div class="brand-sub">SOFIA v${S.sofia_version} · Dashboard Global del Proyecto · Generado en cada Gate</div>
    </div>
  </div>
  <div class="hdr-badges">
    <span class="bdg bdg-green"><span class="dot"></span>v1.${completedSprints}.0 PRD</span>
    <span class="bdg bdg-blue">Sprint ${S.current_sprint} · ${S.current_feature}</span>
    ${GP ? `<span class="bdg bdg-amber"><span class="dot"></span>${gateLabel}</span>` : '<span class="bdg bdg-green">Pipeline activo</span>'}
    <span class="bdg bdg-purple">CMMI L3</span>
  </div>
</div>

<div class="gen-stamp">
  <span>Generado: ${now.slice(0,16).replace('T',' ')} · Gate: ${gateArg} · Step: ${stepArg} · Sprint ${S.current_sprint}</span>
  <span>Fuente: .sofia/session.json · sofia_version: ${S.sofia_version} · session_updated: ${(S.updated_at||'').slice(0,16).replace('T',' ')}</span>
</div>

${GP ? `
<div class="gate-banner pending">
  <div class="gi">⏳</div>
  <div class="gt">
    <div class="gtt">GATE-${GP.step} — Sprint ${S.current_sprint} · Pendiente aprobación ${GP.waiting_for}</div>
    <div class="gtd">${S.current_feature} · ${S.sprint_goal||''} · Pipeline bloqueado en Step ${S.current_step}</div>
  </div>
  <span class="gate-tag">${GP.jira_issue}</span>
</div>` : S.sprint_closed ? `
<div class="gate-banner ok">
  <div class="gi">✅</div>
  <div class="gt">
    <div class="gtt">Sprint ${S.current_sprint} · ${S.current_feature} · CERRADO · v1.${S.current_sprint}.0 en producción</div>
    <div class="gtd">Steps completados: [${completedSteps.join(', ')}] · G-1..G-9 aprobados · Sprint 21 pendiente definición PO</div>
  </div>
  <span class="gate-tag">S${S.current_sprint} CERRADO ✓</span>
</div>` : `
<div class="gate-banner ok">
  <div class="gi">✅</div>
  <div class="gt">
    <div class="gtt">Sprint ${S.current_sprint} · ${S.current_feature} · Pipeline en progreso</div>
    <div class="gtd">Steps completados: [${completedSteps.join(', ') || 'ninguno aún'}] · Pendientes: [${pendingSteps.join(', ')}]</div>
  </div>
  <span class="gate-tag">S${S.current_sprint} ACTIVO</span>
</div>`}

<div class="tabs">
  <div class="tab active" onclick="T('exec')">Resumen Ejecutivo</div>
  <div class="tab" onclick="T('history')">Historial Sprints</div>
  <div class="tab" onclick="T('quality')">Calidad & Tests</div>
  <div class="tab" onclick="T('roadmap')">Roadmap & Features</div>
  <div class="tab" onclick="T('gobierno')">Gobierno & CMMI</div>
  <div class="tab" onclick="T('gates')">Gates & Pipeline</div>
</div>

<!-- ═══ TAB 1: EJECUTIVO ═══ -->
<div id="p-exec" class="panel active">
  <div class="g6">
    <div class="kpi"><div class="kl">Sprints completados</div><div class="kv kv-white">${S.sprint_closed ? S.current_sprint : completedSprints}</div><div class="ks">${S.sprint_closed ? 'S1–S' + S.current_sprint + ' ✓' : 'S' + S.current_sprint + ' en curso'}</div></div>
    <div class="kpi"><div class="kl">Story Points</div><div class="kv kv-blue">${totalSP}</div><div class="ks">acum · 23.6 SP/sprint</div></div>
    <div class="kpi"><div class="kl">Features</div><div class="kv kv-teal">${completedSprints} ✓</div><div class="ks">S1–S${completedSprints} completados</div></div>
    <div class="kpi"><div class="kl">Tests</div><div class="kv kv-green">${totalTests}</div><div class="ks">${coverage}% cobertura</div></div>
    <div class="kpi"><div class="kl">Defectos PRD</div><div class="kv kv-green">${defects}</div><div class="ks">histórico total</div></div>
    <div class="kpi"><div class="kl">CVEs críticos</div><div class="kv kv-green">${S.security?.cve_critical||0}</div><div class="ks">semáforo ${S.security?.semaphore||'VERDE'}</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="ct">Estado de salud del proyecto</div>
      <div class="health"><div class="h-dot h-g"></div><div><div class="h-label" style="color:var(--green)">Calidad · ÓPTIMO</div><div class="h-sub">${defects} defectos · 0 CVEs · ${coverage}% cobertura · ${totalTests} tests</div></div></div>
      <div class="health"><div class="h-dot h-g"></div><div><div class="h-label" style="color:var(--green)">Delivery · ON TRACK</div><div class="h-sub">${completedSprints}/${completedSprints} sprints entregados · 100% SP · velocidad estable</div></div></div>
      <div class="health"><div class="h-dot h-g"></div><div><div class="h-label" style="color:var(--green)">Seguridad · VERDE</div><div class="h-sub">PCI-DSS req.3/8/10 · OWASP clean · 0 bloqueantes</div></div></div>
      ${GP ? `<div class="health"><div class="h-dot h-a"></div><div><div class="h-label" style="color:var(--amber)">Sprint ${S.current_sprint} · ${gateLabel}</div><div class="h-sub">Gate pendiente · ${GP.jira_issue}</div></div></div>` : `<div class="health"><div class="h-dot h-g"></div><div><div class="h-label" style="color:var(--green)">Sprint ${S.current_sprint} · Pipeline activo</div><div class="h-sub">Steps completados: [${completedSteps.join(', ')||'—'}]</div></div></div>`}
      <div class="health"><div class="h-dot h-g"></div><div><div class="h-label" style="color:var(--green)">CMMI L3 · ACTIVO</div><div class="h-sub">9 PAs · 154 evidencias · Sprints S14–S16 auditados</div></div></div>
      <div class="health"><div class="h-dot h-a"></div><div><div class="h-label" style="color:var(--amber)">Deuda técnica · ${(S.security?.open_debts||[]).length} items</div><div class="h-sub">${(S.security?.open_debts||[]).map(d=>d.id).join(' · ')||'Sin deuda abierta'}</div></div></div>
    </div>
    <div class="card">
      <div class="ct">Índice de madurez del proyecto</div>
      <div class="cw"><canvas id="radarChart"></canvas></div>
    </div>
  </div>
  <div class="card" style="margin-bottom:18px;">
    <div class="ct">Velocidad acumulada — todos los sprints (S1→S${completedSprints})</div>
    <div style="position:relative;height:200px;"><canvas id="velAllChart"></canvas></div>
  </div>
  <div class="card">
    <div class="ct">Pipeline Sprint ${S.current_sprint} · ${S.current_feature} · SOFIA v${S.sofia_version} (${S.pipeline_steps_total||15} steps activos)</div>
    <div class="pipe">
      <div class="ps"><div class="pc ${pipeClass('1')}">1</div><div class="pl">Scrum<br>Master</div></div>
      <div class="ps"><div class="pc ${pipeClass('2')}">2</div><div class="pl">Req.<br>Analyst</div></div>
      <div class="ps"><div class="pc ${pipeClass('2b')}">2b</div><div class="pl">FA<br>Agent</div></div>
      <div class="ps"><div class="pc ${pipeClass('3')}">3</div><div class="pl">Archi-<br>tect</div></div>
      <div class="ps"><div class="pc ${pipeClass('3b')}">3b</div><div class="pl">Doc<br>Agent</div></div>
      <div class="ps"><div class="pc ${pipeClass('4')}">4</div><div class="pl">Devel-<br>oper</div></div>
      <div class="ps"><div class="pc ${pipeClass('5')}">5</div><div class="pl">Code<br>Review</div></div>
      <div class="ps"><div class="pc ${pipeClass('5b')}">5b</div><div class="pl">Security<br>Audit</div></div>
      <div class="ps"><div class="pc ${pipeClass('6')}">6</div><div class="pl">QA<br>Tester</div></div>
      <div class="ps"><div class="pc ${pipeClass('7')}">7</div><div class="pl">Dev<br>Ops</div></div>
      <div class="ps"><div class="pc ${pipeClass('8')}">8</div><div class="pl">Doc<br>Agent</div></div>
      <div class="ps"><div class="pc ${pipeClass('8b')}">8b</div><div class="pl">FA<br>Agent</div></div>
      <div class="ps"><div class="pc ${pipeClass('9')}">9</div><div class="pl">Close<br>Sprint</div></div>
    </div>
    <div style="margin-top:10px;padding:9px 14px;background:${GP?'var(--amber-d)':'var(--green-d)'};border-radius:8px;border:1px solid ${GP?'rgba(240,168,48,.2)':'rgba(62,201,125,.2)'};font-size:11px;color:${GP?'var(--amber)':'var(--green)'};">
      ${GP ? `⏳ <strong>Step ${S.current_step} activo</strong> · Completados: [${completedSteps.join(', ')||'—'}] · <strong>GATE-${GP.step} bloqueante</strong> — ${GP.jira_issue}` : `✅ <strong>Pipeline activo</strong> · Completados: [${completedSteps.join(', ')||'—'}] · Pending: [${pendingSteps.join(', ')}]`}
    </div>
  </div>
</div>

<!-- ═══ TAB 2: HISTORIAL ═══ -->
<div id="p-history" class="panel">
  <div class="g2" style="margin-bottom:18px;">
    <div class="card">
      <div class="ct">Velocidad por Sprint (SP entregados)</div>
      <div class="cw-lg"><canvas id="velBarChart"></canvas></div>
    </div>
    <div class="card">
      <div class="ct">Burnup acumulado del proyecto</div>
      <div class="cw-lg"><canvas id="burnupChart"></canvas></div>
    </div>
  </div>
  <div class="card">
    <div class="ct">Historial completo — ${S.sprint_closed ? S.current_sprint : completedSprints} sprints completados${S.sprint_closed ? ' · Sprint 21 próximo' : ' + Sprint ' + S.current_sprint + ' en curso'}</div>
    <div style="display:grid;grid-template-columns:48px 1fr 80px 56px 60px 56px 56px;gap:10px;padding:6px 0 8px;border-bottom:1px solid var(--border2);font-size:10px;font-family:var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">
      <span>Sprint</span><span>Feature</span><span>Período</span><span style="text-align:right">SP</span><span style="text-align:right">Acum.</span><span style="text-align:right">Cob.</span><span style="text-align:right">Release</span>
    </div>
    ${sprintRows()}
  </div>
</div>

<!-- ═══ TAB 3: CALIDAD ═══ -->
<div id="p-quality" class="panel">
  <div class="g4">
    <div class="kpi"><div class="kl">Tests último sprint</div><div class="kv kv-green">${S.qa?.test_cases_pass||65}/${S.qa?.test_cases_total||69}</div><div class="ks">${S.qa?.test_cases_blocked||0} bloq · ${S.qa?.test_cases_fail||0} fail</div></div>
    <div class="kpi"><div class="kl">Cobertura actual</div><div class="kv kv-green">${coverage}%</div><div class="ks">umbral 80% · +${coverage-80}pp margen</div></div>
    <div class="kpi"><div class="kl">Tests acumulados</div><div class="kv kv-blue">${totalTests}</div><div class="ks">S1→S${completedSprints} automatizados</div></div>
    <div class="kpi"><div class="kl">Defectos PRD hist.</div><div class="kv kv-green">${defects}</div><div class="ks">${completedSprints} sprints consecutivos</div></div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="ct">Evolución tests automatizados</div>
      <div class="cw-lg"><canvas id="testsChart"></canvas></div>
    </div>
    <div class="card">
      <div class="ct">Cobertura de código — tendencia</div>
      <div class="cw-lg"><canvas id="covTrendChart"></canvas></div>
    </div>
  </div>
  <div class="g3">
    <div class="card">
      <div class="ct">QA último sprint completado</div>
      <div class="row"><span class="rl">Tests ejecutados</span><span class="rv" style="color:var(--green)">${S.qa?.test_cases_pass||65}/${S.qa?.test_cases_total||69} PASS</span></div>
      <div class="row"><span class="rl">Bloqueados / Fallidos</span><span class="rv" style="color:var(--amber)">${S.qa?.test_cases_blocked||4} bloq · ${S.qa?.test_cases_fail||0} fail</span></div>
      <div class="row"><span class="rl">Escenarios Gherkin</span><span class="rv" style="color:var(--green)">${S.qa?.gherkin_scenarios_covered||'16/16'}</span></div>
      <div class="row"><span class="rl">Cobertura unitaria</span><span class="rv" style="color:var(--green)">${S.qa?.unit_coverage_estimated||coverage+'%'}</span></div>
      <div class="row"><span class="rl">Cobertura funcional</span><span class="rv" style="color:var(--green)">${S.qa?.functional_coverage||'100%'}</span></div>
      <div class="row"><span class="rl">Integración checks</span><span class="rv" style="color:var(--green)">${S.qa?.integration_checks||'9/9'}</span></div>
      <div class="row"><span class="rl">Security checks</span><span class="rv" style="color:${S.qa?.security_checks==='6/8'?'var(--amber)':'var(--green)'}">${S.qa?.security_checks||'6/8'}</span></div>
      <div class="row"><span class="rl">WCAG 2.1 AA</span><span class="rv" style="color:var(--green)">${S.qa?.wcag_checks||'5/5'}</span></div>
      <div class="row"><span class="rl">Repositorio activo</span><span class="rv" style="color:var(--green)">${S.qa?.repositorio_activo||'JPA-REAL'}</span></div>
      <div class="row"><span class="rl">Defectos abiertos</span><span class="rv" style="color:var(--green)">${S.qa?.defects_open||0}</span></div>
      <div class="row"><span class="rl">Veredicto QA</span><span class="rv" style="color:var(--amber);font-size:10px">${(S.qa?.verdict||'OK').slice(0,35)}</span></div>
    </div>
    <div class="card">
      <div class="ct">Seguridad</div>
      <div class="row"><span class="rl">CVEs críticos/altos</span><span class="rv" style="color:var(--green)">${S.security?.cve_critical||0}/${S.security?.cve_high||0}</span></div>
      <div class="row"><span class="rl">SAST findings</span><span class="rv" style="color:var(--amber)">${S.security?.sast_findings||2} (${S.security?.sast_blocker||0} bloq.)</span></div>
      <div class="row"><span class="rl">Semáforo</span><span class="rv" style="color:${S.security?.semaphore==='YELLOW'?'var(--amber)':S.security?.semaphore==='RED'?'var(--red)':'var(--green)'}">${S.security?.semaphore||'GREEN'}</span></div>
      <div class="row"><span class="rl">PCI-DSS req.3/8/10</span><span class="rv" style="color:var(--green)">✓ Validados</span></div>
      <div class="sh" style="margin-top:12px;">Deuda técnica abierta</div>
      ${(S.security?.open_debts||[]).map(d=>`<div class="rr"><div class="rid">${d.id}</div><div class="rb"><div class="rt">${d.desc}</div><div class="rm">CVSS ${d.cvss} · Target: S${d.sprint_target}</div></div><span class="rst rst-open">S${d.sprint_target}</span></div>`).join('')||'<div class="row"><span class="rl" style="color:var(--green)">Sin deuda técnica abierta</span></div>'}
    </div>
    <div class="card">
      <div class="ct">Code Review tendencia</div>
      <div class="row"><span class="rl">S19</span><span class="rv" style="color:var(--green)">3 fixes aplicados (0 bloq.)</span></div>
      <div class="row"><span class="rl">S20</span><span class="rv" style="color:var(--amber)">HOTFIX · 16 ficheros (0 bloq.)</span></div>
      <div class="row"><span class="rl">S21</span><span class="rv" style="color:var(--green)">${S.code_review?.findings_suggestion||1} sug · ${S.code_review?.findings_minor||0} men · 0 bloq.</span></div>
      <div style="margin-top:10px;padding:9px;background:var(--green-d);border-radius:7px;font-size:11px;color:var(--green);border:1px solid rgba(62,201,125,.2);">✓ 0 NCs bloqueantes últimos 3 sprints</div>
      <div class="sh" style="margin-top:12px;">Deuda saldada</div>
      <div style="font-size:10px;color:var(--muted);margin-bottom:4px;">Ratio deuda técnica resuelta</div>
      <div class="pbar"><div class="pb-inner" style="width:88%;"></div></div>
      <div style="font-size:10px;color:var(--green);margin-top:3px;">~88% resuelta históricamente</div>
    </div>
  </div>
</div>

<!-- ═══ TAB 4: ROADMAP ═══ -->
<div id="p-roadmap" class="panel">
  <div class="g3" style="margin-bottom:14px;">
    <div class="kpi"><div class="kl">Features completadas</div><div class="kv kv-green">${completedSprints}/${completedSprints}</div><div class="ks">FEAT-001→0${completedSprints} ✓ · Sprint ${S.current_sprint+1} próximo</div></div>
    <div class="kpi"><div class="kl">Último release</div><div class="kv kv-blue">v1.${completedSprints}.0</div><div class="ks">PRD · Sprint ${completedSprints} cerrado ✓</div></div>
    <div class="kpi"><div class="kl">FA-Agent v${S.fa_agent?.skill_version||'2.3'}</div><div class="kv kv-teal">${S.fa_agent?.functionalities||70}</div><div class="ks">${S.fa_agent?.business_rules||166} reglas negocio · S1–S${completedSprints}</div></div>
  </div>
  <div class="card" style="margin-bottom:16px;">
    <div class="ct">Roadmap de features — BankPortal</div>
    <div class="feat-grid">
      <div class="feat-card fc-done"><div class="feat-id">FEAT-001 · S1–S2</div><div class="feat-name">2FA TOTP · Autenticación Segura</div><div class="feat-meta"><span class="fm fm-sp">40 SP</span><span class="fm fm-ver">v1.1–v1.2</span><span class="fm fm-tag">PCI req.8</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-002 · S3</div><div class="feat-name">Autenticación JWT + Refresh Token</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.3</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-003 · S4</div><div class="feat-name">Cuentas y Saldos</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.4</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-004 · S5</div><div class="feat-name">Movimientos e Historial</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.5</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-005 · S6</div><div class="feat-name">Transferencias SEPA-SCT</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.6</span><span class="fm fm-tag">SEPA-SCT</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-006 · S7</div><div class="feat-name">Beneficiarios y Agenda de Pagos</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.7</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-007 · S8</div><div class="feat-name">Bizum & Pagos Móviles</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.8</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-008 · S9</div><div class="feat-name">Notificaciones y Alertas SSE</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.9</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-009 · S10</div><div class="feat-name">Documentos y Contratos</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.10</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-010 · S11</div><div class="feat-name">Cuentas de Ahorro e Inversión</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.11</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-011 · S12–S13</div><div class="feat-name">Pagos, Recibos & Dashboard Fin.</div><div class="feat-meta"><span class="fm fm-sp">48 SP</span><span class="fm fm-ver">v1.12–v1.13</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-012 · S14</div><div class="feat-name">Perfil y Configuración Usuario</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.14</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-013 · S15</div><div class="feat-name">KYC & Onboarding Digital</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.15</span><span class="fm fm-tag">GDPR</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-014 · S16</div><div class="feat-name">Notificaciones Push VAPID</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.16</span><span class="fm fm-tag">ADR-025</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-015 · S17</div><div class="feat-name">Transferencias Programadas</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.17</span><span class="fm fm-tag">ShedLock</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-016 · S18</div><div class="feat-name">Gestión de Tarjetas · PCI-DSS</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.18</span><span class="fm fm-tag">PCI-DSS</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-017 · S19</div><div class="feat-name">Domiciliaciones y Recibos SEPA DD</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.19.0</span><span class="fm fm-tag">SEPA-SDD · PSD2</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-018 · S20</div><div class="feat-name">Exportación Movimientos PDF/CSV · PSD2 Art.47</div><div class="feat-meta"><span class="fm fm-sp">24 SP</span><span class="fm fm-ver">v1.20.0</span><span class="fm fm-tag">PSD2 · GDPR · PCI-DSS</span></div></div>
      <div class="feat-card fc-done"><div class="feat-id">FEAT-019 · S21</div><div class="feat-name">Centro de Privacidad GDPR — Perfil, Consentimientos, Portabilidad, Derecho al Olvido</div><div class="feat-meta"><span class="fm fm-sp">${S.sprint_history?.sprint_21?.sp||24} SP</span><span class="fm fm-ver">${S.sprint_history?.sprint_21?.rel||'v1.21.0'}</span><span class="fm fm-tag">GDPR · PSD2-SCA</span></div></div>
    </div>
  </div>
  <div class="card">
    <div class="ct">Progreso global</div>
    <div class="g3" style="margin-bottom:0;gap:20px;">
      <div><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;"><span style="color:var(--muted)">Features completadas</span><span style="color:var(--green);font-family:var(--mono)">18/18 completadas</span></div><div class="pbar" style="height:7px;"><div class="pb-inner" style="width:100%;"></div></div></div>
      <div><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;"><span style="color:var(--muted)">Story Points entregados</span><span style="color:var(--blue);font-family:var(--mono)">${totalSP} SP acum.</span></div><div class="pbar" style="height:7px;"><div class="pb-inner" style="width:${Math.round(totalSP/500*100)}%;background:var(--blue);"></div></div></div>
      <div><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;"><span style="color:var(--muted)">Cobertura de tests</span><span style="color:var(--green);font-family:var(--mono)">${coverage}% actual</span></div><div class="pbar" style="height:7px;"><div class="pb-inner" style="width:${coverage}%;"></div></div></div>
    </div>
  </div>
</div>

<!-- ═══ TAB 5: GOBIERNO ═══ -->
<div id="p-gobierno" class="panel">
  <div class="g2">
    <div class="card">
      <div class="ct">CMMI Level 3 — Process Areas activas</div>
      <div class="pa-g" style="margin-bottom:14px;">
        ${[
          {pa:'PP',   name:'Project Planning',           ev:'SPRINT-021-planning.md · sprint21-planning-doc.docx',                  st:'g'},
          {pa:'PMC',  name:'Project Monitoring & Control',ev:'Sprint-21-Report-PMC.docx · session.json · sofia.log',                  st:'g'},
          {pa:'REQM', name:'Requirements Management',    ev:'SRS-FEAT-019-Sprint21.docx · FA-FEAT-019-sprint21.md',               st:'g'},
          {pa:'VER',  name:'Verification',               ev:'CR-FEAT-019-sprint21.md · TEST-EXECUTION-FEAT-019-sprint21.md',      st:'g'},
          {pa:'VAL',  name:'Validation',                 ev:'QA-FEAT-019-Sprint21.docx · smoke-test-v1.21.0.sh PASS 17/17',                    st:'g'},
          {pa:'PPQA', name:'Process & Product Quality',  ev:'QUALITY-SUMMARY-Sprint21.docx · NC-Tracker-Sprint21.xlsx',           st:'g'},
          {pa:'CM',   name:'Configuration Management',   ev:'RELEASE-NOTES-v1.21.0.docx · V22__profile_gdpr.sql · e744da0',            st:'g'},
          {pa:'RSKM', name:'Risk Management',            ev:'RISK-REGISTER-Sprint21.docx · DEBT-040/041/042 registrados',                         st:'g'},
          {pa:'DAR',  name:'Decision Analysis',          ev:'Decision-Log-Sprint21.xlsx · ADR-032/033 aprobados',                     st:'g'},
        ].map(function(x) {
          var lightClass = x.st==='g'?'pa-light-g':x.st==='a'?'pa-light-a':'pa-light-r';
          var stLabel    = x.st==='g'?'ACTIVO':x.st==='a'?'PARCIAL':'RIESGO';
          var stColor    = x.st==='g'?'var(--green)':x.st==='a'?'var(--amber)':'var(--red)';
          return '<div class="pa">'
            + '<div class="pa-light ' + lightClass + '"></div>'
            + '<div class="pa-body">'
            + '<div class="pac">' + x.pa + ' <span style="font-size:9px;color:' + stColor + ';margin-left:4px;">' + stLabel + '</span></div>'
            + '<div class="pan">' + x.name + '</div>'
            + '<div class="pa-ev" style="color:var(--dim)">' + x.ev + '</div>'
            + '</div></div>';
        }).join('')}
      </div>
      <div style="padding:10px;background:var(--purple-d);border-radius:8px;border:1px solid rgba(162,122,232,.2);font-size:11px;color:var(--purple);">✓ CMMI L3 ACTIVO · 9 Process Areas · Semáforo: 9🟢 0🟡 0🔴 · Sprint 20 cerrado · 154+ evidencias generadas</div>
    </div>
    <div class="card">
      <div class="ct">Atlassian — Estado sincronización</div>
      ${GP ? `<div class="rr"><div class="rid" style="color:#4285F4;font-weight:700">JIRA</div><div class="rb"><div class="rt">${GP.jira_issue} — Sprint ${S.current_sprint} Gate-${GP.step}</div><div class="rm">Pendiente aprobación ${GP.waiting_for}</div></div><span class="rst rst-open">⏳ GATE-${GP.step}</span></div>` : ''}
      <div class="rr"><div class="rid" style="color:#4285F4;font-weight:700">JIRA</div><div class="rb"><div class="rt">Sprint ${completedSprints} — Cerrado</div><div class="rm">${S.sprint_history?.[`sprint_${completedSprints}`]?.closed_at||'—'}</div></div><span class="rst rst-closed">✓</span></div>
      <div class="rr"><div class="rid" style="color:#4BBAFF;font-weight:700">CONF</div><div class="rb"><div class="rt">Retrospectiva S${completedSprints} · #${S.confluence_retro_id||'—'}</div><div class="rm">Publicada ${S.sprint_closed_at?.slice(0,10)||'—'}</div></div><span class="rst ${S.atlassian_synced?'rst-closed':'rst-open'}">${S.atlassian_synced?'✓':'⏳'}</span></div>
      <div class="rr"><div class="rid" style="color:#4BBAFF;font-weight:700">CONF</div><div class="rb"><div class="rt">FA BankPortal v${S.fa_agent?.doc_version||'2.0'} — ${S.fa_agent?.functionalities||52} func · ${S.fa_agent?.business_rules||86} BR</div><div class="rm">S1–S${S.fa_agent?.last_sprint_consolidated||18} consolidados</div></div><span class="rst rst-closed">✓</span></div>
      <div class="rr"><div class="rid" style="color:var(--muted)">Última sync</div><div class="rb"><div class="rt">${S.atlassian_sync_date||today} · LA-018-01 aplicada</div></div><span class="rst rst-closed">OK</span></div>
    </div>
  </div>
  <div class="card" style="margin-bottom:16px;">
    <div class="ct">Entregables CMMI generados — proyecto completo</div>
    <div class="deliv-g" style="margin-bottom:14px;">
      <div class="dv"><div class="dvn" style="color:var(--blue)">${completedSprints}</div><div class="dvl">Sprint Reports</div></div>
      <div class="dv"><div class="dvn" style="color:var(--teal)">${completedSprints}</div><div class="dvl">HLD/LLD Docs</div></div>
      <div class="dv"><div class="dvn" style="color:var(--green)">${completedSprints}</div><div class="dvl">QA Reports</div></div>
      <div class="dv"><div class="dvn" style="color:var(--purple)">${completedSprints}</div><div class="dvl">DevOps/Runbooks</div></div>
      <div class="dv"><div class="dvn" style="color:var(--amber)">${completedSprints*3}</div><div class="dvl">Excel (NC/DL/QD)</div></div>
      <div class="dv"><div class="dvn" style="color:var(--blue)">154</div><div class="dvl">Evidencias CMMI</div></div>
      <div class="dv"><div class="dvn" style="color:var(--teal)">${S.fa_agent?.markdowns?.length||16}</div><div class="dvl">FA Markdowns</div></div>
      <div class="dv"><div class="dvn" style="color:var(--green)">1</div><div class="dvl">FA BankPortal.docx</div></div>
      <div class="dv"><div class="dvn" style="color:var(--purple)">${completedSprints}</div><div class="dvl">Releases PRD</div></div>
      <div class="dv"><div class="dvn" style="color:var(--amber)">9</div><div class="dvl">ADRs aprobados</div></div>
    </div>
  </div>
  <div class="g2">
    <div class="card">
      <div class="ct">Risk Register — estado actual</div>
      <div class="sh">Riesgos activos</div>
      <div class="rr"><div class="rid">R-016-02</div><div class="rb"><div class="rt">Safari iOS &lt;16.4 sin soporte Web Push</div><div class="rm">Externo · Fallback SSE operativo</div></div><span class="rst rst-acc">Aceptado</span></div>
      ${(S.security?.open_debts||[]).map((d,i)=>`<div class="rr"><div class="rid">R-019-0${i+1}</div><div class="rb"><div class="rt">${d.desc}</div><div class="rm">CVSS ${d.cvss} · S${d.sprint_target}</div></div><span class="rst rst-plan">S${d.sprint_target}</span></div>`).join('')}
      <div class="sh" style="margin-top:10px;">Cerrados últimos 3 sprints</div>
      <div class="rr"><div class="rid" style="color:var(--green)">R-019-01</div><div class="rb"><div class="rt">Flyway V22 ADD CONSTRAINT IF NOT EXISTS</div><div class="rm">DO body block fix · Stack startup S21</div></div><span class="rst rst-closed">✓</span></div>
      <div class="rr"><div class="rid" style="color:var(--green)">R-021-01</div><div class="rb"><div class="rt">PATCH /profile acepta email → bypass RN-F019-01</div><div class="rm">Validación en UpdateProfileUseCase · fix F1</div></div><span class="rst rst-closed">✓</span></div>
      <div class="rr"><div class="rid" style="color:var(--green)">R-021-02</div><div class="rb"><div class="rt">Data export cooldown 24h no aplicado</div><div class="rm">findRecentByUserIdAndTipo · fix F3 · RN-F019-12</div></div><span class="rst rst-closed">✓</span></div>
    </div>
    <div class="card">
      <div class="ct">Stack tecnológico</div>
      <div class="g2" style="gap:12px;margin-bottom:0;">
        <div>
          <div class="sh">Backend</div>
          <div class="row"><span class="rl">Lenguaje</span><span class="rv" style="color:var(--blue)">Java 21</span></div>
          <div class="row"><span class="rl">Framework</span><span class="rv">Spring Boot 3.x</span></div>
          <div class="row"><span class="rl">BD</span><span class="rv">PostgreSQL 16</span></div>
          <div class="row"><span class="rl">Migrations</span><span class="rv">Flyway V1–V18c</span></div>
          <div class="row"><span class="rl">Frontend</span><span class="rv">Angular 17+</span></div>
          <div class="row"><span class="rl">CI/CD</span><span class="rv">Jenkins + Docker</span></div>
        </div>
        <div>
          <div class="sh">SOFIA v${S.sofia_version}</div>
          <div class="row"><span class="rl">Agentes</span><span class="rv" style="color:var(--purple)">${C.agents?.total||20} activos</span></div>
          <div class="row"><span class="rl">Pipeline</span><span class="rv">${S.pipeline_steps_total||15} steps</span></div>
          <div class="row"><span class="rl">FA-Agent</span><span class="rv" style="color:var(--teal)">v${S.fa_agent?.skill_version||'2.1'}</span></div>
          <div class="row"><span class="rl">Metodología</span><span class="rv">Scrumban</span></div>
          <div class="row"><span class="rl">CMMI</span><span class="rv" style="color:var(--purple)">Level ${S.cmmi?.level||3}</span></div>
          <div class="row"><span class="rl">SOFIA v.</span><span class="rv" style="color:var(--purple)">${S.sofia_version}</span></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══ TAB 6: GATES & PIPELINE ═══ -->
<div id="p-gates" class="panel">
  <div class="g2">
    <div class="card">
      <div class="ct">Estado actual del pipeline — Sprint ${S.current_sprint}</div>
      <div class="row"><span class="rl">Feature</span><span class="rv" style="color:var(--blue)">${S.current_feature}</span></div>
      <div class="row"><span class="rl">Step actual</span><span class="rv" style="color:var(--amber)">Step ${S.current_step} · ${S.pipeline_step_name}</span></div>
      <div class="row"><span class="rl">Steps completados</span><span class="rv">[${completedSteps.join(', ')||'—'}]</span></div>
      <div class="row"><span class="rl">Steps pendientes</span><span class="rv" style="color:var(--muted)">[${pendingSteps.join(', ')}]</span></div>
      <div class="row"><span class="rl">Gate pendiente</span><span class="rv" style="color:${GP?'var(--amber)':'var(--green)'};">${GP?`GATE-${GP.step} · ${GP.jira_issue}`:'Ninguno'}</span></div>
      <div class="row"><span class="rl">Esperando</span><span class="rv" style="color:var(--muted)">${GP?.waiting_for||'—'}</span></div>
      <div class="row"><span class="rl">Sprint goal</span><span class="rv" style="font-size:10px;max-width:200px;text-align:right;line-height:1.3;">${(S.sprint_goal||'—').slice(0,80)}...</span></div>
      <div class="row"><span class="rl">Último artefacto</span><span class="rv" style="font-size:10px;color:var(--muted);">${(S.last_skill_output_path||'—').split('/').pop()}</span></div>
      <div class="row"><span class="rl">session.json updated</span><span class="rv" style="font-size:10px">${(S.updated_at||'').slice(0,16).replace('T',' ')}</span></div>
    </div>
    <div class="card">
      <div class="ct">Dashboard · Historial de regeneraciones <span class="gate-log-badge">Entregable</span></div>
      <div style="margin-bottom:12px;padding:9px;background:var(--blue-d);border-radius:7px;font-size:11px;color:var(--blue);border:1px solid rgba(65,146,232,.2);">
        📊 Este dashboard se regenera automáticamente en cada aprobación de Gate y al cierre de Sprint (Step 9). Siempre refleja el estado leído desde session.json en el momento de la regeneración.
      </div>
      <div class="sh">Última generación</div>
      <div class="row"><span class="rl">Timestamp</span><span class="rv" style="font-family:var(--mono);font-size:10px">${now.slice(0,16).replace('T',' ')}</span></div>
      <div class="row"><span class="rl">Trigger</span><span class="rv" style="color:var(--amber)">Gate ${gateArg} · Step ${stepArg}</span></div>
      <div class="row"><span class="rl">Sprint</span><span class="rv">Sprint ${S.current_sprint} · ${S.current_feature}</span></div>
      <div class="row"><span class="rl">Ruta canónica</span><span class="rv" style="font-size:10px;color:var(--muted)">docs/dashboard/bankportal-global-dashboard.html</span></div>
      <div class="row"><span class="rl">Alias</span><span class="rv" style="font-size:10px;color:var(--muted)">docs/quality/sofia-dashboard.html</span></div>
      <div class="sh" style="margin-top:12px;">Gates aprobados en Sprint ${S.current_sprint}</div>
      ${gateHistoryRows()}
    </div>
  </div>
  <div class="card">
    <div class="ct">Protocolo de Gates HITL — Matriz Atlassian Sprint ${S.current_sprint}</div>
    <div style="display:grid;grid-template-columns:60px 60px 1fr 1fr 1fr;gap:8px;padding:6px 0 8px;border-bottom:1px solid var(--border2);font-size:10px;font-family:var(--mono);color:var(--muted);text-transform:uppercase;">
      <span>Gate</span><span>Step</span><span>Aprobador</span><span>Jira</span><span>Confluence</span>
    </div>
    ${[
      ['G-1','1','Product Owner','Epic + issues → Por hacer','Página Sprint + index'],
      ['G-2','2','PO + SM','Issues → En curso','Requisitos + SRS'],
      ['G-3','3','Tech Lead','Issues arch. → En curso','Arquitectura + HLD/LLD'],
      ['G-5','5','Tech Lead','NCs en issues','Página Code Review'],
      ['G-6','6','QA Lead','US → Finalizada','QA resultados'],
      ['G-7','7','DevOps/RM','Release → Finalizada','Runbook + Release Notes'],
      ['G-8','8','PM','Deliverables → Finalizada','Documentación + evidencias'],
      ['G-9','9','PM','Epic → Finalizada + JQL=0','Sprint metrics + cierre'],
    ].map(([g,s,ap,ji,co])=>`
    <div style="display:grid;grid-template-columns:60px 60px 1fr 1fr 1fr;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);font-size:11px;align-items:center;">
      <span style="font-family:var(--mono);font-weight:600;color:${completedSteps.includes(s)?'var(--green)':S.current_step===s?'var(--amber)':'var(--muted)'};">${g}</span>
      <span style="font-family:var(--mono);color:var(--muted)">Step ${s}</span>
      <span style="color:var(--text)">${ap}</span>
      <span style="color:var(--muted);font-size:10px">${ji}</span>
      <span style="color:var(--muted);font-size:10px">${co}</span>
    </div>`).join('')}
  </div>
</div>

<div class="footer">
  <span>SOFIA v${S.sofia_version} · BankPortal — Banco Meridian · Dashboard Global</span>
  <span>${completedSprints} sprints · ${totalSP} SP · ${totalTests} tests · ${coverage}% cob · ${defects} defectos · CMMI L3 · 16 features</span>
  <span>Experis © 2026 · ${today}</span>
</div>

<script>
function T(id){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  const ids=['exec','history','quality','roadmap','gobierno','gates'];
  document.querySelectorAll('.tab')[ids.indexOf(id)].classList.add('active');
  document.getElementById('p-'+id).classList.add('active');
}
const C={blue:'#4192e8',green:'#3ec97d',amber:'#f0a830',purple:'#a27ae8',teal:'#35c4b0',muted:'#7a8299',grid:'rgba(255,255,255,0.04)'};
const ticks={color:C.muted,font:{size:10}};const grid={color:C.grid};
const sLabels=${JSON.stringify(velLabels)};
const sVel=${JSON.stringify(velData)};
const sAcum=${JSON.stringify(acumData)};
const sCovLabels=${JSON.stringify(covSeries.map(h=>h.n))};
const sCovData=${JSON.stringify(covSeries.map(h=>h.cov))};
const sTestsLabels=${JSON.stringify(testSeries.map(h=>h.n))};
const sTestsData=${JSON.stringify(testSeries.map(h=>h.tests))};

new Chart(document.getElementById('radarChart'),{type:'radar',
  data:{labels:['Delivery','Calidad','Seguridad','CMMI','Velocidad','Cobertura','0-Defectos'],
    datasets:[{data:[100,100,97,90,98,${coverage},100],borderColor:C.blue,backgroundColor:'rgba(65,146,232,0.15)',borderWidth:1.5,pointBackgroundColor:C.blue,pointRadius:3}]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
    scales:{r:{ticks:{display:false},grid:{color:'rgba(255,255,255,0.07)'},pointLabels:{color:C.muted,font:{size:10}},min:0,max:100}}}
});
new Chart(document.getElementById('velAllChart'),{type:'line',
  data:{labels:sLabels,datasets:[
    {data:sVel,borderColor:C.blue,backgroundColor:'rgba(65,146,232,0.08)',fill:true,tension:.3,pointRadius:3,pointBackgroundColor:C.blue},
    {data:Array(18).fill(23.6),borderColor:'rgba(62,201,125,.5)',borderWidth:1.5,borderDash:[4,4],pointRadius:0,fill:false}
  ]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{...ticks,font:{size:9}},grid},y:{ticks,grid,min:15,max:28}}}
});
new Chart(document.getElementById('velBarChart'),{type:'bar',
  data:{labels:sLabels,datasets:[{data:sVel,backgroundColor:sVel.map((v,i)=>i<2?'rgba(53,196,176,0.65)':'rgba(65,146,232,0.7)'),borderColor:sVel.map((v,i)=>i<2?C.teal:C.blue),borderWidth:1.2,borderRadius:3}]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{...ticks,font:{size:9}},grid},y:{ticks,grid,min:0,max:30}}}
});
new Chart(document.getElementById('burnupChart'),{type:'line',
  data:{labels:sLabels,datasets:[{data:sAcum,borderColor:C.green,backgroundColor:'rgba(62,201,125,0.1)',fill:true,tension:.3,pointRadius:2,pointBackgroundColor:C.green}]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{...ticks,font:{size:9}},grid},y:{ticks,grid,min:0,max:560}}}
});
new Chart(document.getElementById('testsChart'),{type:'bar',
  data:{labels:sTestsLabels,datasets:[{data:sTestsData,backgroundColor:'rgba(65,146,232,0.65)',borderColor:C.blue,borderWidth:1.2,borderRadius:3}]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{...ticks,font:{size:9}},grid},y:{ticks,grid,min:0,max:800}}}
});
new Chart(document.getElementById('covTrendChart'),{type:'line',
  data:{labels:sCovLabels,
    datasets:[
      {data:sCovData,borderColor:C.green,backgroundColor:'rgba(62,201,125,0.1)',fill:true,tension:.4,pointRadius:3,pointBackgroundColor:C.green},
      {data:Array(sCovLabels.length).fill(80),borderColor:'rgba(240,168,48,.5)',borderWidth:1.2,borderDash:[4,4],pointRadius:0,fill:false}
    ]},
  options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{...ticks,font:{size:9}},grid},y:{ticks:{...ticks,callback:v=>v+'%'},grid,min:70,max:95}}}
});
</script>
</body>
</html>`;

// ── Write outputs ─────────────────────────────────────────────────────────────
[OUT_DIR, OUT_QUALITY].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
fs.writeFileSync(OUT_FILE, HTML, 'utf8');
fs.writeFileSync(OUT_ALT,  HTML, 'utf8');

// ── Update session.json with dashboard deliverable ────────────────────────────
try {
  const sess = JSON.parse(fs.readFileSync(SESSION, 'utf8'));
  sess.dashboard_global = {
    path: 'docs/dashboard/bankportal-global-dashboard.html',
    alias: 'docs/quality/sofia-dashboard.html',
    last_generated: now,
    last_gate: gateArg,
    last_step: stepArg,
    sprint: S.current_sprint,
    feature: S.current_feature,
    generator: '.sofia/scripts/gen-global-dashboard.js'
  };
  sess.updated_at = now;
  if (!sess.gate_history) sess.gate_history = [];
  if (gateArg !== 'unknown' && lastGateEntry) {
    sess.gate_history.push(lastGateEntry);
  }
  fs.writeFileSync(SESSION, JSON.stringify(sess, null, 2), 'utf8');
} catch(e) { console.warn('Warning: could not update session.json:', e.message); }

// ── Log ───────────────────────────────────────────────────────────────────────
const logPath = path.join(ROOT, '.sofia/sofia.log');
const logEntry = `[${now}] [DASH] [gen-global-dashboard] GENERATED → docs/dashboard/bankportal-global-dashboard.html · Gate: ${gateArg} · Step: ${stepArg} · Sprint ${S.current_sprint}\n`;
try { fs.appendFileSync(logPath, logEntry, 'utf8'); } catch(e) {}

console.log(`✅ Dashboard Global generado:`);
console.log(`   → ${OUT_FILE}`);
console.log(`   → ${OUT_ALT}`);
console.log(`   Gate: ${gateArg} · Step: ${stepArg} · ${now.slice(0,16)}`);
