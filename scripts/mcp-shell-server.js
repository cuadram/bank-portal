#!/usr/bin/env node
/**
 * SOFIA Shell MCP Server
 * Expone un tool "run_command" acotado al directorio del proyecto BankPortal.
 * Uso interno Experis — no exponer en entornos públicos.
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const { execSync } = require("child_process");
const path = require("path");

const PROJECT_ROOT = "/Users/cuadram/proyectos/bank-portal";
const ALLOWED_COMMANDS = ["node", "npm", "npx", "python3", "python", "ls", "cat", "mkdir", "cp", "mv", "rm"];

const server = new Server(
  { name: "sofia-shell", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "run_command",
      description: "Ejecuta un comando de shell en el directorio del proyecto BankPortal. Comandos permitidos: node, npm, npx, python3, python, ls, cat, mkdir, cp, mv, rm.",
      inputSchema: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "Comando a ejecutar (ej: 'node docs/deliverables/sprint-17-FEAT-015/gen_sprint17_planning.js')"
          },
          cwd: {
            type: "string",
            description: "Subdirectorio de trabajo relativo al proyecto (opcional, default: raíz del proyecto)"
          }
        },
        required: ["command"]
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "run_command") {
    throw new Error(`Tool desconocido: ${request.params.name}`);
  }

  const { command, cwd: relCwd } = request.params.arguments;

  // Validar que el comando empiece con un binario permitido
  const bin = command.trim().split(/\s+/)[0];
  if (!ALLOWED_COMMANDS.includes(bin)) {
    return {
      content: [{
        type: "text",
        text: `ERROR: Comando '${bin}' no permitido. Permitidos: ${ALLOWED_COMMANDS.join(", ")}`
      }],
      isError: true
    };
  }

  // Calcular directorio de trabajo — siempre dentro del proyecto
  const workdir = relCwd
    ? path.resolve(PROJECT_ROOT, relCwd)
    : PROJECT_ROOT;

  if (!workdir.startsWith(PROJECT_ROOT)) {
    return {
      content: [{ type: "text", text: "ERROR: Directorio fuera del proyecto no permitido." }],
      isError: true
    };
  }

  try {
    const output = execSync(command, {
      cwd: workdir,
      env: {
        ...process.env,
        PATH: `/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH}`
      },
      timeout: 60000,
      encoding: "utf8"
    });
    return {
      content: [{ type: "text", text: output || "(sin salida)" }]
    };
  } catch (err) {
    return {
      content: [{
        type: "text",
        text: `ERROR:\n${err.message}\n\nstdout: ${err.stdout || ""}\nstderr: ${err.stderr || ""}`
      }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
