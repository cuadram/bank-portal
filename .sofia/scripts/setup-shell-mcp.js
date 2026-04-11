#!/usr/bin/env node
/**
 * setup-shell-mcp.js — SOFIA v2.6.14
 * Configura sofia-shell MCP apuntando a SOFIA-CORE.
 * El SDK vive en SOFIA-CORE/node_modules — ningún proyecto depende de otro.
 *
 * Uso (desde Terminal):
 *   node .sofia/scripts/setup-shell-mcp.js
 *
 * Qué hace:
 *   1. Verifica que SOFIA-CORE tiene @modelcontextprotocol/sdk instalado
 *   2. Si no → lo instala en SOFIA-CORE (no en el proyecto actual)
 *   3. Actualiza claude_desktop_config.json apuntando a SOFIA-CORE/scripts/
 *   4. Imprime instrucciones de reinicio
 *
 * LA-CORE-009: sofia-shell dinámico — PROJECT_ROOT resuelto en runtime.
 * LA-CORE-011: SDK en SOFIA-CORE — ningún proyecto cliente aloja dependencias del framework.
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ── Rutas ─────────────────────────────────────────────────────────────────────
// SOFIA-CORE: tres niveles arriba de .sofia/scripts/ (donde vive este script)
const SOFIA_CORE = path.resolve(__dirname, "..", "..", "..", "..", "SOFIA-CORE");

// Fallback: ruta conocida si el script se ejecuta desde un proyecto en OneDrive
const SOFIA_CORE_FALLBACK = path.join(
  process.env.HOME,
  "Library/CloudStorage/OneDrive-Personal/WIP/SOFIA-CORE"
);

const CORE_DIR = fs.existsSync(SOFIA_CORE) ? SOFIA_CORE : SOFIA_CORE_FALLBACK;

if (!fs.existsSync(CORE_DIR)) {
  console.error("ERROR: SOFIA-CORE no encontrado.");
  console.error("  Buscado en:", SOFIA_CORE);
  console.error("  Fallback:  ", SOFIA_CORE_FALLBACK);
  console.error("  Verifica la ruta y vuelve a ejecutar.");
  process.exit(1);
}

const NODE_BIN   = "/opt/homebrew/opt/node@22/bin/node";
const NPM_BIN    = "/opt/homebrew/opt/node@22/bin/npm";
const SERVER     = path.join(CORE_DIR, "scripts", "mcp-shell-server.js");
const SDK_DIR    = path.join(CORE_DIR, "node_modules", "@modelcontextprotocol", "sdk");
const PKG_JSON   = path.join(CORE_DIR, "package.json");
const CONFIG_PATH = path.join(
  process.env.HOME,
  "Library/Application Support/Claude/claude_desktop_config.json"
);

// SOFIA_REPO de este proyecto (para el env por defecto del servidor)
const THIS_PROJECT = path.resolve(__dirname, "..", "..");

console.log("╔══════════════════════════════════════════════════╗");
console.log("║  SOFIA Shell MCP Setup v2.6.14                  ║");
console.log("╚══════════════════════════════════════════════════╝");
console.log();
console.log("SOFIA-CORE:", CORE_DIR);
console.log("Proyecto:  ", THIS_PROJECT);
console.log("Servidor:  ", SERVER);
console.log();

// ── 1. Verificar que el servidor existe en SOFIA-CORE ─────────────────────────
if (!fs.existsSync(SERVER)) {
  console.error("ERROR: mcp-shell-server.js no encontrado en SOFIA-CORE/scripts/");
  console.error("  Ruta esperada:", SERVER);
  process.exit(1);
}
const serverContent = fs.readFileSync(SERVER, "utf8");
const isV2 = serverContent.includes("resolveDefaultRoot");
console.log(`Servidor: ${isV2 ? "v2.0 DINAMICO ✓" : "v1.0 HARDCODEADO — actualizar SOFIA-CORE"}`);

// ── 2. Instalar SDK en SOFIA-CORE si no existe ────────────────────────────────
if (fs.existsSync(SDK_DIR)) {
  console.log("MCP SDK:  instalado en SOFIA-CORE ✓");
} else {
  console.log("MCP SDK:  NO instalado — instalando en SOFIA-CORE...");
  if (!fs.existsSync(PKG_JSON)) {
    fs.writeFileSync(PKG_JSON, JSON.stringify({
      name: "sofia-core", version: "2.6.14", private: true,
      dependencies: { "@modelcontextprotocol/sdk": "^1.27.1" }
    }, null, 2));
    console.log("  package.json creado en SOFIA-CORE");
  }
  try {
    execSync(`${NPM_BIN} install`, { cwd: CORE_DIR, stdio: "inherit" });
    console.log("MCP SDK:  instalado en SOFIA-CORE ✓");
  } catch (e) {
    console.error("ERROR instalando SDK:", e.message);
    console.error("Ejecuta manualmente:");
    console.error(`  cd "${CORE_DIR}" && ${NPM_BIN} install`);
    process.exit(1);
  }
}

// ── 3. Actualizar claude_desktop_config.json ──────────────────────────────────
if (!fs.existsSync(CONFIG_PATH)) {
  console.error("ERROR: claude_desktop_config.json no encontrado.");
  process.exit(1);
}

let cfg = {};
try {
  cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
} catch (e) {
  console.error("ERROR parseando config:", e.message);
  process.exit(1);
}

const backup = CONFIG_PATH + ".bak-" + Date.now();
fs.copyFileSync(CONFIG_PATH, backup);
console.log("\nBackup:", backup);

if (!cfg.mcpServers) cfg.mcpServers = {};
cfg.mcpServers["sofia-shell"] = {
  command: NODE_BIN,
  args: [SERVER],
  env: { SOFIA_REPO: THIS_PROJECT }
};

fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");
const s = cfg.mcpServers["sofia-shell"];
console.log("\nclaude_desktop_config.json actualizado:");
console.log("  command:", s.command);
console.log("  args:   ", s.args[0]);
console.log("  env:    ", JSON.stringify(s.env));

// ── 4. Verificar registro de proyectos ────────────────────────────────────────
const registryPath = path.join(process.env.HOME, ".sofia", "projects.json");
if (fs.existsSync(registryPath)) {
  const reg = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  console.log("\nProyectos en ~/.sofia/projects.json:");
  for (const [k, v] of Object.entries(reg.projects || {})) {
    console.log(`  ${k}: ${v} [${fs.existsSync(v) ? "✓" : "✗"}]`);
  }
  console.log("  active:", reg.active);
}

console.log();
console.log("╔══════════════════════════════════════════════════╗");
console.log("║  ✓ Setup completado                             ║");
console.log("╠══════════════════════════════════════════════════╣");
console.log("║  SDK en:  SOFIA-CORE/node_modules               ║");
console.log("║  Server:  SOFIA-CORE/scripts/mcp-shell-server   ║");
console.log("║  Config:  claude_desktop_config.json ✓          ║");
console.log("╠══════════════════════════════════════════════════╣");
console.log("║  PASO FINAL: Reinicia Claude Desktop            ║");
console.log("║    Cmd+Q → abrir Claude Desktop                 ║");
console.log("╚══════════════════════════════════════════════════╝");
