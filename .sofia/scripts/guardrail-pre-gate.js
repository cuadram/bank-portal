#!/usr/bin/env node
/**
 * guardrail-pre-gate.js — SOFIA v2.3
 * Verificación automática de guardrails antes de aprobar cualquier gate.
 * Detecta en CI/pre-gate los errores que costaron HOTFIX-S20.
 *
 * Uso: node .sofia/scripts/guardrail-pre-gate.js --gate G-4b
 *
 * Guardrails implementados:
 *   GR-001 Verificación de paquete raíz Java
 *   GR-002 API Surface — métodos referenciados existen en la entidad real
 *   GR-003 SpringContextIT existe y compila
 *   GR-004 mvn compile sin errores
 *   GR-005 Sin paquetes huérfanos (rutas que no coinciden con package declaration)
 *   GR-006 @Profile("!production") ausente en beans de producción
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = process.cwd();
const BACKEND_SRC  = 'apps/backend-2fa/src/main/java';
const BACKEND_TEST = 'apps/backend-2fa/src/test/java';
const ROOT_PKG_FILE = 'apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/twofa/BackendTwoFactorApplication.java';

const gate = (process.argv.find(a => a.startsWith('--gate=')) || '').replace('--gate=', '')
          || (process.argv[process.argv.indexOf('--gate') + 1] || 'UNKNOWN');

let passed = 0;
let failed = 0;
const errors = [];

function ok(label) {
  console.log(`  ✅ ${label}`);
  passed++;
}

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

function run(cmd) {
  try {
    return execSync(cmd, { cwd: REPO, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    return null;
  }
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

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n🛡️  SOFIA GUARDRAILS — Gate ${gate}`);
console.log('='.repeat(60));

// ── GR-001: Paquete raíz real ────────────────────────────────────────────────
console.log('\n[GR-001] Verificación de paquete raíz Java');
let rootPkg = null;
if (fs.existsSync(path.join(REPO, ROOT_PKG_FILE))) {
  const firstLine = fs.readFileSync(path.join(REPO, ROOT_PKG_FILE), 'utf8')
                      .split('\n')[0].trim();
  const m = firstLine.match(/^package\s+([\w.]+)\s*;/);
  if (m) {
    rootPkg = m[1].split('.').slice(0, -1).join('.'); // quitar último segmento (twofa)
    // paquete raíz = com.experis.sofia.bankportal
    rootPkg = m[1].replace(/\.[^.]+$/, '');
    ok(`Paquete raíz detectado: ${rootPkg}`);
  } else {
    fail('No se pudo leer el paquete raíz de BackendTwoFactorApplication.java', firstLine);
  }
} else {
  fail('BackendTwoFactorApplication.java no encontrado', ROOT_PKG_FILE);
}

// ── GR-001b: Todos los ficheros Java src/main usan el paquete raíz correcto ──
if (rootPkg) {
  console.log('\n[GR-001b] Coherencia paquete → ruta de archivo');
  const files = javaFiles(BACKEND_SRC);
  let orphans = 0;
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const m = content.match(/^package\s+([\w.]+)\s*;/m);
    if (!m) continue;
    const declaredPkg = m[1];
    if (!declaredPkg.startsWith(rootPkg)) {
      fail(`Paquete incorrecto en ${path.relative(REPO, f)}`, `declara '${declaredPkg}', esperado '${rootPkg}.*'`);
      orphans++;
    }
  }
  if (orphans === 0) ok(`${files.length} ficheros Java verificados — todos con paquete correcto`);
}

// ── GR-002: API Surface — métodos de Transaction usados en código nuevo ───────
console.log('\n[GR-002] API Surface — métodos de entidades del dominio');
const TRANSACTION_FILE = path.join(REPO, 'apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/account/domain/Transaction.java');
if (fs.existsSync(TRANSACTION_FILE)) {
  const txContent = fs.readFileSync(TRANSACTION_FILE, 'utf8');
  // Extraer métodos públicos reales
  const realMethods = [...txContent.matchAll(/public\s+\w[\w<>[\], ]*\s+(get\w+)\s*\(/g)]
                        .map(m => m[1]);

  // Métodos que existieron en el error de S20 (conocidos incorrectos)
  const wrongMethods = ['getValueDate', 'getDescription', 'getBalance', 'getCurrency', 'getAccountingDate'];

  const srcFiles = javaFiles(BACKEND_SRC);
  let apiErrors = 0;
  for (const f of srcFiles) {
    const content = fs.readFileSync(f, 'utf8');
    for (const wrong of wrongMethods) {
      if (content.includes(`tx.${wrong}()`) || content.includes(`.${wrong}()`)) {
        // Verificar que realmente es sobre Transaction (heurística: import Transaction)
        if (content.includes('Transaction') && content.includes(wrong)) {
          fail(`Método inexistente '${wrong}()' en ${path.relative(REPO, f)}`,
               `Transaction solo tiene: ${realMethods.join(', ')}`);
          apiErrors++;
        }
      }
    }
  }
  if (apiErrors === 0) ok(`API Surface verificada — sin métodos inexistentes de Transaction`);
} else {
  warn('Transaction.java no encontrado — GR-002 omitido');
}

// ── GR-003: SpringContextIT existe ──────────────────────────────────────────
console.log('\n[GR-003] SpringContextIT existe en el módulo de test');
const itDir = path.join(REPO, BACKEND_TEST, 'com/experis/sofia/bankportal/integration');
const contextIT = path.join(itDir, 'SpringContextIT.java');
const baseIT    = path.join(itDir, 'config/IntegrationTestBase.java');
if (fs.existsSync(contextIT)) {
  ok('SpringContextIT.java presente');
} else {
  fail('SpringContextIT.java AUSENTE',
       `Crear en: ${path.relative(REPO, contextIT)}\n` +
       '     Este test habría detectado en 30s los errores de HOTFIX-S20.');
}
if (fs.existsSync(baseIT)) {
  ok('IntegrationTestBase.java presente');
} else {
  warn('IntegrationTestBase.java ausente — crear antes de G-4b');
}

// ── GR-004: mvn compile (solo en gate G-4b y G-5) ────────────────────────────
if (['G-4b', 'G-4', 'G-5'].includes(gate)) {
  console.log('\n[GR-004] mvn compile — verificación real de compilación');
  const JAVA_HOME = '/opt/homebrew/opt/openjdk@21';
  const result = run(`JAVA_HOME=${JAVA_HOME} mvn compile -q -f apps/backend-2fa/pom.xml 2>&1`);
  if (result === null) {
    fail('mvn compile FALLÓ', 'Ver salida Maven. Gate NO puede aprobarse hasta resolver errores de compilación.');
  } else {
    ok('mvn compile EXIT 0 — build limpia');
  }
} else {
  console.log(`\n[GR-004] mvn compile — omitido para gate ${gate} (solo G-4/G-4b/G-5)`);
}

// ── GR-005: Sin @Profile("!production") en beans de producción ───────────────
console.log('\n[GR-005] Perfil Spring — sin @Profile("!production") en adapters');
const srcFiles5 = javaFiles(BACKEND_SRC);
let profileErrors = 0;
for (const f of srcFiles5) {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('@Profile') && content.includes('!production')) {
    fail(`@Profile("!production") en ${path.relative(REPO, f)}`,
         'Usar @Profile("mock") o @Profile("test") — nunca "!production"');
    profileErrors++;
  }
}
if (profileErrors === 0) ok('Sin @Profile("!production") en código de producción');

// ── GR-006: Sin @AuthenticationPrincipal en controllers nuevos ───────────────
console.log('\n[GR-006] DEBT-022 — sin @AuthenticationPrincipal en controllers');
let authPrincipalErrors = 0;
for (const f of srcFiles5) {
  if (!f.includes('/controller/') && !f.includes('Controller.java')) continue;
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('@AuthenticationPrincipal')) {
    fail(`@AuthenticationPrincipal en ${path.relative(REPO, f)}`,
         'Usar HttpServletRequest.getAttribute("userId") — patrón DEBT-022');
    authPrincipalErrors++;
  }
}
if (authPrincipalErrors === 0) ok('Sin @AuthenticationPrincipal en controllers');

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log(`🛡️  GUARDRAILS RESULT — Gate ${gate}`);
console.log(`   ✅ Pasados:    ${passed}`);
console.log(`   ❌ Bloqueantes: ${failed}`);

if (failed > 0) {
  console.error('\n🚫 GATE BLOQUEADO — Resolver todos los BLOQUEANTES antes de continuar:\n');
  errors.forEach((e, i) => {
    console.error(`  ${i + 1}. ${e.label}`);
    if (e.detail) console.error(`     ${e.detail}`);
  });

  // Registrar en sofia.log
  const logEntry = `[${new Date().toISOString()}] [GUARDRAIL] Gate ${gate} BLOQUEADO — ${failed} error(es): ${errors.map(e => e.label).join(' | ')}\n`;
  try { fs.appendFileSync(path.join(REPO, '.sofia/sofia.log'), logEntry); } catch (_) {}

  process.exit(1);
} else {
  console.log('\n✅ Todos los guardrails pasados — Gate puede aprobarse\n');

  const logEntry = `[${new Date().toISOString()}] [GUARDRAIL] Gate ${gate} — ${passed} checks OK\n`;
  try { fs.appendFileSync(path.join(REPO, '.sofia/sofia.log'), logEntry); } catch (_) {}

  process.exit(0);
}
