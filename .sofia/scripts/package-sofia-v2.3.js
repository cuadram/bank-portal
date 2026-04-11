#!/usr/bin/env node
/**
 * SOFIA v2.3 — Packaging Script
 * Genera dist/sofia-deploy-v2.3.zip con todas las capacidades del sistema.
 *
 * Uso:
 *   node .sofia/scripts/package-sofia-v2.3.js
 *
 * Novedades v2.3 vs v2.2:
 *   - UX/UI Designer Agent v2.0 — nuevo agente Step 2c (HITL PO+TL)
 *   - BankPortal Design System v1.0 (docs/ux-ui/UX-DESIGN-SYSTEM.md)
 *   - PROTO-TEMPLATE.html — prototipo visual HTML interactivo
 *   - Pipeline ampliado a 15 steps y 21 agentes
 *   - Sprint 20 FEAT-018 completado — 473 SP acumulados, 88% cov, v1.20.0
 *   - 14 lecciones aprendidas LA-019-03..16 incorporadas a 8 skills
 */

const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const ROOT    = "/Users/cuadram/proyectos/bank-portal";
const OUT_DIR = path.join(ROOT, "dist");
const VERSION = "2.3";
const TMP     = path.join(OUT_DIR, `sofia-v${VERSION}`);
const BUNDLE  = path.join(OUT_DIR, `sofia-deploy-v${VERSION}.zip`);
const DATE    = new Date().toISOString().slice(0, 10);

// ── Skills a incluir (21) ─────────────────────────────────────────────────────
const SKILL_DIRS = [
  "orchestrator",
  "scrum-master",
  "requirements-analyst",
  "fa-agent",
  "ux-ui-designer",        // ← NUEVO v2.3
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

// ── Archivos a copiar ─────────────────────────────────────────────────────────
const INCLUDES = [
  // Config base
  ".sofia/sofia-config.json",
  ".sofia/sofia-context.md",
  ".sofia/PERSISTENCE_PROTOCOL.md",
  ".sofia/LESSONS_LEARNED.md",
  ".sofia/doc-agent-hook.sh",
  ".sofia/run-python.sh",
  // Skills SKILL.md
  ...SKILL_DIRS.map(s => `.sofia/skills/${s}/SKILL.md`),
  // Scripts core
  ".sofia/scripts/gen-global-dashboard.js",
  ".sofia/scripts/gen-fa-document.py",
  ".sofia/scripts/gen-fa-document.js",
  ".sofia/scripts/gen-dashboard.js",
  ".sofia/scripts/audit-persistence.sh",
  ".sofia/scripts/gate-check.py",
  ".sofia/scripts/sofia-wizard.py",
  ".sofia/scripts/setup-sofia-mac.sh",
  ".sofia/scripts/atlassian-sync.py",
  ".sofia/scripts/package-sofia-v2.3.js",
  // UX/UI — NUEVO v2.3
  "docs/ux-ui/UX-DESIGN-SYSTEM.md",
  "docs/ux-ui/prototypes/PROTO-TEMPLATE.html",
  // Raíz
  "CLAUDE.md",
];

// ── CHANGELOG ─────────────────────────────────────────────────────────────────
const CHANGELOG = `SOFIA v2.3 — Release Notes
===========================
Fecha: ${DATE}

NOVEDADES v2.3 — UX/UI Designer Agent + Sprint 19 completado
─────────────────────────────────────────────────────────────

[UX-UI-DESIGNER] Nuevo agente: UX/UI Designer Agent v2.0
  POSICIÓN: Step 2c — entre FA-Agent (2b) y Architect (3)
  GATE: HITL — aprobación explícita Product Owner + Tech Lead
  
  CAPACIDADES:
  • Análisis de actores y contexto de uso
  • User Flow Diagrams (Mermaid) — todos los estados del flujo
  • Arquitectura de Información + rutas Angular propuestas
  • Wireframes ASCII low-fidelity por pantalla (vacío/cargando/error/datos)
  • Inventario de Componentes Angular Material
  • Especificaciones de formularios con validaciones y mensajes error específicos
  • Design Tokens SCSS basados en Design System Banco Meridian
  • Checklist WCAG 2.1 AA obligatorio por pantalla
  • Tabla de Microinteracciones (acción → feedback visual)
  • Responsive Design por breakpoint
  • [v2.0] Prototipo Visual HTML Interactivo navegable en browser

  PROTOTIPO VISUAL (Fase 10 — capacidad diferencial v2.0):
  • Archivo HTML standalone autocontenido (sin dependencias externas)
  • Todas las pantallas en un único fichero con navegación funcional
  • Estados: datos / vacío / skeleton cargando / error servidor
  • Toggle viewport Desktop / Tablet / Mobile
  • Design Tokens aplicados exactamente (colores, tipografía, espaciado)
  • Anotaciones de diseño con tooltips en elementos clave
  • Datos realistas del dominio bancario (IBANs, importes, fechas)
  • Patrón: PROTO-FEAT-XXX-sprintYY.html en docs/ux-ui/prototypes/

[DESIGN-SYSTEM-V1] BankPortal Design System v1.0
  • docs/ux-ui/UX-DESIGN-SYSTEM.md — referencia canónica
  • Paleta de colores Banco Meridian con tokens semánticos completos
  • Escala tipográfica Inter/Roboto (13 niveles)
  • Sistema de espaciado base 4px
  • Sombras (5 niveles), border radius, transiciones (duraciones + easings)
  • Biblioteca de 10+ componentes Angular Material establecidos
  • 8 patrones UX documentados (Master-Detail, Stepper, Skeleton, etc.)
  • 10 Reglas de Oro UX para Banco Meridian (regulación bancaria + WCAG)
  • Responsive breakpoints xs/sm/md/lg/xl compatibles Angular Material

[PIPELINE-V2.3] Pipeline ampliado a 15 steps · 21 agentes
  • Step 2c añadido (UX/UI Designer) entre 2b y 3
  • Total: 15 steps · 21 agentes (era 14 steps · 20 agentes en v2.2)

[SPRINT-19] FEAT-017 Domiciliaciones y Recibos SEPA DD — COMPLETADO
  • v1.19.0 en producción
  • 708 tests · 87% cobertura · 0 defectos
  • 449 SP acumulados (fue 425 en v2.2)
  • 14 lecciones aprendidas (LA-019-03..19-16) incorporadas a 8 skills:
    qa-tester, java-developer, angular-developer, code-reviewer,
    devops, architect, developer-core, orchestrator

[SKILLS-UPDATED-S19] 8 skills mejorados con lecciones Sprint 19
  • qa-tester: LA-019-07 (smoke test por feature), LA-019-08 (Mock vs BD real),
               LA-019-16 (declarar repositorio activo en informe QA)
  • java-developer: LA-019-04 (@SpringBootTest smoke), LA-019-06 (DEBT-022 grep),
                    LA-019-08 (@Profile(mock)), LA-019-13 (tipos BD↔Java),
                    LA-019-15 (SQL params posicionales)
  • angular-developer: LA-019-05 (--configuration=production), LA-019-09 (env sync),
                       LA-019-10 (router registro), LA-019-11 (ActivatedRoute.paramMap),
                       LA-019-12 (UUID validation), LA-019-14 (OnPush markForCheck)
  • code-reviewer: LA-019-06, 08, 09, 10, 11, 13, 15
  • devops: LA-019-05, 07
  • architect: LA-019-08, 13
  • developer-core: LA-019-04, 07, 08
  • orchestrator: LA-019-04, 07, 08, 13

CAPACIDADES CONSOLIDADAS v2.3
──────────────────────────────
• 21 skills activos (20 v2.2 + ux-ui-designer)
• Pipeline 15 steps: 1,2,2b,2c,3,3b,4,5,5b,6,7,8,8b,9
• UX/UI Designer: User Flows + Wireframes + Prototipo Visual HTML
• Design System BankPortal v1.0
• Dashboard Global regenerado en cada Gate
• FA-Agent: 58 funcionalidades + 113 reglas de negocio (S1–S19)
• Documentation Agent: 10 Word + 3 Excel por sprint
• CMMI Level 3 activo: 9 PAs
• Atlassian MCP: Jira + Confluence en cada gate

MÉTRICAS BankPortal (referencia — Sprint 19 cerrado)
─────────────────────────────────────────────────────
• Sprints completados: 19  |  SP acumulados: 449
• Velocidad media: 23.6 SP/sprint  |  Tests: 708  |  Cobertura: 87%
• Defectos producción: 0  |  CVEs críticos: 0  |  Release: v1.19.0
• FA: 58 funcionalidades · 113 reglas de negocio · S1–S19
`;

// ── README ─────────────────────────────────────────────────────────────────────
const README = `# SOFIA v${VERSION} — Deployment Package

> UX/UI Designer Agent · Design System v1.0 · Prototipo Visual HTML · 21 agentes · CMMI L3

## Qué hay de nuevo en v${VERSION}

### UX/UI Designer Agent v2.0 — Step 2c
Nuevo agente especializado en diseño de experiencia de usuario para aplicaciones bancarias.
Se integra entre FA-Agent (2b) y Architect (3). Gate: **HITL PO + Tech Lead**.

**Entregables por sprint:**
1. Documento de diseño UX completo (\`docs/ux-ui/UX-FEAT-XXX-sprintYY.md\`)
2. Prototipo visual HTML interactivo (\`docs/ux-ui/prototypes/PROTO-FEAT-XXX-sprintYY.html\`)

**Prototipo visual (capacidad diferencial):**
- HTML standalone navegable en browser (doble clic)
- 9+ pantallas: lista / detalle / alta paso 1-2 / confirmación / éxito / vacío / cargando / error
- Toggle viewport Desktop / Tablet / Mobile
- Design Tokens exactos Banco Meridian aplicados
- Anotaciones de diseño con tooltips

### BankPortal Design System v1.0
Referencia canónica en \`docs/ux-ui/UX-DESIGN-SYSTEM.md\`:
- Paleta de colores con tokens semánticos
- Tipografía escala completa Inter/Roboto
- Espaciado base 4px, sombras, border radius, transiciones
- Biblioteca Angular Material documentada
- 10 Reglas de Oro UX para Banco Meridian

### Pipeline v2.3 — 15 steps · 21 agentes
\`\`\`
1 → 2 → 2b(FA) → 2c(UX/UI) → 3 → 3b(Doc) → 4 → 5 → 5b(Sec) → 6 → 7 → 8 → 8b(FA) → 9
\`\`\`

## Instalación rápida (macOS)

\`\`\`bash
unzip sofia-deploy-v${VERSION}.zip -d sofia-v${VERSION}
bash sofia-v${VERSION}/scripts/setup-sofia-mac.sh /ruta/a/tu-proyecto
killall 'Claude' && open -a Claude
\`\`\`

## Skills incluidos (${SKILL_DIRS.length})

${SKILL_DIRS.map((s,i) => `${i+1}. ${s}${s==='ux-ui-designer'?' ← NUEVO v2.3':''}`).join("\n")}

## Estructura del paquete

\`\`\`
sofia-deploy-v2.3.zip
├── CLAUDE.md               ← Archivo de inicio SOFIA (15 steps, 21 agentes)
├── README.md
├── CHANGELOG.md
├── MANIFEST.json
├── config/
│   ├── sofia-config.json
│   ├── sofia-context.md
│   ├── PERSISTENCE_PROTOCOL.md
│   └── LESSONS_LEARNED.md
├── skills/
│   ├── ux-ui-designer/     ← NUEVO v2.3
│   │   └── SKILL.md        (24 KB — 10 fases incluyendo prototipo visual)
│   ├── orchestrator/ ... (20 skills previos)
│   └── *.skill             (ZIPs individuales por skill)
├── scripts/
│   ├── gen-global-dashboard.js
│   ├── gen-fa-document.py/js
│   ├── package-sofia-v2.3.js
│   └── ...
└── ux-ui/
    ├── UX-DESIGN-SYSTEM.md         ← Design System BankPortal v1.0
    └── prototypes/
        └── PROTO-TEMPLATE.html     ← Template base prototipos HTML (57 KB)
\`\`\`

## Primer uso del UX/UI Designer Agent

En Claude Desktop, en el step 2c del pipeline:
\`\`\`
Activa UX/UI Designer Agent.
Inputs:
  - docs/requirements/SRS-FEAT-XXX-sprintYY.md
  - docs/functional-analysis/FA-FEAT-XXX-sprintYY.md
  - docs/ux-ui/UX-DESIGN-SYSTEM.md
Outputs:
  - docs/ux-ui/UX-FEAT-XXX-sprintYY.md
  - docs/ux-ui/prototypes/PROTO-FEAT-XXX-sprintYY.html
Gate: HITL — aprobación PO + Tech Lead requerida
\`\`\`

---
SOFIA v${VERSION} · Experis ManpowerGroup · CMMI Level 3 · ${DATE}
*Forge faster. Deliver stronger.*
`;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
console.log(`\n╔════════════════════════════════════════╗`);
console.log(`║   📦 SOFIA v${VERSION} — Packaging...        ║`);
console.log(`╚════════════════════════════════════════╝\n`);

// Limpiar y crear estructura de directorios
if (fs.existsSync(TMP)) execSync(`rm -rf "${TMP}"`);
fs.mkdirSync(path.join(TMP, "skills"),            { recursive: true });
fs.mkdirSync(path.join(TMP, "scripts"),           { recursive: true });
fs.mkdirSync(path.join(TMP, "config"),            { recursive: true });
fs.mkdirSync(path.join(TMP, "ux-ui/prototypes"),  { recursive: true });

let copied = 0, skipped = 0;

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
    dest = path.join(TMP, "skills", parts[0], parts[1] || path.basename(rel));
  } else if (rel.startsWith(".sofia/scripts/")) {
    dest = path.join(TMP, "scripts", path.basename(rel));
  } else if (rel.startsWith(".sofia/")) {
    dest = path.join(TMP, "config", path.basename(rel));
  } else if (rel.startsWith("docs/ux-ui/prototypes/")) {
    dest = path.join(TMP, "ux-ui/prototypes", path.basename(rel));
  } else if (rel.startsWith("docs/ux-ui/")) {
    dest = path.join(TMP, "ux-ui", path.basename(rel));
  } else {
    dest = path.join(TMP, path.basename(rel));
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  const size = fs.statSync(dest).size;
  const label = rel.includes("ux-ui") || rel.includes("ux_ui") ? " ← NEW v2.3" : "";
  console.log(`   ✅ ${rel.padEnd(55)} (${(size/1024).toFixed(1)} KB)${label}`);
  copied++;
}

// ── Empaquetar cada skill como .skill (ZIP) ────────────────────────────────
console.log("\n\n📁 Generando archivos .skill...\n");
let skillOk = 0, skillSkip = 0;

for (const skillName of SKILL_DIRS) {
  const skillDir  = path.join(ROOT, ".sofia/skills", skillName);
  const skillFile = path.join(TMP, "skills", `${skillName}.skill`);
  const isNew     = skillName === "ux-ui-designer" ? " ← NEW v2.3" : "";

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
    console.log(`   ✅ ${skillName.padEnd(24)}.skill  (${(size/1024).toFixed(1)} KB)${isNew}`);
    skillOk++;
  } catch (e) {
    console.log(`   ❌ Error empaquetando ${skillName}: ${e.message}`);
    skillSkip++;
  }
}

// ── Escribir CHANGELOG, README, MANIFEST ──────────────────────────────────
fs.writeFileSync(path.join(TMP, "CHANGELOG.md"), CHANGELOG.trim(), "utf8");
console.log("\n   ✅ CHANGELOG.md");

fs.writeFileSync(path.join(TMP, "README.md"), README.trim(), "utf8");
console.log("   ✅ README.md");

// Calcular tamaños de skills para el manifiesto
const skillSizes = {};
for (const s of SKILL_DIRS) {
  const f = path.join(TMP, "skills", `${s}.skill`);
  if (fs.existsSync(f)) skillSizes[s] = fs.statSync(f).size;
}

const manifest = {
  sofia_version: VERSION,
  packaged_at: new Date().toISOString(),
  packaged_by: "SOFIA Package Script v2.3",
  project_reference: "bank-portal — Banco Meridian",

  pipeline: {
    steps: ["1","2","2b","2c","3","3b","4","5","5b","6","7","8","8b","9"],
    step_count: 15,
    agents: SKILL_DIRS,
    agent_count: SKILL_DIRS.length,
    new_in_v2_3: "Step 2c — UX/UI Designer (HITL PO+TL)",
  },

  ux_ui_designer: {
    version: "2.0",
    pipeline_step: "2c",
    gate: "HITL-PO-TL",
    skill: "skills/ux-ui-designer/SKILL.md",
    skill_size_kb: skillSizes["ux-ui-designer"] ? (skillSizes["ux-ui-designer"]/1024).toFixed(1) : "?",
    design_system: "ux-ui/UX-DESIGN-SYSTEM.md",
    prototype_template: "ux-ui/prototypes/PROTO-TEMPLATE.html",
    prototype_output_pattern: "docs/ux-ui/prototypes/PROTO-FEAT-XXX-sprintYY.html",
    deliverables: [
      "UX-FEAT-XXX-sprintYY.md — documento completo de diseño",
      "PROTO-FEAT-XXX-sprintYY.html — prototipo visual navegable",
    ],
    phases: [
      "1. Análisis actores y contexto",
      "2. User Flow Diagrams (Mermaid)",
      "3. Arquitectura de Información",
      "4. Wireframes ASCII low-fidelity",
      "5. Inventario Componentes Angular",
      "6. Design Tokens SCSS",
      "7. Accesibilidad WCAG 2.1 AA",
      "8. Microinteracciones",
      "9. Responsive Design",
      "10. Prototipo Visual HTML Interactivo",
    ],
  },

  design_system: {
    version: "1.0",
    path: "ux-ui/UX-DESIGN-SYSTEM.md",
    client: "Banco Meridian",
    tokens: ["colores", "tipografía", "espaciado", "sombras", "border-radius", "transiciones"],
    components: 10,
    patterns: 8,
    golden_rules: 10,
    wcag: "2.1 AA",
  },

  fa_agent: {
    skill: "skills/fa-agent/SKILL.md",
    gates: ["2b","3b","8b"],
    functionalities: 63,
    business_rules: 130,
    sprints_covered: "S1-S20",
  },

  dashboard_global: {
    script: "scripts/gen-global-dashboard.js",
    canonical_source: "docs/functional-analysis/fa-index.json",
    output: "docs/dashboard/bankportal-global-dashboard.html",
    trigger: "Cada aprobación de Gate G-1 a G-9 — obligatorio",
  },

  skills_packaged: skillOk,
  skills_skipped: skillSkip,
  skill_sizes_kb: Object.fromEntries(
    Object.entries(skillSizes).map(([k,v]) => [k, (v/1024).toFixed(1)])
  ),

  sprint_20_metrics: {
    feature: "FEAT-018",
    description: "Exportación Movimientos PDF/CSV — PSD2 Art.47 + GDPR Art.15",
    status: "COMPLETADO",
    sp: 24,
    sp_acumulados: 473,
    release: "v1.20.0",
    tests_new_sprint: 124,
    coverage: "88%",
    defects: 0,
    cves_critical: 0,
    lessons_learned: 8,
    skills_updated: 8,
  },

  lessons_applied_v2_3: {
    registry: "config/LESSONS_LEARNED.md",
    sprint_20_lessons: [
      "LA-019-03: Gates HITL parada individual obligatoria",
      "LA-019-04: @SpringBootTest smoke test obligatorio en G-4",
      "LA-019-05: ng build --configuration=production en CI y Dockerfile",
      "LA-019-06: grep DEBT-022 script obligatorio en G-5",
      "LA-019-07: smoke-test actualizado como artefacto de G-4",
      "LA-019-08: @Profile(mock) para mocks, @Primary en adaptador real",
      "LA-019-09: environment.prod.ts validación automática en CI",
      "LA-019-10: Checklist registro en app-routing.module.ts",
      "LA-019-11: ActivatedRoute.paramMap en componentes de ruta",
      "LA-019-12: Validar UUIDs con regex antes de seeds",
      "LA-019-13: LLD incluye mapa tipos BD→Java",
      "LA-019-14: OnPush solo con inmutabilidad garantizada",
      "LA-019-15: SQL dinámico con parámetros posicionales (?)",
      "LA-019-16: Informe QA declara repositorio MOCK|JPA-REAL",
    ],
  },

  cmmi_level: 3,
  methodology: "Scrumban",
  mcp_servers: ["filesystem","git","sofia-shell","atlassian"],
  files_copied: copied,
  files_skipped: skipped,
};

fs.writeFileSync(
  path.join(TMP, "MANIFEST.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);
console.log("   ✅ MANIFEST.json\n");

// ── ZIP final ───────────────────────────────────────────────────────────────
console.log(`🗜️  Creando sofia-deploy-v${VERSION}.zip...`);
if (fs.existsSync(BUNDLE)) fs.unlinkSync(BUNDLE);
execSync(
  `cd "${OUT_DIR}" && zip -r "sofia-deploy-v${VERSION}.zip" "sofia-v${VERSION}/" -x "*.DS_Store"`,
  { stdio: "pipe" }
);

const zipSize = fs.statSync(BUNDLE).size;
const zipKB   = (zipSize / 1024).toFixed(1);

// Contar entradas en el ZIP
let totalEntries = 0;
try {
  const list = execSync(`unzip -l "${BUNDLE}"`).toString();
  totalEntries = (list.match(/^\s+\d+\s+/gm) || []).length;
} catch(e) {}

// ── Log en sofia.log ────────────────────────────────────────────────────────
const logLine = `[${new Date().toISOString()}] [PACKAGE] sofia-deploy-v${VERSION}.zip CREATED → ${zipKB} KB · ${skillOk} skills · ${copied} files · ${totalEntries} entries\n`;
try { fs.appendFileSync(path.join(ROOT, ".sofia/sofia.log"), logLine, "utf8"); } catch(e) {}

// ── Actualizar session.json ─────────────────────────────────────────────────
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
  };
  sess.updated_at = new Date().toISOString();
  fs.writeFileSync(path.join(ROOT, ".sofia/session.json"), JSON.stringify(sess, null, 2), "utf8");
} catch(e) { console.log("⚠️  session.json update failed:", e.message); }

// ── Resumen final ───────────────────────────────────────────────────────────
const bar = "═".repeat(56);
console.log(`
╔${bar}╗
║           🚀 SOFIA v${VERSION} — PAQUETE GENERADO                 ║
╠${bar}╣
║  📦 dist/sofia-deploy-v${VERSION}.zip                          ║
║  📏 Tamaño ZIP: ${(zipKB + " KB").padEnd(38)}║
║  🧩 Skills:     ${(skillOk + " agentes empaquetados").padEnd(38)}║
║  📄 Archivos:   ${(copied + " copiados").padEnd(38)}║
║  🗂️  Entradas:  ${(totalEntries + " en el ZIP").padEnd(38)}║
╠${bar}╣
║  NOVEDADES v2.3                                        ║
║  ✦ UX/UI Designer Agent v2.0 — Step 2c HITL PO+TL    ║
║  ✦ Prototipo Visual HTML Interactivo navegable         ║
║  ✦ Design System BankPortal v1.0                      ║
║  ✦ Pipeline 15 steps · 21 agentes                     ║
║  ✦ Sprint 20 FEAT-018: 124 tests · 88% cov · v1.20.0 ║
║  ✦ 14 LAs aplicadas a 8 skills (LA-019-03..16)        ║
╠${bar}╣
║  MÉTRICAS BANKPORTAL (S19 cerrado)                     ║
║  SP: 473 acum  · Cobertura: 88%  · Release: v1.20.0         ║
║  FA: 63 func · 130+ reglas · Defectos prod: 0          ║
╚${bar}╝
`);
