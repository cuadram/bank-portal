#!/usr/bin/env node
/**
 * SOFIA v2.2 — Packaging Script
 * Genera dist/sofia-deploy-v2.2.zip con todas las capacidades del sistema.
 *
 * Uso:
 *   node .sofia/scripts/package-sofia-v2.2.js
 *
 * Novedades v2.2 vs v2.1:
 *   - LESSONS_LEARNED.md — registro canónico de lecciones aprendidas
 *   - gen-global-dashboard.js — FULL_HISTORY dinámico desde fa-index.json (LA-DASH-001)
 *   - fa-agent/SKILL.md — regla LA-FA-001: total_functionalities siempre dinámico
 *   - PERSISTENCE_PROTOCOL.md v1.7 — sección Lecciones Aprendidas incorporada
 *   - Validación automática fa-index.total_functionalities en cada generación de dashboard
 */

const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT    = "/Users/cuadram/proyectos/bank-portal";
const OUT_DIR = path.join(ROOT, "dist");
const VERSION = "2.2";
const TMP     = path.join(OUT_DIR, `sofia-v${VERSION}`);
const BUNDLE  = path.join(OUT_DIR, `sofia-deploy-v${VERSION}.zip`);
const DATE    = new Date().toISOString().slice(0, 10);

// ── Skills a incluir ─────────────────────────────────────────────────────────
const SKILL_DIRS = [
  "orchestrator",
  "scrum-master",
  "requirements-analyst",
  "fa-agent",           // ← LA-FA-001 incorporada en v2.2
  "architect",
  "developer-core",
  "java-developer",
  "angular-developer",
  "nodejs-developer",
  "react-developer",
  "dotnet-developer",
  "code-reviewer",
  "qa-tester",
  "security-agent",
  "performance-agent",
  "devops",
  "jenkins-agent",
  "documentation-agent",
  "workflow-manager",
  "atlassian-agent",
];

// ── Archivos a copiar ────────────────────────────────────────────────────────
const INCLUDES = [
  // Config base
  ".sofia/sofia-config.json",
  ".sofia/sofia-context.md",
  ".sofia/PERSISTENCE_PROTOCOL.md",   // v1.7 — Lecciones Aprendidas
  ".sofia/LESSONS_LEARNED.md",        // ← NUEVO v2.2
  ".sofia/doc-agent-hook.sh",
  ".sofia/run-python.sh",
  // Skills SKILL.md
  ...SKILL_DIRS.map(s => `.sofia/skills/${s}/SKILL.md`),
  // Scripts core
  ".sofia/scripts/gen-global-dashboard.js",   // ← LA-DASH-001: buildFullHistory() dinámica
  ".sofia/scripts/gen-fa-document.py",
  ".sofia/scripts/gen-fa-document.js",
  ".sofia/scripts/gen-dashboard.js",
  ".sofia/scripts/audit-persistence.sh",
  ".sofia/scripts/gate-check.py",
  ".sofia/scripts/sofia-wizard.py",
  ".sofia/scripts/setup-sofia-mac.sh",
  ".sofia/scripts/atlassian-sync.py",
  ".sofia/scripts/package-sofia-v2.2.js",     // este script
  // Raíz del proyecto
  "CLAUDE.md",
];

// ── CHANGELOG ────────────────────────────────────────────────────────────────
const CHANGELOG = `SOFIA v2.2 — Release Notes
===========================
Fecha: ${DATE}

NOVEDADES v2.2 — Lecciones Aprendidas incorporadas al sistema
──────────────────────────────────────────────────────────────

[LA-DASH-001] DASHBOARD — FULL_HISTORY dinámico desde fa-index.json
  PROBLEMA DETECTADO: El array FULL_HISTORY en gen-global-dashboard.js
  estaba hardcodeado con nombres de features inventados (S3–S13). Esto
  causaba que el dashboard mostrara funcionalidades incorrectas frente al cliente.
  
  CORRECCIÓN IMPLEMENTADA:
  • gen-global-dashboard.js: función buildFullHistory() que lee fa-index.json
    en cada ejecución — NUNCA se hardcodean nombres de features
  • Los labels del dashboard reflejan exactamente los títulos de fa-index.functionalities
  • Fallback genérico activado con WARNING solo si fa-index.json no existe

  VALIDACIÓN AUTOMÁTICA AÑADIDA:
  • En cada ejecución del script se verifica:
    fa-index.total_functionalities == functionalities.length
  • Si hay discrepancia → auto-corrección en disco + WARNING en sofia.log
  • Esto previene silenciosamente errores de conteo manual

[LA-FA-001] FA-AGENT — total_functionalities siempre calculado dinámicamente
  REGLA: Al escribir fa-index.json, total_functionalities = len(functionalities)
  • Nunca asignar valor literal/hardcodeado
  • Assertion obligatoria antes de persistir fa-index.json
  • FA-Agent SKILL.md actualizado con regla explícita y ejemplo de código

[LESSONS_LEARNED.md] Nuevo fichero de registro canónico de LAs
  • Ruta: .sofia/LESSONS_LEARNED.md
  • Registro permanente de lecciones aprendidas con causa raíz + corrección
  • Incluye plantilla para nuevas LAs
  • LAs documentadas: LA-DASH-001, LA-FA-001, LA-SESS-001

[PERSISTENCE_PROTOCOL.md v1.7] Sección Lecciones Aprendidas
  • Incorporadas como reglas de protocolo: LA-DASH-001, LA-FA-001, LA-SESS-001
  • Checklist de regeneración de dashboard incluido
  • Referencia cruzada a LESSONS_LEARNED.md

CAPACIDADES CONSOLIDADAS v2.2 (igual que v2.1 + LAs)
───────────────────────────────────────────────────────
• 20 skills activos
• Pipeline 13 steps activos (1,2,2b,3,3b,4,5,5b,6,7,8,8b,9)
• Dashboard Global como entregable regenerado en cada Gate
• FA-Agent: 52 funcionalidades + 86 reglas de negocio (BankPortal S1–S18)
• Documentation Agent: 10 Word + 3 Excel por sprint
• CMMI Level 3 activo: 9 PAs
• Atlassian MCP: Jira + Confluence en cada gate
• Lessons Learned: registro canónico + reglas incorporadas al sistema

MÉTRICAS BankPortal (referencia — Sprint 18 cerrado)
─────────────────────────────────────────────────────
• Sprints completados: 18  |  SP acumulados: 425
• Velocidad media: 23.6 SP/sprint  |  Tests: 677  |  Cobertura: 86%
• Defectos producción: 0  |  CVEs críticos: 0  |  Release: v1.18.0
• FA: 52 funcionalidades · 86 reglas de negocio · 14 módulos
`;

// ── README ───────────────────────────────────────────────────────────────────
const README = `# SOFIA v${VERSION} — Deployment Package

> Lessons Learned integradas · Dashboard dinámico · FA-Agent · 20 agentes · CMMI L3

## Qué hay de nuevo en v${VERSION}

### LA-DASH-001 — Dashboard siempre fiel a fa-index.json
El script \`gen-global-dashboard.js\` construye el historial de features
dinámicamente leyendo \`docs/functional-analysis/fa-index.json\`.
**Ya no hay nombres hardcodeados**. Incluye validación auto-correctiva de
\`total_functionalities\` con registro en \`sofia.log\`.

### LA-FA-001 — FA-Agent: conteo siempre correcto
El FA-Agent calcula \`total_functionalities\` como \`len(functionalities)\`
en tiempo de escritura. Assertion obligatoria antes de persistir.

### LESSONS_LEARNED.md
Nuevo registro canónico en \`.sofia/LESSONS_LEARNED.md\` con causa raíz,
corrección aplicada y regla sistémica para cada lección.

## Instalación rápida (macOS)

\`\`\`bash
unzip sofia-deploy-v${VERSION}.zip -d sofia-v${VERSION}
bash sofia-v${VERSION}/scripts/setup-sofia-mac.sh /ruta/a/tu-proyecto
killall 'Claude' && open -a Claude
\`\`\`

## Skills incluidos (${SKILL_DIRS.length})

${SKILL_DIRS.map(s => `- ${s}`).join("\n")}

## Pipeline

\`\`\`
1 → 2 → 2b(FA) → 3 → 3b(Doc) → 4 → 5 → 5b(Sec) → 6 → 7 → 8 → 8b(FA) → 9
\`\`\`

## Dashboard Global

\`\`\`bash
node .sofia/scripts/gen-global-dashboard.js --gate G-1 --step 1
# Fuente canónica: docs/functional-analysis/fa-index.json (LA-DASH-001)
# Output: docs/dashboard/bankportal-global-dashboard.html
\`\`\`

---
SOFIA v${VERSION} · Experis · CMMI Level 3 · ${DATE}
`;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log(`\n📦 Empaquetando SOFIA v${VERSION}...\n`);

// Limpiar y crear directorios
if (fs.existsSync(TMP)) execSync(`rm -rf "${TMP}"`);
fs.mkdirSync(path.join(TMP, "skills"),  { recursive: true });
fs.mkdirSync(path.join(TMP, "scripts"), { recursive: true });
fs.mkdirSync(path.join(TMP, "config"),  { recursive: true });

let copied = 0, skipped = 0;

// ── Copiar archivos individuales ─────────────────────────────────────────────
console.log("📄 Copiando archivos...\n");
const seen = new Set();

for (const rel of INCLUDES) {
  if (seen.has(rel)) continue;
  seen.add(rel);

  const src = path.join(ROOT, rel);
  if (!fs.existsSync(src)) {
    console.log(`   ⚠️  No encontrado (skip): ${rel}`);
    skipped++;
    continue;
  }

  let dest;
  if (rel.startsWith(".sofia/skills/")) {
    const parts = rel.replace(".sofia/skills/", "").split("/");
    dest = path.join(TMP, "skills", parts[0], parts[1]);
  } else if (rel.startsWith(".sofia/scripts/")) {
    dest = path.join(TMP, "scripts", path.basename(rel));
  } else if (rel.startsWith(".sofia/")) {
    dest = path.join(TMP, "config", path.basename(rel));
  } else {
    dest = path.join(TMP, path.basename(rel));
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`   ✅ ${rel}`);
  copied++;
}

// ── Empaquetar cada skill como .skill (ZIP) ──────────────────────────────────
console.log("\n📁 Generando archivos .skill...\n");
let skillOk = 0, skillSkip = 0;

for (const skillName of SKILL_DIRS) {
  const skillDir  = path.join(ROOT, ".sofia/skills", skillName);
  const skillFile = path.join(TMP, "skills", `${skillName}.skill`);

  if (!fs.existsSync(skillDir)) {
    console.log(`   ⚠️  Skill dir no encontrado (skip): ${skillName}`);
    skillSkip++;
    continue;
  }

  try {
    execSync(
      `cd "${path.join(ROOT, ".sofia/skills")}" && zip -r "${skillFile}" "${skillName}/" -x "*.DS_Store"`,
      { stdio: "pipe" }
    );
    const size = fs.statSync(skillFile).size;
    console.log(`   ✅ ${skillName}.skill (${(size / 1024).toFixed(1)} KB)`);
    skillOk++;
  } catch (e) {
    console.log(`   ❌ Error: ${skillName}: ${e.message}`);
    skillSkip++;
  }
}

// ── Escribir CHANGELOG, README, MANIFEST ─────────────────────────────────────
fs.writeFileSync(path.join(TMP, "CHANGELOG.md"), CHANGELOG.trim(), "utf8");
console.log("\n   ✅ CHANGELOG.md");

fs.writeFileSync(path.join(TMP, "README.md"), README.trim(), "utf8");
console.log("   ✅ README.md");

const manifest = {
  sofia_version: VERSION,
  packaged_at: new Date().toISOString(),
  packaged_by: "SOFIA Package Script v2.2",
  project_reference: "bank-portal — Banco Meridian",
  skills: SKILL_DIRS,
  skill_count: skillOk,
  new_in_v2_2: [
    "LA-DASH-001: gen-global-dashboard.js lee fa-index.json dinámicamente (buildFullHistory)",
    "LA-DASH-001: validación auto-correctiva de fa-index.total_functionalities en cada ejecución",
    "LA-FA-001: fa-agent/SKILL.md — total_functionalities siempre len(functionalities)",
    "LESSONS_LEARNED.md — registro canónico de lecciones aprendidas SOFIA",
    "PERSISTENCE_PROTOCOL.md v1.7 — sección Lecciones Aprendidas (LA-DASH-001, LA-FA-001, LA-SESS-001)",
  ],
  pipeline_steps: ["1","2","2b","3","3b","4","5","5b","6","7","8","8b","9"],
  pipeline_step_count: 13,
  mcp_servers: ["filesystem", "git", "sofia-shell"],
  lessons_learned: {
    registry: ".sofia/LESSONS_LEARNED.md",
    entries: ["LA-DASH-001", "LA-FA-001", "LA-SESS-001"],
  },
  dashboard_global: {
    script: ".sofia/scripts/gen-global-dashboard.js",
    canonical_source: "docs/functional-analysis/fa-index.json",
    output: "docs/dashboard/bankportal-global-dashboard.html",
    alias: "docs/quality/sofia-dashboard.html",
    trigger: "Each Gate approval — Step 7b — mandatory",
    validation: "auto-correct total_functionalities + WARNING in sofia.log",
  },
  fa_agent: {
    skill: ".sofia/skills/fa-agent/SKILL.md",
    rule_la_fa_001: "total_functionalities = len(functionalities) — dynamic always",
    generator_py: ".sofia/scripts/gen-fa-document.py",
    generator_js: ".sofia/scripts/gen-fa-document.js",
    gates: ["2b", "3b", "8b"],
  },
  cmmi_level: 3,
  methodology: "Scrumban",
  files_copied: copied,
  files_skipped: skipped,
  skills_packaged: skillOk,
  skills_skipped: skillSkip,
  metrics_reference: {
    sprints: 18, sp_acum: 425, velocity: 23.6,
    tests: 677, coverage: "86%", defects: 0,
    cves: 0, release: "v1.18.0",
    fa_functionalities: 52, fa_business_rules: 86, fa_modules: 14,
  },
};

fs.writeFileSync(
  path.join(TMP, "MANIFEST.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);
console.log("   ✅ MANIFEST.json");

// ── ZIP final ─────────────────────────────────────────────────────────────────
console.log(`\n🗜️  Creando sofia-deploy-v${VERSION}.zip...`);
if (fs.existsSync(BUNDLE)) fs.unlinkSync(BUNDLE);
execSync(
  `cd "${OUT_DIR}" && zip -r "sofia-deploy-v${VERSION}.zip" "sofia-v${VERSION}/" -x "*.DS_Store"`,
  { stdio: "pipe" }
);

const zipSize  = (fs.statSync(BUNDLE).size / 1024).toFixed(1);
const zipSizeK = parseFloat(zipSize);

// Contar ficheros totales en el ZIP
let totalFiles = 0;
try {
  const zipList = execSync(`unzip -l "${BUNDLE}"`).toString();
  totalFiles = (zipList.match(/^\s+\d+\s+/gm) || []).length;
} catch(e) {}

// ── Log en sofia.log ──────────────────────────────────────────────────────────
const logPath = path.join(ROOT, ".sofia/sofia.log");
const logEntry = `[${new Date().toISOString()}] [PACKAGE] sofia-deploy-v${VERSION}.zip CREATED → ${zipSizeK} KB · ${skillOk} skills · ${copied} files · ${totalFiles} entries in ZIP\n`;
try { fs.appendFileSync(logPath, logEntry, "utf8"); } catch(e) {}

// ── Actualizar session.json ───────────────────────────────────────────────────
const sessionPath = path.join(ROOT, ".sofia/session.json");
try {
  const sess = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
  sess.sofia_version = VERSION;
  sess.updated_at = new Date().toISOString();
  fs.writeFileSync(sessionPath, JSON.stringify(sess, null, 2), "utf8");
} catch(e) {}

console.log(`
╔══════════════════════════════════════════════════════════╗
║           SOFIA v${VERSION} — PAQUETE GENERADO             ║
╠══════════════════════════════════════════════════════════╣
║  📦 sofia-deploy-v${VERSION}.zip                          ║
║  📏 ${(zipSize + " KB").padEnd(48)}║
║  🧩 ${(skillOk + " skills empaquetados").padEnd(48)}║
║  📄 ${(copied + " archivos copiados").padEnd(48)}║
║  🗂️  ${(totalFiles + " entradas en el ZIP").padEnd(47)}║
╠══════════════════════════════════════════════════════════╣
║  NOVEDADES v2.2 — LECCIONES APRENDIDAS                  ║
║  ✦ LA-DASH-001: dashboard siempre desde fa-index.json   ║
║  ✦ LA-DASH-001: validación auto-correctiva total_func.  ║
║  ✦ LA-FA-001: fa-agent total_functionalities dinámico   ║
║  ✦ LESSONS_LEARNED.md — registro canónico de LAs        ║
║  ✦ PERSISTENCE_PROTOCOL.md v1.7 — LAs incorporadas      ║
╚══════════════════════════════════════════════════════════╝
`);
