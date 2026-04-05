#!/usr/bin/env node
/**
 * SOFIA Shell MCP Server v2.0 — Dinamico multi-proyecto
 *
 * Resuelve el SOFIA_REPO activo en cada llamada:
 *   1. Si cwd es ruta absoluta → valida contra proyectos registrados
 *   2. Si cwd es relativo → lo resuelve contra SOFIA_REPO activo
 *   3. SOFIA_REPO activo = env SOFIA_REPO || proyecto "active" en ~/.sofia/projects.json
 *
 * Registro de proyectos: ~/.sofia/projects.json (creado por sofia-wizard.py)
 * {
 *   "projects": { "bank_portal": "/ruta/a/bank-portal", "experis": "/ruta/a/et" },
 *   "active": "bank_portal"
 * }
 *
 * Claude lee SOFIA_REPO del CLAUDE.md del proyecto activo y lo pasa como cwd absoluto.
 * El servidor valida que sea un proyecto registrado y ejecuta desde ahi.
 *
 * LA-CORE-009: sofia-shell dinamico — nunca hardcodear PROJECT_ROOT.
 */

const { Server }               = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } =
  require("@modelcontextprotocol/sdk/types.js");
const { execSync } = require("child_process");
const path  = require("path");
const fs    = require("fs");
const os    = require("os");

// ── Constantes ─────────────────────────────────────────────────────────────────
const REGISTRY_PATH   = path.join(os.homedir(), ".sofia", "projects.json");
const ALLOWED_COMMANDS = [
  "node", "npm", "npx", "python3", "python",
  "ls", "cat", "mkdir", "cp", "mv", "rm", "find", "grep", "echo",
];
const TIMEOUT_MS = 60_000;
const NODE_BIN   = "/opt/homebrew/opt/node@22/bin";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Lee el registro de proyectos. Nunca lanza — devuelve {} si no existe. */
function readRegistry() {
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    }
  } catch (_) {}
  return { projects: {}, active: null };
}

/**
 * Resuelve el PROJECT_ROOT para esta llamada.
 *
 * Prioridad:
 *   1. Variable de entorno SOFIA_REPO (pasada por claude_desktop_config.json)
 *   2. Proyecto "active" en ~/.sofia/projects.json
 *   3. Fallback: directorio home del usuario (nunca bloquea el servidor)
 */
function resolveDefaultRoot() {
  // 1. Env var explícita (configurada por proyecto en claude_desktop_config)
  if (process.env.SOFIA_REPO && fs.existsSync(process.env.SOFIA_REPO)) {
    return path.realpath(process.env.SOFIA_REPO);
  }
  // 2. Proyecto activo en el registro
  const reg = readRegistry();
  if (reg.active && reg.projects[reg.active]) {
    const p = reg.projects[reg.active];
    if (fs.existsSync(p)) return path.realpath(p);
  }
  // 3. Fallback seguro
  return os.homedir();
}

/**
 * Dado un cwd (absoluto o relativo) y el root por defecto,
 * devuelve la ruta absoluta validada.
 *
 * Reglas de validacion:
 *   - Ruta absoluta → debe pertenecer a un proyecto registrado o al env SOFIA_REPO
 *   - Ruta relativa → se resuelve contra defaultRoot
 *   - En ambos casos, nunca puede salir del proyecto correspondiente
 */
function resolveAndValidateCwd(cwdArg, defaultRoot) {
  const reg = readRegistry();

  // Conjunto de raíces permitidas: todos los proyectos registrados + SOFIA_REPO env + defaultRoot
  const allowedRoots = new Set([defaultRoot]);
  if (process.env.SOFIA_REPO) allowedRoots.add(path.resolve(process.env.SOFIA_REPO));
  for (const p of Object.values(reg.projects || {})) {
    try { allowedRoots.add(path.realpath(p)); } catch (_) {}
  }

  let resolved;
  if (path.isAbsolute(cwdArg)) {
    resolved = path.normalize(cwdArg);
  } else {
    resolved = path.resolve(defaultRoot, cwdArg);
  }

  // Encontrar la raíz propietaria de esta ruta
  let ownerRoot = null;
  for (const root of allowedRoots) {
    if (resolved.startsWith(root + path.sep) || resolved === root) {
      ownerRoot = root;
      break;
    }
  }

  if (!ownerRoot) {
    return {
      error: (
        `AISLAMIENTO: '${resolved}' no pertenece a ningun proyecto SOFIA registrado.\n` +
        `Proyectos registrados: ${[...allowedRoots].join(", ")}\n` +
        `Registra el proyecto con: python3 ${os.homedir()}/OneDrive/WIP/SOFIA-CORE/scripts/sofia-wizard.py`
      )
    };
  }

  if (!fs.existsSync(resolved)) {
    return { error: `Directorio no existe: ${resolved}` };
  }

  return { resolved, ownerRoot };
}

// ── Servidor MCP ──────────────────────────────────────────────────────────────
const server = new Server(
  { name: "sofia-shell", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  // Leer proyecto activo en cada llamada (refleja cambios en el registro)
  const reg         = readRegistry();
  const defaultRoot = resolveDefaultRoot();
  const projectName = path.basename(defaultRoot);

  // Lista de proyectos para el hint en la descripcion
  const registeredProjects = Object.entries(reg.projects || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(" | ") || "ninguno registrado aun";

  return {
    tools: [{
      name: "run_command",
      description: (
        `Ejecuta comandos de shell en el proyecto SOFIA activo.\n` +
        `Proyecto activo: ${projectName} (${defaultRoot})\n` +
        `Proyectos registrados: ${registeredProjects}\n\n` +
        `RESOLUCION de cwd:\n` +
        `  - Ruta absoluta: se valida contra proyectos registrados\n` +
        `  - Ruta relativa: se resuelve contra el proyecto activo\n` +
        `  - Claude debe pasar SOFIA_REPO como cwd absoluto al trabajar en un proyecto\n\n` +
        `Comandos permitidos: ${ALLOWED_COMMANDS.join(", ")}`
      ),
      inputSchema: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "Comando a ejecutar. Debe empezar por un binario permitido.",
          },
          cwd: {
            type: "string",
            description: (
              "Directorio de trabajo. " +
              "Ruta absoluta (SOFIA_REPO del proyecto) o relativa al proyecto activo. " +
              "Ejemplo: '/Users/cuadram/Library/CloudStorage/.../experis-tracker' " +
              "o '.sofia/scripts'"
            ),
          },
        },
        required: ["command"],
      },
    }],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "run_command") {
    throw new Error(`Tool desconocido: ${request.params.name}`);
  }

  const { command, cwd: cwdArg } = request.params.arguments;

  // 1. Validar binario permitido
  const bin = command.trim().split(/\s+/)[0];
  if (!ALLOWED_COMMANDS.includes(bin)) {
    return {
      content: [{
        type: "text",
        text: `ERROR: '${bin}' no permitido. Permitidos: ${ALLOWED_COMMANDS.join(", ")}`,
      }],
      isError: true,
    };
  }

  // 2. Resolver directorio de trabajo
  const defaultRoot = resolveDefaultRoot();

  let workdir;
  if (cwdArg) {
    const result = resolveAndValidateCwd(cwdArg, defaultRoot);
    if (result.error) {
      return {
        content: [{ type: "text", text: `ERROR: ${result.error}` }],
        isError: true,
      };
    }
    workdir = result.resolved;
  } else {
    workdir = defaultRoot;
  }

  // 3. Log de contexto (stderr, no contamina stdout del MCP)
  process.stderr.write(
    `[sofia-shell] cwd=${workdir} | cmd=${command.slice(0, 80)}\n`
  );

  // 4. Ejecutar
  try {
    const output = execSync(command, {
      cwd: workdir,
      env: {
        ...process.env,
        PATH: `${NODE_BIN}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ""}`,
        SOFIA_REPO: workdir,   // propaga SOFIA_REPO al proceso hijo
      },
      timeout: TIMEOUT_MS,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024, // 10 MB
    });
    return {
      content: [{
        type: "text",
        text: (output || "(sin salida)") + `\n\n[cwd: ${workdir}]`,
      }],
    };
  } catch (err) {
    return {
      content: [{
        type: "text",
        text: (
          `ERROR en ${workdir}:\n${err.message}\n` +
          `stdout: ${err.stdout || ""}\n` +
          `stderr: ${err.stderr || ""}`
        ),
      }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(
    `[sofia-shell v2.0] Iniciado. Registro: ${REGISTRY_PATH}\n` +
    `Default root: ${resolveDefaultRoot()}\n`
  );
}

main().catch(console.error);
