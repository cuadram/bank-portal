#!/usr/bin/env node
/**
 * la-sync.js — Distribución SOFIA-CORE → Proyecto
 * SOFIA v2.7+ | Step 1 — LA Core Sync
 * Script version: 1.1.0 (S06-F3-HOTFIX · ADR-009 overlay awareness · 2026-05-12)
 *
 * Uso:
 *   node la-sync.js                    # sync delta (solo LAs nuevas)
 *   node la-sync.js --full             # sync completo (todas las LAs CORE)
 *   node la-sync.js --check            # solo check de compliance, sin escribir
 *   node la-sync.js --report           # genera sync-report en docs/
 *   node la-sync.js --skills           # actualiza también los SKILL.md afectados
 *   node la-sync.js --skills-all       # sincroniza TODAS las skills CORE→proyecto por sha256 (Sprint S04 F3 B1)
 *   node la-sync.js --skills-all --no-create        # solo actualiza skills existentes en proyecto (no crea nuevas)
 *   node la-sync.js --skills-all --exclude=skill1,skill2   # excluye skills concretas
 *   node la-sync.js --skills-all --check            # dry-run: muestra delta sin escribir
 *
 * Sprint S06 F3 HOTFIX (D-S06-F3-HOTFIX · 2026-05-12):
 *   ADR-009 Skill Local Overlay awareness: skills con marker `overlay_of` en
 *   frontmatter NO son sobrescritos por --skills ni --skills-all. Resuelve
 *   H-S06-F3-1 (severity HIGH). Output incluye bloque OVERLAY_PRESERVED
 *   con skill name + decision_id. result.overlay_preserved persistido en
 *   session.audit_log.LA_SYNC_SKILLS_ALL.result para trazabilidad CMMI L3.
 *   Compatible hacia atras: syncSkills retorna mismo array, overlay info
 *   via property no-enumerable _overlay_preserved.
 *
 * Outputs:
 *   session.json              ← LAs CORE integradas en lessons_learned[]
 *   LESSONS_LEARNED.md        ← regenerado con LAs CORE marcadas
 *
 * Exit codes (SC-37 defensive parser · MINI-ADR-SC-37):
 *   0 → success (path feliz o WARNs no-fatales D2/D3)
 *   1 → error operacional general
 *   2 → FATAL: la_core_index entry con valor non-string (D1).
 *        Schema canonical es string-form em-dash. Ver LA-CORE-093 / SC-36.
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
// SC-153 (D-S24-G2-APPROVED): resolver SOFIA_CORE por env/config, no hardcode. Precedencia: env -> sofia-config.json.sofia_core_path -> fallback PROD.
function resolveSofiaCore() {
  if (process.env.SOFIA_CORE && fs.existsSync(process.env.SOFIA_CORE)) return fs.realpathSync(process.env.SOFIA_CORE);
  try {
    const _cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'sofia-config.json'), 'utf8'));
    if (_cfg.sofia_core_path && fs.existsSync(_cfg.sofia_core_path)) return fs.realpathSync(_cfg.sofia_core_path);
  } catch (_) {}
  return '/Users/cuadram/proyectos/SOFIA-CORE-PROD';
}
const SOFIA_CORE = resolveSofiaCore();
const PROJECT_ROOT   = process.cwd();
const SOFIA_DIR      = path.join(PROJECT_ROOT, '.sofia');
const SESSION_PATH   = path.join(SOFIA_DIR, 'session.json');
const SYNC_STATE_PATH = path.join(SOFIA_DIR, 'la-sync-state.json');
const LL_PATH        = path.join(PROJECT_ROOT, 'LESSONS_LEARNED.md');

// ── GUARDRAIL anti-self-execution (LA-CORE candidata Sprint S01 Step 8) ────
// la-sync.js NO debe ejecutarse sobre el propio SOFIA-CORE.
// SOFIA-CORE ES la fuente, no destino. Ejecutarse aqui contamina el estado
// e infringe GR-CORE-026 (CONTEXT-ISOLATION).
//
// Sprint S06 F3 HOTFIX (D-S06-F3-HOTFIX) · defense-in-depth refactor:
// - Guard extraido a funcion `assertNotSelfExecution()` invocable bajo demanda.
// - Invocado en `main()` (preserva defensa CLI original · mismo behavior).
// - Invocado en `syncSkills()` y `syncAllSkills()` (defensa secundaria contra
//   uso programatico via require() · funciones write criticas).
// - `hasOverlayMarker()` queda exento (read-only · safe en cualquier cwd).
function realpath(p) {
  try { return fs.realpathSync(p); } catch { return path.resolve(p); }
}
function assertNotSelfExecution() {
  if (realpath(PROJECT_ROOT) === realpath(SOFIA_CORE)) {
    console.error('');
    console.error('🛑 ERROR · GR-CORE-026 (CONTEXT-ISOLATION):');
    console.error('   la-sync.js NO debe ejecutarse desde SOFIA-CORE.');
    console.error('   SOFIA-CORE es la FUENTE de LAs, no destino.');
    console.error('   Ejecutar desde un proyecto cliente (bank-portal, experis-tracker, takeover, etc.)');
    console.error('');
    console.error(`   cwd actual: ${PROJECT_ROOT}`);
    console.error(`   SOFIA_CORE: ${SOFIA_CORE}`);
    console.error('');
    process.exit(2);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  // Flag --la <ID> permite filtrar a una LA específica (Sprint S01 Step 8)
  const laFlagIdx = args.indexOf('--la');
  const laFilter = (laFlagIdx >= 0 && args[laFlagIdx + 1]) ? args[laFlagIdx + 1] : null;
  // Flag --exclude <csv-list> · acepta '--exclude X,Y' (espacio) o '--exclude=X,Y' (con =) [Sprint S04 F3 B1]
  let excludeValue = null;
  // Buscar --exclude=VAL (forma con =)
  const exEqArg = args.find(a => a.startsWith('--exclude='));
  if (exEqArg) {
    excludeValue = exEqArg.substring('--exclude='.length);
  } else {
    // Buscar --exclude VAL (forma con espacio)
    const exFlagIdx = args.indexOf('--exclude');
    if (exFlagIdx >= 0 && args[exFlagIdx + 1]) {
      excludeValue = args[exFlagIdx + 1];
    }
  }
  const exclude = excludeValue
    ? excludeValue.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  return {
    full:       args.includes('--full'),
    check:      args.includes('--check'),
    report:     args.includes('--report'),
    skills:     args.includes('--skills'),
    skillsAll:  args.includes('--skills-all'),    // Sprint S04 F3 B1 · sync por sha256 CORE→proyecto independiente de LAs
    noCreate:   args.includes('--no-create'),     // Sprint S04 F3 B1 · solo actualiza skills existentes en proyecto
    exclude:    exclude,                          // Sprint S04 F3 B1 · lista skills a excluir
    la:         laFilter,
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

// ── Parser defensivo de la_core_index (SC-37 · MINI-ADR-SC-37) ────────────
// Defensas D1/D2/D3 contra variaciones de schema en MANIFEST.la_core_index.
// Schema canonical: string-form em-dash · "type — descripción corta" (LA-CORE-093).
function parseLaCoreEntryDefensive(id, desc) {
  // D1: valor non-string → fail-fast con exit 2
  if (typeof desc !== 'string') {
    console.error(
      `[la-sync] FATAL: la_core_index entry "${id}" has non-string value ` +
      `(type=${typeof desc}). Schema canonical is string-form em-dash. ` +
      `See LA-CORE-093 / LA-cand-1 SC-36.`
    );
    process.exit(2);
  }
  // Camino feliz: separador canónico ' — ' (em-dash con espacios)
  if (desc.includes(' — ')) {
    const parts = desc.split(' — ');
    return {
      type: parts[0] || 'process',
      description: parts.slice(1).join(' — '),
      legacy_separator: false,
    };
  }
  // D3: separador legacy '-' (guion simple), heurística split por primer ' - '
  if (desc.includes(' - ')) {
    const parts = desc.split(' - ');
    console.warn(
      `[la-sync] WARN: la_core_index entry "${id}" uses legacy separator ` +
      `'-' (expected em-dash ' — '). Slug extracted heuristically. ` +
      `See LA-CORE-093 / SC-39 re-emission.`
    );
    return {
      type: parts[0] || 'process',
      description: parts.slice(1).join(' - '),
      legacy_separator: true,
    };
  }
  // D2: sin separador detectable. Extraer slug por ':' o '(' como fallback
  console.warn(
    `[la-sync] WARN: la_core_index entry "${id}" missing canonical em-dash ` +
    `separator. Slug extracted heuristically. See LA-CORE-093 / SC-39 re-emission.`
  );
  let type = 'process';
  if (desc.includes(':')) type = desc.split(':')[0].trim() || 'process';
  else if (desc.includes('(')) type = desc.split('(')[0].trim() || 'process';
  return {
    type,
    description: '',
    legacy_separator: false,
  };
}

// ── Parsear LAs del MANIFEST la_core_index ────────────────────────────────
function buildCoreLAs(manifest) {
  const index = manifest.la_core_index || {};
  return Object.entries(index).map(([id, desc]) => {
    const parsed = parseLaCoreEntryDefensive(id, desc);
    return {
      id,
      type: parsed.type,
      description: parsed.description,
      legacy_separator: parsed.legacy_separator,
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

  // Filtro por LA específica (--la <ID>) - Sprint S01 Step 8
  if (opts.la) {
    const filtered = coreLAs.filter(la => la.id === opts.la);
    if (filtered.length === 0) {
      console.error(`⚠️  --la ${opts.la}: no encontrada en MANIFEST.la_core_index`);
      process.exit(3);
    }
    return filtered;
  }

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
  // GR-CORE-026 defense-in-depth · S06-F3-HOTFIX · write function critica
  assertNotSelfExecution();
  const updated = [];
  // HOTFIX S06-F3 (D-S06-F3-HOTFIX) · ADR-009 R5/R7 awareness · Q-HOTFIX-4=beta
  // Backward-compatible: return shape sigue siendo array (updated skills).
  // Skills con overlay_of declarado se acumulan en _overlay_preserved (no-enumerable)
  // para que el caller pueda inspeccionar sin romper consumidores legacy.
  const overlayPreserved = [];
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
      // HOTFIX S06-F3: pre-overwrite overlay check
      const overlayInfo = hasOverlayMarker(projDst);
      if (overlayInfo.overlay) {
        overlayPreserved.push({ skill, decision_id: overlayInfo.decisionId });
        continue;
      }
      const coreTime = fs.statSync(coreSrc).mtimeMs;
      const projTime = fs.statSync(projDst).mtimeMs;
      if (coreTime > projTime) {
        fs.copyFileSync(coreSrc, projDst);
        updated.push(skill);
      }
    }
  }
  // Attach overlay preservation info as non-enumerable side-channel for caller
  Object.defineProperty(updated, '_overlay_preserved', {
    value: overlayPreserved, enumerable: false, writable: false, configurable: false
  });
  return updated;
}

// ── Sprint S04 F3 B1: sync de TODAS las skills CORE→proyecto (independiente de LAs) ─
function sha256File(filepath) {
  return require('crypto').createHash('sha256').update(fs.readFileSync(filepath)).digest('hex');
}

// ── Sprint S06 F3 HOTFIX (D-S06-F3-HOTFIX) · ADR-009 Skill Local Overlay awareness ─
// Detecta si el skill destino tiene marker `overlay_of` en su frontmatter YAML.
// Si presente → el skill es un overlay declarado bajo ADR-009 y NO debe ser
// sobrescrito por la-sync.js (regla R5/R7 de ADR-009 aplicada en código).
// Lectura mínima: primeras ~80 líneas del fichero para encontrar el bloque
// frontmatter (delimitado por `---` ... `---` al inicio del fichero).
// Decisión Q-HOTFIX-1=α: marker mínimo `overlay_of` (key:value), no requiere
// los 3 markers de ADR-009 R5. Resuelve H-S06-F3-1 (severity HIGH).
function hasOverlayMarker(skillPath) {
  if (!fs.existsSync(skillPath)) return { overlay: false, decisionId: null };
  try {
    const head = fs.readFileSync(skillPath, 'utf8').split('\n').slice(0, 80).join('\n');
    if (!head.startsWith('---')) return { overlay: false, decisionId: null };
    const fmEnd = head.indexOf('\n---', 3);
    const fm = fmEnd >= 0 ? head.substring(3, fmEnd) : head;
    // Matcher robusto: 'overlay_of:' al inicio de linea, ignorando whitespace
    const hasOverlay = /^overlay_of\s*:/m.test(fm);
    if (!hasOverlay) return { overlay: false, decisionId: null };
    // Capturar decision_id si presente para logging
    const decMatch = fm.match(/^overlay_decision_id\s*:\s*(.+)$/m);
    const decisionId = decMatch ? decMatch[1].trim() : 'unspecified';
    return { overlay: true, decisionId };
  } catch (e) {
    // Defensa: si falla la lectura, asumir NO overlay (no bloquear sync)
    return { overlay: false, decisionId: null };
  }
}

function syncAllSkills(opts) {
  // GR-CORE-026 defense-in-depth · S06-F3-HOTFIX · write function critica
  assertNotSelfExecution();
  const result = { created: [], updated: [], identical: [], excluded: [], no_create_skipped: [], overlay_preserved: [] };
  const excluded = new Set(opts.exclude || []);

  const coreSkillsDir = path.join(SOFIA_CORE, 'skills');
  if (!fs.existsSync(coreSkillsDir)) {
    console.error(`  🛑 ERROR · SOFIA-CORE skills dir no encontrado: ${coreSkillsDir}`);
    return result;
  }

  const skillNames = fs.readdirSync(coreSkillsDir)
    .filter(d => {
      const dPath = path.join(coreSkillsDir, d);
      return fs.statSync(dPath).isDirectory() && fs.existsSync(path.join(dPath, 'SKILL.md'));
    })
    .sort();

  for (const skill of skillNames) {
    if (excluded.has(skill)) {
      result.excluded.push(skill);
      continue;
    }
    const coreSrc = path.join(SOFIA_CORE, 'skills', skill, 'SKILL.md');
    const projDst = path.join(SOFIA_DIR, 'skills', skill, 'SKILL.md');

    if (!fs.existsSync(projDst)) {
      if (opts.noCreate) {
        result.no_create_skipped.push(skill);
        continue;
      }
      if (!opts.check) {
        fs.mkdirSync(path.dirname(projDst), { recursive: true });
        fs.copyFileSync(coreSrc, projDst);
      }
      result.created.push(skill);
      continue;
    }

    const coreSha = sha256File(coreSrc);
    const projSha = sha256File(projDst);
    if (coreSha !== projSha) {
      // HOTFIX S06-F3 (D-S06-F3-HOTFIX) · ADR-009 R5/R7 awareness
      // Q-HOTFIX-1=alpha · Q-HOTFIX-2=alpha · Q-HOTFIX-3=beta · Q-HOTFIX-4=beta
      // Si destino tiene overlay_of declarado, NO sobrescribir (preserva extension cliente).
      const overlayInfo = hasOverlayMarker(projDst);
      if (overlayInfo.overlay) {
        result.overlay_preserved.push({ skill, decision_id: overlayInfo.decisionId });
        continue;
      }
      if (!opts.check) {
        fs.copyFileSync(coreSrc, projDst);
      }
      result.updated.push(skill);
    } else {
      result.identical.push(skill);
    }
  }

  return result;
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
  // GR-CORE-026 defense at CLI entry-point (preserva behavior original load-time)
  assertNotSelfExecution();
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

  if (opts.check && !opts.skillsAll) {
    // En modo --check puro (sin --skills-all), se detiene aquí.
    // Si está --skills-all, deja seguir para mostrar el delta de skills sync.
    console.log('  ℹ️  Modo --check: no se han escrito cambios (LAs).');
    console.log('');
    return;
  }

  if (opts.check && opts.skillsAll) {
    console.log('  ℹ️  Modo --check: no se escribirán LAs ni se modificarán session.json/LESSONS_LEARNED.md.');
    console.log('     Continuando con --skills-all dry-run analysis...');
    console.log('');
  }

  // Bloque LA-sync (NO ejecuta si --check, incluso con --skills-all)
  if (newLAs.length > 0 && !opts.check) {
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
      // HOTFIX S06-F3 (D-S06-F3-HOTFIX) · ADR-009 overlay preservation · modo --skills legacy
      const overlayPreserved = updated._overlay_preserved || [];
      if (overlayPreserved.length > 0) {
        console.log(`  ⚠️  OVERLAY_PRESERVED (ADR-009 R5/R7): ${overlayPreserved.length} skill(s) skipped:`);
        for (const o of overlayPreserved) {
          console.log(`     ⊘ ${o.skill}  ·  decision_id=${o.decision_id}`);
        }
      }
    }
  }

  // 3.bis · Sprint S04 F3 B1 · --skills-all: sincronizar TODAS las skills CORE→proyecto
  // (independiente de LAs nuevas · útil cuando F2/F3 muta frontmatter sin crear LAs)
  let skillsAllResult = null;
  if (opts.skillsAll) {
    skillsAllResult = syncAllSkills(opts);
    console.log('');
    console.log('  ─── --skills-all (Sprint S04 F3) ───');
    if (opts.check) {
      console.log(`  ℹ️  Modo --check: análisis sin escritura`);
    }
    if (skillsAllResult.created.length > 0) {
      console.log(`  📦 ${opts.check ? 'WOULD CREATE' : 'CREATED'}: ${skillsAllResult.created.length} skill(s)`);
      for (const s of skillsAllResult.created) console.log(`     + ${s}`);
    }
    if (skillsAllResult.updated.length > 0) {
      console.log(`  🔄 ${opts.check ? 'WOULD UPDATE' : 'UPDATED'}: ${skillsAllResult.updated.length} skill(s)`);
      for (const s of skillsAllResult.updated) console.log(`     ~ ${s}`);
    }
    if (skillsAllResult.identical.length > 0) {
      console.log(`  ✓ IDENTICAL: ${skillsAllResult.identical.length} skill(s) (no action needed)`);
    }
    if (skillsAllResult.excluded.length > 0) {
      console.log(`  ⊘ EXCLUDED (--exclude): ${skillsAllResult.excluded.length} skill(s) → ${skillsAllResult.excluded.join(', ')}`);
    }
    if (skillsAllResult.no_create_skipped.length > 0) {
      console.log(`  ⊘ SKIPPED (--no-create active, missing in project): ${skillsAllResult.no_create_skipped.length} skill(s) → ${skillsAllResult.no_create_skipped.join(', ')}`);
    }
    // HOTFIX S06-F3 (D-S06-F3-HOTFIX) · ADR-009 overlay preservation · Q-HOTFIX-3=beta WARN
    if (skillsAllResult.overlay_preserved && skillsAllResult.overlay_preserved.length > 0) {
      console.log('');
      console.log(`  ⚠️  OVERLAY_PRESERVED (ADR-009 R5/R7): ${skillsAllResult.overlay_preserved.length} skill(s) skipped to protect local overlay:`);
      for (const o of skillsAllResult.overlay_preserved) {
        console.log(`     ⊘ ${o.skill}  ·  decision_id=${o.decision_id}`);
      }
      console.log(`     Drift CORE vs overlay detected · cliente declara extension legitima.`);
      console.log(`     Para sobrescribir intencionalmente: editar marker overlay_of en destino o usar flag --force-overlay-overwrite (no implementado · ADR-009 R5/R7 estricto).`);
    }
    console.log('');
  }

  // 4. Actualizar sync state (skip en --check)
  if (!opts.check) {
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
  }

  // 5. Reporte (si --report o siempre en modo CI · skip en --check)
  if (!opts.check && (opts.report || newLAs.length > 0)) {
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
  // Sprint S04 F3 B1 · persistir audit_log entry en session.json del proyecto cliente
  // (solo si NO --check · captura created/updated/excluded para trazabilidad)
  if (opts.skillsAll && skillsAllResult && !opts.check) {
    try {
      const sessLatest = loadJSON(SESSION_PATH);
      if (sessLatest) {
        sessLatest.audit_log = sessLatest.audit_log || [];
        sessLatest.audit_log.push({
          timestamp: new Date().toISOString(),
          action: 'LA_SYNC_SKILLS_ALL',
          sofia_core_version: manifest.sofia_core_version,
          sofia_core_manifest_version: manifest.version || manifest.sofia_core_version,
          flags_used: {
            skills_all: true,
            no_create: opts.noCreate,
            exclude: opts.exclude || [],
          },
          result: {
            created: skillsAllResult.created,
            updated: skillsAllResult.updated,
            identical_count: skillsAllResult.identical.length,
            excluded: skillsAllResult.excluded,
            no_create_skipped: skillsAllResult.no_create_skipped,
            overlay_preserved: skillsAllResult.overlay_preserved || [],
          },
        });
        fs.writeFileSync(SESSION_PATH, JSON.stringify(sessLatest, null, 2));
        console.log(`  ✅ audit_log entry persistida en session.json (LA_SYNC_SKILLS_ALL)`);
      }
    } catch (e) {
      console.error(`  ⚠️  No se pudo persistir audit_log entry: ${e.message}`);
    }
  }

  console.log(`  ✅ GR-CORE-029: la-sync ejecutado — G-1 desbloqueado.`);
  console.log('');
}

// Sprint S06 F3 HOTFIX (D-S06-F3-HOTFIX) · Q-TEST-1=alpha
// Backward compatible: CLI funciona idéntico (node la-sync.js → main()).
// Cuando se requiere desde test, expone module.exports sin ejecutar main().
if (require.main === module) {
  main();
} else {
  module.exports = {
    hasOverlayMarker,
    syncAllSkills,
    syncSkills,
    sha256File,
    assertNotSelfExecution,
  };
}
