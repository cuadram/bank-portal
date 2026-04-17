// promote-la-core-049.js — Promueve LA-025-03 como LA-CORE-049
const fs = require('fs');
const now = new Date().toISOString();

const CORE = '/Users/cuadram/Library/CloudStorage/OneDrive-Personal/WIP/SOFIA-CORE';
const PROJECT = '/Users/cuadram/proyectos/bank-portal';
const NEW_VERSION = '2.6.44';

// ─── 1. MANIFEST.json ───────────────────────────────────────────────────────
const manifestPath = CORE + '/MANIFEST.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const prevVersion = manifest.sofia_core_version;
manifest.sofia_core_version = NEW_VERSION;
manifest.updated_at = now;
manifest.last_la_promoted = 'LA-CORE-049';
manifest.changelog = manifest.changelog || [];
manifest.changelog.push({
  version: NEW_VERSION,
  date: now.slice(0,10),
  type: 'PATCH',
  la: 'LA-CORE-049',
  summary: 'UX/UI: PASO 0 herencia prototipo obligatoria y bloqueante — nunca scaffold desde cero'
});
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('OK MANIFEST.json ' + prevVersion + ' → ' + NEW_VERSION);

// ─── 2. LESSONS_LEARNED_CORE.md ─────────────────────────────────────────────
const llPath = CORE + '/LESSONS_LEARNED_CORE.md';
let ll = fs.readFileSync(llPath, 'utf8');

const LA_CORE_049_ENTRY = `
## LA-CORE-049 · UX prototype incremental inheritance — PASO 0 obligatorio
**Tipo:** ux/process · **Scope:** SOFIA-CORE · **Versión:** ${NEW_VERSION}
**Origen:** LA-025-03 BankPortal Sprint 25 · **Aprobado por:** Product Owner · **Fecha:** ${now.slice(0,10)}

### Problema
El UX/UI Designer Agent generó el prototipo PROTO-FEAT-023-sprint25 desde el scaffold genérico
del SKILL.md en lugar de copiar PROTO-FEAT-022-sprint24.html como base. La declaración
"CSS/JS heredado" en los artefactos era falsa. Los errores de sidebar (blanco vs navy #1e3a5f)
no habrían ocurrido con herencia real — el prototipo S24 ya los tenía corregidos.
El patrón incremental sprint-a-sprint es la garantía de coherencia visual durante toda la vida del proyecto.

### Regla permanente
**PASO 0 en Step 2c — BLOQUEANTE:**
1. Localizar \`PROTO-FEAT-0XX-sprintYY.html\` (sprint anterior)
2. \`cp PROTO-FEAT-0XX-sprintYY.html PROTO-FEAT-0(XX+1)-sprint(YY+1).html\` ANTES de escribir nada
3. Orchestrator verifica: \`grep -q "1e3a5f" NUEVO.html\` → si falla, step bloqueado
4. Solo AÑADIR tokens CSS nuevos y pantallas nuevas — nunca reescribir clases base del shell
5. Checklist G-2c: 4 checks bloqueantes (cp ejecutado, token portal real, :root incremental, pantallas heredadas)

### Artefactos actualizados
- \`skills/ux-ui-designer/SKILL.md\` → v2.1 (PASO 0 insertado antes de Fase 10)
- BankPortal \`.sofia/skills/ux-ui-designer/SKILL.md\` → v2.1

`;

// Insertar antes de la última línea o al final
if (ll.includes('## LA-CORE-049')) {
  console.log('LA-CORE-049 ya existe en LESSONS_LEARNED_CORE.md');
} else {
  ll = ll.trimEnd() + '\n' + LA_CORE_049_ENTRY;
  fs.writeFileSync(llPath, ll);
  console.log('OK LESSONS_LEARNED_CORE.md — LA-CORE-049 añadida');
}

// ─── 3. session.json BankPortal — registrar sync ────────────────────────────
const sessionPath = PROJECT + '/.sofia/session.json';
const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));

// Buscar LA-025-03 y marcarla como promovida
const la025 = session.lessons_learned.find(l => l.id === 'LA-025-03');
if (la025) {
  la025.promoted_to_core = 'LA-CORE-049';
  la025.promoted_at = now;
  la025.sofia_core_version = NEW_VERSION;
}

// Añadir LA-CORE-049 como importada
const alreadyImported = session.lessons_learned.find(l => l.id === 'LA-CORE-049');
if (!alreadyImported) {
  session.lessons_learned.push({
    id: 'LA-CORE-049',
    type: 'ux/process',
    description: 'PASO 0 herencia prototipo UX obligatoria — cp sprint anterior como base, nunca scaffold; verificacion token portal real bloqueante en G-2c',
    correction: 'Ver LESSONS_LEARNED_CORE.md en SOFIA-CORE para corrección completa.',
    scope: 'SOFIA-CORE',
    source: 'promoted',
    origin: 'LA-025-03 BankPortal Sprint 25',
    sofia_core_version: NEW_VERSION,
    imported_at: now
  });
}

session.updated_at = now;
fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
console.log('OK session.json — LA-025-03 marcada promoted, LA-CORE-049 importada');
console.log('   Total LAs proyecto:', session.lessons_learned.length);

// ─── 4. Sync BankPortal la-sync-state ───────────────────────────────────────
const syncPath = PROJECT + '/.sofia/la-sync-state.json';
let syncState = {};
if (fs.existsSync(syncPath)) {
  syncState = JSON.parse(fs.readFileSync(syncPath, 'utf8'));
}
syncState.last_sync_at = now;
syncState.total_las_promoted = (syncState.total_las_promoted || 0) + 1;
syncState.last_la_promoted = 'LA-CORE-049';
syncState.sofia_core_version = NEW_VERSION;
syncState.project = 'BANK_PORTAL';
fs.writeFileSync(syncPath, JSON.stringify(syncState, null, 2));
console.log('OK la-sync-state.json actualizado');

console.log('\n═══════════════════════════════════════');
console.log('LA-CORE-049 promovida · SOFIA-CORE ' + NEW_VERSION);
console.log('═══════════════════════════════════════');
