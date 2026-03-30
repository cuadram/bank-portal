#!/usr/bin/env node
/**
 * guardrail-pre-gate.js — SOFIA v2.3 · Guardrails v1.1
 * Verificación automática antes de aprobar cualquier gate.
 *
 * Uso:
 *   node .sofia/scripts/guardrail-pre-gate.js --gate G-4b
 *   node .sofia/scripts/guardrail-pre-gate.js --gate G-4b --sprint-only
 *
 * --sprint-only: GR-005 y GR-006 solo evalúan ficheros nuevos del sprint
 *               (git diff --name-only HEAD~1). Para proyectos con deuda pre-existente.
 *
 * GR-001  Paquete raíz Java correcto                        (LA-020-09)
 * GR-001b Todos los .java de src/main usan el paquete raíz (LA-020-09)
 * GR-002  API Surface — métodos usados existen en Transaction (LA-020-09)
 * GR-003  SpringContextIT existe                            (LA-020-11)
 * GR-004  mvn compile EXIT 0                                (LA-020-11)
 * GR-005  @Profile("!production") ausente en ficheros nuevos (LA-019-08)
 * GR-006  @AuthenticationPrincipal ausente en ficheros nuevos (DEBT-022)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO         = process.cwd();
const BACKEND_SRC  = 'apps/backend-2fa/src/main/java';
const BACKEND_TEST = 'apps/backend-2fa/src/test/java';
const ROOT_PKG_FILE = 'apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/twofa/BackendTwoFactorApplication.java';

const args      = process.argv.slice(2);
const gate      = (args.find(a => a.startsWith('--gate=')) || '').replace('--gate=', '')
               || args[args.indexOf('--gate') + 1] || 'UNKNOWN';
const sprintOnly = args.includes('--sprint-only');

// Ficheros en deuda pre-existente conocida — excluidos de GR-005 y GR-006
const BASELINE_FILE = '.sofia/guardrails-baseline.json';
let baseline = { gr005_whitelist: [], gr006_whitelist: [] };
try {
  baseline = JSON.parse(fs.readFileSync(path.join(REPO, BASELINE_FILE), 'utf8'));
} catch (_) { /* no baseline file — aplicar a todos */ }

let passed = 0;
let failed = 0;
const errors = [];

function ok(label)         { console.log(`  ✅ ${label}`); passed++; }
function fail(label, detail) {
  console.error(`  ❌ BLOQUEANTE — ${label}`);
  if (detail) console.error(`     → ${detail}`);
  failed++;
  errors.push({ label, detail });
}
function warn(label, detail) {
  console.warn(`  ⚠️  MAYOR — ${label}`);
  if (detail) console.warn(`     → ${detail}`);
}
function info(label)       { console.log(`  ℹ️  ${label}`); }

function run(cmd) {
  try { return execSync(cmd, { cwd: REPO, encoding: 'utf8', stdio: 'pipe' }); }
  catch (e) { return null; }
}

function javaFiles(dir) {
  const out = [];
  if (!fs.existsSync(path.join(REPO, dir))) return out;
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.java')) out.push(full);
    }
  }
  walk(path.join(REPO, dir));
  return out;
}

/** Ficheros nuevos o modificados en el sprint (git diff HEAD~1 o HEAD) */
function sprintFiles() {
  const raw = run('git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD 2>/dev/null || echo ""');
  if (!raw) return [];
  return raw.trim().split('\n')
    .filter(f => f.endsWith('.java') && f.startsWith('apps/backend-2fa/src/main/java/'))
    .map(f => path.join(REPO, f))
    .filter(f => fs.existsSync(f));
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n🛡️  SOFIA GUARDRAILS v1.1 — Gate ${gate}${sprintOnly ? ' [--sprint-only]' : ''}`);
console.log('='.repeat(60));

// ── GR-001: Paquete raíz ────────────────────────────────────────────────────
console.log('\n[GR-001] Verificación de paquete raíz Java');
let rootPkg = null;
if (fs.existsSync(path.join(REPO, ROOT_PKG_FILE))) {
  const firstLine = fs.readFileSync(path.join(REPO, ROOT_PKG_FILE), 'utf8').split('\n')[0].trim();
  const m = firstLine.match(/^package\s+([\w.]+)\s*;/);
  if (m) {
    rootPkg = m[1].replace(/\.[^.]+$/, ''); // eliminar último segmento
    ok(`Paquete raíz: ${rootPkg}`);
  } else { fail('No se pudo leer el paquete raíz', firstLine); }
} else { fail('BackendTwoFactorApplication.java no encontrado', ROOT_PKG_FILE); }

// ── GR-001b: Todos los src/main usan el paquete correcto ────────────────────
if (rootPkg) {
  console.log('\n[GR-001b] Coherencia paquete → ruta');
  const files = javaFiles(BACKEND_SRC);
  let orphans = 0;
  for (const f of files) {
    const m = fs.readFileSync(f, 'utf8').match(/^package\s+([\w.]+)\s*;/m);
    if (!m) continue;
    if (!m[1].startsWith(rootPkg)) {
      fail(`Paquete incorrecto: ${path.relative(REPO, f)}`, `declara '${m[1]}', esperado '${rootPkg}.*'`);
      orphans++;
    }
  }
  if (orphans === 0) ok(`${files.length} ficheros Java — todos con paquete correcto`);
}

// ── GR-002: API Surface de Transaction ────────────────────────────────────────
console.log('\n[GR-002] API Surface — métodos de Transaction usados correctamente');
const TX_FILE = path.join(REPO, 'apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/account/domain/Transaction.java');
if (fs.existsSync(TX_FILE)) {
  const txContent = fs.readFileSync(TX_FILE, 'utf8');
  const realMethods = [...txContent.matchAll(/public\s+\w[\w<>[\], ]*\s+(get\w+)\s*\(\s*\)/g)].map(m => m[1]);
  const wrongMethods = ['getValueDate','getDescription','getBalance','getCurrency','getAccountingDate'];

  // Solo revisar ficheros que importan Transaction Y referencian 'tx.' o 'transaction.'
  const srcFiles = javaFiles(BACKEND_SRC);
  let apiErrors = 0;
  for (const f of srcFiles) {
    const content = fs.readFileSync(f, 'utf8');
    // El fichero debe importar Transaction para que el check sea relevante
    if (!content.includes('import com.experis.sofia.bankportal.account.domain.Transaction')) continue;
    for (const wrong of wrongMethods) {
      // Buscar solo en contexto de variable Transaction: tx.getX() o transaction.getX()
      const pattern = new RegExp(`(?:tx|transaction|t)\\s*\\.\\s*${wrong}\\s*\\(`, 'g');
      if (pattern.test(content)) {
        fail(`Método inexistente '${wrong}()' en ${path.relative(REPO, f)}`,
             `Transaction real tiene: ${realMethods.join(', ')}`);
        apiErrors++;
      }
    }
  }
  if (apiErrors === 0) ok(`API Surface verificada — sin llamadas a métodos inexistentes de Transaction`);
} else {
  warn('Transaction.java no encontrado — GR-002 omitido');
}

// ── GR-003: SpringContextIT ────────────────────────────────────────────────
console.log('\n[GR-003] SpringContextIT existe');
const contextIT = path.join(REPO, BACKEND_TEST, 'com/experis/sofia/bankportal/integration/SpringContextIT.java');
const baseIT    = path.join(REPO, BACKEND_TEST, 'com/experis/sofia/bankportal/integration/config/IntegrationTestBase.java');
fs.existsSync(contextIT) ? ok('SpringContextIT.java presente') :
  fail('SpringContextIT.java AUSENTE — crear antes de G-4b', path.relative(REPO, contextIT));
fs.existsSync(baseIT)    ? ok('IntegrationTestBase.java presente') :
  warn('IntegrationTestBase.java ausente');

// ── GR-004: mvn compile ────────────────────────────────────────────────────
if (['G-4b','G-4','G-5'].includes(gate)) {
  console.log('\n[GR-004] mvn compile — compilación real');
  const JAVA_HOME = '/opt/homebrew/opt/openjdk@21';
  const result = run(`JAVA_HOME=${JAVA_HOME} mvn compile -q -f apps/backend-2fa/pom.xml 2>&1`);
  result !== null ? ok('mvn compile EXIT 0') :
    fail('mvn compile FALLÓ — gate no puede aprobarse hasta resolver errores');
} else {
  info(`GR-004 mvn compile omitido para gate ${gate}`);
}

// ── GR-005: @Profile("!production") ─────────────────────────────────────────
console.log(`\n[GR-005] @Profile("!production") ${sprintOnly ? '[solo ficheros nuevos del sprint]' : '[todos los ficheros]'}`);
const checkFiles5 = sprintOnly ? sprintFiles() : javaFiles(BACKEND_SRC);
if (checkFiles5.length === 0 && sprintOnly) {
  info('Sin ficheros nuevos detectados via git diff — GR-005 omitido');
} else {
  let profileErrors = 0;
  for (const f of checkFiles5) {
    const rel = path.relative(REPO, f);
    if (baseline.gr005_whitelist.some(w => rel.endsWith(w))) continue;
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('@Profile') && content.includes('!production')) {
      fail(`@Profile("!production") en ${rel}`, 'Usar @Profile("mock") — nunca "!production"');
      profileErrors++;
    }
  }
  if (profileErrors === 0) {
    const scope = sprintOnly ? `${checkFiles5.length} ficheros nuevos` : `${javaFiles(BACKEND_SRC).length} ficheros`;
    ok(`Sin @Profile("!production") (${scope})`);
  }
}

// ── GR-006: @AuthenticationPrincipal ─────────────────────────────────────────
console.log(`\n[GR-006] @AuthenticationPrincipal ${sprintOnly ? '[solo ficheros nuevos]' : '[todos]'}`);
const checkFiles6 = sprintOnly ? sprintFiles() : javaFiles(BACKEND_SRC);
if (checkFiles6.length === 0 && sprintOnly) {
  info('Sin ficheros nuevos — GR-006 omitido');
} else {
  let authErrors = 0;
  for (const f of checkFiles6) {
    if (!f.includes('/controller/') && !f.includes('Controller.java')) continue;
    const rel = path.relative(REPO, f);
    if (baseline.gr006_whitelist.some(w => rel.endsWith(w))) continue;
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('@AuthenticationPrincipal')) {
      fail(`@AuthenticationPrincipal en ${rel}`, 'Usar HttpServletRequest.getAttribute("userId") — DEBT-022');
      authErrors++;
    }
  }
  if (authErrors === 0) ok('Sin @AuthenticationPrincipal en controllers nuevos');
}

// ── Resultado ────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log(`🛡️  RESULT — Gate ${gate} | ✅ ${passed} OK · ❌ ${failed} BLOQUEANTES`);

if (failed > 0) {
  console.error('\n🚫 GATE BLOQUEADO:\n');
  errors.forEach((e, i) => {
    console.error(`  ${i+1}. ${e.label}`);
    if (e.detail) console.error(`     ${e.detail}`);
  });
  const logEntry = `[${new Date().toISOString()}] [GUARDRAIL] Gate ${gate} BLOQUEADO — ${failed} error(es): ${errors.map(e=>e.label.substring(0,60)).join(' | ')}\n`;
  try { fs.appendFileSync(path.join(REPO, '.sofia/sofia.log'), logEntry); } catch(_) {}
  process.exit(1);
} else {
  console.log('\n✅ Todos los guardrails OK — Gate puede aprobarse\n');
  const logEntry = `[${new Date().toISOString()}] [GUARDRAIL] Gate ${gate} — ${passed} checks OK\n`;
  try { fs.appendFileSync(path.join(REPO, '.sofia/sofia.log'), logEntry); } catch(_) {}
  process.exit(0);
}
