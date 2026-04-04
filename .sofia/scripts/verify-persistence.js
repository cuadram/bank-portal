#!/usr/bin/env node
/**
 * verify-persistence.js — SOFIA v2.6 — GR-PERSIST
 * Verifica que todos los artefactos declarados en session.json existen en disco.
 * BLOQUEANTE: si un artefacto no existe en disco el pipeline no puede avanzar.
 *
 * Uso:
 *   node .sofia/scripts/verify-persistence.js              ← verifica step actual
 *   node .sofia/scripts/verify-persistence.js --step 4     ← verifica step especifico
 *   node .sofia/scripts/verify-persistence.js --all        ← verifica todos los steps
 *   node .sofia/scripts/verify-persistence.js --step 4 --fix  ← lista lo que falta con rutas
 *
 * Exit codes:
 *   0 = OK — todos los artefactos verificados en disco
 *   1 = BLOQUEANTE — artefactos declarados no existen en disco
 *   2 = ERROR — session.json no legible o SOFIA_REPO incoherente
 *
 * Registra resultado en .sofia/sofia.log
 * LA-CORE-005: persistencia verificada en disco antes de avanzar al siguiente step
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// -- Rutas dinamicas (LA-CORE-003) ------------------------------------------
const SCRIPT_DIR = path.dirname(path.resolve(__filename || __filename));
const ROOT       = path.resolve(SCRIPT_DIR, '..', '..');
const SESSION    = path.join(ROOT, '.sofia', 'session.json');
const CONFIG     = path.join(ROOT, '.sofia', 'sofia-config.json');
const LOG        = path.join(ROOT, '.sofia', 'sofia.log');

// -- Args -------------------------------------------------------------------
const args    = process.argv.slice(2);
const stepArg = args[args.indexOf('--step') + 1] || null;
const checkAll = args.includes('--all');
const fixMode  = args.includes('--fix');
const now      = new Date().toISOString();

// -- Colores consola --------------------------------------------------------
const R = '\x1b[0m'; const RED = '\x1b[31m'; const GRN = '\x1b[32m';
const YEL = '\x1b[33m'; const CYN = '\x1b[36m'; const BLD = '\x1b[1m';

// -- Cargar estado ----------------------------------------------------------
if (!fs.existsSync(SESSION)) {
  console.error(RED + 'ERROR: session.json no encontrado en ' + SESSION + R);
  process.exit(2);
}

let S, C = {}, BASELINE = { step_overrides: {} };
try {
  S = JSON.parse(fs.readFileSync(SESSION, 'utf8'));
  if (fs.existsSync(CONFIG)) C = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
  // Leer baseline de proyecto si existe (rutas especificas del proyecto)
  const baselinePath = path.join(ROOT, '.sofia', 'persistence-baseline.json');
  if (fs.existsSync(baselinePath)) {
    BASELINE = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    console.log(' Baseline: ' + baselinePath + ' cargado (' + Object.keys(BASELINE.step_overrides || {}).length + ' overrides)');
  }
} catch(e) {
  console.error(RED + 'ERROR: No se puede parsear session.json: ' + e.message + R);
  process.exit(2);
}

// -- Verificar GR-CORE-003: SOFIA_REPO coherente ---------------------------
const SESSION_REPO = S.sofia_repo;
const CONFIG_REPO  = C.sofia_repo;
const REAL_ROOT    = ROOT;

if (SESSION_REPO && SESSION_REPO !== REAL_ROOT) {
  console.error(RED + BLD + 'ERROR GR-CORE-003: SOFIA_REPO INCOHERENTE' + R);
  console.error('  session.json.sofia_repo: ' + SESSION_REPO);
  console.error('  Script ROOT:             ' + REAL_ROOT);
  console.error('  Resolver antes de continuar.');
  process.exit(2);
}

// -- Determinar steps a verificar ------------------------------------------
const completedSteps = S.completed_steps || [];
const currentStep    = stepArg || S.current_step || null;
const stepsToCheck   = checkAll ? completedSteps : (currentStep ? [String(currentStep)] : completedSteps.slice(-1));

const PROJECT  = S.project || C.project || 'proyecto';
const CLIENT   = S.client  || C.client  || 'cliente';
const SPRINT   = S.current_sprint || 1;
const FEATURE  = S.current_feature || 'FEAT-001';

console.log('\n' + BLD + '='.repeat(64) + R);
console.log(BLD + ' GR-PERSIST — Verificacion de persistencia en disco' + R);
console.log(BLD + '='.repeat(64) + R);
console.log(' Proyecto: ' + CYN + PROJECT + '/' + CLIENT + R);
console.log(' SOFIA_REPO: ' + ROOT);
console.log(' Sprint: ' + SPRINT + ' | Feature: ' + FEATURE);
console.log(' Steps a verificar: [' + stepsToCheck.join(', ') + ']');
console.log('');

// -- Artefactos ESPERADOS por step (estructura canonica BankPortal S22) ----
// Cada step tiene una lista de rutas relativas que DEBEN existir en disco.
// Los artefactos de documentacion script-generados (DOCX/XLSX) se verifican
// como directorio, los markdown como fichero individual.

function buildExpected(step, sprint, feature, proj, client) {
  const s  = String(sprint).padStart(3, '0');
  const N  = sprint;
  const F  = feature;        // FEAT-001
  const P  = proj;
  const CL = client;

  const EXPECTED = {
    '1': [
      `docs/sprints/SPRINT-${s}-planning.md`,
    ],
    '2': [
      `docs/requirements/SRS-${F}-sprint${N}.md`,
    ],
    '2b': [
      `docs/functional-analysis/FA-${F}-sprint${N}-draft.md`,
      `docs/functional-analysis/fa-index.json`,
    ],
    '2c': [
      `docs/ux-ui/UX-${F}-sprint${N}.md`,
    ],
    '3': [
      `docs/architecture/HLD-${F}-sprint${N}.md`,
    ],
    '3b': [
      `docs/architecture/HLD-${F}-sprint${N}.md`,   // debe existir del step 3
      `docs/functional-analysis/fa-index.json`,
    ],
    '4': [
      // Codigo fuente: al menos un fichero en src/
      `src/`,
    ],
    '4b': [
      `src/`,                                         // build paso sin fichero especifico
    ],
    '5': [
      `docs/code-review/CR-${F}-sprint${N}.md`,
    ],
    '5b': [
      `docs/security/SEC-${F}-sprint${N}.md`,
    ],
    '6': [
      `docs/qa/QA-${F}-Sprint${N}.md`,
    ],
    '7': [
      `docs/releases/RELEASE-NOTES-v${N}.0.0.md`,
      `docs/runbooks/RUNBOOK-v${N}.0.0.md`,
      `infra/`,
    ],
    '8': [
      `docs/deliverables/sprint-${N}-${F}/word/`,    // directorio con 17 DOCX
      `docs/deliverables/sprint-${N}-${F}/excel/`,   // directorio con 3 XLSX
    ],
    '8b': [
      `docs/functional-analysis/FA-${F}-sprint${N}.md`,
      `docs/functional-analysis/FA-${P}-${CL}.docx`,
      `docs/functional-analysis/fa-index.json`,
    ],
    '9': [
      `docs/sprints/SPRINT-${s}-report.md`,
      `docs/sprints/SPRINT-${s}-retrospectiva.md`,
      `docs/sprints/SPRINT-${s}-data.json`,
      `docs/dashboard/`,
      `LESSONS_LEARNED.md`,
    ],
  };
  return EXPECTED[step] || [];
}

// -- Verificar artefactos --------------------------------------------------
let totalOk = 0;
let totalMissing = 0;
const missing = [];

for (const step of stepsToCheck) {
  // Usar override de baseline si existe para este step
  const baselineOverride = BASELINE.step_overrides && BASELINE.step_overrides[step];
  const expected = baselineOverride ? baselineOverride.paths : buildExpected(step, SPRINT, FEATURE, PROJECT, CLIENT);
  if (expected.length === 0) continue;

  let stepOk = 0, stepMiss = 0;
  const stepMissing = [];

  for (const relPath of expected) {
    const fullPath  = path.join(ROOT, relPath);
    const isDir     = relPath.endsWith('/');

    let exists = false;
    if (isDir) {
      // Para directorios: verificar que existe Y tiene al menos 1 fichero
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        const files = fs.readdirSync(fullPath).filter(f => !f.startsWith('.'));
        exists = files.length > 0;
        if (!exists) {
          stepMissing.push({ path: relPath, reason: 'directorio vacio' });
        }
      } else {
        stepMissing.push({ path: relPath, reason: 'directorio no existe' });
      }
    } else {
      exists = fs.existsSync(fullPath);
      if (!exists) {
        stepMissing.push({ path: relPath, reason: 'fichero no existe' });
      } else {
        // Verificar que no esta vacio
        const size = fs.statSync(fullPath).size;
        if (size === 0) {
          exists = false;
          stepMissing.push({ path: relPath, reason: 'fichero vacio (0 bytes)' });
        }
      }
    }

    if (exists) stepOk++;
    else stepMiss++;
  }

  if (stepMiss === 0) {
    console.log(GRN + '  OK   Step ' + step + ': ' + stepOk + '/' + expected.length + ' artefactos en disco' + R);
  } else {
    console.log(RED + BLD + '  MISS Step ' + step + ': ' + stepMiss + ' artefactos FALTAN en disco' + R);
    stepMissing.forEach(m => {
      console.log('       ' + RED + '- ' + m.path + R + ' (' + m.reason + ')');
      if (fixMode) {
        console.log('         ' + YEL + 'Fix: persistir este artefacto via MCP filesystem:write_file antes de continuar' + R);
      }
      missing.push({ step, ...m });
    });
  }

  totalOk   += stepOk;
  totalMissing += stepMiss;
}

// -- Verificacion adicional: session.json declare vs realidad -------------
console.log('');
const sessionArtifacts = S.artifacts || {};
let sessionMissing = 0;
if (Object.keys(sessionArtifacts).length > 0) {
  console.log(' Verificando artefactos declarados en session.json...');
  for (const [step, arts] of Object.entries(sessionArtifacts)) {
    if (!stepsToCheck.includes(step) && !checkAll) continue;
    const paths = Array.isArray(arts) ? arts : [arts];
    for (const art of paths) {
      if (typeof art !== 'string') continue;
      // Solo verificar si parece una ruta de fichero (empieza por docs/ src/ infra/)
      if (!art.match(/^(docs|src|infra|LESSONS_LEARNED)/)) continue;
      const fullPath = path.join(ROOT, art);
      if (!fs.existsSync(fullPath)) {
        sessionMissing++;
        if (sessionMissing <= 10) { // limitar output
          console.log(YEL + '  WARN Step ' + step + ': declarado en session pero no en disco: ' + art + R);
        }
      }
    }
  }
  if (sessionMissing === 0) {
    console.log(GRN + '  OK   Artefactos session.json coherentes con disco' + R);
  } else if (sessionMissing > 10) {
    console.log(YEL + '  WARN ' + sessionMissing + ' artefactos en session.json no encontrados en disco' + R);
  }
}

// -- Resultado final -------------------------------------------------------
console.log('');
console.log('='.repeat(64));
console.log(BLD + ' RESULTADO GR-PERSIST' + R);
console.log(' OK en disco:   ' + GRN + totalOk + R);
console.log(' FALTAN:        ' + (totalMissing > 0 ? RED + BLD : GRN) + totalMissing + R);
if (sessionMissing > 0) {
  console.log(' Session/disco: ' + YEL + sessionMissing + ' incoherencias' + R);
}

// -- Log -------------------------------------------------------------------
const logEntry = `[${now}] [GR-PERSIST] steps:[${stepsToCheck.join(',')}] ok:${totalOk} missing:${totalMissing} session_incoherent:${sessionMissing} project:${PROJECT}\n`;
try { fs.appendFileSync(LOG, logEntry, 'utf8'); } catch(e) {}

// -- Exit ------------------------------------------------------------------
if (totalMissing > 0) {
  console.log('');
  console.log(RED + BLD + ' PIPELINE BLOQUEADO — Persistir artefactos faltantes antes de avanzar' + R);
  console.log(YEL + ' Como resolver:' + R);
  console.log('   1. Identificar que agente debio generar cada artefacto faltante');
  console.log('   2. Volver a ejecutar ese step con MCP filesystem operativo');
  console.log('   3. Verificar que el MCP tiene acceso a SOFIA_REPO=' + ROOT);
  console.log('   4. Re-ejecutar: node .sofia/scripts/verify-persistence.js --step <N>');
  console.log('');
  process.exit(1);
} else {
  console.log(GRN + BLD + ' Persistencia verificada — pipeline puede continuar' + R);
  console.log('');
  process.exit(0);
}
