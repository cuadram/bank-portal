#!/usr/bin/env node
// smoke-test-v1.22.0.js — BankPortal v1.22.0 · Sprint 22 FEAT-020
// Equivalente al bash smoke-test-v1.22.0.sh — ejecutable via Node (sofia-shell)
const http = require('http');

const BASE  = 'http://localhost:8081';
const FRONT = 'http://localhost:4201';
let OK = 0, FAIL = 0;
const results = [];

const req = (url, opts = {}) => new Promise(resolve => {
  const options = { ...require('url').parse(url), ...opts };
  const r = http.request(options, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => resolve({ code: res.statusCode, body }));
  });
  r.on('error', () => resolve({ code: null, body: '' }));
  r.setTimeout(5000, () => { r.destroy(); resolve({ code: null, body: '' }); });
  if (opts.body) r.write(opts.body);
  r.end();
});

const check = (id, desc, expected, actual) => {
  const ok = actual === expected;
  if (ok) { OK++; console.log('✅', id, desc, '(HTTP', actual + ')'); }
  else     { FAIL++; console.log('❌', id, desc, '(esperado:', expected + ', obtenido:', actual + ')'); }
  results.push({ id, desc, expected, actual, ok });
};

(async () => {
  console.log('=== SMOKE TEST v1.22.0 —', new Date().toISOString(), '===');
  console.log('');

  // ST-01 Health backend
  const h = await req(BASE + '/actuator/health');
  check('ST-01', 'Health backend', 200, h.code);

  // ST-02 Frontend
  const f = await req(FRONT + '/');
  check('ST-02', 'Frontend accesible', 200, f.code);

  // ST-03 Login sin cred → 400
  const l = await req(BASE + '/api/v1/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
  });
  check('ST-03', 'Login sin cred → 400', 400, l.code);

  // ST-04 GET /loans sin JWT → 401
  const lo = await req(BASE + '/api/v1/loans');
  check('ST-04', 'GET /loans sin JWT → 401', 401, lo.code);

  // ST-05 POST /loans/simulate sin JWT → 401
  const ls = await req(BASE + '/api/v1/loans/simulate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ importe: 15000, plazo: 36, finalidad: 'CONSUMO' })
  });
  check('ST-05', 'POST /loans/simulate sin JWT → 401', 401, ls.code);

  // ST-06 Flyway V24
  const fw = await req(BASE + '/actuator/flyway');
  let v24ok = false;
  if (fw.code === 200) {
    try {
      const d = JSON.parse(fw.body);
      const migs = Object.values(d.contexts || {})[0]?.flywayBeans?.flyway?.migrations || [];
      const v24 = migs.find(m => m.script && m.script.startsWith('V24'));
      v24ok = v24 && v24.state === 'SUCCESS';
    } catch(e) {}
  }
  if (v24ok) { OK++; console.log('✅ ST-06 Flyway V24__loans_and_applications.sql aplicada'); }
  else { FAIL++; console.log('❌ ST-06 Flyway V24 no verificada'); }
  results.push({ id: 'ST-06', ok: v24ok });

  // ST-07 /profile/notifications sin JWT → 401 (DEBT-043)
  const pn = await req(BASE + '/api/v1/profile/notifications');
  check('ST-07', 'GET /profile/notifications sin JWT → 401 (DEBT-043)', 401, pn.code);

  // ST-08 /actuator/info
  const info = await req(BASE + '/actuator/info');
  check('ST-08', 'Actuator info accesible', 200, info.code);

  // ST-09 /api/v1/loans/apply sin JWT → 401
  const la = await req(BASE + '/api/v1/loans/apply', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
  });
  check('ST-09', 'POST /loans/apply sin JWT → 401', 401, la.code);

  // ST-10 MailHog UI
  const mh = await req('http://localhost:8025/');
  check('ST-10', 'MailHog UI accesible', 200, mh.code);

  console.log('');
  console.log('=== RESULTADO:', OK, 'OK |', FAIL, 'FAIL ===');
  if (FAIL === 0) console.log('✅ SMOKE TEST PASS — v1.22.0 LISTO PARA PRODUCCION');
  else console.log('❌ SMOKE TEST FAIL —', FAIL, 'checks fallidos');

  // Guardar log
  const log = {
    version: 'v1.22.0', sprint: 22, feature: 'FEAT-020',
    executed_at: new Date().toISOString(),
    total: OK+FAIL, ok: OK, fail: FAIL,
    result: FAIL === 0 ? 'PASS' : 'FAIL',
    checks: results
  };
  require('fs').writeFileSync('docs/qa/SMOKE-TEST-v1.22.0-' + new Date().toISOString().replace(/:/g,'-').slice(0,19) + '.log', JSON.stringify(log, null, 2));
  console.log('📄 Log guardado en docs/qa/');
  process.exit(FAIL > 0 ? 1 : 0);
})();
