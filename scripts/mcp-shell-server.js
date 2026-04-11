#!/usr/bin/env node
/**
 * SOFIA Shell MCP Server v2.1 — Dinamico multi-proyecto
 *
 * v2.1 fixes:
 *   - path.realpath (async) → fs.realpathSync (sync)
 *   - require SDK via dist/cjs/ (paquete ESM con exports map)
 *   - rutas absolutas desde CORE_DIR/node_modules
 *
 * LA-CORE-009: sofia-shell dinamico — nunca hardcodear PROJECT_ROOT.
 * LA-CORE-014: SDK en SOFIA-CORE/node_modules — proyectos cliente independientes.
 */

const path = require("path");
const fs   = require("fs");
const os   = require("os");

// SOFIA-CORE = un nivel arriba de este script (scripts/)
const CORE_DIR = path.resolve(__dirname, "..");
const SDK_CJS  = path.join(CORE_DIR, "node_modules/@modelcontextprotocol/sdk/dist/cjs");

// Require via rutas absolutas dist/cjs/ (evita problemas de resolución ESM/CJS)
const { Server }               = require(path.join(SDK_CJS, "server/index.js"));
const { StdioServerTransport } = require(path.join(SDK_CJS, "server/stdio.js"));
const { CallToolRequestSchema, ListToolsRequestSchema } =
  require(path.join(SDK_CJS, "types.js"));

const { execSync } = require("child_process");

// ── Constantes ────────────────────────────────────────────────────────────────
const REGISTRY_PATH    = path.join(os.homedir(), ".sofia", "projects.json");
const ALLOWED_COMMANDS = [
  "node", "npm", "npx", "python3", "python",
  "ls", "cat", "mkdir", "cp", "mv", "rm", "find", "grep", "echo",
];
const TIMEOUT_MS = 60_000;
const NODE_BIN   = "/opt/homebrew/opt/node@22/bin";

// ── Helpers ───────────────────────────────────────────────────────────────────

function readRegistry() {
  try {
    if (fs.existsSync(REGISTRY_PATH))
      return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  } catch (_) {}
  return { projects: {}, active: null };
}

function resolveDefaultRoot() {
  // 1. Env var explícita (claude_desktop_config env.SOFIA_REPO)
  if (process.env.SOFIA_REPO && fs.existsSync(process.env.SOFIA_REPO))
    return fs.realpathSync(process.env.SOFIA_REPO);
  // 2. Proyecto "active" en ~/.sofia/projects.json
  const reg = readRegistry();
  if (reg.active && reg.projects[reg.active]) {
    const p = reg.projects[reg.active];
    if (fs.existsSync(p)) return fs.realpathSync(p);
  }
  // 3. Fallback seguro
  return os.homedir();
}

function resolveAndValidateCwd(cwdArg, defaultRoot) {
  const reg = readRegistry();
  const allowedRoots = new Set([defaultRoot]);
  if (process.env.SOFIA_REPO) allowedRoots.add(path.resolve(process.env.SOFIA_REPO));
  for (const p of Object.values(reg.projects || {})) {
    try { allowedRoots.add(fs.realpathSync(p)); } catch (_) {}
  }

  const resolved = path.isAbsolute(cwdArg)
    ? path.normalize(cwdArg)
    : path.resolve(defaultRoot, cwdArg);

  let ownerRoot = null;
  for (const root of allowedRoots) {
    if (resolved === root || resolved.startsWith(root + path.sep)) {
      ownerRoot = root; break;
    }
  }

  if (!ownerRoot)
    return { error: `AISLAMIENTO: '${resolved}' fuera de proyectos registrados: ${[...allowedRoots].join(", ")}` };
  if (!fs.existsSync(resolved))
    return { error: `Directorio no existe: ${resolved}` };

  return { resolved, ownerRoot };
}

// ── Servidor MCP ──────────────────────────────────────────────────────────────
const server = new Server(
  { name: "sofia-shell", version: "2.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const reg         = readRegistry();
  const defaultRoot = resolveDefaultRoot();
  const projectName = path.basename(defaultRoot);
  const registered  = Object.entries(reg.projects || {})
    .map(([k, v]) => `${k}: ${v}`).join(" | ") || "ninguno";

  return {
    tools: [{
      name: "run_command",
      description: [
        `Ejecuta comandos de shell en el proyecto SOFIA activo.`,
        `Proyecto activo: ${projectName} (${defaultRoot})`,
        `Proyectos registrados: ${registered}`,
        ``,
        `cwd: ruta absoluta del SOFIA_REPO o relativa al proyecto activo.`,
        `Comandos permitidos: ${ALLOWED_COMMANDS.join(", ")}`,
      ].join("\n"),
      inputSchema: {
        type: "object",
        properties: {
          command: { type: "string", description: "Comando a ejecutar." },
          cwd:     { type: "string", description: "Directorio de trabajo (ruta absoluta preferida)." },
        },
        required: ["command"],
      },
    }],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "run_command")
    throw new Error(`Tool desconocido: ${request.params.name}`);

  const { command, cwd: cwdArg } = request.params.arguments;
  const bin = command.trim().split(/\s+/)[0];

  if (!ALLOWED_COMMANDS.includes(bin))
    return { content: [{ type: "text", text: `ERROR: '${bin}' no permitido. Usa: ${ALLOWED_COMMANDS.join(", ")}` }], isError: true };

  const defaultRoot = resolveDefaultRoot();
  let workdir;

  if (cwdArg) {
    const result = resolveAndValidateCwd(cwdArg, defaultRoot);
    if (result.error)
      return { content: [{ type: "text", text: `ERROR: ${result.error}` }], isError: true };
    workdir = result.resolved;
  } else {
    workdir = defaultRoot;
  }

  process.stderr.write(`[sofia-shell v2.1] cwd=${workdir} | ${command.slice(0, 80)}\n`);

  try {
    const output = execSync(command, {
      cwd: workdir,
      env: {
        ...process.env,
        PATH: `${NODE_BIN}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ""}`,
        SOFIA_REPO: workdir,
      },
      timeout: TIMEOUT_MS,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    return { content: [{ type: "text", text: (output || "(sin salida)") + `\n\n[cwd: ${workdir}]` }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `ERROR en ${workdir}:\n${err.message}\nstdout: ${err.stdout || ""}\nstderr: ${err.stderr || ""}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`[sofia-shell v2.1] OK | root: ${resolveDefaultRoot()} | registry: ${REGISTRY_PATH}\n`);
}

main().catch(console.error);
