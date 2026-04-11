#!/usr/bin/env node
/**
 * gate-dashboard-hook.js — SOFIA v2.7
 * ═══════════════════════════════════════════════════════════════════════════
 * Orquestador automático invocado tras cada aprobación de Gate.
 *
 * Secuencia de ejecución:
 *   [TODOS LOS GATES]
 *     1. gen-ma-baseline.js    ← MA Process Baseline (SOLO Step 9 / G-9)
 *     2. gen-global-dashboard.js ← Dashboard global (GR-011 — SIEMPRE)
 *   [STEP 8b / 9 ADICIONAL]
 *     3. gen-fa-document.py    ← FA-{proyecto}-{cliente}.docx (LA-020-08)
 *
 * Uso:
 *   node .sofia/scripts/gate-dashboard-hook.js --gate G-3 --step 3
 *   node .sofia/scripts/gate-dashboard-hook.js --gate G-9 --step 9
 *
 * SOFIA_ORG_PATH: leído desde sofia-config.json → ma_baseline.sofia_org_path
 *   (o variable de entorno SOFIA_ORG_PATH como fallback)
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);

function getArg(name) {
  const eq  = args.find(a => a.startsWith('--' + name + '='));
  if (eq) return eq.split('=')[1];
  const idx = args.indexOf('--' + name);
  return idx !== -1 ? args[idx + 1] : null;
}

const gate = getArg('gate') || 'unknown';
const step = getArg('step') || '?';
const now  = new Date().toISOString();
const LOG  = path.join(ROOT, '.sofia/sofia.log');

// ── Leer configuración del proyecto ─────────────────────────────────────────
function readConfig() {
  const cfgPath = path.join(ROOT, '.sofia', 'sofia-config.json');
  const sesPath = path.join(ROOT, '.sofia', 'session.json');
  let project = 'proyecto', client = 'cliente', maConfig = {}, sofiaOrgPath = null;

  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      project      = cfg.project      || project;
      client       = cfg.client       || client;
      maConfig     = cfg.ma_baseline  || {};
      // SOFIA_ORG_PATH: env var > sofia-config.json > null (usa fallback local en gen-ma-baseline.js)
      sofiaOrgPath = process.env.SOFIA_ORG_PATH || maConfig.sofia_org_path || null;
    } catch (e) {}
  } else if (fs.existsSync(sesPath)) {
    try {
      const ses = JSON.parse(fs.readFileSync(sesPath, 'utf8'));
      project = ses.project || project;
      client  = ses.client  || client;
    } catch (e) {}
  }
  return { project, client, maConfig, sofiaOrgPath };
}

const { project, client, maConfig, sofiaOrgPath } = readConfig();
const FA_DOC_NAME = `FA-${project}-${client}.docx`;

console.log(`[gate-hook] Gate:${gate} · Step:${step} · ${project} · ${now.slice(0, 16)}`);

function appendLog(msg) {
  try { fs.appendFileSync(LOG, `[${now}] ${msg}\n`, 'utf8'); } catch (_) {}
}

function run(label, cmd, env) {
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: env || process.env });
    console.log(`[gate-hook] OK ${label}`);
    return true;
  } catch (e) {
    console.error(`[gate-hook] ERROR ${label}: ${e.message}`);
    return false;
  }
}

// ── Detección de step 9 (cierre de sprint) ───────────────────────────────────
const IS_STEP9 = step === '9' || gate === 'G-9';
const IS_FA    = ['8b', '8B', 'G-8b', 'G-8B', '9'].includes(step) ||
                 ['8b', '8B', 'G-8b', 'G-8B', '9'].includes(gate);

// ═══════════════════════════════════════════════════════════════════════════
// PASO 1 — MA Process Baseline (SOLO Step 9 / G-9)
//          Debe ejecutarse ANTES del dashboard para que éste pueda leer
//          ma-baseline.json si se añade la pestaña MA en el futuro.
// ═══════════════════════════════════════════════════════════════════════════
if (IS_STEP9 && maConfig.enabled !== false) {
  const maScript = path.join(ROOT, '.sofia/scripts/gen-ma-baseline.js');

  if (fs.existsSync(maScript)) {
    console.log(`[gate-hook] Ejecutando MA Baseline (Step 9)...`);
    const maEnv = Object.assign({}, process.env);
    if (sofiaOrgPath) {
      maEnv.SOFIA_ORG_PATH = sofiaOrgPath;
      console.log(`[gate-hook] SOFIA_ORG_PATH → ${sofiaOrgPath}`);
    }

    const ok = run(
      `MA Baseline generado → .sofia/ma-baseline.json`,
      `node ${maScript}`,
      maEnv
    );

    appendLog(ok
      ? `MA-BASELINE gate:${gate} step:${step} org_path:${sofiaOrgPath || 'local'} status:OK`
      : `MA-BASELINE gate:${gate} step:${step} status:ERROR`
    );
  } else {
    console.warn(`[gate-hook] WARN: gen-ma-baseline.js no encontrado — skipping MA Baseline`);
    console.warn(`[gate-hook]       Ruta esperada: ${maScript}`);
    appendLog(`MA-BASELINE gate:${gate} step:${step} status:SKIPPED script_not_found`);
  }
  console.log('');
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 2 — Dashboard global (TODOS los gates — GR-011)
// ═══════════════════════════════════════════════════════════════════════════
const dashScript = path.join(ROOT, '.sofia/scripts/gen-global-dashboard.js');
const dashCmd    = `node ${dashScript} --gate ${gate} --step ${step}`;

const dashOk = run(`Dashboard regenerado — gate ${gate}`, dashCmd);

if (dashOk) {
  appendLog(`DASHBOARD-REGEN gate:${gate} step:${step} project:${project} trigger:gate-approval GR-011`);
} else {
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// PASO 3 — FA DOCX (Step 8b / 9 — LA-020-08)
// ═══════════════════════════════════════════════════════════════════════════
if (IS_FA) {
  const faScript = path.join(ROOT, '.sofia/scripts/gen-fa-document.py');

  if (fs.existsSync(faScript)) {
    console.log(`\n[gate-hook] Regenerando ${FA_DOC_NAME} (Step ${step})...`);
    const faOk = run(`FA docx regenerado → ${FA_DOC_NAME}`, `python3 ${faScript}`);
    appendLog(faOk
      ? `FA-DOCX-REGEN gate:${gate} step:${step} doc:${FA_DOC_NAME} trigger:gate-approval LA-020-08`
      : `FA-DOCX-REGEN gate:${gate} step:${step} status:ERROR`
    );
  } else {
    console.warn(`[gate-hook] WARN: gen-fa-document.py no encontrado en ${faScript}`);
  }
}

console.log(`\n[gate-hook] Secuencia completada · Gate ${gate} · ${now.slice(0, 16)}`);
