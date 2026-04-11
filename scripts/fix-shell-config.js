#!/usr/bin/env node
/**
 * fix-shell-config.js — Corrige claude_desktop_config.json para sofia-shell
 *
 * Problemas que corrige:
 *   1. Script apuntaba a SOFIA-CORE donde no hay node_modules con MCP SDK
 *   2. command era "node" bare en vez de ruta completa de Homebrew
 *   3. Faltaba env SOFIA_REPO
 *
 * Solución: apuntar a bank-portal/scripts/mcp-shell-server.js donde SÍ hay
 *           node_modules/@modelcontextprotocol/sdk instalado.
 */
const fs   = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(
  process.env.HOME,
  "Library/Application Support/Claude/claude_desktop_config.json"
);
const NODE_BIN    = "/opt/homebrew/opt/node@22/bin/node";
const SERVER_BP   = "/Users/cuadram/proyectos/bank-portal/scripts/mcp-shell-server.js";
const SOFIA_REPO  = "/Users/cuadram/proyectos/bank-portal";

// Backup
const backup = CONFIG_PATH + ".bak-" + Date.now();
fs.copyFileSync(CONFIG_PATH, backup);
console.log("Backup:", backup);

// Leer
const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

// Aplicar corrección
cfg.mcpServers["sofia-shell"] = {
  command: NODE_BIN,
  args: [SERVER_BP],
  env: {
    SOFIA_REPO: SOFIA_REPO
  }
};

// Escribir
fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8");

// Verificar
const verify = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
const s = verify.mcpServers["sofia-shell"];
console.log("\nconfiguración guardada:");
console.log("  command:", s.command);
console.log("  args:   ", s.args);
console.log("  env:    ", s.env);
console.log("  script existe:", fs.existsSync(s.args[0]));

// Verificar que el script tiene v2.0
const content = fs.readFileSync(s.args[0], "utf8");
const v2 = content.includes("resolveDefaultRoot");
console.log("  version:", v2 ? "v2.0 DINAMICO ✓" : "v1.0 HARDCODEADO ✗");

// Verificar MCP SDK
const sdkPath = path.join(path.dirname(path.dirname(s.args[0])), "node_modules/@modelcontextprotocol/sdk");
console.log("  MCP SDK:", fs.existsSync(sdkPath) ? "INSTALADO ✓" : "NO ENCONTRADO ✗");

console.log("\n✓ Listo. Reinicia Claude Desktop: Cmd+Q → abrir Claude");
