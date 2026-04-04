#!/usr/bin/env node
/**
 * SOFIA v1.9 — Packaging Script
 * Genera sofia-deploy-v1.9.zip con todas las capacidades del sistema.
 * Uso: node scripts/package-sofia-v1.9.js
 */

const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT    = "/Users/cuadram/proyectos/bank-portal";
const OUT_DIR = path.join(ROOT, "dist");
const BUNDLE  = path.join(OUT_DIR, "sofia-deploy-v1.9.zip");
const TMP     = path.join(OUT_DIR, "sofia-v1.9");

const VERSION   = "1.9";
const DATE      = new Date().toISOString().slice(0, 10);
const CHANGELOG = `
SOFIA v1.9 — Release Notes
===========================
Fecha: ${DATE}

NUEVAS CAPACIDADES
──────────────────
[SHELL MCP]
• sofia-shell MCP Server (scripts/mcp-shell-server.js)
  - Executa comandos node/npm/npx/python3/cp/mv/ls/rm en el proyecto
  - Acotado al directorio del proyecto (seguridad por diseño)
  - Comandos permitidos: node, npm, npx, python3, python, ls, cat, mkdir, cp, mv, rm
  - Timeout 60s, PATH completo con Homebrew
• setup-shell-mcp.js — instalador automático en claude_desktop_config.json
  - Hace backup del config anterior
  - Instala @modelcontextprotocol/sdk si no está presente
  - Añade entrada sofia-shell al mcpServers block
  - Reinstructs para restart de Claude Desktop

[PIPELINE]
• Generación de documentos .docx/.xlsx ejecutada directamente en disco local
  sin intervención manual (copy-paste/download eliminados del flujo)
• Planning Doc Sprint 17 generado como evidencia PP CMMI L3

[CAPACIDADES CONSOLIDADAS v1.9]
• 15 skills activos: orchestrator, workflow-manager, scrum-master,
  requirements-analyst, architect, developer-core, java-developer,
  angular-developer, nodejs-developer, react-developer, dotnet-developer,
  code-reviewer, qa-tester, devops, documentation-agent, security-agent
• Documentation Agent: 10 Word + 3 Excel por sprint entregados
• CMMI Level 3 activo: 9 PAs con evidencias (PP, PMC, RSKM, VER, VAL, CM, PPQA, REQM, DAR)
• Atlassian MCP: Jira + Confluence sincronizados
• MCP filesystem: lectura/escritura en proyecto
• MCP git: gestión de ramas y commits
• MCP sofia-shell: ejecución de scripts en local ← NUEVO v1.9

MÉTRICAS BankPortal (Sprint 16 cerrado)
─────────────────────────────────────────
• Sprints completados: 16
• SP acumulados: 377
• Velocidad media: 23.6 SP/sprint
• Tests automatizados: 553
• Cobertura: 84%
• Defectos producción: 0
• CVEs críticos: 0
• Release actual: v1.16.0
`;

// ── Archivos a incluir en el paquete ─────────────────────────────────────────
const INCLUDES = [
  ".sofia/sofia-config.json",
  ".sofia/sofia-context.md",
  ".sofia/PERSISTENCE_PROTOCOL.md",
  ".sofia/session.json",
  ".sofia/doc-agent-hook.sh",
  ".sofia/run-python.sh",
  ".sofia/skills/orchestrator/SKILL.md",
  ".sofia/skills/workflow-manager/SKILL.md",
  ".sofia/skills/scrum-master/SKILL.md",
  ".sofia/skills/requirements-analyst/SKILL.md",
  ".sofia/skills/architect/SKILL.md",
  ".sofia/skills/developer-core/SKILL.md",
  ".sofia/skills/java-developer/SKILL.md",
  ".sofia/skills/angular-developer/SKILL.md",
  ".sofia/skills/nodejs-developer/SKILL.md",
  ".sofia/skills/react-developer/SKILL.md",
  ".sofia/skills/dotnet-developer/SKILL.md",
  ".sofia/skills/code-reviewer/SKILL.md",
  ".sofia/skills/qa-tester/SKILL.md",
  ".sofia/skills/devops/SKILL.md",
  ".sofia/skills/documentation-agent/SKILL.md",
  ".sofia/skills/security-agent/SKILL.md",
  "scripts/mcp-shell-server.js",
  "scripts/setup-shell-mcp.js",
  "scripts/package-sofia-v1.9.js",
  "CLAUDE.md",
];

// ── Skill .skill files (ZIP de cada skill folder) ────────────────────────────
const SKILL_DIRS = [
  "orchestrator","workflow-manager","scrum-master","requirements-analyst",
  "architect","developer-core","java-developer","angular-developer",
  "nodejs-developer","react-developer","dotnet-developer","code-reviewer",
  "qa-tester","devops","documentation-agent","security-agent"
];

// ── Preparar directorio temporal ──────────────────────────────────────────────
console.log(`\n📦 Empaquetando SOFIA v${VERSION}...\n`);

if (fs.existsSync(TMP)) execSync(`rm -rf "${TMP}"`);
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(path.join(TMP, "skills"), { recursive: true });
fs.mkdirSync(path.join(TMP, "scripts"), { recursive: true });
fs.mkdirSync(path.join(TMP, "config"), { recursive: true });

// ── Copiar archivos principales ───────────────────────────────────────────────
let copied = 0;
let skipped = 0;

for (const rel of INCLUDES) {
  const src = path.join(ROOT, rel);
  if (!fs.existsSync(src)) {
    console.log(`   ⚠️  No encontrado (skip): ${rel}`);
    skipped++;
    continue;
  }

  // Determinar destino dentro del TMP
  let dest;
  if (rel.startsWith(".sofia/skills/")) {
    const parts = rel.split("/"); // [".sofia","skills","skill-name","SKILL.md"]
    dest = path.join(TMP, "skills", parts[2], parts[3]);
  } else if (rel.startsWith(".sofia/")) {
    dest = path.join(TMP, "config", path.basename(rel));
  } else if (rel.startsWith("scripts/")) {
    dest = path.join(TMP, "scripts", path.basename(rel));
  } else {
    dest = path.join(TMP, path.basename(rel));
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`   ✅ ${rel}`);
  copied++;
}

// ── Empaquetar cada skill como .skill (ZIP) ───────────────────────────────────
console.log("\n📁 Generando archivos .skill...\n");
for (const skillName of SKILL_DIRS) {
  const skillDir  = path.join(ROOT, ".sofia/skills", skillName);
  const skillFile = path.join(TMP, "skills", `${skillName}.skill`);
  if (!fs.existsSync(skillDir)) {
    console.log(`   ⚠️  Skill dir no encontrado: ${skillName}`);
    continue;
  }
  try {
    execSync(`cd "${path.join(ROOT, ".sofia/skills")}" && zip -r "${skillFile}" "${skillName}/" -x "*.DS_Store"`, { stdio: "pipe" });
    const size = fs.statSync(skillFile).size;
    console.log(`   ✅ ${skillName}.skill (${(size/1024).toFixed(1)} KB)`);
  } catch(e) {
    console.log(`   ❌ Error empaquetando ${skillName}: ${e.message}`);
  }
}

// ── CHANGELOG ─────────────────────────────────────────────────────────────────
fs.writeFileSync(path.join(TMP, "CHANGELOG.md"), CHANGELOG.trim(), "utf8");
console.log("\n   ✅ CHANGELOG.md");

// ── MANIFEST ──────────────────────────────────────────────────────────────────
const manifest = {
  sofia_version: VERSION,
  packaged_at: new Date().toISOString(),
  packaged_by: "SOFIA Package Script",
  project: "bank-portal",
  skills: SKILL_DIRS,
  new_in_this_version: [
    "sofia-shell MCP Server (scripts/mcp-shell-server.js)",
    "setup-shell-mcp.js — instalador automático",
    "Generación de documentos .docx en disco local sin intervención manual",
    "Sprint 17 Planning Doc (evidencia PP CMMI L3)",
  ],
  mcp_servers: ["filesystem", "git", "sofia-shell"],
  files_copied: copied,
  files_skipped: skipped,
  skill_count: SKILL_DIRS.length,
};

fs.writeFileSync(
  path.join(TMP, "MANIFEST.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);
console.log("   ✅ MANIFEST.json");

// ── README de instalación ─────────────────────────────────────────────────────
const readme = `# SOFIA v${VERSION} — Deployment Package

## Instalación rápida

\`\`\`bash
# 1. Descomprimir
unzip sofia-deploy-v${VERSION}.zip -d sofia-v${VERSION}

# 2. Copiar skills al proyecto
cp -r sofia-v${VERSION}/skills/* /tu-proyecto/.sofia/skills/

# 3. Copiar scripts
cp sofia-v${VERSION}/scripts/* /tu-proyecto/scripts/

# 4. Copiar config base (ajustar sofia-config.json a tu proyecto)
cp sofia-v${VERSION}/config/sofia-config.json /tu-proyecto/.sofia/

# 5. Instalar MCP shell (NUEVO v1.9)
node /tu-proyecto/scripts/setup-shell-mcp.js

# 6. Reiniciar Claude Desktop
killall 'Claude' && open -a Claude
\`\`\`

## MCP Servers requeridos

| Server | Comando | Propósito |
|--------|---------|-----------|
| filesystem | npx @modelcontextprotocol/server-filesystem | Lectura/escritura en proyecto |
| git | uvx mcp-server-git | Gestión de ramas y commits |
| sofia-shell | node scripts/mcp-shell-server.js | Ejecución de scripts en local (NUEVO) |

## Skills incluidos (${SKILL_DIRS.length})

${SKILL_DIRS.map(s => `- ${s}`).join("\n")}

## Nuevas capacidades v${VERSION}

- **sofia-shell MCP**: ejecuta node/python directamente en el proyecto desde Claude Desktop
- **Documentos en disco**: .docx y .xlsx se generan directamente en local sin descarga manual
- **Setup automático**: \`setup-shell-mcp.js\` configura todo en un comando

---
SOFIA ${VERSION} · Experis · CMMI Level 3 · ${DATE}
`;

fs.writeFileSync(path.join(TMP, "README.md"), readme, "utf8");
console.log("   ✅ README.md");

// ── Crear ZIP final ───────────────────────────────────────────────────────────
console.log(`\n🗜️  Creando sofia-deploy-v${VERSION}.zip...`);
if (fs.existsSync(BUNDLE)) fs.unlinkSync(BUNDLE);
execSync(`cd "${OUT_DIR}" && zip -r "sofia-deploy-v${VERSION}.zip" "sofia-v${VERSION}/" -x "*.DS_Store"`, { stdio: "pipe" });

const zipSize = (fs.statSync(BUNDLE).size / 1024).toFixed(1);
console.log(`\n✅ PAQUETE GENERADO`);
console.log(`   📦 ${BUNDLE}`);
console.log(`   📏 ${zipSize} KB`);
console.log(`   🔢 ${copied} archivos copiados, ${skipped} omitidos`);
console.log(`   🎯 ${SKILL_DIRS.length} skills empaquetados`);
console.log(`\n   SOFIA v${VERSION} lista para despliegue.\n`);
