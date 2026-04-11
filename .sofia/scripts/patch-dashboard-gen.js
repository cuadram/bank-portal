#!/usr/bin/env node
/**
 * patch-dashboard-gen.js
 * Aplica fixes de coherencia al generador del dashboard global
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const scriptPath = path.join(ROOT, '.sofia/scripts/gen-global-dashboard.js');
let s = fs.readFileSync(scriptPath, 'utf8');
let fixes = 0;

function replace(from, to, label) {
  if (s.includes(from)) {
    s = s.replace(from, to);
    console.log('✅ Fix aplicado:', label);
    fixes++;
  } else {
    console.log('⚠️  No encontrado:', label);
  }
}

// Fix 1: SOFIA version en header brand-sub (hardcodeada v2.0 → dinámica)
replace(
  `SOFIA v2.0 · Dashboard Global del Proyecto · Generado en cada Gate`,
  `SOFIA v\${S.sofia_version} · Dashboard Global del Proyecto · Generado en cada Gate`,
  'brand-sub SOFIA version dinámica'
);

// Fix 2: Tests KPI — 101/101 → pass/total con bloqueados
replace(
  `<div class="kl">Tests último sprint</div><div class="kv kv-green">\${S.qa?.test_cases_total||101}/\${S.qa?.test_cases_total||101}</div><div class="ks">100% PASS · 0 fallos</div>`,
  `<div class="kl">Tests último sprint</div><div class="kv kv-green">\${S.qa?.test_cases_pass||65}/\${S.qa?.test_cases_total||69}</div><div class="ks">\${S.qa?.test_cases_blocked||0} bloq · \${S.qa?.test_cases_fail||0} fail</div>`,
  'Tests KPI pass/total dinámico'
);

// Fix 3: QA card — ampliar con datos reales del sprint
replace(
  `<div class="row"><span class="rl">Tests ejecutados</span><span class="rv" style="color:var(--green)">\${S.qa?.test_cases_pass||101}/\${S.qa?.test_cases_total||101} PASS</span></div>
      <div class="row"><span class="rl">Cobertura application</span><span class="rv" style="color:var(--green)">\${coverage}%</span></div>
      <div class="row"><span class="rl">Cobertura funcional</span><span class="rv" style="color:var(--green)">\${S.qa?.functional_coverage||'100%'}</span></div>
      <div class="row"><span class="rl">Security checks</span><span class="rv" style="color:var(--green)">\${S.qa?.security_checks||'16/16'}</span></div>
      <div class="row"><span class="rl">WCAG 2.1 AA</span><span class="rv" style="color:var(--green)">\${S.qa?.wcag_checks||'8/8'}</span></div>
      <div class="row"><span class="rl">API contracts</span><span class="rv" style="color:var(--green)">\${S.qa?.api_contracts_verified||'18/18'}</span></div>
      <div class="row"><span class="rl">Defectos abiertos</span><span class="rv" style="color:var(--green)">\${S.qa?.defects_open||0}</span></div>
      <div class="row"><span class="rl">PCI-DSS scan</span><span class="rv" style="color:var(--green)">\${S.security?.pci_dss_compliant?'CLEAN':'N/A'}</span></div>`,
  `<div class="row"><span class="rl">Tests ejecutados</span><span class="rv" style="color:var(--green)">\${S.qa?.test_cases_pass||65}/\${S.qa?.test_cases_total||69} PASS</span></div>
      <div class="row"><span class="rl">Bloqueados / Fallidos</span><span class="rv" style="color:var(--amber)">\${S.qa?.test_cases_blocked||4} bloq · \${S.qa?.test_cases_fail||0} fail</span></div>
      <div class="row"><span class="rl">Escenarios Gherkin</span><span class="rv" style="color:var(--green)">\${S.qa?.gherkin_scenarios_covered||'16/16'}</span></div>
      <div class="row"><span class="rl">Cobertura unitaria</span><span class="rv" style="color:var(--green)">\${S.qa?.unit_coverage_estimated||coverage+'%'}</span></div>
      <div class="row"><span class="rl">Cobertura funcional</span><span class="rv" style="color:var(--green)">\${S.qa?.functional_coverage||'100%'}</span></div>
      <div class="row"><span class="rl">Integración checks</span><span class="rv" style="color:var(--green)">\${S.qa?.integration_checks||'9/9'}</span></div>
      <div class="row"><span class="rl">Security checks</span><span class="rv" style="color:\${S.qa?.security_checks==='6/8'?'var(--amber)':'var(--green)'}">\${S.qa?.security_checks||'6/8'}</span></div>
      <div class="row"><span class="rl">WCAG 2.1 AA</span><span class="rv" style="color:var(--green)">\${S.qa?.wcag_checks||'5/5'}</span></div>
      <div class="row"><span class="rl">Repositorio activo</span><span class="rv" style="color:var(--green)">\${S.qa?.repositorio_activo||'JPA-REAL'}</span></div>
      <div class="row"><span class="rl">Defectos abiertos</span><span class="rv" style="color:var(--green)">\${S.qa?.defects_open||0}</span></div>
      <div class="row"><span class="rl">Veredicto QA</span><span class="rv" style="color:var(--amber);font-size:10px">\${(S.qa?.verdict||'OK').slice(0,35)}</span></div>`,
  'QA card datos reales S21'
);

// Fix 4: Semáforo color dinámico
replace(
  `<div class="row"><span class="rl">Semáforo</span><span class="rv" style="color:var(--green)">\${S.security?.semaphore||'VERDE'}</span></div>`,
  `<div class="row"><span class="rl">Semáforo</span><span class="rv" style="color:\${S.security?.semaphore==='YELLOW'?'var(--amber)':S.security?.semaphore==='RED'?'var(--red)':'var(--green)'}">\${S.security?.semaphore||'GREEN'}</span></div>`,
  'Semáforo color dinámico YELLOW/RED/GREEN'
);

// Fix 5: Pipeline label SOFIA version y steps dinámicos
replace(
  `SOFIA v2.3 (15 steps activos)`,
  `SOFIA v\${S.sofia_version} (\${S.pipeline_steps_total||15} steps activos)`,
  'Pipeline label version+steps dinámico'
);

// Fix 6: Burnup max 500 → 560
replace(
  `y:{ticks,grid,min:0,max:500}`,
  `y:{ticks,grid,min:0,max:560}`,
  'Burnup Y max 560'
);

// Fix 7: session ver → SOFIA version en stack gobierno
replace(
  `<div class="row"><span class="rl">session ver.</span><span class="rv">\${S.version}</span></div>`,
  `<div class="row"><span class="rl">SOFIA v.</span><span class="rv" style="color:var(--purple)">\${S.sofia_version}</span></div>`,
  'Stack gobierno: SOFIA version dinámica'
);

// Fix 8: Pipeline steps en stack gobierno (13 → dinámico)
replace(
  `<div class="row"><span class="rl">Pipeline</span><span class="rv">13 steps</span></div>`,
  `<div class="row"><span class="rl">Pipeline</span><span class="rv">\${S.pipeline_steps_total||15} steps</span></div>`,
  'Stack gobierno: pipeline steps dinámico'
);

// Fix 9: Code Review tendencia S16/S17/S18 → S19/S20/S21
replace(
  `<div class="row"><span class="rl">S16</span><span class="rv" style="color:var(--green)">2 menores (0 bloq.)</span></div>
      <div class="row"><span class="rl">S17</span><span class="rv" style="color:var(--green)">3 (0 bloq.)</span></div>
      <div class="row"><span class="rl">S18</span><span class="rv" style="color:var(--amber)">\${M.ncs_last_sprint||5} (0 bloq.)</span></div>`,
  `<div class="row"><span class="rl">S19</span><span class="rv" style="color:var(--green)">3 fixes aplicados (0 bloq.)</span></div>
      <div class="row"><span class="rl">S20</span><span class="rv" style="color:var(--amber)">HOTFIX · 16 ficheros (0 bloq.)</span></div>
      <div class="row"><span class="rl">S21</span><span class="rv" style="color:var(--green)">\${S.code_review?.findings_suggestion||1} sug · \${S.code_review?.findings_minor||0} men · 0 bloq.</span></div>`,
  'Code Review tendencia S19/S20/S21'
);

fs.writeFileSync(scriptPath, s, 'utf8');
console.log('\nTotal fixes aplicados:', fixes, '/9');
console.log('Script guardado.');
