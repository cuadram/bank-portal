#!/usr/bin/env node
/**
 * SOFIA v2.5 — Packaging Script
 * Genera dist/sofia-deploy-v2.5.zip con todas las capacidades del sistema.
 *
 * Uso:
 *   node .sofia/scripts/package-sofia-v2.5.js
 *
 * Novedades v2.5 vs v2.4:
 *   - STG Verification integrada: stg-pre-check.js (LA-STG-001/002/003)
 *   - Guardrails frontend GR-007/008/009 en G-4/G-5
 *   - angular-developer SKILL v2.1: 3 nuevas reglas + checklists actualizados
 *   - orchestrator SKILL v2.4: reglas de oro 16/17/18, CHECK-4 frontend
 *   - code-reviewer SKILL: checklist LA-STG-001..003
 *   - sofia-config.json: guardrails.frontend, stg_pre_check obligatorio
 *   - LESSONS_LEARNED.md: 38 lecciones consolidadas S19-S21+STG
 *   - environment.ts/prod.ts: campos version/sprint/envLabel obligatorios
 *   - Sprint 21 FEAT-019: 497 SP acumulados, 88% cov, v1.21.0
 *   - BUG-VER-001 FIXED: forkJoin+EMPTY→of([]) en ProfileService
 *   - BUG-VER-002 FIXED: footer versión interpolada desde environment.ts
 */

const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT    = "/Users/cuadram/proyectos/bank-portal";
const OUT_DIR = path.join(ROOT, "dist");
const VERSION = "2.5";
const TMP     = path.join(OUT_DIR, `sofia-v${VERSION}`);
const BUNDLE  = path.join(OUT_DIR, `sofia-deploy-v${VERSION}.zip`);
const DATE    = new Date().toISOString().slice(0, 10);

// ── Skills a incluir (21) ─────────────────────────────────────────────────────
const SKILL_DIRS = [
  "orchestrator",
  "scrum-master",
  "requirements-analyst",
  "fa-agent",
  "ux-ui-designer",
  "architect",
  "developer-core",
  "java-developer",
  "angular-developer",      // ← v2.1 — LA-STG-001/002/003
  "nodejs-developer",
  "react-developer",
  "dotnet-developer",
  "code-reviewer",          // ← checklist LA-STG-001..003 añadido
  "qa-tester",
  "security-agent",
  "performance-agent",
  "devops",
  "jenkins-agent",
  "documentation-agent",
  "workflow-manager",
  "atlassian-agent",
];

// ── Archivos a copiar ─────────────────────────────────────────────────────────
const INCLUDES = [
  // Config y contexto
  ".sofia/sofia-config.json",
  ".sofia/sofia-context.md",
  ".sofia/PERSISTENCE_PROTOCOL.md",
  ".sofia/LESSONS_LEARNED.md",
  // Scripts de automatización
  ".sofia/scripts/gen-global-dashboard.js",
  ".sofia/scripts/gate-dashboard-hook.js",
  ".sofia/scripts/gen-fa-document.py",
  ".sofia/scripts/gen-fa-document.js",
  ".sofia/scripts/validate-fa-index.js",
  ".sofia/scripts/guardrail-pre-gate.js",
  ".sofia/scripts/stg-pre-check.js",    // ← NUEVO v2.5
  ".sofia/scripts/audit-persistence.sh",
  ".sofia/scripts/install-deps.sh",
  // Templates
  "docs/ux-ui/prototypes/PROTO-TEMPLATE.html",
  // Artefactos de referencia del proyecto
  "CLAUDE.md",
];

// ── Setup ────────────────────────────────────────────────────────────────────
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (fs.existsSync(TMP)) execSync(`rm -rf "${TMP}"`);
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(path.join(TMP, "skills"), { recursive: true });
fs.mkdirSync(path.join(TMP, "scripts"), { recursive: true });
fs.mkdirSync(path.join(TMP, "templates"), { recursive: true });

console.log(`\n🏭 SOFIA v${VERSION} — Packaging iniciado\n${"─".repeat(56)}`);

// ── Copiar skills ─────────────────────────────────────────────────────────────
let skillOk = 0; let skillErr = 0;
console.log("📦 Empaquetando skills...");

for (const skill of SKILL_DIRS) {
  const src  = path.join(ROOT, ".sofia/skills", skill, "SKILL.md");
  const dest = path.join(TMP, "skills", skill);
  if (!fs.existsSync(src)) {
    console.log(`   ⚠️  ${skill}/SKILL.md — NO ENCONTRADO`);
    skillErr++;
    continue;
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.copyFileSync(src, path.join(dest, "SKILL.md"));
  // Copiar referencias si existen
  const refDir = path.join(ROOT, ".sofia/skills", skill, "references");
  if (fs.existsSync(refDir)) {
    fs.mkdirSync(path.join(dest, "references"), { recursive: true });
    fs.readdirSync(refDir).forEach(f => {
      fs.copyFileSync(path.join(refDir, f), path.join(dest, "references", f));
    });
  }
  console.log(`   ✅ ${skill}`);
  skillOk++;
}

// ── Copiar archivos individuales ──────────────────────────────────────────────
let copied = 0; let skipped = 0;
console.log("\n📄 Copiando archivos base...");

for (const relPath of INCLUDES) {
  const src  = path.join(ROOT, relPath);
  const dest = path.join(TMP, relPath);

  if (!fs.existsSync(src)) {
    console.log(`   ⚠️  ${relPath} — no encontrado`);
    skipped++;
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`   ✅ ${relPath}`);
  copied++;
}

// ── README.md del paquete ─────────────────────────────────────────────────────
console.log("\n📝 Generando README.md...");
const readme = `# SOFIA — Software Factory IA v${VERSION}
**Experis · ManpowerGroup** | Generado: ${DATE}

## ¿Qué es SOFIA?
Sistema de orquestación de IA para desarrollo de software que coordina 21 agentes
especializados a través de un pipeline de 15 steps con gates HITL (Human-In-The-Loop).

## Novedades v${VERSION}
- **stg-pre-check.js**: guardrail frontend para G-4/G-5 (LA-STG-001/002/003)
  - CHECK-1: forkJoin + catchError→EMPTY (skeleton infinito silencioso)
  - CHECK-2: versiones/sprints hardcodeados en templates
  - CHECK-3: endpoints frontend verificados en backend
- **orchestrator SKILL v2.4**: reglas de oro 16/17/18 + CHECK-4 frontend
- **angular-developer SKILL v2.1**: LA-STG-001/002/003 + checklists G-4/G-5
- **code-reviewer SKILL**: checklist LA-STG-001..003 para PRs Angular
- **sofia-config.json**: guardrails.frontend con GR-007/008/009
- **LESSONS_LEARNED.md**: 38 lecciones consolidadas S19–S21+STG
- **Sprint 21 FEAT-019**: 497 SP acum., 88% cobertura, v1.21.0

## Métricas BankPortal (Sprint 21 cerrado)
- **SP acumulados:** 497
- **Tests:** 855
- **Cobertura:** 88%
- **Release:** v1.21.0
- **Funcionalidades FA:** 70
- **Reglas de negocio:** 166
- **Defectos en producción:** 0
- **CMMI:** Nivel 3

## Estructura
\`\`\`
sofia-v${VERSION}/
├── skills/              # 21 agentes especializados
│   ├── orchestrator/    # v2.4 — reglas de oro 16/17/18
│   ├── angular-developer/ # v2.1 — LA-STG-001/002/003
│   ├── code-reviewer/   # checklist LA-STG-001..003
│   └── ...
├── scripts/
│   ├── stg-pre-check.js    # ← NUEVO v2.5 — guardrail frontend
│   ├── guardrail-pre-gate.js
│   ├── validate-fa-index.js
│   ├── gen-fa-document.py
│   └── gen-global-dashboard.js
├── templates/           # PROTO-TEMPLATE.html
├── sofia-config.json    # v2.5 — guardrails.frontend
├── LESSONS_LEARNED.md   # 38 lecciones S19–S21+STG
├── PERSISTENCE_PROTOCOL.md
├── CLAUDE.md
└── MANIFEST.json
\`\`\`

## Pipeline (15 steps · 21 agentes)
1  Scrum Master → 2 Requirements → 2b FA-Agent → 2c UX/UI Designer →
3  Architect → 3b FA-Agent+Docs → 4 Developer → 4b Gate integración →
5  Code Review → 5b Security → 6 QA → 7 DevOps → 8 Documentation →
8b FA-Agent → 9 Workflow Manager

## stg-pre-check.js — Uso rápido
\`\`\`bash
node .sofia/scripts/stg-pre-check.js
# Exit 0 → PASS  |  Exit 1 → Warnings  |  Exit 2 → BLOQUEANTE
\`\`\`

## MCP Servers requeridos
- filesystem, git, sofia-shell, atlassian
`;

fs.writeFileSync(path.join(TMP, "README.md"), readme, "utf8");
console.log("   ✅ README.md");

// ── MANIFEST.json ─────────────────────────────────────────────────────────────
console.log("\n📋 Generando MANIFEST.json...");
const manifest = {
  sofia_version: VERSION,
  generated_at: new Date().toISOString(),
  project_reference: "BankPortal · Banco Meridian",
  sprint_reference: 21,
  feature_reference: "FEAT-019",
  skills: SKILL_DIRS,
  skills_ok: skillOk,
  skills_err: skillErr,
  files_copied: copied,
  files_skipped: skipped,
  pipeline_steps: 15,
  agents_total: 21,
  sp_acumulados: 497,
  tests_total: 855,
  coverage: "88%",
  release: "v1.21.0",
  cmmi_level: 3,
  methodology: "Scrumban",
  mcp_servers: ["filesystem", "git", "sofia-shell", "atlassian"],
  novedades_v25: [
    "stg-pre-check.js — guardrail frontend (GR-007/008/009)",
    "orchestrator SKILL v2.4 — reglas de oro 16/17/18",
    "angular-developer SKILL v2.1 — LA-STG-001/002/003",
    "code-reviewer SKILL — checklist LA-STG-001..003",
    "sofia-config.json — guardrails.frontend",
    "LESSONS_LEARNED.md — 38 lecciones S19-S21+STG",
    "BUG-VER-001 FIXED: forkJoin+EMPTY→of([])",
    "BUG-VER-002 FIXED: footer version desde environment.ts",
  ],
  lessons_learned_total: 38,
  new_lessons_v25: ["LA-STG-001", "LA-STG-002", "LA-STG-003"],
  guardrails_total: 9,
  new_guardrails_v25: ["GR-007", "GR-008", "GR-009"],
};

fs.writeFileSync(
  path.join(TMP, "MANIFEST.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);
console.log("   ✅ MANIFEST.json\n");

// ── ZIP final ─────────────────────────────────────────────────────────────────
console.log(`🗜️  Creando sofia-deploy-v${VERSION}.zip...`);
if (fs.existsSync(BUNDLE)) fs.unlinkSync(BUNDLE);
execSync(
  `cd "${OUT_DIR}" && zip -r "sofia-deploy-v${VERSION}.zip" "sofia-v${VERSION}/" -x "*.DS_Store"`,
  { stdio: "pipe" }
);

const zipSize = fs.statSync(BUNDLE).size;
const zipKB   = (zipSize / 1024).toFixed(1);

let totalEntries = 0;
try {
  const list = execSync(`unzip -l "${BUNDLE}"`).toString();
  totalEntries = (list.match(/^\s+\d+\s+/gm) || []).length;
} catch(e) {}

// ── sofia.log ─────────────────────────────────────────────────────────────────
const logLine = `[${new Date().toISOString()}] [PACKAGE] sofia-deploy-v${VERSION}.zip CREATED → ${zipKB} KB · ${skillOk} skills · ${copied} files · ${totalEntries} entries\n`;
try { fs.appendFileSync(path.join(ROOT, ".sofia/sofia.log"), logLine, "utf8"); } catch(e) {}

// ── session.json ──────────────────────────────────────────────────────────────
try {
  const sess = JSON.parse(fs.readFileSync(path.join(ROOT, ".sofia/session.json"), "utf8"));
  sess.sofia_version = VERSION;
  sess.last_package = {
    version: VERSION,
    path: `dist/sofia-deploy-v${VERSION}.zip`,
    size_kb: parseFloat(zipKB),
    entries: totalEntries,
    skills: skillOk,
    packaged_at: new Date().toISOString(),
    notes: "STG Verification integrada: stg-pre-check.js + GR-007/008/009. angular-developer v2.1, orchestrator v2.4, code-reviewer actualizado. 38 LAs consolidadas. BUG-VER-001/002 FIXED.",
    confluence_page: "PENDING",
  };
  sess.updated_at = new Date().toISOString();
  fs.writeFileSync(path.join(ROOT, ".sofia/session.json"), JSON.stringify(sess, null, 2), "utf8");
} catch(e) { console.log("⚠️  session.json update failed:", e.message); }

// ── Resumen ───────────────────────────────────────────────────────────────────
const bar = "═".repeat(60);
console.log(`
╔${bar}╗
║         🚀 SOFIA v${VERSION} — PAQUETE GENERADO                       ║
╠${bar}╣
║  📦 dist/sofia-deploy-v${VERSION}.zip                              ║
║  📏 Tamaño ZIP: ${(zipKB + " KB").padEnd(42)}║
║  🧩 Skills:     ${(skillOk + " agentes empaquetados").padEnd(42)}║
║  📄 Archivos:   ${(copied + " copiados").padEnd(42)}║
║  🗂️  Entradas:  ${(totalEntries + " en el ZIP").padEnd(42)}║
╠${bar}╣
║  NOVEDADES v2.5                                              ║
║  ✦ stg-pre-check.js — guardrail frontend G-4/G-5            ║
║    CHECK-1: forkJoin+EMPTY  CHECK-2: versions  CHECK-3: API ║
║  ✦ orchestrator SKILL v2.4 — reglas de oro 16/17/18         ║
║  ✦ angular-developer SKILL v2.1 — LA-STG-001/002/003        ║
║  ✦ code-reviewer SKILL — checklist frontend STG             ║
║  ✦ 38 lecciones aprendidas consolidadas (S19-S21+STG)       ║
║  ✦ BUG-VER-001: forkJoin+EMPTY→of([]) FIXED                 ║
║  ✦ BUG-VER-002: footer version desde environment.ts FIXED   ║
╠${bar}╣
║  MÉTRICAS BANKPORTAL (Sprint 21)                             ║
║  SP: 497 acum  · Cobertura: 88%  · Release: v1.21.0         ║
║  FA: 70 func · 166 reglas · Defectos prod: 0                 ║
╚${bar}╝
`);
