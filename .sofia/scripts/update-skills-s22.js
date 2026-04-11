// update-skills-s22.js — Actualizar skills con LAs Sprint 22
'use strict';
const fs = require('fs');

const S22_SECTION = `

---

## Lecciones aprendidas Sprint 22 — v2.6 (2026-04-02)

### LA-022-07 — Step 3b OBLIGATORIO post Gate G-3

**Detectado:** Sprint 22 — Step 3b no fue ejecutado ni registrado tras aprobar G-3.
Los artefactos existian en disco pero completed_steps no incluia "3b" y sofia.log no tenia entrada.

Verificacion antes de Step 4:
  node -e "const s=JSON.parse(require('fs').readFileSync('.sofia/session.json'));
           const ok=s.completed_steps.includes('3b');
           if(!ok){console.error('BLOQUEANTE: Step 3b no completado');process.exit(1);}
           else console.log('Step 3b OK');"

REGLA PERMANENTE (LA-022-07):
- Step 3b es OBLIGATORIO inmediatamente despues de Gate G-3
- El Orchestrator verifica completed_steps.includes('3b') antes de activar Developer Agent
- GR-012 bloquea G-4 si Step 3b no esta en completed_steps
- Si falta: ejecutar retroactivamente (Confluence HLD + validate-fa-index + log)

---

### LA-022-08 — Documentation Agent genera BINARIOS REALES (.docx y .xlsx)

**Detectado:** Sprint 22 — Doc Agent genero ficheros .md y los reporto como Word/Excel reales.

Verificacion antes de G-8:
  python3 -c "
  import os
  base = 'docs/deliverables/sprint-NN-FEAT-XXX'
  docx = [f for f in os.listdir(base+'/word') if f.endswith('.docx')]
  xlsx = [f for f in os.listdir(base+'/excel') if f.endswith('.xlsx')]
  assert len(docx) == 17, f'FALTA DOCX: {len(docx)}/17'
  assert len(xlsx) == 3,  f'FALTA XLSX: {len(xlsx)}/3'
  print('OK:', len(docx), 'DOCX +', len(xlsx), 'XLSX reales')
  "

REGLA PERMANENTE (LA-022-08):
- Libreria docx (npm) para .docx — NUNCA ficheros .md como entregable
- Libreria ExcelJS para .xlsx
- Generador gen-docs-sprintNN.js persistido como artefacto reproducible
- Verificar extensiones en disco ANTES de reportar entrega

---

### LA-022-06 — Dashboard gate_pending normalizado

**Detectado:** Sprint 22 — gate_pending es string ("G-5") pero el dashboard lo trataba como objeto.
Resultado: GP.step=undefined, GP.waiting_for=undefined en el HTML generado.

REGLA PERMANENTE (LA-022-06):
- gen-global-dashboard.js normaliza gate_pending antes de usar:
    const GP_RAW = session.gate_pending;
    const GP = GP_RAW
      ? (typeof GP_RAW === 'string'
          ? { step: GP_RAW, waiting_for: GATE_ROLES[GP_RAW] || 'Responsable', jira_issue: null }
          : GP_RAW)
      : null;
- Todos los accesos a GP.jira_issue tienen fallback: GP.jira_issue || GP.step
- parseArg() soporta --gate=G-5 y --gate G-5 (con = y con espacio)
`;

// Secciones especificas por skill
const ARCHITECT_EXTRA = `
### Checklist Step 3b — Architect es responsable de completarlo post G-3

Inmediatamente despues de que el Tech Lead apruebe G-3:
1. Verificar que HLD esta publicado en Confluence (page status=current)
2. Ejecutar: node .sofia/scripts/validate-fa-index.js (PASS 8/8 obligatorio)
3. Añadir "3b" a session.completed_steps
4. Registrar en sofia.log: [STEP-3b] [architect] COMPLETED — Confluence OK + validate-fa-index PASS
5. NO pasar el control al Developer hasta completar estos 4 pasos
`;

const JAVA_EXTRA = `
### Verificacion Step 3b antes de escribir codigo (LA-022-07)

PRIMER paso antes de crear cualquier fichero Java:
  node -e "const s=JSON.parse(require('fs').readFileSync('.sofia/session.json'));
           if(!s.completed_steps.includes('3b'))
             {console.error('BLOQUEANTE: Step 3b ausente — notificar al Architect');process.exit(1);}
           console.log('Step 3b verificado OK');"
`;

const CR_EXTRA = `
### Checklist Code Review Sprint 22 — nuevas verificaciones

Añadir al checklist de G-5:
  - Step 3b en completed_steps: node -e "const s=JSON.parse(require('fs').readFileSync('.sofia/session.json')); console.log('3b OK?', s.completed_steps.includes('3b'));"
  - Documentacion: verificar que word/*.docx y excel/*.xlsx son binarios reales (no .md)
  - Dashboard: confirmar que gen-global-dashboard.js tiene GP_RAW normalization
`;

const QA_EXTRA = `
### Checklist QA Sprint 22 — verificaciones adicionales

Antes de G-6:
  - Step 3b completado: session.completed_steps incluye "3b"
  - HLD en Confluence verificado (page existe y status=current)
  - validate-fa-index PASS 8/8 en gate 3b
  - word/ tiene 17 .docx reales (no .md)
  - excel/ tiene 3 .xlsx reales
`;

const skills = [
  { path: '.sofia/skills/java-developer/SKILL.md',    extra: JAVA_EXTRA,      sofia: '2.6' },
  { path: '.sofia/skills/angular-developer/SKILL.md', extra: '',              sofia: '2.6', oldVer: '"2.4"', newVer: '"2.2"' },
  { path: '.sofia/skills/code-reviewer/SKILL.md',     extra: CR_EXTRA,        sofia: '2.6' },
  { path: '.sofia/skills/architect/SKILL.md',         extra: ARCHITECT_EXTRA, sofia: '2.6' },
  { path: '.sofia/skills/qa-tester/SKILL.md',         extra: QA_EXTRA,        sofia: '2.6' },
];

skills.forEach(({ path, extra, sofia, oldVer, newVer }) => {
  let c = fs.readFileSync(path, 'utf8');

  // 1. Cabecera sofia_version
  if (!c.includes('sofia_version:')) {
    c = c.replace('---\nname:', `---\nsofia_version: "${sofia}"\nupdated: "2026-04-02"\nname:`);
  } else {
    c = c.replace(/sofia_version:\s*"[\d.]+"/g, `sofia_version: "${sofia}"`);
  }

  // 2. Version especifica
  if (oldVer && newVer) {
    c = c.replace(`version: ${oldVer}`, `version: ${newVer}`);
  }

  // 3. Updated date si existe
  c = c.replace(/updated: "[\d-]+"/, 'updated: "2026-04-02"');

  // 4. Añadir seccion S22 solo si no existe
  if (!c.includes('LA-022-07')) {
    c = c.trimEnd() + '\n' + S22_SECTION + (extra || '') + '\n';
  }

  fs.writeFileSync(path, c);
  const lines = c.split('\n').length;
  const kb = Math.round(c.length / 1024);
  console.log('OK', path.split('/skill/')[0].split('/').pop() || path.split('/').slice(-2,-1)[0], '|', lines, 'lines |', kb, 'KB');
});

console.log('\nSkills actualizados con LAs Sprint 22 (LA-022-06/07/08) — SOFIA v2.6');
