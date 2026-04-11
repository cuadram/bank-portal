#!/usr/bin/env node
/**
 * la-promote.js — Canal de promoción LA proyecto → SOFIA-CORE
 * SOFIA v2.7+ | Step 9b — LA Promotion Gate
 *
 * Uso:
 *   node la-promote.js --sprint 23              # evalúa candidatas del sprint
 *   node la-promote.js --sprint 23 --all        # incluye LAs de todos los sprints no promovidas
 *   node la-promote.js --list                   # lista candidatas pendientes de PO
 *   node la-promote.js --status                 # resumen de estado de promociones
 *
 * Outputs:
 *   .sofia/la-promotion-request-S{N}.json       # candidatas para revisión PO
 *   .sofia/la-promotion-log.json                # historial de decisiones
 *
 * El PO revisa el fichero generado y aprueba via:
 *   python3 {SOFIA_CORE}/scripts/sofia-contribute.py --accept LA-XXX
 *   python3 {SOFIA_CORE}/scripts/sofia-contribute.py --reject LA-XXX
 */

'use strict';
const fs   = require('fs');
const path = require('path');

// ── Configuración ──────────────────────────────────────────────────────────
const SOFIA_CORE = '/Users/cuadram/Library/CloudStorage/OneDrive-Personal/WIP/SOFIA-CORE';
const PROJECT_ROOT = process.cwd();
const SOFIA_DIR    = path.join(PROJECT_ROOT, '.sofia');
const SESSION_PATH = path.join(SOFIA_DIR, 'session.json');
const LOG_PATH     = path.join(SOFIA_DIR, 'la-promotion-log.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { sprint: null, all: false, list: false, status: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sprint')  result.sprint = parseInt(args[i + 1], 10);
    if (args[i] === '--all')     result.all    = true;
    if (args[i] === '--list')    result.list   = true;
    if (args[i] === '--status')  result.status = true;
  }
  return result;
}

function loadSession() {
  if (!fs.existsSync(SESSION_PATH)) {
    console.error(`ERROR: session.json no encontrado en ${SESSION_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
}

function loadLog() {
  if (!fs.existsSync(LOG_PATH)) return { decisions: [], last_updated: null };
  return JSON.parse(fs.readFileSync(LOG_PATH, 'utf8'));
}

function loadManifest() {
  const mp = path.join(SOFIA_CORE, 'MANIFEST.json');
  if (!fs.existsSync(mp)) return { la_core_index: {} };
  return JSON.parse(fs.readFileSync(mp, 'utf8'));
}

// ── Criterios de promoción automática ─────────────────────────────────────
// Una LA es candidata si cumple ≥1 criterio
const PROMO_CRITERIA = [
  { id: 'REGLA_PERMANENTE', label: 'Corrección marcada como REGLA PERMANENTE', weight: 3,
    fn: (la) => typeof la.correction === 'string' && la.correction.includes('REGLA PERMANENTE') },
  { id: 'SCOPE_CORE', label: 'Scope explícito SOFIA-CORE', weight: 4,
    fn: (la) => la.scope === 'SOFIA-CORE' },
  { id: 'TYPE_GOVERNANCE', label: 'Tipo governance o architecture o security', weight: 3,
    fn: (la) => ['governance', 'architecture', 'security'].includes(la.type) },
  { id: 'BLOCKER_GATE', label: 'Fue causa de bloqueo de gate', weight: 3,
    fn: (la) => typeof la.description === 'string' && /bloque|gate|blocker|BLOQUEANTE/i.test(la.description) },
  { id: 'MULTI_SKILL', label: 'Afecta a múltiples agentes del pipeline', weight: 2,
    fn: (la) => typeof la.correction === 'string' && la.correction.length > 200 },
  { id: 'CORE_ID', label: 'ID prefijado LA-CORE-*', weight: 4,
    fn: (la) => /^LA-CORE-/i.test(la.id || '') },
];

function evaluateCandidate(la) {
  const matched = [];
  let score = 0;
  for (const c of PROMO_CRITERIA) {
    if (c.fn(la)) { matched.push(c.id); score += c.weight; }
  }
  const isCandidate = matched.length > 0;
  const impact = score >= 6 ? 'CRITICAL' : score >= 4 ? 'HIGH' : score >= 2 ? 'MEDIUM' : 'LOW';
  return { isCandidate, score, impact, matched_criteria: matched };
}

function wasAlreadyPromoted(laId, log, manifest) {
  // Revisar log local
  if (log.decisions.some(d => d.la_id === laId && d.decision === 'ACCEPTED')) return true;
  // Revisar MANIFEST.json de SOFIA-CORE
  if (manifest.la_core_index && manifest.la_core_index[laId]) return true;
  return false;
}

// ── Comando: evaluar candidatas de un sprint ───────────────────────────────
function cmdEvaluate(opts) {
  const session  = loadSession();
  const log      = loadLog();
  const manifest = loadManifest();

  const sprint   = opts.sprint || session.current_sprint;
  const allLAs   = session.lessons_learned || [];

  // Filtrar LAs del sprint (o todas si --all)
  const scope = opts.all
    ? allLAs
    : allLAs.filter(la => la.sprint === sprint || la.sprint === String(sprint));

  if (scope.length === 0) {
    console.log(`ℹ  No hay LAs registradas para Sprint ${sprint} en session.json`);
    return;
  }

  const candidates = [];
  const skipped    = [];

  for (const la of scope) {
    if (wasAlreadyPromoted(la.id, log, manifest)) {
      skipped.push({ id: la.id, reason: 'ya promovida o en MANIFEST' });
      continue;
    }
    const eval_ = evaluateCandidate(la);
    if (eval_.isCandidate) {
      candidates.push({ ...la, _promotion: eval_ });
    }
  }

  // Generar fichero de solicitud
  const req = {
    schema_version: '1.0',
    sprint,
    project: session.project || path.basename(PROJECT_ROOT),
    client:  session.client  || '',
    generated_at: new Date().toISOString(),
    po_review_required: true,
    po_reviewer: 'Angel de la Cuadra (Product Owner)',
    status: 'PENDING_PO_REVIEW',
    sofia_core_path: SOFIA_CORE,
    candidates: candidates.map(la => ({
      id:          la.id,
      type:        la.type,
      description: la.description,
      correction:  la.correction,
      registered_at: la.registered_at || null,
      scope:       la.scope || 'project',
      impact:      la._promotion.impact,
      score:       la._promotion.score,
      matched_criteria: la._promotion.matched_criteria,
      promotion_status: 'pending_po_approval',
      po_decision:  null,
      po_notes:     null,
      po_decided_at: null,
    })),
    skipped,
    stats: {
      total_las_sprint: scope.length,
      candidates_count: candidates.length,
      skipped_count:    skipped.length,
    },
  };

  const outPath = path.join(SOFIA_DIR, `la-promotion-request-S${sprint}.json`);
  fs.writeFileSync(outPath, JSON.stringify(req, null, 2));

  // ── Output para PO ────────────────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        SOFIA-CORE · LA Promotion Gate — Step 9b               ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Sprint:    ${sprint}   |   Proyecto: ${req.project}`);
  console.log(`  Candidatas: ${candidates.length}   |   Ya promovidas/saltadas: ${skipped.length}`);
  console.log(`  Fichero:   .sofia/la-promotion-request-S${sprint}.json`);
  console.log('');

  if (candidates.length === 0) {
    console.log('  ✅ No hay candidatas nuevas para promoción en este sprint.');
    console.log('');
    return;
  }

  console.log('  ┌─ CANDIDATAS PARA REVISIÓN PO ───────────────────────────────────');
  for (const c of req.candidates) {
    const badge = c.impact === 'CRITICAL' ? '🔴' : c.impact === 'HIGH' ? '🟠' : '🟡';
    console.log(`  │`);
    console.log(`  │  ${badge} [${c.impact}] ${c.id}  (score: ${c.score})`);
    console.log(`  │     Tipo: ${c.type}   |   Criterios: ${c.matched_criteria.join(', ')}`);
    console.log(`  │     Descripción: ${c.description.substring(0, 100)}${c.description.length > 100 ? '...' : ''}`);
    console.log(`  │     Corrección: ${c.correction.substring(0, 100)}${c.correction.length > 100 ? '...' : ''}`);
  }
  console.log('  └─────────────────────────────────────────────────────────────────');
  console.log('');
  console.log('  ⚠️  GATE LA-PROMO: Se requiere decisión explícita del Product Owner.');
  console.log('');
  console.log('  Para cada LA, el PO debe ejecutar UNO de los siguientes comandos:');
  console.log('');
  for (const c of req.candidates) {
    console.log(`    APROBAR:  python3 ${SOFIA_CORE}/scripts/sofia-contribute.py --project ${PROJECT_ROOT} --accept ${c.id}`);
    console.log(`    RECHAZAR: python3 ${SOFIA_CORE}/scripts/sofia-contribute.py --project ${PROJECT_ROOT} --reject ${c.id}`);
    console.log('');
  }
  console.log('  El gate GR-CORE-028 bloquea G-CLOSE hasta que todas las candidatas');
  console.log('  tengan decisión explícita del PO.');
  console.log('');
}

// ── Comando: listar pendientes ─────────────────────────────────────────────
function cmdList() {
  const session = loadSession();
  const sprint  = session.current_sprint;
  const reqPath = path.join(SOFIA_DIR, `la-promotion-request-S${sprint}.json`);

  if (!fs.existsSync(reqPath)) {
    console.log(`ℹ  No existe solicitud de promoción para Sprint ${sprint}.`);
    console.log(`   Ejecuta: node la-promote.js --sprint ${sprint}`);
    return;
  }

  const req = JSON.parse(fs.readFileSync(reqPath, 'utf8'));
  const pending = req.candidates.filter(c => c.promotion_status === 'pending_po_approval');

  console.log('');
  console.log(`SOFIA-CORE · LA Promotion — Sprint ${sprint} · Estado: ${req.status}`);
  console.log(`Candidatas: ${req.candidates.length} | Pendientes PO: ${pending.length}`);
  console.log('');

  for (const c of req.candidates) {
    const icon = c.promotion_status === 'pending_po_approval' ? '⏳'
               : c.promotion_status === 'approved'  ? '✅'
               : c.promotion_status === 'rejected'  ? '❌' : '❓';
    console.log(`  ${icon} ${c.id} [${c.impact}] — ${c.type}`);
    if (c.po_decision) console.log(`     Decisión: ${c.po_decision} — ${c.po_decided_at}`);
  }
  console.log('');
}

// ── Comando: status global ─────────────────────────────────────────────────
function cmdStatus() {
  const log      = loadLog();
  const manifest = loadManifest();
  console.log('');
  console.log(`SOFIA-CORE · LA Promotion — Historial global`);
  console.log(`LAs en MANIFEST: ${Object.keys(manifest.la_core_index || {}).length}`);
  console.log(`Decisiones PO registradas: ${log.decisions.length}`);
  console.log('');
  const accepted = log.decisions.filter(d => d.decision === 'ACCEPTED');
  const rejected = log.decisions.filter(d => d.decision === 'REJECTED');
  console.log(`  Aceptadas: ${accepted.length} | Rechazadas: ${rejected.length}`);
  if (accepted.length > 0) {
    console.log('');
    console.log('  Promovidas a SOFIA-CORE:');
    for (const d of accepted) {
      console.log(`    ✅ ${d.la_id} — Sprint ${d.source_sprint} — ${d.decided_at}`);
    }
  }
  console.log('');
}

// ── Main ───────────────────────────────────────────────────────────────────
function main() {
  const opts = parseArgs();

  if (opts.list)        return cmdList();
  if (opts.status)      return cmdStatus();
  if (opts.sprint || !opts.list) return cmdEvaluate(opts);

  console.log('Uso: node la-promote.js --sprint N | --list | --status | --all');
}

main();
