#!/usr/bin/env node
/**
 * SOFIA v2.0 — Packaging Script
 * Genera dist/sofia-deploy-v2.0.zip con todas las capacidades del sistema.
 *
 * Uso:
 *   node .sofia/scripts/package-sofia-v2.0.js
 *
 * Novedades v2.0 vs v1.9:
 *   - FA-Agent (Analista Funcional) — skill nuevo
 *   - gen-global-dashboard.js — Dashboard Global como entregable en cada Gate
 *   - gen-fa-document.py / gen-fa-document.js — generador FA Word acumulativo
 *   - Orchestrator v2.1 — Reglas de oro #11/#12 (Dashboard Global)
 *   - Workflow Manager v1.11 — Paso 7b obligatorio
 *   - CLAUDE.md v2.1 — Regla crítica Dashboard Global
 *   - Performance Agent, Jenkins Agent, Atlassian Agent añadidos
 *   - Pipeline 14 steps (2b, 8b nuevos para FA-Agent)
 *   - 20 agentes totales (vs 16 en v1.9)
 *   - setup-sofia-mac.sh — instalador completo para macOS
 */

const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT    = "/Users/cuadram/proyectos/bank-portal";
const OUT_DIR = path.join(ROOT, "dist");
const VERSION = "2.0";
const TMP     = path.join(OUT_DIR, `sofia-v${VERSION}`);
const BUNDLE  = path.join(OUT_DIR, `sofia-deploy-v${VERSION}.zip`);
const DATE    = new Date().toISOString().slice(0, 10);

// ── Skills a incluir en el paquete ──────────────────────────────────────────
const SKILL_DIRS = [
  // Coordinación
  "orchestrator",
  // Planificación
  "scrum-master",
  "requirements-analyst",
  // Análisis Funcional ← NUEVO v2.0
  "fa-agent",
  // Diseño
  "architect",
  // Desarrollo
  "developer-core",
  "java-developer",
  "angular-developer",
  "nodejs-developer",
  "react-developer",
  "dotnet-developer",
  // Revisión & Calidad
  "code-reviewer",
  "qa-tester",
  "security-agent",
  "performance-agent",
  // CI/CD
  "devops",
  "jenkins-agent",
  // Documentación & Entrega
  "documentation-agent",
  // Gobierno & Integración
  "workflow-manager",
  "atlassian-agent",
];

// ── Archivos principales a copiar ────────────────────────────────────────────
const INCLUDES = [
  // Config base
  ".sofia/sofia-config.json",
  ".sofia/sofia-context.md",
  ".sofia/PERSISTENCE_PROTOCOL.md",
  ".sofia/doc-agent-hook.sh",
  ".sofia/run-python.sh",
  // Skills SKILL.md (se incluyen también como .skill ZIP)
  ...SKILL_DIRS.map(s => `.sofia/skills/${s}/SKILL.md`),
  // Scripts core
  ".sofia/scripts/mcp-shell-server.js",
  ".sofia/scripts/setup-shell-mcp.js",
  ".sofia/scripts/gen-global-dashboard.js",       // ← NUEVO v2.0
  ".sofia/scripts/gen-fa-document.py",            // ← NUEVO v2.0
  ".sofia/scripts/gen-fa-document.js",            // ← NUEVO v2.0
  ".sofia/scripts/gen-dashboard.js",
  ".sofia/scripts/gen-dashboard.js",
  ".sofia/scripts/audit-persistence.sh",
  ".sofia/scripts/gate-check.py",
  ".sofia/scripts/sofia-wizard.py",
  ".sofia/scripts/setup-sofia-mac.sh",            // ← NUEVO v2.0
  ".sofia/scripts/package-sofia-v2.0.js",         // este script
  // Raíz del proyecto
  "CLAUDE.md",
];

// ── CHANGELOG ────────────────────────────────────────────────────────────────
const CHANGELOG = `SOFIA v2.0 — Release Notes
===========================
Fecha: ${DATE}

NUEVAS CAPACIDADES v2.0
────────────────────────

[DASHBOARD GLOBAL — ENTREGABLE CONSOLIDADO]
• gen-global-dashboard.js — Genera Dashboard Global HTML completo desde session.json
  - Se regenera automáticamente en CADA aprobación de Gate (G-1 a G-9)
  - Paso 7b obligatorio en el protocolo de gate
  - Actualiza session.json.dashboard_global y gate_history[]
  - Output: docs/dashboard/bankportal-global-dashboard.html
  - Alias: docs/quality/sofia-dashboard.html
  - 6 tabs: Resumen Ejecutivo, Historial Sprints, Calidad & Tests,
            Roadmap & Features, Gobierno & CMMI, Gates & Pipeline
  - Stamp de generación embebido (sofia-gate, sofia-step, sofia-generated)

[FA-AGENT — ANALISTA FUNCIONAL]
• fa-agent/SKILL.md — Nuevo skill de Análisis Funcional
  - Se ejecuta en Gates 2b, 3b y 8b (automáticos)
  - Genera FA-[FEAT]-sprint[N].md por feature
  - Mantiene documento Word acumulativo: FA-BankPortal-Banco-Meridian.docx
  - gen-fa-document.py: regenerador Python con python-docx
  - gen-fa-document.js: regenerador Node.js alternativo
  - 52 funcionalidades + 86 reglas de negocio acumuladas (BankPortal S1–S18)

[PIPELINE — 14 STEPS]
• Steps nuevos: 2b (FA draft post-requirements) + 8b (FA consolidación post-deploy)
• 20 agentes totales (vs 16 en v1.9)
• Nuevos skills: fa-agent, performance-agent, jenkins-agent, atlassian-agent

[ORCHESTRATOR v2.1]
• Regla de oro #11: Cada aprobación de Gate → regenerar Dashboard Global
• Regla de oro #12: Dashboard Global es entregable — debe existir en docs/dashboard/
• Paso 7b integrado en protocolo de gate
• Dashboard Global: cuándo regenerar, outputs, fallbacks

[WORKFLOW MANAGER v1.11]
• Paso 7b obligatorio: regenerar Dashboard Global tras cada Gate aprobado
• Checklist Gate 9 actualizado: incluye dashboard_global checks
• atlassian-sync.json: campos dashboard_updated y dashboard_path por gate
• Persistence Protocol: bankportal-global-dashboard.html en lista obligatoria

[CLAUDE.md v2.1]
• REGLA CRÍTICA DASHBOARD GLOBAL: qué regenerar, cuándo, cómo verificar
• Paso 5 en inicialización: verificar session.json.dashboard_global.last_generated
• Historial de versiones actualizado con v2.1

[INSTALACIÓN]
• setup-sofia-mac.sh — instalador completo para macOS
  - Crea estructura .sofia/skills/, .sofia/scripts/
  - Copia skills y scripts
  - Configura claude_desktop_config.json (filesystem + git + sofia-shell)
  - Pre-instala dependencias npm y pip

CAPACIDADES CONSOLIDADAS v2.0
───────────────────────────────
• 20 skills activos (ver lista completa en MANIFEST.json)
• Pipeline de 14 steps con FA-Agent en 2b/3b/8b
• Dashboard Global como entregable regenerado en cada Gate
• Documentation Agent: 10 Word + 3 Excel por sprint
• CMMI Level 3 activo: 9 PAs con evidencias
• Atlassian MCP: Jira + Confluence sincronizados en cada gate
• MCP filesystem + git + sofia-shell

MÉTRICAS BankPortal (Sprint 18 cerrado)
─────────────────────────────────────────
• Sprints completados: 18
• SP acumulados: 425
• Velocidad media: 23.6 SP/sprint
• Tests automatizados: 677
• Cobertura: 86%
• Defectos producción: 0
• CVEs críticos: 0
• Release actual: v1.18.0
• FA-Agent: 52 funcionalidades · 86 reglas de negocio
`;

// ── README de instalación ────────────────────────────────────────────────────
const README = `# SOFIA v${VERSION} — Deployment Package

> Dashboard Global · FA-Agent · 20 agentes · Pipeline 14 steps · CMMI L3

## Instalación rápida (macOS)

\`\`\`bash
# 1. Descomprimir
unzip sofia-deploy-v${VERSION}.zip -d sofia-v${VERSION}

# 2. Ejecutar instalador automático
node sofia-v${VERSION}/scripts/setup-sofia-mac.sh /ruta/a/tu-proyecto

# 3. Reiniciar Claude Desktop
killall 'Claude' && open -a Claude
\`\`\`

## Instalación manual

\`\`\`bash
# 1. Crear estructura
mkdir -p tu-proyecto/.sofia/{skills,scripts,gates,hooks,snapshots,sync,templates}

# 2. Copiar skills (extraer .skill como carpetas)
for f in sofia-v${VERSION}/skills/*.skill; do
  nombre=$(basename "$f" .skill)
  mkdir -p "tu-proyecto/.sofia/skills/$nombre"
  unzip -o "$f" -d "tu-proyecto/.sofia/skills/$nombre"
done

# 3. Copiar scripts
cp sofia-v${VERSION}/scripts/* tu-proyecto/.sofia/scripts/

# 4. Copiar CLAUDE.md y config
cp sofia-v${VERSION}/CLAUDE.md tu-proyecto/
cp sofia-v${VERSION}/config/sofia-config.json tu-proyecto/.sofia/

# 5. Instalar MCP shell
node tu-proyecto/.sofia/scripts/setup-shell-mcp.js

# 6. Instalar dependencias
npm install -g docx
pip3 install python-docx

# 7. Reiniciar Claude Desktop
\`\`\`

## MCP Servers requeridos

| Server | Comando | Propósito |
|--------|---------|-----------|
| filesystem | npx @modelcontextprotocol/server-filesystem | Lectura/escritura en proyecto |
| git | uvx mcp-server-git | Gestión de ramas y commits |
| sofia-shell | node .sofia/scripts/mcp-shell-server.js | Ejecución de scripts en local |

## Skills incluidos (${SKILL_DIRS.length})

${SKILL_DIRS.map(s => `- ${s}`).join("\n")}

## Novedades v${VERSION}

### Dashboard Global (entregable)
El \`gen-global-dashboard.js\` genera el Dashboard Global automáticamente en cada Gate:
\`\`\`bash
node .sofia/scripts/gen-global-dashboard.js --gate G-1 --step 1
# Output: docs/dashboard/bankportal-global-dashboard.html
\`\`\`

### FA-Agent (Análisis Funcional)
- Gates automáticos: 2b (draft) → 3b (enriquece) → 8b (consolida)
- Genera FA Word acumulativo por proyecto
- Dependencia: \`pip3 install python-docx\`

### Pipeline 14 steps
\`\`\`
1 → 2 → 2b(FA) → 3 → 3b(Doc+FA) → 4 → 5 → 5b(Sec) → 6 → 7 → 8 → 8b(FA) → 9
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

  // Calcular destino
  let dest;
  if (rel.startsWith(".sofia/skills/")) {
    // Solo SKILL.md de cada skill en skills/[name]/SKILL.md
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
    console.log(`   ❌ Error empaquetando ${skillName}: ${e.message}`);
    skillSkip++;
  }
}

// ── CHANGELOG ────────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(TMP, "CHANGELOG.md"), CHANGELOG.trim(), "utf8");
console.log("\n   ✅ CHANGELOG.md");

// ── README ───────────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(TMP, "README.md"), README.trim(), "utf8");
console.log("   ✅ README.md");

// ── MANIFEST ─────────────────────────────────────────────────────────────────
const manifest = {
  sofia_version: VERSION,
  packaged_at: new Date().toISOString(),
  packaged_by: "SOFIA Package Script v2.0",
  project_reference: "bank-portal — Banco Meridian",
  skills: SKILL_DIRS,
  skill_count: skillOk,
  new_in_v2_0: [
    "Dashboard Global como entregable consolidado (gen-global-dashboard.js)",
    "Regeneración automática del Dashboard en cada Gate (Paso 7b obligatorio)",
    "FA-Agent (Analista Funcional) — skill nuevo en Gates 2b/3b/8b",
    "gen-fa-document.py y gen-fa-document.js — generadores FA Word",
    "Orchestrator v2.1 — Reglas de oro #11 y #12",
    "Workflow Manager v1.11 — Paso 7b + atlassian-sync.json dashboard_updated",
    "CLAUDE.md v2.1 — Regla crítica Dashboard Global",
    "Performance Agent, Jenkins Agent, Atlassian Agent",
    "Pipeline 14 steps (steps 2b y 8b nuevos)",
    "20 agentes totales (vs 16 en v1.9)",
    "setup-sofia-mac.sh — instalador macOS completo",
  ],
  pipeline_steps: ["1","2","2b","3","3b","4","5","5b","6","7","8","8b","9"],
  pipeline_step_count: 13,
  mcp_servers: ["filesystem", "git", "sofia-shell"],
  dashboard_global: {
    script: ".sofia/scripts/gen-global-dashboard.js",
    output: "docs/dashboard/bankportal-global-dashboard.html",
    alias: "docs/quality/sofia-dashboard.html",
    trigger: "Each Gate approval (G-1 to G-9) — Step 7b — mandatory",
  },
  fa_agent: {
    skill: ".sofia/skills/fa-agent/SKILL.md",
    generator_py: ".sofia/scripts/gen-fa-document.py",
    generator_js: ".sofia/scripts/gen-fa-document.js",
    gates: ["2b", "3b", "8b"],
    output: "docs/functional-analysis/FA-{project}-{client}.docx",
  },
  cmmi_level: 3,
  methodology: "Scrumban",
  files_copied: copied,
  files_skipped: skipped,
  skills_packaged: skillOk,
  skills_skipped: skillSkip,
  metrics_reference: {
    sprints: 18,
    sp_acum: 425,
    velocity: 23.6,
    tests: 677,
    coverage: "86%",
    defects: 0,
    cves: 0,
    release: "v1.18.0",
  },
};

fs.writeFileSync(
  path.join(TMP, "MANIFEST.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);
console.log("   ✅ MANIFEST.json");

// ── ZIP final ────────────────────────────────────────────────────────────────
console.log(`\n🗜️  Creando sofia-deploy-v${VERSION}.zip...`);
if (fs.existsSync(BUNDLE)) fs.unlinkSync(BUNDLE);
execSync(
  `cd "${OUT_DIR}" && zip -r "sofia-deploy-v${VERSION}.zip" "sofia-v${VERSION}/" -x "*.DS_Store"`,
  { stdio: "pipe" }
);

const zipSize = (fs.statSync(BUNDLE).size / 1024).toFixed(1);

console.log(`
╔══════════════════════════════════════════════════════╗
║          SOFIA v${VERSION} — PAQUETE GENERADO            ║
╠══════════════════════════════════════════════════════╣
║  📦 ${BUNDLE.split("/").pop().padEnd(46)}║
║  📏 ${(zipSize + " KB").padEnd(46)}║
║  🧩 ${(skillOk + " skills empaquetados").padEnd(46)}║
║  📄 ${(copied + " archivos copiados").padEnd(46)}║
║  ⚠️  ${(skipped + " archivos omitidos").padEnd(46)}║
╠══════════════════════════════════════════════════════╣
║  NOVEDADES                                           ║
║  ✦ Dashboard Global en cada Gate (gen-global-dash)  ║
║  ✦ FA-Agent (Análisis Funcional) — gates 2b/3b/8b   ║
║  ✦ 20 agentes · Pipeline 14 steps                   ║
║  ✦ Orchestrator v2.1 · WF-Manager v1.11             ║
║  ✦ CLAUDE.md v2.1 · Regla crítica Dashboard         ║
╚══════════════════════════════════════════════════════╝
`);
