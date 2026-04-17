// patch-uxui-skill.js — LA-025-03 · Añade PASO 0 herencia obligatoria al SKILL.md UX/UI
const fs = require('fs');
const path = require('path');

const CORE = '/Users/cuadram/Library/CloudStorage/OneDrive-Personal/WIP/SOFIA-CORE';
const PROJECT = '/Users/cuadram/proyectos/bank-portal';

const PASO0_BLOCK = `
### ⛔ PASO 0 — HERENCIA OBLIGATORIA Y BLOQUEANTE (LA-025-03 · LA-CORE-049)

**Este paso es PRERREQUISITO absoluto de la Fase 10. Sin él el Step 2c no puede iniciarse.**

El prototipo de cada sprint PARTE del prototipo del sprint anterior — nunca del scaffold genérico del SKILL.

\`\`\`bash
# 1. Identificar el prototipo del sprint anterior
PREV="docs/ux-ui/prototypes/PROTO-FEAT-0XX-sprintYY.html"

# 2. Copiar como base ANTES de escribir una sola línea nueva
cp "$PREV" "docs/ux-ui/prototypes/PROTO-FEAT-0(XX+1)-sprint(YY+1).html"

# 3. Orchestrator verifica herencia (token CSS del portal real)
grep -q "1e3a5f" "docs/ux-ui/prototypes/PROTO-FEAT-0(XX+1)-sprint(YY+1).html" \\
  && echo "OK herencia verificada" \\
  || echo "BLOQUEADO — archivo base no contiene tokens del portal real"
\`\`\`

**Reglas de herencia:**
- Solo se **AÑADEN**: tokens CSS de la nueva feature, clases de componentes nuevos, pantallas nuevas
- Nunca se **REESCRIBEN** las clases base del shell (sidebar, nav, layout, tipografía)
- El Developer Agent recibe la misma base visual acumulada y validada sprint a sprint
- Sin herencia real, los errores de sprints anteriores (sidebar blanco, rutas fantasma) reaparecen

**Checklist G-2c — bloqueante antes de gate HITL-PO-TL:**
\`\`\`
[ ] cp PROTO anterior → PROTO nuevo ejecutado y verificado en disco
[ ] Nuevo archivo contiene color del portal real (grep 1e3a5f)
[ ] Tokens CSS nuevos AÑADIDOS al :root existente (no reemplazados)
[ ] Pantallas del sprint anterior presentes o eliminadas con justificación explícita
\`\`\`

---

`;

const MARKER = '## FASE 10 — PROTOTIPO VISUAL INTERACTIVO HTML';
const VERSION_ROW = '| 2.0 | 2026-03-28 | Fase 10 añadida:';
const VERSION_ROW_NEW = '| 2.0 | 2026-03-28 | Fase 10 añadida: prototipo visual HTML interactivo, template scaffold completo, script generador |\n| 2.1 | 2026-04-16 | PASO 0 herencia obligatoria y bloqueante añadido (LA-025-03 / LA-CORE-049) |';

function patchSkill(skillPath, label) {
  if (!fs.existsSync(skillPath)) {
    console.log('SKIP (no existe):', label);
    return false;
  }
  let skill = fs.readFileSync(skillPath, 'utf8');
  if (skill.includes('PASO 0 — HERENCIA OBLIGATORIA')) {
    console.log('YA APLICADO:', label);
    return false;
  }
  const markerIdx = skill.indexOf(MARKER);
  if (markerIdx === -1) {
    console.log('MARKER NO ENCONTRADO:', label);
    return false;
  }
  // Insertar PASO 0 después de la línea del marcador (después del salto de línea)
  const insertAt = skill.indexOf('\n', markerIdx) + 1;
  skill = skill.slice(0, insertAt) + PASO0_BLOCK + skill.slice(insertAt);
  // Bump version
  if (skill.includes('v2.0')) {
    skill = skill.replace('# UX/UI Designer Agent — SKILL.md v2.0', '# UX/UI Designer Agent — SKILL.md v2.1');
  }
  if (skill.includes(VERSION_ROW) && !skill.includes('2.1 | 2026-04-16')) {
    skill = skill.replace(
      '| 2.0 | 2026-03-28 | Fase 10 añadida: prototipo visual HTML interactivo, template scaffold completo, script generador |',
      VERSION_ROW_NEW
    );
  }
  fs.writeFileSync(skillPath, skill);
  console.log('OK ' + label + ' — ' + Math.round(skill.length / 1024) + 'KB');
  return true;
}

// 1. BankPortal
patchSkill(path.join(PROJECT, '.sofia/skills/ux-ui-designer/SKILL.md'), 'BankPortal');
// 2. SOFIA-CORE
patchSkill(path.join(CORE, 'skills/ux-ui-designer/SKILL.md'), 'SOFIA-CORE');
