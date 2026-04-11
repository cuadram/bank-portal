#!/usr/bin/env node
/**
 * patch-add-ma-tab.js — SOFIA v2.7
 * Añade la pestaña "MA & Baseline" al gen-global-dashboard.js
 * Ejecutar UNA SOLA VEZ: node .sofia/scripts/patch-add-ma-tab.js
 */
'use strict';
const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const GEN  = path.join(ROOT, '.sofia/scripts/gen-global-dashboard.js');

let src = fs.readFileSync(GEN, 'utf8');

if (src.includes('// ── MA BASELINE TAB v2.7')) {
  console.log('[PATCH] gen-global-dashboard.js ya tiene el tab MA. Sin cambios.');
  process.exit(0);
}

// ══════════════════════════════════════════════════════════════════════════
// BLOQUE 1: Cargar ma-baseline.json + buildMAPanel() antes de FULL_HISTORY
// ══════════════════════════════════════════════════════════════════════════
const MA_BLOCK = `
// ── MA BASELINE TAB v2.7 ─────────────────────────────────────────────────────
const MA_BASELINE_PATH  = path.join(ROOT, '.sofia/ma-baseline.json');
const ORG_BASELINE_PATH = path.join(ROOT, '.sofia/org-baseline.json');
const MA  = fs.existsSync(MA_BASELINE_PATH)  ? JSON.parse(fs.readFileSync(MA_BASELINE_PATH, 'utf8'))  : null;
const ORG = fs.existsSync(ORG_BASELINE_PATH) ? JSON.parse(fs.readFileSync(ORG_BASELINE_PATH, 'utf8')) : null;

function buildMAPanel(MA, ORG) {
  if (!MA) return '<div id="p-ma" class="panel"><div style="padding:48px;text-align:center;color:var(--muted)"><div style="font-size:36px;margin-bottom:14px">📊</div><div style="font-size:14px;font-weight:600;margin-bottom:8px;color:var(--text)">MA Baseline no generado aún</div><div style="font-size:11px;margin-bottom:6px">Se genera automáticamente al cerrar el primer sprint con SOFIA v2.7+</div><div style="font-family:var(--mono);font-size:10px;padding:7px 14px;background:var(--bg3);border-radius:6px;display:inline-block;margin-top:8px;color:var(--dim)">node .sofia/scripts/gate-dashboard-hook.js --gate G-9 --step 9</div></div></div>';
  var SC = { GREEN:'var(--green)', AMBER:'var(--amber)', RED:'var(--red)', UNKNOWN:'var(--muted)' };
  var TI = { improving:'↑ improving', worsening:'↓ worsening', stable:'→ stable', insufficient_data:'— n/d' };
  var sc0 = SC[MA.summary.overall_status] || 'var(--muted)';
  var pks = ORG ? Object.keys(ORG.projects || {}) : [];
  var PCOLS = ['#1D9E75','#7F77DD'];

  var summary =
    '<div class="g3" style="margin-bottom:16px">' +
    '<div class="kpi"><div class="kl">Estado global proceso</div>' +
      '<div class="kv" style="color:' + sc0 + '">' + MA.summary.overall_status + '</div>' +
      '<div class="ks">' + MA.summary.green_count + '\u{1F7E2} ' + MA.summary.amber_count + '\u{1F7E1} ' + MA.summary.red_count + '\u{1F534} \xb7 Sprint ' + MA.current_sprint + '</div></div>' +
    '<div class="kpi"><div class="kl">Sprints analizados</div>' +
      '<div class="kv kv-blue">' + MA.sprints_analyzed + '</div>' +
      '<div class="ks">' + MA.sprints_range + ' \xb7 PA: MA (CMMI L3)</div></div>' +
    '<div class="kpi"><div class="kl">Generado</div>' +
      '<div class="kv kv-teal" style="font-size:15px">' + (MA.generated_at||'').slice(0,10) + '</div>' +
      '<div class="ks">' + (MA._generated_by || 'gen-ma-baseline.js') + '</div></div>' +
    '</div>';

  var metricCards = '<div class="g3" style="margin-bottom:18px">' +
    Object.values(MA.metrics).map(function(m) {
      var sc = SC[m.current_status] || 'var(--text)';
      var ti = (TI[m.trend] || '\u2192').split(' ')[0];
      return '<div class="kpi" style="border-left:3px solid ' + sc + ';padding-left:13px">' +
        '<div class="kl" style="font-size:9px;font-family:var(--mono);color:var(--dim)">' + m.key + '</div>' +
        '<div class="kv" style="font-size:20px;color:' + sc + '">' + m.current_value + m.unit + '</div>' +
        '<div class="ks" style="color:' + sc + ';font-weight:600">' + m.current_status + '</div>' +
        '<div class="ks">' + m.name + '</div>' +
        '<div class="ks">mean:' + m.mean + m.unit + ' \xb7 p90:' + m.p90 + m.unit + ' \xb7 ' + ti + '</div>' +
        '</div>';
    }).join('') + '</div>';

  var legendTrend =
    '<div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px;color:var(--muted)">' +
    '<span><span style="display:inline-block;width:14px;height:3px;background:#1D9E75;margin-right:3px;vertical-align:middle"></span>review_eff</span>' +
    '<span><span style="display:inline-block;width:14px;height:3px;background:#534AB7;margin-right:3px;vertical-align:middle"></span>test_eff</span>' +
    '<span><span style="display:inline-block;width:14px;height:3px;background:#4192e8;margin-right:3px;vertical-align:middle"></span>cmmi</span>' +
    '<span><span style="display:inline-block;width:14px;height:3px;background:#f0a830;margin-right:3px;vertical-align:middle"></span>vel.var (der.)</span>' +
    '</div>';

  var legendOrg = pks.length > 0
    ? '<div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px;color:var(--muted)">' +
      pks.map(function(pk,i){ return '<span><span style="display:inline-block;width:10px;height:10px;background:' + PCOLS[i%2] + ';border-radius:2px;margin-right:3px;vertical-align:middle"></span>' + pk + '</span>'; }).join('') +
      '</div>'
    : '<div style="font-size:10px;color:var(--dim);margin-bottom:8px">Solo un proyecto \xb7 A\xf1ade otro para comparar</div>';

  var charts =
    '<div class="g2" style="margin-bottom:16px">' +
    '<div class="card"><div class="ct">Tendencia proceso \xb7 ' + MA.sprints_range + '</div>' +
    legendTrend +
    '<div style="position:relative;height:200px"><canvas id="maTrendChart"></canvas></div></div>' +
    '<div class="card"><div class="ct">Comparativa cross-proyecto \xb7 ' + pks.length + ' proyecto' + (pks.length !== 1 ? 's' : '') + '</div>' +
    legendOrg +
    '<div style="position:relative;height:200px"><canvas id="maOrgChart"></canvas></div></div>' +
    '</div>';

  var defTable =
    '<div class="card" style="margin-bottom:16px"><div class="ct">Definici\xf3n m\xe9tricas MA \xb7 umbrales CMMI L3</div>' +
    '<div style="display:grid;grid-template-columns:80px 140px 1fr 1fr 100px;gap:8px;padding:6px 0 8px;border-bottom:1px solid var(--border2);font-size:10px;font-family:var(--mono);color:var(--muted);text-transform:uppercase">' +
    '<span>ID</span><span>Nombre</span><span>F\xf3rmula</span><span>Umbral</span><span>Tendencia</span></div>' +
    Object.entries(MA.metrics).map(function(pair) {
      var pmCode = pair[0], m = pair[1];
      var sc = SC[m.current_status] || 'var(--muted)';
      var tcolor = m.trend === 'improving' ? 'var(--green)' : m.trend === 'worsening' ? 'var(--red)' : 'var(--muted)';
      var ti = TI[m.trend] || '\u2192 stable';
      return '<div style="display:grid;grid-template-columns:80px 140px 1fr 1fr 100px;gap:8px;padding:9px 0;border-bottom:1px solid var(--border);font-size:11px;align-items:start">' +
        '<span style="font-family:var(--mono);font-weight:600;color:' + sc + '">' + pmCode + '</span>' +
        '<span>' + m.name + '</span>' +
        '<span style="font-size:10px;color:var(--dim);font-family:var(--mono)">' + (m.formula || '') + '</span>' +
        '<span style="font-size:10px;color:var(--muted)">' + (m.threshold_desc || '') + '</span>' +
        '<span style="color:' + tcolor + '">' + ti + '</span>' +
        '</div>';
    }).join('') + '</div>';

  var orgTable = '';
  if (ORG && ORG.org_baseline && pks.length > 0) {
    var cols = '80px 150px' + pks.map(function(){return ' 120px';}).join('') + ' 120px';
    orgTable =
      '<div class="card"><div class="ct">ORG Baseline Experis \xb7 ' + pks.length + ' proyecto' + (pks.length !== 1 ? 's' : '') + ' registrado' + (pks.length !== 1 ? 's' : '') + '</div>' +
      '<div style="display:grid;grid-template-columns:' + cols + ';gap:8px;padding:6px 0 8px;border-bottom:1px solid var(--border2);font-size:10px;font-family:var(--mono);color:var(--muted);text-transform:uppercase">' +
      '<span>M\xe9trica</span><span>Nombre</span>' + pks.map(function(pk){return '<span>' + pk + '</span>';}).join('') + '<span>ORG MEAN</span></div>' +
      Object.entries(ORG.org_baseline).map(function(pair) {
        var pmCode = pair[0], ob = pair[1];
        var u = ob.key && ob.key.includes('days') ? 'd' : ob.key && ob.key.includes('rate') ? '' : '%';
        return '<div style="display:grid;grid-template-columns:' + cols + ';gap:8px;padding:8px 0;border-bottom:1px solid var(--border);font-size:11px;align-items:center">' +
          '<span style="font-family:var(--mono);font-weight:600;color:var(--muted)">' + pmCode + '</span>' +
          '<span>' + (ob.name || '') + '</span>' +
          pks.map(function(pk) {
            var pd = ORG.projects[pk] && ORG.projects[pk][pmCode];
            if (!pd) return '<span style="color:var(--dim)">\u2014</span>';
            var psc = SC[pd.current_status] || 'var(--muted)';
            return '<span style="font-family:var(--mono);color:' + psc + '">' + pd.mean + u + '<br><span style="font-size:9px;color:var(--dim)">' + pd.current_status + ' \xb7 ' + (pd.trend || '') + '</span></span>';
          }).join('') +
          '<span style="font-family:var(--mono);font-weight:600;color:var(--purple)">' + (ob.org_mean !== undefined ? ob.org_mean + u : '\u2014') + '</span>' +
          '</div>';
      }).join('') + '</div>';
  }

  return '<div id="p-ma" class="panel">' + summary + metricCards + charts + defTable + orgTable + '</div>';
}
const MA_PANEL_HTML = buildMAPanel(MA, ORG);
`;

// Insertar antes de FULL_HISTORY
const MARKER1 = 'const FULL_HISTORY = buildFullHistory();';
if (!src.includes(MARKER1)) { console.error('[PATCH] ERROR: marker FULL_HISTORY no encontrado'); process.exit(1); }
src = src.replace(MARKER1, MA_BLOCK + '\n' + MARKER1);
console.log('[PATCH] 1/5 MA data loading + buildMAPanel() añadidos');

// ══════════════════════════════════════════════════════════════════════════
// BLOQUE 2: Tab button
// ══════════════════════════════════════════════════════════════════════════
const OLD_TAB = "  <div class=\"tab\" onclick=\"T('gates')\">Gates &amp; Pipeline</div>\n</div>";
const NEW_TAB = "  <div class=\"tab\" onclick=\"T('gates')\">Gates &amp; Pipeline</div>\n  <div class=\"tab\" onclick=\"T('ma')\">MA &amp; Baseline</div>\n</div>";

// La template puede tener & sin escape
const OLD_TAB2 = "  <div class=\"tab\" onclick=\"T('gates')\">Gates & Pipeline</div>\n</div>";
const NEW_TAB2 = "  <div class=\"tab\" onclick=\"T('gates')\">Gates & Pipeline</div>\n  <div class=\"tab\" onclick=\"T('ma')\">MA &amp; Baseline</div>\n</div>";

if (src.includes(OLD_TAB)) {
  src = src.replace(OLD_TAB, NEW_TAB);
  console.log('[PATCH] 2/5 Tab button añadido (versión &amp;)');
} else if (src.includes(OLD_TAB2)) {
  src = src.replace(OLD_TAB2, NEW_TAB2);
  console.log('[PATCH] 2/5 Tab button añadido (versión &)');
} else {
  console.error('[PATCH] ERROR: tab Gates marker no encontrado. Buscando alternativa...');
  // Fallback: buscar el cierre del div.tabs
  const TABS_RE = /(<div class="tab" onclick="T\('gates'\)">Gates[^<]*<\/div>\n)(<\/div>)/;
  if (TABS_RE.test(src)) {
    src = src.replace(TABS_RE, '$1  <div class="tab" onclick="T(\'ma\')">MA &amp; Baseline</div>\n$2');
    console.log('[PATCH] 2/5 Tab button añadido (regex fallback)');
  } else {
    console.error('[PATCH] ERROR: no se pudo añadir tab button'); process.exit(1);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// BLOQUE 3: Insertar panel MA antes del footer
// ══════════════════════════════════════════════════════════════════════════
const OLD_FOOTER = '\n<div class="footer">';
const NEW_FOOTER = '\n${MA_PANEL_HTML}\n\n<div class="footer">';
if (!src.includes(OLD_FOOTER)) { console.error('[PATCH] ERROR: footer marker no encontrado'); process.exit(1); }
src = src.replace(OLD_FOOTER, NEW_FOOTER);
console.log('[PATCH] 3/5 Panel MA insertado antes del footer');

// ══════════════════════════════════════════════════════════════════════════
// BLOQUE 4: Actualizar T() ids array
// ══════════════════════════════════════════════════════════════════════════
const OLD_T = "const ids=['exec','history','quality','roadmap','gobierno','gates'];";
const NEW_T = "const ids=['exec','history','quality','roadmap','gobierno','gates','ma'];";
if (!src.includes(OLD_T)) { console.error('[PATCH] ERROR: T() ids marker no encontrado'); process.exit(1); }
src = src.replace(OLD_T, NEW_T);
console.log('[PATCH] 4/5 T() ids actualizado con "ma"');

// ══════════════════════════════════════════════════════════════════════════
// BLOQUE 5: Charts MA (antes del </script> final)
// Nota: \${...} escapa la evaluación en este template literal del patch
//       y produce literalmente ${...} en el gen-global-dashboard.js,
//       donde sí se evaluará al generar el HTML.
// ══════════════════════════════════════════════════════════════════════════
const MA_CHARTS = `
// ── MA Baseline Charts — SOFIA v2.7 ──────────────────────────────────────────
(function() {
  var MA_D = \${JSON.stringify(MA)};
  var ORG_D = \${JSON.stringify(ORG)};
  if (!MA_D || !MA_D.metrics) return;
  var mm = MA_D.metrics;
  var labels = mm.PM001.history.map(function(h){return 'S'+h.sprint;});
  var tk = {color:C.muted,font:{size:9}};
  var gd = {color:C.grid};

  var tEl = document.getElementById('maTrendChart');
  if (tEl) {
    new Chart(tEl, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {data:mm.PM003.history.map(function(h){return h.value;}),borderColor:'#1D9E75',backgroundColor:'transparent',borderWidth:2,pointRadius:3,tension:0.3,yAxisID:'y'},
          {data:mm.PM004.history.map(function(h){return h.value;}),borderColor:'#534AB7',backgroundColor:'transparent',borderWidth:1.5,pointRadius:2,tension:0.3,yAxisID:'y',borderDash:[4,3]},
          {data:mm.PM005.history.map(function(h){return h.value;}),borderColor:'#4192e8',backgroundColor:'transparent',borderWidth:1.5,pointRadius:2,tension:0.3,yAxisID:'y',borderDash:[2,2]},
          {data:mm.PM001.history.map(function(h){return h.value;}),borderColor:'#f0a830',backgroundColor:'transparent',borderWidth:2,pointRadius:3,tension:0.3,yAxisID:'y1'}
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},
        scales:{
          x:{ticks:tk,grid:gd},
          y:{min:75,max:102,position:'left',ticks:{color:C.muted,font:{size:9},callback:function(v){return v+'%'}},grid:gd,
             title:{display:true,text:'review / test / cmmi %',color:C.muted,font:{size:8}}},
          y1:{min:0,max:15,position:'right',ticks:{color:C.muted,font:{size:9},callback:function(v){return v+'%'}},grid:{display:false},
              title:{display:true,text:'vel.var %',color:C.muted,font:{size:8}}}
        }
      }
    });
  }

  var oEl = document.getElementById('maOrgChart');
  if (oEl && ORG_D && ORG_D.projects) {
    var pks = Object.keys(ORG_D.projects);
    var pmc = ['PM001','PM003','PM004','PM005'];
    var pmLabels = [['PM001','Velocity'],['PM003','Review'],['PM004','Test eff.'],['PM005','CMMI']];
    new Chart(oEl, {
      type: 'bar',
      data: {
        labels: pmLabels,
        datasets: pks.map(function(pk,i) {
          return {
            label: pk,
            data: pmc.map(function(pm){var pd=ORG_D.projects[pk][pm];return pd?pd.mean:0;}),
            backgroundColor: ['#1D9E75','#7F77DD'][i%2]
          };
        })
      },
      options: {
        indexAxis:'y', responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},
        scales:{
          x:{min:0,max:100,ticks:{color:C.muted,font:{size:10},callback:function(v){return v+'%'}},grid:gd},
          y:{ticks:{color:C.muted,font:{size:10}},grid:gd}
        }
      }
    });
  }
})();
`;

// Insertar antes del último </script></body>
const OLD_END = '</script>\n</body>';
if (!src.includes(OLD_END)) { console.error('[PATCH] ERROR: end-of-script marker no encontrado'); process.exit(1); }
src = src.replace(OLD_END, MA_CHARTS + '</script>\n</body>');
console.log('[PATCH] 5/5 Chart.js MA initialization añadida');

// ══════════════════════════════════════════════════════════════════════════
// Escribir resultado
// ══════════════════════════════════════════════════════════════════════════
fs.writeFileSync(GEN, src, 'utf8');
console.log('\n[PATCH] gen-global-dashboard.js actualizado a v2.7+MA');
console.log('[PATCH] Resumen:');
console.log('  + MA data loading (MA, ORG desde .sofia/)');
console.log('  + buildMAPanel() — genera HTML de la pestaña');
console.log('  + MA_PANEL_HTML  — variable pre-computada');
console.log('  + Tab "MA & Baseline" en la barra de navegación');
console.log('  + Panel MA: KPIs + trend chart + org comparison + tablas');
console.log('  + T() ids incluye "ma"');
console.log('  + Chart.js: maTrendChart + maOrgChart');
