#!/usr/bin/env node
/**
 * validate-yaml-profiles.js  -- GR-CONFIG-001 (DEBT-054, Sprint 27, BankPortal)
 * Verifica RESOLUBILIDAD de placeholders Spring: ${a.b.c} sin default y dotted
 * (R) deben existir como clave en la cadena de yml de cada profile (A).
 * Dependency-free: parser YAML propio (no js-yaml). Corre en CI sin instalar nada.
 *
 * Bloqueante (exit!=0) SOLO para profiles en BLOCKING (full-context @SpringBootTest).
 * Resto (test/integration/main) -> warning. Uso: node validate-yaml-profiles.js [--report]
 */
'use strict';
const fs = require('fs');
const path = require('path');

const APP = path.resolve(__dirname, '../../apps/backend-2fa');
const JAVA_SRC = path.join(APP, 'src/main/java');
const MAIN = path.join(APP, 'src/main/resources');
const TEST = path.join(APP, 'src/test/resources');

const PROFILE_CHAINS = {
  'test':                [[TEST,'application.yml'],[TEST,'application-test.yml']],
  'integration':         [[TEST,'application.yml'],[TEST,'application-integration.yml']],
  'integration-compose': [[TEST,'application.yml'],[TEST,'application-integration-compose.yml']],
  'prod':    [[MAIN,'application.yml'],[MAIN,'application-prod.yml']],
  'staging': [[MAIN,'application.yml'],[MAIN,'application-staging.yml']],
  'kyc':     [[MAIN,'application.yml'],[MAIN,'application-kyc.yml']],
};
// EDITABLE: profiles cuyo R no subset A es BLOQUEANTE (ejercen contexto completo).
// S27: solo integration-compose (los 17 IT verdes son la prueba de R subset A).
const BLOCKING = new Set(['integration-compose']);

const REPORT = process.argv.includes('--report');

function walk(dir, ext, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, acc);
    else if (e.name.endsWith(ext)) acc.push(p);
  }
  return acc;
}
function collectRequired() {
  const re = /\$\{([^}]+)\}/g;
  const noDefault = new Set();
  for (const f of walk(JAVA_SRC, '.java', [])) {
    const txt = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = re.exec(txt))) {
      const body = m[1];
      const name = body.split(':')[0].trim();
      if (!body.includes(':')) noDefault.add(name);
    }
  }
  // R = sin default Y dotted (excluye env-style MAYUS sin punto: JWT_SECRET, etc.)
  return [...noDefault].filter(k => k.includes('.')).sort();
}

function stripInlineComment(line) {
  let inS=false, inD=false;
  for (let i=0;i<line.length;i++){
    const c=line[i];
    if (c==="'"&&!inD) inS=!inS;
    else if (c==='"'&&!inS) inD=!inD;
    else if (c==='#'&&!inS&&!inD&&(i===0||/\s/.test(line[i-1]))) return line.slice(0,i);
  }
  return line;
}
function flatten(file) {
  const keys = new Set();
  if (!fs.existsSync(file)) return keys;
  const stack = [];
  for (let raw of fs.readFileSync(file,'utf8').split(/\r?\n/)) {
    if (!raw.trim()) continue;
    if (/^\s*#/.test(raw)) continue;
    if (raw.trim()==='---'){ stack.length=0; continue; }
    raw = stripInlineComment(raw);
    if (!raw.trim()) continue;
    const indent = raw.length - raw.replace(/^ +/,'').length;
    const content = raw.slice(indent);
    let ci=-1;
    for (let i=0;i<content.length;i++){
      if (content[i]===':'&&(i+1===content.length||/\s/.test(content[i+1]))){ci=i;break;}
    }
    if (ci<0) continue;
    const key = content.slice(0,ci).trim();
    if (key.startsWith('- ')) continue;
    const value = content.slice(ci+1).trim();
    while (stack.length && stack[stack.length-1].indent >= indent) stack.pop();
    const prefix = stack.map(s=>s.key).join('.');
    const full = prefix ? prefix+'.'+key : key;
    if (value!=='') keys.add(full);
    stack.push({indent, key});
  }
  return keys;
}
function available(profile){
  const A = new Set();
  for (const [dir,name] of PROFILE_CHAINS[profile]) for (const k of flatten(path.join(dir,name))) A.add(k);
  return A;
}

const R = collectRequired();
let hardFail = false;
const rows = [];
for (const profile of Object.keys(PROFILE_CHAINS)){
  const A = available(profile);
  const missing = R.filter(r=>!A.has(r));
  const blocking = BLOCKING.has(profile);
  const status = missing.length===0 ? 'OK' : (blocking?'ERROR':'WARN');
  if (missing.length && blocking) hardFail = true;
  rows.push({profile, blocking, available:A.size, missing, status});
}

console.log('GR-CONFIG-001 . validate-yaml-profiles');
console.log('R (placeholders requeridos, dotted sin default): '+R.length);
if (REPORT) console.log('  '+R.join('\n  '));
console.log('');
console.log('profile               | modo       | claves | faltan | estado');
console.log('----------------------|------------|--------|--------|-------');
for (const r of rows){
  console.log(
    r.profile.padEnd(21)+' | '+
    (r.blocking?'BLOQUEANTE':'warning').padEnd(10)+' | '+
    String(r.available).padStart(6)+' | '+
    String(r.missing.length).padStart(6)+' | '+
    r.status
  );
}
for (const r of rows) if (r.missing.length){
  console.log('\n['+r.status+'] '+r.profile+' -- faltan '+r.missing.length+':');
  for (const k of r.missing) console.log('    - '+k);
}
console.log('');
if (hardFail && !REPORT){
  console.error('FAIL: profile(s) BLOQUEANTE con placeholders no resolubles (ver arriba).');
  process.exit(1);
}
console.log(hardFail ? 'REPORT-ONLY: habria fallo bloqueante (--report activo, exit 0).'
                     : 'OK: todos los profiles bloqueantes resuelven R.');
process.exit(0);
