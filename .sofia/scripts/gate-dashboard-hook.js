#!/usr/bin/env node
/**
 * gate-dashboard-hook.js — SOFIA v2.6 (GENERICO)
 * Se ejecuta automaticamente tras cada aprobacion de Gate.
 * 1. Regenera el dashboard global (LA-020-07 / GR-011)
 * 2. En Step 8b: regenera FA-{proyecto}-{cliente}.docx (LA-020-08)
 *
 * Lee proyecto/cliente desde sofia-config.json -- sin hardcoding.
 *
 * Uso:
 *   node .sofia/scripts/gate-dashboard-hook.js --gate G-3 --step 3
 *   node .sofia/scripts/gate-dashboard-hook.js --gate G-8b --step 8b
 */

'use strict';
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT  = path.resolve(__dirname, '../..');
const args  = process.argv.slice(2);

function getArg(name) {
  const eq  = args.find(a => a.startsWith('--'+name+'='));
  if (eq) return eq.split('=')[1];
  const idx = args.indexOf('--'+name);
  return idx !== -1 ? args[idx+1] : null;
}

const gate = getArg('gate') || 'unknown';
const step = getArg('step') || '?';
const now  = new Date().toISOString();

// Leer proyecto desde sofia-config.json o session.json (LA-CORE-003)
function readProjectInfo() {
  const cfgPath = path.join(ROOT, '.sofia', 'sofia-config.json');
  const sesPath = path.join(ROOT, '.sofia', 'session.json');
  let project = 'proyecto', client = 'cliente';
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath,'utf8'));
      project = cfg.project || project;
      client  = cfg.client  || client;
    } catch(e) {}
  } else if (fs.existsSync(sesPath)) {
    try {
      const ses = JSON.parse(fs.readFileSync(sesPath,'utf8'));
      project = ses.project || project;
      client  = ses.client  || client;
    } catch(e) {}
  }
  return { project, client };
}

const { project, client } = readProjectInfo();
const FA_DOC_NAME = `FA-${project}-${client}.docx`;

console.log(`[gate-dashboard-hook] Gate:${gate} · Step:${step} · ${project}/${client} · ${now.slice(0,16)}`);

// ── 1. Dashboard (todos los gates — GR-011) ──────────────────────────────────
try {
  const cmd = `node ${path.join(ROOT, '.sofia/scripts/gen-global-dashboard.js')} --gate ${gate} --step ${step}`;
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
  fs.appendFileSync(path.join(ROOT, '.sofia/sofia.log'),
    `[${now}] DASHBOARD-REGEN gate:${gate} step:${step} project:${project} trigger:gate-approval\n`, 'utf8');
  console.log(`[gate-dashboard-hook] OK Dashboard regenerado — gate ${gate}`);
} catch(e) {
  console.error(`[gate-dashboard-hook] ERROR dashboard: ${e.message}`);
  process.exit(1);
}

// ── 2. FA docx (Step 8b — LA-020-08) ─────────────────────────────────────────
const FA_STEPS = ['8b', '8B', 'G-8b', 'G-8B', '9'];
const shouldRegenFA = FA_STEPS.includes(step) || FA_STEPS.includes(gate);

if (shouldRegenFA) {
  const faScript = path.join(ROOT, '.sofia/scripts/gen-fa-document.py');
  if (fs.existsSync(faScript)) {
    console.log(`[gate-dashboard-hook] Regenerando ${FA_DOC_NAME} (Step ${step})...`);
    try {
      execSync(`python3 ${faScript}`, { cwd: ROOT, stdio: 'inherit' });
      fs.appendFileSync(path.join(ROOT, '.sofia/sofia.log'),
        `[${now}] FA-DOCX-REGEN gate:${gate} step:${step} doc:${FA_DOC_NAME} trigger:gate-approval LA-020-08\n`, 'utf8');
      console.log(`[gate-dashboard-hook] OK FA docx regenerado → ${FA_DOC_NAME}`);
    } catch(e) {
      console.error(`[gate-dashboard-hook] ERROR FA docx: ${e.message}`);
    }
  } else {
    console.warn(`[gate-dashboard-hook] WARN: gen-fa-document.py no encontrado en ${faScript}`);
  }
}
