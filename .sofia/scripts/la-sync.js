#!/usr/bin/env node
/**
 * la-sync.js — Distribución SOFIA-CORE → Proyecto
 * SOFIA v2.7+ | Step 1 — LA Core Sync
 *
 * Uso:
 *   node la-sync.js                    # sync delta (solo LAs nuevas)
 *   node la-sync.js --full             # sync completo (todas las LAs CORE)
 *   node la-sync.js --check            # solo check de compliance, sin escribir
 *   node la-sync.js --report           # genera sync-report en docs/
 *   node la-sync.js --skills           # actualiza también los SKILL.md afectados
 *
 * Outputs:
 *   session.json              ← LAs CORE integradas en lessons_learned[]
 *   LESSONS_LEARNED.md        ← regenerado con LAs CORE marcadas
 *   .sofia/la-sync-state.json ← estado de sincronización (last_sync, imported[])
 *   docs/quality/LA-SYNC-REPORT-SXX.md ← evidencia de ejecución (con --report)
 *   .sofia/skills/{skill}/SKILL.md      ← actualizado (con --skills)
 *
 * GR-CORE-029: G-1 bloqueado si last_sync_at < inicio de sesión actual.
 */

'use strict';
const fs   = require('fs');
const path = require('path');

// ── Configuración ──────────────────────────────────────────────────────────
const SOFIA_CORE     = '/Users/cuadram/Library/CloudStorage/OneDrive-Personal/WIP/SOFIA-CORE';
const PROJECT_ROOT   = process.cwd();
const SOFIA_DIR      = path.join(PROJECT_ROOT, '.sofia');
const SESSION_PATH   = path.join(SOFIA_DIR, 'session.json');
const SYNC_STATE_PATH = path.join(SOFIA_DIR, 'la-sync-state.json');
const LL_PATH        = path.join(PROJECT_ROOT, 'LESSONS_LEARNED.md');

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    full:   args.includes('--full'),
    check:  args.includes('--check'),
    report: args.includes('--report'),
    skills: args.includes('--skills'),
  };
}

// ── Loaders ────────────────────────────────────────────────────────────────
function loadJSON(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadSession() {
  const s = loadJSON(SESSION_PATH);
  if (!s) { console.error(`ERROR: session.json no encontrado en ${SESSION_PATH}`); process.exit(1); }
  return s;
}

function loadSyncState() {
  return loadJSON(SYNC_STATE_PATH) || {
    last_sync_at: null,
    last_core_version: null,
    imported_la_ids: [],
    skipped_la_ids: [],
    sync_history: [],
  };
}

function loadManifest() {
  const mp = path.join(SOFIA_CORE, 'MANIFEST.json');
  const m  = loadJSON(mp);
  if (!m) { console.error(`ERROR: MANIFEST.json no encontrado en ${SOFIA_CORE}`); process.exit(1); }
  return m;
}

function loadCoreLL() {
  const p = path.join(SOFIA_CORE, 'LESSONS_LEARNED_CORE.md');
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf8');
}

// ── Parsear LAs del MANIFEST la_core_index ────────────────────────────────
function buildCoreLAs(manifest) {
  const index = manifest.la_core_index || {};
  return Object.entries(index).map(([id, desc]) => {
    // desc: "type — descripción corta"
    const parts = desc.split(' — ');
    const type  = parts[0] || 'process';
    const shortDesc = parts.slice(1).join(' — ');
    return {
      id,
      type,
      description: shortDesc,
      correction: `Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.`,
      scope: 'SOFIA-CORE',
      source: 'promoted',
      sofia_core_version: manifest.sofia_core_version,
      imported_at: new Date().toISOString(),
    };
  });
}

// ── Determinar qué LAs son nuevas para este proyecto ──────────────────────
function computeDelta(coreLAs, session, syncState, opts) {
  const existingIds = new Set([
    ...(session.lessons_learned || []).map(la => la.id),
    ...syncState.imported_la_ids,
  ]);

  if (opts.full) {
    // En modo full, reimportar todas aunque ya estén (actualizar)
    return coreLAs;
  }

  return coreLAs.filter(la => !existingIds.has(la.id));
}

// ── Mapeo tipo LA → skill afectado ────────────────────────────────────────
const TYPE_SKILL_MAP = {
  'frontend':     'angular-developer',
  'backend':      'java-developer',
  'process':      'orchestrator',
  'testing':      'qa-tester',
  'security':     'security-agent',
  'devops':       'devops',
  'code-review':  'code-reviewer',
  'architecture': 'architect',
  'dashboard':    'workflow-manager',
  'governance':   'orchestrator',
  'database':     'java-developer',
  'config':       'devops',
  'analysis':     'fa-agent',
};

// ── Compliance check: ¿el proyecto ya aplica la regla? ────────────────────
function checkCompliance(la, projectRoot) {
  // Heurísticas por tipo
  const checks = [];

  if (la.type === 'frontend' && la.id === 'LA-023-01') {
    // Buscar [href] en componentes Angular
    try {
      const result = require('child_process').execSync(
        `grep -r "\\[href\\]" ${projectRoot}/frontend-portal/src/app 2>/dev/null | grep -v ".spec.ts" | head -5`,
        { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }
      );
      if (result.trim()) {
        checks.push({ status: 'VIOLATION', detail: `[href] encontrado: ${result.trim().substring(0,100)}` });
      } else {
        checks.push({ status: 'COMPLIANT', detail: 'No se encontró [href] en componentes Angular' });
      }
    } catch { checks.push({ status: 'UNKNOWN', detail: 'No se pudo ejecutar grep' }); }
  }

  if (la.type === 'devops' && la.correction && la.correction.includes('ON CONFLICT')) {
    checks.push({ status: 'INFO', detail: 'Verificar manualmente migrations Flyway con seeds de IDs fijos' });
  }

  return checks.length > 0 ? checks : [{ status: 'UNKNOWN', detail: 'Sin check automático para este tipo' }];
}

// ── Integrar LAs en session.json ──────────────────────────────────────────
function integrateIntoSession(session, newLAs) {
  if (!session.lessons_learned) session.lessons_learned = [];

  for (const la of newLAs) {
    // En modo full: actualizar si ya existe
    const existingIdx = session.lessons_learned.findIndex(x => x.id === la.id);
    if (existingIdx >= 0) {
      session.lessons_learned[existingIdx] = { ...session.lessons_learned[existingIdx], ...la };
    } else {
      session.lessons_learned.push(la);
    }
  }

  session.updated_at = new Date().toISOString();
  return session;
}

// ── Regenerar LESSONS_LEARNED.md ──────────────────────────────────────────
function regenLessonsLearned(session) {
  const las = session.lessons_learned || [];
  const projectLAs = las.filter(la => la.scope !== 'SOFIA-CORE');
  const coreLAs    = las.filter(la => la.scope === 'SOFIA-CORE');

  let md = `# LESSONS LEARNED — ${session.project || 'Proyecto'}\n\n`;
  md += `> Generado: ${new Date().toISOString()} | Total: ${las.length} LAs\n`;
  md += `> LAs proyecto: ${projectLAs.length} | LAs SOFIA-CORE integradas: ${coreLAs.length}\n\n`;

  if (projectLAs.length > 0) {
    md += `## LAs del Proyecto\n\n`;
    for (const la of projectLAs) {
      md += `### ${la.id} · ${la.type || ''}\n\n`;
      md += `**Descripción:** ${la.description || ''}\n\n`;
      if (la.correction) md += `**Corrección:** ${la.correction}\n\n`;
      if (la.registered_at) md += `_Registrada: ${la.registered_at}_\n\n`;
      md += `---\n\n`;
    }
  }

  if (coreLAs.length > 0) {
    md += `## LAs SOFIA-CORE Integradas\n\n`;
    md += `> Estas LAs han sido promovidas desde otros proyectos y aprobadas por el PO.\n`;
    md += `> Son de aplicación obligatoria en todos los proyectos SOFIA.\n\n`;
    for (const la of coreLAs) {
      md += `### ${la.id} · ${la.type || ''} ⭐ CORE\n\n`;
      md += `**Descripción:** ${la.description || ''}\n\n`;
      if (la.correction) md += `**Corrección:** ${la.correction}\n\n`;
      md += `_SOFIA-CORE v${la.sofia_core_version || '?'} · Importada: ${la.imported_at || '?'}_\n\n`;
      md += `---\n\n`;
    }
  }

  fs.writeFileSync(LL_PATH, md, 'utf8');
}

// ── Actualizar SKILL.md afectados ─────────────────────────────────────────
function syncSkills(newLAs) {
  const updated = [];
  for (const la of newLAs) {
    const skill = TYPE_SKILL_MAP[la.type];
    if (!skill) continue;

    // Skill en SOFIA-CORE
    const coreSrc = path.join(SOFIA_CORE, 'skills', skill, 'SKILL.md');
    if (!fs.existsSync(coreSrc)) continue;

    // Skill en proyecto
    const projDst = path.join(SOFIA_DIR, 'skills', skill, 'SKILL.md');
    if (!fs.existsSync(path.dirname(projDst))) {
      fs.mkdirSync(path.dirname(projDst), { recursive: true });
    }

    // Solo copiar si el de SOFIA-CORE es más nuevo o no existe en proyecto
    if (!fs.existsSync(projDst)) {
      fs.copyFileSync(coreSrc, projDst);
      updated.push(skill);
    } else {
      const coreTime = fs.statSync(coreSrc).mtimeMs;
      const projTime = fs.statSync(projDst).mtimeMs;
      if (coreTime > projTime) {
        fs.copyFileSync(coreSrc, projDst);
        updated.push(skill);
      }
    }
  }
  return updated;
}

// ── Generar sync report ───────────────────────────────────────────────────
function generateReport(session, newLAs, complianceResults, skillsUpdated, manifest, opts) {
  const sprint = session.current_sprint || '?';
  const reportDir = path.join(PROJECT_ROOT, 'docs', 'quality');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });

  const reportPath = path.join(reportDir, `LA-SYNC-REPORT-S${sprint}.md`);
  const ts = new Date().toISOString();

  let md = `# LA-SYNC Report — Sprint ${sprint}\n\n`;
  md += `| Campo | Valor |\n|---|---|\n`;
  md += `| Timestamp | ${ts} |\n`;
  md += `| Proyecto | ${session.project || path.basename(PROJECT_ROOT)} |\n`;
  md += `| SOFIA-CORE versión | ${manifest.sofia_core_version} |\n`;
  md += `| LAs CORE disponibles | ${Object.keys(manifest.la_core_index || {}).length} |\n`;
  md += `| LAs nuevas importadas | ${newLAs.length} |\n`;
  md += `| Skills actualizados | ${skillsUpdated.length} |\n`;
  md += `| Modo | ${opts.full ? 'FULL' : 'DELTA'} |\n\n`;

  if (newLAs.length === 0) {
    md += `## Resultado\n\n✅ Proyecto al día. No hay LAs nuevas en SOFIA-CORE.\n\n`;
  } else {
    md += `## LAs Importadas\n\n`;
    for (const la of newLAs) {
      const compliance = complianceResults[la.id] || [];
      const cStatus = compliance.map(c => `${c.status}: ${c.detail}`).join('; ');
      md += `### ${la.id} · ${la.type}\n`;
      md += `- **Descripción:** ${la.description.substring(0, 120)}\n`;
      md += `- **Compliance check:** ${cStatus || 'N/A'}\n\n`;
    }
  }

  if (skillsUpdated.length > 0) {
    md += `## Skills Actualizados\n\n`;
    for (const s of skillsUpdated) md += `- \`${s}\`\n`;
    md += `\n`;
  }

  md += `---\n_GR-CORE-029: este reporte es evidencia obligatoria de ejecución de la-sync en Step 1._\n`;

  fs.writeFileSync(reportPath, md, 'utf8');
  return reportPath;
}

// ── Main ───────────────────────────────────────────────────────────────────
function main() {
  const opts    = parseArgs();
  const session = loadSession();
  const state   = loadSyncState();
  const manifest = loadManifest();

  const coreLAs  = buildCoreLAs(manifest);
  const newLAs   = computeDelta(coreLAs, session, state, opts);

  const ts = new Date().toISOString();

  // ── Output header ────────────────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║      SOFIA-CORE · LA Sync — Step 1 (GR-CORE-029)              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Proyecto:    ${session.project || path.basename(PROJECT_ROOT)}`);
  console.log(`  SOFIA-CORE:  v${manifest.sofia_core_version}  |  LAs en core: ${coreLAs.length}`);
  console.log(`  Modo:        ${opts.full ? 'FULL' : 'DELTA'}${opts.check ? ' (solo check, sin escritura)' : ''}`);
  console.log(`  LAs nuevas:  ${newLAs.length}`);
  console.log('');

  if (newLAs.length === 0) {
    console.log('  ✅ Proyecto al día con SOFIA-CORE. No hay LAs nuevas.');
    console.log(`     Última sync: ${state.last_sync_at || 'nunca'}`);
    console.log(`     LAs ya importadas: ${state.imported_la_ids.length}`);
  } else {
    console.log(`  📥 Importando ${newLAs.length} LAs desde SOFIA-CORE:`);
    console.log('');
  }

  const complianceResults = {};
  const skillsUpdated = [];

  for (const la of newLAs) {
    const compliance = checkCompliance(la, PROJECT_ROOT);
    complianceResults[la.id] = compliance;
    const cIcon = compliance[0]?.status === 'COMPLIANT' ? '✅' :
                  compliance[0]?.status === 'VIOLATION' ? '🔴' : '🔵';

    console.log(`  ${cIcon} ${la.id} [${la.type}]`);
    console.log(`     ${la.description.substring(0, 90)}${la.description.length > 90 ? '...' : ''}`);
    console.log(`     Compliance: ${compliance.map(c => c.status + ': ' + c.detail.substring(0,60)).join(' | ')}`);
    console.log('');
  }

  if (opts.check) {
    console.log('  ℹ️  Modo --check: no se han escrito cambios.');
    console.log('');
    return;
  }

  if (newLAs.length > 0) {
    // 1. Integrar en session.json
    const updatedSession = integrateIntoSession(session, newLAs);
    fs.writeFileSync(SESSION_PATH, JSON.stringify(updatedSession, null, 2));
    console.log(`  ✅ session.json actualizado (+${newLAs.length} LAs)`);

    // 2. Regenerar LESSONS_LEARNED.md
    regenLessonsLearned(updatedSession);
    console.log(`  ✅ LESSONS_LEARNED.md regenerado`);

    // 3. Skills (si --skills)
    if (opts.skills) {
      const updated = syncSkills(newLAs);
      skillsUpdated.push(...updated);
      if (updated.length > 0) {
        console.log(`  ✅ Skills actualizados: ${updated.join(', ')}`);
      }
    }
  }

  // 4. Actualizar sync state
  const newImported = [...new Set([
    ...state.imported_la_ids,
    ...newLAs.map(la => la.id),
  ])];

  const newState = {
    last_sync_at: ts,
    last_core_version: manifest.sofia_core_version,
    imported_la_ids: newImported,
    skipped_la_ids: state.skipped_la_ids || [],
    sync_history: [
      ...(state.sync_history || []),
      {
        synced_at: ts,
        core_version: manifest.sofia_core_version,
        new_las: newLAs.map(la => la.id),
        skills_updated: skillsUpdated,
        mode: opts.full ? 'full' : 'delta',
      }
    ].slice(-20), // mantener últimas 20 entradas
  };
  fs.writeFileSync(SYNC_STATE_PATH, JSON.stringify(newState, null, 2));
  console.log(`  ✅ .sofia/la-sync-state.json actualizado`);

  // 5. Reporte (si --report o siempre en modo CI)
  if (opts.report || newLAs.length > 0) {
    const reportPath = generateReport(session, newLAs, complianceResults, skillsUpdated, manifest, opts);
    console.log(`  ✅ Reporte: ${path.relative(PROJECT_ROOT, reportPath)}`);
  }

  console.log('');
  console.log('  ─────────────────────────────────────────────────────────────────');
  if (newLAs.length > 0) {
    const violations = Object.values(complianceResults).flat().filter(c => c.status === 'VIOLATION');
    if (violations.length > 0) {
      console.log(`  ⚠️  ATENCIÓN: ${violations.length} violación(es) detectada(s).`);
      console.log('      Crear DEBT técnica para cada violación antes de G-1.');
    } else {
      console.log('  ✅ Sin violaciones detectadas en compliance check automático.');
    }
  }
  console.log(`  ✅ GR-CORE-029: la-sync ejecutado — G-1 desbloqueado.`);
  console.log('');
}

main();
