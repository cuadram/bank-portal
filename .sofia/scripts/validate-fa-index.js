/**
 * validate-fa-index.js — Validador de integridad de fa-index.json
 * SOFIA v2.4 — LA-021-01 + LA-025-01
 * FIX LA-025-01: current_feature leída desde session.json (no idx.last_feat)
 * 
 * Ejecutar en Gate 2b, Gate 3b y Gate 8b como paso OBLIGATORIO y BLOQUEANTE.
 * Salida: 0 = OK, 1 = ERRORES encontrados (bloquea el gate)
 * 
 * Uso: node .sofia/scripts/validate-fa-index.js
 */

const fs = require('fs');
const path = require('path');

const FA_INDEX_PATH = 'docs/functional-analysis/fa-index.json';
const LOG_PATH = '.sofia/sofia.log';

function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [FA-VALIDATE] ${msg}\n`;
  fs.appendFileSync(LOG_PATH, line);
  console.log(line.trim());
}

function fail(msg) {
  log(`ERROR: ${msg}`);
}

function ok(msg) {
  log(`OK: ${msg}`);
}

// ─── Carga del índice ────────────────────────────────────────────────────────
let idx;
try {
  idx = JSON.parse(fs.readFileSync(FA_INDEX_PATH, 'utf8'));
} catch (e) {
  fail(`No se puede leer ${FA_INDEX_PATH}: ${e.message}`);
  process.exit(1);
}

let errors = 0;

// ─── CHECK 1: total_functionalities == len(functionalities) ─────────────────
// LA-FA-001 (S21: extendida — también aplica a business_rules)
const realFuncs = idx.functionalities ? idx.functionalities.length : 0;
if (idx.total_functionalities !== realFuncs) {
  fail(`total_functionalities declarado (${idx.total_functionalities}) != real (${realFuncs}). CORRIGIENDO automáticamente.`);
  idx.total_functionalities = realFuncs;
  errors++;
} else {
  ok(`total_functionalities: ${realFuncs} ✓`);
}

// ─── CHECK 2: total_business_rules == len(business_rules) ───────────────────
// LA-021-01 (nuevo — S21)
const realRules = idx.business_rules ? idx.business_rules.length : 0;
if (idx.total_business_rules !== realRules) {
  fail(`total_business_rules declarado (${idx.total_business_rules}) != real (${realRules}). CORRIGIENDO automáticamente.`);
  idx.total_business_rules = realRules;
  errors++;
} else {
  ok(`total_business_rules: ${realRules} ✓`);
}

// ─── CHECK 3: cada funcionalidad tiene business_rules array no vacío ─────────
const funcsWithoutRules = idx.functionalities.filter(f =>
  !f.business_rules || f.business_rules.length === 0
);
if (funcsWithoutRules.length > 0) {
  const ids = funcsWithoutRules.map(f => f.id).join(', ');
  fail(`Funcionalidades sin business_rules: ${ids}`);
  errors++;
} else {
  ok(`Todas las funcionalidades tienen business_rules ✓`);
}

// ─── CHECK 4: IDs de business_rules referenciadas existen en el array ────────
const ruleIds = new Set(idx.business_rules.map(r => r.id));
let orphanRefs = 0;
idx.functionalities.forEach(f => {
  (f.business_rules || []).forEach(rId => {
    if (!ruleIds.has(rId)) {
      fail(`Funcionalidad ${f.id} referencia RN inexistente: ${rId}`);
      orphanRefs++;
    }
  });
});
if (orphanRefs === 0) {
  ok(`Todas las referencias RN-XXX apuntan a reglas existentes ✓`);
} else {
  errors++;
}

// ─── CHECK 5: no hay IDs duplicados en functionalities ───────────────────────
const funcIds = idx.functionalities.map(f => f.id);
const dupFuncs = funcIds.filter((id, i) => funcIds.indexOf(id) !== i);
if (dupFuncs.length > 0) {
  fail(`IDs de funcionalidad duplicados: ${dupFuncs.join(', ')}`);
  errors++;
} else {
  ok(`Sin IDs de funcionalidad duplicados ✓`);
}

// ─── CHECK 6: no hay IDs duplicados en business_rules ────────────────────────
const rnIds = idx.business_rules.map(r => r.id);
const dupRules = rnIds.filter((id, i) => rnIds.indexOf(id) !== i);
if (dupRules.length > 0) {
  fail(`IDs de business_rule duplicados: ${dupRules.join(', ')}`);
  errors++;
} else {
  ok(`Sin IDs de business_rule duplicados ✓`);
}

// ─── CHECK 7: last_sprint y last_feat coherentes con datos ──────────────────
const maxSprint = Math.max(...idx.functionalities.map(f => {
  const s = parseInt(String(f.sprint).split('-')[0], 10);
  return isNaN(s) ? 0 : s;
}));
if (parseInt(idx.last_sprint, 10) !== maxSprint) {
  fail(`last_sprint (${idx.last_sprint}) no coincide con el máximo sprint en functionalities (${maxSprint})`);
  errors++;
} else {
  ok(`last_sprint: ${idx.last_sprint} coincide con datos ✓`);
}

// ─── CHECK 8: reglas de FEAT actual presentes ────────────────────────────────
// FIX LA-025-01: leer current_feature desde session.json, no desde idx.last_feat
// idx.last_feat puede no estar actualizado; session.json es la fuente de verdad
let activeFeat = idx.last_feat; // fallback
try {
  const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
  if (session.current_feature) activeFeat = session.current_feature;
} catch(e) { /* usar fallback */ }
if (activeFeat) {
  const currentFeat = activeFeat;
  const currentFuncs = idx.functionalities.filter(f => f.feat === currentFeat);
  const currentFuncRuleIds = new Set(currentFuncs.flatMap(f => f.business_rules || []));
  const presentRuleIds = new Set(rnIds);
  const missingRules = [...currentFuncRuleIds].filter(id => !presentRuleIds.has(id));
  if (missingRules.length > 0) {
    fail(`${currentFeat}: ${missingRules.length} RN referenciadas pero no definidas en business_rules: ${missingRules.slice(0, 5).join(', ')}${missingRules.length > 5 ? '...' : ''}`);
    errors++;
  } else {
    ok(`${currentFeat}: todas las RN referenciadas están definidas ✓`);
  }
}

// ─── Persistir correcciones automáticas ─────────────────────────────────────
idx.updated_at = new Date().toISOString();
fs.writeFileSync(FA_INDEX_PATH, JSON.stringify(idx, null, 2));

// ─── Resultado final ─────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
if (errors === 0) {
  console.log(`✅ FA-INDEX VALID — ${realFuncs} funcionalidades, ${realRules} reglas de negocio`);
  log(`PASS — ${realFuncs} funcionalidades, ${realRules} reglas | sprint ${idx.last_sprint} | ${idx.last_feat}`);
  process.exit(0);
} else {
  console.log(`❌ FA-INDEX ERRORS: ${errors} problemas detectados — revisar sofia.log`);
  log(`FAIL — ${errors} errores detectados`);
  process.exit(1);
}
