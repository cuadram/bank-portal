#!/usr/bin/env node
/**
 * stg-pre-check.js — Guardrail pre-gate Angular
 * SOFIA v2.4 | Generado 2026-04-01
 *
 * CHECK-1: forkJoin + catchError→EMPTY  (LA-STG-001) — deadlock silencioso
 * CHECK-2: versiones hardcodeadas en templates (LA-STG-002) — footer obsoleto
 * CHECK-3: endpoints frontend no implementados en backend (LA-STG-003)
 *
 * Uso:
 *   node .sofia/scripts/stg-pre-check.js
 *
 * Exit codes:  0=OK  1=warnings  2=errores bloqueantes
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const FRONTEND_SRC = path.resolve('apps/frontend-portal/src');
const BACKEND_SRC  = path.resolve('apps/backend-2fa/src/main/java');

const R = '\x1b[0m'; const RED = '\x1b[31m'; const YEL = '\x1b[33m';
const GRN = '\x1b[32m'; const BLD = '\x1b[1m'; const CYN = '\x1b[36m';

let errors = 0; let warnings = 0;

function walkFiles(dir, exts, cb) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(function(f) {
    var p = path.join(dir, f);
    var st = fs.statSync(p);
    if (st.isDirectory() && f !== 'node_modules' && !f.startsWith('.')) walkFiles(p, exts, cb);
    else if (st.isFile() && exts.some(function(e) { return f.endsWith(e); })) cb(p, fs.readFileSync(p, 'utf8'));
  });
}

function stripComments(src) {
  // Eliminar bloques /* ... */ y líneas //
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map(function(l) { return l.replace(/\/\/.*$/, ''); }).join('\n');
}

function rel(p) { return p.replace(process.cwd() + '/', ''); }

function logErr(check, file, msg, fix) {
  errors++;
  console.log(RED + BLD + '[ERROR]' + R + ' ' + CYN + check + R + ' ' + rel(file));
  console.log('         ' + msg);
  if (fix) console.log('         ' + YEL + 'Fix: ' + fix + R);
}
function logWarn(check, file, msg, fix) {
  warnings++;
  console.log(YEL + '[WARN] ' + R + ' ' + CYN + check + R + ' ' + rel(file));
  console.log('         ' + msg);
  if (fix) console.log('         Fix: ' + fix);
}
function logOk(check, msg) {
  console.log(GRN + '[OK]   ' + R + ' ' + CYN + check + R + ' ' + msg);
}

/* ── CHECK-1: forkJoin + EMPTY ─────────────────────────────────────────── */
console.log('\n' + BLD + 'CHECK-1: forkJoin + catchError→EMPTY (LA-STG-001)' + R);

var forkJoinFiles = {};   // filePath → true
var emptyInFile   = {};   // filePath → [{line, text}]

walkFiles(FRONTEND_SRC, ['.ts'], function(filePath, raw) {
  var content = stripComments(raw);
  if (content.indexOf('forkJoin') !== -1) forkJoinFiles[filePath] = true;

  var lines = content.split('\n');
  lines.forEach(function(line, i) {
    var t = line.trim();
    if (t.indexOf('return EMPTY') !== -1 || /catchError.*EMPTY/.test(t)) {
      if (!emptyInFile[filePath]) emptyInFile[filePath] = [];
      emptyInFile[filePath].push({ line: i + 1, text: t.substring(0, 120) });
    }
  });
});

var check1Errors = 0;
Object.keys(forkJoinFiles).forEach(function(f) {
  if (emptyInFile[f]) {
    emptyInFile[f].forEach(function(e) {
      check1Errors++;
      logErr('LA-STG-001', f,
        'Línea ' + e.line + ': catchError retorna EMPTY en fichero con forkJoin → skeleton infinito',
        'Cambiar "return EMPTY" por "return of([])" o "return of(null)"');
    });
  }
});

// Warnings: EMPTY sin forkJoin en el mismo fichero
Object.keys(emptyInFile).forEach(function(f) {
  if (!forkJoinFiles[f]) {
    emptyInFile[f].forEach(function(e) {
      logWarn('LA-STG-001', f,
        'Línea ' + e.line + ': EMPTY en catchError — verificar que no se usa en forkJoin externo',
        'Si el método se usa en forkJoin → of(valorDefecto)');
    });
  }
});

if (check1Errors === 0) {
  logOk('LA-STG-001', 'No hay forkJoin + EMPTY en catchError (' + Object.keys(forkJoinFiles).length + ' ficheros revisados)');
}

/* ── CHECK-2: versiones hardcodeadas ──────────────────────────────────── */
console.log('\n' + BLD + 'CHECK-2: Versiones hardcodeadas en templates (LA-STG-002)' + R);

var VERSION_RE = /Sprint\s+\d+\s*[·\-]\s*v\d+|v\d+\.\d+\.\d+.*Sprint|Sprint\s+\d+.*v\d+\.\d+/;
var check2Errors = 0;

walkFiles(FRONTEND_SRC, ['.ts', '.html'], function(filePath, raw) {
  if (filePath.indexOf('environment') !== -1 || filePath.indexOf('spec.ts') !== -1) return;
  var content = stripComments(raw);
  var lines = content.split('\n');
  lines.forEach(function(line, i) {
    if (VERSION_RE.test(line)) {
      check2Errors++;
      logErr('LA-STG-002', filePath,
        'Línea ' + (i + 1) + ': versión/sprint hardcodeado → "' + line.trim().substring(0, 80) + '"',
        'Usar environment.version, environment.sprint, environment.envLabel');
    }
  });
});

// Verificar campos obligatorios en environment files
var ENV_FIELDS = ['version', 'sprint', 'envLabel'];
[
  FRONTEND_SRC + '/environments/environment.ts',
  FRONTEND_SRC + '/environments/environment.prod.ts'
].forEach(function(ep) {
  if (!fs.existsSync(ep)) {
    logWarn('LA-STG-002', ep, 'Fichero no encontrado', 'Crear environment.ts y environment.prod.ts');
    return;
  }
  var c = fs.readFileSync(ep, 'utf8');
  ENV_FIELDS.forEach(function(field) {
    if (c.indexOf(field + ':') === -1) {
      check2Errors++;
      logErr('LA-STG-002', ep,
        'Campo obligatorio "' + field + '" no encontrado',
        'Añadir ' + field + ': "..." al objeto environment');
    }
  });
});

if (check2Errors === 0) logOk('LA-STG-002', 'Sin versiones hardcodeadas, environment fields OK');

/* ── CHECK-3: endpoints frontend vs backend ───────────────────────────── */
console.log('\n' + BLD + 'CHECK-3: Endpoints frontend vs backend (LA-STG-003)' + R);

var consumed = {};  // "METHOD /path" → [files]
var API_RE   = /this\.http\.(get|post|patch|put|delete)\s*(?:<[^>]*>)?\s*\(\s*[`'"](\/[^`'"$\s]{3,})[`'"]/g;

walkFiles(FRONTEND_SRC, ['.service.ts'], function(filePath, raw) {
  var content = stripComments(raw);
  var m;
  API_RE.lastIndex = 0;
  while ((m = API_RE.exec(content)) !== null) {
    var method   = m[1].toUpperCase();
    var endpoint = m[2].replace(/\$\{[^}]+\}/g, '{id}');
    var key      = method + ' ' + endpoint;
    if (!consumed[key]) consumed[key] = [];
    consumed[key].push(rel(filePath));
  }
});

// Extraer endpoints del backend Java
var backendEndpoints = [];
var MAP_RE  = /@(Get|Post|Put|Patch|Delete)Mapping\s*\(\s*['"](\/[^'"]+)['"]/g;
var BASE_RE = /@RequestMapping\s*\(\s*(?:value\s*=\s*)?['"](\/[^'"]+)['"]/g;

walkFiles(BACKEND_SRC, ['.java'], function(filePath, raw) {
  var base = '';
  var bm;
  BASE_RE.lastIndex = 0;
  while ((bm = BASE_RE.exec(raw)) !== null) base = bm[1];
  MAP_RE.lastIndex = 0;
  while ((bm = MAP_RE.exec(raw)) !== null) {
    var method   = bm[1].toUpperCase();
    var endpoint = (base + bm[2]).replace(/\/\//g, '/').replace(/\{[^}]+\}/g, '{id}');
    backendEndpoints.push(method + ' ' + endpoint);
  }
});

var consumedKeys = Object.keys(consumed);
if (consumedKeys.length === 0) {
  logWarn('LA-STG-003', FRONTEND_SRC,
    'No se detectaron llamadas HTTP en services — verificar rutas de services',
    'Services deben estar en src/app/features/**/services/*.service.ts');
} else {
  var check3Errors = 0;
  console.log('\n  ' + CYN + 'Endpoints consumidos:' + R);
  consumedKeys.forEach(function(key) {
    var norm = key.replace('/api/v1', '').replace('{id}', '{x}');
    var found = backendEndpoints.some(function(be) {
      return be === key || be.replace('/api/v1', '').replace('{id}', '{x}') === norm;
    });
    var icon = found ? GRN + '✓' + R : RED + '✗' + R;
    console.log('    ' + icon + ' ' + key + (found ? '' : '  ← NO IMPLEMENTADO'));
    if (!found) {
      check3Errors++;
      logErr('LA-STG-003', consumed[key][0],
        key + ' consumido en frontend pero no encontrado en backend',
        'Implementar endpoint en backend O registrar DEBT-XXX + catchError → of([])');
    }
  });
  if (check3Errors === 0) logOk('LA-STG-003', consumedKeys.length + ' endpoints verificados — todos existen en backend');
}

/* ── Resumen ──────────────────────────────────────────────────────────── */
console.log('\n' + '─'.repeat(60));
console.log(BLD + 'RESULTADO STG PRE-CHECK' + R);
console.log('  Errores  (BLOQUEANTES): ' + (errors   > 0 ? RED : GRN) + errors   + R);
console.log('  Warnings:               ' + (warnings > 0 ? YEL : GRN) + warnings + R);

// Persistir en session.json
var sessionPath = '.sofia/session.json';
if (fs.existsSync(sessionPath)) {
  try {
    var s = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    s.stg_pre_check = { executed_at: new Date().toISOString(), errors: errors, warnings: warnings,
      checks: ['LA-STG-001','LA-STG-002','LA-STG-003'], result: errors === 0 ? 'PASS' : 'FAIL' };
    s.updated_at = new Date().toISOString();
    fs.writeFileSync(sessionPath, JSON.stringify(s, null, 2));
    console.log('\n  ' + GRN + '✓ Resultado persistido en .sofia/session.json' + R);
  } catch(e) {}
}

if (errors > 0) {
  console.log('\n' + RED + BLD + '⛔ BLOQUEANTE — Corregir ' + errors + ' error(es) antes de Gate G-4/G-5' + R + '\n');
  process.exit(2);
} else if (warnings > 0) {
  console.log('\n' + YEL + '⚠️  ' + warnings + ' warning(s) — Revisar antes de continuar' + R + '\n');
  process.exit(1);
} else {
  console.log('\n' + GRN + BLD + '✅ STG PRE-CHECK PASS — Listo para Gate G-4/G-5' + R + '\n');
  process.exit(0);
}
