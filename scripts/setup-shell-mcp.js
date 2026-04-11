#!/usr/bin/env node
/**
 * setup-shell-mcp.js
 * Instala el MCP server de shell SOFIA en claude_desktop_config.json
 * y pre-instala las dependencias necesarias.
 *
 * Uso: node scripts/setup-shell-mcp.js
 */

const fs   = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CONFIG_PATH = path.join(
  process.env.HOME,
  "Library/Application Support/Claude/claude_desktop_config.json"
);
const PROJECT_ROOT  = "/Users/cuadram/proyectos/bank-portal";
const SERVER_SCRIPT = `${PROJECT_ROOT}/scripts/mcp-shell-server.js`;
const NODE_BIN      = "/opt/homebrew/opt/node@22/bin/node";

// ── 1. Instalar SDK si no está ────────────────────────────────────────────────
console.log("📦 Verificando @modelcontextprotocol/sdk...");
try {
  require.resolve("@modelcontextprotocol/sdk/server/index.js");
  console.log("   ✅ Ya instalado.");
} catch {
  console.log("   ⬇️  Instalando...");
  execSync(`cd "${PROJECT_ROOT}" && npm install @modelcontextprotocol/sdk`, { stdio: "inherit" });
  console.log("   ✅ Instalado.");
}

// ── 2. Leer config actual ─────────────────────────────────────────────────────
console.log("\n📄 Leyendo claude_desktop_config.json...");
let config = {};
if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    console.log("   ✅ Config leído.");
  } catch (e) {
    console.error("   ❌ Error parseando config:", e.message);
    process.exit(1);
  }
} else {
  console.log("   ⚠️  No existe — creando desde cero.");
}

// ── 3. Añadir entrada sofia-shell ─────────────────────────────────────────────
if (!config.mcpServers) config.mcpServers = {};

if (config.mcpServers["sofia-shell"]) {
  console.log("\n🔄 sofia-shell ya existe en config — actualizando...");
} else {
  console.log("\n➕ Añadiendo sofia-shell al config...");
}

config.mcpServers["sofia-shell"] = {
  command: NODE_BIN,
  args: [SERVER_SCRIPT],
  description: "SOFIA Shell — ejecuta comandos node/python en bank-portal (Experis)"
};

// ── 4. Escribir config ────────────────────────────────────────────────────────
const backupPath = CONFIG_PATH + ".backup-" + Date.now();
if (fs.existsSync(CONFIG_PATH)) {
  fs.copyFileSync(CONFIG_PATH, backupPath);
  console.log(`   💾 Backup guardado en: ${backupPath}`);
}

fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
console.log("   ✅ Config actualizado.");

// ── 5. Mostrar resultado ──────────────────────────────────────────────────────
console.log("\n✅ COMPLETADO. Configuración final de mcpServers:\n");
console.log(JSON.stringify(config.mcpServers, null, 2));
console.log("\n🔁 Reinicia Claude Desktop para que el cambio surta efecto.");
console.log("   killall 'Claude' && open -a Claude\n");
